# ModelTools MCP Server

A comprehensive [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server providing 18+ tools for AI coding assistants. Works with any model that supports tool calling — Claude, GPT-4, Kimi, and more.

## Features

- **📄 Document Conversion** — Extract text or render PDF/DOCX/XLSX/TXT files as images
- **✍️ Document Creation** — Generate PDFs, Word docs, Excel spreadsheets, and HTML presentations
- **👁️ Vision Analysis** — Send images to Claude or Kimi for analysis
- **📁 File Operations** — Read, write, list, and search files and directories
- **🔍 Code & Git Tools** — Search code with glob patterns, check git status, view diffs and logs
- **⚡ Execution & Web** — Run shell commands with safety guards and fetch web content
- **🔧 Universal** — Any model with tool support can use these tools
- **🐳 Docker Ready** — Pre-built image with all native dependencies

---

## Quick Start

### Using Docker (Recommended)

```bash
# Run with Anthropic API key (for vision analysis)
docker run -i --rm \
  -e ANTHROPIC_API_KEY=your_key_here \
  ghcr.io/adelvillar/modeltools:latest

# Run with Ollama support (for Kimi models)
docker run -i --rm \
  -e OLLAMA_HOST=https://ollama.com \
  -e OLLAMA_API_KEY=your_key_here \
  ghcr.io/adelvillar/modeltools:latest

# Run with both providers
docker run -i --rm \
  -e ANTHROPIC_API_KEY=your_key_here \
  -e OLLAMA_HOST=https://ollama.com \
  -e OLLAMA_API_KEY=your_key_here \
  ghcr.io/adelvillar/modeltools:latest
```

### Using npm

```bash
npm install -g @adelvillar/modeltools

# Set environment variables
export ANTHROPIC_API_KEY=your_key_here

# Run
modeltools
```

### Building from Source

```bash
git clone https://github.com/adelvillar1/modeltools.git
cd modeltools
npm install
npm run build

# Run
export ANTHROPIC_API_KEY=your_key_here
node ./dist/index.js
```

---

## Configuration

### Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `ANTHROPIC_API_KEY` | Claude models | [Anthropic API key](https://console.anthropic.com/) |
| `OLLAMA_HOST` | Ollama models | Ollama server URL (e.g., `https://ollama.com`) |
| `OLLAMA_API_KEY` | Ollama cloud | Required for `ollama.com` cloud models |

At least one provider must be configured for vision analysis to work.

### Ollama Setup

**Ollama.com Cloud (recommended for Kimi K2.5):**
```bash
export OLLAMA_HOST="https://ollama.com"
export OLLAMA_API_KEY="your-key-here"
```

**Self-hosted Ollama (local):**
```bash
export OLLAMA_HOST="http://localhost:11434"
# No API key needed for local instances
```

### Claude Code Configuration

Add to `.claude/mcp.json` (or your project's MCP config):

```json
{
  "servers": {
    "modeltools": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "ANTHROPIC_API_KEY",
        "-e", "OLLAMA_HOST",
        "-e", "OLLAMA_API_KEY",
        "ghcr.io/adelvillar/modeltools:latest"
      ],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "OLLAMA_HOST": "https://ollama.com",
        "OLLAMA_API_KEY": "${OLLAMA_API_KEY}"
      }
    }
  }
}
```

Or use the npm package directly:

```json
{
  "servers": {
    "modeltools": {
      "command": "npx",
      "args": ["-y", "@adelvillar/modeltools"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

---

## Tools Reference

### Document Conversion

#### `document/convert`

Extract text from documents or render PDF pages as images.

**Input:**
```json
{
  "file": "/path/to/document.pdf",
  "operation": "text"
}
```

**Parameters:**
- `file` (string, required) — File path or base64 data URL
- `operation` (enum: `"text"` | `"images"`, required) — Extract text or render as images
- `pages` (number[], optional) — Specific page indices (0-indexed), default: all pages

**Examples:**

Extract text from a DOCX:
```json
{
  "file": "./report.docx",
  "operation": "text"
}
```

Render PDF pages to images:
```json
{
  "file": "./document.pdf",
  "operation": "images",
  "pages": [0, 1, 2]
}
```

**Supported formats:**
- PDF (text extraction and image rendering)
- DOCX/DOC (text extraction)
- XLSX/XLS (converted to CSV per sheet)
- TXT/MD (plain text)

---

### Vision Analysis

#### `vision/analyze`

Send images to vision-capable AI models for analysis.

**Input:**
```json
{
  "images": ["base64_encoded_image_or_data_url"],
  "prompt": "What do you see in this image?",
  "model": "claude-haiku"
}
```

**Parameters:**
- `images` (string[], required) — Array of base64-encoded images or data URLs
- `prompt` (string, required) — Question or instruction about the images
- `model` (enum: `"claude-haiku"` | `"claude-sonnet"` | `"kimi-k2.5"`, optional) — Model to use

**Models:**
- `claude-haiku` (default) — Fast, efficient
- `claude-sonnet` — More capable, slower
- `kimi-k2.5` — Via Ollama (requires `OLLAMA_HOST`)

**Examples:**

Extract text from a scanned document:
```json
{
  "images": ["data:image/png;base64,iVBORw0KGgoAAAANS..."],
  "prompt": "Extract all text from this scanned document"
}
```

Compare two images:
```json
{
  "images": ["base64_image_1", "base64_image_2"],
  "prompt": "List the differences between these two screenshots"
}
```

---

### Document Creation

#### `pdf/create`

Create PDF documents from structured content.

**Input:**
```json
{
  "title": "Quarterly Report",
  "content": [
    { "type": "heading", "level": 1, "text": "Executive Summary" },
    { "type": "paragraph", "text": "This quarter showed significant growth..." },
    { "type": "list", "items": ["Revenue up 25%", "New customers: 1,200"], "ordered": false }
  ],
  "options": {
    "pageSize": "Letter",
    "fontSize": 11
  }
}
```

**Content block types:**
- `heading` — `level: 1 | 2 | 3`, `text: string`
- `paragraph` — `text: string`
- `list` — `items: string[]`, `ordered?: boolean`
- `table` — `headers: string[]`, `rows: string[][]`
- `pagebreak` — Start a new page

**Output:** Base64-encoded PDF data with filename and page count.

---

#### `docx/create`

Create Microsoft Word documents.

**Input:**
```json
{
  "title": "Project Proposal",
  "content": [
    { "type": "heading", "level": 1, "text": "Overview" },
    { "type": "paragraph", "text": "This document outlines..." }
  ],
  "metadata": {
    "author": "Jane Doe",
    "subject": "Q4 Project Proposal",
    "keywords": ["project", "proposal", "Q4"]
  }
}
```

**Output:** Base64-encoded DOCX data with filename.

---

#### `xlsx/create`

Create Excel spreadsheets from structured data.

**Input:**
```json
{
  "sheets": [
    {
      "name": "Sales Data",
      "headers": ["Product", "Q1", "Q2", "Q3", "Q4"],
      "data": [
        { "Product": "Widget A", "Q1": 1000, "Q2": 1200, "Q3": 1100, "Q4": 1400 },
        { "Product": "Widget B", "Q1": 800, "Q2": 900, "Q3": 950, "Q4": 1000 }
      ]
    }
  ],
  "options": {
    "creator": "Sales Team",
    "company": "Acme Corp"
  }
}
```

**Output:** Base64-encoded XLSX data with filename, sheet count, and row count.

---

#### `markdown/convert`

Convert Markdown to various document formats.

**Input:**
```json
{
  "markdown": "# Hello World\n\nThis is a **test** document.",
  "format": "pdf",
  "title": "My Document"
}
```

**Formats:** `pdf`, `docx`, `html`, `text`

**Supported Markdown:**
- Headings (`#` to `######`)
- Paragraphs
- Lists (ordered and unordered)
- Code blocks (fenced with ```)
- Blockquotes (`>`)
- Horizontal rules (`---`, `===`, `***`)

---

#### `presentation/create`

Create HTML presentations (slide decks).

**Input:**
```json
{
  "title": "Product Launch",
  "slides": [
    { "type": "title", "title": "New Product Launch" },
    { "type": "section", "title": "Market Analysis" },
    { "type": "content", "title": "Key Features", "content": ["Feature 1", "Feature 2", "Feature 3"] }
  ],
  "theme": "corporate",
  "options": {
    "includeProgressBar": true,
    "includeSlideNumbers": true,
    "aspectRatio": "16:9"
  }
}
```

**Slide types:**
- `title` — Title slide with centered text
- `section` — Section divider slide
- `content` — Content slide with bullet list
- `image` — Image slide with optional title

**Themes:** `default`, `dark`, `minimal`, `corporate`

**Features:**
- Keyboard navigation (arrow keys, space)
- Progress bar
- Slide numbers
- Print-friendly CSS
- Responsive design

---

### File System Operations

#### `file/read`

Read file contents with optional offset/limit for large files.

**Input:**
```json
{
  "path": "/path/to/file.ts",
  "offset": 1,
  "limit": 50
}
```

**Security:** Can only read files within the working directory.

---

#### `file/write`

Write content to files.

**Input:**
```json
{
  "path": "/path/to/output.txt",
  "content": "Hello, World!",
  "createDirs": true,
  "append": false
}
```

**Security:** Can only write files within the working directory.

---

#### `file/list`

List directory contents with optional recursive and glob filtering.

**Input:**
```json
{
  "path": "./src",
  "pattern": "*.ts",
  "recursive": true
}
```

**Output:** Array of file entries with name, path, type, size, and modification time.

---

#### `file/search`

Search file contents using ripgrep (falls back to grep).

**Input:**
```json
{
  "pattern": "function.*test",
  "path": "./src",
  "glob": "*.ts",
  "caseSensitive": false,
  "context": 2
}
```

**Output:** Array of matches with file path, line number, column, and context lines.

---

### Code & Git

#### `code/search`

Find files by glob pattern.

**Input:**
```json
{
  "pattern": "**/*.tsx",
  "path": "./src",
  "exclude": ["node_modules/**", "*.test.tsx"]
}
```

**Output:** Array of matching file paths, sorted by modification time (newest first).

---

#### `git/status`

Get git repository status.

**Input:**
```json
{
  "path": "./my-repo"
}
```

**Output:**
```json
{
  "branch": "main",
  "ahead": 2,
  "behind": 0,
  "staged": [],
  "unstaged": [],
  "untracked": ["new-file.txt"],
  "isClean": false
}
```

---

#### `git/diff`

Show git diff of changes.

**Input:**
```json
{
  "path": "./my-repo",
  "cached": false,
  "target": "HEAD~1",
  "file": "src/index.ts"
}
```

---

#### `git/log`

Get commit history.

**Input:**
```json
{
  "path": "./my-repo",
  "n": 10,
  "author": "john",
  "since": "1 week ago"
}
```

---

### Execution & Web

#### `shell/exec`

Execute shell commands with safety guards.

**Input:**
```json
{
  "command": "npm run build",
  "cwd": "./my-project",
  "timeout": 60000,
  "env": { "NODE_ENV": "production" }
}
```

**Safety features:**
- Blocks `sudo` commands
- Warns on `rm -rf`
- 30-second default timeout (configurable)
- 100KB output limit

**Output:**
```json
{
  "stdout": "build output...",
  "stderr": "",
  "exitCode": 0,
  "truncated": false
}
```

---

#### `web/fetch`

Fetch web content.

**Input:**
```json
{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": { "Authorization": "Bearer token" },
  "maxLength": 50000
}
```

**Output:** Response status, headers, and content (truncated if over limit).

---

#### `system/ask`

Request interactive user input (requires client support).

**Input:**
```json
{
  "question": "Which file should I edit?",
  "options": ["index.ts", "server.ts", "utils.ts"]
}
```

**Note:** This tool requires MCP client support for interactive prompts. In Claude Code, use `AskUserQuestion` instead.

---

## Chaining Tools

The real power comes from chaining tools together:

### Example 1: Document Processing Pipeline

1. Convert PDF to images: `document/convert`
2. Analyze those images: `vision/analyze`
3. Create a summary document: `pdf/create`

### Example 2: Code Analysis

1. Search for test files: `code/search`
2. Read test content: `file/read`
3. Run tests: `shell/exec`
4. Create report: `markdown/convert`

### Example 3: Git Workflow

1. Check git status: `git/status`
2. View recent commits: `git/log`
3. Show current diff: `git/diff`
4. Create changelog: `docx/create`

---

## Architecture

### Tool Registry

Tools are modular and self-contained in `src/tools/`:

```
src/tools/
├── index.ts                 # Central registry
├── documentConvert.ts       # PDF/DOCX/XLSX reading
├── visionAnalyze.ts         # Claude/Kimi vision
├── pdfCreate.ts            # PDF generation
├── docxCreate.ts           # Word generation
├── xlsxCreate.ts           # Excel generation
├── markdownToDocument.ts   # Markdown conversion
├── presentationCreate.ts    # HTML presentations
├── fileRead.ts             # File reading
├── fileWrite.ts            # File writing
├── fileList.ts             # Directory listing
├── fileSearch.ts           # Content search
├── codeSearch.ts           # Glob patterns
├── gitStatus.ts            # Git status
├── gitDiff.ts              # Git diff
├── gitLog.ts               # Git log
├── shellExec.ts            # Shell execution
├── webFetch.ts             # HTTP requests
└── systemAsk.ts            # User prompts
```

### Adding a New Tool

1. Create `src/tools/myTool.ts` with schema and handler
2. Export schema and handler from `src/tools/index.ts`
3. Add to `toolDefinitions` and `toolHandlers` arrays

Example:

```typescript
// src/tools/myTool.ts
export const myToolSchema = {
  name: "my/tool",
  description: "Does something useful",
  inputSchema: {
    type: "object",
    properties: {
      input: { type: "string" }
    },
    required: ["input"]
  }
};

export async function myTool(input: { input: string }) {
  return { result: `Processed: ${input.input}` };
}
```

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run locally
node ./dist/index.js
```

### Requirements

- Node.js >= 20
- Native build dependencies for `canvas` and `pdfkit` (see Dockerfile for Alpine packages)
- Optional: `git`, `ripgrep` (rg) for enhanced search

---

## License

MIT — See [LICENSE](./LICENSE)

---

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Related

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)
- [Anthropic API](https://docs.anthropic.com/)
- [Ollama](https://ollama.com/)
