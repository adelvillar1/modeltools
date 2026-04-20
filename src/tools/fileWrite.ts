/**
 * File write tool - writes content to files with safety checks
 */

import { writeFile, mkdir, access } from "fs/promises";
import path from "path";
import { dirname } from "path";

export interface FileWriteInput {
  path: string;
  content: string;
  createDirs?: boolean;
  append?: boolean;
}

export const fileWriteSchema = {
  name: "file/write",
  description:
    "Write content to a file. Can create parent directories if needed. " +
    "Use with caution - will overwrite existing files unless append is true.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Absolute path to the file to write",
      },
      content: {
        type: "string",
        description: "Content to write to the file",
      },
      createDirs: {
        type: "boolean",
        description: "Create parent directories if they don't exist (default: false)",
      },
      append: {
        type: "boolean",
        description: "Append to existing file instead of overwriting (default: false)",
      },
    },
    required: ["path", "content"],
  },
};

export async function fileWrite(input: FileWriteInput): Promise<string> {
  const filePath = path.resolve(input.path);

  // Security check - prevent writing outside working directory
  const cwd = process.cwd();
  if (!filePath.startsWith(cwd)) {
    throw new Error(
      `Security: Cannot write files outside the working directory. ` +
        `File: ${filePath}, Working directory: ${cwd}`
    );
  }

  // Check if file exists (for append mode)
  let existingContent = "";
  if (input.append) {
    try {
      const { readFile } = await import("fs/promises");
      existingContent = await readFile(filePath, "utf-8");
    } catch {
      // File doesn't exist, that's fine for append
    }
  }

  // Create parent directories if requested
  if (input.createDirs) {
    const parentDir = dirname(filePath);
    await mkdir(parentDir, { recursive: true });
  }

  // Write the file
  const contentToWrite = input.append ? existingContent + input.content : input.content;
  await writeFile(filePath, contentToWrite, "utf-8");

  const action = input.append ? "appended to" : "wrote";
  return `Successfully ${action} ${filePath}`;
}
