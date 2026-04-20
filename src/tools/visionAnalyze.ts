/**
 * Vision analysis tool - sends images to vision-capable models.
 * Supports Anthropic (Claude) and Ollama (Kimi) models.
 */

import Anthropic from "@anthropic-ai/sdk";
import { Ollama } from "ollama";

export const visionAnalyzeSchema = {
  name: "vision/analyze",
  description:
    "Send images to a vision-capable AI model for analysis. " +
    "Can extract text, identify objects, compare images, answer questions about visual content, etc.",
  inputSchema: {
    type: "object",
    properties: {
      images: {
        type: "array",
        items: { type: "string" },
        description:
          "Array of base64-encoded images or data URLs (data:image/png;base64,...)",
      },
      prompt: {
        type: "string",
        description:
          "Question or instruction about the images. Examples: 'Extract all text', 'What do you see?', 'Compare these two images'",
      },
      model: {
        type: "string",
        enum: ["claude-haiku", "claude-sonnet", "kimi-k2.5"],
        description: "Vision model to use (default: claude-haiku)",
      },
    },
    required: ["images", "prompt"],
  },
};

export interface VisionAnalyzeInput {
  images: string[]; // Base64-encoded images or data URLs
  prompt: string; // Question/instruction about the images
  model?: "claude-haiku" | "claude-sonnet" | "kimi-k2.5";
}

export interface VisionAnalyzeOutput {
  analysis: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Model configurations
const MODEL_CONFIGS = {
  "claude-haiku": {
    provider: "anthropic" as const,
    modelId: "claude-haiku-4-5-20251001",
    maxTokens: 4096,
  },
  "claude-sonnet": {
    provider: "anthropic" as const,
    modelId: "claude-sonnet-4-6",
    maxTokens: 4096,
  },
  "kimi-k2.5": {
    provider: "ollama" as const,
    modelId: "kimi-k2.5:cloud",
  },
};

type ModelKey = keyof typeof MODEL_CONFIGS;

async function analyzeWithAnthropic(
  images: string[],
  prompt: string,
  modelId: string,
  maxTokens: number
): Promise<VisionAnalyzeOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable not set");
  }

  const client = new Anthropic({ apiKey });

  // Clean base64 strings (remove data URL prefix if present)
  const cleanImages = images.map((img) => {
    const match = img.match(/^data:image\/[^;]+;base64,(.+)$/);
    return match ? match[1] : img;
  });

  const content: Anthropic.ContentBlockParam[] = [
    ...cleanImages.map(
      (image): Anthropic.ContentBlockParam => ({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: "image/png" as const,
          data: image,
        },
      })
    ),
    { type: "text" as const, text: prompt },
  ];

  const response = await client.messages.create({
    model: modelId,
    max_tokens: maxTokens,
    messages: [{ role: "user", content }],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  return {
    analysis: text,
    model: modelId,
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    },
  };
}

async function analyzeWithOllama(
  images: string[],
  prompt: string,
  modelId: string
): Promise<VisionAnalyzeOutput> {
  const host = process.env.OLLAMA_HOST;
  const apiKey = process.env.OLLAMA_API_KEY;

  if (!host) {
    throw new Error("OLLAMA_HOST environment variable not set");
  }

  const client = new Ollama({
    host,
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });

  // Clean base64 strings
  const cleanImages = images.map((img) => {
    const match = img.match(/^data:image\/[^;]+;base64,(.+)$/);
    return match ? match[1] : img;
  });

  const response = await client.chat({
    model: modelId,
    messages: [
      {
        role: "user",
        content: prompt,
        images: cleanImages,
      },
    ],
    // Disable thinking mode for Kimi (saves time)
    options: { temperature: 0.7 },
  } as Parameters<typeof client.chat>[0]);

  return {
    analysis: response.message.content ?? "",
    model: modelId,
  };
}

export async function visionAnalyze(
  input: VisionAnalyzeInput
): Promise<VisionAnalyzeOutput> {
  const modelKey = (input.model ?? "claude-haiku") as ModelKey;
  const config = MODEL_CONFIGS[modelKey];

  if (!config) {
    throw new Error(
      `Unknown model: ${input.model}. Supported: ${Object.keys(MODEL_CONFIGS).join(", ")}`
    );
  }

  if (config.provider === "anthropic") {
    return analyzeWithAnthropic(
      input.images,
      input.prompt,
      config.modelId,
      config.maxTokens
    );
  }

  return analyzeWithOllama(input.images, input.prompt, config.modelId);
}
