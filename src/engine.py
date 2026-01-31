import google.generativeai as genai

class AegisEngine:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        # Using a stable, high-performance model
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def run_query_stream(self, user_query, law_db=None, policy_db=None, history=[]):
        # 1. Format History for Stateful Chat
        formatted_history = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            formatted_history.append({"role": role, "parts": [msg["content"]]})

        chat = self.model.start_chat(history=formatted_history)

        # 2. Check for Document Context (RAG)
        context_data = ""
        docs_available = False
        if law_db and policy_db:
            docs_available = True
            law_context = law_db.similarity_search(user_query, k=3)
            policy_context = policy_db.similarity_search(user_query, k=3)
            context_data = f"""
            DOCUMENTS DETECTED:
            LAW/TARGET: {[d.page_content for d in law_context]}
            POLICY/SOURCE: {[d.page_content for d in policy_context]}
            """

        # 3. Buddy Personality & Hybrid Logic
        prompt = f"""
        {context_data}
        
        SYSTEM PERSONALITY: Your name is Buddy. You are a friendly, intelligent assistant. 
        Current Date: January 31, 2026.
        
        INSTRUCTIONS:
        
        - PRIMARY ROLE (Buddy): Always answer as Buddy. If the user just wants to chat (biryani, coding, life), be their helpful friend.
        
        - SECONDARY ROLE (Auditor): 
          1. If the user asks about 'documents' or 'compliance' but NO DOCUMENTS are detected, say: 
             "Hey! I'm Buddy. I see you're asking about documents, but I don't have access to them yet. Upload them in the sidebar so I can help!"
          2. If DOCUMENTS ARE DETECTED and the query is an audit/comparison, perform a professional analysis.
             (Self-Healing verification, Alignment Mapping, or Standard Gap Analysis).
        
        USER QUERY: {user_query}
        """
        
        return chat.send_message(prompt, stream=True)