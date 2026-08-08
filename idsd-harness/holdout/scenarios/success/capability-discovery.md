---
{
  "checks": [
    { "name": "群 B 声明能力", "method": "POST", "url": "/api/domains/{{domainId}}/capabilities", "body": { "group_id": "group-b", "capabilities": ["data-analysis"] }, "expect": { "status": 200 } },
    { "name": "按能力发现返回群 B", "method": "GET", "url": "/api/domains/{{domainId}}/discover?capabilities=data-analysis&group_id=group-a", "expect": { "status": 200, "json": { "$any": { "group_id": "group-b", "reputation": 0, "flagged": false } } } },
    { "name": "成员能力列表含声明", "method": "GET", "url": "/api/domains/{{domainId}}/capabilities", "expect": { "status": 200, "json": { "$any": { "group_id": "group-b", "capabilities": { "$any": { "$eq": "data-analysis" } } } } } }
  ]
}
---
# 成功场景：跨群能力发现

**场景**：群 B 声明"数据分析"能力后，群 A 按能力搜索。

**期望行为**：发现结果按信誉排序，返回群 B 及其信誉分、flagged 标记。

> 注意 `$contains` 只支持字符串，数组字段要用 `$any: { "$eq": ... }`（实战踩坑）。
