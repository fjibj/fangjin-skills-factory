---
{
  "checks": [
    { "name": "域 D2 中群 B 信誉不受 D1 影响", "method": "GET", "url": "/api/domains/{{domainD2}}/reputation?group_id={{groupA}}", "expect": { "status": 200, "json": { "$any": { "group_id": "group-b", "reputation": 0 } } } },
    { "name": "D2 成员访问 D1 数据 → 403", "method": "GET", "url": "/api/domains/{{domainD1}}/tasks?group_id={{groupC}}", "expect": { "status": 403 } },
    { "name": "D2 任务列表不含 D1 任务", "method": "GET", "url": "/api/domains/{{domainD2}}/tasks?group_id={{groupA}}", "expect": { "status": 200, "json": { "$none": { "task_id": "{{taskD1}}" } } } }
  ]
}
---
# 边界场景：群同时属于多个域

**场景**：群 B 同属域 D1、D2；域 D1 内对 B 的评分事件不应影响 B 在 D2 的信誉。

**期望行为**：
- 各域独立维护成员信誉，不跨域传播（**隔离语义是聚合设计里最容易漏的角落**——
  实战切片 4 的 holdout 首次抓出的实现缺陷就是它）
- 跨域数据不可见：D2 成员访问 D1 数据 → 403

> 前置 setup（建群/域/加入/协作/评分）在更早的 check 中完成，此处只列关键断言。
