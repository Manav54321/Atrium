import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group } from 'three';
import * as THREE from 'three';

export type CharacterPose = 'sitting' | 'standing' | 'walking';
export type CharacterExpression = 'neutral' | 'pain' | 'anxious' | 'fatigued';
export type CharacterBodyType = 'thin' | 'normal' | 'heavy';
export type CharacterAccessory = 'glasses' | 'mask' | 'cane' | 'sling';
export type CharacterHairStyle =
  | 'crop'
  | 'bald'
  | 'receding'
  | 'beard'
  | 'long'
  | 'bun'
  | 'ponytail';

export interface CharacterProps {
  pose: CharacterPose;
  walkCycle?: number;
  age?: number;
  gender?: 'M' | 'F';
  /** Deterministic seed: same caseId → same colour/hair/body/accessories. */
  seed?: string;
  position?: [number, number, number];
  rotationY?: number;
  /** White doctor's coat + stethoscope. */
  doctor?: boolean;
  /** Facial expression override. Defaults to 'neutral'. */
  expression?: CharacterExpression;
  /** Body silhouette override. If omitted, derived from seed. */
  bodyType?: CharacterBodyType;
  /** Explicit accessories list. If omitted, derived from seed + age. */
  accessories?: CharacterAccessory[];
  /** Explicit hair style. If omitted, derived from gender + age + seed. */
  hairStyle?: CharacterHairStyle;
  /** If true, the head yaws to track the active camera (clamped to ±50°).
   *  Only meaningful while pose='sitting'. */
  lookAtCamera?: boolean;
}

