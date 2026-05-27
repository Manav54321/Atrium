// Free / freely-licensed GLB human character models, hosted on stable,
// CORS-enabled public origins. Every URL below was verified via WebFetch to
// return HTTP 200 with a body that begins with the `glTF` magic bytes.
//
// Expansion history: the original version of this file mapped one single
// rig onto each demographic slot, so every adult female patient rendered
// as Mixamo Michelle, every adult male as Soldier, etc. The file now
// exposes a *pool* of visually-distinct rigs per slot (see `AVATAR_POOLS`)
// and a seeded `pickAvatar` so two patients with identical demographics
// but different case IDs get different faces.
//
// Known caveats:
//   * Ready Player Me's `models.readyplayer.me/<id>.glb` endpoint is not
//     reachable from the build/test environment (ECONNREFUSED). We
//     therefore do NOT rely on any `models.readyplayer.me` URL. The one
//     RPM avatar we DO use is the copy that three.js mirrors on its own
//     CDN (`threejs.org/examples/models/gltf/readyplayer.me.glb`), which
//     has been served reliably for years.
//   * None of the freely-hosted realistic rigs are explicitly demographic
//     ("elderly", "teen", etc.). The Avatar component applies per-age
//     visual treatment (scale, stoop) on top of whichever rig we pick.
//     Elderly slots re-use the adult rigs and child/teen slots re-use the
//     stylised/smaller rigs.

export interface AvatarModel {
  /** Direct GLB URL. CORS-enabled, served with content-type that
   *  `@react-three/drei`'s `useGLTF` accepts. */
  url: string;
  /** Human-readable credit: "Source · author · license". */
  credit: string;
  /** Intrinsic model height in metres (head-top to feet) in its native
   *  T-pose. Callers multiply their desired world height by
   *  `desired / naturalHeight` to get a uniform scale. Values here were
   *  measured from the bounding boxes of the loaded scenes; they err on the
   *  side of slightly too tall so characters don't clip through the floor
   *  if the measurement is off. */
  naturalHeight: number;
  /** Short label shown only in dev logs / React keys. Not user-visible. */
  label?: string;
}

// ---------------------------------------------------------------------------
// Individual verified rigs. Each one has been WebFetch-verified to return a
// body starting with the `glTF` magic number, and each one has an explicit
// free / CC-BY / sample-examples license that allows use in a demo sim.
// ---------------------------------------------------------------------------

/**
 * Soldier.glb — a realistic-ish Mixamo male character with Idle / Walk /
 * Run / TPose animations. Hosted on threejs.org as one of the official
 * three.js example models. ~2.1 MB.
 */
const SOLDIER: AvatarModel = {
  url: 'https://threejs.org/examples/models/gltf/Soldier.glb',
  credit: 'three.js examples · Mixamo / Adobe · free for three.js examples',
  naturalHeight: 1.8,
  label: 'Soldier',
};

/**
 * Michelle.glb — a clearly-female Mixamo rig (Ch03) with SambaDance / TPose
 * animations. Hosted on threejs.org. ~3.1 MB.
 */
const MICHELLE: AvatarModel = {
  url: 'https://threejs.org/examples/models/gltf/Michelle.glb',
  credit: 'three.js examples · Mixamo / Adobe · free for three.js examples',
  naturalHeight: 1.7,
  label: 'Michelle',
};

/**
 * Xbot.glb — a stylised Mixamo "Beta" robot/humanoid with Idle / Run /
 * Agree / HeadShake animations. Less realistic than Soldier but fully
 * rigged and body-proportioned like a slim adult. ~2.8 MB.
 */
const XBOT: AvatarModel = {
  url: 'https://threejs.org/examples/models/gltf/Xbot.glb',
  credit: 'three.js examples · Mixamo / Adobe · free for three.js examples',
  naturalHeight: 1.8,
  label: 'Xbot',
};

