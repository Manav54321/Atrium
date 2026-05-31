import { useEffect, useMemo, useState } from 'react';
import { TopBar, Doodle } from './primitives';
import { Mascot } from './mascots';
import { store, useGameState } from '../game/store';
import { soundSystem } from '../utils/audioSystem';
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

// ── DomainRing — redesigned into flat cartoon progress rings ────────

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
      onMouseEnter={(e) => soundSystem.playCardHover(e.currentTarget)}
      style={{
        background: '#ffffff',
        border: '3px solid #151B3D',
        borderRadius: 'var(--r-md)',
        padding: '16px 20px',
        boxShadow: '3px 3px 0px #151B3D',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'transform 0.1s ease',
      }}
      className="btn-toy"
    >
      <svg width="84" height="84" viewBox="0 0 84 84" style={{ overflow: 'visible' }}>
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--cream)" strokeWidth="8" />
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
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        {/* Outline for the progress stroke */}
        <circle cx="42" cy="42" r={r} fill="none" stroke="#151B3D" strokeWidth="1" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 42 42)" />
        <text
          x="42"
          y="48"
          textAnchor="middle"
          fontFamily="Fredoka, sans-serif"
          fontWeight="800"
          fontSize="15"
          fill="#151B3D"
        >
          {formatScore(score.raw)}/{score.max}
        </text>
      </svg>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>{label}</div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: color,
            marginTop: 4,
            fontFamily: 'Fredoka, sans-serif',
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

// ── Criterion — transformed into a collectible sticker row ────────

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
  { icon: string; color: string; label: string; iconColor: string; bg: string }
> = {
  met: { icon: '✓', color: 'var(--mint)', label: 'MET', iconColor: 'var(--mint-deep)', bg: 'var(--mint-lt)' },
  'partially-met': { icon: '~', color: 'var(--butter)', label: 'PARTIAL', iconColor: 'var(--butter-deep)', bg: 'var(--butter-lt)' },
  missed: { icon: '✕', color: 'var(--rose)', label: 'MISSED', iconColor: 'var(--rose-deep)', bg: 'var(--rose-lt)' },
};

