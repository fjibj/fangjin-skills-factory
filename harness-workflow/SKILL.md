---
name: harness-workflow
description: WeChat message processing workflow using 4-phase Harness pattern - Plan → Work → Review → Reply. Use when processing WeChat messages that require structured handling with user feedback at each phase.
version: 1.0.0
author: fangjin
license: MIT
metadata:
  tags: [wechat, harness, workflow, plan, work, review, reply, message-processing]
  triggers:
    - "process wechat message"
    - "处理微信消息"
    - "harness workflow"
    - "微信消息处理"
---

# Harness Workflow Skill

Standardized 4-phase workflow for processing WeChat messages with full transparency and user feedback at each step.

## Purpose

Provide a structured approach to handling WeChat messages that:
1. Plans the approach before execution
2. Executes tasks with progress reporting
3. Reviews results for quality assurance
4. Delivers final response with context

Ensures no message is processed "in the dark" - user sees progress at every phase.

## Activation Signals

Use this skill when:
- User says "process WeChat message" or "处理微信消息"
- Need to handle incoming WeChat messages
- Working with `auto-process.ts` from cc-weixin plugin
- Message requires multi-step processing with user visibility

## The 4-Phase Harness Workflow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Plan   │ → │  Work   │ → │ Review  │ → │  Reply  │
│  (计划)  │    │  (执行)  │    │  (审查)  │    │  (回复)  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
   输出：计划概要     输出：执行进度     输出：审查结论     输出：处理总结
   → 微信用户       → 微信用户       → 微信用户       → 微信用户
```

## Phase 1: Plan - 创建计划

**Purpose**: Analyze message intent and create structured execution plan

### Procedure

1. **Analyze the message**
   - Read message content from pending.json
   - Identify user intent and requirements
   - Determine complexity level

2. **Create task breakdown**
   ```markdown
   ## Plan for Message {ID}
   
   ### Intent
   [What user wants to accomplish]
   
   ### Tasks
   1. [Task 1 description]
   2. [Task 2 description]
   3. [Task 3 description]
   
   ### Dependencies
   - Task 2 depends on Task 1
   
   ### Expected Output
   [What the final result should look like]
   ```

3. **Send plan summary to WeChat**
   ```bash
   bun run auto-process.ts reply <chatId> "【Phase 1: Plan】
   
   消息意图：[摘要]
   
   处理计划：
   1. [任务1]
   2. [任务2]
   3. [任务3]
   
   预计输出：[结果描述]" <contextToken>
   ```

### Output Contract

- Clear task list with numbering
- Dependency mapping
- Estimated complexity
- User-facing summary

## Phase 2: Work - 执行计划

**Purpose**: Execute each task with progress reporting

### Procedure

1. **Execute tasks sequentially or in parallel**
   - Use `harness-work` for execution
   - For parallel: `harness-work --parallel N`
   - For breezing (4+ tasks): `harness-work --breezing`

2. **Report progress for each step**
   ```bash
   bun run auto-process.ts reply <chatId> "【Phase 2: Work - Step X/Y】
   
   当前任务：[任务描述]
   
   执行结果：
   - [结果细节]
   - [文件/输出]
   
   状态：✓ 完成 / ⚠ 部分完成 / ✗ 失败" <contextToken>
   ```

3. **Handle multi-step progress**
   - Send update after each major step
   - Include step counter (X/Y)
   - Mention any blockers immediately

### Output Contract

- Step-by-step progress updates
- Success/failure status per task
- File paths or outputs generated
- Blockers reported immediately

## Phase 3: Review - 审查结果

**Purpose**: Quality assurance and result validation

### Procedure

1. **Run review process**
   - Use `harness-review` or manual review
   - Check against Definition of Done (DoD)

2. **Review dimensions**
   - Correctness: Does it solve the original problem?
   - Completeness: Are all requirements met?
   - Quality: Is the output professional?
   - Safety: Any security concerns?

3. **Send review summary**
   ```bash
   bun run auto-process.ts reply <chatId> "【Phase 3: Review】
   
   审查维度：
   ✓ 正确性：[评价]
   ✓ 完整性：[评价]
   ✓ 质量：[评价]
   ⚠ 改进点：[如果有]
   
   结论：[通过/需修正]" <contextToken>
   ```

### Output Contract

- Multi-dimension review
- Pass/fail judgment
- Specific improvement suggestions
- Clear verdict

## Phase 4: Reply - 发送最终回复

**Purpose**: Deliver final response with full context

### Procedure

1. **Format final output**
   - Summarize what was done
   - Present final deliverables
   - Include relevant files/links

2. **Send final reply**
   ```bash
   bun run auto-process.ts reply <chatId> "【Phase 4: Reply - 处理完成】
   
   处理总结：
   [Brief summary of work done]
   
   输出结果：
   - [File 1]: [Description]
   - [File 2]: [Description]
   
   下一步：[建议或后续操作]" <contextToken>
   ```

3. **For multi-line content, use reply-file**
   ```bash
   # Write to temp file first
   echo "内容..." > /tmp/final-response.md
   bun run auto-process.ts reply-file <chatId> /tmp/final-response.md <contextToken>
   ```

### Output Contract

- Clear completion statement
- Summary of all outputs
- File paths or deliverables
- Next steps (if applicable)

## Complete Workflow Example

```bash
# 1. Detect new messages
cd ~/.claude/plugins/cache/cc-weixin/weixin/0.1.0
bun run auto-process.ts
# Output: "发现 1 条新消息，请使用 Harness 流程处理"

