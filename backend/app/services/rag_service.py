import re
from typing import List, Dict, Any
from app.database.supabase_client import get_knowledge_documents

class RAGService:
    @staticmethod
    def retrieve_relevant_knowledge(
        query_terms: List[str],
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Retrieves relevant veterinary documents from Supabase knowledge_documents
        based on symptomatic and clinical match scoring.
        """
        docs = get_knowledge_documents()
        scored_docs = []

        # Tokenize search terms
        tokens = [t.lower() for t in query_terms if len(t) > 2]

        for doc in docs:
            text = (doc.get("title", "") + " " + doc.get("content", "") + " " + doc.get("category", "")).lower()
            match_count = sum(1 for token in tokens if re.search(r'\b' + re.escape(token) + r'\b', text))
            
            # Additional semantic boost for common veterinary symptoms
            boost = 0.0
            if "fever" in text or "temperature" in text or "pyrexia" in text:
                if any(t in ["fever", "temperature", "pyrexia", "hot", "hyperthermia"] for t in tokens):
                    boost += 0.25
            if "feeding" in text or "anorexia" in text or "intake" in text:
                if any(t in ["feeding", "appetite", "anorexia", "intake"] for t in tokens):
                    boost += 0.20
            if "respiratory" in text or "brd" in text:
                if any(t in ["respiratory", "cough", "nasal", "discharge", "brd"] for t in tokens):
                    boost += 0.25

            # Base relevance score between 0.65 and 0.98 if matched
            if match_count > 0 or boost > 0:
                relevance = min(0.98, 0.60 + (match_count * 0.08) + boost)
                scored_docs.append({
                    "id": str(doc.get("id")),
                    "document": doc.get("title"),
                    "source": doc.get("source"),
                    "category": doc.get("category"),
                    "relevant_information": doc.get("content"),
                    "relevance": round(relevance, 2)
                })

        # Sort descending by relevance
        scored_docs.sort(key=lambda x: x["relevance"], reverse=True)

        if not scored_docs and docs:
            # Fallback to top general guidelines
            first = docs[0]
            scored_docs.append({
                "id": str(first.get("id")),
                "document": first.get("title"),
                "source": first.get("source"),
                "category": first.get("category"),
                "relevant_information": first.get("content"),
                "relevance": 0.75
            })

        return scored_docs[:top_k]
