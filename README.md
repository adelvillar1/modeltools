# Document Vision MCP Server

An MCP (Model Context Protocol) server that provides document conversion and vision analysis capabilities. Works with any model that supports tool calling — Claude, GPT-4, Kimi, etc.

## Features

- **📄 Document Conversion**: Extract text from PDF, DOCX, XLSX/XLS files, or render PDF pages as images
- **✍️ Document Creation**: Create PDFs, Word docs, Excel spreadsheets, and HTML presentations
- **👁️ Vision Analysis**: Send images to vision-capable models (Claude Haiku/Sonnet, Kimi K2.5) for analysis
- **📁 File System**: Read, write, list, and search files and directories
- **🔍 Code & Git**: Search code, check git status, view diffs and logs
- **⚡ Shell & Web**: Execute commands and fetch web content safely
- **🔧 Universal**: Any model with tool support can call these tools
- **🐳 Docker-ready**: Pre-built image with all native dependencies

## Quick Start

### Using Docker (Recommended)

```bash
# Run with Anthropic API key only (Claude models)
docker run -i --rm \
  -e ANTHROPIC_API_KEY=your_key_here \
  ghcr.io/adelvillar/document-vision-mcp:latest

# Run with Ollama support (Kimi models) - requires API key for ollama.com
docker run -i --rm \
  -e OLLAMA_HOST=https://ollama.com \
  -e OLLAMA_API_KEY=your_key_here \
  ghcr.io/adelvillar/document-vision-mcp:latest

# Run with both (recommended)
docker run -i --rm \
  -e ANTHROPIC_API_KEY=your_key_here \
  -e OLLAMA_HOST=https://ollama.com \
  -e OLLAMA_API_KEY=your_key_here \
  ghcr.io/adelvillar/document-vision-mcp:latest

# Self-hosted Ollama (no API key needed)
docker run -i --rm \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  ghcr.io/adelvillar/document-vision-mcp:latest
```

### Using npm

```bash
npm install -g @adelvillar/document-vision-mcp

# Set environment variables
export ANTHROPIC_API_KEY=your_key_here

# Run
ocument-vision-mcp
```

### Building from Source

```bash
git clone https://github.com/adelvillar/document-vision-mcp.git
cd document-vision-mcp
npm install
npm run build

# Run
export ANTHROPIC_API_KEY=your_key_here
node ./dist/index.js
```

## Configuration

### Environment Variables

| Variable | Required For | Description |
|----------|--------------|-------------|
| `ANTHROPIC_API_KEY` | Claude models | Anthropic API key ([get one](https://console.anthropic.com/)) |
| `OLLAMA_HOST` | Ollama models | Ollama server URL |
| `OLLAMA_API_KEY` | Ollama cloud | Required for `ollama.com` cloud models (optional for self-hosted) |

At least one provider must be configured for vision analysis to work.

### Ollama Setup

**Ollama.com Cloud (recommended for Kimi K2.5):**
```bash
# Get your API key from https://ollama.com/settings/api
export OLLAMA_HOST="https://ollama.com"
export OLLAMA_API_KEY="your-key-here"
```

**Self-hosted Ollama (local):**
```bash
# No API key needed for local instances
export OLLAMA_HOST="http://localhost:11434"
# OLLAMA_API_KEY can be omitted
```

### Claude Code Configuration

Add to `.claude/mcp.json` (or your project's MCP config):

**Using Anthropic (Claude) models:**
```json
{
  "servers": {
    "document-vision": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "ANTHROPIC_API_KEY",
        "ghcr.io/adelvillar/document-vision-mcp:latest"
      ],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

**Using Ollama (Kimi) models:**
```json
{
  "servers": {
    "document-vision": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "OLLAMA_HOST",
        "-e", "OLLAMA_API_KEY",
        "ghcr.io/adelvillar/document-vision-mcp:latest"
      ],
      "env": {
        "OLLAMA_HOST": "https://ollama.com",
        "OLLAMA_API_KEY": "${OLLAMA_API_KEY}"
      }
    }
  }
}
```

**Using both (recommended for flexibility):**
```json
{
  "servers": {
    "document-vision": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "ANTHROPIC_API_KEY",
        "-e", "OLLAMA_HOST",
        "-e", "OLLAMA_API_KEY",
        "ghcr.io/adelvillar/document-vision-mcp:latest"
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
    "document-vision": {
      "command": "npx",
      "args": ["-y", "@adelvillar/document-vision-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

## Tools

### `document/convert`

Convert documents to text or render them as images.

**Input:**
```json
{
  "file": "/path/to/document.pdf",
  "operation": "text" // or "images"
}
```

**Operations:**
- `text`: Extract plain text (PDF, DOCX, XLSX, TXT)
- `images`: Render PDF pages as base64 PNG images

**Examples:**

Extract text from a DOCX file:
```json
{
  "file": "./report.docx",
  "operation": "text"
}
```

Convert PDF pages to images:
```json
{
  "file": "./document.pdf",
  "operation": "images",
  "pages": [0, 1, 2] // Optional: specific pages (0-indexed)
}
```

### `vision/analyze`

Send images to a vision-capable AI model for analysis.

**Input:**
```json
{
  "images": ["base64_encoded_image_or_data_url"],
  "prompt": "What do you see in this image?",
  "model": "claude-haiku" // Optional: defaults to claude-haiku
}
```

**Models:**
- `claude-haiku` (default): Fast, efficient
- `claude-sonnet`: More capable, slower
- `kimi-k2.5`: Via Ollama (requires `OLLAMA_HOST`)

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

Identify objects:
```json
{
  "images": ["base64_image"],
  "prompt": "What objects are visible in this image?"
}
```

### File Operations

- **`file/read`** — Read files with optional offset/limit for large files
- **`file/write`** — Write files with optional directory creation
- **`file/list`** — List directories with recursive and glob filtering
- **`file/search`** — Search file contents using ripgrep/grep

### Code & Git

- **`code/search`** — Find files by glob pattern (e.g., `**/*.ts`)
- **`git/status`** — Repository status with staged/unstaged counts
- **`git/diff`** — Show working tree or staged changes
- **`git/log`** — Commit history with filtering by author/date

### Execution

- **`shell/exec`** — Run shell commands with safety guards (blocks sudo, warns on rm -rf)
- **`web/fetch`** — HTTP requests with response limiting

### Document Creation

- **`pdf/create`** — Create PDFs with headings, paragraphs, lists, tables
- **`docx/create`** — Create Word documents (.docx)
- **`xlsx/create`** — Create Excel spreadsheets from structured data
- **`markdown/convert`** — Convert Markdown to PDF/DOCX/HTML/text
- **`presentation/create`** — Create HTML presentations with keyboard navigation

## Chaining Tools

The real power comes from chaining tools together:

**Example workflow:**
1. Convert PDF to images with `document/convert`
2. Analyze those images with `vision/analyze`

This allows any model to "read" PDF documents visually, even if the model doesn't have native PDF support.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
export ANTHROPIC_API_KEY=your_key
node ./dist/index.js
```

## License

MIT — See [LICENSE](./LICENSE)

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Related

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)
- [Anthropic API](https://docs.anthropic.com/)
- [Ollama](https://ollama.com/)
