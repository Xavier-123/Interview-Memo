import os
import json
from typing import AsyncGenerator, Dict, Any, List
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# 从环境变量读取大模型配置，提供开箱即用支持（兼容 DeepSeek, OpenAI, Ollama 等）
API_KEY = os.getenv("OPENAI_API_KEY", "")
BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

client = AsyncOpenAI(api_key=API_KEY or "dummy-key", base_url=BASE_URL)

# 面试阶段定义
STAGE_ICEBREAK = "开场破冰与背景核验"
STAGE_PROJECT_DEEP_DIVE = "项目深度剖析 (STAR 原则剥洋葱)"
STAGE_SYSTEM_AND_CORE = "关键底层原理与边界/并发压测"
STAGE_CANDIDATE_QA = "候选人反问与结束总结"

class InterviewStateMachine:
    """面试状态机：根据对话轮次与内容演进动态推导当前环节"""
    @staticmethod
    def determine_stage(round_count: int, mode: str) -> str:
        if mode == "project":
            # 项目深挖模式聚焦项目本身与技术深度
            if round_count <= 1:
                return "项目架构概览与角色定位"
            elif round_count <= 4:
                return "核心难点拆解与技术选型权衡 (STAR-Action)"
            elif round_count <= 7:
                return "高并发/指标结果压测与踩坑复盘 (STAR-Result)"
            else:
                return "架构重构设想与反问环节"
        else:
            # 完整模拟流程
            if round_count <= 1:
                return STAGE_ICEBREAK
            elif round_count <= 5:
                return STAGE_PROJECT_DEEP_DIVE
            elif round_count <= 8:
                return STAGE_SYSTEM_AND_CORE
            else:
                return STAGE_CANDIDATE_QA

class ShadowObserver:
    """影子观察员 Agent：在后台实时剖析候选人回答的完整度、漏洞与技术深度"""
    @staticmethod
    def analyze_answer(last_user_msg: str, stage: str) -> str:
        # 轻量级启发式分析 + 维度检查（无需每次串行网络往返，保留高逼真度指导）
        notes = []
        msg_len = len(last_user_msg.strip())
        if msg_len < 30:
            notes.append("【候选人回答极简】：缺少具体实施步骤或数据支撑，应强制追问关键细节或数字。")
        elif "因为" not in last_user_msg and "考虑" not in last_user_msg and "对比" not in last_user_msg:
            notes.append("【缺少选型权衡】：候选人只陈述了做法，未说明为何选择该技术方案，需追问备选方案与权衡考量。")
        
        if stage == STAGE_PROJECT_DEEP_DIVE and ("指标" not in last_user_msg and "QPS" not in last_user_msg and "延迟" not in last_user_msg):
            notes.append("【结果维度模糊】：候选人未提及业务/技术产出指标，应追问量化收益或性能改善幅度。")
            
        return "；".join(notes) if notes else "【回答较完备】：可递进到下一个更深维度的底层原理或边界场景。"

