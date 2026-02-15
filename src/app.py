import streamlit as st
import os
import json
from report_gen import generate_docx_report
from database import init_db, get_sessions, save_message, get_messages_by_session, create_session, delete_session, update_session_title
from ingestion import AegisIngestor
from engine import AegisEngine
from dotenv import load_dotenv
import shutil

# --- SYSTEM FIXES ---
try:
    __import__('pysqlite3')
    import sys
    sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
except ImportError:
    import sqlite3

# --- INITIALIZATION ---
init_db()
load_dotenv()
API_KEY = st.secrets["GEMINI_API_KEY"]

st.set_page_config(page_title="Buddy - Aegis Audit", layout="wide", page_icon="🛡️")

# Initialize Session State
if "messages" not in st.session_state: st.session_state.messages = []
if "current_session_id" not in st.session_state: st.session_state.current_session_id = None
if "law_db" not in st.session_state: st.session_state.law_db = None
if "policy_db" not in st.session_state: st.session_state.policy_db = None
if "audit_report" not in st.session_state: st.session_state.audit_report = None
if "law_file_name" not in st.session_state: st.session_state.law_file_name = "Target Law"
if "policy_file_name" not in st.session_state: st.session_state.policy_file_name = "Internal Policy"
if "unique_id" not in st.session_state: st.session_state.unique_id = "N/A"

# --- SIDEBAR ---
with st.sidebar:
    st.title("🛡️ Buddy's Control Panel")
    
    if st.button("➕ Start New Session", use_container_width=True):
        st.session_state.current_session_id = create_session("New Audit")
        st.session_state.messages = []
        st.session_state.audit_report = None
        st.rerun()

    st.subheader("📂 History")
    sessions = get_sessions()
    for s_id, s_title in sessions:
        cols = st.columns([0.8, 0.2])
        if cols[0].button(f"💬 {s_title[:18]}", key=f"s_{s_id}", use_container_width=True):
            st.session_state.current_session_id = s_id
            st.session_state.messages = get_messages_by_session(s_id)
            st.rerun()
        if cols[1].button("🗑️", key=f"del_{s_id}"):
            delete_session(s_id)
            st.rerun()
    
    st.divider()
# --- SIDEBAR LOGIC ---
    st.header("📄 Document Feed")
    
    # 1. Try to load existing DBs if they exist for this session
    if st.session_state.current_session_id and not st.session_state.law_db:
        unique_id = str(st.session_state.current_session_id).replace("-", "_")
        persist_dir_law = f"./db/law_{unique_id}"
        persist_dir_pol = f"./db/policy_{unique_id}"
        
        # Check if DB folders exist on disk
        if os.path.exists(persist_dir_law) and os.path.exists(persist_dir_pol):
            from langchain_chroma import Chroma
            from langchain_community.embeddings import HuggingFaceEmbeddings
            
            embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            st.session_state.law_db = Chroma(persist_directory=persist_dir_law, embedding_function=embeddings)
            st.session_state.policy_db = Chroma(persist_directory=persist_dir_pol, embedding_function=embeddings)
            st.success("♻️ Restored previous session documents!")
    
    # 2. Upload UI (Only show if DBs are missing)
    if not st.session_state.law_db:
        law_f = st.file_uploader("Upload Target Law (Reference)", type="pdf")
        pol_f = st.file_uploader("Upload Internal Policy (To Audit)", type="pdf")
        
        if st.button("Initialize Engines", use_container_width=True):
            if law_f and pol_f:
                st.session_state.law_file_name = law_f.name
                st.session_state.policy_file_name = pol_f.name
                
                # Create new session if none exists
                if not st.session_state.current_session_id:
                    st.session_state.current_session_id = create_session("Audit Session")
                
                with st.spinner("Buddy is indexing legal clauses..."):
                    unique_id = str(st.session_state.current_session_id).replace("-", "_")
                    ingestor_law = AegisIngestor(f"law_{unique_id}", API_KEY)
                    ingestor_policy = AegisIngestor(f"policy_{unique_id}", API_KEY)
                    
                    st.session_state.law_db = ingestor_law.process_pdf(law_f)
                    st.session_state.policy_db = ingestor_policy.process_pdf(pol_f)
                    st.success("Indexing Complete!")
                    st.rerun() # Force UI refresh to hide uploaders
            else:
                st.error("Please upload both documents.")
    else:
            st.info("✅ Documents Loaded & Active")
            if st.button("🔄 Reset Documents", type="primary"):
                # 1. Clear Session State
                st.session_state.law_db = None
                st.session_state.policy_db = None
                st.session_state.audit_report = None
                
                # 2. Physically Delete the Vector DB Folders
                unique_id = str(st.session_state.current_session_id).replace("-", "_")
                persist_dir_law = f"./db/law_{unique_id}"
                persist_dir_pol = f"./db/policy_{unique_id}"
                
                if os.path.exists(persist_dir_law):
                    shutil.rmtree(persist_dir_law)  # Force delete
                if os.path.exists(persist_dir_pol):
                    shutil.rmtree(persist_dir_pol)  # Force delete
                    
                st.success("Documents cleared! Reloading...")
                st.rerun()
    # --- AGENTIC AUDIT TRIGGER ---
