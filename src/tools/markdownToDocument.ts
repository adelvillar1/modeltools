/**
 * Markdown to Document converter - converts markdown to PDF, DOCX, or HTML
 */

export interface MarkdownToDocumentInput {
  markdown: string;
  format: "pdf" | "docx" | "html" | "text";
  title?: string;
  options?: {
    includeToc?: boolean;
    theme?: "default" | "modern" | "minimal";
  };
}

export interface MarkdownToDocumentOutput {
  data: string; // base64 encoded or plain text
  filename: string;
  format: string;
}

export const markdownToDocumentSchema = {
  name: "markdown/convert",
  description:
    "Convert Markdown text to PDF, DOCX, HTML, or plain text. Supports basic Markdown syntax. " +
    "Returns base64-encoded document data or plain text.",
  inputSchema: {
    type: "object",
    properties: {
      markdown: {
        type: "string",
        description: "Markdown content to convert",
      },
      format: {
        type: "string",
        enum: ["pdf", "docx", "html", "text"],
        description: "Output format",
      },
      title: {
        type: "string",
        description: "Document title",
      },
      options: {
        type: "object",
        properties: {
          includeToc: { type: "boolean", description: "Include table of contents" },
          theme: { type: "string", enum: ["default", "modern", "minimal"] },
        },
      },
    },
    required: ["markdown", "format"],
  },
};

// Simple markdown parser - converts to structured content blocks
interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "code" | "blockquote" | "horizontalRule";
  level?: number;
  text?: string;
  items?: string[];
  ordered?: boolean;
  language?: string;
}

function parseMarkdown(markdown: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = markdown.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("#")) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        blocks.push({
          type: "heading",
          level: match[1].length,
          text: match[2],
        });
      }
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(---|===|\*\*\*|___)$/.test(line.trim())) {
      blocks.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "code",
        text: codeLines.join("\n"),
        language,
      });
      i++; // Skip closing ```
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].slice(1).trim());
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        items,
        ordered: false,
      });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        items,
        ordered: true,
      });
      continue;
    }

    // Paragraph (default)
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("#") && !/^[-*+]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: "paragraph",
      text: paraLines.join(" ").replace(/\s+/g, " ").trim(),
    });
  }

  return blocks;
}

function renderToHtml(blocks: ContentBlock[], title?: string): string {
  const parts: string[] = [];

  parts.push(`<!DOCTYPE html>`);
  parts.push(`<html>`);
  parts.push(`<head>`);
  parts.push(`<meta charset="UTF-8">`);
  if (title) parts.push(`<title>${escapeHtml(title)}</title>`);
  parts.push(`<style>`);
  parts.push(`
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin-bottom: 1em; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
    ul, ol { margin-bottom: 1em; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
  `);
  parts.push(`</style>`);
  parts.push(`</head>`);
  parts.push(`<body>`);

  if (title) {
    parts.push(`<h1>${escapeHtml(title)}</h1>`);
  }

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        parts.push(`<h${block.level}>${escapeHtml(block.text || "")}</h${block.level}>`);
        break;
      case "paragraph":
        parts.push(`<p>${escapeHtml(block.text || "").replace(/\n/g, "<br>")}</p>`);
        break;
      case "list":
        const tag = block.ordered ? "ol" : "ul";
        parts.push(`<${tag}>`);
        for (const item of block.items || []) {
          parts.push(`<li>${escapeHtml(item)}</li>`);
        }
        parts.push(`</${tag}>`);
        break;
      case "code":
        parts.push(`<pre><code>${escapeHtml(block.text || "")}</code></pre>`);
        break;
      case "blockquote":
        parts.push(`<blockquote><p>${escapeHtml(block.text || "")}</p></blockquote>`);
        break;
      case "horizontalRule":
        parts.push(`<hr>`);
        break;
    }
  }

  parts.push(`</body>`);
  parts.push(`</html>`);

  return parts.join("\n");
}

function renderToText(blocks: ContentBlock[], title?: string): string {
  const parts: string[] = [];

  if (title) {
    parts.push(title);
    parts.push("=".repeat(title.length));
    parts.push("");
  }

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        const underline = block.level === 1 ? "=" : block.level === 2 ? "-" : "~";
        parts.push(block.text || "");
        parts.push(underline.repeat((block.text || "").length));
        parts.push("");
        break;
      case "paragraph":
        parts.push(block.text || "");
        parts.push("");
        break;
      case "list":
        const prefix = block.ordered ? (i: number) => `${i + 1}. ` : () => "- ";
        (block.items || []).forEach((item, i) => {
          parts.push(prefix(i) + item);
        });
        parts.push("");
        break;
      case "code":
        parts.push("---");
        parts.push(block.text || "");
        parts.push("---");
        parts.push("");
        break;
      case "blockquote":
        parts.push("> " + (block.text || "").replace(/\n/g, "\n> "));
        parts.push("");
        break;
      case "horizontalRule":
        parts.push("-".repeat(40));
        parts.push("");
        break;
    }
  }

  return parts.join("\n").trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function markdownToDocument(
  input: MarkdownToDocumentInput
): Promise<MarkdownToDocumentOutput> {
  const blocks = parseMarkdown(input.markdown);

  switch (input.format) {
    case "html": {
      const html = renderToHtml(blocks, input.title);
      return {
        data: Buffer.from(html, "utf-8").toString("base64"),
        filename: `${(input.title || "document").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`,
        format: "html",
      };
    }

    case "text": {
      const text = renderToText(blocks, input.title);
      return {
        data: text,
        filename: `${(input.title || "document").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`,
        format: "text",
      };
    }

    case "pdf":
    case "docx": {
      // Convert blocks to the structured format used by pdf/docx creators
      const { pdfCreate } = await import("./pdfCreate.js");
      const { docxCreate } = await import("./docxCreate.js");

      const content = blocks.map((block) => {
        switch (block.type) {
          case "heading":
            return {
              type: "heading" as const,
              level: Math.min(Math.max((block.level || 1), 1), 3) as 1 | 2 | 3,
              text: block.text || "",
            };
          case "paragraph":
            return {
              type: "paragraph" as const,
              text: block.text || "",
            };
          case "list":
            return {
              type: "list" as const,
              items: block.items || [],
              ordered: block.ordered || false,
            };
          case "code":
            return {
              type: "paragraph" as const,
              text: block.text || "",
            };
          case "blockquote":
            return {
              type: "paragraph" as const,
              text: "> " + (block.text || ""),
            };
          case "horizontalRule":
            return {
              type: "paragraph" as const,
              text: "---",
            };
          default:
            return {
              type: "paragraph" as const,
              text: "",
            };
        }
      });

      if (input.format === "pdf") {
        const result = await pdfCreate({
          title: input.title,
          content,
        });
        return {
          data: result.data,
          filename: result.filename,
          format: "pdf",
        };
      } else {
        const result = await docxCreate({
          title: input.title,
          content,
        });
        return {
          data: result.data,
          filename: result.filename,
          format: "docx",
        };
      }
    }

    default:
      throw new Error(`Unsupported format: ${input.format}`);
  }
}
