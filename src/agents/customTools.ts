// Custom tools exposed to the `atrium-attending` Managed Agent.
//
// The agent-side tool definitions live in `backend/server.py` as
// `ATRIUM_CUSTOM_TOOLS` (JSON Schema, sent to `agents.create`). This file is
// the browser-side twin: a Zod schema per tool, used to validate the
// `input` of every `agent.custom_tool_use` event before we render it.
//
// If you change a schema here, update `ATRIUM_CUSTOM_TOOLS` in
// `backend/server.py` too. They must match.

import { z } from 'zod';

export const CUSTOM_TOOL_NAMES = [
  'render_vitals_chart',
  'render_bed_map',
  'render_triage_badge',
  'render_patient_timeline',
  'render_case_evaluation',
  'flag_critical_finding',
  'lookup_ehr_history',
] as const;

export type CustomToolName = (typeof CUSTOM_TOOL_NAMES)[number];

// Per-tool permission policy. `auto` tools ack immediately with a canned
// result so the agent can keep going. `confirm` tools block the agent
// on a user decision — the renderer shows an approve/decline UI and the
// caller's click decides the result payload.
//
// Custom tools don't go through OpenAI's permission-policy gate (that
// covers native + MCP tools), so this is a frontend-enforced layer.
export const CUSTOM_TOOL_PERMISSIONS = {
  render_vitals_chart: 'auto',
  render_bed_map: 'auto',
  render_triage_badge: 'auto',
  render_patient_timeline: 'auto',
  render_case_evaluation: 'auto',
  flag_critical_finding: 'confirm',
  lookup_ehr_history: 'auto',
} as const satisfies Record<CustomToolName, 'auto' | 'confirm'>;

export type ToolPermission = (typeof CUSTOM_TOOL_PERMISSIONS)[CustomToolName];

export function getToolPermission(name: CustomToolName): ToolPermission {
  return CUSTOM_TOOL_PERMISSIONS[name];
}

export const vitalsChartInput = z.object({
  patient_id: z.string().min(1),
});
export type VitalsChartInput = z.infer<typeof vitalsChartInput>;

export const bedMapInput = z.object({}).strict();
export type BedMapInput = z.infer<typeof bedMapInput>;

export const triageBadgeInput = z.object({
  zone: z.enum(['red', 'yellow', 'green']),
  reason: z.string().min(1),
});
export type TriageBadgeInput = z.infer<typeof triageBadgeInput>;

export const patientTimelineInput = z.object({
  patient_id: z.string().min(1),
});
export type PatientTimelineInput = z.infer<typeof patientTimelineInput>;

// ── render_case_evaluation — end-of-encounter OSCE debrief ─────────
//
// Replaces the old flat-score `render_case_grade`. Mirrors the JSON
// schema in backend/server.py:render_case_evaluation. Every cited
// `guideline_ref` should resolve in src/data/guidelines.ts via
// `getRecommendation()` — the renderer surfaces a "?" badge if not.

const verdictBand = z.enum([
  'clear-fail',
  'borderline',
  'satisfactory',
  'good',
  'excellent',
]);

const domainScore = z.object({
  raw: z.number(),
  max: z.number(),
  verdict: verdictBand,
});

const criterionResult = z.object({
  criterion_id: z.string().min(1),
  domain: z.enum(['data_gathering', 'clinical_management', 'interpersonal']),
  verdict: z.enum(['met', 'partially-met', 'missed']),
  evidence: z.string().min(1),
  guideline_ref: z.string().nullable().optional(),
});

const safetyBreach = z.object({
  what: z.string().min(1),
  guideline_ref: z.string().nullable().optional(),
});

export const caseEvaluationInput = z.object({
  case_id: z.string().min(1),
  global_rating: verdictBand,
  domain_scores: z.object({
    data_gathering: domainScore,
    clinical_management: domainScore,
    interpersonal: domainScore,
  }),
  criteria: z.array(criterionResult),
  safety_breach: safetyBreach.nullable().optional(),
  highlights: z.array(z.string()),
  improvements: z.array(z.string()),
  narrative: z.string().min(1),
});
export type CaseEvaluationInput = z.infer<typeof caseEvaluationInput>;
export type CriterionResult = z.infer<typeof criterionResult>;
export type DomainScore = z.infer<typeof domainScore>;
export type VerdictBand = z.infer<typeof verdictBand>;

export const flagCriticalFindingInput = z.object({
  patient_id: z.string().min(1),
  severity: z.enum(['critical', 'urgent']),
  reason: z.string().min(1),
});
export type FlagCriticalFindingInput = z.infer<typeof flagCriticalFindingInput>;

export const lookupEhrHistoryInput = z.object({
  patient_id: z.string().min(1),
});
export type LookupEhrHistoryInput = z.infer<typeof lookupEhrHistoryInput>;

export const customToolSchemas = {
  render_vitals_chart: vitalsChartInput,
  render_bed_map: bedMapInput,
  render_triage_badge: triageBadgeInput,
  render_patient_timeline: patientTimelineInput,
  render_case_evaluation: caseEvaluationInput,
  flag_critical_finding: flagCriticalFindingInput,
  lookup_ehr_history: lookupEhrHistoryInput,
} satisfies Record<CustomToolName, z.ZodTypeAny>;

export type ParsedCustomToolUse =
  | { name: 'render_vitals_chart'; input: VitalsChartInput }
  | { name: 'render_bed_map'; input: BedMapInput }
  | { name: 'render_triage_badge'; input: TriageBadgeInput }
  | { name: 'render_patient_timeline'; input: PatientTimelineInput }
  | { name: 'render_case_evaluation'; input: CaseEvaluationInput }
  | { name: 'flag_critical_finding'; input: FlagCriticalFindingInput }
  | { name: 'lookup_ehr_history'; input: LookupEhrHistoryInput };

export type ParseResult =
  | { ok: true; call: ParsedCustomToolUse }
  | { ok: false; name: string; error: string };

export function parseCustomToolUse(
  toolName: string,
  input: unknown,
): ParseResult {
  if (!(CUSTOM_TOOL_NAMES as readonly string[]).includes(toolName)) {
    return { ok: false, name: toolName, error: `unknown tool: ${toolName}` };
  }
  const name = toolName as CustomToolName;
  const schema = customToolSchemas[name];
  const result = schema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      name,
      error: result.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; '),
    };
  }
  return {
    ok: true,
    call: { name, input: result.data } as ParsedCustomToolUse,
  };
}
