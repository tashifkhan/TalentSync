import requests

from app.core.cache import build_cache_key, get_cached_json_sync, set_cached_json_sync


def return_markdown(url: str, timeout: int = 5000) -> str:
    """Fetches the markdown content from a given URL using the Jina AI service."""

    if not url:
        return ""

    normalized_url = url.strip()
    cache_key = build_cache_key("web_markdown", normalized_url)
    cached = get_cached_json_sync(cache_key)
    if cached and isinstance(cached.get("content"), str):
        return cached["content"]

    try:
        res = requests.get(
            "https://r.jina.ai/" + normalized_url.lstrip("/"),
            timeout=timeout,
        )

        if res.status_code == 200 and res.text:
            set_cached_json_sync(cache_key, {"content": res.text}, ttl_seconds=1800)
            return res.text

        return ""

    except Exception:
        return ""
