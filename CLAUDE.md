# ModelTools MCP Server

> A comprehensive MCP server with 18+ tools for AI coding assistants including document conversion, creation, vision analysis, file operations, and code/git utilities
> Repo: https://github.com/adelvillar1/modeltools

**Distribution via Docker (ghcr.io) and npm. See `CLAUDE.local.md` (gitignored) for package registry credentials and environment setup.**

---

## Hard rules (non-negotiable)

- Default publish target is `main` branch. Docker images and npm packages are published via GitHub Actions on tag push.
- Never commit sensitive credentials (API keys, tokens) to git. Use `CLAUDE.local.md` for local development secrets.
- Version bumps require updating `package.json`, creating a git tag (`vX.Y.Z`), and pushing to trigger automated publishing.
- Breaking changes to tool schemas require major version bump and README updates.
- Docker builds must pass CI before merging to `main`.

---

## Branch → environment topology

This project uses a **single-branch** workflow: `main` is both development and production.

| Branch | Environment | Auto-deploy | Notes |
|--------|-------------|-------------|-------|
| `main` | Production (Docker/npm) | On tag push | GitHub Actions publishes to ghcr.io and npm |
| PR branches | CI validation only | No | Docker build test only, no publish |

(Package registry credentials → `CLAUDE.local.md`)

---

## Where to find things

**Architecture**
- Tech stack & project structure → `docs/architecture/overview.md`
- Tool architecture → `docs/architecture/tools.md`
- MCP protocol implementation → `docs/architecture/mcp-protocol.md`

**Features**
- Document conversion tools → `docs/features/document-tools.md`
- Vision analysis → `docs/features/vision-analysis.md`
- Document creation → `docs/features/document-creation.md`
- File system operations → `docs/features/file-operations.md`
- Code & Git tools → `docs/features/code-git-tools.md`
- Execution & Web → `docs/features/execution-web.md`

**Pipeline / scripts**
- CI/CD pipeline → `docs/pipeline/README.md`
- Scripts catalog → `docs/scripts/README.md`

**Reference**
- Business context → `docs/BUSINESS-CONTEXT.md`
- Troubleshooting → `docs/TROUBLESHOOTING.md`
- State snapshot → `docs/STATE-SNAPSHOT.md`
- Recent sessions → `docs/recaps/`

---

## Contracts (the artifacts we treat as commitments)

Three layers of documentation act as contracts and must stay in sync as the codebase evolves. Updating them is part of finishing work, not a separate optional task.

| Contract | Location | Cadence | Purpose |
|----------|----------|---------|---------|
| **Plans** | `docs/plans/YYYY-MM-DD-<slug>.md` | Per feature | Pre-work contract: what we're building, acceptance criteria, linked docs to update |
| **Recaps** | `docs/recaps/SESSION-RECAP-YYYY-MM-DD.md` | Per session | Post-work journal: what shipped, criteria status, doc-update follow-ups |
| **Technical reference** | `TECHNICAL-DOCUMENTATION.md` (top level) | Per feature | Developer-onboarding contract: architecture, schema, API, deployment |
| **Functional reference** | `FUNCTIONAL-SPECIFICATIONS.md` (top level) | Per feature | User-flow contract: behavior, screens, edge cases |

**The cycle is**: draft a plan → implement → write a recap → update the technical and functional contracts. Each phase produces an artifact the next phase consumes. The recap skill prompts for the doc updates explicitly so they don't get skipped.

For trivial changes (typos, single-line fixes, dependency bumps), the cycle compresses: skip the plan, write a brief recap, no contract-doc updates needed. The methodology should match the size of the work.

---

## Common commands

```bash
# Development
npm install                          # Install dependencies
npm run build                        # Compile TypeScript
npm run dev                          # Watch mode

# Testing locally
export ANTHROPIC_API_KEY=your_key
node ./dist/index.js                 # Run MCP server locally

# Docker
docker build -t modeltools .         # Build image locally
docker run -i --rm -e ANTHROPIC_API_KEY modeltools

# Publishing (automated via GitHub Actions on tag push)
git tag v1.0.0
git push origin v1.0.0              # Triggers docker-publish.yml and npm-publish.yml
```

---

## Today's state

- 18 tools implemented and documented
- Published to GitHub Packages (ghcr.io) and npm
- Docker image includes all native dependencies (canvas, pdfkit)
- No open plans or known blockers

---

## Housekeeping protocol — keeps the docs tree from rotting

