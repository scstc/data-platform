"""API v1 路由包。

各资源路由（datasources / ingest_tasks / uploads / ai）由对应模块提供，
每个模块需导出一个名为 ``router`` 的 ``APIRouter``，由 app.main 装配。
"""
