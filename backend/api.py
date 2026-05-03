import os
import time
import logging
import traceback
import uuid
import tempfile
from typing import List
import traceback
from fastapi import FastAPI, Request, HTTPException, File, UploadFile , BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.responses import StreamingResponse
load_dotenv()
from backend.report_gen import generate_docx_report
from backend.ingestion import AegisIngestor
from backend.engine import AegisEngine
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Aegis-auditor",version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    session_id:str

class LogoutRequest(BaseModel):
    session_id:str

class ChatRequest(BaseModel):
    session_id:str
    query:str
    history:List[str]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/api/v1/chat")
async def chat_with_docs(request: ChatRequest):
    """Handles real-time streaming chat."""
    try:
        engine = AegisEngine(api_key=os.getenv("GEMINI_API_KEY"))
        
        return StreamingResponse(
            engine.run_query(request.query, request.session_id, request.history),
            media_type="text/plain"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/export")
async def export_report(request: Request):
    try:
        data = await request.json()
        session_id = data.get("session_id") or "general"
        report_data = data.get("report_data")
        
        if not report_data:
            raise ValueError("No report data provided from the frontend.")

        from backend.report_gen import generate_docx_report
        
        metadata = {
            "law_name": "Target Law Document",
            "policy_name": "Internal Policy Document"
        }

        doc_buffer = generate_docx_report(report_data, metadata)
        
        return StreamingResponse(
            doc_buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename=Aegis_Audit_{session_id}.docx"
            }
        )
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Export crashed: {str(e)}")


@app.post("/api/v1/upload")
async def upload_documents(
    law_file: UploadFile = File(...), 
    policy_file: UploadFile = File(...)
):
    if not law_file.filename.endswith('.pdf') or not policy_file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    session_id = f"session_{uuid.uuid4().hex[:8]}"
    
    try:
        start_time = time.time()
        
        law_bytes = await law_file.read()
        policy_bytes = await policy_file.read()

        MAX_FILE_SIZE_MB = 10 
        MAX_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
        
        if len(law_bytes) > MAX_BYTES or len(policy_bytes) > MAX_BYTES:
            raise HTTPException(
                status_code=413, 
                detail=f"Payload Too Large. Maximum allowed file size is {MAX_FILE_SIZE_MB}MB."
            )

        logger.info(f"[{session_id}] Uploaded Law File Size: {len(law_bytes) / (1024*1024):.2f} MB")
        logger.info(f"[{session_id}] Uploaded Policy File Size: {len(policy_bytes) / (1024*1024):.2f} MB")

        law_ingestor = AegisIngestor(namespace_name=f"{session_id}_LAW", api_key=os.getenv("GEMINI_API_KEY"))
        law_ingestor.process_pdf(law_bytes, law_file.filename)
        
        policy_ingestor = AegisIngestor(namespace_name=f"{session_id}_POLICY", api_key=os.getenv("GEMINI_API_KEY"))
        policy_ingestor.process_pdf(policy_bytes, policy_file.filename)
        
        # Stop the stopwatch
        end_time = time.time()
        logger.info(f"[{session_id}] Total Ingestion Time: {end_time - start_time:.2f} seconds")
        
        return {
            "status": "success", 
            "message": "Documents indexed successfully.",
            "session_id": session_id 
        }
    except Exception as e:
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.post("/api/v1/audit")
async def run_audit(request: AuditRequest):
    """Executes the Agentic 8-Pillar Gap Analysis."""
    try:
        engine = AegisEngine(api_key=os.getenv("GEMINI_API_KEY"))
        report = engine.run_compliance_audit(request.session_id)
        
        return {"status": "success", "report": report}
        
    except Exception as e:

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Audit Crash: {str(e)}")

@app.post("/api/v1/logout")
async def logout(requests:LogoutRequest,background_tasks:BackgroundTasks):
    """Wipes user data from Pinecone instantly."""
    law_ingestor = AegisIngestor(namespace_name=f"{request.session_id}_LAW", api_key=os.getenv("GEMINI_API_KEY"))
    policy_ingestor = AegisIngestor(namespace_name=f"{request.session_id}_POLICY", api_key=os.getenv("GEMINI_API_KEY"))

    background_tasks.add_task(law_ingestor.scrub_session_data)
    background_tasks.add_task(policy_ingestor.scrub_session_data)
    






