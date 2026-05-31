import { useEffect, useState } from 'react';
import { useScreen } from '../game/store';
import { startBackgroundMusic, stopBackgroundMusic } from '../utils/audioSystem';

const MUTED_KEY = 'atrium:music-muted';

function readMuted(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(v: boolean) {
  try {
    window.localStorage.setItem(MUTED_KEY, v ? '1' : '0');
  } catch {
    /* private mode — non-fatal */
  }
}

export function BackgroundMusic() {
  const screen = useScreen();
  const [userMuted, setUserMuted] = useState<boolean>(readMuted);

  // Lobby = anywhere outside an active encounter. Splash plays too.
  const inSession = screen === 'encounter';
  const shouldPlay = !userMuted && !inSession;

  useEffect(() => {
    if (shouldPlay) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [shouldPlay]);

  // Handle first user gesture to trigger the AudioContext loop safely
  useEffect(() => {
    const onGesture = () => {
      if (shouldPlay) {
        startBackgroundMusic();
      }
    };
    window.addEventListener('pointerdown', onGesture, { once: false });
    window.addEventListener('keydown', onGesture, { once: false });

    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [shouldPlay]);

  const toggle = () => {
    const next = !userMuted;
    setUserMuted(next);
    writeMuted(next);
  };

  // Hide the toggle on splash to keep the title hero clean.
  if (screen === 'splash') return null;

  const off = userMuted || inSession;
  return (
    <button
      type="button"
      onClick={toggle}
      title={
        userMuted
          ? 'Music muted — click to unmute'
          : inSession
            ? 'Music paused during session'
            : 'Music on — click to mute'
      }
      aria-label={userMuted ? 'Unmute music' : 'Mute music'}
      style={{
        position: 'fixed',
        top: 18,
        right: 156,
        zIndex: 1000,
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid var(--line)',
        background: off ? 'var(--cream)' : 'var(--butter)',
        boxShadow: '0 2px 0 var(--line)',
        cursor: 'pointer',
        fontSize: 16,
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        opacity: inSession && !userMuted ? 0.8 : 1,
      }}
    >
      <span aria-hidden style={{ lineHeight: 1 }}>{off ? '🔇' : '🎵'}</span>
    </button>
  );
}
