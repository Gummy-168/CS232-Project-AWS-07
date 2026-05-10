from __future__ import annotations

import json
import os
import time
from typing import Any, Literal
from urllib.request import urlopen

from jose import JWTError, jwt

COGNITO_REGION = os.getenv("COGNITO_REGION", "")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
COGNITO_APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")
COGNITO_ISSUER = os.getenv("COGNITO_ISSUER", "")

if COGNITO_ISSUER:
    JWKS_URL = f"{COGNITO_ISSUER}/.well-known/jwks.json"
elif COGNITO_REGION and COGNITO_USER_POOL_ID:
    JWKS_URL = (
        f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/"
        f"{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    )
else:
    JWKS_URL = ""

_JWKS_CACHE: dict[str, Any] = {"keys": [], "expires_at": 0.0}
_JWKS_TTL_SECONDS = 3600


def is_enabled() -> bool:
    return bool(COGNITO_APP_CLIENT_ID and COGNITO_ISSUER and JWKS_URL)


def _fetch_jwks() -> list[dict[str, Any]]:
    if not JWKS_URL:
        raise ValueError("Cognito JWKS URL is not configured")

    now = time.time()
    if _JWKS_CACHE["keys"] and _JWKS_CACHE["expires_at"] > now:
        return _JWKS_CACHE["keys"]

    with urlopen(JWKS_URL, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))

    keys = payload.get("keys") or []
    if not isinstance(keys, list) or len(keys) == 0:
        raise ValueError("Invalid JWKS payload")

    _JWKS_CACHE["keys"] = keys
    _JWKS_CACHE["expires_at"] = now + _JWKS_TTL_SECONDS
    return keys


def _find_jwk_for_kid(kid: str) -> dict[str, Any]:
    keys = _fetch_jwks()
    for key in keys:
        if key.get("kid") == kid:
            return key
    raise ValueError("No matching JWKS key for token kid")


def _validate_client_claim(claims: dict[str, Any]) -> None:
    token_use = str(claims.get("token_use") or "")
    app_client_id = COGNITO_APP_CLIENT_ID

    if token_use == "access":
        client_id = str(claims.get("client_id") or "")
        if client_id != app_client_id:
            raise ValueError("Invalid client_id for Cognito access token")
        return

    aud = claims.get("aud")
    if isinstance(aud, str):
        audiences = [aud]
    elif isinstance(aud, list):
        audiences = [str(item) for item in aud]
    else:
        audiences = []

    if app_client_id not in audiences:
        raise ValueError("Invalid aud for Cognito id token")


def verify_cognito_token(
    token: str,
    expected_token_use: Literal["access", "id"] | None = None,
) -> dict[str, Any]:
    if not is_enabled():
        raise ValueError("Cognito authentication is not configured")

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise ValueError("Invalid Cognito token header") from exc

    kid = str(unverified_header.get("kid") or "")
    if not kid:
        raise ValueError("Missing kid in Cognito token header")

    signing_key = _find_jwk_for_kid(kid)

    try:
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=COGNITO_ISSUER,
            options={
                "verify_exp": True,
                "verify_iss": True,
                "verify_aud": False,
            },
        )
    except JWTError as exc:
        raise ValueError("Invalid Cognito token") from exc

    token_use = str(claims.get("token_use") or "")
    if expected_token_use:
        if token_use != expected_token_use:
            raise ValueError(f"Invalid token_use: expected {expected_token_use}")
    elif token_use not in {"access", "id"}:
        raise ValueError("token_use must be 'access' or 'id'")

    _validate_client_claim(claims)
    return claims
