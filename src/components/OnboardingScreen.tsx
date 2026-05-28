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
    icon: <Doodle kind="cross" size={140} color="var(--butter)" />,
    tag: '02 · the loop',
  },
  {
    bg: 'var(--sky)',
    title: "Who it's for.",
    body:
      'For medical students, residents, and doctors preparing for OSCE-style exams. This is a training simulator, not a clinical tool. Never used to give real medical advice.',
    icon: <Doodle kind="heart" size={140} color="var(--butter)" />,
    tag: '03 · safety line',
  },
];

export function OnboardingScreen() {
  const step = useStore((s) => s.onboardingStep);
  const card = CARDS[step];

  return (
    <div className="screen bg-cream" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Space Telemetry background */}
      <DoodleScatter
        items={[
          { kind: 'sparkle', x: '8%', y: '15%', size: 24, color: 'var(--peach-deep)' },
          { kind: 'sparkle', x: '88%', y: '20%', size: 20, color: 'var(--mint-deep)' },
          { kind: 'star', x: '10%', y: '75%', size: 28, color: 'var(--butter-deep)', anim: 'wobble' },
          { kind: 'pill', x: '85%', y: '80%', size: 55, anim: 'wobble' },
        ]}
      />

      {/* Progress indicators - friendly warm steps */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          display: 'flex',
          gap: 12,
          zIndex: 5,
        }}
      >
        {CARDS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 48 : 16,
              height: 8,
              borderRadius: 4,
              background: i === step ? 'var(--peach)' : 'rgba(0, 0, 0, 0.05)',
              border: `1.5px solid ${i === step ? 'var(--peach)' : 'var(--line)'}`,
              transition: 'all 300ms cubic-bezier(.5,1.7,.4,1)',
            }}
          />
        ))}
      </div>

      {/* Main glass card workspace */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          width: '100%',
          maxWidth: 820,
        }}
      >
        <div
          className="plush-lg popin"
          key={step}
          style={{ 
            width: '100%', 
            padding: 40, 
            background: '#ffffff', 
            border: 'var(--stroke-thick) solid var(--line)', 
            position: 'relative',
            boxShadow: 'var(--plush)'
          }}
        >
          {/* Decorative Corner Labels */}
          <div style={{ position: 'absolute', top: 12, left: 16, fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)' }}>✦ CLINIC GUIDE</div>
          <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)' }}>PAGE 0{step+1} / 03</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
            {/* Playful icon deck */}
            <div className="floaty" style={{ flexShrink: 0, margin: '0 auto' }}>
              <div
                className="plush"
                style={{
                  width: 210,
                  height: 210,
                  borderRadius: 24,
                  background: 'var(--cream-2)',
                  border: 'var(--stroke-thick) solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {card.icon}
              </div>
            </div>

            {/* Content text */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div 
                className="chip peach" 
                style={{ 
                  marginBottom: 16 
                }}
              >
                {card.tag.toUpperCase()}
              </div>
              <h1 style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 16, color: 'var(--ink)' }}>
                {card.title}
              </h1>
              <div style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 600, color: 'var(--ink-2)' }}>
                {card.body}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <button
          type="button"
          className="btn-plush ghost"
          style={{ visibility: step === 0 ? 'hidden' : 'visible', padding: '12px 24px' }}
          onClick={() => store.setOnboardingStep(step - 1)}
        >
          ← Back
        </button>
        {step < CARDS.length - 1 ? (
          <button 
            type="button" 
            className="btn-plush primary" 
            style={{ padding: '12px 28px' }}
            onClick={() => store.setOnboardingStep(step + 1)}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            className="btn-plush primary breathe"
            style={{ fontSize: 18, padding: '16px 36px' }}
            onClick={() => store.finishOnboarding()}
          >
            Enter Simulator →
          </button>
        )}
      </div>
    </div>
  );
}
