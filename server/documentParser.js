import mammoth from "mammoth";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".json", ".csv"];

export async function parseDocument({ filename, mimeType, buffer, text }) {
  const normalizedFilename = String(filename || "document.txt");
  const normalizedMimeType = String(mimeType || "text/plain").toLowerCase();
  const sourceBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(String(text || ""));

  let extractedText;

  if (isTextDocument(normalizedFilename, normalizedMimeType)) {
    extractedText = String(text ?? sourceBuffer.toString("utf8"));
  } else if (isPdfDocument(normalizedFilename, normalizedMimeType)) {
    const parsed = await pdfParse(sourceBuffer);
    extractedText = parsed.text;
  } else if (isDocxDocument(normalizedFilename, normalizedMimeType)) {
    const parsed = await mammoth.extractRawText({ buffer: sourceBuffer });
    extractedText = parsed.value;
  } else {
    throw new Error("Unsupported document type. Upload TXT, Markdown, PDF, or DOCX.");
  }

  const cleanText = String(extractedText || "").trim();
  if (!cleanText) {
    throw new Error("No text could be extracted from this document.");
  }

  return {
    filename: normalizedFilename,
    mimeType: normalizedMimeType,
    text: cleanText,
  };
}

function isTextDocument(filename, mimeType) {
  return mimeType.startsWith("text/") || TEXT_EXTENSIONS.some((extension) => filename.toLowerCase().endsWith(extension));
}

function isPdfDocument(filename, mimeType) {
  return mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
}

function isDocxDocument(filename, mimeType) {
  return (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.toLowerCase().endsWith(".docx")
  );
}
