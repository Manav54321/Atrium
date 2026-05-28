import { useEffect, useMemo, useRef, useState } from 'react';
import { Doodle, TopBar } from './primitives';
import { store, useGameState } from '../game/store';
import { getPatientCase } from '../data/cases';
import { TESTS } from '../data/tests';
import { TREATMENTS } from '../data/treatments';
import { getRecommendation } from '../data/guidelines';
import { useAttendingDebrief } from '../agents/useAttendingDebrief';
import { buildDebriefRequest, summariseRequest } from '../agents/debriefRequest';
import { saveEvalHistory, getEvalHistory, type EvalHistoryEntry } from '../data/evalHistory';
import { POLYCLINIC_DIAGNOSIS_LABELS } from '../data/polyclinicPatients';
import type {
  CaseEvaluationInput,
  CriterionResult,
  DomainScore,
  VerdictBand,
} from '../agents/customTools';
import type { ActivePatient, PatientCase } from '../game/types';

// ── verdict / colour mapping ───────────────────────────────────────

const GLOBAL_HEADLINE: Record<VerdictBand, string> = {
  excellent: 'Excellent — top tier',
  good: 'Good — solid case',
  satisfactory: 'Satisfactory — good effort',
  borderline: 'Borderline — worth re-running',
  'clear-fail': 'Clear fail — let\u2019s restart',
};

const GLOBAL_BG: Record<VerdictBand, string> = {
  excellent: 'var(--mint)',
  good: 'var(--mint)',
  satisfactory: 'var(--butter)',
  borderline: 'var(--peach)',
  'clear-fail': 'var(--rose)',
};

const GLOBAL_DEEP: Record<VerdictBand, string> = {
  excellent: 'var(--mint-deep)',
  good: 'var(--mint-deep)',
  satisfactory: 'var(--butter-deep)',
  borderline: 'var(--peach-deep)',
  'clear-fail': 'var(--rose-deep)',
};

const RING_COLOR: Record<VerdictBand, string> = {
  excellent: 'var(--mint-deep)',
  good: 'var(--mint-deep)',
  satisfactory: 'var(--butter-deep)',
  borderline: 'var(--peach-deep)',
  'clear-fail': 'var(--rose-deep)',
};

// ── DomainRing — adapted to take real data + verdict ──────────────

interface DomainRingProps {
  label: string;
  score: DomainScore;
}

function DomainRing({ label, score }: DomainRingProps) {
  const pct = score.max > 0 ? score.raw / score.max : 0;
  const r = 32;
  const c = 2 * Math.PI * r;
  const color = RING_COLOR[score.verdict];
  const qualitative =
    score.verdict === 'excellent' || score.verdict === 'good' ? 'ON TARGET' :
    score.verdict === 'satisfactory' ? 'FAIR' :
    'WORK NEEDED';
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: 'var(--stroke) solid var(--line)',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: 'var(--plush-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--cream-2)" strokeWidth="8" />
        <circle
          cx="42"
          cy="42"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 42 42)"
        />
        <text
          x="42"
          y="48"
          textAnchor="middle"
          fontFamily="Outfit, sans-serif"
          fontWeight="900"
          fontSize="15"
          fill="var(--ink)"
        >
          {formatScore(score.raw)}/{score.max}
        </text>
      </svg>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2, color: 'var(--ink)' }}>{label}</div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: color,
            marginTop: 4,
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          {qualitative}
        </div>
      </div>
    </div>
  );
}

function formatScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ── Criterion ──────────────────────────────────────────────────────

interface Cite {
  title: string;
  rec: string;
  loE: string;
  url?: string;
}

interface CriterionProps {
  status: CriterionResult['verdict'];
  text: string;
  evidence: string;
  cite?: Cite;
}

const CRITERION_STYLES: Record<
  CriterionProps['status'],
  { icon: string; color: string; label: string; iconColor: string }
> = {
  met: { icon: '✓', color: 'var(--mint)', label: 'MET', iconColor: 'var(--mint-deep)' },
  'partially-met': { icon: '~', color: 'var(--butter)', label: 'PARTIAL', iconColor: 'var(--butter-deep)' },
  missed: { icon: '✕', color: 'var(--rose)', label: 'MISSED', iconColor: 'var(--rose-deep)' },
};

