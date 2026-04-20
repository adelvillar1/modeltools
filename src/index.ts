#!/usr/bin/env node
/**
 * Document Vision MCP Server
 *
 * Entry point for the MCP server.
 * Usage: document-vision-mcp
 *
 * Environment variables:
 * - ANTHROPIC_API_KEY: Required for Claude models
 * - OLLAMA_HOST: Required for Ollama models (e.g., https://ollama.com)
 * - OLLAMA_API_KEY: Optional, for authenticated Ollama instances
 */

import "./server.js";
