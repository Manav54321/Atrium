"""End-to-end smoke test for the Atrium backend.

Run this before a demo to confirm the OpenAI Assistants pipeline is alive.
It exercises every endpoint the browser uses, in order, and prints a
concise PASS/FAIL per step so you can spot a regression in seconds.

Usage:

    backend/.venv/Scripts/python.exe backend/smoke_test.py

Exits 0 if every step passes, 1 otherwise. Safe to run repeatedly; it
does not mutate persistent state (creates a throwaway session that will
idle out for free).
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Optional
from urllib.parse import urlencode

BASE = "http://127.0.0.1:8787"
TIMEOUT = 20.0


def _request(
    method: str,
    path: str,
    body: Optional[dict] = None,
) -> tuple[int, dict | str]:
    url = f"{BASE}{path}"
    data = None
    headers: dict[str, str] = {
        "Origin": "http://localhost:5173",
    }
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            payload = resp.read().decode("utf-8", errors="replace")
            status = resp.status
    except urllib.error.HTTPError as e:
        payload = e.read().decode("utf-8", errors="replace")
        status = e.code
    try:
        return status, json.loads(payload)
    except ValueError:
        return status, payload


def _stream(path: str, seconds: float = 10.0) -> list[dict]:
    """Open the SSE stream and collect events for N seconds, then close."""
    url = f"{BASE}{path}"
    events: list[dict] = []
    deadline = time.monotonic() + seconds
    req = urllib.request.Request(url, headers={"Origin": "http://localhost:5173"})
    try:
        with urllib.request.urlopen(req, timeout=seconds + 5) as resp:
            cur_event: Optional[str] = None
            cur_data: list[str] = []
            while time.monotonic() < deadline:
                line = resp.readline().decode("utf-8", errors="replace")
                if not line:
                    break
                line = line.rstrip("\n")
                if line.startswith(":"):
                    continue  # comment / keepalive
                if line == "":
                    if cur_event and cur_data:
                        try:
                            events.append(
                                {"type": cur_event, "payload": json.loads("".join(cur_data))}
                            )
                        except ValueError:
                            events.append({"type": cur_event, "payload": "".join(cur_data)})
                    cur_event = None
                    cur_data = []
                    continue
                if line.startswith("event:"):
                    cur_event = line[len("event:"):].strip()
                elif line.startswith("data:"):
                    cur_data.append(line[len("data:"):].lstrip())
    except Exception as e:
        events.append({"type": "transport_error", "payload": str(e)})
    return events


class Reporter:
    def __init__(self) -> None:
        self.failures: list[str] = []
        self.passed = 0

    def check(self, name: str, condition: bool, detail: Any = "") -> None:
        if condition:
            self.passed += 1
            print(f"PASS  {name}")
            return
        self.failures.append(f"{name} — {detail}")
        print(f"FAIL  {name}  ({detail})")

    def done(self) -> int:
        print(
            f"\n{self.passed} passed, {len(self.failures)} failed."
        )
        return 1 if self.failures else 0


def main() -> int:
    r = Reporter()

    # ─── 1. /health ────────────────────────────────────────────────
    status, body = _request("GET", "/health")
    r.check("GET /health returns 200", status == 200, f"status={status}")
    if isinstance(body, dict):
        agent = body.get("agent") or {}
        r.check(
            "health: openai SDK installed",
            bool(agent.get("openai_sdk_installed")),
            "install openai>=1.78.0 in backend venv",
        )
        r.check(
            "health: OPENAI_API_KEY configured",
            bool(agent.get("api_key_configured")),
            "set OPENAI_API_KEY in backend/.env.local",
        )
        r.check(
            "health: agent bootstrapped",
            bool(agent.get("bootstrapped")),
            "run /agent/bootstrap and persist ATRIUM_AGENT_ID to backend/.env.local",
        )
    else:
        r.check("health body parses as JSON", False, body)
        return r.done()

    # ─── 2. /agent/bootstrap (idempotent) ──────────────────────────
    status, body = _request("POST", "/agent/bootstrap")
    r.check("POST /agent/bootstrap returns 200", status == 200, f"status={status} body={body}")
    if isinstance(body, dict):
        r.check(
            "bootstrap: created=false (cached IDs used)",
            body.get("created") is False,
            f"got {body.get('created')!r} — indicates a new agent was created",
        )

    # ─── 3. /agent/sessions (create) ───────────────────────────────
    status, body = _request("POST", "/agent/sessions", {"title": "smoke_test"})
    r.check("POST /agent/sessions returns 200", status == 200, f"status={status} body={body}")
    session_id: Optional[str] = None
    if isinstance(body, dict):
        session_id = body.get("session_id")
        r.check("session_id returned", bool(session_id), "no session_id in response")
    if not session_id:
        return r.done()

    # ─── 5. /agent/sessions/{id}/events (send + stream) ────────────
    # First send the user message to the thread
    status, body = _request(
        "POST",
        f"/agent/sessions/{session_id}/events",
        {
            "events": [
                {
                    "type": "user.message",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "[ER arrival] patient 62M severity=critical. "
                                "HR 104 BP 152/94 SpO2 95 RR 22. ST elevation "
                                "on ECG, crushing chest pain. Emit "
                                "render_triage_badge."
                            ),
                        }
                    ],
                }
            ]
        },
    )
    r.check("POST /events returns 200", status == 200, f"status={status} body={body}")

    # Now start the stream worker to run the assistant and stream its reply
    import threading

    events_collected: list[dict] = []

    def stream_worker() -> None:
        events_collected.extend(_stream(f"/agent/sessions/{session_id}/stream", seconds=25))

    t = threading.Thread(target=stream_worker, daemon=True)
    t.start()

    t.join(timeout=30)

    # What arrived on the stream?
    type_counts: dict[str, int] = {}
    for ev in events_collected:
        type_counts[ev["type"]] = type_counts.get(ev["type"], 0) + 1

    transport_errs = [ev["payload"] for ev in events_collected if ev["type"] == "transport_error"]
    r.check(
        "stream: session.status_running observed",
        type_counts.get("session.status_running", 0) >= 1,
        f"types seen: {type_counts}, errors: {transport_errs}",
    )
    r.check(
        "stream: agent.custom_tool_use observed",
        type_counts.get("agent.custom_tool_use", 0) >= 1,
        f"agent did not emit a custom tool. types seen: {type_counts}, errors: {transport_errs}",
    )
    r.check(
        "stream: session.status_idle observed",
        type_counts.get("session.status_idle", 0) >= 1,
        f"types seen: {type_counts}",
    )

    # ─── 6. /agent/sessions/{id}/events (list) ─────────────────────
    status, body = _request("GET", f"/agent/sessions/{session_id}/events?limit=50")
    r.check("GET /events (list) returns 200", status == 200, f"status={status}")
    if isinstance(body, dict):
        data = body.get("data") or []
        r.check(
            "list: returned at least one event",
            len(data) >= 1,
            f"got {len(data)} events",
        )

    # ─── 7. /agent/refresh (no-op schema change) ───────────────────
    status, body = _request("POST", "/agent/refresh")
    r.check("POST /agent/refresh returns 200", status == 200, f"status={status}")

    return r.done()


if __name__ == "__main__":
    sys.exit(main())
