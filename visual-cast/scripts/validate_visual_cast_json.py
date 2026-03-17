#!/usr/bin/env python3
"""
Repair and validate Visual Cast normalization output.

Usage:
    python3 validate_visual_cast_json.py model-output.txt
    python3 validate_visual_cast_json.py --stdin < model-output.txt
    python3 validate_visual_cast_json.py response.txt --fallback-on-error
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

REQUIRED_KEYS = ("type", "title", "summary", "tags", "metrics", "meta")

FALLBACK_ITEM = {
    "type": "fallback",
    "title": "数据解析失败",
    "summary": "上游内容未能稳定转换为结构化数据，请检查输入或重试。",
    "tags": ["fallback"],
    "metrics": "retry",
    "meta": {},
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate and repair Visual Cast JSON output.")
    parser.add_argument("input", nargs="?", help="Input file containing model output.")
    parser.add_argument("--stdin", action="store_true", help="Read model output from stdin.")
    parser.add_argument("--output", help="Write normalized JSON to file.")
    parser.add_argument("--fallback-on-error", action="store_true", help="Emit fallback item on error.")
    parser.add_argument("--max-title-length", type=int, default=36, help="Clamp title length.")
    parser.add_argument("--max-summary-length", type=int, default=80, help="Clamp summary length.")
    return parser.parse_args()


def read_input(args: argparse.Namespace) -> str:
    if args.stdin:
        return sys.stdin.read()
    if not args.input:
        raise ValueError("Provide an input file or use --stdin.")
    return Path(args.input).read_text(encoding="utf-8")


def strip_code_fences(text: str) -> str:
    text = text.strip().lstrip("\ufeff")
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def extract_json_payload(text: str) -> str:
    text = strip_code_fences(text)
    array_start = text.find("[")
    array_end = text.rfind("]")
    if array_start != -1 and array_end != -1 and array_end > array_start:
        return text[array_start : array_end + 1]

    object_start = text.find("{")
    object_end = text.rfind("}")
    if object_start != -1 and object_end != -1 and object_end > object_start:
        return text[object_start : object_end + 1]

    return text


def repair_common_json_issues(text: str) -> str:
    text = text.replace("\r\n", "\n").strip()
    text = re.sub(r",(\s*[}\]])", r"\1", text)
    return text


def load_json(text: str) -> Any:
    payload = repair_common_json_issues(extract_json_payload(text))
    return json.loads(payload)


def clamp(text: str, limit: int) -> str:
    text = " ".join(str(text).split()).strip()
    if len(text) <= limit:
        return text
    if limit <= 1:
        return text[:limit]
    return text[: limit - 1].rstrip() + "…"


def normalize_tags(tags: Any) -> list[str]:
    if not isinstance(tags, list):
        return []

    cleaned: list[str] = []
    seen: set[str] = set()
    for tag in tags:
        value = " ".join(str(tag).split()).strip()
        if not value:
            continue
        if value in seen:
            continue
        seen.add(value)
        cleaned.append(value)
        if len(cleaned) >= 4:
            break
    return cleaned


def normalize_item(item: Any, max_title_length: int, max_summary_length: int) -> dict[str, Any]:
    if not isinstance(item, dict):
        raise ValueError("Each normalized item must be an object.")

    normalized = {
        "type": clamp(item.get("type", ""), 24) or "unknown",
        "title": clamp(item.get("title", ""), max_title_length) or "未命名条目",
        "summary": clamp(item.get("summary", ""), max_summary_length) or "暂无摘要",
        "tags": normalize_tags(item.get("tags", [])),
        "metrics": clamp(item.get("metrics", ""), 24),
        "meta": item.get("meta", {}) if isinstance(item.get("meta", {}), dict) else {},
    }

    for key in REQUIRED_KEYS:
        if key not in normalized:
            raise ValueError(f"Missing required key: {key}")

    return normalized


def normalize_payload(payload: Any, max_title_length: int, max_summary_length: int) -> list[dict[str, Any]]:
    if isinstance(payload, dict):
        payload = [payload]

    if not isinstance(payload, list):
        raise ValueError("Top-level JSON value must be an array or object.")

    normalized_items = [
        normalize_item(item, max_title_length=max_title_length, max_summary_length=max_summary_length)
        for item in payload
    ]

    if not normalized_items:
        raise ValueError("Normalized array is empty.")

    return normalized_items


def dump_output(data: list[dict[str, Any]], output_path: str | None) -> None:
    rendered = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if output_path:
        Path(output_path).write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)


def main() -> int:
    args = parse_args()
    try:
        raw = read_input(args)
        payload = load_json(raw)
        normalized = normalize_payload(
            payload,
            max_title_length=args.max_title_length,
            max_summary_length=args.max_summary_length,
        )
    except Exception as exc:  # noqa: BLE001
        if args.fallback_on_error:
            dump_output([FALLBACK_ITEM], args.output)
            return 0
        sys.stderr.write(f"visual-cast json validation failed: {exc}\n")
        return 1

    dump_output(normalized, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
