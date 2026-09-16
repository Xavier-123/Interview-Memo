# Interview Memo - 模拟面试外部多 Agent 适配服务 (Sidecar)

这是专为 [Interview Memo](../../README.md) 打造的**独立可插拔模拟面试引擎**。

它采用**独立微服务（Sidecar）架构**，让你既能完全保留前端主项目的“纯本地优先、免运维、零配置、保护隐私”优势，又能在需要时一键开启高拟真度的多 Agent 深度模拟面试。

---

## ✨ 核心特性

1. **多阶段状态机控制（State Machine Progression）**：
   - 动态推演面试演进：`开场破冰` → `核心项目深度拆解 (STAR 剥洋葱)` → `底层基础与高并发压测` → `候选人反问与复盘`。
   - 杜绝传统单 Prompt 自由发散或在单一问题无限死磕的问题。
2. **影子观察员 Agent（Shadow Observer）**：
   - 在后台实时剖析候选人回答的完整度、是否缺乏数据指标支撑、是否存在技术选型漏洞，向主面试官动态输出追问建议。
3. **主面试官 Agent（Senior Interviewer）**：
   - 大厂资深架构师风格，遵循“一次只抛出一个核心聚焦问题”，深度压测技术边界。
4. **标准流式通信（SSE）**：
   - 纯标准 HTTP Server-Sent Events 流式推流，前端毫秒级低延迟响应。
5. **开箱即用与优雅降级**：
   - 即使用户本地未配置任何 LLM API Key，本服务也内置了完整的离线演示状态推演；
   - 若服务关闭或异常断开，前端主程序将**自动无缝降级**回内置大模型引擎，绝不阻塞用户求职准备。

---

## 🚀 快速启动（3 步上手）

### 1. 进入目录并创建虚拟环境（推荐 Python 3.10+）

```bash
cd services/mock-agent-service
python -m venv .venv

# Windows 激活环境：
.venv\Scripts\activate

# macOS / Linux 激活环境：
source .venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. （可选）配置大模型 API Key

在当前目录下创建 `.env` 文件（若不创建则使用内置的离线状态机演示问答）：

```env
# 示例：使用 DeepSeek API
OPENAI_API_KEY=sk-xxxxxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat

# 或者使用官方 OpenAI
# OPENAI_API_KEY=sk-xxxxxx
# OPENAI_BASE_URL=https://api.openai.com/v1
# OPENAI_MODEL=gpt-4o-mini

# 或者使用本地 Ollama
# OPENAI_API_KEY=ollama
# OPENAI_BASE_URL=http://localhost:11434/v1
# OPENAI_MODEL=qwen2.5:7b
```

### 4. 启动服务

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

看到类似以下输出即表示服务已正常启动：
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

---

## 🔗 在前端启用

1. 打开 Interview Memo 主界面，进入 **「设置」(`/settings`)**；
2. 找到 **「外部模拟面试服务 (Sidecar)」** 卡片；
3. 勾选 **「启用外部模拟面试服务」**，确认服务地址为 `http://127.0.0.1:8000`；
4. 点击 **「测试连接」**，看到绿色「在线」标识即配置成功；
5. 前往 **「模拟面试」** 页面发起面试，顶部将显示 `⚡ 外部多 Agent 驱动` 徽章。

---

## 🛠️ 未来进阶扩展方向

本服务作为一个独立的 Python 进程，你可以自由扩展前端无法轻易做到的高阶能力：
- **接入实时语音（STT/TTS）**：集成 OpenAI Realtime API、Whisper 或 Edge-TTS，实现真实电话/视频面的语音对讲。
- **现场代码执行沙箱**：接入 Docker 或 Pyodide，实时执行候选人手写的算法代码并测试用例。
- **大厂真题 RAG 检索**：挂载本地 Chroma / FAISS 向量库，根据候选人应聘的公司和岗位，检索最新面经的高频连环追问。
