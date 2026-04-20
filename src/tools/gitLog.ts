/**
 * Git log tool - shows commit history
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export interface GitLogInput {
  path?: string;
  n?: number;
  file?: string;
  author?: string;
  since?: string;
  until?: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
  subject: string;
}

export const gitLogSchema = {
  name: "git/log",
  description:
    "Get git commit history. Returns commits with hash, author, date, and message.",
  inputSchema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Repository path (default: current directory)",
      },
      n: {
        type: "number",
        description: "Number of commits to show (default: 10)",
      },
      file: {
        type: "string",
        description: "Show commits affecting this file only",
      },
      author: {
        type: "string",
        description: "Filter by author",
      },
      since: {
        type: "string",
        description: "Show commits since date (e.g., '1 week ago', '2024-01-01')",
      },
      until: {
        type: "string",
        description: "Show commits until date",
      },
    },
  },
};

export async function gitLog(input: GitLogInput): Promise<GitCommit[]> {
  const cwd = input.path ? path.resolve(input.path) : process.cwd();
  const limit = input.n ?? 10;

  const format =
    "%H|%h|%an|%aI|%s|%b%x00";

  const args: string[] = [
    "log",
    `--pretty=format:${format}`,
    "-n",
    String(limit),
  ];

  if (input.author) {
    args.push("--author", input.author);
  }

  if (input.since) {
    args.push("--since", input.since);
  }

  if (input.until) {
    args.push("--until", input.until);
  }

  if (input.file) {
    args.push("--", input.file);
  }

  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 5, // 5MB
    });

    const commits: GitCommit[] = [];
    const entries = stdout.split("\x00").filter(Boolean);

    for (const entry of entries) {
      const parts = entry.split("|");
      if (parts.length >= 5) {
        const [hash, shortHash, author, date, subject, ...bodyParts] = parts;
        const body = bodyParts.join("|").trim();

        commits.push({
          hash: hash!,
          shortHash: shortHash!,
          author: author!,
          date: date!,
          subject: subject!,
          message: body ? `${subject}\n\n${body}` : subject!,
        });
      }
    }

    return commits;
  } catch (error) {
    throw new Error(
      `Failed to get git log: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
