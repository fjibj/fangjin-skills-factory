---
{
  "checks": [
    { "name": "第一次 rejected", "method": "POST", "url": "/api/domains/{{domainId}}/tasks/{{taskId}}/rating", "body": { "rater_group_id": "group-a", "decision": "rejected" }, "expect": { "status": 200 } },
    { "name": "发现结果未标记（1 次不够）", "method": "GET", "url": "/api/domains/{{domainId}}/discover?capabilities=data-analysis&group_id=group-a", "expect": { "status": 200, "json": { "$any": { "group_id": "group-b", "flagged": false } } } },
    { "name": "连续 5 次 rejected 后 flagged", "method": "GET", "url": "/api/domains/{{domainId}}/discover?capabilities=data-analysis&group_id=group-a", "expect": { "status": 200, "json": { "$any": { "group_id": "group-b", "flagged": true } } } }
  ]
}
---
# 失败场景：恶意刷信誉被标记

**场景**：群 B 连续 5 次协作被 rejected。

**期望行为**：连续 5 次 rejected 后，群 B 在发现/信誉结果中被标记 flagged。
（阈值与计数规则以项目 Intent 为准；本示例演示「连续计数 → 标记」的断言写法。）
