---
name: pr-docs-check
description: Check if a PR requires documentation updates
---

# PR Documentation Check

Check if a Pull Request requires documentation updates.

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

### Suggested Documentation Updates

#### File: `docs/core/[filename].md`

Add/update the following:

[Exact content to add or change]
```

### Step 7: Offer to post comment

If documentation updates are needed, ask if you should post the suggestions as a PR comment:

```bash
gh pr comment <PR_NUMBER> --body "documentation suggestions here"
```

## Documentation Style Rules

- Keep descriptions brief and focused on PURPOSE
- Use tables for field summaries: `| Field | Description |`
- Use `##` headers for sections
- Don't list database columns - describe what the feature does
- Reference related features when relevant
