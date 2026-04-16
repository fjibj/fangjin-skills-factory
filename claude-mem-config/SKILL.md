---
name: claude-mem-config
description: Configure and manage Claude Code memory system - user profiles, feedback, project context, and references. Use when setting up memory, creating memory entries, or managing project knowledge.
version: 1.0.0
author: fangjin
license: MIT
metadata:
  tags: [claude, memory, config, user-profile, feedback, project, reference]
  triggers:
    - "configure memory"
    - "设置记忆"
    - "memory system"
    - "remember this"
    - "记住这个"
    - "update memory"
    - "记忆配置"
---

# Claude Memory Config Skill

Configure and manage Claude Code's persistent memory system for personalized assistance.

## Purpose

Enable effective use of Claude's memory system:
1. Create and update user profiles
2. Capture feedback for behavior improvement
3. Track project context and decisions
4. Store external reference pointers

## Activation Signals

Use this skill when:
- User says "remember this" or "记住这个"
- Setting up project memory
- Creating user profile
- Capturing feedback
- Storing external references
- Configuring memory preferences

## Memory System Overview

Claude has 4 memory types stored in `~/.claude/memory/`:

| Type | Purpose | When to Save | How to Use |
|------|---------|--------------|------------|
| **user** | User role, goals, preferences, knowledge | Learn about user | Tailor responses to user's background |
| **feedback** | Guidance on approach (do/don't) | User corrects or confirms | Guide future behavior |
| **project** | Ongoing work, goals, bugs, incidents | Learn project state | Understand context behind requests |
| **reference** | Pointers to external systems | Learn about external resources | Know where to look for info |

## Memory Storage Structure

```
~/.claude/memory/
├── MEMORY.md              # Index file (no frontmatter)
├── user/
│   ├── role.md            # User role and background
│   └── preferences.md     # User preferences
├── feedback/
│   ├── coding-style.md    # Coding preferences
│   └── workflow.md        # Workflow preferences
├── project/
│   ├── current-sprint.md  # Current work
│   └── decisions.md       # Key decisions
└── reference/
    ├── linear.md          # External system pointer
    └── grafana.md         # Dashboard reference
```

## Step-by-Step Procedure

### Step 1: Determine Memory Type

Based on content:

**User** (who you are):
- Role, title, expertise
- Technical background
- Learning goals
- Communication preferences

**Feedback** (how to work):
- "Do this" or "Don't do that"
- Corrections to approach
- Confirmations of good patterns
- Preferences about style/format

**Project** (what we're doing):
- Deadlines, milestones
- Architecture decisions
- Known bugs or issues
- Stakeholder requirements

**Reference** (where to look):
- Links to external systems
- Documentation locations
- Dashboard URLs
- API endpoints

### Step 2: Create Memory File

Format:
```markdown
---
name: {descriptive-name}
description: {one-line summary}
type: {user|feedback|project|reference}
---

{memory content}

**Why:** {reason context}
**How to apply:** {usage guidance}
```

**User Example**:
```markdown
---
name: user-role
description: User is senior backend engineer, new to frontend
type: user
---

Senior backend engineer with 10 years Go experience. Currently learning React and TypeScript. Prefers concrete examples over abstract explanations.

**Why:** Mentioned Go background, asked for React help, confirmed preference for examples
**How to apply:** Frame frontend concepts in backend terms, provide concrete code samples
```

**Feedback Example**:
```markdown
---
name: no-mocking-policy
description: Don't mock database in tests - use real DB
type: feedback
---

Integration tests must hit a real database, not mocks. Prior incident where mocked tests passed but production migration failed.

**Why:** User corrected after mock-based test passed but real DB failed
**How to apply:** Always use testcontainers or real DB for integration tests
```

**Project Example**:
```markdown
---
name: auth-rewrite-context
description: Auth middleware rewrite driven by compliance, not tech debt
type: project
---

The auth middleware rewrite is driven by legal/compliance requirements (session token storage), not tech-debt cleanup. Legal flagged old approach in Q2.

**Why:** User explained compliance requirement in planning meeting
**How to apply:** Scope decisions should favor compliance over ergonomics
```

**Reference Example**:
```markdown
---
name: linear-project
description: Pipeline bugs tracked in Linear project INGEST
type: reference
---

Pipeline bugs are tracked in Linear project "INGEST". On-call handoff includes checking this project.

**Why:** User mentioned during standup
**How to apply:** Check Linear INGEST when debugging pipeline issues
```

### Step 3: Update MEMORY.md Index

Add entry to `~/.claude/memory/MEMORY.md`:

```markdown
# Memory Index

## User
- [User Role](user/role.md) — Senior backend engineer, Go expert
- [Preferences](user/preferences.md) — Prefers concrete examples

## Feedback
- [No Mocking](feedback/no-mocking-policy.md) — Use real DB in tests
- [Terse Responses](feedback/terse.md) — No trailing summaries

## Project
- [Auth Rewrite](project/auth-rewrite.md) — Compliance-driven, Q2 deadline
- [Merge Freeze](project/freeze.md) — Starting 2024-03-05 for mobile release

## Reference
- [Linear INGEST](reference/linear-ingest.md) — Pipeline bug tracker
- [Grafana Latency](reference/grafana.md) — API latency dashboard
```

**Rules**:
- Keep entries concise (<150 chars)
- Organize by type
- No frontmatter in MEMORY.md
- One line per memory

### Step 4: Save Memory

```bash
# Write memory file
Write memory/{type}/{name}.md with content

# Update index
Edit ~/.claude/memory/MEMORY.md to add entry

# Verify structure
Read ~/.claude/memory/MEMORY.md
```

## Memory Management Rules

### What to Save

**DO Save**:
- User's role and expertise
- Specific preferences (format, style, verbosity)
- Project deadlines and constraints
- External system references
- Verified feedback

**DON'T Save**:
- Code patterns (derive from current code)
- Git history (use git commands)
- Debug solutions (in code)
- Ephemeral task details
- Anything in CLAUDE.md already

### When to Update

| Trigger | Action |
|---------|--------|
| User corrects approach | Update/create feedback |
| User confirms non-obvious approach | Create feedback |
| User states role/expertise | Update user |
| Deadline/decision mentioned | Update project |
| External system referenced | Create reference |

### Memory Decay

Memories can become stale. Verify before relying:

1. **File paths**: Check if file exists
2. **Functions/flags**: Grep to verify
3. **Repo state**: Check git, not memory
4. **External URLs**: May need refresh

**Stale memory handling**:
- Trust current observation over memory
- Update memory with new information
- Remove outdated memories

## Output Contract

On successful save:
```json
{
  "saved": true,
  "type": "feedback",
  "name": "no-mocking-policy",
  "file": "~/.claude/memory/feedback/no-mocking-policy.md",
  "index_updated": true,
  "content_summary": "Integration tests must use real DB"
}
```

## Failure Modes

| Failure | Cause | Recovery |
|---------|-------|----------|
| Duplicate memory | Similar entry exists | Update existing instead |
| Wrong type | Misclassified | Move to correct type directory |
| Stale memory | Information changed | Update or remove |
| Too verbose | Entry too long | Shorten to <150 chars in index |

## Examples

### Example 1: Save User Preference

```markdown
User: "I'm a data scientist investigating logging"

Action:
1. Create ~/.claude/memory/user/role.md
2. Add entry to MEMORY.md
3. Future responses tailored to data science context
```

### Example 2: Capture Feedback

```markdown
User: "Stop summarizing what you just did, I can read the diff"

Action:
1. Create ~/.claude/memory/feedback/terse.md
2. Type: feedback
3. Content: "This user wants terse responses with no trailing summaries"
4. Future responses will be concise
```

### Example 3: Project Context

```markdown
User: "We're freezing merges after Thursday — mobile team cutting release"

Action:
1. Create ~/.claude/memory/project/freeze.md
2. Type: project
3. Include date: 2024-03-05
4. Why: mobile release
5. Flag non-critical PRs after this date
```

### Example 4: External Reference

```markdown
User: "Check Linear project INGEST for pipeline bugs"

Action:
1. Create ~/.claude/memory/reference/linear.md
2. Type: reference
3. Pointer to Linear INGEST project
4. Check when debugging pipeline issues
```

## Checklist

- [ ] Memory type correctly identified
- [ ] Frontmatter complete (name, description, type)
- [ ] Content specific and actionable
- [ ] Why section explains context
- [ ] How to apply section guides usage
- [ ] MEMORY.md index updated
- [ ] Entry concise (<150 chars)
- [ ] Organized by type
- [ ] No duplicate entries
- [ ] Saved to correct directory

## References

- Memory directory: `~/.claude/memory/`
- Index file: `~/.claude/memory/MEMORY.md`
- Auto-memory: Some memories saved automatically by Claude Code