/**
 * readyplayer.me.glb — a Ready Player Me avatar (bearded male in a
 * wedding-style outfit with a cowboy hat) mirrored on the three.js CDN.
 * Hosted on threejs.org. ~1.8 MB. Full Mixamo-style skeleton, plus face
 * morphs. NOTE: we deliberately use the three.js mirror here rather than
 * `models.readyplayer.me/*.glb` because the latter is firewalled from the
 * build/test environment. This URL has been stable for years.
 */
const RPM_COWBOY: AvatarModel = {
  url: 'https://threejs.org/examples/models/gltf/readyplayer.me.glb',
  credit: 'three.js examples · Ready Player Me · Ready Player Me Avatar Terms',
  naturalHeight: 1.75,
  label: 'RPM-Cowboy',
};

/**
 * CesiumMan.glb (legacy Khronos sample-models repo). A small-ish rigged
 * human with a walk cycle. CC-BY 4.0. ~462 KB. Great stand-in for a teen
 * or young adult when scaled down slightly.
 */
const CESIUM_MAN_LEGACY: AvatarModel = {
  url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
  credit: 'Khronos glTF Sample Models · Cesium / AGI · CC-BY 4.0',
  naturalHeight: 1.65,
  label: 'CesiumMan',
};

/**
 * CesiumMan.glb (newer Khronos glTF-Sample-Assets repo). Same character,
 * slightly different export. CC-BY 4.0. ~410 KB. Listed so child/teen
 * pools can be two-deep even when we're stuck with Cesium's proportions.
 */
const CESIUM_MAN_NEW: AvatarModel = {
  url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb',
  credit: 'Khronos glTF Sample Assets · Cesium / AGI · CC-BY 4.0',
  naturalHeight: 1.65,
  label: 'CesiumMan-2',
};

// (RiggedFigure removed — the Khronos wireframe mannequin looks too
// abstract next to the proper Mixamo rigs. Kept the URL out of the pool
// entirely so it never renders as a patient.)

/**
 * RobotExpressive.glb — stylised toy robot with an unusually rich
 * animation set (Idle / Walking / Running / Sitting / Standing / Dance /
 * Wave / Yes / No / ThumbsUp / Death / Jump / Punch). Hosted on
 * threejs.org. ~380 KB. This is the ONLY known-stable public GLB with an
 * explicit "Sitting" animation, so Avatar.tsx uses it when callers pass
 * `pose: 'sitting'` and want a real seated pose instead of a T-pose
 * perched on a chair.
 */
const ROBOT_EXPRESSIVE: AvatarModel = {
  url: 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb',
  credit: 'three.js examples · Tomás Laulhé / Don McCurdy · CC0',
  naturalHeight: 1.7,
  label: 'RobotExpressive',
};

// ---------------------------------------------------------------------------
// Demographic pools. Each slot has at least two distinct rigs where we
// could find them. Elderly slots re-use the adult rigs (the Avatar
// component adds a stoop + slight shrink based on age); child/teen use the
// smaller Cesium + stylised Xbot rigs.
// ---------------------------------------------------------------------------

export const AVATAR_POOLS: {
  adultMale: AvatarModel[];
  adultFemale: AvatarModel[];
  elderlyMale: AvatarModel[];
  elderlyFemale: AvatarModel[];
  child: AvatarModel[];
} = {
  // Only realistic Mixamo rigs in adult pools. CesiumMan and RiggedFigure
  // are tech-demo meshes (striped / wireframe) and look terrible on an
  // adult patient, so we keep them out of the main slots.
  adultMale: [SOLDIER, RPM_COWBOY],
  adultFemale: [MICHELLE, XBOT],
  elderlyMale: [SOLDIER, RPM_COWBOY],
  elderlyFemale: [MICHELLE, XBOT],

  // Child slot: CesiumMan scaled down reads as a kid; keep the two Cesium
  // variants + Xbot as alternates. (Xbot is a slim Mixamo rig which works
  // for teens once shrunk.)
  child: [CESIUM_MAN_LEGACY, CESIUM_MAN_NEW, XBOT],
};

/** Back-compat: some call sites still reach for a single rig per slot.
 *  We pick slot[0] of each pool. Prefer `AVATAR_POOLS` + `pickAvatar()`. */
