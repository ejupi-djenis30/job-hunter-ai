import fitz  # PyMuPDF
from fastapi import UploadFile, HTTPException

async def extract_text_from_file(file: UploadFile) -> str:
    content_type = file.content_type
    filename = file.filename.lower()
    
    try:
        if filename.endswith(".pdf"):
            return _extract_from_pdf(await file.read())
        elif filename.endswith(".txt") or filename.endswith(".md"):
            content = await file.read()
            return content.decode("utf-8")
        else:
             # Fallback: try to decode as text
            content = await file.read()
            try:
                return content.decode("utf-8")
            except UnicodeDecodeError:
                raise HTTPException(status_code=400, detail="Unsupported file type or encoding. Please upload PDF, TXT, or MD.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

def _extract_from_pdf(content: bytes) -> str:
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        raise Exception(f"PDF parsing error: {str(e)}")
