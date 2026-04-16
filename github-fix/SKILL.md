---
name: github-fix
description: Fix GitHub issues, CI failures, and repository problems - diagnose, fix, test, and verify solutions. Use when CI fails, tests fail, or GitHub workflows need fixing.
version: 1.0.0
author: fangjin
license: MIT
metadata:
  tags: [github, ci, fix, debug, troubleshoot, testing, workflow]
  triggers:
    - "fix github"
    - "ci failed"
    - "修复github"
    - "测试失败"
    - "workflow failed"
    - "ci 失败"
---

# GitHub Fix Skill

Systematic approach to diagnosing and fixing GitHub issues, CI failures, and workflow problems.

## Purpose

Provide a structured workflow for:
1. Diagnosing CI/test failures
2. Identifying root causes
3. Implementing fixes
4. Verifying solutions
5. Documenting changes

## Activation Signals

Use this skill when:
- User says "fix github" or "ci failed" or "修复github"
- CI/CD pipeline fails
- Tests fail in GitHub Actions
- Workflow configuration issues
- PR checks fail
- Build errors

## Inputs

| Parameter | Required | Description |
|-----------|----------|-------------|
| `issue_type` | Yes | Type: ci-failure, test-failure, build-error, workflow-issue |
| `context` | Yes | Error message, PR URL, or failure context |
| `branch` | No | Branch to fix (default: current) |

## Preconditions

1. Git repository initialized
2. Access to CI logs (GitHub Actions, etc.)
3. Development environment set up
4. Tests can run locally

## Failure Types and Solutions

| Failure Type | Common Causes | Solution Approach |
|--------------|---------------|-------------------|
| CI Failure | Config error, dependency issue, env problem | Check workflow file, logs, dependencies |
| Test Failure | Code bug, test flake, env mismatch | Debug test locally, check assertions |
| Build Error | Syntax error, import issue, type error | Fix code, update imports, check types |
| Lint Error | Style violation, formatting | Run linter with fix flag |
| Dependency Error | Version conflict, missing package | Update lockfile, install deps |
| Timeout | Slow tests, infinite loops | Optimize, add timeout config |

## Step-by-Step Procedure

### Phase 1: Diagnose

#### Step 1: Gather Failure Information

```bash
# Check git status
git status
git log --oneline -5

# Check current branch
git branch --show-current

# If CI failure, check workflow status
gh run list --limit 5
gh run view <run-id>
```

#### Step 2: Read CI Logs (if CI failure)

```bash
# Get latest failed run
gh run list --status failure --limit 1

# View logs
gh run view <run-id> --log

# Or download logs
gh run view <run-id> --log > /tmp/ci-logs.txt
cat /tmp/ci-logs.txt | grep -A 10 -B 5 "error\|Error\|ERROR\|failed\|FAILED\|FAIL"
```

**Decision rule**: Identify the specific step and error message.

#### Step 3: Reproduce Locally

```bash
# For test failures
npm test
# or
pytest
# or
go test

# For build failures
npm run build
# or
tsc
# or
go build

# For lint failures
npm run lint
# or
golangci-lint run
```

**Decision rule**: If can't reproduce locally, check environment differences.

### Phase 2: Fix

#### Step 4: Identify Root Cause

Common patterns:

```bash
# Syntax errors - find in logs
grep -n "SyntaxError\|ParseError" /tmp/ci-logs.txt

# Import/Module errors
grep -n "Cannot find module\|ImportError" /tmp/ci-logs.txt

# Type errors
grep -n "TypeError\|type.*error" /tmp/ci-logs.txt

# Test failures
grep -n "AssertionError\|expect.*failed" /tmp/ci-logs.txt
```

#### Step 5: Implement Fix

Based on error type:

**Syntax Error**:
```bash
# Fix the specific file
# Read file, fix syntax issue
```

**Import Error**:
```bash
# Check if module exists
npm list <module>
# or
pip show <module>

# Install if missing
npm install <module>
# or
pip install <module>
```

**Test Failure**:
```bash
# Run specific test with verbose
npm test -- <test-name> --verbose

# Check test file
# Fix assertion or code
```

**Workflow Config Error**:
```bash
# Read workflow file
cat .github/workflows/<workflow>.yml

# Check for syntax errors
# Validate YAML syntax
```

### Phase 3: Verify

#### Step 6: Local Verification

