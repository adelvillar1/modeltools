/**
 * Git status tool - shows repository status
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export interface GitStatusInput {
  path?: string;
}

export interface GitStatusResult {
  branch: string;
  ahead: number;
  behind: number;
  staged: Array<{ status: string; file: string }>;
  unstaged: Array<{ status: string; file: string }>;
  untracked: string[];
  isClean: boolean;
}

export const gitStatusSchema = {
  name: "git/status",
  description:
    "Get git repository status. Shows current branch, ahead/behind counts, " +
    "staged changes, unstaged changes, and untracked files.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Repository path (default: current directory)",
      },
    },
  },
};

export async function gitStatus(
  input: GitStatusInput
): Promise<GitStatusResult> {
  const cwd = input.path ? path.resolve(input.path) : process.cwd();

  try {
    // Get branch and ahead/behind info
    const { stdout: branchOutput } = await execFileAsync(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd, encoding: "utf-8" }
    );
    const branch = branchOutput.trim();

    let ahead = 0;
    let behind = 0;
    try {
      const { stdout: aheadBehind } = await execFileAsync(
        "git",
        ["rev-list", "--left-right", "--count", `${branch}...@{u}`],
        { cwd, encoding: "utf-8" }
      );
      const match = aheadBehind.trim().match(/(\d+)\s+(\d+)/);
      if (match) {
        ahead = parseInt(match[1], 10);
        behind = parseInt(match[2], 10);
      }
    } catch {
      // No upstream set
    }

    // Get status in porcelain format
    const { stdout: statusOutput } = await execFileAsync(
      "git",
      ["status", "--porcelain", "-b"],
      { cwd, encoding: "utf-8" }
    );

    const staged: Array<{ status: string; file: string }> = [];
    const unstaged: Array<{ status: string; file: string }> = [];
    const untracked: string[] = [];

    for (const line of statusOutput.split("\n").filter((l) => l.trim())) {
      if (line.startsWith("##")) continue;

      const indexStatus = line[0];
      const workTreeStatus = line[1];
      const file = line.slice(3).trim();

      if (indexStatus !== " " && indexStatus !== "?") {
        staged.push({ status: indexStatus, file });
      }
      if (workTreeStatus !== " " && workTreeStatus !== "?") {
        unstaged.push({ status: workTreeStatus, file });
      }
      if (indexStatus === "?") {
        untracked.push(file);
      }
    }

    return {
      branch,
      ahead,
      behind,
      staged,
      unstaged,
      untracked,
      isClean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
    };
  } catch (error) {
    throw new Error(
      `Failed to get git status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
