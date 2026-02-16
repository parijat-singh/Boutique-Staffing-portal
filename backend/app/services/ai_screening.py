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
    async def evaluate_candidate_with_gemini(
        resume_text: str,
        job_title: str,
        must_have_requirements: str,
        nice_to_have_requirements: str = None
    ) -> Dict[str, Any]:
        """Fallback method using Google Gemini."""
        import google.generativeai as genai
        
        if not settings.GEMINI_API_KEY:
            return {
                "match_count": 0,
                "total_must_haves": 0,
                "score": 0,
                "justification": "OpenAI token limit reached. Gemini fallback failed: API Key missing.",
                "gap_analysis": []
            }
            
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.GEMINI_MODEL)
            
            prompt = f"""
            You are an expert technical recruiter. Evaluate this candidate against the job.
            
            Output strictly valid JSON with this structure:
            {{
                "match_count": int,
                "total_must_haves": int,
                "score": int,
                "justification": "string",
                "gap_analysis": [
                    {{ "requirement": "string", "status": "Missing"|"Weak"|"Match", "note": "string" }}
                ]
            }}
            
            Job Title: {job_title}
            Must-Have: {must_have_requirements}
            Nice-to-Have: {nice_to_have_requirements or "None"}
            
            Resume:
            {resume_text}
            """
            
            response = await model.generate_content_async(prompt)
            text = response.text.strip()
            # Clean markdown code blocks if present
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text)
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            return {
                "match_count": 0,
                "total_must_haves": 0,
                "score": 0,
                "justification": f"Both OpenAI and Gemini failed. Gemini Error: {str(e)}",
                "gap_analysis": []
            }

    @staticmethod
    async def evaluate_candidate(
        resume_text: str,
        job_title: str,
        must_have_requirements: str,
        nice_to_have_requirements: str = None
    ) -> Dict[str, Any]:
        """
        Evaluate a candidate's resume against job requirements using OpenAI.
        Falls back to Gemini if token limit is exceeded.
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
        {resume_text}
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
            error_msg = str(e)
            print(f"OpenAI Error: {e}")
            
            if "context_length_exceeded" in error_msg or "string too long" in error_msg or "rate limit" in error_msg.lower():
                print("Switching to Gemini Fallback...")
                return await AIScreeningService.evaluate_candidate_with_gemini(
                    resume_text, job_title, must_have_requirements, nice_to_have_requirements
                )
            
            return {
                "match_count": 0,
                "total_must_haves": 0,
                "score": 0,
                "justification": f"AI Evaluation Failed: {error_msg}",
                "gap_analysis": []
            }

ai_screening_service = AIScreeningService()
