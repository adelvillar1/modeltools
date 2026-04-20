/**
 * Code search tool - file globbing and pattern matching for code
 */

import { glob } from "glob";
import { stat } from "fs/promises";
import path from "path";

export interface CodeSearchInput {
  pattern: string;
  path?: string;
  exclude?: string[];
}

export interface CodeSearchResult {
  files: string[];
  count: number;
}

export const codeSearchSchema = {
  name: "code/search",
  description:
    "Search for files by glob pattern. Returns matching file paths. " +
    "Supports ** wildcards for recursive matching.",
  inputSchema: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "Glob pattern (e.g., '**/*.ts', 'src/**/*.tsx')",
      },
      path: {
        type: "string",
        description: "Base directory (default: current directory)",
      },
      exclude: {
        type: "array",
        items: { type: "string" },
        description: "Patterns to exclude (e.g., ['node_modules/**', '*.test.ts'])",
      },
    },
    required: ["pattern"],
  },
};

export async function codeSearch(
  input: CodeSearchInput
): Promise<CodeSearchResult> {
  const searchPath = input.path ? path.resolve(input.path) : process.cwd();
  const pattern = path.join(searchPath, input.pattern);

  const exclude = input.exclude ?? ["node_modules/**", ".git/**", "dist/**", "build/**"];

  try {
    const files = await glob(pattern, {
      ignore: exclude,
      absolute: false,
      cwd: searchPath,
    });

    // Sort by modification time (newest first)
    const filesWithStats = await Promise.all(
      files.map(async (f) => {
        try {
          const stats = await stat(path.join(searchPath, f));
          return { file: f, mtime: stats.mtime };
        } catch {
          return { file: f, mtime: new Date(0) };
        }
      })
    );

    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return {
      files: filesWithStats.map((f) => f.file),
      count: files.length,
    };
  } catch (error) {
    throw new Error(
      `Glob search failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
