---
name: ima-upload
description: Upload files to IMA knowledge base with full preflight checks, COS upload, and verification. Supports PDF, DOCX, Markdown, images, and more. Use when user wants to upload documents to IMA knowledge base.
version: 1.0.0
author: fangjin
license: MIT
metadata:
  tags: [ima, knowledge-base, upload, cos, document]
  triggers:
    - "upload to ima"
    - "upload file to knowledge base"
    - "ima upload"
    - "添加到ima知识库"
    - "上传到ima"
---

# IMA Upload Skill

Upload files to IMA (ima.qq.com) knowledge base with complete workflow including preflight checks, COS upload, and verification.

## Purpose

Automate the complete IMA file upload workflow:
1. File preflight validation (type, size)
2. Duplicate name checking
3. COS credential acquisition
4. File upload to COS
5. Knowledge base registration
6. Upload verification

## Activation Signals

Use this skill when:
- User says "upload to IMA" or "upload file to knowledge base"
- User mentions "ima upload" or "添加到ima知识库"
- Need to upload documents, PDFs, Markdown files to IMA knowledge base

## Inputs

| Parameter | Required | Description |
|-----------|----------|-------------|
| `file_path` | Yes | Absolute path to the file to upload |
| `knowledge_base_id` | Yes | Target knowledge base ID (e.g., "b7a2f763b7a2f763") |

## Preconditions

1. IMA credentials configured in `~/.config/ima/client_id` and `~/.config/ima/api_key`
2. Target knowledge base exists and is accessible
3. File exists and is readable

## Supported File Types

| Extension | media_type | content_type |
|-----------|-----------|--------------|
| .pdf | 1 | application/pdf |
| .doc/.docx | 3 | application/msword |
| .ppt/.pptx | 4 | application/vnd.ms-powerpoint |
| .xls/.xlsx/.csv | 5 | application/vnd.ms-excel |
| .md | 7 | text/markdown |
| .png/.jpg/.jpeg/.webp | 9 | image/png, image/jpeg |
| .txt | 13 | text/plain |
| .mp3/.m4a/.wav/.aac | 15 | audio/mpeg |

**NOT supported**: Video files (.mp4, .avi, .mov), HTML files, URLs

## Step-by-Step Procedure

### Step 1: Preflight Check

Validate file type and size:

```bash
node ~/.claude/plugins/ima-skills/ima-skill/knowledge-base/scripts/preflight-check.cjs \
  --file "<file_path>"
```

**Expected output**: `{"pass":true,"file_name":"...","file_size":...,"media_type":...,"content_type":"..."}`

**Decision rule**: If `pass: false`, stop and report the error to user.

### Step 2: Check for Duplicate Names

```bash
curl -s -X POST "https://ima.qq.com/openapi/wiki/v1/check_repeated_names" \
  -H "ima-openapi-clientid: $(cat ~/.config/ima/client_id)" \
  -H "ima-openapi-apikey: $(cat ~/.config/ima/api_key)" \
  -d "{
    \"params\": [{\"name\": \"<file_name>\", \"media_type\": <media_type>}],
    \"knowledge_base_id\": \"<knowledge_base_id>\"
  }"
```

**Decision rule**: If duplicates found, warn user but continue (IMA handles versioning).

### Step 3: Create Media (Get COS Credentials)

```bash
curl -s -X POST "https://ima.qq.com/openapi/wiki/v1/create_media" \
  -H "ima-openapi-clientid: $(cat ~/.config/ima/client_id)" \
  -H "ima-openapi-apikey: $(cat ~/.config/ima/api_key)" \
  -d "{
    \"file_name\": \"<file_name>\",
    \"file_size\": <file_size>,
    \"content_type\": \"<content_type>\",
    \"knowledge_base_id\": \"<knowledge_base_id>\",
    \"file_ext\": \"<file_ext>\"
  }"
```

**Expected output**: JSON with `media_id` and `cos_credential` object containing:
- `secret_id`, `secret_key`, `token`
- `bucket_name`, `region`, `cos_key`
- `start_time`, `expired_time`

### Step 4: Upload to COS

