---
{
  "checks": [
    { "name": "发起协作", "method": "POST", "url": "/api/domains/{{domainId}}/tasks", "body": { "requester_group_id": "group-a", "title": "协作", "required_capabilities": ["data-analysis"] }, "expect": { "status": 201 }, "capture": { "taskId": "task_id" } },
    { "name": "认领", "method": "POST", "url": "/api/tasks/{{taskId}}/group-claim", "body": { "agent_id": "agent-b", "team_id": "team-b" }, "expect": { "status": 200 }, "capture": { "authId": "authorization_request_id" } },
    { "name": "授权批准", "method": "POST", "url": "/api/authorizations/{{authId}}/approve", "body": {}, "expect": { "status": 200 } },
    { "name": "完成", "method": "POST", "url": "/api/tasks/{{taskId}}/force-complete", "body": {}, "expect": { "status": 200 } },
    { "name": "评分 approved", "method": "POST", "url": "/api/domains/{{domainId}}/tasks/{{taskId}}/rating", "body": { "rater_group_id": "group-a", "decision": "approved" }, "expect": { "status": 200 } },
    { "name": "信誉看板反映 +1", "method": "GET", "url": "/api/domains/{{domainId}}/reputation?group_id=group-a", "expect": { "status": 200, "json": { "$any": { "group_id": "group-b", "reputation": 1 } } } }
  ]
}
---
# 成功场景：协作完成后信誉更新

**场景**：群 A 发起协作 → 群 B 认领并执行 → 群 A 评分 approved。

**期望行为**：完整链路走通，群 B 的域级信誉 +1 反映到信誉看板。

> 完整闭环是 holdout 场景的黄金标准——把「发起→认领→授权→完成→评分」全链路
> 作为成功场景，任何一环断了都算失败（实战切片 3/5 验证）。
