"""通用 schema 基类与分页响应。

约定：
- JSON 输出一律 camelCase（alias_generator=to_camel），但同时允许按字段名填充
  （populate_by_name=True），便于内部用 snake_case 构造。
- from_attributes=True 让 schema 能直接从 ORM 对象读取。
- 输出响应时务必 model_dump(by_alias=True) / response_model + by_alias。
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """所有对外 schema 的基类：snake_case 字段 ⇄ camelCase JSON。"""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class PageResponse[T](CamelModel):
    """分页响应：{data:[...], total:int, success:true}。"""

    data: list[T]
    total: int
    success: bool = True
