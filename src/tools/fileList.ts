/**
 * File list tool - lists directory contents with optional filtering
 */

import { readdir, stat } from "fs/promises";
import path from "path";

export interface FileListInput {
  path?: string;
  pattern?: string;
  recursive?: boolean;
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory" | "symlink" | "other";
  size?: number;
  modified?: string;
}

export const fileListSchema = {
  name: "file/list",
  description:
    "List files and directories. Can filter by pattern and recurse into subdirectories.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Directory path to list (default: current directory)",
      },
      pattern: {
        type: "string",
        description: "Optional: glob pattern to filter results (e.g., '*.ts', '*.js')",
      },
      recursive: {
        type: "boolean",
        description: "List contents recursively (default: false)",
      },
    },
  },
};

function matchesPattern(fileName: string, pattern?: string): boolean {
  if (!pattern) return true;

  // Simple glob matching
  const regex = pattern
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");

  return new RegExp(regex).test(fileName);
}

async function listDirectory(
  dirPath: string,
  pattern?: string,
  recursive?: boolean,
  basePath?: string
): Promise<FileEntry[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const results: FileEntry[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;

    let type: FileEntry["type"] = "other";
    if (entry.isFile()) type = "file";
    else if (entry.isDirectory()) type = "directory";
    else if (entry.isSymbolicLink()) type = "symlink";

    let size: number | undefined;
    let modified: string | undefined;

    if (entry.isFile()) {
      try {
        const stats = await stat(fullPath);
        size = stats.size;
        modified = stats.mtime.toISOString();
      } catch {
        // Ignore stat errors
      }
    }

    if (entry.isFile() && matchesPattern(entry.name, pattern)) {
      results.push({
        name: entry.name,
        path: relativePath,
        type,
        size,
        modified,
      });
    } else if (entry.isDirectory()) {
      results.push({
        name: entry.name,
        path: relativePath,
        type,
      });

      if (recursive) {
        const subEntries = await listDirectory(
          fullPath,
          pattern,
          true,
          relativePath
        );
        results.push(...subEntries);
      }
    }
  }

  return results;
}

export async function fileList(
  input: FileListInput
): Promise<FileEntry[]> {
  const targetPath = input.path ? path.resolve(input.path) : process.cwd();

  try {
    return await listDirectory(targetPath, input.pattern, input.recursive);
  } catch (error) {
    throw new Error(
      `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