function hashSeed(s: string | undefined): number {
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function palette(age: number, gender: 'M' | 'F', seed: string | undefined, doctor: boolean) {
  const h = hashSeed(seed);
  const skinTones = ['#f1c9a0', '#e4b58c', '#c89068', '#a67548', '#7a5234'];
  const hairTones =
    age > 60
      ? ['#c9c4ba', '#a9a49a', '#8a8680']
      : ['#2a1b10', '#4a2f18', '#8a5a2a', '#c4945a', '#1a1a1a'];
  const shirtTones = doctor
    ? ['#ffffff']
    : gender === 'F'
      ? ['#b8486a', '#6a8acc', '#d4954a', '#4a8a6a', '#8a5a9a']
      : ['#4a6a8a', '#8a5a3a', '#3a4a5a', '#6a4a3a', '#5a7a4a'];
  const pantsTones = doctor ? ['#3a4a5a'] : ['#2a2a3a', '#4a3a2a', '#5a4030', '#3a3a40'];
  return {
    skin: skinTones[h % skinTones.length],
    hair: hairTones[(h >> 3) % hairTones.length],
    shirt: shirtTones[(h >> 5) % shirtTones.length],
    pants: pantsTones[(h >> 7) % pantsTones.length],
    shoe: '#1a1a1a',
  };
}

function pickHairStyle(
  h: number,
  gender: 'M' | 'F',
  age: number,
  override?: CharacterHairStyle,
): CharacterHairStyle {
  if (override) return override;
  if (age > 65) {
    const opts: CharacterHairStyle[] =
      gender === 'M' ? ['receding', 'bald', 'bald', 'crop'] : ['bun', 'receding', 'long'];
    return opts[(h >> 9) % opts.length];
  }
  if (gender === 'M') {
    const opts: CharacterHairStyle[] = ['crop', 'crop', 'beard', 'beard', 'bald', 'long'];
    return opts[(h >> 9) % opts.length];
  }
  const opts: CharacterHairStyle[] = ['long', 'long', 'bun', 'ponytail'];
  return opts[(h >> 9) % opts.length];
}

function pickBodyType(h: number, override?: CharacterBodyType): CharacterBodyType {
  if (override) return override;
  const opts: CharacterBodyType[] = ['thin', 'normal', 'normal', 'normal', 'heavy'];
  return opts[(h >> 11) % opts.length];
}

function pickAccessories(
  h: number,
  age: number,
  override?: CharacterAccessory[],
): CharacterAccessory[] {
  if (override) return override;
  const out: CharacterAccessory[] = [];
  const roll = (h >> 13) % 100;
  // Glasses: common in elders, uncommon in young adults.
  if (age > 55) {
    if (roll < 55) out.push('glasses');
  } else if (age >= 16 && roll < 22) {
    out.push('glasses');
  }
  return out;
}

/**
 * Low-poly stylized human — same visual language as the room (soft-edge
 * rounded boxes, flat-lit meshStandard). Three explicit poses with manually
 * bent joints, so nobody ever stands in T-pose.
 *
 * Extensions over the original:
 *   - Facial expressions (neutral / pain / anxious / fatigued) drive eyebrow
 *     angle, eye squint, mouth shape.
 *   - Body types (thin / normal / heavy) scale torso + hip width and add a
 *     belly for 'heavy'.
 *   - Hair styles (crop / bald / receding / beard / long / bun / ponytail)
 *     deterministically picked from seed.
 *   - Accessories (glasses / mask / cane / sling) rendered when present.
 *   - Optional head tracking makes the character maintain eye contact with
 *     the active camera while seated.
 *
 * Anatomy uses real-ish proportions:
 *   head ≈ 0.22,  torso 0.56,  legs 0.82,  total ≈ 1.72m standing.
 * Sitting hip at y=0.46 so it lines up with the existing PatientChair cushion.
 */
export function StylizedCharacter({
  pose,
  walkCycle = 0,
  age = 35,
  gender = 'M',
  seed,
  position = [0, 0, 0],
  rotationY = 0,
  doctor = false,
  expression = 'neutral',
  bodyType,
  accessories,
  hairStyle,
  lookAtCamera = false,
}: CharacterProps) {
  const ref = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const { camera } = useThree();

  const h = useMemo(() => hashSeed(seed), [seed]);
  const col = useMemo(() => palette(age, gender, seed, doctor), [age, gender, seed, doctor]);
  const hair = useMemo(
    () => pickHairStyle(h, gender, age, hairStyle),
    [h, gender, age, hairStyle],
  );
  const body = useMemo(() => pickBodyType(h, bodyType), [h, bodyType]);
  const acc = useMemo(() => pickAccessories(h, age, accessories), [h, age, accessories]);

  const female = gender === 'F';
  const child = age < 14;
  const elder = age > 65;
  const scale = child ? 0.78 : elder ? 0.95 : 1.0;

  // Body silhouette multipliers.
  const torsoWidthMul = body === 'thin' ? 0.85 : body === 'heavy' ? 1.2 : 1.0;
  const hipWidthMul = body === 'thin' ? 0.9 : body === 'heavy' ? 1.15 : 1.0;
  const torsoDepthMul = body === 'heavy' ? 1.12 : 1.0;

  // Breathing + optional head tracking.
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const breathAmp = expression === 'pain' ? 0.012 : expression === 'fatigued' ? 0.007 : 0.004;
    const breathHz = expression === 'pain' ? 2.6 : 1.8;
    ref.current.position.y = Math.sin(t * breathHz) * breathAmp;

    if (lookAtCamera && pose === 'sitting' && headRef.current) {
      const q = new THREE.Quaternion();
      ref.current.getWorldQuaternion(q);
      const charWorldYaw = new THREE.Euler().setFromQuaternion(q, 'YXZ').y;
      const headWorld = new THREE.Vector3();
      headRef.current.getWorldPosition(headWorld);
      const dx = camera.position.x - headWorld.x;
      const dz = camera.position.z - headWorld.z;
      if (dx * dx + dz * dz > 0.001) {
        const worldAngleToCam = Math.atan2(dx, dz);
        let yaw = worldAngleToCam - charWorldYaw;
        while (yaw > Math.PI) yaw -= 2 * Math.PI;
        while (yaw < -Math.PI) yaw += 2 * Math.PI;
        const limit = Math.PI / 3.6; // ~50°
        yaw = Math.max(-limit, Math.min(limit, yaw));
        // Smooth toward target to avoid popping on phase transition.
        const cur = headRef.current.rotation.y;
        headRef.current.rotation.y = cur + (yaw - cur) * 0.15;
      }
    } else if (headRef.current && headRef.current.rotation.y !== 0) {
      // When not tracking, ease back to neutral.
      headRef.current.rotation.y *= 0.85;
    }
  });

  // Joint angles per pose.
  const swing = pose === 'walking' ? Math.sin(walkCycle * Math.PI * 2) * 0.8 : 0;
  const armSwing = pose === 'walking' ? Math.sin(walkCycle * Math.PI * 2) * 0.6 : 0;
  const hipBend = pose === 'sitting' ? -Math.PI / 2 : 0;
  const kneeBend = pose === 'sitting' ? Math.PI / 2 : 0;
  const shoulderBend = pose === 'sitting' ? -0.35 : 0.05;
  const elbowBend = pose === 'sitting' ? 0.9 : -0.15;

  const seatHipY = 0.46;
  const torsoBaseY = pose === 'sitting' ? seatHipY : 0.92;

  // Expression parameters.
  const browAngle =
    expression === 'pain' ? 0.55
    : expression === 'anxious' ? 0.3
    : expression === 'fatigued' ? -0.15
    : 0;
  const browY =
    expression === 'pain' ? 0.035
    : expression === 'anxious' ? 0.055
    : expression === 'fatigued' ? 0.03
    : 0.045;
  const eyeScaleY =
    expression === 'fatigued' ? 0.4
    : expression === 'pain' ? 0.35
    : 1.0;
  const mouthW =
    expression === 'pain' ? 0.042
    : expression === 'anxious' ? 0.05
    : expression === 'fatigued' ? 0.036
    : 0.04;
  const mouthH =
    expression === 'pain' ? 0.014 : 0.006;

  const browColor = col.hair === '#ffffff' ? '#c9c4ba' : col.hair;
  const slingRightArm = acc.includes('sling');

  // When the character is scaled down (children, elders) the entire body —
  // including the seated-hip Y origin — shrinks toward y=0. Without
  // compensation a child sitting in a chair ends up with their hips below
  // the cushion ("sinking into the seat"). Lift the root group so the hip
  // still lands at the unscaled cushion height.
  const sittingLift = pose === 'sitting' ? seatHipY * (1 - scale) : 0;
  const rootY = position[1] + sittingLift;

  return (
    <group
      ref={ref}
      position={[position[0], rootY, position[2]]}
      rotation={[0, rotationY, 0]}
      scale={scale}
    >
      {/* ======= TORSO + HEAD ======= */}
      <group position={[0, torsoBaseY, 0]}>
        {/* hips */}
        <RoundedBox
          args={[0.34 * hipWidthMul, 0.14, 0.24]}
          radius={0.05}
          smoothness={3}
          castShadow
        >
          <meshStandardMaterial color={col.pants} roughness={0.85} />
        </RoundedBox>

        {/* torso — waist-taper for females, width & depth from body type */}
        <RoundedBox
          args={[
            (female ? 0.3 : 0.38) * torsoWidthMul,
            0.48,
            0.22 * torsoDepthMul,
          ]}
          radius={0.09}
          smoothness={3}
          position={[0, 0.32, 0]}
          castShadow
        >
          <meshStandardMaterial color={col.shirt} roughness={0.8} />
        </RoundedBox>

        {/* Heavy build is conveyed via torso/hip width + depth multipliers
            above. We deliberately do NOT add a forward belly bulge — a sphere
            on the chest reads as a pregnant abdomen, especially on male
            characters. */}

        {/* doctor's coat — second, longer white layer over the torso */}
        {doctor && (
          <>
            <RoundedBox
              args={[0.42, 0.62, 0.26]}
              radius={0.06}
              smoothness={3}
              position={[0, 0.22, 0.005]}
              castShadow
            >
              <meshStandardMaterial color="#f7f4ee" roughness={0.82} />
            </RoundedBox>
            <mesh position={[0, 0.36, 0.135]}>
              <boxGeometry args={[0.012, 0.4, 0.004]} />
              <meshStandardMaterial color="#d8d2c6" />
            </mesh>
            <mesh position={[0.08, 0.55, 0.13]} rotation={[0, 0, -0.2]}>
              <torusGeometry args={[0.09, 0.012, 8, 18, Math.PI]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0.12, 0.44, 0.14]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.015, 14]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.75} roughness={0.2} />
            </mesh>
            <mesh position={[-0.12, 0.38, 0.138]} castShadow>
              <boxGeometry args={[0.08, 0.035, 0.004]} />
              <meshStandardMaterial color="#e8d788" />
            </mesh>
          </>
        )}

        {/* arm sling — off-white triangle strapped around the torso */}
        {slingRightArm && (
          <mesh position={[0.06, 0.3, 0.13]} castShadow>
            <boxGeometry args={[0.28, 0.18, 0.04]} />
            <meshStandardMaterial color="#eadfc8" roughness={0.9} />
          </mesh>
        )}

        {/* neck */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.06, 0.08, 14]} />
          <meshStandardMaterial color={col.skin} roughness={0.78} />
        </mesh>

        {/* ======= HEAD ======= */}
        <group ref={headRef} position={[0, 0.77, 0]}>
          <RoundedBox args={[0.2, 0.24, 0.2]} radius={0.08} smoothness={4} castShadow>
            <meshStandardMaterial color={col.skin} roughness={0.72} />
          </RoundedBox>

          {/* hair silhouettes — sphere-based skullcaps that hug the cranium
              instead of helmet-like blocks on top. Each style starts from
              a partial sphere matching the head's curvature, then adds
              style-specific extras (bun, ponytail, beard, etc.). The head
              is centered at local (0,0,0) with cranium radius ~0.11. */}
          {(hair === 'crop' || hair === 'beard') && (
            <>
              {/* skullcap — partial sphere phi 0..π/2.5 covers top + tapers
                  back, leaving forehead clear. Slightly oblong to follow
                  the head scale. */}
              <mesh position={[0, 0.02, -0.005]} castShadow scale={[1, 0.95, 1.02]}>
                <sphereGeometry
                  args={[0.108, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]}
                />
                <meshStandardMaterial color={col.hair} roughness={0.92} />
              </mesh>
              {hair === 'beard' && (
                <mesh position={[0, -0.075, 0.018]} castShadow scale={[1.05, 0.85, 1]}>
                  <sphereGeometry
                    args={[0.1, 16, 12, 0, Math.PI * 2, Math.PI / 2.4, Math.PI / 2.6]}
                  />
                  <meshStandardMaterial color={col.hair} roughness={0.92} />
                </mesh>
              )}
            </>
          )}
          {hair === 'receding' && (
            <mesh position={[0, 0.04, -0.025]} castShadow scale={[0.95, 0.8, 1]}>
              <sphereGeometry
                args={[0.105, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2.7]}
              />
              <meshStandardMaterial color={col.hair} roughness={0.92} />
            </mesh>
          )}
          {hair === 'long' && (
            <>
              {/* skullcap — fuller, drops a bit lower on sides */}
              <mesh position={[0, 0.015, -0.005]} castShadow scale={[1.05, 1.05, 1.05]}>
                <sphereGeometry
                  args={[0.11, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]}
                />
                <meshStandardMaterial color={col.hair} roughness={0.88} />
              </mesh>
              {/* hair falling behind shoulders — soft slab */}
              <mesh position={[0, -0.08, -0.085]} castShadow>
                <boxGeometry args={[0.22, 0.28, 0.05]} />
                <meshStandardMaterial color={col.hair} roughness={0.88} />
              </mesh>
              {/* front strands either side of face */}
              {[-1, 1].map((sd) => (
                <mesh
                  key={`strand-${sd}`}
                  position={[sd * 0.092, -0.02, 0.045]}
                  rotation={[0, 0, sd * -0.08]}
                  castShadow
                >
                  <boxGeometry args={[0.026, 0.18, 0.05]} />
                  <meshStandardMaterial color={col.hair} roughness={0.88} />
                </mesh>
              ))}
            </>
          )}
          {hair === 'bun' && (
            <>
              {/* slicked-back skullcap */}
              <mesh position={[0, 0.025, -0.012]} castShadow scale={[1, 0.95, 1.02]}>
                <sphereGeometry
                  args={[0.107, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2.4]}
                />
                <meshStandardMaterial color={col.hair} roughness={0.9} />
              </mesh>
              {/* bun at the back of the head */}
              <mesh position={[0, 0.02, -0.105]} castShadow>
                <sphereGeometry args={[0.05, 14, 12]} />
                <meshStandardMaterial color={col.hair} roughness={0.9} />
              </mesh>
              {/* a thin band where the hair is gathered */}
              <mesh position={[0, 0.02, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.025, 0.006, 8, 14]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
              </mesh>
            </>
          )}
          {hair === 'ponytail' && (
            <>
              <mesh position={[0, 0.02, -0.005]} castShadow scale={[1, 0.95, 1.02]}>
                <sphereGeometry
                  args={[0.108, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2.4]}
                />
                <meshStandardMaterial color={col.hair} roughness={0.9} />
              </mesh>
              {/* tail hanging down behind the head, slight outward curve */}
              <mesh
                position={[0, -0.05, -0.115]}
                rotation={[0.18, 0, 0]}
                castShadow
              >
                <cylinderGeometry args={[0.024, 0.014, 0.28, 12]} />
                <meshStandardMaterial color={col.hair} roughness={0.9} />
              </mesh>
              {/* tie at the base of the tail */}
              <mesh position={[0, 0.04, -0.105]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.022, 0.005, 8, 12]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
              </mesh>
            </>
          )}

          {/* eyes — scaled Y for fatigued/pain (squint) */}
          {[-0.045, 0.045].map((dx, i) => (
            <mesh
              key={`eye-${i}`}
              position={[dx, 0.01, 0.102]}
              scale={[1, eyeScaleY, 1]}
            >
              <sphereGeometry args={[0.016, 10, 8]} />
              <meshStandardMaterial color="#1a1410" />
            </mesh>
          ))}

          {/* eyebrows — angled inward for pain/anxious, outward for fatigued */}
          {[-1, 1].map((sd) => (
            <mesh
              key={`brow-${sd}`}
              position={[sd * 0.045, browY, 0.105]}
              rotation={[0, 0, sd * browAngle]}
            >
              <boxGeometry args={[0.032, 0.008, 0.006]} />
              <meshStandardMaterial color={browColor} roughness={0.85} />
            </mesh>
          ))}

          {/* nose */}
          <mesh position={[0, -0.01, 0.108]} castShadow>
            <coneGeometry args={[0.018, 0.055, 6]} />
            <meshStandardMaterial color={col.skin} roughness={0.75} />
          </mesh>

          {/* mouth — width + height track the expression */}
          <mesh position={[0, -0.058, 0.102]}>
            <boxGeometry args={[mouthW, mouthH, 0.006]} />
            <meshStandardMaterial color="#8a3a32" />
          </mesh>

          {/* pain: add down-turned corners */}
          {expression === 'pain' && (
            <>
              {[-1, 1].map((sd) => (
                <mesh
                  key={`pain-corner-${sd}`}
                  position={[sd * 0.025, -0.067, 0.103]}
                  rotation={[0, 0, sd * 0.5]}
                >
                  <boxGeometry args={[0.018, 0.006, 0.006]} />
                  <meshStandardMaterial color="#8a3a32" />
                </mesh>
              ))}
            </>
          )}

          {/* ears */}
          {[-0.1, 0.1].map((dx, i) => (
            <mesh key={`ear-${i}`} position={[dx, 0, 0]} castShadow>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial color={col.skin} roughness={0.75} />
            </mesh>
          ))}

          {/* glasses — two rings + bridge + temples */}
          {acc.includes('glasses') && (
            <>
              {[-0.045, 0.045].map((dx) => (
                <mesh key={`gl-${dx}`} position={[dx, 0.01, 0.115]}>
                  <torusGeometry args={[0.026, 0.0035, 6, 18]} />
                  <meshStandardMaterial color="#2a2420" metalness={0.4} roughness={0.3} />
                </mesh>
              ))}
              <mesh position={[0, 0.01, 0.115]}>
                <boxGeometry args={[0.025, 0.004, 0.004]} />
                <meshStandardMaterial color="#2a2420" metalness={0.4} roughness={0.3} />
              </mesh>
              {[-1, 1].map((sd) => (
                <mesh
                  key={`tmp-${sd}`}
                  position={[sd * 0.09, 0.01, 0.05]}
                  rotation={[0, sd * 0.15, 0]}
                >
                  <boxGeometry args={[0.09, 0.005, 0.005]} />
                  <meshStandardMaterial color="#2a2420" metalness={0.4} />
                </mesh>
              ))}
            </>
          )}

          {/* surgical mask — covers lower face */}
          {acc.includes('mask') && (
            <>
              <mesh position={[0, -0.04, 0.11]} castShadow>
                <boxGeometry args={[0.175, 0.1, 0.025]} />
                <meshStandardMaterial color="#e8f0f8" roughness={0.9} />
              </mesh>
              {/* ear loops */}
              {[-1, 1].map((sd) => (
                <mesh
                  key={`loop-${sd}`}
                  position={[sd * 0.1, -0.03, 0.03]}
                  rotation={[Math.PI / 2, 0, sd * 0.3]}
                >
                  <torusGeometry args={[0.018, 0.002, 6, 10]} />
                  <meshStandardMaterial color="#c8d0d8" roughness={0.85} />
                </mesh>
              ))}
            </>
          )}
        </group>

        {/* ======= ARMS ======= */}
        {[-1, 1].map((side, i) => {
          // The slung arm hangs across the chest in a fixed bent position.
          const isSlung = slingRightArm && side === 1;
          if (isSlung) {
            return (
              <group
                key={`arm-${i}`}
                position={[side * 0.2, 0.5, 0]}
                rotation={[-0.55, 0, -0.6]}
              >
                <mesh position={[0, -0.16, 0]} castShadow>
                  <cylinderGeometry args={[0.05, 0.045, 0.32, 12]} />
                  <meshStandardMaterial
                    color={doctor ? '#f7f4ee' : col.shirt}
                    roughness={0.8}
                  />
                </mesh>
                <group position={[0, -0.32, 0]} rotation={[0.6, 0, 0]}>
                  <mesh position={[0, -0.16, 0]} castShadow>
                    <cylinderGeometry args={[0.042, 0.038, 0.3, 12]} />
                    <meshStandardMaterial
                      color={doctor ? '#f7f4ee' : col.shirt}
                      roughness={0.8}
                    />
                  </mesh>
                  <mesh position={[0, -0.34, 0]} castShadow>
                    <sphereGeometry args={[0.05, 10, 10]} />
                    <meshStandardMaterial color={col.skin} roughness={0.75} />
                  </mesh>
                </group>
              </group>
            );
          }
          const armRot = side === 1 ? -armSwing : armSwing;
          return (
            <group
              key={`arm-${i}`}
              position={[side * 0.2, 0.5, 0]}
              rotation={[shoulderBend + armRot, 0, side * 0.08]}
            >
              <mesh position={[0, -0.16, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.045, 0.32, 12]} />
                <meshStandardMaterial
                  color={doctor ? '#f7f4ee' : col.shirt}
                  roughness={0.8}
                />
              </mesh>
              <group position={[0, -0.32, 0]} rotation={[elbowBend, 0, 0]}>
                <mesh position={[0, -0.16, 0]} castShadow>
                  <cylinderGeometry args={[0.042, 0.038, 0.3, 12]} />
                  <meshStandardMaterial
                    color={doctor ? '#f7f4ee' : col.shirt}
                    roughness={0.8}
                  />
                </mesh>
                <mesh position={[0, -0.34, 0]} castShadow>
                  <sphereGeometry args={[0.05, 10, 10]} />
                  <meshStandardMaterial color={col.skin} roughness={0.75} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

      {/* ======= LEGS ======= */}
      {[-1, 1].map((side, i) => {
        const legSwing = side === 1 ? swing : -swing;
        return (
          <group
            key={`leg-${i}`}
            position={[side * 0.09, torsoBaseY, 0]}
            rotation={[hipBend + legSwing * 0.6, 0, 0]}
          >
            <mesh position={[0, -0.2, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.06, 0.4, 12]} />
              <meshStandardMaterial color={col.pants} roughness={0.85} />
            </mesh>
            <group position={[0, -0.4, 0]} rotation={[kneeBend + legSwing * 0.4, 0, 0]}>
              <mesh position={[0, -0.2, 0]} castShadow>
                <cylinderGeometry args={[0.055, 0.045, 0.4, 12]} />
                <meshStandardMaterial color={col.pants} roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.38, 0.08]} castShadow>
                <boxGeometry args={[0.11, 0.07, 0.22]} />
                <meshStandardMaterial color={col.shoe} roughness={0.6} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Cane — external to body, used while standing/walking */}
      {acc.includes('cane') && pose !== 'sitting' && (
        <group position={[0.35, 0, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 1.0, 10]} />
            <meshStandardMaterial color="#6a4a2a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.98, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.045, 0.014, 8, 12, Math.PI]} />
            <meshStandardMaterial color="#4a3a20" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Warm the module so first mount doesn't suspend. No GLTF needed — all
// geometry is procedural.
export const preloadStylizedCharacter = () => {
  void THREE;
};