# 2. Read the message
read pending.json
# Extract: chatId, content, contextToken

# 3. Phase 1: Plan
# Analyze, create task list, send plan summary
bun run auto-process.ts reply <chatId> "【Phase 1: Plan】..." <contextToken>

# 4. Phase 2: Work
# Execute tasks
harness-work --parallel 3
# Send progress updates
bun run auto-process.ts reply <chatId> "【Phase 2: Work - Step 1/3】..." <contextToken>

# 5. Phase 3: Review
harness-review
bun run auto-process.ts reply <chatId> "【Phase 3: Review】..." <contextToken>

# 6. Phase 4: Reply
bun run auto-process.ts reply <chatId> "【Phase 4: Reply - 处理完成】..." <contextToken>

# 7. Clean up
bun run auto-process.ts remove <timestamp>
```

## Message Detection Rules

**Important**: Only update `last-check.json` timestamp when:
- New messages are detected AND processed
- Do NOT update if `newMessages === 0`

```bash
# Check command (returns count without updating timestamp)
bun run auto-process.ts check

# If newMessages > 0:
# - Process through Harness workflow
# - Timestamp auto-updated by processing

# If newMessages === 0:
# - Return immediately
# - No file writes
```

## Reply Format Rules

| Content Type | Method | Command |
|--------------|--------|---------|
| Single line, <100 chars | reply | `bun run auto-process.ts reply <chatId> "text" <token>` |
| Multi-line, >100 chars, lists, code | reply-file | `bun run auto-process.ts reply-file <chatId> <file> <token>` |

**Always use reply-file for:**
- Multiple lines (contains `\n`)
- Code blocks
- Lists
- Long text (>100 chars)
- Formatted output

## Output Contract

**Phase 1 (Plan)**: Task list with dependencies, user-facing summary
**Phase 2 (Work)**: Progress per step, success/failure status
**Phase 3 (Review)**: Multi-dimension assessment, pass/fail verdict
**Phase 4 (Reply)**: Final summary, all deliverables, next steps

## Failure Modes

| Phase | Failure | Recovery |
|-------|---------|----------|
| Plan | Ambiguous intent | Ask clarifying question via reply |
| Work | Task execution fails | Report error, skip or retry, continue to Review |
| Review | Quality issues | Document issues, may need re-work |
| Reply | Send failure | Retry once, log error |

## Decision Rules

- **Single task**: Use solo mode in Work phase
- **2-3 tasks**: Use `--parallel 3` for efficiency
- **4+ tasks**: Use `--breezing` with Lead/Worker/Reviewer
- **Complex tasks**: Add ultrathink for deep reasoning
- **Simple queries**: May skip Review phase (document the exception)

## Memory Recording

**After completing Phase 4**, record to `weixin-history.md`:

```markdown
### 消息 X: [主题]
**消息**: [摘要，前100字]
**处理**: [流程简述]
**结果**: [结果摘要，前200字]
**标签**: #[关键词1] #[关键词2] #[关键词3]
```

## Checklist

- [ ] Message detected and read
- [ ] Phase 1: Plan created and sent
- [ ] Phase 2: Work executed with progress updates
- [ ] Phase 3: Review completed and shared
- [ ] Phase 4: Final reply sent
- [ ] Correct reply method used (reply vs reply-file)
- [ ] Memory recorded to weixin-history.md
- [ ] Timestamp updated only if messages processed
- [ ] Message removed from queue after processing

## References

- cc-weixin plugin: `~/.claude/plugins/cache/cc-weixin/weixin/0.1.0/`
- auto-process.ts: Message detection and reply commands
- harness-work: Task execution
- harness-review: Quality review
- harness-plan: Plan creation
