/**
 * Git diff tool - shows changes in the working tree
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export interface GitDiffInput {
  path?: string;
  target?: string;
  cached?: boolean;
  file?: string;
}

export const gitDiffSchema = {
  name: "git/diff",
  description:
    "Show git diff of changes in the working tree or staging area. " +
    "Can show diff for specific files or between commits.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Repository path (default: current directory)",
      },
      target: {
        type: "string",
        description: "Target to compare against (e.g., 'HEAD~1', 'main')",
      },
      cached: {
        type: "boolean",
        description: "Show staged changes instead of working tree (default: false)",
      },
      file: {
        type: "string",
        description: "Specific file to show diff for",
      },
    },
  },
};

export async function gitDiff(input: GitDiffInput): Promise<string> {
  const cwd = input.path ? path.resolve(input.path) : process.cwd();

  const args: string[] = ["diff"];

  if (input.cached) {
    args.push("--cached");
  }

  if (input.target) {
    args.push(input.target);
  }

  args.push("--no-color");

  if (input.file) {
    args.push("--", input.file);
  }

  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });

    return stdout || "No changes";
  } catch (error) {
    // git diff returns exit code 1 when there are no changes
    if (typeof error === "object" && error !== null && "code" in error && error.code === 1) {
      return "No changes";
    }

    throw new Error(
      `Failed to get git diff: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
