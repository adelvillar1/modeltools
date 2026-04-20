# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A comprehensive MCP (Model Context Protocol) server providing tools for AI coding assistants. Works with any model that supports tool calling.

## Common Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev

# Run locally
node ./dist/index.js
```

## Architecture

### Entry Point
- `src/index.ts` — CLI entry point
- `src/server.ts` — MCP server setup and tool routing

### Tool Structure
Tools are modular and self-contained in `src/tools/`:

**Document & Vision (Reading)**
- `documentConvert.ts` — PDF/DOCX/XLSX/TXT to text or images
- `visionAnalyze.ts` — Vision analysis via Claude or Kimi models

**Document Creation (Writing)**
- `pdfCreate.ts` — Create PDFs with headings, paragraphs, lists, tables
- `docxCreate.ts` — Create Word documents (.docx)
- `xlsxCreate.ts` — Create Excel spreadsheets from structured data
- `markdownToDocument.ts` — Convert Markdown to PDF/DOCX/HTML/text
- `presentationCreate.ts` — Create HTML presentations with keyboard navigation

**File System**
- `fileRead.ts` — Read files with offset/limit
- `fileWrite.ts` — Write files with directory creation
- `fileList.ts` — List directory contents, recursive, glob filtering
- `fileSearch.ts` — Content search using ripgrep/grep

**Code & Git**
- `codeSearch.ts` — File globbing (e.g., `**/*.ts`)
- `gitStatus.ts` — Repository status with staged/unstaged
- `gitDiff.ts` — Working tree and staged diffs
- `gitLog.ts` — Commit history with filtering

**Execution**
- `shellExec.ts` — Shell commands with safety guards and timeouts
- `webFetch.ts` — HTTP requests with response limiting
- `systemAsk.ts` — Interactive prompts (requires client support)

### Tool Registration
- `src/tools/index.ts` — Central registry exporting all tool definitions and handlers
- New tools add their schema to `toolDefinitions` and handler to `toolHandlers`

### Key Dependencies
- `@modelcontextprotocol/sdk` — MCP protocol
- `@anthropic-ai/sdk` — Claude API for vision
- `ollama` — Ollama API for Kimi models
- `pdfjs-dist/legacy/build/pdf.mjs` — Must use legacy build for Node
- `canvas` — Node-canvas for PDF rendering (native deps)
- `glob` — File pattern matching
- `mammoth` — DOCX parsing
- `xlsx` — Excel parsing/creation
- `pdfkit` — PDF creation
- `docx` — Word document creation

## Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `ANTHROPIC_API_KEY` | Claude models | Anthropic API key |
| `OLLAMA_HOST` | Ollama models | Ollama server URL |
| `OLLAMA_API_KEY` | Ollama cloud | Required for ollama.com |

## Distribution

- npm: `@adelvillar/document-vision-mcp`
- Docker: `ghcr.io/adelvillar/document-vision-mcp:latest`

## Notes

- ES modules (`"type": "module"`)
- Node.js >=20 required
- Canvas requires native build dependencies (see Dockerfile)
- Some tools require system binaries: `git`, `rg` (ripgrep), or `grep`