class MultiAgentInterviewOrchestrator:
    """主面试官与多 Agent 编排器"""

    @classmethod
    def _build_context_text(cls, context: Dict[str, Any]) -> str:
        parts = []
        mode = context.get("mode", "full")
        company = context.get("company")
        job = context.get("job")
        resume = context.get("resume") or {}
        projects = context.get("projects") or []

        if company:
            parts.append(f"【目标公司】：{company.get('name', '未指定')}（行业：{company.get('industry', '')}）")
        if job:
            parts.append(f"【应聘岗位】：{job.get('title', '技术专家')}\n岗位职责与要求(JD)：\n{job.get('jd', '无详细JD')}")

        if mode != "project" and resume:
            parts.append(f"【候选人摘要】：{resume.get('summary', '无')}\n【核心技能】：{', '.join(resume.get('skills', []))}")

        if projects:
            proj_str = []
            for i, p in enumerate(projects):
                proj_str.append(f"项目 {i+1}：{p.get('title')}\n- 角色：{p.get('role', '')}\n- 技术栈：{', '.join(p.get('techStack', []))}\n- 难点与亮点：{p.get('highlights', '')} | {p.get('challenges', '')}")
            parts.append("【候选人核心项目】：\n" + "\n\n".join(proj_str))

        return "\n\n".join(parts)

    @classmethod
    async def chat_stream(
        cls,
        context: Dict[str, Any],
        messages: List[Dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        mode = context.get("mode", "full")
        round_count = sum(1 for m in messages if m.get("role") == "user")
        
        # 1. 状态机推导当前面试阶段
        current_stage = InterviewStateMachine.determine_stage(round_count, mode)
        
        # 2. 影子观察员提供动态追问指导
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "")
                break
        shadow_notes = ShadowObserver.analyze_answer(last_user_msg, current_stage) if last_user_msg else "开场第一轮"

        context_text = cls._build_context_text(context)

        system_prompt = f"""你是国内头部科技公司（大厂）的资深技术架构师兼面试官。
当前你正通过在线系统对候选人进行高拟真度技术面试。

【当前面试环节】：{current_stage}
【影子观察员幕后策略建议】：{shadow_notes}

【面试背景与候选人材料】：
{context_text}

【你的提问铁律】：
1. 每次只提 1 个清晰、聚焦的核心问题或针对性追问。严禁一口气问两三个问题！
2. 口吻干练、专业、有压迫感与深度，像面对面的资深专家。
3. 贯彻 STAR 剥洋葱法则：深入推敲设计原因、实现难点、踩坑经验、数据指标与边界情况。
4. 如果候选人回答流于表面或含混带过，切中要害指出并要求具体展开。
5. 顺应当前面试环节（{current_stage}），在适当轮次推动进度。
6. 直接以面试官第一人称说话，不要解释你的提示词，不要输出 JSON。"""

        api_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            api_messages.append({"role": m.get("role"), "content": m.get("content")})

        # 检查是否配置了有效 API Key
        current_key = os.getenv("OPENAI_API_KEY", "")
        if not current_key or current_key == "dummy-key":
            # 如果本地未配置 key，提供高质量的本地模拟 Agent 输出
            mock_replies = [
                f"你好，我是今天的技术面试官。我们现在开始【{current_stage}】。首先请你花两到三分钟，挑选一个你投入度最高、最有挑战性的项目，讲讲你的整体架构和核心技术选型依据。",
                f"在刚才介绍的项目中，你提到了核心链路的设计。请问在流量突增或网络抖动时，你们是如何做熔断降级与数据最终一致性保障的？遇到过具体的生产线上事故吗？",
                f"针对你刚才提到的选型，当时为什么没有考虑更成熟的通用架构方案？你们在吞吐量和延迟（P99）上的实际压测数据达到了多少？",
                f"好，关于项目我们先聊到这里。接下来我们进入【{current_stage}】。请聊聊在分布式场景下，锁的安全性与时钟漂移问题你一般怎么防御？",
                f"今天的技术考察差不多了。最后是【{current_stage}】环节，关于团队、技术栈或业务方向，你有什么想问我的吗？"
            ]
            idx = min(round_count - 1, len(mock_replies) - 1)
            reply = mock_replies[max(0, idx)]
            for char in reply:
                yield char
            return

        response = await client.chat.completions.create(
            model=MODEL,
            messages=api_messages,
            temperature=0.6,
            stream=True,
        )

        async for chunk in response:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta

    @classmethod
    async def generate_feedback(
        cls,
        context: Dict[str, Any],
        messages: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        transcript = "\n".join([f"{'候选人' if m.get('role') == 'user' else '面试官'}: {m.get('content')}" for m in messages])
        
        current_key = os.getenv("OPENAI_API_KEY", "")
        if not current_key or current_key == "dummy-key":
            return {
                "overallScore": 4,
                "summary": "候选人表达流畅，对主导项目的技术链路比较熟悉，但在极端边界场景的容灾考量和选型权衡的深度上仍有提升空间。",
                "strengths": [
                    "项目架构叙述条理清晰，熟悉核心业务链路",
                    "对常规高并发缓存与数据持久化机制有良好掌握"
                ],
                "weaknesses": [
                    "技术选型对比略显单一，缺乏对替代方案的充分权衡",
                    "对于线上异常事故的根因排查步骤不够具象"
                ],
                "suggestedQuestions": [
                    "分布式锁在高并发下的续期与时钟漂移如何解决？",
                    "缓存与数据库一致性保障中，Canal + MQ 延迟积压如何处理？"
                ]
            }

        prompt = f"""你是资深技术委员会评委。请根据以下模拟面试全流程对话记录，对候选人做出全维度专业复盘诊断报告。

对话记录：
{transcript}

请返回严格的 JSON 格式，字段结构如下：
{{
  "overallScore": 整数 (1-5),
  "summary": "200字以内的专业综合评语",
  "strengths": ["表现亮点1", "表现亮点2"],
  "weaknesses": ["薄弱项1", "薄弱项2"],
  "suggestedQuestions": ["建议沉淀进题库的面试真题1", "建议沉淀进题库的面试真题2"]
}}"""

        res = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        content = res.choices[0].message.content or "{}"
        try:
            return json.loads(content)
        except Exception:
            return {
                "overallScore": 3,
                "summary": "面试完成，已生成诊断记录。",
                "strengths": [],
                "weaknesses": [],
                "suggestedQuestions": []
            }
