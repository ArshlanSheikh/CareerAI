import logging
import re
import pymupdf

logger = logging.getLogger(__name__)


class PdfExtractor:
    """
    Extracts and normalizes text from PDF resumes using PyMuPDF.
    """

    @staticmethod
    def extract_text(file_bytes: bytes) -> str:
        """
        Extracts clean, structured text from raw PDF bytes.
        """
        if not file_bytes:
            raise ValueError("No file bytes provided for extraction.")

        try:
            doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            logger.error(f"Failed to open PDF with PyMuPDF: {e}")
            raise ValueError("The uploaded file is not a valid PDF document or is corrupted.")

        if doc.is_encrypted:
            doc.close()
            raise ValueError("Password-protected or encrypted PDFs cannot be processed.")

        if doc.page_count == 0:
            doc.close()
            raise ValueError("The uploaded PDF has no pages.")

        page_texts = []
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text:
                page_texts.append(text)

        doc.close()

        raw_text = "\n\n--- Page Break ---\n\n".join(page_texts).strip()

        # Clean up text artifacts
        clean_text = PdfExtractor._clean_extracted_text(raw_text)

        if len(clean_text) < 30:
            raise ValueError(
                "Unable to extract text from this PDF. It appears to be an image-only scan or contains non-extractable text."
            )

        return clean_text

    @staticmethod
    def _clean_extracted_text(text: str) -> str:
        """
        Normalizes bullets, replaces null chars, strips duplicate blank lines.
        """
        if not text:
            return ""

        # Remove null characters
        text = text.replace("\x00", "")

        # Standardize various Unicode bullet characters to '- '
        bullet_pattern = r"[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\uF0B7]\s*"
        text = re.sub(bullet_pattern, "\n- ", text)

        # Standardize carriage returns
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Collapse 3 or more consecutive newlines into 2
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Remove weird non-printable control characters (except newline, tab)
        text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

        return text.strip()

