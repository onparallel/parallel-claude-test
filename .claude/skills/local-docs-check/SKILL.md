---
name: local-docs-check
description: Check if local code changes require documentation updates
---

# Local Documentation Check

Check if local code changes require documentation updates.

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

### Step 4: Provide recommendations

**Format your response as:**

```
## Local Documentation Check

### Status: [UPDATES NEEDED / OK]

### Changes That Need Documentation
(List each change and why it needs docs)

### Suggested Documentation Updates

#### File: `docs/core/[filename].md`

Add/update the following:

[Exact content to add or change]
```

## Documentation Style Rules

- Keep descriptions brief and focused on PURPOSE
- Use tables for field summaries: `| Field | Description |`
- Use `##` headers for sections
- Don't list database columns - describe what the feature does
- Reference related features when relevant