export const AVATAR_MODELS: {
  adultMale: AvatarModel;
  adultFemale: AvatarModel;
  elderlyMale: AvatarModel;
  elderlyFemale: AvatarModel;
  child: AvatarModel;
  /** Optional teen/young-adult slot — re-uses the adult rigs. */
  teen: AvatarModel;
} = {
  adultMale: AVATAR_POOLS.adultMale[0],
  adultFemale: AVATAR_POOLS.adultFemale[0],
  elderlyMale: AVATAR_POOLS.elderlyMale[0],
  elderlyFemale: AVATAR_POOLS.elderlyFemale[0],
  child: AVATAR_POOLS.child[0],
  teen: XBOT,
};

/** Extra model only used for explicit seated poses (it has a real
 *  Sitting animation clip). Exposed so Avatar.tsx can swap to it when
 *  `pose === 'sitting'` and the caller is willing to accept a stylised
 *  robot in exchange for a genuinely seated silhouette. */
export const SITTING_FALLBACK_MODEL: AvatarModel = ROBOT_EXPRESSIVE;

/** Which pool does a given (age, gender) map to?
 *  Thresholds mirror the ones in `figureParams.ts`. */
function poolFor(age: number, gender: 'M' | 'F'): AvatarModel[] {
  if (age < 18) return AVATAR_POOLS.child;
  if (age >= 70) {
    return gender === 'F' ? AVATAR_POOLS.elderlyFemale : AVATAR_POOLS.elderlyMale;
  }
  return gender === 'F' ? AVATAR_POOLS.adultFemale : AVATAR_POOLS.adultMale;
}

/** Tiny deterministic string-hash. 32-bit FNV-1a is plenty for picking
 *  one of ~3 bucket entries. Keeping this local so the data module has
 *  zero runtime dependencies. */
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Force unsigned
  return h >>> 0;
}

/**
 * Pick an avatar rig for a given (age, gender).
 *
 * - If `seed` is provided, the choice is deterministic (same seed +
 *   same demographics ⇒ same rig). Callers typically pass `case.id` so a
 *   given patient looks the same on every re-render, but two different
 *   patients with identical demographics can get different faces.
 * - If `seed` is omitted, falls back to a random pick. That keeps the
 *   legacy 2-arg signature working for any caller that hasn't been
 *   updated yet — it just won't be stable across re-renders.
 */
export function pickAvatar(
  age: number,
  gender: 'M' | 'F',
  seed?: string,
): AvatarModel {
  const pool = poolFor(age, gender);
  if (pool.length === 0) {
    // Should be impossible given the static data above, but keep a
    // hard-coded fallback so we never return undefined.
    return MICHELLE;
  }
  if (seed === undefined) {
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }
  // Mix the demographic bucket into the hash too — otherwise a given
  // case.id would pick the same bucket index across every demographic
  // slot, which looks coincidental.
  const bucketKey = `${age < 18 ? 'c' : age >= 70 ? 'e' : 'a'}${gender}`;
  const idx = hashString(`${bucketKey}:${seed}`) % pool.length;
  return pool[idx];
}

/** Every unique URL that the Avatar component may need. Used by the
 *  component's `useGLTF.preload` calls so first-render latency is
 *  amortised at app start. Automatically derived from `AVATAR_POOLS`
 *  + the sitting fallback so adding a new rig to a pool is a one-line
 *  change. */
export const ALL_AVATAR_URLS: readonly string[] = Array.from(
  new Set<string>([
    ...AVATAR_POOLS.adultMale.map((m) => m.url),
    ...AVATAR_POOLS.adultFemale.map((m) => m.url),
    ...AVATAR_POOLS.elderlyMale.map((m) => m.url),
    ...AVATAR_POOLS.elderlyFemale.map((m) => m.url),
    ...AVATAR_POOLS.child.map((m) => m.url),
    SITTING_FALLBACK_MODEL.url,
  ]),
);

// Default export shim: the original file had no default export, but add
// one now so call sites can `import pickAvatar from '…'` if they want to.
// The named exports above are still the primary API.
export default pickAvatar;
