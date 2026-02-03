# Documentation Check Instructions

## Your Task
Check if code changes affect documented functionality. Create inline suggestions for documentation updates (do NOT commit directly).

## Steps

### STEP 1: Read the PR diff
Read the DIFF_FILE provided in the context to understand what code changed.

### STEP 2: Read existing documentation
Read files in /docs/core/ to understand what is documented.

### STEP 3: Analyze impact
Determine if changes affect documented functionality:
- New features that should be documented
- Changed behavior of documented features
- New API endpoints or tables
- New user roles or permissions

### STEP 4: Create documentation suggestions

**IMPORTANT: Use inline suggestions, NOT direct commits.**

There are TWO scenarios:

#### Scenario A: Documentation files ARE in the PR diff
Create inline suggestions directly on those files using the GitHub Reviews API.

#### Scenario B: Documentation files are NOT in the PR diff
Post a comment with the exact changes needed, formatted as code blocks.

---

**For Scenario A (files in diff):**

1. Create a JSON file with the review payload using the Write tool to write to /tmp/docs-review.json

```json
{
  "body": "## Documentation Review\n\nSuggested documentation updates...",
  "event": "COMMENT",
  "comments": [
    {
      "path": "docs/core/feature.md",
      "line": 25,
      "body": "**Documentation Update Needed**\n\nAdd description for the new feature.\n\n```suggestion\n## New Feature\n\nThis feature allows users to...\n```"
    }
  ]
}
```

2. Submit the review:
```bash
gh api -X POST /repos/{REPOSITORY}/pulls/{PR_NUMBER}/reviews --input /tmp/docs-review.json
```

---

**For Scenario B (files NOT in diff):**

Post a comment with the exact content to add:

```bash
gh pr comment {PR_NUMBER} --body "$(cat <<'EOF'
## 📚 Documentation Update Needed

The following documentation changes are recommended:

### File: `docs/core/feature.md`

Add the following section:

\`\`\`markdown
## New Feature Name

Description of what this feature does.

| Field | Description |
|-------|-------------|
| field1 | What it does |
\`\`\`

### Why
- Briefly explain why this documentation is needed
EOF
)"
```

### STEP 5: Write result file
Write to /tmp/docs-result.txt:
- "SUGGESTIONS_MADE" if you created inline suggestions (Scenario A)
- "COMMENT_POSTED" if you posted a comment with changes (Scenario B)
- "OK" if no documentation changes needed

## Rules for inline suggestions

- "path": relative path to the file from repo root
- "line": the line number in the NEW version of the file (must be in the diff)
- "start_line": (optional) for multi-line suggestions
- "body": must include a ```suggestion block with the EXACT replacement code

## Style Rules for Documentation

- Keep descriptions brief and focused on PURPOSE
- Use tables for summaries (| Column | Description |)
- Use ## headers for sections
- Don't list database columns - describe what the feature does
- Reference related features when relevant
