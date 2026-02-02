# CLAUDE.md - Project Guidelines for AI Code Review

This file provides context and instructions for Claude when reviewing code in this repository.

## Project Overview

Parallel is a multi-tenant SaaS platform for managing petitions, profiles, and workflows.

## Architecture

- **Frontend**: Next.js (client/)
- **Backend**: Node.js with GraphQL (server/)
- **Database**: PostgreSQL with multi-tenancy via `org_id`
- **Queue**: Redis/SQS for background jobs
- **Auth**: AWS Cognito

---

## Code Review Instructions

When reviewing pull requests, follow these guidelines:

### CRITICAL issues (should block the PR):
- Security vulnerabilities (SQL injection, XSS, authentication bypasses, exposed secrets)
- Data loss risks (destructive operations without confirmation, missing transactions)
- Production-breaking bugs (null pointer exceptions in critical paths, infinite loops)
- Breaking changes without proper migration
- Multi-tenancy violations (queries without `org_id` filter)

### Code quality issues (should comment):
- Using `let` when `const` should be used
- `console.log` statements left in production code
- Unused variables or imports
- Obvious typos in code
- Missing error handling in critical paths

### NON-CRITICAL issues (comment but don't block):
- Performance optimizations (unless severe)
- Refactoring suggestions
- Documentation improvements
- Minor bugs that don't affect critical functionality

### How to provide feedback:
1. **Suggest code changes when confident** - Use GitHub suggestion blocks for clear fixes
2. For critical issues, clearly explain why it's critical
3. Be concise - don't comment on every file, focus on what matters
4. Consider the full context of the change, not just the diff

### What NOT to flag:
- Missing comments or documentation (unless critical)
- Refactoring suggestions for code not being changed
- Style preferences already handled by ESLint/Prettier formatting

---

## Critical Patterns to Enforce

### Multi-Tenancy (CRITICAL)
- ALL database queries MUST filter by `org_id`
- Never expose data from one organization to another
- Check that new queries include tenant isolation

### Security
- Never commit secrets, API keys, or credentials
- Validate all user inputs
- Use parameterized queries (no string concatenation for SQL)
- Check for proper authentication on GraphQL resolvers

### Database
- All migrations must be reversible
- Use transactions for multi-table operations
- Soft delete using `deleted_at` field (never hard delete user data)

## Code Style

- TypeScript strict mode
- ESLint + Prettier (enforced by CI)
- Functional components in React
- Use existing patterns in the codebase