**You are responsible for keeping the docs tree current.** The whole point of slimming this file was to push reference material into topical files; that only works if those files stay fresh. After every session that changes something material, do the following before the user wraps up (or when writing the session recap):

1. **Identify which doc(s) the change touched.** Use the "Where to find things" map above. Changes to a feature → the matching `docs/features/*.md`. New script → `docs/scripts/README.md`. Connection-string change or rotated credential → `CLAUDE.local.md`. Schema change → `docs/architecture/database.md`.

2. **Update the relevant doc inline.** Don't leave the new fact only in a session recap. Recaps are journal entries; topical docs are the source of truth. A recap that says "added X" without updating the corresponding doc is a future drift bug.

3. **Stat tables go in `docs/STATE-SNAPSHOT.md`, not in topical docs.** Counts (entities, rows, users, etc.) belong in the dated snapshot file. Topical docs should describe *behavior*, not *current totals*. When refreshing the snapshot, **replace** it — do not append a new dated section.

4. **CLAUDE.md (this file) only gets updated when:**
   - A hard rule changes (add/remove from "Hard rules").
   - A new top-level docs area is added (add a pointer under "Where to find things").
   - The branch / environment topology changes.
   - The "Today's state" bullets need a refresh (every few sessions, or after a significant change).
   - **Never** add narrative changelogs, "Updated YYYY-MM-DD" markers, or feature deep-dives directly here. Those belong in topical docs + recaps.

5. **`CLAUDE.local.md` updates require care.** It's gitignored, so changes leave no trace in `git log`. When you add or rotate a credential or URL, **mention it in the session recap**: e.g. "Updated CLAUDE.local.md: rotated production DB password." That recap line is the only trace of the change in git history.

5a. **Contract docs (`TECHNICAL-DOCUMENTATION.md`, `FUNCTIONAL-SPECIFICATIONS.md`) must stay in sync with code.** When finishing work on a feature, update the matching section of the technical and functional contracts. The recap workflow prompts for this explicitly. Never declare a feature done while these contracts are stale — track the gap as a known debt in the recap if you must defer.

6. **Drift check — run before any session ends with non-trivial doc changes:**
   - `wc -l CLAUDE.md` → should still be ≤ ~300 lines. If it's growing, move content out.
   - `git status` → must NOT show `CLAUDE.local.md` as tracked or untracked (the gitignore should hide it).
   - For every new doc path mentioned in CLAUDE.md, confirm the file exists.

7. **When the user reports "Claude pointed at the wrong environment" or "asked me for a URL again":** that's a `CLAUDE.local.md` bug. Patch the local file so the next session has it. **Do not just answer the question — fix the source.**

8. **Quarterly hygiene pass** (or whenever this file feels heavy again):
   - Re-snapshot `docs/STATE-SNAPSHOT.md` from live data (replace, don't append).
   - Archive session recaps older than 90 days into `docs/recaps/archive/`.
   - Audit topical docs for `Updated YYYY-MM-DD` markers and remove them — git history is the source of truth for "when".
   - Audit topical docs for stat tables that crept in; move them to `STATE-SNAPSHOT.md`.

---

## Session protocol

**At the start** of any non-trivial session, run `/warmup`. It loads CLAUDE.md, the latest session recap, all active plans in `docs/plans/`, and the relevant feature/architecture docs for the upcoming task before answering anything.

**At the end** of any session that touched anything, run `/wrapup`. It verifies a recap exists, checks "Today's state" freshness, asks for disposition on uncommitted changes, transitions plan status, escalates deferred-update debts, runs drift checks, and drafts a next-session preview that injects into "Today's state" and the recap.

For trivial sessions (typo fix, dependency bump, one-line change), skip warmup and skip the recap, but **still run `/wrapup`** — even a one-line fix benefits from a 30-second drift check and uncommitted-work disposition.

Otherwise:

1. Read this file (auto-loaded).
2. Read `CLAUDE.local.md` if you need any DB URL, hosting service name, or credential (auto-loaded).
3. For task-specific context, read the relevant `docs/` file from the "Where to find things" map.
4. When changes are made, follow the housekeeping protocol above.

**The six-stage cycle**: `warmup → plan → build → recap → wrapup → next session`. Skills available: `/warmup`, `/plan-feature`, (build is yours), `/recap`, `/wrapup`. Skip `/plan-feature` for trivial work; skip `/warmup` and `/recap` for trivial sessions; **never skip `/wrapup`** if the session touched anything.
