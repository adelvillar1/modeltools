# ModelTools MCP Server — Technical Documentation

> **For:** Developer onboarding and reference
> **Repo:** https://github.com/adelvillar1/modeltools

This is the developer-onboarding contract — the document a new contributor reads to understand how the system is built. It's intentionally summary-style and links into `docs/` for deep dives. The two layers stay in sync as part of finishing a feature (see CLAUDE.md "Housekeeping protocol").

When a feature ships, update both the relevant `docs/` file (operational reference) **and** the matching section here (summary contract). The recap workflow prompts for both.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [API Reference](#5-api-reference)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Frontend Structure](#7-frontend-structure)
8. [Background Jobs / Pipelines](#8-background-jobs--pipelines)
9. [Deployment & Environments](#9-deployment--environments)
10. [Development Workflow](#10-development-workflow)
11. [Scripts Reference](#11-scripts-reference)
12. [Observability](#12-observability)

---

## 1. Project Overview

A comprehensive MCP (Model Context Protocol) server providing 18+ tools for AI coding assistants. The server enables any model that supports tool calling to perform document operations, vision analysis, file system operations, code/git tasks, and execution workflows.

Key differentiators:
- Universal compatibility with any MCP-supporting model (Claude, GPT-4, Kimi, etc.)
- Both document reading (conversion) and writing (creation) capabilities
- Docker and npm distribution for flexible deployment
- Modular tool architecture for easy extension

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Node.js with TypeScript |
| Language | TypeScript 5.4+ |
| Protocol | Model Context Protocol (MCP) SDK |
| Document Processing | pdfjs-dist, mammoth, xlsx, pdfkit, docx |
| Image Processing | canvas (node-canvas) |
| AI Integration | @anthropic-ai/sdk, ollama |
| Build | tsc (TypeScript compiler) |
| Distribution | Docker, npm |
| CI/CD | GitHub Actions |

For the full tech stack rationale, see [`docs/architecture/overview.md`](docs/architecture/overview.md).

## 3. Architecture

The server follows a modular tool-based architecture:

- **Entry Point** (`src/index.ts`): CLI entry, imports server
- **Server** (`src/server.ts`): MCP protocol handler, routes tool calls
- **Tool Registry** (`src/tools/index.ts`): Central registry of all 18 tools
- **Individual Tools** (`src/tools/*.ts`): Self-contained tool implementations

Data flow for a typical tool call:
1. MCP client (e.g., Claude Code) sends `CallToolRequest`
2. Server routes to appropriate handler via `toolHandlers` registry
3. Tool executes business logic (file I/O, AI API call, etc.)
4. Response serialized and returned via MCP protocol

Detailed architecture: [`docs/architecture/overview.md`](docs/architecture/overview.md)

## 4. Database Schema

This project has no database — it's a stateless tool server. All state is managed by the MCP client or external services (Anthropic API, Ollama, filesystem).

## 5. API Reference

- **Style**: MCP (Model Context Protocol) over stdio
- **Auth**: None (server-side, credentials in env vars)
- **Tools**: 18 tools across 6 categories (see README for full list)
- **Versioning**: Semantic versioning via npm/Docker tags

Detailed tool documentation: [`docs/features/*.md`](docs/features/)

## 6. Authentication & Authorization

No user-facing authentication. The server relies on:
- Environment variables for API keys (`ANTHROPIC_API_KEY`, `OLLAMA_API_KEY`)
- File system security (tools sandboxed to working directory)
- Shell execution guards (blocks sudo, warns on destructive commands)

## 7. Frontend Structure

No frontend — this is a headless MCP server communicating over stdio.

## 8. Background Jobs / Pipelines

GitHub Actions workflows:
- `docker-publish.yml`: Builds and publishes Docker image on tag push
- `npm-publish.yml`: Publishes npm package on tag push

Pipeline details: [`docs/pipeline/README.md`](docs/pipeline/README.md)

## 9. Deployment & Environments

| Branch | Environment | Auto-deploy | Notes |
|--------|-------------|-------------|-------|
| `main` | Production (Docker/npm) | On tag push | GitHub Actions publishes to ghcr.io and npm |
| PR branches | CI validation only | No | Docker build test only, no publish |

Connection strings live in `CLAUDE.local.md` (gitignored).

## 10. Development Workflow

The plan-build-recap-document cycle:

1. **Plan** — draft a plan at `docs/plans/YYYY-MM-DD-<slug>.md` with acceptance criteria. See [`docs/plans/README.md`](docs/plans/README.md).
2. **Build** — implement on feature branch, test locally.
3. **Recap** — write a session recap at `docs/recaps/SESSION-RECAP-YYYY-MM-DD.md` with criteria status.
4. **Document** — update this file and `FUNCTIONAL-SPECIFICATIONS.md` for the affected feature area. The recap workflow prompts for this.

The cycle compresses for trivial work — typos and one-line fixes don't need a plan or doc updates.

## 11. Scripts Reference

Most-used commands:

```bash
npm install              # Install dependencies
npm run build            # Compile TypeScript
npm run dev              # Watch mode for development
node ./dist/index.js     # Run locally (set env vars first)
```

Full catalog: [`docs/scripts/README.md`](docs/scripts/README.md)

## 12. Observability

- **Logging**: stderr output (MCP uses stdout for protocol)
- **Error tracking**: GitHub Issues
- **Metrics**: Docker pull counts, npm download stats
- **On-call**: None (community-supported)
