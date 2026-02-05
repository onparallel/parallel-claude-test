---
name: local-docs-check
description: Check if local code changes require documentation updates
---

# Local Documentation Check

Check if local code changes require documentation updates and show suggested changes in VS Code.

## Instructions

### Step 1: Get local changes

Get all changes compared to master:

```bash
git diff origin/master...HEAD
```

If there are no commits yet, also check working directory:
```bash
git diff
git diff --cached
```

### Step 2: Read existing documentation

Read the documentation in `/docs/core/` to understand what is currently documented.

### Step 3: Analyze impact

Determine if the code changes affect documented functionality:

- **New features** that should be documented
- **Changed behavior** of existing documented features
- **New API endpoints** or GraphQL resolvers
- **New database tables** or significant schema changes
- **New user roles or permissions**
- **New classes, services, or modules** that users/developers interact with

**IMPORTANT:** Err on the side of suggesting documentation. If there's ANY new code that could benefit from documentation, create a suggestion. Let the USER decide if it's needed, not you.

### Step 4: Create suggested changes and open in VS Code

**THIS STEP IS MANDATORY.** You MUST always create documentation suggestions and open them in VS Code. Do NOT skip this step. The user must see the suggested changes visually to accept or reject them.

**Always create the temp directory first:**
```bash
mkdir -p /tmp/docs-suggestions
```

1. **For existing files that need updates:**
   - Read the current file content
   - Create a modified version with the suggested changes at `/tmp/docs-suggestions/[filename].suggested.md`
   - Open VS Code diff view:
   ```bash
   code --diff docs/core/[filename].md /tmp/docs-suggestions/[filename].suggested.md
   ```

2. **For new files that should be created:**
   - Create the new file content at `/tmp/docs-suggestions/[filename].new.md`
   - Open it in VS Code:
   ```bash
   code /tmp/docs-suggestions/[filename].new.md
   ```

### Step 5: Provide summary

**After opening VS Code**, provide a brief summary:

```
## Local Documentation Check

### Files opened in VS Code
- [List of files opened for review]

### Summary of suggested changes
- [Brief description of what was suggested]
```

### Step 6: Ask user what to do

Use AskUserQuestion to ask the user:
- "Apply changes" - Copy the suggested files to their final locations
- "Skip" - Do nothing

**If user chooses "Apply changes":**
```bash
cp /tmp/docs-suggestions/[filename].suggested.md docs/core/[filename].md
```

## Documentation Style Rules

- Keep descriptions brief and focused on PURPOSE
- Use tables for field summaries: `| Field | Description |`
- Use `##` headers for sections
- Don't list database columns - describe what the feature does
- Reference related features when relevant
