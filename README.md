# Aegis Audit: Agentic Compliance RAG

**🟢 Live Demo:** https://aegis-audit-acr.vercel.app/
*(Note: The backend is hosted on Render's EcoFree tier. Please allow a few seconds for the initial cold start).*

## 📌 Problem

Enterprise compliance teams spend significant time manually cross-referencing internal policies against evolving regulatory frameworks (e.g., Dodd-Frank, Indian Contract Act).  

Traditional LLM-based systems struggle in this setting due to:
- Hallucination of legal clauses  
- Lack of structured, multi-step reasoning  
- Inconsistent traceability of outputs  

---

## ⚙️ Approach

### 🧠 Model
- Gemini 2.5 Flash (Inference + Embeddings)

### 🔄 Pipeline

**Ingestion**
- LlamaParse for structured PDF extraction  
- LangChain text splitters for chunking  

**Storage**
- Pinecone Serverless (3072-d embeddings)  
- Session-based ephemeral namespaces  

**Orchestration**
- Event-driven Python backend  
- Parallel processing using `ThreadPoolExecutor`  
- Multi-step verification loop per audit pillar  

**Client**
- React (Vite) frontend  
- Streaming responses with defensive rendering  
- `.docx` report generation via in-memory buffers  

---

## 🤔 Why This Approach?

Instead of relying on a single prompt, the system follows a structured **Agentic RAG pipeline**:

- Breaks compliance auditing into **8 legal pillars**  
- Runs each pillar as an independent reasoning thread  
- Retrieves context → verifies → synthesizes output  

This improves:
- Consistency  
- Traceability  
- Reduction in hallucination  

---

## 🏗️ Architecture

      ┌───────────────────────────────────────────────────────────┐
      │                   USER INTERFACE (React + Vite)           │
      │   (Hosted on Vercel)                                      │
      └──────────────┬──────────────────────────────▲─────────────┘
                     │                              │
           [1] PDF Uploads / Queries        [6] Streaming Response /
                     │                          .docx Report
                     ▼                              │
      ┌─────────────────────────────────────────────┴─────────────┐
      │                  API LAYER (FastAPI + Python)             │
      │   (Hosted on Render)                                      │
      └──────────────┬──────────────────────────────┬─────────────┘
                     │                              │
         ┌───────────▼───────────┐      ┌───────────▼───────────┐
         │  INGESTION PIPELINE   │      │   AGENTIC AUDIT CORE  │
         │ (Session-Isolated)    │      │ (Parallel Processing) │
         └───────────┬───────────┘      └───────────┬───────────┘
                     │                              │
      [2] LlamaParse (PDF Extraction)   [4] 8-Pillar Analysis Threads
                     │                  (Capacity, Consent, etc.)
                     ▼                              │
      [3] Gemini Embedding Engine       [5] Self-Correction Loop
      (models/gemini-embedding-2)       (Verification vs. Source)
                     │                              │
                     ▼                              ▼
      ┌───────────────────────────────────────────────────────────┐
      │                VECTOR DATABASE (Pinecone)                 │
      │   (Ephemeral Session-Based Namespaces / Serverless)       │
      └───────────────────────────────────────────────────────────┘

---

## 📊 Results

### Metrics
- Evaluated using **RAGAS** (Faithfulness, Answer Relevancy)  
- Achieved strong alignment between generated outputs and source context  

### Performance
- Reduced audit time from ~3.5 minutes (sequential) → ~40 seconds (parallel execution)

### Observations
- Verification loop reduced cases where the model inferred beyond provided context  
- Improved reliability in structured legal analysis  

---

## ⚖️ Tradeoffs

### Accuracy vs Latency
- Introduced a verification step (secondary LLM call)  
- Added ~2–3 seconds per pillar  
- Improved output reliability and reduced hallucination  

### Security vs Persistence
- Implemented **ephemeral vector storage**
- Data tied to session lifecycle  
- Automatic deletion using `index.delete()` after session ends  

---

## 🧪 Failures & Learnings

### 1. API Rate Limiting & UI Failures
- High retrieval (`k=10`) across 8 threads caused API quota errors  
- Resulted in frontend crash (empty render state)

**Fix**
- Reduced retrieval size (`k=5`)  
- Added defensive rendering (`?.`) in React  

---

### 2. Memory vs Disk I/O Bottleneck
- Writing `.docx` to disk caused backend failures  

**Fix**
- Switched to in-memory document generation using `io.BytesIO()`  
- Streamed file directly via FastAPI `StreamingResponse`  

---

## 🖥️ How it Works 

https://github.com/user-attachments/assets/2e329003-7a38-430d-bcb5-b9bed2bfe8da

---

## 🚀 How to Run

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload
```

### 2. Frontend Setup
```
cd frontend
npm install
npm run dev
```

### 3. Environment Variables
Create .env file in the backend directory and add respective api's
```
GEMINI_API_KEY=your_google_api_key
PINECONE_API_KEY=your_pinecone_key
LLAMA_CLOUD_API_KEY=your_llamaparse_key
```

🔗 Tech Stack
LLM & RAG: Gemini, LangChain
Parsing: LlamaParse
Vector DB: Pinecone
Backend: FastAPI, Python
Frontend: React (Vite)
Concurrency: ThreadPoolExecutor

📌 Future Improvements
Add monitoring for LLM responses
Improve evaluation with real-world compliance datasets
Introduce caching for repeated queries
Optimize cost and latency tradeoffs
