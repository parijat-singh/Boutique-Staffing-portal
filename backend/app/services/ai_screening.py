import json
from typing import Dict, Any, List
import io
import pypdf
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class AIScreeningService:
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> str:
        """Extract text from PDF or DOCX file."""
        text = ""
        try:
            if filename.lower().endswith('.pdf'):
                pdf_reader = pypdf.PdfReader(io.BytesIO(file_content))
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            elif filename.lower().endswith('.docx'):
                import docx
                doc = docx.Document(io.BytesIO(file_content))
                for para in doc.paragraphs:
                    text += para.text + "\n"
            else:
                return ""
        except Exception as e:
            print(f"Error extracting text from file {filename}: {e}")
            return ""
        return text

    @staticmethod
    async def evaluate_candidate(
        resume_text: str,
        job_title: str,
        must_have_requirements: str,
        nice_to_have_requirements: str = None
    ) -> Dict[str, Any]:
        """
        Evaluate a candidate's resume against job requirements using OpenAI.
        """
        
        system_prompt = """
        You are an expert technical recruiter. Your task is to evaluate a candidate's resume against a job description.
        You must verify "Must-Have" requirements rigorously.
        You should also check "Nice-to-Have" requirements but they are optional.
        
        Output must be a valid JSON object with the following structure:
        {
            "match_count": int, // Number of must-have requirements met
            "total_must_haves": int, // Total number of must-have requirements identified
            "score": int, // Weighted score 0-100. (70% based on Must-Haves, 30% on Nice-to-Haves)
            "justification": "string", // Brief summary of why they match or don't match
            "gap_analysis": [ // List of missing or weak requirements
                {
                    "requirement": "string",
                    "status": "Missing" | "Weak" | "Match",
                    "note": "string"
                }
            ]
        }
        """

        user_prompt = f"""
        Job Title: {job_title}
        
        Must-Have Requirements:
        {must_have_requirements}
        
        Nice-to-Have Requirements:
        {nice_to_have_requirements or "None"}
        
        Candidate Resume:
        {resume_text[:10000]} # Truncate to avoid token limits if necessary, though 4o-mini has high limits.
        """

        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error calling OpenAI: {e}")
            return {
                "match_count": 0,
                "total_must_haves": 0,
                "score": 0,
                "justification": f"Error during AI evaluation: {str(e)}",
                "gap_analysis": []
            }

ai_screening_service = AIScreeningService()
