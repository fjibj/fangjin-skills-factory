# property 测试（属性测试）

> v3 新增。与 `scenarios/` 互补：场景是**举例式**（「这个输入 → 这个输出」），
> property 是**反例搜索**（「对所有输入，这条不变式都必须成立」）。

## 什么时候该写 property

当你有一条**"永远不能破"的语义约束**，而它很难用有限场景穷尽时：

- **隔离**：A 域的写操作不得影响 B 域的聚合
- **幂等**：同一请求重复执行结果一致
- **守恒/不变量**：计数不为负、总额等于明细之和
- **往返**：写入后读出应等价
- **顺序无关**：调换两个独立操作的顺序，最终状态相同

> 实战出处：agent-chat-box 切片 4 唯一的真实缺陷就是「信誉不跨域隔离」——
> 典型的不变量违例，用 property 可以在 E2E 场景跑完之前就抓住它。

## 文件格式

放两个示例：

- `isolation-example.json.example` — 跨域隔离
- `idempotent-example.json.example` — 查询幂等

**用法**：复制成 `xxx.json`（去掉 `.example`），把 `url` / `body` 换成你项目的 API，
再按需改 `variables` 的生成范围。`evaluate.ts` 只会加载 `.json`，`.example` 不会被跑。

```json
{
  "id": "PROP-01",
  "name": "reputation-cross-domain-isolation",
  "invariant": "群在域 A 的评分不得改变它在域 B 的聚合信誉",
  "runs": 25,
  "shrink": true,
  "variables": {
    "gname": { "type": "string", "prefix": "g-", "len": [3, 5] },
    "score": { "type": "int", "min": 1, "max": 9 }
  },
  "steps":  [ "…造数据的 check 数组…" ],
  "assert": [ "…验不变式的 check 数组…" ]
}
```

## 字段说明

| 字段 | 说明 |
|---|---|
| `id` | 与 `idsd/invariants.json` 的 `property` 字段对应 |
| `invariant` | 一句话陈述必须成立的约束（写给人看，也写进结果） |
| `runs` | 迭代次数，起步 20–30 即可（种子确定性，失败可复现） |
| `variables` | 参数生成器：`int` / `float` / `pick` / `string` / `bool` |
| `steps` | 每次迭代先造数据（失败即 `judge_issue=true`，属出题问题） |
| `assert` | 验不变式（失败即实现缺陷，会 shrink 出最小反例） |
| `shrink` | 是否收敛反例，默认 true |

## 变量类型

| type | 参数 | 产出 |
|---|---|---|
| `int` | `min` `max` | 区间内整数 |
| `float` | `min` `max` | 两位小数 |
| `pick` | `values` | 从枚举里选 |
| `string` | `prefix` `len:[lo,hi]` `suffix` | 带前后缀的随机串 |
| `bool` | — | 真/假 |

## 两条硬规则

1. **种子是确定性的**：`seed = fnv1a("<version>:<propId>:<i>")`。
   同一个版本重跑必然得到同一个反例——这是「可复算」的前提，**不要改成真随机**。
2. **数字参数用整占位 `"{{score}}"`**：evaluate.ts 对"整串就是占位符"的情形保留原类型；
   写成 `"score-{{score}}"` 会变成字符串，API 会拒收。

## 自查

- [ ] 不变式是"对所有输入成立"，不是"某个例子如此"
- [ ] `steps` 只造数据、`assert` 只验不变量（混在一起会让失败性质难判别）
- [ ] 至少有一条**应该通过**的属性（自证不是全在报错）
- [ ] 在 observe 模式下跑过一次，确认没有出题错误
