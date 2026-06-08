"""加工算子目录(首版精选)。

对应需求 #7 数据清洗常用算子 + 一个长度过滤,均已实测可跑。
完整从 data-juicer 自动抽取 schema(212 算子)留后续;首版精选保证可用、参数简单。
"""

from __future__ import annotations

from typing import Any

OPERATOR_CATALOG: list[dict[str, Any]] = [
    {
        "name": "clean_html_mapper",
        "category": "clean",
        "label": "去除 HTML 标签",
        "description": "移除文本中的 HTML 标签",
        "params": [],
    },
    {
        "name": "clean_links_mapper",
        "category": "clean",
        "label": "去除链接",
        "description": "移除文本中的 URL 链接",
        "params": [],
    },
    {
        "name": "clean_email_mapper",
        "category": "clean",
        "label": "去除邮箱",
        "description": "移除文本中的邮箱地址",
        "params": [],
    },
    {
        "name": "clean_copyright_mapper",
        "category": "clean",
        "label": "去除版权声明",
        "description": "移除代码/文本头部的版权声明注释",
        "params": [],
    },
    {
        "name": "fix_unicode_mapper",
        "category": "clean",
        "label": "修复乱码",
        "description": "规范化 unicode、修复乱码字符",
        "params": [],
    },
    {
        "name": "whitespace_normalization_mapper",
        "category": "clean",
        "label": "规范化空格",
        "description": "把各类空白字符规范为标准空格",
        "params": [],
    },
    {
        "name": "chinese_convert_mapper",
        "category": "clean",
        "label": "中文繁简转换",
        "description": "繁体 ↔ 简体转换",
        "params": [
            {
                "name": "mode",
                "label": "模式",
                "type": "select",
                "default": "t2s",
                "options": ["t2s", "s2t"],
            }
        ],
    },
    {
        "name": "remove_specific_chars_mapper",
        "category": "clean",
        "label": "移除指定字符",
        "description": "移除指定的特殊字符",
        "params": [
            {
                "name": "chars_to_remove",
                "label": "待移除字符",
                "type": "string",
                "default": "◆●■►▼▲▴∆▻▷❖♡□",
            }
        ],
    },
    {
        "name": "text_length_filter",
        "category": "filter",
        "label": "文本长度过滤",
        "description": "按文本长度区间保留数据",
        "params": [
            {"name": "min_len", "label": "最小长度", "type": "number", "default": 10},
            {
                "name": "max_len",
                "label": "最大长度",
                "type": "number",
                "default": 100000,
            },
        ],
    },
]