```bash
node ~/.claude/plugins/ima-skills/ima-skill/knowledge-base/scripts/cos-upload.cjs \
  --file "<file_path>" \
  --secret-id "<cos_credential.secret_id>" \
  --secret-key "<cos_credential.secret_key>" \
  --token "<cos_credential.token>" \
  --bucket "<cos_credential.bucket_name>" \
  --region "<cos_credential.region>" \
  --cos-key "<cos_credential.cos_key>" \
  --content-type "<content_type>" \
  --start-time "<cos_credential.start_time>" \
  --expired-time "<cos_credential.expired_time>"
```

**Expected output**: Upload success message

### Step 5: Add to Knowledge Base

```bash
curl -s -X POST "https://ima.qq.com/openapi/wiki/v1/add_knowledge" \
  -H "ima-openapi-clientid: $(cat ~/.config/ima/client_id)" \
  -H "ima-openapi-apikey: $(cat ~/.config/ima/api_key)" \
  -d "{
    \"media_type\": <media_type>,
    \"media_id\": \"<media_id>\",
    \"title\": \"<file_name>\",
    \"knowledge_base_id\": \"<knowledge_base_id>\",
    \"file_info\": {
      \"cos_key\": \"<cos_key>\",
      \"file_size\": <file_size>,
      \"file_name\": \"<file_name>\"
    }
  }"
```

**Expected output**: `{"code":0,"msg":"success",...}`

### Step 6: Verify Upload

```bash
curl -s -X POST "https://ima.qq.com/openapi/wiki/v1/search_knowledge" \
  -H "ima-openapi-clientid: $(cat ~/.config/ima/client_id)" \
  -H "ima-openapi-apikey: $(cat ~/.config/ima/api_key)" \
  -d "{
    \"query\": \"<file_name>\",
    \"knowledge_base_id\": \"<knowledge_base_id>\"
  }"
```

**Decision rule**: Verify the file appears in search results.

## Output Contract

On success, return:
```json
{
  "success": true,
  "media_id": "...",
  "file_name": "...",
  "knowledge_base_id": "...",
  "file_size": 1234,
  "media_type": 7
}
```

On failure, return:
```json
{
  "success": false,
  "error": "...",
  "step": "...",
  "suggestion": "..."
}
```

## Failure Modes

| Failure | Cause | Recovery |
|---------|-------|----------|
| Credentials missing | `~/.config/ima/client_id` or `api_key` not found | Prompt user to configure credentials at https://ima.qq.com/agent-interface |
| File type not supported | Extension not in supported list | Convert file to supported format or reject |
| File too large | Exceeds IMA size limits | Compress or split file |
| Duplicate name conflict | File with same name exists | Continue (IMA handles versions) or rename |
| COS upload failed | Network/token expired | Retry once, then report |
| Add knowledge failed | Server error | Retry once, check API response |

## Examples

### Example 1: Upload a Markdown file

```bash
# User request: "Upload my report.md to IMA knowledge base b7a2f763b7a2f763"

file_path="/home/user/documents/report.md"
knowledge_base_id="b7a2f763b7a2f763"

# Execute the 6-step procedure above
```

### Example 2: Upload a PDF document

```bash
# User request: "Upload research paper to IMA"

file_path="/home/user/papers/research.pdf"
knowledge_base_id="b7a2f763b7a2f763"

# Execute the 6-step procedure above
# media_type will be 1 for PDF
```

## Checklist

- [ ] IMA credentials configured (`~/.config/ima/client_id` and `api_key`)
- [ ] File exists and is readable
- [ ] File type is supported (check extension)
- [ ] Knowledge base ID is valid
- [ ] All 6 steps completed successfully
- [ ] Upload verified via search API
- [ ] User notified of success/failure with details

## References

- IMA API Documentation: https://ima.qq.com/openapi/wiki/v1/
- COS Upload Script: `~/.claude/plugins/ima-skills/ima-skill/knowledge-base/scripts/cos-upload.cjs`
- Preflight Check Script: `~/.claude/plugins/ima-skills/ima-skill/knowledge-base/scripts/preflight-check.cjs`
