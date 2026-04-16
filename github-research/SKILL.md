---
name: github-research
description: Research and analyze GitHub repositories - clone, explore structure, search code, analyze dependencies, and extract key insights. Use when user wants to understand a GitHub project, analyze code, or research open-source tools.
version: 1.0.0
author: fangjin
license: MIT
metadata:
  tags: [github, research, analysis, repository, code-exploration, open-source]
  triggers:
    - "analyze github repo"
    - "research github"
    - "看看这个github项目"
    - "分析github"
    - "github项目研究"
    - "clone and analyze"
---

# GitHub Research Skill

Systematic approach to researching and analyzing GitHub repositories.

## Purpose

Enable comprehensive GitHub repository analysis:
1. Clone or access repository
2. Explore structure and architecture
3. Search for specific code patterns
4. Analyze dependencies and tech stack
5. Extract key insights and findings

## Activation Signals

Use this skill when:
- User says "analyze this GitHub repo" or "看看这个github项目"
- Need to understand an open-source project
- Researching dependencies or libraries
- Evaluating tools or frameworks
- Looking for implementation examples

## Inputs

| Parameter | Required | Description |
|-----------|----------|-------------|
| `repo_url` | Yes | GitHub repository URL |
| `focus_area` | No | Specific area to focus on: structure, code, dependencies, docs |
| `depth` | No | Analysis depth: quick, standard, deep (default: standard) |

## Preconditions

1. Git installed locally
2. Internet connection for cloning/fetching
3. Sufficient disk space for repository

## Step-by-Step Procedure

### Step 1: Clone or Access Repository

```bash
# Clone the repository
git clone <repo_url> /tmp/repo-analysis/<repo-name>
cd /tmp/repo-analysis/<repo-name>

# Or if already cloned, fetch latest
git fetch origin
git pull
```

**Decision rule**: If clone fails (private repo, network), try using GitHub API instead.

### Step 2: Initial Structure Exploration

```bash
# Get repository overview
ls -la

# View directory structure (tree-like)
find . -type f -name "*.md" | head -20
find . -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" \) | head -20

# Check top-level files
ls -la | grep -E "^\-" | head -20
```

**Key files to identify**:
- README.md - Project overview
- package.json / requirements.txt / go.mod - Dependencies
- LICENSE - License type
- CONTRIBUTING.md - Contribution guidelines
- .github/ - CI/CD workflows

### Step 3: Analyze README and Documentation

```bash
# Read main README
cat README.md | head -100

# Find all documentation
glob "**/*.md"
```

**Extract**:
- Project purpose and description
- Installation instructions
- Usage examples
- Architecture overview
- API documentation links

### Step 4: Explore Code Structure

```bash
# Identify main source directories
find . -type d -name "src" -o -name "lib" -o -name "pkg" | head -10

# Count files by type
find . -type f -name "*.js" | wc -l
find . -type f -name "*.ts" | wc -l
find . -type f -name "*.py" | wc -l
find . -type f -name "*.go" | wc -l

# View entry points
glob "**/index.*"
glob "**/main.*"
```

### Step 5: Analyze Dependencies

```javascript
// For Node.js projects
const packageJson = require('./package.json');
console.log('Dependencies:', Object.keys(packageJson.dependencies || {}));
console.log('DevDependencies:', Object.keys(packageJson.devDependencies || {}));

// For Python projects
// Read requirements.txt or pyproject.toml
```

**Decision rule**: If dependency file not found, search for imports in source files.

### Step 6: Search for Specific Patterns

```bash
# Search for specific code patterns
grep -r "TODO" --include="*.js" --include="*.ts" .
grep -r "FIXME" --include="*.js" --include="*.ts" .

# Find configuration files
glob "**/config.*"
glob "**/.env*"

# Find test files
glob "**/*.test.*"
glob "**/*.spec.*"
glob "**/test/**"
```

### Step 7: Analyze Recent Activity

```bash
# View recent commits
git log --oneline -20

# View contributors
git log --format="%an" | sort | uniq -c | sort -rn | head -10

# Check recent changes
git diff --stat HEAD~10..HEAD
```

### Step 8: Extract Key Insights

Summarize findings:

```markdown
## Repository Analysis: <repo-name>

### Overview
- **Purpose**: [What it does]
- **Language**: [Primary language]
- **License**: [License type]
- **Stars**: [GitHub stars]

### Architecture
- **Structure**: [Monolith/Modular/Microservices]
- **Entry Points**: [Main files]
- **Key Modules**: [Important directories]

### Dependencies
- **Core**: [Key dependencies]
- **Dev Tools**: [Build/test tools]
- **Notable**: [Interesting dependencies]

### Code Quality
- **Tests**: [Test coverage indication]
- **Documentation**: [README quality, inline docs]
- **Issues**: [Active issues, maintenance status]

### Findings
- **Strengths**: [What's well done]
- **Concerns**: [Potential issues]
- **Use Cases**: [When to use this]
```

## Analysis Depth Levels

### Quick (5-10 minutes)
- README overview
- Top-level structure
- Main dependencies
- Recent activity

### Standard (15-30 minutes)
- + Code structure analysis
- + Entry point identification
- + Test file discovery
- + Basic architecture understanding

### Deep (1+ hours)
- + Core logic reading
- + Dependency graph analysis
- + Design patterns identification
- + Security review
- + Performance considerations

## Output Contract

**Quick analysis**:
```json
{
  "repo": "<name>",
  "purpose": "<one-line description>",
  "language": "<primary>",
  "license": "<type>",
  "key_files": ["..."],
  "recommendation": "<use/don't use/research more>"
}
```

**Standard/Deep analysis**:
```json
{
  "repo": "<name>",
  "overview": "...",
  "architecture": {
    "structure": "...",
    "entry_points": [...],
    "key_modules": [...]
  },
  "dependencies": {
    "core": [...],
    "dev": [...]
  },
  "code_quality": {
    "tests": "...",
    "documentation": "...",
    "maintainability": "..."
  },
  "findings": {
    "strengths": [...],
    "concerns": [...],
    "use_cases": [...]
  }
}
```

## Failure Modes

| Failure | Cause | Recovery |
|---------|-------|----------|
| Clone fails | Private repo, network | Use GitHub API or ask for access |
| No README | Poor documentation | Check code comments, issues |
| Huge repo | Large codebase | Focus on specific directories |
| Complex dependencies | Many sub-modules | Analyze gradually |

## Examples

### Example 1: Quick analysis

```bash
# User: "看看这个github项目 https://github.com/user/repo"

# Step 1-2: Clone and structure
git clone https://github.com/user/repo /tmp/repo-analysis/repo
cd /tmp/repo-analysis/repo
ls -la

# Step 3: README
cat README.md | head -50

# Output summary
```

### Example 2: Deep analysis with focus

```bash
# User: "分析这个项目的架构和依赖 https://github.com/org/project"

# Follow all 8 steps with depth=deep
# Focus on architecture and dependencies
# Generate detailed report
```

### Example 3: Compare multiple repos

```bash
# Analyze multiple repositories for comparison
# Use same depth level for fair comparison
# Generate comparison table
```

## Checklist

- [ ] Repository cloned successfully
- [ ] README and documentation read
- [ ] Code structure explored
- [ ] Dependencies identified
- [ ] Key files located
- [ ] Recent activity checked
- [ ] Findings documented
- [ ] Recommendations provided

## References

- GitHub API: https://docs.github.com/en/rest
- Git Commands: https://git-scm.com/docs
- Repository analysis best practices