function Criterion({ status, text, evidence, cite }: CriterionProps) {
  const styles = CRITERION_STYLES[status];
  return (
    <div
      onMouseEnter={(e) => soundSystem.playCardHover(e.currentTarget)}
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        padding: 16,
        background: '#ffffff',
        border: '3px solid #151B3D',
        borderRadius: 'var(--r-md)',
        boxShadow: '3px 3px 0px #151B3D',
        transition: 'transform 0.15s ease',
      }}
      className="tap btn-toy"
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: styles.bg,
          border: `2.5px solid #151B3D`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 950,
          fontSize: 16,
          color: '#151B3D',
          flexShrink: 0,
          boxShadow: '1.5px 1.5px 0px #151B3D',
        }}
      >
        {styles.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
          <span
            className="chip"
            style={{
              fontSize: 13,
              fontWeight: 800,
              padding: '3px 10px',
              border: '2px solid #151B3D',
              color: '#151B3D',
              background: styles.bg,
              boxShadow: '1px 1px 0px #151B3D',
              fontFamily: "'Fredoka', sans-serif",
            }}
          >
            {styles.label}
          </span>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>{text}</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', fontStyle: 'italic', lineHeight: 1.45 }}>
          {evidence}
        </div>
        {cite && (
          <div
            style={{
              marginTop: 10,
              background: 'var(--bg)',
              border: '2.5px solid #151B3D',
              borderRadius: 'var(--r-sm)',
              padding: '10px 12px',
              boxShadow: '2px 2px 0px #151B3D',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
              📖 {cite.title}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: 'var(--ink-2)' }}>{cite.rec}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--peach-deep)', marginTop: 6, fontFamily: 'Fredoka, sans-serif' }}>
              {cite.loE}
              {cite.url && (
                <>
                  {' · '}
                  <a href={cite.url} target="_blank" rel="noreferrer" style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>
                    open guideline
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
        ? `${r.rec.gradeStrength} · ${r.rec.gradeCertainty}`
        : r.rec.gradeStrength,
    );
  }
  return {
    title: `${r.guideline.body} ${r.guideline.year} · ${r.guideline.title.split(/[\u2014:(]/)[0].trim()}`,
    rec: r.rec.text,
    loE: tags.length > 0 ? tags.join(' · ') : `${r.guideline.body} ${r.guideline.year}`,
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
    chips.push({ key: `test-${tid}`, label: `🧪 ${name}`, tone: 'butter' });
  }
  for (const tid of patient.givenTreatmentIds) {
    const name = treatmentById.get(tid)?.name ?? tid;
    const tone = c.criticalTreatmentIds.includes(tid) ? 'mint' : 'peach';
    const icon = treatmentById.get(tid)?.category === 'medication' ? '💊' :
      treatmentById.get(tid)?.category === 'disposition' ? '↗' : '🩺';
    chips.push({ key: `tx-${tid}`, label: `${icon} ${name}`, tone });
  }
  for (const p of patient.prescriptions ?? []) {
    chips.push({
      key: `rx-${p.medicationId}`,
      label: `💊 ${p.medicationId} ${p.dose} ${p.duration}`,
      tone: 'peach',
    });
  }
  if (chips.length === 0) {
    chips.push({ key: 'none', label: 'No actions taken during the encounter', tone: 'plain' });
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {chips.map((c) => (
        <span key={c.key} className={c.tone === 'plain' ? 'chip' : `chip ${c.tone}`} style={{ border: '2px solid #151B3D', boxShadow: '1.5px 1.5px 0px #151B3D' }}>
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
      className="popin"
      style={{
        background: bg,
        padding: '32px 28px',
        position: 'relative',
        marginBottom: 24,
        border: '4px solid #151B3D',
        borderRadius: 'var(--r-xl)',
        boxShadow: '6px 6px 0px #151B3D',
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          top: -16, 
          left: 24,
          fontFamily: "'Fredoka', sans-serif",
          border: '3px solid #151B3D',
          boxShadow: '2px 2px 0px #151B3D',
        }} 
        className="chip butter"
      >
        🎓 ATTENDING
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div className="floaty" style={{ flexShrink: 0 }}>
          <Mascot name="nurse" size={110} />
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.05, margin: '4px 0 10px', color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
            {title}
          </h1>
          <div style={{ fontSize: 15, lineHeight: 1.5, fontWeight: 700, color: 'var(--ink)' }}>
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
    if (partialNarration.length > 0) return;
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, GRADING_STEPS.length - 1));
    }, 1400);
    return () => window.clearInterval(id);
  }, [partialNarration.length > 0]);

  if (partialNarration.length > 0) {
    return (
      <StatusBanner
        title={'The attending is grading...'}
        body={truncate(partialNarration, 320)}
        bg="var(--sky-lt)"
      />
    );
  }

  return (
    <div
      className="popin"
      style={{
        background: 'var(--sky-lt)',
        padding: 32,
        position: 'relative',
        marginBottom: 24,
        border: '4px solid #151B3D',
        borderRadius: 'var(--r-xl)',
        boxShadow: '6px 6px 0px #151B3D',
      }}
    >
      <div 
        style={{ 
          position: 'absolute', 
          top: -16, 
          left: 24,
          fontFamily: "'Fredoka', sans-serif",
          border: '3px solid #151B3D',
          boxShadow: '2px 2px 0px #151B3D',
        }} 
        className="chip butter"
      >
        🎓 ATTENDING EVALUATING
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
        <div className="floaty" style={{ flexShrink: 0, margin: '0 auto' }}>
          <Mascot name="nurse" size={130} />
        </div>
        
        <div style={{ flex: 1, minWidth: 320 }}>
          <h1 style={{ fontSize: 28, lineHeight: 1.1, margin: '4px 0 16px', color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
            Attending is grading your OSCE...
          </h1>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                      border: '2px solid rgba(21, 27, 61, 0.25)',
                      borderTopColor: '#151B3D',
                      animation: 'blink 0.7s linear infinite',
                    }}
                  />
                ) : (
                  '○'
                );
              const opacity = state === 'pending' ? 0.4 : 1;
              const fontWeight = state === 'active' ? 800 : 700;
              const bg = state === 'done' ? '#ffffff' : state === 'active' ? 'var(--butter)' : 'transparent';
              return (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    fontWeight,
                    color: 'var(--ink)',
                    opacity,
                    background: bg,
                    border: state === 'pending' ? '2px dashed rgba(21,27,61,0.2)' : '2.5px solid #151B3D',
                    borderRadius: 12,
                    padding: '6px 12px',
                    transition: 'opacity 0.3s, background 0.3s',
                    boxShadow: state !== 'pending' ? '2px 2px 0px #151B3D' : 'none',
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
                      background: state === 'done' ? 'var(--green)' : state === 'active' ? 'var(--butter)' : 'var(--cream)',
                      border: '2px solid #151B3D',
                      fontSize: 13,
                      fontWeight: 900,
                      color: 'var(--ink)',
                    }}
                  >
                    {icon}
                  </span>
                  <span style={{ fontFamily: "'Fredoka', sans-serif" }}>{label}</span>
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

  const reviewed = useMemo<EvalHistoryEntry | null>(() => {
    return state.viewedEvalHistoryId ? getEvalHistory(state.viewedEvalHistoryId) : null;
  }, [state.viewedEvalHistoryId]);

  const patient = reviewed?.patientSnapshot ?? state.lastEncounter ?? state.polyclinic.patient;
  const c = useMemo<PatientCase | null>(() => {
    return patient?.case ?? (state.selectedCaseId ? getPatientCase(state.selectedCaseId) : null) ?? null;
  }, [patient, state.selectedCaseId]);

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

  useEffect(() => {
    if (reviewed) return;
    if (!evaluation || !patient || !c) return;
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

  useEffect(() => {
    if (evaluation) {
      soundSystem.playSuccess();
    }
  }, [evaluation]);

  useEffect(() => {
    return () => {
      if (state.viewedEvalHistoryId) store.clearViewedEval();
    };
  }, []);

  return (
    <div
      className="screen"
      style={{
        background: 'var(--bg)',
        position: 'relative',
        overflowY: 'auto',
        backgroundImage: 'radial-gradient(var(--dots-color) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
      }}
    >
      <TopBar here={5} steps={['Polyclinic', 'GP', 'Case', 'Brief', 'Encounter', 'Debrief']} />

      {/* Whimsical Ambient World Decorations */}
      <div style={{ position: 'absolute', top: '6%', left: '4%', opacity: 0.25, zIndex: 0 }} className="drift-cloud">
        <Doodle kind="cloud" size={110} color="var(--sky-lt)" />
      </div>
      <div style={{ position: 'absolute', top: '15%', right: '7%', opacity: 0.25, zIndex: 0 }} className="drift-cloud">
        <Doodle kind="cloud" size={120} color="var(--mint-lt)" style={{ animationDelay: '1s' }} />
      </div>
      <div style={{ position: 'absolute', top: '45%', left: '3%', opacity: 0.45, zIndex: 0 }} className="wobble">
        <Doodle kind="star" size={30} color="var(--butter)" />
      </div>
      <div style={{ position: 'absolute', top: '65%', right: '4%', opacity: 0.4, zIndex: 0 }} className="drift">
        <Doodle kind="sparkle" size={28} color="var(--sky)" />
      </div>
      <div style={{ position: 'absolute', bottom: '15%', left: '5%', opacity: 0.45, zIndex: 0 }} className="wobble">
        <Doodle kind="heart" size={32} color="var(--rose)" />
      </div>
      <div style={{ position: 'absolute', bottom: '25%', right: '6%', opacity: 0.4, zIndex: 0 }} className="floaty">
        <Doodle kind="stetho" size={40} color="var(--mint)" />
      </div>

      <div style={{ padding: '40px 24px 60px', maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {!c || !patient ? (
          <StatusBanner
            title="No active case to debrief"
            body="The encounter has already been cleared. Pick a new case from the library to start fresh."
            bg="var(--bg-soft)"
          />
        ) : status === 'starting' || status === 'idle' ? (
          <StatusBanner
            title={'Preparing your OSCE critique...'}
            body={`Packaging the encounter details and rubric criteria (${summarise(debriefRequest)}). Your tutor is getting ready.`}
            bg="var(--sky-lt)"
          />
        ) : status === 'streaming' && !evaluation ? (
          <GradingProgress partialNarration={partialNarration} />
        ) : status === 'error' ? (
          <StatusBanner
            title={'OSCE Grading failed'}
            body={error ?? 'Attending failed to reach grading desk. The patient dossier is saved - try again from profile.'}
            bg="var(--rose-lt)"
          />
        ) : evaluation ? (
          <EvaluationBody evaluation={evaluation} patient={patient} c={c} />
        ) : (
          <StatusBanner
            title="Awaiting Evaluation"
            body={'Grade is pending. If loading hangs, please restart this encounter session.'}
            bg="var(--bg-soft)"
          />
        )}

        <div style={{ display: 'flex', gap: 20, marginTop: 32, alignItems: 'center' }}>
          <button
            type="button"
            className="btn-plush ghost btn-toy"
            style={{
              flex: 1,
              color: '#151B3D',
              border: '3px solid #151B3D',
              borderRadius: 'var(--r-pill)',
              boxShadow: '0 6px 0px #151B3D !important',
              fontSize: 16,
              fontWeight: 800,
              padding: '18px 0',
              fontFamily: "'Fredoka', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
            onClick={() => {
              soundSystem.playClick();
              store.endSessionCleanly();
            }}
          >
            Exit Consultation
          </button>

          <button
            type="button"
            className="btn-plush primary breathe btn-toy"
            style={{
              flex: 1.6,
              background: 'var(--green)',
              color: '#ffffff',
              border: '4px solid #151B3D',
              borderRadius: 'var(--r-pill)',
              boxShadow: '0 8px 0px #151B3D !important',
              fontSize: 20,
              fontWeight: 900,
              padding: '20px 0',
              fontFamily: "'Fredoka', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '0.04em',
            }}
            onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
            onClick={() => {
              soundSystem.playClick();
              store.transitionToNextPatient();
            }}
          >
            Next Patient →
          </button>
        </div>
      </div>
    </div>
  );
}

function summarise(req: ReturnType<typeof buildDebriefRequest> | null): string {
  if (!req) return 'no data';
  const s = summariseRequest(req);
  return `${s.criterion_count} criteria · ${s.guideline_count} guidelines`;
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + '...';
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
          className="popin"
          style={{
            background: 'var(--rose-lt)',
            padding: 24,
            marginBottom: 24,
            border: '4px solid #151B3D',
            boxShadow: '6px 6px 0px #151B3D',
            borderRadius: 'var(--r-xl)',
          }}
        >
          <div 
            className="chip rose" 
            style={{ 
              marginBottom: 12, 
              border: '2.5px solid #151B3D', 
              boxShadow: '1.5px 1.5px 0px #151B3D',
              background: 'var(--coral)',
              color: '#ffffff',
            }}
          >
            ⚠ SAFETY CRITICAL WARNING
          </div>
          <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.5, color: 'var(--ink)' }}>
            {evaluation.safety_breach.what}
          </div>
          {evaluation.safety_breach.guideline_ref && (() => {
            const cite = buildCite(evaluation.safety_breach.guideline_ref);
            return cite ? (
              <div
                style={{
                  marginTop: 14,
                  background: '#ffffff',
                  border: '3px solid #151B3D',
                  borderRadius: 'var(--r-sm)',
                  padding: '12px 14px',
                  boxShadow: '3px 3px 0px #151B3D',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>📖 {cite.title}</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: 'var(--ink-2)' }}>{cite.rec}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--peach-deep)', marginTop: 6, fontFamily: 'Fredoka, sans-serif' }}>
                  {cite.loE.toUpperCase()}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Main Attending Verdict Card */}
      <div
        className="popin"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF5 100%)',
          border: '4px solid #151B3D',
          borderTop: '14px solid var(--butter)',
          borderRadius: 'var(--r-xl)',
          padding: 32,
          position: 'relative',
          marginBottom: 28,
          boxShadow: '8px 8px 0px #151B3D',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -24,
            left: 24,
            fontFamily: "'Fredoka', sans-serif",
            border: '3.5px solid #151B3D',
            boxShadow: '2.5px 2.5px 0px #151B3D',
          }}
          className="chip butter"
        >
          🏆 OSCE REPORT SCORECARD
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', marginTop: 8 }}>
          <div
            className="floaty"
            style={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: '#ffffff',
              border: '4px solid #151B3D',
              boxShadow: '4px 4px 0px #151B3D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              margin: '0 auto',
            }}
          >
            <Mascot name="nurse" size={150} />
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '.12em',
                fontFamily: 'Fredoka, sans-serif',
              }}
            >
              GLOBAL CLINICAL SCORE:
            </div>

            <h1
              style={{
                fontSize: 34,
                lineHeight: 1.1,
                margin: '6px 0 12px',
                fontWeight: 900,
                color: '#151B3D',
                fontFamily: "'Fredoka', sans-serif",
              }}
            >
              {GLOBAL_HEADLINE[verdict].split(' — ')[0].toUpperCase()}{' '}
              <span style={{ fontSize: 20, color: GLOBAL_DEEP[verdict] }}>
                {' · ' + (GLOBAL_HEADLINE[verdict].split(' — ')[1]?.toUpperCase() ?? '')}
              </span>
            </h1>

            <div style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 700, color: '#151B3D' }}>
              {evaluation.narrative}
            </div>
          </div>
        </div>
      </div>

      {/* Domain Performance Rings */}
      <div
        style={{
          padding: 24,
          marginBottom: 28,
          background: '#ffffff',
          border: '4px solid #151B3D',
          borderTop: '10px solid var(--sky)',
          borderRadius: 'var(--r-xl)',
          boxShadow: '4px 4px 0px #151B3D',
        }}
      >
        <SectionLabel>DOMAIN PERFORMANCE GAUGES</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <DomainRing label="Data Gathering" score={evaluation.domain_scores.data_gathering} />
          <DomainRing label="Clinical Management" score={evaluation.domain_scores.clinical_management} />
          <DomainRing label="Interpersonal Skills" score={evaluation.domain_scores.interpersonal} />
        </div>
      </div>

      {/* Specific Rubric Targets */}
      {(dgItems.length + cmItems.length + ipItems.length) > 0 && (
        <div
          style={{
            padding: 24,
            marginBottom: 28,
            background: '#ffffff',
            border: '4px solid #151B3D',
            borderTop: '10px solid var(--rose)',
            borderRadius: 'var(--r-xl)',
            boxShadow: '4px 4px 0px #151B3D',
          }}
        >
          <SectionLabel>QUEST MILESTONE CHECKPOINTS</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

      {/* Strengths & Improvements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 28 }}>
        {evaluation.highlights.length > 0 && (
          <div
            style={{
              background: 'var(--green-lt)',
              borderColor: '#151B3D',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderRadius: 'var(--r-xl)',
              padding: '28px 24px',
              boxShadow: '6px 6px 0px #151B3D',
            }}
          >
            <div
              className="chip green"
              style={{
                marginBottom: 16,
                border: '2.5px solid #151B3D',
                boxShadow: '1.5px 1.5px 0px #151B3D',
                background: 'var(--green)',
                color: '#ffffff',
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 13,
              }}
            >
              ✓ OSCE HIGHLIGHTS / STRENGTHS
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontWeight: 800, fontSize: 17, lineHeight: 1.65, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
              {evaluation.highlights.map((h, i) => <li key={i} style={{ marginBottom: 10 }}>{h}</li>)}
            </ul>
          </div>
        )}

        {evaluation.improvements.length > 0 && (
          <div
            style={{
              background: 'var(--peach-lt)',
              borderColor: '#151B3D',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderRadius: 'var(--r-xl)',
              padding: '28px 24px',
              boxShadow: '6px 6px 0px #151B3D',
            }}
          >
            <div
              className="chip peach"
              style={{
                marginBottom: 16,
                border: '2.5px solid #151B3D',
                boxShadow: '1.5px 1.5px 0px #151B3D',
                background: 'var(--peach)',
                color: '#ffffff',
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 13,
              }}
            >
              ↑ FOCUS TARGETS FOR NEXT OSCE
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontWeight: 800, fontSize: 17, lineHeight: 1.65, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>
              {evaluation.improvements.map((h, i) => <li key={i} style={{ marginBottom: 10 }}>{h}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Actions Summary */}
      <div
        style={{
          padding: 24,
          marginBottom: 28,
          background: '#ffffff',
          border: '4px solid #151B3D',
          borderTop: '10px solid var(--mint)',
          borderRadius: 'var(--r-xl)',
          boxShadow: '4px 4px 0px #151B3D',
        }}
      >
        <SectionLabel>PHYSIOLOGICAL DIAGNOSTICS & RX ADMINISTERED</SectionLabel>
        <ActionChips patient={patient} c={c} />
      </div>

      {/* Telemetry Summary */}
      <div
        style={{
          padding: 20,
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          border: '4px solid #151B3D',
          borderLeft: '12px solid var(--sky)',
          borderRadius: 'var(--r-xl)',
          boxShadow: '4px 4px 0px #151B3D',
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#151B3D', fontFamily: "'Fredoka', sans-serif" }}>Encounter Telemetry Summary</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink-soft)', marginTop: 4, fontFamily: 'Fredoka, sans-serif' }}>
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
        fontSize: 13,
        color: 'var(--ink-soft)',
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        marginBottom: 16,
        fontFamily: "'Fredoka', sans-serif",
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
          fontSize: 13,
          fontWeight: 900,
          color: '#151B3D',
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          fontFamily: "'Fredoka', sans-serif",
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