# --- AGENTIC AUDIT TRIGGER IN app.py ---
    # --- AGENTIC AUDIT TRIGGER IN app.py ---
    if st.session_state.law_db and st.session_state.policy_db:
        st.divider()
        if st.button("📊 Run Agentic 8-Pillar Audit", type="primary", use_container_width=True):
            engine = AegisEngine(API_KEY)
            
            # Defensive Helper: Converts "High" or "90%" to a number safely
            def safe_confidence(val):
                try:
                    return int(str(val).replace('%', '').strip())
                except:
                    mapping = {"High": 90, "Medium": 50, "Low": 20, "Critical": 95}
                    return mapping.get(str(val).strip(), 50)

            status_box = st.empty()
            log_box = st.expander("🕵️ Agent Reasoning Log", expanded=True)
            
            with status_box.status("Agent is initializing...", expanded=True) as status:
                log_box.write("⚙️ Step 1: Identifying relevant legal pillars...")
                pillars = engine._identify_dynamic_pillars(st.session_state.law_db, st.session_state.policy_db)
                log_box.write(f"✅ Pillars Identified: {', '.join(pillars)}")
                
                st.session_state.audit_report = []
                for p in pillars:
                    log_box.write(f"🔍 Analyzing Pillar: **{p}**...")
                    finding = engine.run_pillar_analysis(p, st.session_state.law_db, st.session_state.policy_db)
                    
                    # FIX: Use safe_confidence to prevent the 'High' vs int() crash
                    conf_score = safe_confidence(finding.get('confidence', '0'))
                    
                    if conf_score < 80:
                        log_box.write(f"⚠️ Low Confidence ({conf_score}%). Triggering Critique Node...")
                    
                    st.session_state.audit_report.append(finding)
                
                status.update(label="Audit Complete!", state="complete", expanded=False)
            
            st.toast("Full Agentic Audit Finished!", icon="✅")
            st.rerun()

    # --- EXPORT REPORT (FIXED NAMEERROR) ---
    if st.session_state.audit_report:
        st.divider()
        metadata = {
            "unique_id": st.session_state.unique_id,
            "law_name": st.session_state.law_file_name,
            "policy_name": st.session_state.policy_file_name
        }
        # Variable is defined and used within the same block
        report_buffer = generate_docx_report(st.session_state.audit_report, metadata)
        st.download_button(
            label="📥 Download Professional Report",
            data=report_buffer,
            file_name=f"Audit_Report_{st.session_state.unique_id}.docx",
            mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            use_container_width=True
        )

# --- MAIN UI ---
st.title("🛡️ Aegis-Audit: Agentic Legal Engine")



if st.session_state.audit_report:
    st.header("📋 Agentic Gap Analysis")
    
    cols = st.columns(2) 
    for i, report in enumerate(st.session_state.audit_report):
        with cols[i % 2]:
            rating = report.get('rating', 'Medium')
            confidence = report.get('confidence', 'N/A')
            color = "🔴" if rating in ["Critical", "High"] else "🟡" if rating == "Medium" else "🟢"
            
            with st.expander(f"{color} {report.get('pillar')} ({rating}) - Confidence: {confidence}"):
                st.markdown(f"**Finding:**\n{report.get('finding')}")
                st.caption(f"📍 Citation: {report.get('citation', 'N/A')}")
                st.divider()
                st.markdown(f"**✅ Remediation Plan:**\n{report.get('remediation')}")
    
    if st.button("Clear Audit Result", use_container_width=True):
        st.session_state.audit_report = None
        st.rerun()
    st.divider()

# --- CHAT ---
# --- CHAT INTERFACE ---
for m in st.session_state.messages:
    with st.chat_message(m["role"]): 
        st.markdown(m["content"])

if prompt := st.chat_input("Ask a question about the contract..."):
    if not st.session_state.current_session_id:
        st.session_state.current_session_id = create_session(prompt[:30])
    
    st.session_state.messages.append({"role": "user", "content": prompt})
    save_message(st.session_state.current_session_id, "user", prompt)
    with st.chat_message("user"): st.markdown(prompt)

    engine = AegisEngine(API_KEY)
    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        full_response = ""
        stream = engine.run_query_stream(prompt, st.session_state.law_db, st.session_state.policy_db, st.session_state.messages[:-1])

        for chunk in stream:
            full_response += chunk.text
            response_placeholder.markdown(full_response + "▌")
        response_placeholder.markdown(full_response)
        
        st.session_state.messages.append({"role": "assistant", "content": full_response})
        save_message(st.session_state.current_session_id, "assistant", full_response)