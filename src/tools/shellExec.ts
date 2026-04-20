/**
 * Shell execution tool - runs commands with safety guards
 */

import { exec, spawn } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export interface ShellExecInput {
  command: string;
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export interface ShellExecOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  truncated?: boolean;
}

// Dangerous commands that require extra confirmation
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i,
  />\s*\/dev\/null/i,
  /dd\s+if/i,
  /mkfs/i,
  /:\(\)\{[^}]*\};\s*:\|\s*:/i, // Fork bomb
  /curl.*\|.*sh/i,
  /wget.*\|.*sh/i,
];

// Commands that are always blocked
const BLOCKED_PATTERNS = [
  /sudo/i,
  /su\s+-/i,
];

export const shellExecSchema = {
  name: "shell/exec",
  description:
    "Execute a shell command. Returns stdout, stderr, and exit code. " +
    "Commands have safety guards - dangerous operations may be blocked. " +
    "Use for: git operations, build commands, file operations, etc.",
  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Shell command to execute",
      },
      cwd: {
        type: "string",
        description: "Working directory for the command (default: current directory)",
      },
      timeout: {
        type: "number",
        description: "Timeout in milliseconds (default: 30000)",
      },
      env: {
        type: "object",
        description: "Additional environment variables",
      },
    },
    required: ["command"],
  },
};

function isBlocked(command: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return `Command blocked for security: matches pattern ${pattern}`;
    }
  }
  return null;
}

function isDangerous(command: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}

export async function shellExec(input: ShellExecInput): Promise<ShellExecOutput> {
  const blockReason = isBlocked(input.command);
  if (blockReason) {
    return {
      stdout: "",
      stderr: blockReason,
      exitCode: 1,
    };
  }

  const warning = isDangerous(input.command)
    ? "⚠️  Warning: This command may be destructive. Proceed with caution.\n"
    : "";

  const cwd = input.cwd ? path.resolve(input.cwd) : process.cwd();
  const timeout = input.timeout ?? 30000;

  // Limit output to prevent memory issues
  const MAX_OUTPUT = 100 * 1024; // 100KB

  try {
    const { stdout, stderr } = await execAsync(input.command, {
      cwd,
      timeout,
      env: { ...process.env, ...input.env },
      maxBuffer: MAX_OUTPUT * 2,
    });

    const truncated =
      stdout.length > MAX_OUTPUT || stderr.length > MAX_OUTPUT;

    return {
      stdout: warning + stdout.slice(0, MAX_OUTPUT),
      stderr: stderr.slice(0, MAX_OUTPUT),
      exitCode: 0,
      truncated,
    };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
      killed?: boolean;
    };

    return {
      stdout: warning + (execError.stdout?.slice(0, MAX_OUTPUT) ?? ""),
      stderr:
        execError.killed
          ? `Command timed out after ${timeout}ms`
          : execError.stderr?.slice(0, MAX_OUTPUT) ?? "",
      exitCode: execError.code ?? 1,
    };
  }
}
