/**
 * DOCX creation tool - generates Word documents from structured content
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  WidthType,
  Packer,
} from "docx";

export interface DocxCreateInput {
  title?: string;
  content: Array<
    | { type: "heading"; level: 1 | 2 | 3; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; items: string[]; ordered?: boolean }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "pagebreak" }
  >;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

export interface DocxCreateOutput {
  data: string; // base64 encoded DOCX
  filename: string;
}

export const docxCreateSchema = {
  name: "docx/create",
  description:
    "Create a Word (.docx) document from structured content. Supports headings, paragraphs, lists, and tables. " +
    "Returns base64-encoded DOCX data.",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Document title",
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
      metadata: {
        type: "object",
        properties: {
          author: { type: "string" },
          subject: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
        },
      },
    },
    required: ["content"],
  },
};

export async function docxCreate(input: DocxCreateInput): Promise<DocxCreateOutput> {
  const children: Paragraph[] = [];

  // Add title if provided
  if (input.title) {
    children.push(
      new Paragraph({
        text: input.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      })
    );
    children.push(new Paragraph({ text: "" })); // Empty line
  }

  // Process content blocks
  for (const block of input.content) {
    switch (block.type) {
      case "heading": {
        children.push(
          new Paragraph({
            text: block.text,
            heading:
              block.level === 1
                ? HeadingLevel.HEADING_1
                : block.level === 2
                  ? HeadingLevel.HEADING_2
                  : HeadingLevel.HEADING_3,
          })
        );
        break;
      }

      case "paragraph": {
        children.push(new Paragraph({ text: block.text }));
        break;
      }

      case "list": {
        block.items.forEach((item, index) => {
          const prefix = block.ordered ? `${index + 1}. ` : "• ";
          children.push(
            new Paragraph({
              text: prefix + item,
              indent: { left: 720 },
            })
          );
        });
        break;
      }

      case "pagebreak": {
        children.push(
          new Paragraph({
            text: "",
            pageBreakBefore: true,
          })
        );
        break;
      }

      case "table": {
        // Tables are handled separately and added after other children
        break;
      }
    }
  }

  const doc = new Document({
    creator: input.metadata?.author || "MCP Document Creator",
    title: input.title || "Document",
    subject: input.metadata?.subject,
    keywords: input.metadata?.keywords?.join(", "),
    sections: [
      {
        children: [
          ...children,
          ...(input.content
            .filter((b): b is { type: "table"; headers: string[]; rows: string[][] } => b.type === "table")
            .map((tableBlock) => createTable(tableBlock.headers, tableBlock.rows))),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return {
    data: buffer.toString("base64"),
    filename: `${input.title?.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "document"}.docx`,
  };
}

function createTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                }),
              ],
            }),
          ],
          width: {
            size: 100 / headers.length,
            type: WidthType.PERCENTAGE,
          },
        })
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [new Paragraph(cell || "")],
              width: {
                size: 100 / headers.length,
                type: WidthType.PERCENTAGE,
              },
            })
        ),
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });
}
