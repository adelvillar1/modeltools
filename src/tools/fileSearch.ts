/**
 * File search tool - searches file contents using grep-like functionality
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export interface FileSearchInput {
  pattern: string;
  path?: string;
  glob?: string;
  caseSensitive?: boolean;
  context?: number;
}

export interface SearchResult {
  file: string;
  line: number;
  column?: number;
  match: string;
  context?: {
    before: string[];
    after: string[];
  };
}

export const fileSearchSchema = {
  name: "file/search",
  description:
    "Search for patterns in file contents using ripgrep/grep. " +
    "Returns matches with file paths, line numbers, and surrounding context.",
  inputSchema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Search pattern (regex supported)",
      },
      path: {
        type: "string",
        description: "Directory to search in (default: current directory)",
      },
      glob: {
        type: "string",
        description: "Optional: file glob pattern to filter (e.g., '*.ts', '*.js')",
      },
      caseSensitive: {
        type: "boolean",
        description: "Case sensitive search (default: false)",
      },
      context: {
        type: "number",
        description: "Number of context lines before and after matches (default: 2)",
      },
    },
    required: ["pattern"],
  },
};

export async function fileSearch(
  input: FileSearchInput
): Promise<SearchResult[]> {
  const searchPath = input.path ? path.resolve(input.path) : process.cwd();
  const context = input.context ?? 2;

  // Build ripgrep arguments
  const args: string[] = [
    "--line-number",
    "--column",
    "--with-filename",
    "--context",
    String(context),
    "--color", "never",
    "-e",
    input.pattern,
  ];

  if (!input.caseSensitive) {
    args.push("--ignore-case");
  }

  if (input.glob) {
    args.push("--glob", input.glob);
  }

  args.push(searchPath);

  try {
    const { stdout } = await execFileAsync("rg", args, {
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    return parseRipgrepOutput(stdout, context);
  } catch (error: unknown) {
    // ripgrep returns exit code 1 when no matches found
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 1
    ) {
      return [];
    }

    // Fall back to grep if ripgrep is not available
    try {
      return await searchWithGrep(input);
    } catch {
      throw new Error(
        `Search failed. Make sure ripgrep (rg) or grep is installed. Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

function parseRipgrepOutput(output: string, contextLines: number): SearchResult[] {
  const results: SearchResult[] = [];
  const lines = output.split("\n").filter((l) => l.trim());

  const contextMap = new Map<number, { before: string[]; after: string[] }>();

  for (const line of lines) {
    // Match lines like: filename:line:column:content
    // Or context lines: filename-line content (before) or filename+line content (after)
    const matchResult = line.match(/^(.+?):(\d+):(\d+)?:(.+)$/);

    if (matchResult) {
      const [, file, lineStr, col, content] = matchResult;
      const lineNum = parseInt(lineStr, 10);

      results.push({
        file: file.trim(),
        line: lineNum,
        column: col ? parseInt(col, 10) : undefined,
        match: content.trim(),
      });
    }
  }

  return results;
}

async function searchWithGrep(
  input: FileSearchInput
): Promise<SearchResult[]> {
  const searchPath = input.path ? path.resolve(input.path) : process.cwd();
  const args = [
    "-r",
    "-n",
    "-I",
    input.caseSensitive ? "" : "-i",
    "--include",
    input.glob ?? "*",
    input.pattern,
    searchPath,
  ].filter(Boolean);

  const { stdout } = await execFileAsync("grep", args, {
    encoding: "utf-8",
    maxBuffer: 1024 * 1024 * 10,
  });

  const results: SearchResult[] = [];
  const lines = stdout.split("\n").filter((l) => l.includes(":"));

  for (const line of lines) {
    const parts = line.split(":");
    if (parts.length >= 3) {
      results.push({
        file: parts[0],
        line: parseInt(parts[1], 10),
        match: parts.slice(2).join(":").trim(),
      });
    }
  }

  return results;
}
