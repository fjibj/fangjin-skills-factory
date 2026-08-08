---
{
  "checks": [
    { "name": "协作完成", "method": "POST", "url": "/api/tasks/{{taskId}}/force-complete", "body": {}, "expect": { "status": 200 } },
    { "name": "评分 rejected", "method": "POST", "url": "/api/domains/{{domainId}}/tasks/{{taskId}}/rating", "body": { "rater_group_id": "group-a", "decision": "rejected" }, "expect": { "status": 200 } },
    { "name": "连续低分后能力被标记", "method": "GET", "url": "/api/domains/{{domainId}}/discover?capabilities=data-analysis&group_id=group-a", "expect": { "status": 200, "json": { "$any": { "group_id": "group-b", "flagged": true } } } }
  ]
}
---
# 边界场景：能力声明与实际不符

**场景**：群 B 声明的能力与实际提供的服务质量不符（连续被 rejected）。

**期望行为**：
1. 协作完成后，接收方可对服务质量评分
2. 连续低分（低于阈值，阈值以项目 Intent 为准）触发能力降级标记
3. 降级后的群在发现结果中带 flagged 标记
4. 群 B 可更新能力声明重新申请评级

> 前置 setup（建域/声明能力/发起协作/认领/授权）在更早的 check 中完成。
> 阈值与计数规则：见项目 Intent 的失败条件（如"连续 5 次协作评分异常的群被标记"）。
