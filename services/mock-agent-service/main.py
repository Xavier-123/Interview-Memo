import json
import asyncio
from typing import Dict, Any, List
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from agent import MultiAgentInterviewOrchestrator

app = FastAPI(
    title="Interview Memo - Multi-Agent Mock Interview Service",
    description="高拟真度多 Agent 模拟面试外部独立适配服务 (Sidecar)",
    version="1.0.0"
)

# 允许跨域请求，供前端开发与生产页面自由连接
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    context: Dict[str, Any] = Field(default_factory=dict, description="面试上下文信息（岗位、公司、简历、项目）")
    messages: List[Dict[str, str]] = Field(default_factory=list, description="对话历史消息列表")

class FeedbackRequest(BaseModel):
    context: Dict[str, Any] = Field(default_factory=dict)
    messages: List[Dict[str, str]] = Field(default_factory=list)

@app.get("/health")
async def health_check():
    """健康检查接口，前端测试连接时调用"""
    return {
        "ok": True,
        "message": "模拟面试外部多 Agent 服务在线",
        "version": "1.0.0",
        "agents": ["StateMachineOrchestrator", "ShadowObserver", "SeniorInterviewer"]
    }

@app.post("/api/mock/chat")
async def mock_chat(req: ChatRequest):
    """
    SSE 流式对话接口
    前端通过 ReadableStream 读取 data: {"delta": "..."}
    """
    async def event_generator():
        try:
            async for delta in MultiAgentInterviewOrchestrator.chat_stream(req.context, req.messages):
                payload = json.dumps({"delta": delta}, ensure_ascii=False)
                yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            err_payload = json.dumps({"error": str(e)}, ensure_ascii=False)
            yield f"data: {err_payload}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/api/mock/feedback")
async def mock_feedback(req: FeedbackRequest):
    """
    结构化复盘与诊断报告生成接口
    """
    try:
        feedback = await MultiAgentInterviewOrchestrator.generate_feedback(req.context, req.messages)
        return feedback
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成反馈失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # 本地默认监听 127.0.0.1:8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
