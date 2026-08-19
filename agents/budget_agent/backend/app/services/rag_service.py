import faiss
import numpy as np
import hashlib

from openai import OpenAI

from app.config import OPENAI_API_KEY

class RAGService:
    def __init__(self, dimension: int = 1536):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.documents = []  # To map index to original string
        
        self.client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    def _local_embedding(self, text: str) -> np.ndarray:
        # Deterministic hashed bag-of-words embedding for offline mode.
        vec = np.zeros(self.dimension, dtype=np.float32)
        tokens = [t for t in text.lower().split() if t]
        if not tokens:
            return vec

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            idx = int.from_bytes(digest[:4], "big") % self.dimension
            vec[idx] += 1.0

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def get_embedding(self, text: str) -> np.ndarray:
        if self.client:
            try:
                response = self.client.embeddings.create(
                    model="text-embedding-3-small",
                    input=text
                )
                return np.array(response.data[0].embedding, dtype=np.float32)
            except Exception:
                pass
        return self._local_embedding(text)

    def add_document(self, text: str):
        emb = self.get_embedding(text)
        self.index.add(np.array([emb]))
        self.documents.append(text)

    def search(self, query: str, k: int = 3) -> list:
        if self.index.ntotal == 0:
            return []
            
        query_emb = self.get_embedding(query)
        distances, indices = self.index.search(np.array([query_emb]), k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.documents):
                results.append({
                    "document": self.documents[idx],
                    "distance": float(distances[0][i])
                })
        return results

    def initialize_knowledge_base(self):
        import os
        import pandas as pd
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
        
        # Load tax rules
        tax_path = os.path.join(data_dir, "tax_rules.csv")
        if os.path.exists(tax_path):
            try:
                df = pd.read_csv(tax_path)
                for _, row in df.iterrows():
                    doc = f"Tax Rule - Category: {row.get('category')} Sub: {row.get('sub_category')} Section: {row.get('section')} Deductible: {row.get('deductible')} Desc: {row.get('description')} Conditions: {row.get('conditions')} Note: {row.get('limit_notes')}"
                    self.add_document(doc)
                print(f"Loaded {len(df)} tax rules into RAG.")
            except Exception as e:
                print(f"Failed to load tax rules: {e}")
                
        # Load FAQs
        faq_path = os.path.join(data_dir, "financial_knowledge_base.csv")
        if os.path.exists(faq_path):
            try:
                df = pd.read_csv(faq_path)
                for _, row in df.iterrows():
                    doc = f"FAQ - Q: {row.get('question')} A: {row.get('answer')} Tags: {row.get('tags')}"
                    self.add_document(doc)
                print(f"Loaded {len(df)} FAQs into RAG.")
            except Exception as e:
                print(f"Failed to load FAQs: {e}")

rag_service = RAGService()
