# Code Review Instructions

## Your Task
Review the code and create GitHub suggestions that can be accepted with one click.

## Steps

### STEP 1: Read and analyze the diff
Read the DIFF_FILE provided in the context to understand what changed.

### STEP 2: Identify issues

**CRITICAL (will fail the check):**
- SQL injection (string concatenation in queries)
- Security vulnerabilities (XSS, command injection)
- Multi-tenancy violations (missing org_id filters)
- Data loss risks
- Hardcoded secrets

**CODE QUALITY (suggestions only):**
- console.log statements
- Unused variables
- let that should be const

### STEP 3: Create review with inline suggestions

**IMPORTANT: Use a JSON file to avoid shell escaping issues.**

1. First, create a JSON file with the review payload using the Write tool to write to /tmp/review.json

The JSON structure must be:
```json
{
  "body": "## Code Review Summary\n\nDescription of issues...",
  "event": "REQUEST_CHANGES",
  "comments": [
    {
      "path": "src/file.ts",
      "line": 14,
      "body": "**Issue title**\n\n```suggestion\nthe fixed code for this line\n```"
    }
  ]
}
```

2. Then submit the review:
```bash
gh api -X POST /repos/{REPOSITORY}/pulls/{PR_NUMBER}/reviews --input /tmp/review.json
```

**Rules for the comments array:**
- "path": relative path to the file from repo root
- "line": the line number in the NEW version of the file
- "start_line": (optional) for multi-line suggestions
- "body": must include a ```suggestion block with the EXACT replacement code

**The suggestion block replaces the entire line(s). Include only what should appear after the fix.**

### STEP 4: Write result file
Write to /tmp/review-result.txt:
- "CRITICAL" if you found critical issues
- "OK" if only suggestions or no issues

## Complete Example

For a file with SQL injection on line 14:

/tmp/review.json:
```json
{
  "body": "## Code Review\n\n### Critical Issues Found\n\n1. **SQL Injection** on line 14 - using string concatenation\n2. **Missing org_id** on line 22 - multi-tenancy violation",
  "event": "REQUEST_CHANGES",
  "comments": [
    {
      "path": "src/user-service.ts",
      "line": 14,
      "body": "🚨 **SQL Injection Vulnerability**\n\nUsing string concatenation with user input. Use parameterized queries.\n\n```suggestion\n  const query = \"SELECT * FROM users WHERE id = $1\";\n```"
    },
    {
      "path": "src/user-service.ts",
      "line": 22,
      "body": "🚨 **Multi-tenancy Violation**\n\nMissing org_id filter.\n\n```suggestion\n  const query = \"UPDATE users SET email = $1 WHERE id = $2 AND org_id = $3\";\n```"
    }
  ]
}
```

Then run:
```bash
gh api -X POST /repos/{REPOSITORY}/pulls/{PR_NUMBER}/reviews --input /tmp/review.json
```
