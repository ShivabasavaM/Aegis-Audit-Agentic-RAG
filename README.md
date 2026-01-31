# 🛡️ Aegis-Audit: Your Intelligent Document Verification Assistant

**Aegis-Audit** (nicknamed **Buddy**) is a universal Agentic RAG system designed to automate document auditing, gap analysis, and compliance verification. By leveraging the **Gemini 2.5 Flash** model, Buddy can ingest complex documentation and provide structured, actionable insights in seconds.

## 🚀 Key Features
- **Buddy Persona**: A friendly, intelligent assistant that handles general inquiries while remaining ready for deep-dive audits.
- **Self-Healing Document Logic**: Dynamically identifies outdated anchors or conflicting clauses between documents and suggests corrective updates.
- **Universal Alignment Auditor**: Performs clause-by-clause mapping between a "Target" (Reference Document) and "Source" (Internal Policy) to identify critical gaps.
- **Layout-Aware Ingestion**: Utilizes Docling to understand complex tables, headers, and document structures for superior RAG accuracy.
- **Session Isolation**: Employs unique ChromaDB collections per chat session to ensure zero data leakage between different audits.

## 🛠️ Tech Stack
- **LLM**: Google Gemini 2.5 Flash (Optimized for speed and reasoning)
- **Framework**: LangChain (Agentic orchestration & RAG)
- **Parsing**: Docling (High-fidelity PDF processing)
- **Vector DB**: ChromaDB (Stateful document embeddings)
- **Database**: SQLite3 (Persistent chat threads and session management)
- **UI**: Streamlit (Responsive streaming chat interface)

## 📦 How to Use
1. **Chat Mode**: Start talking to Buddy. He’s a great general assistant!
2. **Audit Mode**: 
   - Upload your **Target Document** (The standard or law you need to meet).
   - Upload your **Source Document** (Your internal policy or draft).
   - Click "Enable Audit Mode" and ask Buddy to "Perform an alignment audit" or "Check for outdated mandates."
