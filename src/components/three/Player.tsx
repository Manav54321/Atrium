import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { interactionBus } from './interactions';

const WALK_SPEED = 4.0;
const RUN_SPEED = 8.0;
const PLAYER_RADIUS = 0.35;
const DEFAULT_HEIGHT = 1.7;

export interface WallCollider {
  x: number;
  z: number;
  w: number;
  d: number;
}

interface PlayerProps {
  spawn?: [number, number, number];
  colliders: WallCollider[];
  onInteract: (kind: 'desk' | 'bed' | 'triage', bedIndex?: number) => void;
  onTalk?: (bedIndex: number | null) => void;
  /** Camera eye height. 1.7m for standing, 1.45m for a seated doctor. */
  height?: number;
  /** When true, WASD is disabled — the player stays put. Used in Polyclinic
   *  where the doctor is seated and only looks around with the mouse. */
  locked?: boolean;
  /** If set, the camera is oriented to look at this world point on spawn. */
  lookAt?: [number, number, number];
  /** When false, PointerLockControls is NOT mounted at all. This is the
   *  root fix for the "mouse falls into the game on UI clicks" problem —
   *  the encounter screen only enables this when the user explicitly hits
   *  the Look-around button. Default: false (off). */
  enableLook?: boolean;
}

export function Player({
  spawn = [0, DEFAULT_HEIGHT, 8],
  colliders,
  onInteract,
  onTalk,
  height = DEFAULT_HEIGHT,
  locked = false,
  lookAt,
  enableLook = false,
}: PlayerProps) {
  const { camera } = useThree();
  const keys = useRef({ w: false, a: false, s: false, d: false, run: false });
  const tmp = useRef(new THREE.Vector3());
  const spawnedRef = useRef(false);

  // Spawn the camera ONCE on mount. `spawn` comes in as a new array each
  // render when defaulted, so don't re-run on identity changes — that would
  // teleport the player every time a parent state (modal, voice panel) updates.
  useEffect(() => {
    if (spawnedRef.current) return;
    spawnedRef.current = true;
    camera.position.set(spawn[0], height, spawn[2]);
    if (lookAt) {
      camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keyFor = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') return 'w';
      if (k === 's' || e.key === 'ArrowDown') return 's';
      if (k === 'a' || e.key === 'ArrowLeft') return 'a';
      if (k === 'd' || e.key === 'ArrowRight') return 'd';
      return null;
    };
    const onDown = (e: KeyboardEvent) => {
      if (!document.pointerLockElement) return;
      if (e.key === 'Shift') { keys.current.run = true; return; }
      const k = keyFor(e);
      if (k) keys.current[k] = true;
      if (e.key === 'e' || e.key === 'E') {
        const active = interactionBus.getActive();
        if (active) onInteract(active.kind, active.bedIndex);
      }
      if ((e.key === 's' || e.key === 'S') && onTalk) {
        const active = interactionBus.getActive();
        if (
          active &&
          (active.kind === 'bed' || active.kind === 'triage') &&
          active.bedIndex !== undefined
        ) {
          onTalk(active.bedIndex);
        }
      }
      if ((e.key === 't' || e.key === 'T') && onTalk) {
        onTalk(null);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') { keys.current.run = false; return; }
      const k = keyFor(e);
      if (k) keys.current[k] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [onInteract, onTalk]);

  useFrame((_, dt) => {
    if (!document.pointerLockElement) return;
    // Locked: doctor is seated, pointer can look around but WASD is disabled.
    if (!locked) {
      const dir = tmp.current;
      camera.getWorldDirection(dir);
      dir.y = 0;
      if (dir.lengthSq() !== 0) {
        dir.normalize();

        const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        const move = new THREE.Vector3();
        if (keys.current.w) move.add(dir);
        if (keys.current.s) move.sub(dir);
        if (keys.current.d) move.add(right);
        if (keys.current.a) move.sub(right);

        if (move.lengthSq() > 0) {
          const speed = keys.current.run ? RUN_SPEED : WALK_SPEED;
          move.normalize().multiplyScalar(speed * Math.min(dt, 0.05));

          const tryX = camera.position.x + move.x;
          if (!collides(tryX, camera.position.z, colliders)) {
            camera.position.x = tryX;
          }
          const tryZ = camera.position.z + move.z;
          if (!collides(camera.position.x, tryZ, colliders)) {
            camera.position.z = tryZ;
          }
          camera.position.y = height;
        }
      }
    }

    // Update active interactable
    const all = interactionBus.getAll();
    let best: { id: string; d2: number } | null = null;
    for (const i of all) {
      const dx = camera.position.x - i.position[0];
      const dz = camera.position.z - i.position[2];
      const d2 = dx * dx + dz * dz;
      if (d2 <= i.radius * i.radius && (!best || d2 < best.d2)) {
        best = { id: i.id, d2 };
      }
    }
    interactionBus.setActive(best ? best.id : null);
  });

  // Only mount the controls when the user has explicitly opted into
  // look-around. Without this, drei's PointerLockControls grabs pointer
  // lock on ANY click anywhere on the canvas — which fights every modal,
  // overlay, button, and bleed-through click in the rest of the UI.
  return enableLook ? <PointerLockControls /> : null;
}

function collides(x: number, z: number, colliders: WallCollider[]): boolean {
  for (const c of colliders) {
    const dx = Math.abs(x - c.x);
    const dz = Math.abs(z - c.z);
    if (dx < c.w / 2 + PLAYER_RADIUS && dz < c.d / 2 + PLAYER_RADIUS) {
      return true;
    }
  }
  return false;
}
