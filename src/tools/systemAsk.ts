/**
 * System ask tool - requests user input via MCP sampling
 *
 * Note: This tool uses the MCP sampling capability to ask the user questions.
 * It requires the client (e.g., Claude Code) to support the sampling feature.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export interface SystemAskInput {
  question: string;
  options?: string[];
  timeout?: number;
}

export const systemAskSchema = {
  name: "system/ask",
  description:
    "Ask the user a question. Useful for confirmation, clarification, or interactive prompts. " +
    "Optionally provide options for the user to choose from. " +
    "Note: Requires client support for MCP sampling.",
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question to ask the user",
      },
      options: {
        type: "array",
        items: { type: "string" },
        description: "Optional: predefined options for the user to choose from",
      },
      timeout: {
        type: "number",
        description: "Timeout in milliseconds (default: 60000)",
      },
    },
    required: ["question"],
  },
};

export async function systemAsk(input: SystemAskInput): Promise<string> {
  const question = input.options
    ? `${input.question}\n\nOptions: ${input.options.join(", ")}`
    : input.question;

  // Since MCP servers run in a separate process and cannot directly prompt the user,
  // we return a special marker that the client can interpret.
  // In Claude Code, this could trigger an interactive prompt.

  // For now, return a message indicating that interactive prompts require client support
  return JSON.stringify({
    type: "interactive_prompt",
    question: input.question,
    options: input.options,
    message: "This tool requires client-side support for interactive prompts. " +
             "In Claude Code, use AskUserQuestion instead of calling this tool.",
  }, null, 2);
}
