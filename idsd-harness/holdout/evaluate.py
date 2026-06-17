#!/usr/bin/env python3
"""
IDSD Holdout Set 评估脚本

用途：运行场景验证，生成评估报告
位置：holdout/evaluate.py
用法：python holdout/evaluate.py <version_tag>
示例：python holdout/evaluate.py domain-v2

输出：holdout/results/<version_tag>.json

特点：
- 场景文件在 holdout/scenarios/ 下，构建代理被 .claudeignore 屏蔽
- 评估时用户手动运行此脚本，结果由 Claude Code 分析
- 支持成功场景、失败场景、边界场景三类评估
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Literal, Optional

# ============================================================================
# 类型定义
# ============================================================================

Status = Literal["PASS", "FAIL", "SKIP", "ERROR"]


# ============================================================================
# 场景评估器
# ============================================================================

class ScenarioEvaluator:
    """场景评估器 - 读取场景文件并运行对应的验证逻辑"""

    def __init__(self, holdout_dir: Path, project_root: Path):
        self.holdout_dir = holdout_dir
        self.project_root = project_root
        self.results_dir = holdout_dir / "results"
        self.results_dir.mkdir(parents=True, exist_ok=True)

        # 加载配置
        self.config = self._load_config()

    def _load_config(self) -> Dict:
        """加载评估配置"""
        config_path = self.holdout_dir / "runner-config.json"
        if config_path.exists():
            with open(config_path) as f:
                return json.load(f)
        return {
            "project_root": str(self.project_root),
            "scenarios_dir": str(self.holdout_dir / "scenarios"),
            "results_dir": str(self.results_dir),
            "test_command": "go test ./...",   # 可根据项目修改
            "build_command": "go build ./...",  # 可根据项目修改
        }

    # ------------------------------------------------------------------
    # 场景加载
    # ------------------------------------------------------------------

    def load_scenarios(self, category: str) -> List[Dict]:
        """加载某一类场景文件"""
        scenarios = []
        category_dir = self.holdout_dir / "scenarios" / category
        if not category_dir.exists():
            return scenarios

        for file in sorted(category_dir.glob("*.md")):
            content = file.read_text(encoding="utf-8")
            scenarios.append({
                "name": file.stem,
                "category": category,
                "file": str(file.relative_to(self.holdout_dir)),
                "description": content.strip(),
            })
        return scenarios

    def load_all_scenarios(self) -> List[Dict]:
        """加载所有场景"""
        scenarios = []
        for category in ["success", "failure", "boundary"]:
            scenarios.extend(self.load_scenarios(category))
        return scenarios

    # ------------------------------------------------------------------
    # 场景评估
    # ------------------------------------------------------------------

    def evaluate_scenario(self, scenario: Dict) -> Dict:
        """
        评估单个场景。

        默认实现：让用户手动确认场景是否通过。
        高级用法：可以重写此方法，接入项目的自动化测试逻辑。

        返回格式：
        {
            "name": str,
            "category": str,
            "status": "PASS" | "FAIL" | "SKIP" | "ERROR",
            "detail": str,
            "duration_ms": int,
        }
        """
        start = time.time()
        result = {
            "name": scenario["name"],
            "category": scenario["category"],
            "status": "SKIP",
            "detail": "未实现自动验证，需手动确认",
            "duration_ms": 0,
        }

        try:
            # ---------------------------------------------------------
            # 在这里接入你的项目测试逻辑
            # 以下是一些常见模式的示例：
            # ---------------------------------------------------------

            # --- 模式 1: 运行项目测试 ---
            # test_cmd = self.config.get("test_command", "go test ./...")
            # proc = subprocess.run(
            #     test_cmd, shell=True, cwd=self.project_root,
            #     capture_output=True, text=True, timeout=120
            # )
            # if proc.returncode == 0:
            #     result["status"] = "PASS"
            #     result["detail"] = "项目测试全部通过"
            # else:
            #     result["status"] = "FAIL"
            #     result["detail"] = f"测试失败:\n{proc.stderr[:500]}"

            # --- 模式 2: 健康检查 ---
            # build_cmd = self.config.get("build_command", "go build ./...")
            # proc = subprocess.run(
            #     build_cmd, shell=True, cwd=self.project_root,
            #     capture_output=True, text=True, timeout=60
            # )
            # if proc.returncode == 0:
            #     result["status"] = "PASS"
            # else:
            #     result["status"] = "ERROR"
            #     result["detail"] = f"构建失败:\n{proc.stderr[:500]}"

            # --- 默认: 人工确认 ---
            # 首次使用建议手动确认，后续逐步自动化
            result["status"] = "SKIP"
            result["detail"] = "请手动验证场景是否满足"

        except subprocess.TimeoutExpired:
            result["status"] = "ERROR"
            result["detail"] = "验证超时（> 120 秒）"
        except Exception as e:
            result["status"] = "ERROR"
            result["detail"] = f"验证异常: {str(e)}"

        result["duration_ms"] = int((time.time() - start) * 1000)
        return result

    def run_all(self, skip_auto: bool = False) -> Dict:
        """运行所有场景评估"""
        scenarios = self.load_all_scenarios()
        if not scenarios:
            print("⚠️  未找到场景文件，请先在 holdout/scenarios/ 下创建场景")
            return self._empty_result()

        results = {
            "version": "",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total": len(scenarios),
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "errors": 0,
            "pass_rate": 0.0,
            "scenarios": [],
            "build_status": "unknown",
            "test_status": "unknown",
        }

        print(f"\n{'='*60}")
        print(f"  IDSD Holdout Set 评估")
        print(f"  场景总数: {len(scenarios)}")
        print(f"{'='*60}\n")

        for i, scenario in enumerate(scenarios, 1):
            print(f"  [{i}/{len(scenarios)}] {scenario['name']} ({scenario['category']})...", end=" ")
            sys.stdout.flush()

            result = self.evaluate_scenario(scenario)
            results["scenarios"].append(result)

            if result["status"] == "PASS":
                results["passed"] += 1
                print(f"✅ 通过")
            elif result["status"] == "FAIL":
                results["failed"] += 1
                print(f"❌ 失败")
            elif result["status"] == "ERROR":
                results["errors"] += 1
                print(f"⚠️  异常")
            else:
                results["skipped"] += 1
                print(f"⏭️  跳过")

            if result["status"] in ("FAIL", "ERROR"):
                print(f"     原因: {result['detail']}")

        # 计算通过率
        evaluated = results["passed"] + results["failed"]
        results["pass_rate"] = round(
            (results["passed"] / evaluated * 100) if evaluated > 0 else 0, 1
        )

        # 构建和测试状态
        results["build_status"] = self._check_build()
        results["test_status"] = self._check_tests()

        return results

    # ------------------------------------------------------------------
    # 环境检查
    # ------------------------------------------------------------------

    def _check_build(self) -> str:
        """检查项目是否能构建"""
        try:
            cmd = self.config.get("build_command", "go build ./...")
            proc = subprocess.run(
                cmd, shell=True, cwd=self.project_root,
                capture_output=True, text=True, timeout=60
            )
            return "passed" if proc.returncode == 0 else "failed"
        except Exception:
            return "unknown"

    def _check_tests(self) -> str:
        """检查项目测试是否通过"""
        try:
            cmd = self.config.get("test_command", "go test ./...")
            proc = subprocess.run(
                cmd, shell=True, cwd=self.project_root,
                capture_output=True, text=True, timeout=120
            )
            return "passed" if proc.returncode == 0 else "failed"
        except Exception:
            return "unknown"

    # ------------------------------------------------------------------
    # 结果管理
    # ------------------------------------------------------------------

    def _empty_result(self) -> Dict:
        return {
            "version": "",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total": 0,
            "passed": 0,
            "failed": 0,
            "skipped": 0,
            "errors": 0,
            "pass_rate": 0.0,
            "scenarios": [],
            "build_status": "unknown",
            "test_status": "unknown",
        }

    def save_results(self, results: Dict, version: str):
        """保存评估结果"""
        results["version"] = version
        output_file = self.results_dir / f"{version}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n📄 结果已保存: {output_file}")

    def print_summary(self, results: Dict):
        """打印评估摘要"""
        print(f"\n{'='*60}")
        print(f"  📋 IDSD Holdout Set 评估报告")
        print(f"{'='*60}")
        print(f"  版本:      {results['version']}")
        print(f"  时间:      {results['timestamp'][:19]}")
        print(f"  {'─'*50}")
        print(f"  总场景数:  {results['total']}")
        print(f"  通过:      {results['passed']}  ✅")
        print(f"  失败:      {results['failed']}  ❌")
        print(f"  跳过:      {results['skipped']}  ⏭️")
        print(f"  异常:      {results['errors']}  ⚠️")
        print(f"  {'─'*50}")
        print(f"  通过率:    {results['pass_rate']}%")
        print(f"  构建状态:  {'✅' if results['build_status']=='passed' else '❌' if results['build_status']=='failed' else '❓'} {results['build_status']}")
        print(f"  测试状态:  {'✅' if results['test_status']=='passed' else '❌' if results['test_status']=='failed' else '❓'} {results['test_status']}")
        print(f"{'='*60}")

        if results["failed"] > 0:
            print(f"\n❌ 失败的场景:")
            for s in results["scenarios"]:
                if s["status"] == "FAIL":
                    print(f"  - [{s['category']}] {s['name']}")
                    print(f"    原因: {s['detail']}")


# ============================================================================
# 入口
# ============================================================================

def main():
    if len(sys.argv) < 2:
        print("用法: python holdout/evaluate.py <version_tag>")
        print("示例: python holdout/evaluate.py domain-v2")
        print("      python holdout/evaluate.py domain-v2 --skip-auto")
        sys.exit(1)

    version = sys.argv[1]
    skip_auto = "--skip-auto" in sys.argv

    # 确定项目根目录（holdout/ 的上级目录）
    script_dir = Path(__file__).parent.resolve()
    project_root = script_dir.parent

    print(f"🔍 项目根目录: {project_root}")
    print(f"🔖 版本标签:    {version}")
    if skip_auto:
        print(f"⏭️  跳过自动验证")

    # 创建评估器并运行
    evaluator = ScenarioEvaluator(holdout_dir=script_dir, project_root=project_root)
    results = evaluator.run_all(skip_auto=skip_auto)

    # 保存并输出结果
    evaluator.save_results(results, version)
    evaluator.print_summary(results)

    # 如果有失败，退出码非 0
    if results["failed"] > 0 or results["errors"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
