"""Unit tests for the hospital-EHR credential vault endpoint.

Run via the backend venv (so FastAPI + starlette are available):

    backend/.venv/Scripts/python.exe -m unittest backend.tests.test_vault

The tests spin up the FastAPI app in-process via ``TestClient`` so no
uvicorn or network is required. They assert that:

    1. The EHR_API_TOKEN never appears in any response body or log
       line produced by a vault lookup.
    2. Known patients return the expected record shape.
    3. Unknown patients return 404 instead of leaking the set of IDs.
    4. The endpoint returns 503 when the vault is not configured.
    5. Malformed requests are rejected by pydantic without a 500.
"""

from __future__ import annotations

import logging
import os
import sys
import unittest
from pathlib import Path

# Stub required env BEFORE importing server — it otherwise refuses to
# boot some paths. The GROQ_API_KEY value is a dummy; we never
# call Groq in these tests.
os.environ["EHR_API_TOKEN"] = "vault-secret-test-token-93af2d"
os.environ.setdefault("GROQ_API_KEY", "gsk_test-dummy-groq-key")

# Make ``backend/`` importable whether unittest is launched from the
# repo root or from inside ``backend/``.
_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from fastapi.testclient import TestClient  # noqa: E402

import server  # noqa: E402


_VAULT_TOKEN = os.environ["EHR_API_TOKEN"]


class VaultEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        # Pass localhost origin so the auth middleware lets TestClient through.
        self.client = TestClient(server.app, headers={"origin": "http://localhost:5173"})

    # ─── happy path ──────────────────────────────────────────────
    def test_known_patient_returns_record(self) -> None:
        resp = self.client.post(
            "/agent/vault/ehr/lookup",
            json={"patient_id": "poly-001"},
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        body = resp.json()
        self.assertEqual(body["patient_id"], "poly-001")
        self.assertEqual(body["fetched_via"], "credential-vault")
        self.assertIn("record", body)
        record = body["record"]
        self.assertEqual(record["patient_id"], "poly-001")
        self.assertIn("prior_encounters", record)
        self.assertIn("active_medications", record)
        self.assertIn("allergies", record)

    def test_second_known_patient(self) -> None:
        resp = self.client.post(
            "/agent/vault/ehr/lookup",
            json={"patient_id": "er-101"},
        )
        self.assertEqual(resp.status_code, 200)

    # ─── token redaction (THE point of the feature) ─────────────
    def test_response_body_never_contains_vault_token(self) -> None:
        resp = self.client.post(
            "/agent/vault/ehr/lookup",
            json={"patient_id": "poly-001"},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertNotIn(
            _VAULT_TOKEN,
            resp.text,
            "vault token leaked into response body",
        )

    def test_response_headers_never_contain_vault_token(self) -> None:
        resp = self.client.post(
            "/agent/vault/ehr/lookup",
            json={"patient_id": "poly-001"},
        )
        for name, value in resp.headers.items():
            self.assertNotIn(
                _VAULT_TOKEN,
                value,
                f"vault token leaked into response header {name}",
            )

    def test_log_line_never_contains_vault_token(self) -> None:
        log = logging.getLogger("atrium.agent")
        handler = _CapturingHandler()
        log.addHandler(handler)
        try:
            resp = self.client.post(
                "/agent/vault/ehr/lookup",
                json={"patient_id": "poly-001"},
            )
            self.assertEqual(resp.status_code, 200)
        finally:
            log.removeHandler(handler)
        for record in handler.records:
            msg = record.getMessage()
            self.assertNotIn(
                _VAULT_TOKEN,
                msg,
                f"vault token leaked into log line: {msg!r}",
            )

    # ─── error paths ────────────────────────────────────────────
    def test_unknown_patient_returns_404(self) -> None:
        resp = self.client.post(
            "/agent/vault/ehr/lookup",
            json={"patient_id": "ghost-9999"},
        )
        self.assertEqual(resp.status_code, 404)

    def test_missing_patient_id_returns_422(self) -> None:
        resp = self.client.post("/agent/vault/ehr/lookup", json={})
        self.assertEqual(resp.status_code, 422)

    def test_empty_patient_id_returns_400(self) -> None:
        resp = self.client.post(
            "/agent/vault/ehr/lookup",
            json={"patient_id": "   "},
        )
        self.assertEqual(resp.status_code, 400)

    def test_vault_not_configured_returns_503(self) -> None:
        previous = os.environ.pop("EHR_API_TOKEN", None)
        try:
            resp = self.client.post(
                "/agent/vault/ehr/lookup",
                json={"patient_id": "poly-001"},
            )
            self.assertEqual(resp.status_code, 503)
            self.assertNotIn(
                "vault-secret",
                resp.text.lower(),
                "error response should not echo any token substring",
            )
        finally:
            if previous is not None:
                os.environ["EHR_API_TOKEN"] = previous

    # ─── tool registration sanity ──────────────────────────────
    def test_lookup_tool_registered_in_ATRIUM_CUSTOM_TOOLS(self) -> None:
        names = {t["function"]["name"] for t in server.ATRIUM_CUSTOM_TOOLS}
        self.assertIn("lookup_ehr_history", names)

    def test_vault_never_references_token_in_tool_description(self) -> None:
        tool = next(
            t for t in server.ATRIUM_CUSTOM_TOOLS
            if t["function"]["name"] == "lookup_ehr_history"
        )
        self.assertNotIn(_VAULT_TOKEN, str(tool))
        # The parameters schema should not ask the agent for a token
        self.assertNotIn(
            "token", str(tool["function"]["parameters"]).lower(),
            "input schema must not ask the agent for a token",
        )


class _CapturingHandler(logging.Handler):
    def __init__(self) -> None:
        super().__init__(level=logging.DEBUG)
        self.records: list[logging.LogRecord] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.records.append(record)


if __name__ == "__main__":
    unittest.main()
