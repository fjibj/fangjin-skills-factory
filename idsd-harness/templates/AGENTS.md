# AGENTS.md — Agent 行为规则
# ==========================================
# 这些规则是全局适用的行为底线，Agent 必须遵守。
# 只有在 Agent 反复犯某类错误时才新增规则，不要预先堆砌。


## 绝对禁止
- 不要读取或修改 `holdout/scenarios/` 目录下的任何文件
- 不要修改 `.claudeignore` 文件
- 不要在未运行测试前宣布任务完成
- 不要直接在生产配置文件中硬编码敏感信息
- 不要使用 fmt.Println / print() 做日志，使用项目统一的日志包


## 构建规范
- 新增文件时：检查项目中是否有相同功能的已有实现，避免重复
- 修改接口时：同步更新所有调用方，确保编译通过
- 引入依赖时：先检查是否已有同功能的依赖，避免引入冗余包
- 跨文件修改超过 5 个文件时：先更新 idsd/idsd-status.yaml 记录进度


## IDSD 状态文件维护
- 每次开始一个步骤时：`idsd/idsd-status.yaml` → status: in_progress, started_at: now
- 每次完成一个步骤后：`idsd/idsd-status.yaml` → status: completed, completed_at: now, 更新 artifacts
- 步骤失败时：`idsd/idsd-status.yaml` → status: failed, 在 errors 中记录原因
- 每次更新后：重新计算 summary 统计
