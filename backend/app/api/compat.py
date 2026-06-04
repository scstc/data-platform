"""模板登录兼容层：复刻 Ant Design Pro mock 的登录体系真实实现。

前端 MOCK=none 后，登录/当前用户/登出/验证码/通知这套接口需要后端真实提供。
本模块逐字镜像模板 mock 的响应形状（权威参考：
frontend/mock/user.ts、frontend/mock/utils.ts 的 defaultUser、
frontend/src/services/ant-design-pro/api.ts），仅把用户信息本地化为本平台文案。

接口挂在 /api 前缀下（不是 /api/v1），与模板前端请求路径一致。

会话方案说明（非生产方案）：
本兼容层采用纯 cookie 无状态鉴权——cookie ``adp_session`` 的值即角色字符串
（``admin`` / ``user``），不签名、不加密、无服务端会话存储。这仅供开发期联调
使用，真实部署必须替换为带签名/过期/服务端校验的会话机制（如 JWT 或服务端 session）。
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Cookie, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(tags=["compat-auth"])

# cookie 名与可接受的角色值（cookie 值即角色，开发级无状态方案）。
_COOKIE_NAME = "adp_session"
_VALID_ROLES = ("admin", "user")

# 模板 defaultUser 的头像 URL 原样保留；其余字段本地化为本平台文案。
_AVATAR_URL = "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png"


class LoginParams(BaseModel):
    """登录请求体，镜像模板 mock 的 {username, password, type}。"""

    username: str | None = None
    password: str | None = None
    type: str | None = None


def _current_user_payload(role: str) -> dict:
    """构造 currentUser 的 data 体。

    字段集合参照模板 defaultUser 但本地化：name/title 随角色，其余为平台文案。
    geographic 形状照搬模板（province/city 的 label/key）。
    """
    name = "管理员" if role == "admin" else "普通用户"
    return {
        "name": name,
        "avatar": _AVATAR_URL,
        "userid": "00000001",
        "email": "admin@adp.local",
        "signature": "面向大模型的数据工程与数据集管理平台",
        "title": "平台管理员",
        "group": "AI 数据平台",
        "tags": [],
        "notifyCount": 0,
        "unreadCount": 0,
        "country": "China",
        "geographic": {
            "province": {"label": "浙江省", "key": "330000"},
            "city": {"label": "杭州市", "key": "330100"},
        },
        "address": "",
        "phone": "",
        "access": role,
    }


@router.post("/login/account")
async def login_account(body: LoginParams) -> JSONResponse:
    """登录：admin/user + ant.design 成功并下发角色 cookie，其余返回 guest。

    成功响应 {"status":"ok","type":<回显>,"currentAuthority":<角色>} 并设角色 cookie；
    失败响应 {"status":"error","type":<回显>,"currentAuthority":"guest"} 且不设 cookie。
    不模拟模板 mock 的 2 秒延迟。
    """
    if body.password == "ant.design" and body.username in _VALID_ROLES:
        role = body.username
        response = JSONResponse(
            {"status": "ok", "type": body.type, "currentAuthority": role}
        )
        # cookie 值即角色，无状态；HttpOnly + samesite=lax 与开发期前端同源请求兼容。
        response.set_cookie(
            _COOKIE_NAME, role, httponly=True, samesite="lax"
        )
        return response

    return JSONResponse(
        {"status": "error", "type": body.type, "currentAuthority": "guest"}
    )


@router.get("/currentUser")
async def current_user(
    adp_session: Annotated[str | None, Cookie()] = None,
) -> JSONResponse:
    """当前用户：无有效角色 cookie → 401 模板形状；有 → 200 本地化用户体。"""
    if adp_session not in _VALID_ROLES:
        return JSONResponse(
            status_code=401,
            content={
                "data": {"isLogin": False},
                "errorCode": "401",
                "errorMessage": "请先登录！",
                "success": True,
            },
        )
    return JSONResponse(
        {"success": True, "data": _current_user_payload(adp_session)}
    )


@router.post("/login/outLogin")
async def out_login(response: Response) -> dict:
    """登出：清除角色 cookie，返回模板形状 {"data":{},"success":true}。"""
    response.delete_cookie(_COOKIE_NAME)
    return {"data": {}, "success": True}


@router.get("/login/captcha")
async def login_captcha() -> str:
    """验证码：模板 mock 返回 JSON 字符串 "captcha-xxx"。不模拟 2 秒延迟。"""
    return "captcha-xxx"


@router.get("/notices")
async def notices() -> dict:
    """通知列表：模板形状 {"data":[],"success":true}，本平台暂无通知。"""
    return {"data": [], "success": True}
