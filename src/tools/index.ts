/**
 * Tool registry - exports all tool definitions and handlers
 */

import { documentConvert, documentConvertSchema } from "./documentConvert.js";
import { visionAnalyze, visionAnalyzeSchema } from "./visionAnalyze.js";
import { fileRead, fileReadSchema } from "./fileRead.js";
import { fileWrite, fileWriteSchema } from "./fileWrite.js";
import { fileList, fileListSchema } from "./fileList.js";
import { fileSearch, fileSearchSchema } from "./fileSearch.js";
import { shellExec, shellExecSchema } from "./shellExec.js";
import { codeSearch, codeSearchSchema } from "./codeSearch.js";
import { gitStatus, gitStatusSchema } from "./gitStatus.js";
import { gitDiff, gitDiffSchema } from "./gitDiff.js";
import { gitLog, gitLogSchema } from "./gitLog.js";
import { webFetch, webFetchSchema } from "./webFetch.js";
import { systemAsk, systemAskSchema } from "./systemAsk.js";
// Document creation tools
import { pdfCreate, pdfCreateSchema } from "./pdfCreate.js";
import { docxCreate, docxCreateSchema } from "./docxCreate.js";
import { xlsxCreate, xlsxCreateSchema } from "./xlsxCreate.js";
import { markdownToDocument, markdownToDocumentSchema } from "./markdownToDocument.js";
import { presentationCreate, presentationCreateSchema } from "./presentationCreate.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
}

export interface ToolHandler {
  (args: unknown): Promise<{
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  }>;
}

export const toolDefinitions: ToolDefinition[] = [
  documentConvertSchema,
  visionAnalyzeSchema,
  fileReadSchema,
  fileWriteSchema,
  fileListSchema,
  fileSearchSchema,
  shellExecSchema,
  codeSearchSchema,
  gitStatusSchema,
  gitDiffSchema,
  gitLogSchema,
  webFetchSchema,
  systemAskSchema,
  // Document creation
  pdfCreateSchema,
  docxCreateSchema,
  xlsxCreateSchema,
  markdownToDocumentSchema,
  presentationCreateSchema,
];

export const toolHandlers: Record<string, ToolHandler> = {
  "document/convert": async (args) => {
    const result = await documentConvert(args as Parameters<typeof documentConvert>[0]);
    return {
      content: [
        {
          type: "text",
          text:
            result.type === "text"
              ? (result.content as string)
              : JSON.stringify(
                  {
                    type: "images",
                    count: (result.content as string[]).length,
                    images: result.content,
                    metadata: result.metadata,
                  },
                  null,
                  2
                ),
        },
      ],
    };
  },
  "vision/analyze": async (args) => {
    const result = await visionAnalyze(args as Parameters<typeof visionAnalyze>[0]);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
  "file/read": async (args) => {
    const result = await fileRead(args as Parameters<typeof fileRead>[0]);
    return { content: [{ type: "text", text: result }] };
  },
  "file/write": async (args) => {
    const result = await fileWrite(args as Parameters<typeof fileWrite>[0]);
    return { content: [{ type: "text", text: result }] };
  },
  "file/list": async (args) => {
    const result = await fileList(args as Parameters<typeof fileList>[0]);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
  "file/search": async (args) => {
    const result = await fileSearch(args as Parameters<typeof fileSearch>[0]);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
  "shell/exec": async (args) => {
    const result = await shellExec(args as Parameters<typeof shellExec>[0]);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
  "code/search": async (args) => {
    const result = await codeSearch(args as Parameters<typeof codeSearch>[0]);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
  "git/status": async (args) => {
    const result = await gitStatus(args as Parameters<typeof gitStatus>[0]);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
  "git/diff": async (args) => {
    const result = await gitDiff(args as Parameters<typeof gitDiff>[0]);
    return { content: [{ type: "text", text: result }] };
  },
  "git/log": async (args) => {
    const result = await gitLog(args as Parameters<typeof gitLog>[0]);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
  "web/fetch": async (args) => {
    const result = await webFetch(args as Parameters<typeof webFetch>[0]);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
  "system/ask": async (args) => {
    const result = await systemAsk(args as Parameters<typeof systemAsk>[0]);
    return { content: [{ type: "text", text: result }] };
  },
  // Document creation handlers
  "pdf/create": async (args) => {
    const result = await pdfCreate(args as Parameters<typeof pdfCreate>[0]);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...result,
              data: `[base64:${result.data.slice(0, 50)}...] (${Math.round(result.data.length * 0.75)} bytes)`,
            },
            null,
            2
          ),
        },
      ],
    };
  },
  "docx/create": async (args) => {
    const result = await docxCreate(args as Parameters<typeof docxCreate>[0]);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...result,
              data: `[base64:${result.data.slice(0, 50)}...] (${Math.round(result.data.length * 0.75)} bytes)`,
            },
            null,
            2
          ),
        },
      ],
    };
  },
  "xlsx/create": async (args) => {
    const result = await xlsxCreate(args as Parameters<typeof xlsxCreate>[0]);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...result,
              data: `[base64:${result.data.slice(0, 50)}...] (${Math.round(result.data.length * 0.75)} bytes)`,
            },
            null,
            2
          ),
        },
      ],
    };
  },
  "markdown/convert": async (args) => {
    const result = await markdownToDocument(args as Parameters<typeof markdownToDocument>[0]);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...result,
              data:
                result.format === "text"
                  ? result.data
                  : `[base64:${result.data.slice(0, 50)}...] (${Math.round(result.data.length * 0.75)} bytes)`,
            },
            null,
            2
          ),
        },
      ],
    };
  },
  "presentation/create": async (args) => {
    const result = await presentationCreate(args as Parameters<typeof presentationCreate>[0]);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ...result,
              data: `[base64:${result.data.slice(0, 50)}...] (${Math.round(result.data.length * 0.75)} bytes)`,
            },
            null,
            2
          ),
        },
      ],
    };
  },
};
