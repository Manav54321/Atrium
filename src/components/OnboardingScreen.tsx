import type { ReactNode } from 'react';
import { Doodle, DoodleScatter } from './primitives';
import { store, useStore } from '../game/store';

interface Card {
  bg: string;
  title: string;
  body: string;
  icon: ReactNode;
  tag: string;
}

const CARDS: Card[] = [
  {
    bg: 'var(--peach)',
    title: 'What this is.',
    body:
      "A clinic full of simulated patients with histories, symptoms, and stories. You'll talk to them out loud, decide what to do, and get a structured debrief — every claim cited to a real published guideline.",
    icon: <Doodle kind="stetho" size={140} color="var(--mint)" />,
    tag: '01 · meet atrium',
  },
  {
    bg: 'var(--mint)',
    title: 'How it works.',
    body:
      'Pick a clinic. The next patient is called in. You speak; they answer in conversation. You order labs, prescribe, counsel, refer. At the end, a senior clinician walks you through what you did well and what to work on. Five to eight minutes per case. Patient conversations powered by advanced real-time voice synthesis and interactive language models.',
    icon: <Doodle kind="cross" size={140} color="#F47A92" />,
    tag: '02 · the loop',
  },
  {
    bg: 'var(--sky)',
    title: "Who it's for.",
    body:
      'For medical students, residents, and doctors preparing for OSCE-style exams. This is a training simulator, not a clinical tool. Never used to give real medical advice.',
    icon: <Doodle kind="heart" size={140} color="#F47A92" />,
    tag: '03 · safety line',
  },
];

export function OnboardingScreen() {
  const step = useStore((s) => s.onboardingStep);
  const card = CARDS[step];

  return (
    <div className="screen bg-cream-2" style={{ position: 'relative' }}>
      <DoodleScatter
        items={[
          { kind: 'sparkle', x: 60, y: 70, size: 28, color: '#FFD86B' },
          { kind: 'sparkle', x: '85%', y: 130, size: 24, color: '#5AB7F2' },
          { kind: 'star', x: 80, y: 580, size: 32, color: '#FFD86B', anim: 'wobble' },
          { kind: 'pill', x: '88%', y: 600, size: 60, anim: 'wobble' },
        ]}
      />

      <div
        style={{
          position: 'absolute',
          top: 38,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          zIndex: 5,
        }}
      >
        {CARDS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 32 : 12,
              height: 12,
              borderRadius: 8,
              background: i === step ? 'var(--peach-deep)' : 'var(--cream-2)',
              border: '1px solid var(--line)',
              boxShadow: '0 0 10px rgba(0, 245, 212, 0.3)',
              transition: 'width 200ms cubic-bezier(.5,1.7,.4,1)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        <div
          className="plush-lg popin"
          key={step}
          style={{ width: 720, padding: 40, background: 'var(--cream)', border: '1px solid var(--line)', position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div className="floaty" style={{ flexShrink: 0 }}>
              <div
                className="plush"
                style={{
                  width: 200,
                  height: 200,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {card.icon}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="chip" style={{ background: 'rgba(255, 255, 255, 0.05)', marginBottom: 16 }}>
                {card.tag}
              </div>
              <h1 style={{ fontSize: 44, lineHeight: 1.05, marginBottom: 14, color: 'var(--ink)' }}>{card.title}</h1>
              <div style={{ fontSize: 17, lineHeight: 1.5, fontWeight: 500, color: 'var(--ink-2)' }}>{card.body}</div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <button
          type="button"
          className="btn-plush ghost"
          style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
          onClick={() => store.setOnboardingStep(step - 1)}
        >
          ← Back
        </button>
        {step < CARDS.length - 1 ? (
          <button type="button" className="btn-plush primary" onClick={() => store.setOnboardingStep(step + 1)}>
            Next →
          </button>
        ) : (
          <button
            type="button"
            className="btn-plush primary breathe"
            style={{ fontSize: 20 }}
            onClick={() => store.finishOnboarding()}
          >
            Take me in →
          </button>
        )}
      </div>
    </div>
  );
}
