import os
import tempfile
from docling.document_converter import DocumentConverter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

class AegisIngestor:
    def __init__(self, collection_name, api_key=None):
        self.collection_name = collection_name
        self.persist_dir = f"./db/{collection_name}"
        
        # Local embeddings (Free & Fast)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )
        
        self.converter = DocumentConverter()
        
        # Optimized chunk size for legal documents
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )

    def process_pdf(self, pdf_file):
        """
        Processes PDF and tags each chunk with the filename for Citations.
        Note: 'doc_type' argument removed to match app.py call signature.
        """
        # Save uploaded file to a temporary path so Docling can read it
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_file.getvalue())
            temp_path = tmp.name
            filename = pdf_file.name # Capture filename for citation metadata

        try:
            # 1. Convert PDF to Markdown text using Docling
            result = self.converter.convert(temp_path)
            raw_text = result.document.export_to_markdown()
            
            # 2. Split text into manageable chunks
            chunks = self.splitter.split_text(raw_text)

            # 3. Create Metadata for every chunk
            # This is critical for the "Source: [Filename]" citation in the audit report
            metadatas = [{"source": filename} for _ in chunks]

            # 4. Store in Chroma Vector DB
            vector_db = Chroma.from_texts(
                texts=chunks,
                metadatas=metadatas,
                embedding=self.embeddings,
                persist_directory=self.persist_dir,
                collection_name=self.collection_name
            )
            return vector_db

        finally:
            # 5. Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)