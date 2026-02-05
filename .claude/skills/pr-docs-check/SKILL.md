---
name: pr-docs-check
description: Check if a PR requires documentation updates
---

# PR Documentation Check

Check if a Pull Request requires documentation updates and show suggested changes in VS Code.

## Instructions

### Step 1: List open PRs

Get all open PRs in the repository:

```bash
gh pr list --state open --json number,title,author,headRefName --limit 20
```

### Step 2: Let the user select a PR

Use AskUserQuestion to present the list of open PRs and let the user select which one to check. Show:
- PR number
- Title
- Author
- Branch name

### Step 3: Get the PR diff

Once the user selects a PR, get its diff:

```bash
gh pr diff <PR_NUMBER>
```

### Step 4: Read existing documentation

Read the documentation in `/docs/core/` to understand what is currently documented.

### Step 5: Analyze impact

Determine if the code changes affect documented functionality:

- **New features** that should be documented
- **Changed behavior** of existing documented features
- **New API endpoints** or GraphQL resolvers
- **New database tables** or significant schema changes
- **New user roles or permissions**

### Step 6: Provide recommendations

**Format your response as:**

```
## PR Documentation Check: #<NUMBER> - <TITLE>

### Status: [UPDATES NEEDED / OK]

### Changes That Need Documentation
(List each change and why it needs docs)

### Files to update
- docs/core/[filename].md
```

### Step 7: Create suggested changes and open in VS Code

If documentation updates are needed:

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

**Always create the temp directory first:**
```bash
mkdir -p /tmp/docs-suggestions
```

### Step 8: Ask user what to do

Use AskUserQuestion to ask the user:
- "Apply changes" - Copy the suggested files to their final locations
- "Post as PR comment" - Post the suggestions as a comment on the PR
- "Skip" - Do nothing

**If user chooses "Apply changes":**
```bash
cp /tmp/docs-suggestions/[filename].suggested.md docs/core/[filename].md
```

**If user chooses "Post as PR comment":**
```bash
gh pr comment <PR_NUMBER> --body "documentation suggestions here"
```

## Documentation Style Rules

- Keep descriptions brief and focused on PURPOSE
- Use tables for field summaries: `| Field | Description |`
- Use `##` headers for sections
- Don't list database columns - describe what the feature does
- Reference related features when relevant
