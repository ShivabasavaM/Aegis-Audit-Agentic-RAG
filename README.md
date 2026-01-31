# 🛡️ Aegis-Audit: Agentic Regulatory Compliance Auditor

**Aegis-Audit** (nicknamed **Buddy**) is a production-ready RAG (Retrieval-Augmented Generation) system designed to bridge the gap between internal corporate policies and evolving global regulations (like the EU AI Act 2026).

## 🚀 Key Features
- **Buddy Persona**: A friendly AI assistant that acts as a general chatbot when no documents are present.
- **Self-Healing Policy Logic**: Automatically identifies outdated anchors (e.g., 2024 drafts) in uploaded policies and suggests 2026-compliant updates.
- **Alignment Auditor**: Performs clause-by-clause mapping between a "Target" (Law) and "Source" (Policy) to identify critical legal gaps.
- **Persistent Memory**: Uses SQLite to maintain stateful chat histories across multiple specialized audit sessions.

## 🛠️ Tech Stack
- **LLM**: Google Gemini 1.5 Flash (via `google-generativeai`)
- **Parsing**: Docling (Layout-aware document conversion)
- **Vector DB**: ChromaDB (with session-isolated collections)
- **Database**: SQLite3 (Persistent chat threads)
- **Frontend**: Streamlit (Streaming chat interface)

## 📦 Installation & Setup
1. **Clone the Repo**:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/Aegis-Audit.git](https://github.com/YOUR_USERNAME/Aegis-Audit.git)
   cd Aegis-Audit