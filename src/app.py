import streamlit as st
import os
from database import init_db, get_sessions, save_message, get_messages_by_session, create_session, delete_session, update_session_title
from ingestion import AegisIngestor
from engine import AegisEngine
from dotenv import load_dotenv

# --- INITIALIZATION ---
init_db()
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

st.set_page_config(page_title="Buddy - Aegis Audit", layout="wide", page_icon="🛡️")

# Ensure all session state attributes exist to prevent crashes
if "messages" not in st.session_state: st.session_state.messages = []
if "current_session_id" not in st.session_state: st.session_state.current_session_id = None
if "law_db" not in st.session_state: st.session_state.law_db = None
if "policy_db" not in st.session_state: st.session_state.policy_db = None

# --- SIDEBAR: Management ---
with st.sidebar:
    st.title("🛡️ Buddy's Control Panel")
    
    if st.button("➕ Start New Chat", use_container_width=True):
        st.session_state.current_session_id = create_session("New Chat")
        st.session_state.messages = []
        st.rerun()

    st.subheader("📂 Past Conversations")
    for sess_id, title in get_sessions():
        col1, col2 = st.columns([0.8, 0.2])
        with col1:
            if st.button(f"💬 {title[:18]}...", key=f"s_{sess_id}", use_container_width=True):
                st.session_state.current_session_id = sess_id
                st.session_state.messages = get_messages_by_session(sess_id)
                st.rerun()
        with col2:
            if st.button("🗑️", key=f"del_{sess_id}"):
                delete_session(sess_id)
                st.rerun()
    
    st.divider()
    st.header("📄 Add Documents")
    law_f = st.file_uploader("Upload External Law", type="pdf")
    pol_f = st.file_uploader("Upload Internal Policy", type="pdf")
    
    if st.button("Enable Audit Mode"):
        if law_f and pol_f:
            with st.spinner("Buddy is reading your files..."):
                # Create a unique name based on the session ID
                unique_id = str(st.session_state.current_session_id).replace("-", "_")
                law_coll_name = f"law_{unique_id}"
                pol_coll_name = f"policy_{unique_id}"

                ingestor_law = AegisIngestor(law_coll_name, API_KEY)
                ingestor_policy = AegisIngestor(pol_coll_name, API_KEY)
                # ing_l = AegisIngestor("law_coll", API_KEY)
                # ing_p = AegisIngestor("pol_coll", API_KEY)
                st.session_state.law_db = ingestor_law.process_pdf(law_f)
                st.session_state.policy_db = ingestor_policy.process_pdf(pol_f)
                st.success("Audit Mode Ready!")
        else:
            st.error("I need both files to run an audit!")

# --- MAIN CHAT ---
st.title("🛡️ Buddy: Your Assistant & Auditor")

for m in st.session_state.messages:
    with st.chat_message(m["role"]): st.markdown(m["content"])

if prompt := st.chat_input("Hi! I'm Buddy. Ask me anything..."):
    if not st.session_state.current_session_id:
        st.session_state.current_session_id = create_session(prompt[:30])
    
    # Auto-rename chat session on first message
    if len(st.session_state.messages) == 0:
        update_session_title(st.session_state.current_session_id, prompt)

    st.session_state.messages.append({"role": "user", "content": prompt})
    save_message(st.session_state.current_session_id, "user", prompt)
    with st.chat_message("user"): st.markdown(prompt)

    # Trigger Streaming Response
    engine = AegisEngine(API_KEY)
    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        full_response = ""
        
        # Pass DBs (they will be None if not uploaded)
        stream = engine.run_query_stream(
            user_query=prompt,
            law_db=st.session_state.law_db,
            policy_db=st.session_state.policy_db,
            history=st.session_state.messages[:-1]
        )

        for chunk in stream:
            full_response += chunk.text
            response_placeholder.markdown(full_response + "▌")
        
        response_placeholder.markdown(full_response)
        
        st.session_state.messages.append({"role": "assistant", "content": full_response})
        save_message(st.session_state.current_session_id, "assistant", full_response)