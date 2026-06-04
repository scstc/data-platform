"""上传路由集成测试：覆盖合法上传落盘、非法扩展名拒绝、列表分页。

用上层 conftest 的 `client` fixture（httpx AsyncClient + adp_test 测试库）。
"""

from __future__ import annotations

from pathlib import Path

from httpx import AsyncClient

from app.core.config import settings


def _uploaded_files(filename: str) -> list[Path]:
    """落盘目录中文件名以 ``_<filename>`` 结尾的真实文件（uuid 前缀）。"""
    upload_dir = Path(settings.upload_dir)
    if not upload_dir.exists():
        return []
    return [p for p in upload_dir.iterdir() if p.name.endswith(f"_{filename}")]


async def test_upload_jsonl_then_listed_and_persisted(client: AsyncClient) -> None:
    """合法 jsonl 上传：响应 done → 列表可查 → 文件确实落盘。"""
    filename = "corpus_test.jsonl"
    content = b'{"text": "hello"}\n{"text": "world"}\n'
    created: list[Path] = []
    try:
        resp = await client.post(
            "/api/v1/upload",
            files={"file": (filename, content, "application/json")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        record = body["data"]
        # 字段名为 camelCase，枚举/格式与契约一致
        assert record["id"].startswith("up-")
        assert record["filename"] == filename
        assert record["size"] == len(content)
        assert record["format"] == "jsonl"
        assert record["status"] == "done"
        assert "uploadedAt" in record

        # 文件真实落盘（uuid 前缀防重名）
        created = _uploaded_files(filename)
        assert len(created) == 1
        assert created[0].read_bytes() == content

        # 列表可查到该记录
        list_resp = await client.get(
            "/api/v1/uploads", params={"current": 1, "pageSize": 10}
        )
        assert list_resp.status_code == 200
        list_body = list_resp.json()
        assert list_body["success"] is True
        assert list_body["total"] == 1
        ids = [item["id"] for item in list_body["data"]]
        assert record["id"] in ids
    finally:
        for p in created:
            p.unlink(missing_ok=True)


async def test_upload_rejects_disallowed_extension(client: AsyncClient) -> None:
    """非法扩展名 .exe：400 + success=false + 中文 message，且不落盘、不入库。"""
    resp = await client.post(
        "/api/v1/upload",
        files={"file": ("malware.exe", b"MZ\x00\x00", "application/octet-stream")},
    )
    assert resp.status_code == 400
    body = resp.json()
    assert body["success"] is False
    assert isinstance(body["message"], str) and body["message"]

    # 未写入文件
    assert _uploaded_files("malware.exe") == []
    # 未写入记录
    list_resp = await client.get("/api/v1/uploads")
    assert list_resp.json()["total"] == 0


async def test_upload_extension_case_insensitive(client: AsyncClient) -> None:
    """大写扩展名 .CSV 视为合法。"""
    filename = "data_test.CSV"
    created: list[Path] = []
    try:
        resp = await client.post(
            "/api/v1/upload",
            files={"file": (filename, b"a,b\n1,2\n", "text/csv")},
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["format"] == "csv"
        created = _uploaded_files(filename)
    finally:
        for p in created:
            p.unlink(missing_ok=True)


async def test_uploads_list_pagination(client: AsyncClient) -> None:
    """分页：上传 3 个 → pageSize=2 时第 1 页 2 条、第 2 页 1 条，total=3。"""
    filenames = ["p1_test.txt", "p2_test.txt", "p3_test.txt"]
    created: list[Path] = []
    try:
        for name in filenames:
            resp = await client.post(
                "/api/v1/upload",
                files={"file": (name, b"hello", "text/plain")},
            )
            assert resp.status_code == 200
            created += _uploaded_files(name)

        page1 = (
            await client.get("/api/v1/uploads", params={"current": 1, "pageSize": 2})
        ).json()
        assert page1["total"] == 3
        assert len(page1["data"]) == 2

        page2 = (
            await client.get("/api/v1/uploads", params={"current": 2, "pageSize": 2})
        ).json()
        assert page2["total"] == 3
        assert len(page2["data"]) == 1

        # 两页 id 不重叠，合计覆盖全部 3 条
        ids = {item["id"] for item in page1["data"]} | {
            item["id"] for item in page2["data"]
        }
        assert len(ids) == 3
    finally:
        for p in created:
            p.unlink(missing_ok=True)
