/**
 * File read tool - reads file contents with optional offset/limit
 */

import { readFile, access } from "fs/promises";
import path from "path";

export interface FileReadInput {
  path: string;
  offset?: number;
  limit?: number;
}

export const fileReadSchema = {
  name: "file/read",
  description:
    "Read the contents of a file. Returns the file content as text. " +
    "Use offset and limit for reading specific portions of large files.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Absolute path to the file to read",
      },
      offset: {
        type: "number",
        description: "Optional: line number to start reading from (1-indexed)",
      },
      limit: {
        type: "number",
        description: "Optional: maximum number of lines to read",
      },
    },
    required: ["path"],
  },
};

export async function fileRead(input: FileReadInput): Promise<string> {
  const filePath = path.resolve(input.path);

  // Security check - prevent reading outside working directory
  const cwd = process.cwd();
  if (!filePath.startsWith(cwd)) {
    throw new Error(
      `Security: Cannot read files outside the working directory. ` +
        `File: ${filePath}, Working directory: ${cwd}`
    );
  }

  // Check file exists
  try {
    await access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  const offset = (input.offset ?? 1) - 1; // Convert 1-indexed to 0-indexed
  const limit = input.limit ?? lines.length;

  if (offset < 0 || offset >= lines.length) {
    throw new Error(
      `Invalid offset: ${input.offset}. File has ${lines.length} lines.`
    );
  }

  const selectedLines = lines.slice(offset, offset + limit);
  const result = selectedLines.join("\n");

  // Add truncation notice if we didn't read the whole file
  if (offset > 0 || limit < lines.length) {
    const totalRead = selectedLines.length;
    const totalLines = lines.length;
    return `--- Lines ${offset + 1}-${offset + totalRead} of ${totalLines} ---\n${result}`;
  }

  return result;
}
