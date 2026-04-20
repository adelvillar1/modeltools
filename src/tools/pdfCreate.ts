/**
 * PDF creation tool - generates PDF documents from structured content
 */

import PDFDocument from "pdfkit";
import { Readable } from "stream";

export interface PdfCreateInput {
  title?: string;
  content: Array<
    | { type: "heading"; level: 1 | 2 | 3; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[]; ordered?: boolean }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "pagebreak" }
  >;
  options?: {
    pageSize?: "A4" | "Letter" | "Legal";
    margins?: { top: number; bottom: number; left: number; right: number };
    fontSize?: number;
  };
}

export interface PdfCreateOutput {
  data: string; // base64 encoded PDF
  filename: string;
  pageCount: number;
}

export const pdfCreateSchema = {
  name: "pdf/create",
  description:
    "Create a PDF document from structured content. Supports headings, paragraphs, lists, and tables. " +
    "Returns base64-encoded PDF data.",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Document title (appears on first page)",
      },
      content: {
        type: "array",
        description: "Document content blocks",
        items: {
          anyOf: [
            {
              type: "object",
              properties: {
                type: { const: "heading" },
                level: { type: "number", enum: [1, 2, 3] },
                text: { type: "string" },
              },
              required: ["type", "level", "text"],
            },
            {
              type: "object",
              properties: {
                type: { const: "paragraph" },
                text: { type: "string" },
              },
              required: ["type", "text"],
            },
            {
              type: "object",
              properties: {
                type: { const: "list" },
                items: { type: "array", items: { type: "string" } },
                ordered: { type: "boolean" },
              },
              required: ["type", "items"],
            },
            {
              type: "object",
              properties: {
                type: { const: "table" },
                headers: { type: "array", items: { type: "string" } },
                rows: {
                  type: "array",
                  items: { type: "array", items: { type: "string" } },
                },
              },
              required: ["type", "headers", "rows"],
            },
            {
              type: "object",
              properties: {
                type: { const: "pagebreak" },
              },
              required: ["type"],
            },
          ],
        },
      },
      options: {
        type: "object",
        properties: {
          pageSize: { type: "string", enum: ["A4", "Letter", "Legal"] },
          margins: {
            type: "object",
            properties: {
              top: { type: "number" },
              bottom: { type: "number" },
              left: { type: "number" },
              right: { type: "number" },
            },
          },
          fontSize: { type: "number" },
        },
      },
    },
    required: ["content"],
  },
};

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

export async function pdfCreate(input: PdfCreateInput): Promise<PdfCreateOutput> {
  const options = input.options || {};
  const margins = options.margins || { top: 72, bottom: 72, left: 72, right: 72 };

  const doc = new PDFDocument({
    size: options.pageSize || "Letter",
    margins,
  });

  // Collect PDF data
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  let pageCount = 1;
  doc.on("pageAdded", () => pageCount++);

  // Set default font size
  const baseFontSize = options.fontSize || 11;

  // Add title if provided
  if (input.title) {
    doc.fontSize(24).font("Helvetica-Bold").text(input.title, { align: "center" });
    doc.moveDown(2);
  }

  // Process content blocks
  for (const block of input.content) {
    switch (block.type) {
      case "heading": {
        const fontSize = block.level === 1 ? 18 : block.level === 2 ? 14 : 12;
        doc
          .fontSize(fontSize)
          .font("Helvetica-Bold")
          .text(block.text, { underline: block.level === 1 });
        doc.moveDown(0.5);
        break;
      }

      case "paragraph": {
        doc.fontSize(baseFontSize).font("Helvetica").text(block.text, { align: "left" });
        doc.moveDown(0.5);
        break;
      }

      case "list": {
        doc.fontSize(baseFontSize).font("Helvetica");
        block.items.forEach((item, index) => {
          const prefix = block.ordered ? `${index + 1}. ` : "• ";
          doc.text(prefix + item, { indent: 20 });
        });
        doc.moveDown(0.5);
        break;
      }

      case "table": {
        if (block.headers.length > 0 && block.rows.length > 0) {
          drawTable(doc, block.headers, block.rows, margins.left, margins.right);
        }
        doc.moveDown(0.5);
        break;
      }

      case "pagebreak": {
        doc.addPage();
        break;
      }
    }
  }

  doc.end();

  // Wait for PDF generation to complete
  await new Promise<void>((resolve, reject) => {
    doc.on("end", resolve);
    doc.on("error", reject);
  });

  const pdfBuffer = Buffer.concat(chunks);

  return {
    data: pdfBuffer.toString("base64"),
    filename: `${input.title?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "document"}.pdf`,
    pageCount,
  };
}

function drawTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  leftMargin: number,
  rightMargin: number
) {
  const pageWidth = doc.page.width;
  const usableWidth = pageWidth - leftMargin - rightMargin;
  const colWidth = usableWidth / headers.length;

  // Draw header row
  doc.fontSize(10).font("Helvetica-Bold");
  let x = leftMargin;
  headers.forEach((header, i) => {
    doc.text(header, x, doc.y, { width: colWidth - 10, align: "left" });
    x += colWidth;
  });

  doc.moveDown(0.3);

  // Draw separator line
  doc
    .moveTo(leftMargin, doc.y)
    .lineTo(pageWidth - rightMargin, doc.y)
    .stroke();
  doc.moveDown(0.2);

  // Draw data rows
  doc.fontSize(10).font("Helvetica");
  rows.forEach((row) => {
    x = leftMargin;
    row.forEach((cell, i) => {
      doc.text(cell || "", x, doc.y, { width: colWidth - 10, align: "left" });
      x += colWidth;
    });
    doc.moveDown(0.3);
  });
}
