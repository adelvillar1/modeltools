# Architecture Overview

## System Architecture

ModelTools is a Model Context Protocol (MCP) server implemented in TypeScript with Node.js. It follows a modular tool-based architecture where each tool is self-contained and independently testable.

## Key Components

### Entry Point (`src/index.ts`)
- CLI entry point that imports and starts the server
- Minimal — just imports `./server.js`

### Server (`src/server.ts`)
- Creates MCP server instance with `@modelcontextprotocol/sdk`
- Sets up stdio transport for communication
- Routes `ListToolsRequest` and `CallToolRequest` to appropriate handlers
- Error handling with consistent error format

### Tool Registry (`src/tools/index.ts`)
- Central registry exporting all tool definitions and handlers
- `toolDefinitions`: Array of tool schemas for MCP discovery
- `toolHandlers`: Map of tool names to handler functions
- New tools register here by adding to both arrays

### Individual Tools (`src/tools/*.ts`)
Each tool is a self-contained module with:
- Schema definition (name, description, inputSchema)
- Handler function implementing the tool logic
- TypeScript interfaces for input/output types

## Tool Categories

### Document Operations
- **Reading**: `documentConvert.ts` — Uses pdfjs-dist, mammoth, xlsx
- **Creation**: `pdfCreate.ts`, `docxCreate.ts`, `xlsxCreate.ts` — Uses pdfkit, docx, xlsx
- **Markdown**: `markdownToDocument.ts` — Custom parser + delegates to creation tools

### Vision Analysis
- `visionAnalyze.ts` — Integrates with Anthropic SDK and Ollama

### File System
- `fileRead.ts`, `fileWrite.ts`, `fileList.ts`, `fileSearch.ts`
- Security sandbox: only operates within working directory

### Code & Git
- `codeSearch.ts` — Uses glob library
- `gitStatus.ts`, `gitDiff.ts`, `gitLog.ts` — Wraps git CLI

### Execution
- `shellExec.ts` — Child process with safety guards
- `webFetch.ts` — Native fetch API

## Dependencies

### Production
- `@modelcontextprotocol/sdk` — MCP protocol
- `@anthropic-ai/sdk` — Claude API
- `ollama` — Ollama API client
- `pdfjs-dist` — PDF parsing
- `pdfkit` — PDF generation
- `mammoth` — DOCX parsing
- `docx` — DOCX generation
- `xlsx` — Excel read/write
- `canvas` — Image rendering for PDF
- `glob` — File pattern matching

### Development
- `typescript` — TypeScript compiler
- `@types/node` — Node.js types
