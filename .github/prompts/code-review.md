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
- Performance issues

### STEP 3: Create review with inline suggestions

For each issue, create a GitHub review with inline suggestions. Use the PR_NUMBER, REPOSITORY, and HEAD_SHA from the context.

```bash
gh api -X POST /repos/{REPOSITORY}/pulls/{PR_NUMBER}/reviews \
  --field body="Review summary here" \
  --field commit_id="{HEAD_SHA}" \
  --field event="REQUEST_CHANGES" \
  --field comments='[
    {
      "path": "path/to/file.ts",
      "line": 25,
      "body": "Issue description\n\n```suggestion\nfixed code here\n```"
    }
  ]'
```

**IMPORTANT:**
- Use "line" (not "position") - the actual line number in the NEW file
- Use event="REQUEST_CHANGES" for critical issues, "COMMENT" for suggestions only
- The suggestion block must contain the EXACT replacement code for that line
- Multiple lines can be suggested using "start_line" and "line" together

### STEP 4: Write result file

Write to /tmp/review-result.txt:
- "CRITICAL" if you found critical issues
- "OK" if only minor suggestions or no issues

## Multi-line Suggestion Example

```json
{
  "path": "file.ts",
  "start_line": 10,
  "line": 12,
  "body": "Replace these lines:\n\n```suggestion\nline 10 replacement\nline 11 replacement\nline 12 replacement\n```"
}
```
