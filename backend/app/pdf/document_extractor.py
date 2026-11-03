import io
import logging
import re
from typing import Tuple

import pymupdf
import docx
import olefile

logger = logging.getLogger(__name__)


class DocumentExtractor:
    """
    Unified multi-format document text extraction engine.
    Supports PDF (.pdf), modern Microsoft Word (.docx), and legacy Word (.doc).
    """

    SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".doc"}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    @classmethod
    def extract_text(cls, file_bytes: bytes, filename: str) -> str:
        """
        Extracts clean, normalized plain text from a supported resume file.
        """
        if not file_bytes:
            raise ValueError("No file content received. The uploaded document is empty.")

        if len(file_bytes) > cls.MAX_FILE_SIZE:
            raise ValueError("File size exceeds the 10MB limit. Please upload a smaller file.")

        ext = cls._get_extension(filename)
        if ext not in cls.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file format '{ext}'. Please upload a PDF (.pdf), Word Document (.docx), or legacy Word (.doc) file."
            )

        try:
            if ext == ".pdf":
                raw_text = cls._extract_from_pdf(file_bytes)
            elif ext == ".docx":
                raw_text = cls._extract_from_docx(file_bytes)
            elif ext == ".doc":
                raw_text = cls._extract_from_doc(file_bytes)
            else:
                raise ValueError(f"Unsupported extension: {ext}")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error extracting text from {filename} ({ext}): {str(e)}", exc_info=True)
            raise ValueError(f"Failed to read {ext.upper()} document: {str(e)}")

        clean_text = cls._clean_text(raw_text)

        if len(clean_text) < 30:
            raise ValueError(
                "Unable to extract sufficient text from this document. It may be an image-only scan, password-protected, or empty."
            )

        return clean_text

    @staticmethod
    def _get_extension(filename: str) -> str:
        if not filename or "." not in filename:
            return ""
        return "." + filename.rsplit(".", 1)[1].lower()

    @staticmethod
    def _extract_from_pdf(file_bytes: bytes) -> str:
        """
        Extract text using PyMuPDF.
        """
        try:
            doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            logger.error(f"PyMuPDF failed to open document: {e}")
            raise ValueError("The uploaded file is not a valid PDF document or is corrupted.")

        if doc.is_encrypted:
            doc.close()
            raise ValueError("Password-protected or encrypted PDFs cannot be processed.")

        if doc.page_count == 0:
            doc.close()
            raise ValueError("The uploaded PDF document contains no pages.")

        page_texts = []
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            if text:
                page_texts.append(text)

        doc.close()
        return "\n\n--- Page Break ---\n\n".join(page_texts).strip()

    @staticmethod
    def _extract_from_docx(file_bytes: bytes) -> str:
        """
        Extract text from modern Word DOCX using python-docx.
        Extracts both regular paragraphs and table cells.
        """
        try:
            doc_file = io.BytesIO(file_bytes)
            doc = docx.Document(doc_file)
        except Exception as e:
            logger.error(f"python-docx failed to open DOCX: {e}")
            raise ValueError("The uploaded file is not a valid .docx document or is corrupted.")

        text_parts = []

        # Extract regular paragraphs
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                text_parts.append(text)

        # Extract table contents (resumes often use tables for education/experience layouts)
        for table in doc.tables:
            for row in table.rows:
                row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                # Deduplicate identical adjacent cells (due to merged cells)
                unique_cells = []
                for cell_txt in row_texts:
                    if not unique_cells or unique_cells[-1] != cell_txt:
                        unique_cells.append(cell_txt)
                if unique_cells:
                    text_parts.append(" | ".join(unique_cells))

        return "\n\n".join(text_parts).strip()

    @staticmethod
    def _extract_from_doc(file_bytes: bytes) -> str:
        """
        Extract text from legacy Word .doc files.
        Handles RTF disguised as .doc, binary CFBF via olefile, or string scanning.
        """
        # 1. Check if it's an RTF file saved as .doc
        if file_bytes.startswith(b"{\\rtf"):
            return DocumentExtractor._extract_from_rtf(file_bytes)

        # 2. Check if it's an OLE Compound Document (standard binary .doc)
        doc_stream = io.BytesIO(file_bytes)
        if olefile.isOleFile(doc_stream):
            try:
                ole = olefile.OleFileIO(doc_stream)
                if ole.exists("WordDocument"):
                    word_stream = ole.openstream("WordDocument").read()
                    ole.close()
                    # Extract readable ASCII and UTF-16 text chunks
                    extracted = DocumentExtractor._extract_strings_from_stream(word_stream)
                    if len(extracted) >= 30:
                        return extracted
                ole.close()
            except Exception as e:
                logger.warning(f"olefile extraction attempt encountered an issue: {e}")

        # 3. Fallback: extract printable strings from the binary payload
        fallback_text = DocumentExtractor._extract_strings_from_stream(file_bytes)
        if len(fallback_text) >= 30:
            return fallback_text

        raise ValueError(
            "Could not parse legacy Word (.doc) format. Please resave the file as a modern Word Document (.docx) or PDF (.pdf) and try again."
        )

    @staticmethod
    def _extract_from_rtf(file_bytes: bytes) -> str:
        """
        Simple plain text extractor for RTF documents.
        """
        text = file_bytes.decode("latin-1", errors="ignore")
        # Remove RTF control words
        clean = re.sub(r"\\[a-zA-Z]+(-?\d+)?\s?", " ", text)
        clean = re.sub(r"[{}]", "", clean)
        return clean.strip()

    @staticmethod
    def _extract_strings_from_stream(stream_bytes: bytes) -> str:
        """
        Extracts sequences of printable characters from binary streams.
        Supports ASCII and UTF-16 LE runs.
        """
        lines = []

        # Try UTF-16 LE string sequences (Word often encodes text as UTF-16)
        utf16_matches = re.findall(b"(?:[\x20-\x7e]\x00){4,}", stream_bytes)
        if utf16_matches:
            for match in utf16_matches:
                try:
                    decoded = match.decode("utf-16le", errors="ignore").strip()
                    if len(decoded) > 3 and not decoded.startswith("\\"):
                        lines.append(decoded)
                except Exception:
                    pass

        # Also find ASCII character runs
        ascii_matches = re.findall(rb"[\x20-\x7e\n\r\t]{5,}", stream_bytes)
        for match in ascii_matches:
            try:
                decoded = match.decode("latin-1", errors="ignore").strip()
                # Exclude binary headers or OLE metadata strings
                if len(decoded) > 4 and not re.search(r"^(MSWordDoc|Word\.Document|Root Entry|CompObj)", decoded):
                    lines.append(decoded)
            except Exception:
                pass

        # Join and deduplicate identical consecutive runs
        filtered = []
        for line in lines:
            if not filtered or filtered[-1] != line:
                filtered.append(line)

        return "\n".join(filtered)

    @staticmethod
    def _clean_text(text: str) -> str:
        """
        Cleans control characters, standardizes bullets, and strips duplicated blank lines.
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

        # Remove non-printable control characters (except newline, tab)
        text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

        return text.strip()

