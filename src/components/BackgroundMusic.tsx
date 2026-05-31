import { useEffect, useState } from 'react';
import { useScreen } from '../game/store';
import {
  startBackgroundMusic,
  stopBackgroundMusic,
  getBackgroundMusicTrack,
  setBackgroundMusicTrack,
  MUSIC_TRACKS,
  MusicTrackName,
  soundSystem,
} from '../utils/audioSystem';

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
  const [trackName, setTrackName] = useState<MusicTrackName>(getBackgroundMusicTrack);
  const [isHovered, setIsHovered] = useState(false);

  // Lobby = anywhere outside an active encounter. Splash plays too.
  const inSession = screen === 'encounter';
  const shouldPlay = !userMuted && !inSession;

  useEffect(() => {
    if (shouldPlay) {
      startBackgroundMusic();
      // Ensure the correct track is playing
      setBackgroundMusicTrack(trackName);
    } else {
      stopBackgroundMusic();
    }
  }, [shouldPlay, trackName]);

  // Handle first user gesture to trigger the AudioContext loop safely
  useEffect(() => {
    const onGesture = () => {
      if (shouldPlay) {
        startBackgroundMusic();
        setBackgroundMusicTrack(trackName);
      }
    };
    window.addEventListener('pointerdown', onGesture, { once: false });
    window.addEventListener('keydown', onGesture, { once: false });

    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [shouldPlay, trackName]);

  const toggle = () => {
    const next = !userMuted;
    setUserMuted(next);
    writeMuted(next);
    soundSystem.playClick();
  };

  const cycleTrack = (direction: 'next' | 'prev') => {
    const currentIndex = MUSIC_TRACKS.indexOf(trackName);
    let nextIndex = currentIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % MUSIC_TRACKS.length;
    } else {
      nextIndex = (currentIndex - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    }
    const nextTrackName = MUSIC_TRACKS[nextIndex];
    setTrackName(nextTrackName);
    setBackgroundMusicTrack(nextTrackName);
    soundSystem.playClick();
  };

  const off = userMuted || inSession;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: 18,
        right: 156,
        zIndex: 1000,
        height: 36,
        borderRadius: 18,
        border: '3px solid var(--line)',
        background: off ? '#ffffff' : 'var(--butter)',
        boxShadow: '0 2px 0 var(--line)',
        display: 'flex',
        alignItems: 'center',
        padding: off ? '0' : '0 10px 0 6px',
        width: off ? 36 : (isHovered ? 210 : 160),
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s, padding 0.25s',
        overflow: 'hidden',
        boxSizing: 'border-box',
        opacity: inSession && !userMuted ? 0.8 : 1,
      }}
    >
      {/* Mute Toggle Button */}
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
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
          outline: 'none',
        }}
      >
        <span
          aria-hidden
          style={{
            lineHeight: 1,
            display: 'inline-block',
            animation: !off ? 'musicBounce 1.8s ease-in-out infinite' : 'none',
          }}
        >
          {off ? '🔇' : '🎵'}
        </span>
      </button>

      {/* Pill Contents: Track Selector (only when playing/unmuted) */}
      {!off && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginLeft: 4,
            width: '100%',
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out',
            overflow: 'hidden',
          }}
        >
          {/* Divider */}
          <div
            style={{
              width: 1.5,
              height: 16,
              background: 'var(--line)',
              opacity: 0.25,
              flexShrink: 0,
            }}
          />

          {/* Left Arrow */}
          <button
            type="button"
            onClick={() => cycleTrack('prev')}
            title="Previous track"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              color: 'var(--ink)',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovered ? 0.8 : 0,
              transform: isHovered ? 'translateX(0)' : 'translateX(4px)',
              transition: 'opacity 0.2s, transform 0.2s, color 0.15s',
              outline: 'none',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--rose)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ink)';
            }}
          >
            ◀
          </button>

          {/* Active Track Name */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--ink)',
              fontFamily: "'Outfit', sans-serif",
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
              flexGrow: 1,
              userSelect: 'none',
              transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
              transition: 'transform 0.2s',
            }}
          >
            {trackName}
          </div>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={() => cycleTrack('next')}
            title="Next track"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              color: 'var(--ink)',
              padding: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovered ? 0.8 : 0,
              transform: isHovered ? 'translateX(0)' : 'translateX(-4px)',
              transition: 'opacity 0.2s, transform 0.2s, color 0.15s',
              outline: 'none',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--rose)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ink)';
            }}
          >
            ▶
          </button>
        </div>
      )}

      {/* Bounce Keyframe style injected */}
      <style>{`
        @keyframes musicBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          30% { transform: scale(1.18) rotate(-8deg); }
          70% { transform: scale(1.18) rotate(8deg); }
        }
      `}</style>
    </div>
  );
}
