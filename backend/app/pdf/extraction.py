import logging
from app.pdf.document_extractor import DocumentExtractor

logger = logging.getLogger(__name__)


class PdfExtractor:
    """
    Backwards-compatible wrapper delegating to DocumentExtractor.
    """

    @staticmethod
    def extract_text(file_bytes: bytes) -> str:
        return DocumentExtractor.extract_text(file_bytes, "document.pdf")

    @staticmethod
    def _clean_extracted_text(text: str) -> str:
        return DocumentExtractor._clean_text(text)
