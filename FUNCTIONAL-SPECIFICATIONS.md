# ModelTools MCP Server — Functional Specifications

> **For:** Product/UX reference and developer onboarding (user-flow contract)
> **Repo:** https://github.com/adelvillar1/modeltools

This is the user-flow contract — the document that describes what the system does from a user's perspective. It captures intended behavior, edge cases, and the rules that govern features. It's the answer to "what should this product DO?"

This file stays in sync with the implementation as part of finishing a feature (see CLAUDE.md "Housekeeping protocol"). When a feature ships or changes, update both [`docs/features/<name>.md`](docs/features/) (operational reference) and the matching section here (user-flow contract). The recap workflow prompts for both.

---

## Table of Contents

1. [Authentication & User Management](#1-authentication--user-management)
2. [Subscription & Payment](#2-subscription--payment)
3. [Core Features](#3-core-features)
4. [User Flows](#4-user-flows)
5. [Admin & Internal Tools](#5-admin--internal-tools)
6. [Notifications](#6-notifications)
7. [Edge Cases & Error States](#7-edge-cases--error-states)
8. [UI Consistency Standards](#8-ui-consistency-standards)

---

## 1. Authentication & User Management

No user-facing authentication — the MCP server is consumed by AI assistants, not end users directly. Tool access is controlled by:
- Environment variables for API credentials
- File system sandboxing (can only access files within working directory)
- Shell execution guards

## 2. Subscription & Payment

No billing — this is an open-source project distributed under MIT license.

## 3. Core Features

### Document Conversion (`document/convert`)

- **Entry point**: Tool call from MCP client
- **Inputs**: File path or base64 data URL, operation type (text/images), optional page selection
- **Validation**: File must exist or be valid base64; operation must be "text" or "images"
- **Behavior**: 
  - For "text": Extract plain text from PDF/DOCX/XLSX/TXT
  - For "images": Render PDF pages as PNG base64 images
- **Output**: Text content or array of base64-encoded images with metadata
- **Linked doc**: `docs/features/document-tools.md`

### Vision Analysis (`vision/analyze`)

- **Entry point**: Tool call from MCP client
- **Inputs**: Array of base64 images, prompt text, optional model selection
- **Validation**: At least one image required; prompt must be non-empty
- **Behavior**: Sends images to selected AI model (Claude Haiku/Sonnet or Kimi via Ollama) with prompt
- **Output**: Analysis text, model used, token usage stats
- **Linked doc**: `docs/features/vision-analysis.md`

### PDF Creation (`pdf/create`)

- **Entry point**: Tool call from MCP client
- **Inputs**: Title, array of content blocks (headings, paragraphs, lists, tables), optional page options
- **Validation**: Content array must not be empty; heading levels 1-3 only
- **Behavior**: Generates PDF document with specified layout and content
- **Output**: Base64-encoded PDF data, filename, page count
- **Linked doc**: `docs/features/document-creation.md`

### DOCX Creation (`docx/create`)

- **Entry point**: Tool call from MCP client
- **Inputs**: Title, content blocks, optional metadata (author, subject, keywords)
- **Validation**: Same as PDF creation
- **Behavior**: Generates Word document (.docx) with specified content
- **Output**: Base64-encoded DOCX data, filename
- **Linked doc**: `docs/features/document-creation.md`

### XLSX Creation (`xlsx/create`)

- **Entry point**: Tool call from MCP client
- **Inputs**: Array of sheets (name, data rows, optional headers), optional metadata
- **Validation**: Sheet names max 31 chars, no special characters; data must be array of objects
- **Behavior**: Generates Excel spreadsheet with multiple sheets
- **Output**: Base64-encoded XLSX data, filename, sheet count, total row count
- **Linked doc**: `docs/features/document-creation.md`

### File Operations (`file/read`, `file/write`, `file/list`, `file/search`)

- **Entry point**: Tool calls from MCP client
- **Inputs**: Paths, content, patterns as appropriate for each operation
- **Validation**: File paths must resolve within working directory (security sandbox)
- **Behavior**:
  - Read: Returns file content with optional offset/limit
  - Write: Creates/overwrites files, optional directory creation
  - List: Directory contents with optional recursive and glob filtering
  - Search: Content search using ripgrep/grep with context lines
- **Output**: File content, operation confirmation, file listings, or search results
- **Linked doc**: `docs/features/file-operations.md`

### Code & Git Tools (`code/search`, `git/status`, `git/diff`, `git/log`)

- **Entry point**: Tool calls from MCP client
- **Inputs**: Glob patterns, paths, filter options
- **Validation**: Path must be within working directory
- **Behavior**:
  - code/search: Find files matching glob pattern
  - git/status: Repository status with staged/unstaged/untracked
  - git/diff: Show working tree or staged changes
  - git/log: Commit history with filtering
- **Output**: File paths, git status objects, diff text, commit history
- **Linked doc**: `docs/features/code-git-tools.md`

### Execution & Web (`shell/exec`, `web/fetch`)

- **Entry point**: Tool calls from MCP client
- **Inputs**: Command string, URL, options
- **Validation**: 
  - Shell: Blocks sudo, warns on rm -rf, timeout limits
  - Web: URL must be HTTP/HTTPS
- **Behavior**:
  - shell/exec: Execute shell command with safety guards
  - web/fetch: HTTP request with response limiting
- **Output**: Command output (stdout/stderr/exit code) or HTTP response
- **Linked doc**: `docs/features/execution-web.md`

## 4. User Flows

### Setup Flow

1. User installs package: `npm install -g @adelvillar/modeltools` or uses Docker
2. User configures environment variables in `CLAUDE.local.md`
3. User adds MCP server config to Claude Code or other MCP client
4. MCP client discovers available tools via `ListToolsRequest`
5. AI assistant can now call any of the 18 tools

### Document Processing Flow

1. AI receives user request (e.g., "analyze this PDF")
2. AI calls `document/convert` with operation="images"
3. AI receives base64 images
4. AI calls `vision/analyze` with images and prompt
5. AI receives analysis and presents to user

### Code Analysis Flow

1. AI receives user request (e.g., "find all test files")
2. AI calls `code/search` with pattern="**/*.test.ts"
3. AI receives file paths
4. AI can read specific files with `file/read`
5. AI presents findings to user

## 5. Admin & Internal Tools

No admin dashboard — this is a headless server. Monitoring via:
- GitHub Actions logs for CI/CD
- Docker/npm registry metrics
- GitHub Issues for bug tracking

## 6. Notifications

No notifications — this is a stateless tool server.

## 7. Edge Cases & Error States

- **File not found**: Returns error with "File not found" message
- **Permission denied**: Returns error with "Security: Cannot access files outside working directory"
- **Invalid base64**: Returns error with "Invalid data URL format"
- **API key missing**: Returns error with specific missing variable name
- **Command timeout**: Shell execution returns exit code 1 with timeout message
- **Empty search results**: Returns empty array (not error)
- **Large file output**: Automatically truncated to prevent memory issues

## 8. UI Consistency Standards

No UI — this is a headless MCP server. All interaction is through:
- MCP protocol (stdio)
- Tool schemas (JSON)
- Documentation (Markdown)

Documentation standards:
- Clear input/output examples for each tool
- Consistent parameter descriptions
- Security warnings where applicable
