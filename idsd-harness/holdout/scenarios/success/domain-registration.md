---
{
  "checks": [
    { "name": "创建域", "method": "POST", "url": "/api/domains", "body": { "name": "demo", "owner_group_id": "group-a" }, "expect": { "status": 201 }, "capture": { "domainId": "id" } },
    { "name": "域出现在列表", "method": "GET", "url": "/api/domains?group_id=group-a", "expect": { "status": 200, "json": { "$any": { "id": "{{domainId}}" } } } },
    { "name": "生成邀请码", "method": "POST", "url": "/api/domains/{{domainId}}/invite", "body": {}, "expect": { "status": 200 }, "capture": { "inviteCode": "invite_code" } },
    { "name": "新群加入", "method": "POST", "url": "/api/domains/join", "body": { "invite_code": "{{inviteCode}}", "group_id": "group-b" }, "expect": { "status": 200 } },
    { "name": "域详情含新成员", "method": "GET", "url": "/api/domains/{{domainId}}", "expect": { "status": 200, "json": { "members": { "$any": { "group_id": "group-b" } } } } }
  ]
}
---
# 成功场景：新群申请加入域

**场景**：群 A 创建域并生成邀请码，群 B 凭邀请码加入。

**期望行为**：注册成功、邀请码可用、域详情反映成员变化。
（front-matter 的 checks 为机器可执行断言；正文是给人读的场景描述。）
