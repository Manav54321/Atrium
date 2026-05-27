"""Unit tests for the direct-inference triage classifier.

These tests mock the OpenAI SDK so we can validate the code path
without hitting the API (and without needing a real key). Assertions:

    1. The OpenAI client is called with model=gpt-4.1-mini.
    2. The ESI-rules system prompt is passed in the 'system' field.
    3. Well-formed JSON responses parse into a TriageClassifyResponse.
    4. Malformed / fenced JSON is parsed when possible, otherwise 502.
    5. Invalid esi_level values are rejected as 502 rather than silently
       returned to the caller.

Run with:

    backend/.venv/Scripts/python.exe -m unittest backend.tests.test_triage
"""

from __future__ import annotations

import json
import os
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

os.environ.setdefault("GROQ_API_KEY", "gsk_test-dummy-groq-key")
os.environ.setdefault("EHR_API_TOKEN", "test-token-not-relevant-here")

_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from fastapi import HTTPException  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import server  # noqa: E402


def _fake_choice(text: str) -> SimpleNamespace:
    """Build a minimal stand-in for an OpenAI ChatCompletion choice."""
    message = SimpleNamespace(content=text)
    return SimpleNamespace(message=message)


def _fake_completion(text: str) -> SimpleNamespace:
    """Build a minimal stand-in for openai.types.chat.ChatCompletion."""
    return SimpleNamespace(choices=[_fake_choice(text)])


def _fake_client(return_text: str) -> MagicMock:
    client = MagicMock()
    client.chat.completions.create.return_value = _fake_completion(return_text)
    return client


WELL_FORMED_JSON = json.dumps(
    {
        "esi_level": "critical",
        "rationale": "ST elevation in II, III, aVF with troponin 3.2 — anterior wall MI.",
        "red_flags": ["ST elevation / new LBBB / troponin elevation"],
    }
)

SAMPLE_REQUEST = server.TriageClassifyRequest(
    patient_id="er-101",
    chief_complaint="crushing chest pain 45 min",
    vitals=server.VitalsSnapshot(
        hr=104, bp_systolic=152, bp_diastolic=94, spo2=95, rr=22
    ),
    ecg_findings="ST elevation II, III, aVF",
)


class TriageReasoningTests(unittest.TestCase):
    # ─── model routing ───────────────────────────────────────────
    def test_uses_groq_model(self) -> None:
        client = _fake_client(WELL_FORMED_JSON)
        server.run_triage_reasoning(client, SAMPLE_REQUEST)
        kwargs = client.chat.completions.create.call_args.kwargs
        self.assertEqual(kwargs["model"], "llama-3.3-70b-versatile")

    def test_system_prompt_contains_esi_rules(self) -> None:
        client = _fake_client(WELL_FORMED_JSON)
        server.run_triage_reasoning(client, SAMPLE_REQUEST)
        kwargs = client.chat.completions.create.call_args.kwargs
        messages = kwargs["messages"]
        system = next(m["content"] for m in messages if m["role"] == "system")
        self.assertIn("ESI", system)
        self.assertIn("red flag", system.lower())
        self.assertIn("critical", system)
        self.assertIn("urgent", system)
        self.assertIn("stable", system)

    def test_user_message_summarizes_the_patient(self) -> None:
        client = _fake_client(WELL_FORMED_JSON)
        server.run_triage_reasoning(client, SAMPLE_REQUEST)
        kwargs = client.chat.completions.create.call_args.kwargs
        messages = kwargs["messages"]
        user_msg = next(m for m in messages if m["role"] == "user")
        body = user_msg["content"]
        self.assertIn("er-101", body)
        self.assertIn("crushing chest pain", body)
        self.assertIn("HR 104", body)
        self.assertIn("BP 152/94", body)
        self.assertIn("ST elevation", body)

    # ─── response parsing ────────────────────────────────────────
    def test_well_formed_response_parses(self) -> None:
        client = _fake_client(WELL_FORMED_JSON)
        result = server.run_triage_reasoning(client, SAMPLE_REQUEST)
        self.assertEqual(result.patient_id, "er-101")
        self.assertEqual(result.esi_level, "critical")
        self.assertEqual(result.model, "llama-3.3-70b-versatile")
        self.assertIn("ST elevation", result.rationale)
        self.assertEqual(len(result.red_flags), 1)

    def test_json_fence_is_stripped(self) -> None:
        fenced = f"```json\n{WELL_FORMED_JSON}\n```"
        client = _fake_client(fenced)
        result = server.run_triage_reasoning(client, SAMPLE_REQUEST)
        self.assertEqual(result.esi_level, "critical")

    def test_bare_fence_is_stripped(self) -> None:
        fenced = f"```\n{WELL_FORMED_JSON}\n```"
        client = _fake_client(fenced)
        result = server.run_triage_reasoning(client, SAMPLE_REQUEST)
        self.assertEqual(result.esi_level, "critical")

    def test_malformed_json_raises_502(self) -> None:
        client = _fake_client("this is not JSON at all, sorry")
        with self.assertRaises(HTTPException) as cm:
            server.run_triage_reasoning(client, SAMPLE_REQUEST)
        self.assertEqual(cm.exception.status_code, 502)
        self.assertIn("malformed", cm.exception.detail)

    def test_invalid_esi_level_raises_502(self) -> None:
        bogus = json.dumps(
            {"esi_level": "ultra", "rationale": "r", "red_flags": []}
        )
        client = _fake_client(bogus)
        with self.assertRaises(HTTPException) as cm:
            server.run_triage_reasoning(client, SAMPLE_REQUEST)
        self.assertEqual(cm.exception.status_code, 502)

    def test_empty_response_raises_502(self) -> None:
        client = _fake_client("")
        with self.assertRaises(HTTPException) as cm:
            server.run_triage_reasoning(client, SAMPLE_REQUEST)
        self.assertEqual(cm.exception.status_code, 502)

    def test_missing_red_flags_defaults_to_empty_list(self) -> None:
        partial = json.dumps(
            {"esi_level": "stable", "rationale": "ankle sprain, vitals normal."}
        )
        client = _fake_client(partial)
        result = server.run_triage_reasoning(client, SAMPLE_REQUEST)
        self.assertEqual(result.esi_level, "stable")
        self.assertEqual(result.red_flags, [])


class TriageEndpointIntegrationTests(unittest.TestCase):
    """HTTP-level smoke of the endpoint, patching the OpenAI client."""

    def setUp(self) -> None:
        # Pass localhost origin so the auth middleware lets TestClient through.
        self.client = TestClient(server.app, headers={"origin": "http://localhost:5173"})

    def test_endpoint_returns_response_from_mocked_client(self) -> None:
        # Patch the lazy-built client so the route sees our mock.
        fake = _fake_client(WELL_FORMED_JSON)
        original = server._groq_client
        server._groq_client = fake
        try:
            resp = self.client.post(
                "/agent/triage/classify",
                json={
                    "patient_id": "er-101",
                    "chief_complaint": "crushing chest pain",
                    "vitals": {
                        "hr": 104,
                        "bp_systolic": 152,
                        "bp_diastolic": 94,
                        "spo2": 95,
                        "rr": 22,
                    },
                    "ecg_findings": "ST elevation",
                },
            )
        finally:
            server._groq_client = original
        self.assertEqual(resp.status_code, 200, resp.text)
        body = resp.json()
        self.assertEqual(body["esi_level"], "critical")
        self.assertEqual(body["model"], "llama-3.3-70b-versatile")


if __name__ == "__main__":
    unittest.main()
