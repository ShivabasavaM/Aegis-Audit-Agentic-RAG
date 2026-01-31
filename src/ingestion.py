import os
import tempfile
from docling.document_converter import DocumentConverter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter

class AegisIngestor:
    def __init__(self, collection_name, api_key):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=api_key
        )
        self.collection_name = collection_name
        self.persist_dir = "./chroma_db"
        self.converter = DocumentConverter()

    def process_pdf(self, pdf_file):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(pdf_file.getbuffer())
            temp_path = tmp_file.name
        
        try:
            result = self.converter.convert(temp_path)
            markdown_text = result.document.export_to_markdown()
            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
            chunks = splitter.split_text(markdown_text)
            
            return Chroma.from_texts(
                texts=chunks,
                embedding=self.embeddings,
                collection_name=self.collection_name,
                persist_directory=self.persist_dir
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)