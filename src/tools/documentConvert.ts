/**
 * Document conversion tool - extracts text or renders pages as images.
 * Supports PDF, DOCX, XLSX/XLS, and plain text files.
 */

import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { createCanvas } from "canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFile } from "fs/promises";
import path from "path";

export const documentConvertSchema = {
  name: "document/convert",
  description:
    "Convert documents to text or images. Supports PDF, DOCX, XLSX/XLS, and plain text files. " +
    "For PDF files, can extract text or render pages as PNG images. " +
    "For Office documents, extracts text content.",
  inputSchema: {
    type: "object",
    properties: {
      file: {
        type: "string",
        description:
          "File path or base64 data URL (data:application/pdf;base64,...)",
      },
      operation: {
        type: "string",
        enum: ["text", "images"],
        description: "Extract text content or render pages as images",
      },
      pages: {
        type: "array",
        items: { type: "number" },
        description:
          "Optional: specific page indices (0-indexed). If omitted, processes all pages",
      },
    },
    required: ["file", "operation"],
  },
};

export interface DocumentConvertInput {
  file: string; // File path or base64 data URL
  operation: "text" | "images";
  pages?: number[]; // Specific pages (0-indexed). If empty, all pages
}

export interface DocumentConvertOutput {
  type: "text" | "images";
  content: string | string[]; // Text or array of base64 PNGs
  metadata: {
    filename?: string;
    pageCount?: number;
    processedPages?: number;
  };
}

// Supported MIME types
const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".txt": "text/plain",
  ".md": "text/markdown",
};

function getMimeType(filename: string): string | undefined {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext];
}

async function loadFile(file: string): Promise<Buffer> {
  // Check if it's a data URL
  if (file.startsWith("data:")) {
    const match = file.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL format");
    return Buffer.from(match[1], "base64");
  }
  // Otherwise treat as file path
  return readFile(file);
}

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel": {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sections = workbook.SheetNames.map((name) => {
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name]);
        return `--- Sheet: ${name} ---\n${csv}`;
      });
      return sections.join("\n\n");
    }

    case "application/pdf": {
      const data = new Uint8Array(buffer);
      const doc = await pdfjs.getDocument({ data }).promise;
      const texts: string[] = [];

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items
          .map((item: unknown) => {
            const it = item as { str?: string };
            return it.str ?? "";
          })
          .join("");
        texts.push(`--- Page ${i} ---\n${text}`);
      }

      return texts.join("\n\n");
    }

    case "text/plain":
    case "text/markdown":
      return buffer.toString("utf8");

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

async function renderToImages(
  buffer: Buffer,
  mimeType: string,
  pageIndices?: number[]
): Promise<string[]> {
  if (mimeType !== "application/pdf") {
    throw new Error(`Image rendering only supported for PDF files, got ${mimeType}`);
  }

  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({ data }).promise;
  const images: string[] = [];

  const SCALE = 1.5;
  const pagesToRender = pageIndices?.length
    ? pageIndices.filter((p) => p >= 0 && p < doc.numPages)
    : Array.from({ length: doc.numPages }, (_, i) => i);

  for (const pageIdx of pagesToRender) {
    const page = await doc.getPage(pageIdx + 1);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    images.push(canvas.toBuffer("image/png").toString("base64"));
  }

  return images;
}

export async function documentConvert(
  input: DocumentConvertInput
): Promise<DocumentConvertOutput> {
  const buffer = await loadFile(input.file);
  const filename = input.file.startsWith("data:") ? "document" : path.basename(input.file);
  const mimeType = getMimeType(filename);

  if (!mimeType) {
    throw new Error(`Cannot determine file type for: ${filename}`);
  }

  if (input.operation === "text") {
    const text = await extractText(buffer, mimeType);
    return {
      type: "text",
      content: text,
      metadata: {
        filename,
        pageCount: typeof text === "string" ? text.split("--- Page").length - 1 : 1,
      },
    };
  }

  if (input.operation === "images") {
    const images = await renderToImages(buffer, mimeType, input.pages);
    return {
      type: "images",
      content: images,
      metadata: {
        filename,
        pageCount: images.length,
        processedPages: images.length,
      },
    };
  }

  throw new Error(`Unknown operation: ${input.operation}`);
}
