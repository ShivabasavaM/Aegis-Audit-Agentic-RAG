import json
import google.generativeai as genai
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma

class AegisEngine:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        
        # --- CLEAN CONFIGURATION (No Tools) ---
        # We removed the Google Search tool to prevent API errors.
        
        # Main Model (for Logic & Audit)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Chat Model (for General Talk)
        # Standard model without tools. Fast and stable.
        self.chat_model = genai.GenerativeModel('gemini-2.5-flash')
        
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    def _classify_intent(self, query):
        """
        Routes queries between General Chat and Legal Audit.
        """
        prompt = f"""
        Classify intent:
        1. GENERAL_CHAT: News, current events, greetings, recipes, celebrity info, small talk.
        2. LEGAL_QUERY: Contracts, policy, laws, audit questions, specific document queries.
        
        Query: {query}
        Return ONLY the category name.
        """
        try:
            res = self.model.generate_content(prompt)
            intent = res.text.strip().upper()
            return "GENERAL_CHAT" if "GENERAL" in intent else "LEGAL_QUERY"
        except:
            return "LEGAL_QUERY"

    def _parse_confidence(self, val):
        """Helper to safely convert AI confidence (word or number) to an integer."""
        try:
            return int(str(val).replace('%', '').strip())
        except:
            return 50 # Default safe fallback

    def _identify_dynamic_pillars(self, law_db, policy_db):
        """
        Agentic Step: Analyzes document summaries to determine relevant audit pillars.
        """
        try:
            law_summary = law_db.similarity_search("summary of the act", k=3)
            policy_summary = policy_db.similarity_search("policy scope and definitions", k=3)
            
            context = f"LAW: {[d.page_content[:500] for d in law_summary]}\nPOLICY: {[d.page_content[:500] for d in policy_summary]}"
            
            prompt = f"""
            Based on these document fragments, identify the 8 most critical legal pillars for a compliance audit.
            Return ONLY a JSON array of strings.
            Context: {context}
            """
            res = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            pillars = json.loads(res.text)
            return pillars[:8] if len(pillars) >= 8 else pillars
        except:
            return ["Capacity", "Consent", "Consideration", "Legality", "Documentation", "Breach", "Termination", "Jurisdiction"]

    def _verify_and_critique(self, pillar, finding, context):
        """
        Self-Correction Loop: Checks for hallucinations.
        """
        prompt = f"""
        Audit Step: Verification
        Pillar: {pillar}
        Finding: {finding}
        Evidence Context: {context}
        
        Review the finding above. Is it strictly supported by the evidence? 
        If there is any hallucination or missing detail, correct it.
        Return ONLY the corrected JSON finding object.
        """
        try:
            res = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            return json.loads(res.text)
        except:
            return None

    def run_pillar_analysis(self, pillar, law_db, policy_db):
        """Executes a single-pillar analysis with dynamic verification."""
        law_docs = law_db.similarity_search(pillar, k=5)
        pol_docs = policy_db.similarity_search(pillar, k=5)
        
        context = f"LAW: {[d.page_content for d in law_docs]}\nPOLICY: {[d.page_content for d in pol_docs]}"
        
        prompt = f"""
        Analyze the pillar '{pillar}' using the Indian Contract Act. 
        Return a JSON object with: pillar, rating, finding, remediation, confidence, citation.
        Confidence MUST be a number 0-100.
        Context: {context}
        """
        
        try:
            res = self.model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            finding = json.loads(res.text)
            
            conf_val = self._parse_confidence(finding.get("confidence", 0))
            
            if conf_val < 80:
                refined = self._verify_and_critique(pillar, finding, context)
                if refined: return refined
                
            return finding
        except Exception as e:
            print(f"Error in {pillar}: {e}")
            return {"pillar": pillar, "rating": "Low", "finding": "Inconclusive analysis.", "remediation": "Review manually.", "confidence": "0%", "citation": "N/A"}

    def run_compliance_audit(self, law_db, policy_db):
        """
        Multi-Step Reasoning Audit: Plan -> Retrieve -> Verify -> Synthesize.
        """
        pillars = self._identify_dynamic_pillars(law_db, policy_db)
        final_report = []

        for pillar in pillars:
            finding = self.run_pillar_analysis(pillar, law_db, policy_db)
            final_report.append(finding)
                
        return final_report

    def run_query_stream(self, user_query, law_db, policy_db, history):
        """
        Agentic Router: Switches between General Chat (No Search) and Legal RAG.
        """
        intent = self._classify_intent(user_query)
        
        # --- ROUTE A: GENERAL CHAT (Internal Knowledge Only) ---
        if intent == "GENERAL_CHAT":
            prompt = f"""
            You are Buddy. A smart, helpful assistant.
            
            INSTRUCTIONS:
            1. Answer general questions (greetings, recipes, concepts) directly and conversationally.
            2. For news/current events, provide information based on your training data.
            3. Do NOT provide generic categories like "Politics" or "Economy". Give actual details you know.
            4. Do NOT narrate your process.
            
            User Query: {user_query}
            """
            return self.chat_model.generate_content(prompt, stream=True)

        # --- ROUTE B: LEGAL QUERY (Document RAG) ---
        k_val = 6
        law_docs = law_db.similarity_search(user_query, k=k_val) if law_db else []
        pol_docs = policy_db.similarity_search(user_query, k=k_val) if policy_db else []
        
        context = ""
        for d in law_docs + pol_docs:
            src = d.metadata.get('source', 'Document')
            context += f"| {src} |: {d.page_content}\n"
        
        legal_prompt = f"""
        Role: Legal Auditor. Answer strictly from context.
        Context: {context}
        History: {history}
        Question: {user_query}
        """
        return self.model.generate_content(legal_prompt, stream=True)