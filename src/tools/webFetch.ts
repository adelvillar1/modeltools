/**
 * Web fetch tool - fetches and optionally converts web content
 */

export interface WebFetchInput {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string;
  maxLength?: number;
}

export interface WebFetchResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  content: string;
  truncated?: boolean;
  contentType?: string;
}

export const webFetchSchema = {
  name: "web/fetch",
  description:
    "Fetch content from a URL. Supports custom headers, methods, and body. " +
    "Returns response body as text. Automatically truncates large responses.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "URL to fetch",
      },
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE"],
        description: "HTTP method (default: GET)",
      },
      headers: {
        type: "object",
        description: "Additional HTTP headers",
      },
      body: {
        type: "string",
        description: "Request body (for POST/PUT)",
      },
      maxLength: {
        type: "number",
        description: "Maximum response length (default: 100000)",
      },
    },
    required: ["url"],
  },
};

export async function webFetch(input: WebFetchInput): Promise<WebFetchResult> {
  const maxLength = input.maxLength ?? 100000;
  const url = input.url;

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error("URL must start with http:// or https://");
  }

  try {
    const response = await fetch(url, {
      method: input.method ?? "GET",
      headers: input.headers,
      body: input.body,
    });

    const contentType = response.headers.get("content-type") ?? undefined;
    const text = await response.text();
    const truncated = text.length > maxLength;

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers,
      content: text.slice(0, maxLength),
      truncated,
      contentType,
    };
  } catch (error) {
    throw new Error(
      `Fetch failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