```bash
# Re-run the failing command
npm test
npm run build
npm run lint

# Run all checks
npm run ci
```

**Decision rule**: All checks must pass locally before committing.

#### Step 7: Commit and Push

```bash
# Create fix commit
git add <fixed-files>
git commit -m "fix: [description of fix]

- [What was wrong]
- [How it was fixed]
- [Any side effects or notes]

Fixes #<issue-number>"

# Push to trigger CI
git push
```

#### Step 8: Monitor CI

```bash
# Watch CI status
gh run list --limit 5
gh run view <run-id> --watch

# Wait for completion
```

**Decision rule**: If CI still fails, return to Phase 1.

### Phase 4: Document

#### Step 9: Update Documentation (if needed)

```bash
# If fix changes behavior, update docs
# Check if README needs updating
# Check if CHANGELOG needs entry
```

## Common Fix Patterns

### Pattern 1: CI Workflow Fix

```yaml
# Before (broken):
- run: npm test
  env:
    NODE_ENV: production  # Wrong env for tests

# After (fixed):
- run: npm test
  env:
    NODE_ENV: test
```

### Pattern 2: Dependency Fix

```bash
# Lockfile out of sync
rm package-lock.json
npm install

# Commit updated lockfile
git add package-lock.json
git commit -m "fix: update lockfile"
```

### Pattern 3: Test Fix

```javascript
// Before (flaky test):
expect(result).toBe(1);  // Timing dependent

// After (fixed):
await waitFor(() => expect(result).toBe(1));
```

### Pattern 4: Build Fix

```javascript
// Before: Missing import
import { something } from './module';  // Module doesn't exist

// After: Fix import path
import { something } from '../module';
```

## Output Contract

On success:
```json
{
  "success": true,
  "issue_type": "ci-failure",
  "root_cause": "Missing dependency in lockfile",
  "fix_applied": "Regenerated package-lock.json",
  "files_changed": ["package-lock.json"],
  "commit_hash": "abc123",
  "ci_status": "passing"
}
```

On failure (can't fix):
```json
{
  "success": false,
  "issue_type": "ci-failure",
  "diagnosis": "Third-party service unavailable",
  "attempted_fixes": ["Retry 3 times"],
  "recommendation": "Wait for service recovery or implement retry logic",
  "escalation_required": true
}
```

## Failure Modes

| Failure | Cause | Recovery |
|---------|-------|----------|
| Can't reproduce locally | Environment difference | Check CI env vars, container setup |
| Flaky test | Race condition, timing | Add retries, increase timeouts |
| External dependency | Third-party service | Implement circuit breaker, mock in tests |
| Permission error | CI secrets, tokens | Check workflow permissions |
| Resource limit | Memory, disk, time | Optimize, increase limits |

## Decision Rules

- **Can reproduce locally** → Fix locally → commit → push → verify CI
- **Can't reproduce locally** → Check environment → try in container → fix
- **Flaky test** → Add retries, stabilize test, or mark as flaky
- **External service failure** → Mock in tests, add retry logic
- **Complex failure** → Escalate with detailed diagnosis

## Examples

### Example 1: CI Test Failure

```bash
# CI error: "Cannot find module 'xyz'"

# Diagnose
npm list xyz  # Not found

# Fix
npm install xyz --save
git add package.json package-lock.json
git commit -m "fix: add missing dependency xyz"
git push

# Verify
gh run watch
```

### Example 2: Lint Error

```bash
# Error: "Trailing spaces" in CI

# Fix
npm run lint -- --fix

# Commit
git add -A
git commit -m "style: fix linting errors"
git push
```

### Example 3: Workflow Config

```bash
# CI error: "Invalid workflow file"

# Read and fix
Read .github/workflows/ci.yml
# Fix YAML syntax error
Edit .github/workflows/ci.yml

# Commit
git add .github/workflows/ci.yml
git commit -m "ci: fix workflow syntax"
git push
```

## Checklist

- [ ] Failure information gathered
- [ ] CI logs read (if applicable)
- [ ] Issue reproduced locally
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Local verification passed
- [ ] Fix committed with clear message
- [ ] CI monitored after push
- [ ] Fix confirmed in CI
- [ ] Documentation updated (if needed)

## References

- GitHub CLI: https://cli.github.com/manual/
- GitHub Actions: https://docs.github.com/en/actions
- Debugging CI: https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows
