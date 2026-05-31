import { TopBar, Doodle } from './primitives';
import { Mascot } from './mascots';
import { store } from '../game/store';
import { soundSystem } from '../utils/audioSystem';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  accentLt: string;
}

function FeatureCard({ icon, title, description, accentColor, accentLt }: FeatureCardProps) {
  return (
    <div
      style={{
        flex: '1 1 300px',
        maxWidth: 380,
        background: '#ffffff',
        borderRadius: 'var(--r-xl)',
        border: '4px solid #151B3D',
        boxShadow: '8px 8px 0px #151B3D',
        padding: '36px 28px 32px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 280,
        overflow: 'visible',
      }}
    >
      {/* Top accent badge */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 14,
        background: accentColor,
        borderBottom: '4px solid #151B3D',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
      }} />

      {/* Big Icon area inside styled circle container */}
      <div
        className="floaty"
        style={{
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: accentLt,
          border: '3.5px solid #151B3D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 44,
          boxShadow: '3px 3px 0px #151B3D',
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        {icon}
      </div>

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'center' }}>
        <h3 style={{
          fontSize: 22,
          fontWeight: 850,
          color: '#151B3D',
          fontFamily: "'Fredoka', sans-serif",
          margin: 0,
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: 14.5,
          color: '#151B3D',
          lineHeight: 1.5,
          fontWeight: 700,
          margin: 0,
          opacity: 0.9,
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export function HomeScreen() {
  return (
    <div
      className="screen"
      style={{
        background: 'var(--bg)',
        overflowY: 'auto',
        backgroundImage: 'radial-gradient(var(--dots-color) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        position: 'relative',
      }}
    >
      <TopBar here={0} steps={['Profile']} />

      {/* Whimsical Ambient Background World Elements */}
      <div style={{ position: 'absolute', top: '8%', left: '4%', opacity: 0.25 }} className="drift-cloud">
        <Doodle kind="cloud" size={130} color="var(--sky-lt)" />
      </div>
      <div style={{ position: 'absolute', top: '15%', right: '5%', opacity: 0.25 }} className="drift-cloud">
        <Doodle kind="cloud" size={160} color="var(--mint-lt)" style={{ animationDelay: '2.5s' }} />
      </div>
      <div style={{ position: 'absolute', top: '45%', left: '3%', opacity: 0.5 }} className="drift">
        <Doodle kind="sparkle" size={32} color="var(--butter)" />
      </div>
      <div style={{ position: 'absolute', top: '35%', right: '4%', opacity: 0.45 }} className="wobble">
        <Doodle kind="star" size={36} color="var(--lav)" />
      </div>
      <div style={{ position: 'absolute', bottom: '8%', left: '4%', opacity: 0.45 }} className="floaty">
        <Doodle kind="stetho" size={48} color="var(--mint)" />
      </div>
      <div style={{ position: 'absolute', bottom: '12%', right: '5%', opacity: 0.5 }} className="wobble">
        <Doodle kind="heart" size={36} color="var(--rose)" />
      </div>
      <div style={{ position: 'absolute', top: '12%', left: '22%', opacity: 0.45 }} className="floaty">
        <Doodle kind="bandage" size={54} color="var(--peach)" />
      </div>
      <div style={{ position: 'absolute', bottom: '45%', right: '3%', opacity: 0.45 }} className="drift">
        <Doodle kind="leaf" size={40} color="var(--green)" />
      </div>

      <div
        style={{
          padding: '48px 24px 80px',
          maxWidth: 1140,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* ─── HERO ILLUSTRATION CARD ─── */}
        <div
          className="popin"
          style={{
            background: '#FFFDF9',
            border: '4px solid #151B3D',
            borderRadius: 'var(--r-xl)',
            boxShadow: '8px 8px 0px #151B3D',
            position: 'relative',
            padding: '40px 24px',
            overflow: 'visible',
            width: '100%',
            maxWidth: 1000,
            minHeight: 380,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 48,
          }}
        >
          {/* Top accent badge */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: 'var(--mint)', borderBottom: '4px solid #151B3D', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }} />

          {/* Giant Hospital Illustration with GP & Child Mascots */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 36, flexWrap: 'wrap', position: 'relative', width: '100%', padding: '24px 0 12px' }}>
            {/* GP Mascot */}
            <div style={{ zIndex: 3, transform: 'scale(1.1) translateX(-10px)', transformOrigin: 'bottom center' }}>
              <Mascot name="gp" size={190} />
            </div>

            {/* Giant Clinic building SVG */}
            <div style={{ zIndex: 1, margin: '0 -20px' }} className="wobble">
              <svg width="340" height="340" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(6px 6px 0px #151B3D)' }}>
                <rect x="5" y="86" width="90" height="10" rx="3" fill="#151B3D" />
                
                {/* Side foliage */}
                <rect x="7" y="65" width="4" height="21" fill="#151B3D" rx="1" />
                <circle cx="9" cy="62" r="9" fill="var(--green)" stroke="#151B3D" strokeWidth="3" />
                <circle cx="15" cy="80" r="6" fill="var(--green-deep)" stroke="#151B3D" strokeWidth="3" />
                
                <rect x="89" y="65" width="4" height="21" fill="#151B3D" rx="1" />
                <circle cx="91" cy="62" r="9" fill="var(--green)" stroke="#151B3D" strokeWidth="3" />
                <circle cx="85" cy="80" r="6" fill="var(--green-deep)" stroke="#151B3D" strokeWidth="3" />

                {/* Building */}
                <rect x="15" y="32" width="70" height="54" rx="8" fill="#FFFEE8" stroke="#151B3D" strokeWidth="4" />
                <path d="M 10 32 L 50 12 L 90 32 Z" fill="var(--mint)" stroke="#151B3D" strokeWidth="4" strokeLinejoin="round" />
                
                {/* Red cross crest */}
                <circle cx="50" cy="24" r="5" fill="#ffffff" stroke="#151B3D" strokeWidth="3" />
                <path d="M 48 21 H 52 V 27 H 48 Z M 46 23 H 54 V 25 H 46 Z" fill="var(--coral)" />
                
                {/* Windows (lit yellow) */}
                <circle cx="32" cy="48" r="7" fill="#FFE599" stroke="#151B3D" strokeWidth="3" />
                <line x1="25" y1="48" x2="39" y2="48" stroke="#151B3D" strokeWidth="1.5" />
                <line x1="32" y1="41" x2="32" y2="55" stroke="#151B3D" strokeWidth="1.5" />
                
                <circle cx="68" cy="48" r="7" fill="#FFE599" stroke="#151B3D" strokeWidth="3" />
                <line x1="61" y1="48" x2="75" y2="48" stroke="#151B3D" strokeWidth="1.5" />
                <line x1="68" y1="41" x2="68" y2="55" stroke="#151B3D" strokeWidth="1.5" />
                
                {/* Door */}
                <rect x="40" y="62" width="20" height="24" rx="2" fill="var(--peach)" stroke="#151B3D" strokeWidth="3" />
                <line x1="50" y1="62" x2="50" y2="86" stroke="#151B3D" strokeWidth="3" />
                <circle cx="46" cy="74" r="1.5" fill="#151B3D" />
                <circle cx="54" cy="74" r="1.5" fill="#151B3D" />
              </svg>
            </div>

            {/* Child Mascot */}
            <div style={{ zIndex: 2, transform: 'scale(1.05) translateX(10px)', transformOrigin: 'bottom center' }}>
              <Mascot name="child" size={170} mood="happy" />
            </div>
          </div>
        </div>

        {/* ─── HEADER & MISSION DOSSIER ─── */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10, maxWidth: 740, margin: '0 auto 48px' }}>
          <div
            className="chip orange"
            style={{
              marginBottom: 16,
              fontSize: 13,
              padding: '6px 18px',
              fontFamily: "'Fredoka', sans-serif",
              border: '3.5px solid #151B3D',
              boxShadow: '3px 3px 0px #151B3D',
              fontWeight: 800,
              background: 'var(--peach)',
              color: '#ffffff',
            }}
          >
            ★ CLINICAL OUTPATIENT SIMULATOR
          </div>

          <h1
            style={{
              fontSize: 'clamp(44px, 6.5vw, 56px)',
              lineHeight: 1.05,
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 850,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, var(--peach) 0%, var(--coral) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 18,
            }}
          >
            ATRIUM+
          </h1>

          <p
            style={{
              fontSize: 18.5,
              fontWeight: 700,
              color: 'var(--ink-2)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Step through the clinic doors to meet your <span style={{ color: 'var(--mint-deep)' }}>simulated patient cases</span>. Converse with them <span style={{ color: 'var(--coral-deep)' }}>naturally out loud</span>, request diagnostic tests, and receive detailed <span style={{ color: 'var(--lav-deep)' }}>Attending feedback</span>!
          </p>
        </div>

        {/* ─── FEATURE CARDS ─── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
            flexWrap: 'wrap',
            zIndex: 10,
            width: '100%',
            maxWidth: 1200,
            margin: '0 auto 48px',
          }}
        >
          <FeatureCard
            icon="🩺"
            title="Clinical Rooms"
            description="Outpatient consult rooms across 24 specialties including Cardiology, Neurology, and Pediatrics."
            accentColor="var(--green)"
            accentLt="var(--green-lt)"
          />
          <FeatureCard
            icon="🎤"
            title="Voice Recognition"
            description="Converse with patients naturally using interactive speech to ask history questions."
            accentColor="var(--sky)"
            accentLt="var(--sky-lt)"
          />
          <FeatureCard
            icon="📚"
            title="Case Library"
            description="Browse complete outpatient rosters, unlock case files, and review OSCE scorecards."
            accentColor="var(--butter)"
            accentLt="var(--butter-lt)"
          />
        </div>

        {/* ─── HUGE NINTENDO START BUTTON ─── */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', zIndex: 10, marginBottom: 20 }}>
          <button
            type="button"
            className="btn-plush primary breathe btn-toy"
            style={{
              fontSize: 24,
              padding: '22px 64px',
              fontFamily: "'Fredoka', sans-serif",
              background: 'var(--peach)',
              color: '#ffffff',
              boxShadow: '0 8px 0px #151B3D !important',
              borderRadius: 'var(--r-pill)',
              border: '4px solid #151B3D',
              letterSpacing: '0.04em',
              fontWeight: 900,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => soundSystem.playHover(e.currentTarget)}
            onClick={() => {
              soundSystem.playClick();
              store.beginFromSplash();
            }}
          >
            🏥 ENTER SIMULATION →
          </button>
        </div>
      </div>
    </div>
  );
}
