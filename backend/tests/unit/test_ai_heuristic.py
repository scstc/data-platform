"""启发式 AI 提供者纯单测。

不依赖 DB / 网络 / 配置。覆盖：
- JSONL 样本字段类型识别
- CSV 表头识别
- 兜底 text/plain
- 「每天凌晨2点从S3拉取」→ cron "0 2 * * *" + type s3
- qa 命中与兜底
另含 JSON / TSV、async provider 包装的轻量校验，确保接口形状与契约一致。
"""

from __future__ import annotations

import asyncio

from app.services.ai.heuristic import (
    HeuristicProvider,
    answer_question,
    generate_task_from_prompt,
    infer_schema_from_sample,
)


def _field_map(schema: dict) -> dict[str, dict]:
    return {f["name"]: f for f in schema["fields"]}


# ---------------------------------------------------------------------------
# infer_schema：JSONL
# ---------------------------------------------------------------------------


def test_infer_schema_jsonl_field_types():
    sample = (
        '{"id": 1, "name": "张三", "score": 9.5, "active": true,'
        ' "ts": "2026-06-04 10:00:00"}\n'
        '{"id": 2, "name": "李四", "score": 8.0, "active": false, "ts": "2026-06-03"}\n'
        '{"id": 3, "name": "王五", "score": 7.2, "active": true, "ts": "2026-06-02"}'
    )
    schema = infer_schema_from_sample(sample)

    assert schema["format"] == "application/x-ndjson"
    assert schema["recommendedConfig"]["format"] == "jsonl"
    assert 0.85 <= schema["confidence"] <= 0.98

    fields = _field_map(schema)
    assert fields["id"]["type"] == "integer"
    assert fields["name"]["type"] == "string"
    assert fields["score"]["type"] == "float"
    assert fields["active"]["type"] == "boolean"
    assert fields["ts"]["type"] == "datetime"
    # 全部行都有值 → 非 nullable
    assert fields["id"]["nullable"] is False


def test_infer_schema_jsonl_below_threshold_falls_through():
    """JSON 成功行不足 60% 时，不应判为 JSONL（落到 CSV/兜底分支）。"""
    sample = '{"a": 1}\n这不是json\n也不是json\n还是不是\n仍然不是'
    schema = infer_schema_from_sample(sample)
    assert schema["format"] != "application/x-ndjson"


# ---------------------------------------------------------------------------
# infer_schema：CSV / TSV
# ---------------------------------------------------------------------------


def test_infer_schema_csv_header():
    sample = "id,name,price\n1,苹果,3.5\n2,香蕉,2.0"
    schema = infer_schema_from_sample(sample)

    assert schema["format"] == "text/csv"
    assert schema["recommendedConfig"]["format"] == "csv"
    assert schema["recommendedConfig"]["delimiter"] == ","
    assert schema["recommendedConfig"]["hasHeader"] is True
    assert 0.85 <= schema["confidence"] <= 0.94

    fields = _field_map(schema)
    assert list(fields.keys()) == ["id", "name", "price"]
    assert fields["id"]["type"] == "integer"
    assert fields["name"]["type"] == "string"
    assert fields["price"]["type"] == "float"


def test_infer_schema_tsv_header():
    sample = "col_a\tcol_b\tcol_c\n1\thello\t2026-06-04\n2\tworld\t2026-06-05"
    schema = infer_schema_from_sample(sample)

    assert schema["format"] == "text/tab-separated-values"
    assert schema["recommendedConfig"]["format"] == "tsv"
    assert schema["recommendedConfig"]["delimiter"] == "\t"

    fields = _field_map(schema)
    assert fields["col_a"]["type"] == "integer"
    assert fields["col_b"]["type"] == "string"
    assert fields["col_c"]["type"] == "datetime"


# ---------------------------------------------------------------------------
# infer_schema：纯 JSON
# ---------------------------------------------------------------------------