function Criterion({ status, text, evidence, cite }: CriterionProps) {
  const styles = CRITERION_STYLES[status];
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        padding: 16,
        background: 'var(--paper)',
        border: 'var(--stroke) solid var(--line)',
        borderRadius: 14,
        boxShadow: 'var(--plush-tiny)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: `${styles.color}20`,
          border: `var(--stroke) solid ${styles.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 16,
          color: styles.iconColor,
          flexShrink: 0,
        }}
      >
        {styles.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
          <span
            className="chip"
            style={{
              fontSize: 9,
              fontWeight: 800,
              padding: '2px 8px',
              borderColor: `${styles.color}50`,
              color: styles.iconColor,
              background: `${styles.color}15`,
            }}
          >
            {styles.label}
          </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{text}</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', fontStyle: 'italic', lineHeight: 1.4 }}>
          {evidence}
        </div>
        {cite && (
          <div
            style={{
              marginTop: 8,
              background: 'var(--cream-2)',
              border: 'var(--stroke) dashed var(--line)',
              borderRadius: 10,
              padding: '8px 10px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--ink)' }}>
              {'\uD83D\uDCD6 '}{cite.title}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{cite.rec}</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--peach)', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
              {cite.loE}
              {cite.url && (
                <>
                  {' \u00B7 '}
                  <a href={cite.url} target="_blank" rel="noreferrer" style={{ color: 'var(--ink-2)' }}>
                    open
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildCite(guidelineRef: string | null | undefined): Cite | undefined {
  if (!guidelineRef) return undefined;
  const r = getRecommendation(guidelineRef);
  if (!r) return undefined;
  const tags: string[] = [];
  if (r.rec.recClass) tags.push(`Class ${r.rec.recClass}`);
  if (r.rec.lev) tags.push(`LoE ${r.rec.lev}`);
  if (r.rec.gradeStrength) {
    tags.push(
      r.rec.gradeCertainty
        ? `${r.rec.gradeStrength} \u00B7 ${r.rec.gradeCertainty}`
        : r.rec.gradeStrength,
    );
  }
  return {
    title: `${r.guideline.body} ${r.guideline.year} \u00B7 ${r.guideline.title.split(/[\u2014:(]/)[0].trim()}`,
    rec: r.rec.text,
    loE: tags.length > 0 ? tags.join(' \u00B7 ') : `${r.guideline.body} ${r.guideline.year}`,
    url: r.guideline.url,
  };
}

// ── Action chips — derived from the encounter ─────────────────────

function ActionChips({ patient, c }: { patient: ActivePatient; c: PatientCase }) {
  const testById = new Map(TESTS.map((t) => [t.id, t]));
  const treatmentById = new Map(TREATMENTS.map((t) => [t.id, t]));
  const chips: Array<{ key: string; label: string; tone: 'butter' | 'peach' | 'mint' | 'sky' | 'plain' }> = [];
  for (const tid of patient.orderedTestIds) {
    const name = testById.get(tid)?.name ?? tid;
    chips.push({ key: `test-${tid}`, label: `\uD83E\uDDEA ${name}`, tone: 'butter' });
  }
  for (const tid of patient.givenTreatmentIds) {
    const name = treatmentById.get(tid)?.name ?? tid;
    const tone = c.criticalTreatmentIds.includes(tid) ? 'mint' : 'peach';
    const icon = treatmentById.get(tid)?.category === 'medication' ? '\uD83D\uDC8A' :
      treatmentById.get(tid)?.category === 'disposition' ? '\u2197' : '\uD83E\uDE7A';
    chips.push({ key: `tx-${tid}`, label: `${icon} ${name}`, tone });
  }
  for (const p of patient.prescriptions ?? []) {
    chips.push({
      key: `rx-${p.medicationId}`,
      label: `\uD83D\uDC8A ${p.medicationId} ${p.dose} ${p.duration}`,
      tone: 'peach',
    });
  }
  if (chips.length === 0) {
    chips.push({ key: 'none', label: 'No actions taken during the encounter', tone: 'plain' });
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {chips.map((c) => (
        <span key={c.key} className={c.tone === 'plain' ? 'chip' : `chip ${c.tone}`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

// ── Status banners (loading, error, empty) ─────────────────────────

function StatusBanner({
  title,
  body,
  bg,
}: {
  title: string;
  body: string;
  bg: string;
}) {
  return (
    <div
      className="plush-lg popin"
      style={{
        background: bg,
        padding: 24,
        position: 'relative',
        marginBottom: 22,
      }}
    >
      <div style={{ position: 'absolute', top: -14, left: 24 }} className="chip butter">
        ATTENDING
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div className="floaty">
          <div
            className="plush"
            style={{
              width: 110,
              height: 110,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Doodle kind="star" size={86} color="#FFD86B" />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.05, margin: '4px 0 8px' }}>{title}</h1>
          <div style={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: 'var(--ink)' }}>
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Live grading progress — animated step-by-step banner ───────────

const GRADING_STEPS = [
  'Replaying your conversation with the patient',
  'Auditing the questions you asked during history-taking',
  'Cross-checking the differential against the chief complaint',
  'Reviewing the tests you ordered for relevance and coverage',
  'Inspecting your prescriptions against the diagnosis',
  'Comparing your management plan to clinical guidelines',
  'Scoring data gathering, clinical management & interpersonal',
  'Drafting personalised feedback for each criterion',
];

function GradingProgress({ partialNarration }: { partialNarration: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (partialNarration.length > 0) return; // stop ticking once narration arrives
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, GRADING_STEPS.length - 1));
    }, 1400);
    return () => window.clearInterval(id);
  }, [partialNarration.length > 0]);

  // Once narration arrives, dump it into the banner instead of the steps.
  if (partialNarration.length > 0) {
    return (
      <StatusBanner
        title={'The attending is grading\u2026'}
        body={truncate(partialNarration, 320)}
        bg="var(--sky)"
      />
    );
  }

  return (
    <div
      className="plush-lg popin"
      style={{
        background: 'var(--sky)',
        padding: 24,
        position: 'relative',
        marginBottom: 22,
      }}
    >
      <div style={{ position: 'absolute', top: -14, left: 24 }} className="chip butter">
        ATTENDING
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div className="floaty">
          <div
            className="plush"
            style={{
              width: 110,
              height: 110,
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Doodle kind="star" size={86} color="#FFD86B" />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.05, margin: '4px 0 12px' }}>
            The attending is grading{'\u2026'}
          </h1>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {GRADING_STEPS.map((label, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'pending';
              const icon =
                state === 'done' ? (
                  '✓'
                ) : state === 'active' ? (
                  <span
                    aria-label="loading"
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: '2px solid rgba(43,30,22,0.25)',
                      borderTopColor: 'var(--ink)',
                      animation: 'gr-spin 0.7s linear infinite',
                    }}
                  />
                ) : (
                  '○'
                );
              const opacity = state === 'pending' ? 0.4 : 1;
              const fontWeight = state === 'active' ? 800 : 700;
              const bg = state === 'done' ? 'rgba(255,255,255,0.55)' : state === 'active' ? 'white' : 'transparent';
              return (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    fontWeight,
                    color: 'var(--ink)',
                    opacity,
                    background: bg,
                    border: state === 'pending' ? '2px dashed rgba(43,30,22,0.18)' : '2.5px solid var(--line)',
                    borderRadius: 10,
                    padding: '6px 10px',
                    transition: 'opacity 0.3s, background 0.3s',
                  }}
                >
                  <span
                    className={state === 'active' ? 'breathe' : ''}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: state === 'done' ? 'var(--mint)' : state === 'active' ? 'var(--butter)' : 'var(--cream)',
                      border: '2px solid var(--line)',
                      fontSize: 13,
                      fontWeight: 900,
                    }}
                  >
                    {icon}
                  </span>
                  <span>{label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── DebriefScreen ──────────────────────────────────────────────────

export function DebriefScreen() {
  const state = useGameState();

  // Review-mode: when viewedEvalHistoryId is set, render a saved evaluation
  // from localStorage instead of running the agent against a fresh request.
  const reviewed = useMemo<EvalHistoryEntry | null>(() => {
    return state.viewedEvalHistoryId ? getEvalHistory(state.viewedEvalHistoryId) : null;
  }, [state.viewedEvalHistoryId]);

  // Prefer the snapshot captured by `finishPolyclinicCase` — by the time we
  // mount, the live patient slot has been cleared so the 3D scene can play
  // the walk-out animation. Fall back to a still-seated patient (rare:
  // the screen was opened directly without ending the encounter).
  const patient = reviewed?.patientSnapshot ?? state.lastEncounter ?? state.polyclinic.patient;
  const c = useMemo<PatientCase | null>(() => {
    return patient?.case ?? (state.selectedCaseId ? getPatientCase(state.selectedCaseId) : null) ?? null;
  }, [patient, state.selectedCaseId]);

  // In review mode, skip the agent — we already have the evaluation.
  const debriefRequest = useMemo(() => {
    if (reviewed) return null;
    if (!c || !patient) return null;
    return buildDebriefRequest(c, patient);
  }, [reviewed, c, patient]);

  const live = useAttendingDebrief(debriefRequest);
  const status = reviewed ? ('got-evaluation' as const) : live.status;
  const evaluation = reviewed?.evaluation ?? live.evaluation;
  const error = live.error;
  const partialNarration = live.partialNarration;

  // Persist the evaluation the FIRST time it arrives in this session.
  const savedRef = useRef(false);
  useEffect(() => {
    if (reviewed) return;
    if (savedRef.current) return;
    if (!evaluation || !patient || !c) return;
    savedRef.current = true;
    const dxId = patient.submittedDiagnosisId ?? c.correctDiagnosisId;
    saveEvalHistory({
      caseId: c.id,
      caseName: c.name,
      caseAge: c.age,
      caseGender: c.gender,
      diagnosisLabel: POLYCLINIC_DIAGNOSIS_LABELS[dxId] ?? dxId,
      verdict: evaluation.global_rating,
      evaluation,
      patientSnapshot: patient,
    });
  }, [evaluation, patient, c, reviewed]);

  // Clear review mode when the user navigates away from this screen.
  useEffect(() => {
    return () => {
      if (state.viewedEvalHistoryId) store.clearViewedEval();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen paper" style={{ overflowY: 'auto' }}>
      <TopBar here={5} steps={['Polyclinic', 'GP', 'Case', 'Brief', 'Encounter', 'Debrief']} />

      <div style={{ padding: '28px 36px 60px', maxWidth: 1080, margin: '0 auto' }}>
        {!c || !patient ? (
          <StatusBanner
            title="No active case to debrief"
            body="The encounter has already been cleared. Pick a new case from the library to start fresh."
            bg="var(--cream-2)"
          />
        ) : status === 'starting' || status === 'idle' ? (
          <StatusBanner
            title={'Preparing your debrief\u2026'}
            body={`Packaging the encounter and the rubric (${summarise(debriefRequest)}). The attending will start grading in a moment.`}
            bg="var(--sky)"
          />
        ) : status === 'streaming' && !evaluation ? (
          <GradingProgress partialNarration={partialNarration} />
        ) : status === 'error' ? (
          <StatusBanner
            title={'We couldn\u2019t generate your debrief'}
            body={error ?? 'Unknown error. The encounter is still saved \u2014 try again from the home screen.'}
            bg="var(--rose)"
          />
        ) : evaluation ? (
          <EvaluationBody evaluation={evaluation} patient={patient} c={c} />
        ) : (
          <StatusBanner
            title="No evaluation yet"
            body={'The attending hasn\u2019t emitted a result. If this persists, restart the encounter.'}
            bg="var(--cream-2)"
          />
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
          <button
            type="button"
            className="btn-plush ghost"
            style={{ flex: 1 }}
            onClick={() => store.endSessionCleanly()}
          >
            {'Exit Consultation'}
          </button>
          <button
            type="button"
            className="btn-plush primary"
            style={{ flex: 1.6 }}
            onClick={() => store.transitionToNextPatient()}
          >
            {'Next Patient \u2192'}
          </button>
        </div>
      </div>
    </div>
  );
}

function summarise(req: ReturnType<typeof buildDebriefRequest> | null): string {
  if (!req) return 'no data';
  const s = summariseRequest(req);
  return `${s.criterion_count} criteria \u00B7 ${s.guideline_count} guideline${s.guideline_count === 1 ? '' : 's'} \u00B7 ${s.rec_count} recs`;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + '\u2026';
}

// ── EvaluationBody — renders the full cozy debrief from real data ──

interface BodyProps {
  evaluation: CaseEvaluationInput;
  patient: ActivePatient;
  c: PatientCase;
}

function EvaluationBody({ evaluation, patient, c }: BodyProps) {
  const verdict = evaluation.global_rating;
  const dgItems = evaluation.criteria.filter((x) => x.domain === 'data_gathering');
  const cmItems = evaluation.criteria.filter((x) => x.domain === 'clinical_management');
  const ipItems = evaluation.criteria.filter((x) => x.domain === 'interpersonal');
  const rubric = c.rubric;
  const labelByCriterionId = new Map<string, string>();
  if (rubric) {
    for (const cr of rubric.data_gathering) labelByCriterionId.set(cr.criterion_id, cr.label);
    for (const cr of rubric.clinical_management) labelByCriterionId.set(cr.criterion_id, cr.label);
    for (const cr of rubric.interpersonal) labelByCriterionId.set(cr.criterion_id, cr.label);
  }
  const elapsedSec = patient.arrivedAt ? Math.round((Date.now() - patient.arrivedAt) / 1000) : 0;
  const elapsedLabel = `${Math.floor(elapsedSec / 60)} min ${elapsedSec % 60} sec`;
  const verbalCount = patient.voiceTranscript
    ? patient.voiceTranscript.filter((line) => line.startsWith('Doctor:')).length
    : 0;
  const clickCount = patient.askedQuestionIds.length;
  const qLabel =
    verbalCount > 0
      ? `${clickCount + verbalCount} question${(clickCount + verbalCount) === 1 ? '' : 's'} (${verbalCount} verbal)`
      : `${clickCount} history question${clickCount === 1 ? '' : 's'}`;

  return (
    <>
      {evaluation.safety_breach && (
        <div
          className="plush-lg popin"
          style={{
            background: 'var(--rose-deep)',
            padding: 20,
            marginBottom: 20,
            border: 'var(--stroke-thick) solid var(--rose)',
            boxShadow: 'var(--plush)',
          }}
        >
          <div className="chip rose" style={{ marginBottom: 10 }}>
            ⚠ SAFETY BREACH
          </div>
          <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.4, color: 'var(--ink)' }}>
            {evaluation.safety_breach.what}
          </div>
          {evaluation.safety_breach.guideline_ref && (() => {
            const cite = buildCite(evaluation.safety_breach.guideline_ref);
            return cite ? (
              <div
                style={{
                  marginTop: 12,
                  background: 'var(--paper)',
                  border: 'var(--stroke) dashed var(--line)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>📖 {cite.title}</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4, color: 'var(--ink-2)' }}>{cite.rec}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--peach)', marginTop: 6, fontFamily: 'Outfit, sans-serif' }}>
                  {cite.loE.toUpperCase()}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Main Verdict Card */}
      <div
        className="plush-lg popin"
        style={{
          background: 'var(--paper)',
          border: `var(--stroke-thick) solid ${GLOBAL_BG[verdict]}`,
          padding: 28,
          position: 'relative',
          marginBottom: 24,
          boxShadow: 'var(--plush)',
        }}
      >
        <div style={{ position: 'absolute', top: -14, left: 24 }} className="chip peach">
          SIMULATION VERDICT
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div className="floaty" style={{ flexShrink: 0 }}>
            <div
              className="plush"
              style={{
                width: 100,
                height: 100,
                background: 'var(--cream-2)',
                borderColor: 'var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
            >
              <Doodle kind="star" size={64} color={GLOBAL_DEEP[verdict]} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '.12em',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              GRADE RECORDED:
            </div>
            <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: '6px 0 10px', fontWeight: 900 }}>
              {GLOBAL_HEADLINE[verdict].split(' — ')[0].toUpperCase()}{' '}
              <span style={{ fontSize: 18, color: GLOBAL_DEEP[verdict] }}>
                {' · ' + (GLOBAL_HEADLINE[verdict].split(' — ')[1]?.toUpperCase() ?? '')}
              </span>
            </h1>
            <div style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500, color: 'var(--ink-2)' }}>
              {evaluation.narrative}
            </div>
          </div>
        </div>
      </div>

      {/* Domain Rings Panel */}
      <div className="plush" style={{ padding: 20, marginBottom: 24, background: 'var(--cream-2)' }}>
        <SectionLabel>DOMAIN PERFORMANCE INDEX</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <DomainRing label="Data Gathering" score={evaluation.domain_scores.data_gathering} />
          <DomainRing label="Clinical Management" score={evaluation.domain_scores.clinical_management} />
          <DomainRing label="Interpersonal Skills" score={evaluation.domain_scores.interpersonal} />
        </div>
      </div>

      {/* Criteria Breakdown Panel */}
      {(dgItems.length + cmItems.length + ipItems.length) > 0 && (
        <div className="plush" style={{ padding: 20, marginBottom: 24, background: 'var(--cream-2)' }}>
          <SectionLabel>SPECIFIC RUBRIC TARGETS</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {dgItems.length > 0 && (
              <CriterionGroup title="Data Gathering Criteria" items={dgItems} labelMap={labelByCriterionId} />
            )}
            {cmItems.length > 0 && (
              <CriterionGroup title="Clinical Management Criteria" items={cmItems} labelMap={labelByCriterionId} />
            )}
            {ipItems.length > 0 && (
              <CriterionGroup title="Interpersonal Skills Criteria" items={ipItems} labelMap={labelByCriterionId} />
            )}
          </div>
        </div>
      )}

      {/* Highlights & Improvements Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {evaluation.highlights.length > 0 && (
          <div className="plush" style={{ background: 'rgba(132, 210, 196, 0.05)', borderColor: 'var(--line)', padding: 20 }}>
            <div className="chip mint" style={{ marginBottom: 12 }}>
              ✓ STRENGTHS / HIGHLIGHTS
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontWeight: 500, fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>
              {evaluation.highlights.map((h, i) => <li key={i} style={{ marginBottom: 6 }}>{h}</li>)}
            </ul>
          </div>
        )}
        {evaluation.improvements.length > 0 && (
          <div className="plush" style={{ background: 'rgba(255, 178, 107, 0.05)', borderColor: 'var(--line)', padding: 20 }}>
            <div className="chip peach" style={{ marginBottom: 12 }}>
              ↑ FOCUS AREAS / NEXT TIME
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontWeight: 500, fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>
              {evaluation.improvements.map((h, i) => <li key={i} style={{ marginBottom: 6 }}>{h}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Actions Summary */}
      <div className="plush" style={{ padding: 20, marginBottom: 24, background: 'var(--cream-2)' }}>
        <SectionLabel>PHYSIOLOGICAL DIAGNOSTICS & RX ADMINISTERED</SectionLabel>
        <ActionChips patient={patient} c={c} />
      </div>

      {/* Triage Info */}
      <div
        className="plush"
        style={{
          padding: 20,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--cream-2)',
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>Encounter Telemetry Summary</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginTop: 4, fontFamily: 'Outfit, sans-serif' }}>
            {`${elapsedLabel.toUpperCase()} · ${qLabel.toUpperCase()} · ${patient.orderedTestIds.length} TESTS · ${patient.givenTreatmentIds.length} TREATMENTS`}
          </div>
        </div>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontWeight: 800,
        fontSize: 11,
        color: 'var(--ink-2)',
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function CriterionGroup({
  title,
  items,
  labelMap,
}: {
  title: string;
  items: CriterionResult[];
  labelMap: Map<string, string>;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          color: 'var(--ink-2)',
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((cr) => {
          const label = labelMap.get(cr.criterion_id) ?? cr.criterion_id;
          const cite = buildCite(cr.guideline_ref);
          return (
            <Criterion
              key={cr.criterion_id}
              status={cr.verdict}
              text={label}
              evidence={cr.evidence}
              cite={cite}
            />
          );
        })}
      </div>
    </div>
  );
}
