---
name: check-if-documentation-needs-update
description: Check if code changes require documentation updates. Use before creating a PR or in CI to ensure new features, API changes, or significant code changes are properly documented. Analyzes the diff and suggests updates to README.md, CLAUDE.md, or files in /docs/.
---

# Documentation Update Check

Analyze code changes to determine if they require documentation updates.

## Environment Detection

Check if running in CI:

```bash
echo $GITHUB_ACTIONS
```

- **Local** (`GITHUB_ACTIONS` is empty): Open VS Code diffs, ask user for action
- **GitHub Actions** (`GITHUB_ACTIONS=true`): Post results as PR comment

## Documentation Locations

- `README.md` - Project overview, setup, quick start
- `CLAUDE.md` - AI assistant context, architecture, patterns
- `docs/` - Detailed documentation, guides, references

## Instructions

### Step 1: Get changes

**In GitHub Actions:**
```bash
gh pr diff $PR_NUMBER
```

**Local:**
```bash
git diff origin/develop...HEAD
```

If no commits yet, also check working directory:
```bash
git diff
git diff --cached
```

### Step 2: Read existing documentation

Read the relevant documentation files:

- `README.md`
- `CLAUDE.md`
- Files in `docs/` related to the changed areas

### Step 3: Analyze impact

**Requires documentation:**

- New features or user-facing functionality
- Changed behavior of existing documented features
- New or modified API endpoints / GraphQL resolvers
- New database tables or significant schema changes
- New configuration options or environment variables
- New services, workers, or architectural components

**Does NOT require documentation:**

- Bug fixes that don't change behavior
- Internal refactoring without API changes
- Test additions or modifications
- Dependency updates
- Code style or formatting changes

### Step 4: Report findings

**If NO documentation is needed:**

```
## Documentation Update Check

No documentation updates required.

**Reason:** [Brief explanation]
```

In GitHub Actions, post as PR comment and finish:
```bash
gh pr comment $PR_NUMBER --body "## Documentation Update Check

✅ No documentation updates required.

**Reason:** [Brief explanation]"
```

**If documentation IS needed**, continue to Step 5.

### Step 5: Present results

**In GitHub Actions:**

Post as PR comment with suggestions:

```bash
gh pr comment $PR_NUMBER --body "## Documentation Update Check

### Suggested documentation updates

[List of files that need updates with brief description of what to add]

### Suggested content

\`\`\`markdown
[Markdown content to add]
\`\`\`"
```

**Local:**

Create suggestions and open in VS Code:

```bash
mkdir -p /tmp/docs-suggestions
```

**For existing files:**
1. Read current content
2. Create modified version at `/tmp/docs-suggestions/[filename].suggested.md`
3. Open diff:
   ```bash
   code --diff [original-path] /tmp/docs-suggestions/[filename].suggested.md
   ```

**For new files:**
1. Create content at `/tmp/docs-suggestions/[filename].new.md`
2. Open:
   ```bash
   code /tmp/docs-suggestions/[filename].new.md
   ```

### Step 6: Summary (Local only)

```
## Documentation Update Check

### Suggested changes
- [Brief description of each suggestion]

### Files opened in VS Code
- [List of files]
```

### Step 7: User action (Local only)

Use AskUserQuestion:

- **Apply changes** - Copy suggested files to their final locations
- **Skip** - Do nothing

**Apply changes:**

```bash
cp /tmp/docs-suggestions/[filename].suggested.md [original-path]
```

## Writing Guidelines

- Focus on PURPOSE, not implementation details
- Use tables for field/option summaries
- Keep descriptions concise
- Reference related sections when relevant
- Match the existing documentation style