def test_infer_schema_pure_json_object():
    schema = infer_schema_from_sample('{"a": 1, "b": "x"}')
    assert schema["format"] == "application/json"
    assert schema["recommendedConfig"]["format"] == "json"
    fields = _field_map(schema)
    assert fields["a"]["type"] == "integer"
    assert fields["b"]["type"] == "string"


# ---------------------------------------------------------------------------
# infer_schema：兜底 text/plain
# ---------------------------------------------------------------------------


def test_infer_schema_fallback_plain_text():
    sample = "这是一段没有结构的纯文本，既不是 json 也不是表格。"
    schema = infer_schema_from_sample(sample)

    assert schema["format"] == "text/plain"
    assert schema["confidence"] == 0.85
    assert schema["recommendedConfig"]["format"] == "text"
    assert len(schema["fields"]) == 1
    field = schema["fields"][0]
    assert field["name"] == "text"
    assert field["type"] == "string"
    assert field["nullable"] is False
    assert field["example"] == sample[:60]


def test_infer_schema_empty_sample_falls_back():
    schema = infer_schema_from_sample("")
    assert schema["format"] == "text/plain"


# ---------------------------------------------------------------------------
# generate_task：调度 + 数据源类型
# ---------------------------------------------------------------------------


def test_generate_task_daily_2am_s3():
    result = generate_task_from_prompt("每天凌晨2点从S3拉取数据")
    assert result["schedule"] == {"mode": "cron", "cron": "0 2 * * *"}
    assert result["datasourceType"] == "s3"
    assert result["config"]["datasourceType"] == "s3"
    assert result["name"].endswith("采集任务")
    assert "explanation" in result and result["explanation"]


def test_generate_task_hourly():
    result = generate_task_from_prompt("每小时从 HDFS 增量采集日志")
    assert result["schedule"] == {"mode": "cron", "cron": "0 * * * *"}
    assert result["datasourceType"] == "hdfs"


def test_generate_task_weekly_default_hour():
    result = generate_task_from_prompt("每周从接口同步一次")
    assert result["schedule"] == {"mode": "cron", "cron": "0 1 * * 1"}
    assert result["datasourceType"] == "api"


def test_generate_task_database_dbkind():
    result = generate_task_from_prompt("每天从达梦数据库导出业务表")
    assert result["datasourceType"] == "database"
    assert result["config"]["dbKind"] == "dameng"
    # 「凌晨」未出现，命中「每天」但无小时 → 0 点
    assert result["schedule"] == {"mode": "cron", "cron": "0 0 * * *"}


def test_generate_task_once_when_no_keyword():
    result = generate_task_from_prompt("从对象存储抓取一批历史归档")
    assert result["schedule"] == {"mode": "once"}
    assert result["datasourceType"] == "s3"


# ---------------------------------------------------------------------------
# qa：命中与兜底
# ---------------------------------------------------------------------------


def test_qa_hit_datasource_question():
    answer = answer_question("平台支持哪些数据源？")
    assert "对象存储" in answer
    assert "HDFS" in answer


def test_qa_hit_cron_question():
    answer = answer_question("cron 定时怎么配？")
    assert "cron" in answer.lower()


def test_qa_fallback():
    answer = answer_question("今天天气怎么样？")
    assert answer.startswith("抱歉")
    assert "支持哪些数据源" in answer


# ---------------------------------------------------------------------------
# async provider 包装：形状与契约一致
# ---------------------------------------------------------------------------


def test_provider_async_methods_shape():
    provider = HeuristicProvider()

    schema = asyncio.run(provider.infer_schema("id,name\n1,a"))
    assert set(schema) >= {"format", "confidence", "fields", "suggestion"}

    task = asyncio.run(provider.generate_task("每天凌晨2点从S3拉取"))
    assert set(task) == {"name", "datasourceType", "schedule", "config", "explanation"}

    qa = asyncio.run(provider.qa("支持哪些数据源"))
    assert set(qa) == {"answer"}
    assert isinstance(qa["answer"], str)
