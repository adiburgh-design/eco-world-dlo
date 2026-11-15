export type SfxType = 'click' | 'xp' | 'win' | 'error' | 'clue' | 'zone' | 'portal' | 'warp';

export interface MusicTrackState {
  zoneId: number; // 0 = homepage/map, 1..4 = mission rooms, 5 = final mission
  inMission: boolean;
  zoneRestored: boolean;
  ducked: boolean;
}

export interface MusicTrackInfo {
  title: string;
  intensityPct: number;
}

interface ZoneProfile {
  title: string;
  baseIntensity: number;
  bpm: number;
  filterHz: number;
  chords: number[][];
  spyArp: number[];
  bassSteps: number[]; // 0 = rest, 1 = root sub+mid, 2 = octave punch, 3 = minor/heroic fifth drive
  drumDrive: number;
}

// Original Futuristic Malaysian Secret-Agent / Spy-Adventure Electronic Orchestral Profiles
const ZONE_PROFILES: Record<number, ZoneProfile> = {
  0: {
    title: 'Spy-Agent Overture: EcoWorld',
    baseIntensity: 0.76,
    bpm: 128,
    filterHz: 2500,
    chords: [
      [164.81, 196.0, 246.94, 329.63], // Em (mysterious spy root)
      [130.81, 164.81, 196.0, 261.63], // C
      [146.83, 185.0, 220.0, 293.66], // D
      [123.47, 146.83, 185.0, 246.94], // Bm / spy tension
    ],
    spyArp: [0, 2, 3, 1, 2, 3, 2, 1],
    bassSteps: [1, 1, 2, 1, 3, 1, 2, 3],
    drumDrive: 0.94,
  },
  1: {
    title: 'Mission 01: Cyber River Ops',
    baseIntensity: 0.82,
    bpm: 130,
    filterHz: 2650,
    chords: [
      [146.83, 174.61, 220.0, 293.66], // Dm
      [116.54, 146.83, 174.61, 233.08], // Bb
      [130.81, 164.81, 196.0, 261.63], // C
      [110.0, 138.59, 164.81, 220.0], // A (agent cadence)
    ],
    spyArp: [0, 3, 2, 1, 3, 2, 1, 3],
    bassSteps: [1, 0, 1, 2, 1, 3, 2, 1],
    drumDrive: 0.96,
  },
  2: {
    title: 'Mission 02: Toxic City Recon',
    baseIntensity: 0.9,
    bpm: 134,
    filterHz: 3000,
    chords: [
      [220.0, 261.63, 329.63, 440.0], // Am
      [174.61, 220.0, 261.63, 349.23], // F
      [196.0, 246.94, 293.66, 392.0], // G
      [164.81, 207.65, 246.94, 329.63], // E (spy suspense)
    ],
    spyArp: [3, 2, 3, 1, 0, 2, 3, 2],
    bassSteps: [1, 2, 1, 2, 1, 3, 2, 2],
    drumDrive: 1.0,
  },
  3: {
    title: 'Mission 03: Forest Sanctuary',
    baseIntensity: 0.84,
    bpm: 128,
    filterHz: 2700,
    chords: [
      [174.61, 220.0, 261.63, 349.23], // F
      [261.63, 329.63, 392.0, 523.25], // C
      [196.0, 246.94, 293.66, 392.0], // G
      [220.0, 261.63, 329.63, 440.0], // Am
    ],
    spyArp: [0, 2, 3, 1, 2, 3, 3, 2],
    bassSteps: [1, 1, 2, 1, 3, 1, 2, 2],
    drumDrive: 0.95,
  },
  4: {
    title: 'Mission 04: Voice Command Pulse',
    baseIntensity: 0.93,
    bpm: 135,
    filterHz: 3200,
    chords: [
      [196.0, 246.94, 293.66, 392.0], // G
      [164.81, 196.0, 246.94, 329.63], // Em
      [261.63, 329.63, 392.0, 523.25], // C
      [293.66, 369.99, 440.0, 587.33], // D
    ],
    spyArp: [0, 3, 2, 3, 1, 2, 3, 3],
    bassSteps: [1, 2, 1, 2, 1, 3, 2, 3],
    drumDrive: 1.0,
  },
  5: {
    title: 'Final Mission: Epic EcoWorld Anthem',
    baseIntensity: 1.0,
    bpm: 138,
    filterHz: 3600,
    chords: [
      [261.63, 329.63, 392.0, 523.25], // C
      [196.0, 246.94, 293.66, 392.0], // G
      [220.0, 261.63, 329.63, 440.0], // Am
      [174.61, 220.0, 261.63, 349.23], // F
    ],
    spyArp: [3, 2, 3, 1, 2, 3, 2, 3],
    bassSteps: [1, 2, 1, 2, 3, 2, 1, 2],
    drumDrive: 1.0,
  },
};

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let soundEnabled = true;
let musicEnabled = true;
let musicVolume = 0.85; // 0..1 user-controllable volume
let musicRunning = false;

let musicMasterGain: GainNode | null = null;
let bassBoostFilter: BiquadFilterNode | null = null;
let musicCompressor: DynamicsCompressorNode | null = null;
let musicFilter: BiquadFilterNode | null = null;
let padOscs: OscillatorNode[] = [];
let padGain: GainNode | null = null;
let stepTimer: number | null = null;
let stepIndex = 0;

let currentMusicState: MusicTrackState = {
  zoneId: 0,
  inMission: false,
  zoneRestored: false,
  ducked: false,
};

function ensureAudioContext(): AudioContext | null {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  if (!noiseBuffer) {
    const length = audioCtx.sampleRate * 0.15;
    noiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

export function getMusicVolume(): number {
  return musicVolume;
}

export function setMusicVolume(vol: number): void {
  musicVolume = Math.max(0, Math.min(1, vol));
  if (musicVolume > 0 && !musicEnabled) {
    musicEnabled = true;
    startAmbientMusic();
  }
  applyMusicParameters();
}

export function setMusicEnabled(enabled: boolean): void {
  musicEnabled = enabled;
  if (!enabled) {
    if (musicMasterGain && audioCtx) {
      musicMasterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.18);
    }
  } else {
    startAmbientMusic();
    applyMusicParameters();
  }
}

export function getMusicTrackInfo(override?: Partial<MusicTrackState>): MusicTrackInfo {
  const st = override ? { ...currentMusicState, ...override } : currentMusicState;
  const profile = ZONE_PROFILES[st.zoneId] || ZONE_PROFILES[0];
  const intensity = computeIntensity(profile, st);
  return {
    title: profile.title,
    intensityPct: Math.round(intensity * 100),
  };
}

function computeIntensity(profile: ZoneProfile, st: MusicTrackState): number {
  let val = profile.baseIntensity;
  if (st.inMission) val += 0.07;
  if (st.zoneRestored && st.zoneId > 0 && st.zoneId < 5) val -= 0.05;
  return Math.max(0.65, Math.min(1.0, val));
}

function applyMusicParameters(): void {
  if (!audioCtx || !musicMasterGain || !musicFilter || !padGain) return;
  const now = audioCtx.currentTime;
  const profile = ZONE_PROFILES[currentMusicState.zoneId] || ZONE_PROFILES[0];
  const intensity = computeIntensity(profile, currentMusicState);

  const rawVolume = (0.3 + intensity * 0.1) * musicVolume;
  const baseVolume = musicEnabled && musicVolume > 0.01 ? rawVolume : 0.0001;
  const targetGain =
    currentMusicState.ducked && musicEnabled ? Math.max(0.0001, baseVolume * 0.15) : baseVolume;
  musicMasterGain.gain.setTargetAtTime(targetGain, now, 0.22);

  const targetCutoff = profile.filterHz + (currentMusicState.inMission ? 450 : 0);
  musicFilter.frequency.setTargetAtTime(targetCutoff, now, 0.3);
  padGain.gain.setTargetAtTime(0.08 + intensity * 0.04, now, 0.3);
}

export function setMusicState(partial: Partial<MusicTrackState>): void {
  currentMusicState = { ...currentMusicState, ...partial };
  applyMusicParameters();
}

export function startAmbientMusic(): void {
  if (!musicEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  if (!musicRunning) {
    musicRunning = true;

    musicMasterGain = ctx.createGain();
    musicMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);

    bassBoostFilter = ctx.createBiquadFilter();
    bassBoostFilter.type = 'lowshelf';
    bassBoostFilter.frequency.setValueAtTime(115, ctx.currentTime);
    bassBoostFilter.gain.setValueAtTime(8, ctx.currentTime);

    musicCompressor = ctx.createDynamicsCompressor();
    musicCompressor.threshold.setValueAtTime(-16, ctx.currentTime);
    musicCompressor.knee.setValueAtTime(12, ctx.currentTime);
    musicCompressor.ratio.setValueAtTime(4.5, ctx.currentTime);
    musicCompressor.attack.setValueAtTime(0.004, ctx.currentTime);
    musicCompressor.release.setValueAtTime(0.16, ctx.currentTime);

    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.setValueAtTime(2500, ctx.currentTime);
    musicFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.09, ctx.currentTime);

    padGain.connect(musicFilter);
    musicFilter.connect(bassBoostFilter);
    bassBoostFilter.connect(musicCompressor);
    musicCompressor.connect(musicMasterGain);
    musicMasterGain.connect(ctx.destination);

    const initChord = ZONE_PROFILES[currentMusicState.zoneId]?.chords[0] || ZONE_PROFILES[0].chords[0];
    padOscs = initChord.map((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(idx % 2 === 0 ? -6 : 6, ctx.currentTime);
      osc.connect(padGain!);
      osc.start();
      return osc;
    });

    scheduleNextStep();
  }

  applyMusicParameters();
}

function scheduleNextStep(): void {
  if (!musicRunning) return;
  const profile = ZONE_PROFILES[currentMusicState.zoneId] || ZONE_PROFILES[0];
  const intensity = computeIntensity(profile, currentMusicState);
  const effectiveBpm = profile.bpm + (currentMusicState.inMission ? 4 : 0);
  const stepMs = Math.round((60 / effectiveBpm / 4) * 1000);

  if (musicEnabled && musicVolume > 0.01 && audioCtx && musicFilter && bassBoostFilter && audioCtx.state === 'running') {
    const now = audioCtx.currentTime;
    const chordIdx = Math.floor(stepIndex / 16) % profile.chords.length;
    const chord = profile.chords[chordIdx];

    if (stepIndex % 16 === 0) {
      padOscs.forEach((osc, i) => {
        const freq = chord[i % chord.length];
        osc.frequency.setTargetAtTime(freq, now, 0.2);
      });
    }

    // 1. Heavy 808 Pumping Kick
    if (stepIndex % 4 === 0 || (stepIndex % 16 === 14 && intensity > 0.8)) {
      triggerKick(audioCtx, bassBoostFilter, 0.42 * profile.drumDrive, now);
    }

    // 2. Dramatic Spy Snare / Clap on 2 & 4
    if (stepIndex % 8 === 4) {
      triggerSnare(audioCtx, musicCompressor!, 0.16 * profile.drumDrive, now);
    }

    // 3. Futuristic 16th Electronic Hi-Hat
    if (stepIndex % 4 === 2 || stepIndex % 2 === 1) {
      triggerHiHat(
        audioCtx,
        musicCompressor!,
        (stepIndex % 4 === 2 ? 0.08 : 0.032) * profile.drumDrive,
        now
      );
    }

    // 4. Dual-Layer Strong Sub + Sawtooth Spy Bassline
    if (stepIndex % 2 === 0) {
      const bassMode = profile.bassSteps[(stepIndex / 2) % profile.bassSteps.length];
      if (bassMode > 0) {
        const root = chord[0];
        const bassFreq =
          bassMode === 2 ? root * 0.5 : bassMode === 3 ? root * 0.375 : root * 0.25;
        triggerVoice(
          audioCtx,
          bassBoostFilter,
          Math.max(46, bassFreq),
          'sine',
          0.26 + intensity * 0.08,
          0.22,
          now
        );
        triggerVoice(
          audioCtx,
          musicFilter,
          Math.max(72, bassFreq * 2),
          'sawtooth',
          0.12 + intensity * 0.05,
          0.17,
          now
        );
      }
    }

    // 5. Futuristic Spy-Adventure Synth Lead
    const melHit = stepIndex % 2 === 0 || stepIndex % 16 === 7 || stepIndex % 16 === 15;
    if (melHit) {
      const idx = profile.spyArp[Math.floor(stepIndex / 2) % profile.spyArp.length];
      const leadFreq = chord[idx % chord.length] * 2;
      triggerVoice(
        audioCtx,
        musicFilter,
        leadFreq,
        'triangle',
        0.075 + intensity * 0.035,
        0.18,
        now
      );
    }

    stepIndex = (stepIndex + 1) % 64;
  }

  stepTimer = window.setTimeout(scheduleNextStep, stepMs);
}

function triggerKick(ctx: AudioContext, dest: AudioNode, gainAmt: number, startTime: number): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, startTime);
  osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.11);
  g.gain.setValueAtTime(gainAmt, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.19);
  osc.connect(g);
  g.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + 0.2);
}

function triggerSnare(ctx: AudioContext, dest: AudioNode, gainAmt: number, startTime: number): void {
  if (!noiseBuffer) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.setValueAtTime(2100, startTime);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainAmt, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  src.start(startTime);
  src.stop(startTime + 0.13);
}

function triggerHiHat(ctx: AudioContext, dest: AudioNode, gainAmt: number, startTime: number): void {
  if (!noiseBuffer) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(6800, startTime);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainAmt, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.045);
  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  src.start(startTime);
  src.stop(startTime + 0.05);
}

function triggerVoice(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  type: OscillatorType,
  peakGain: number,
  durationSec: number,
  startTime: number
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);
  osc.connect(g);
  g.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + durationSec + 0.02);
}

export function stopAmbientMusic(): void {
  musicRunning = false;
  if (stepTimer !== null) {
    clearTimeout(stepTimer);
    stepTimer = null;
  }
  padOscs.forEach((o) => {
    try {
      o.stop();
      o.disconnect();
    } catch {
      // ignore
    }
  });
  padOscs = [];
  musicMasterGain?.disconnect();
  musicCompressor?.disconnect();
  bassBoostFilter?.disconnect();
  musicMasterGain = null;
  musicCompressor = null;
  bassBoostFilter = null;
  musicFilter = null;
  padGain = null;
}

export function playSFX(type: SfxType): void {
  if (!soundEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'click') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(540, now);
      o.frequency.exponentialRampToValueAtTime(780, now + 0.06);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      o.start(now);
      o.stop(now + 0.07);
    } else if (type === 'portal') {
      [330, 495, 660, 990].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, now + i * 0.05);
        g.gain.setValueAtTime(0.08, now + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.24);
        o.start(now + i * 0.05);
        o.stop(now + i * 0.05 + 0.24);
      });
    } else if (type === 'clue') {
      [660, 880, 1175].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, now + i * 0.06);
        g.gain.setValueAtTime(0.08, now + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.22);
        o.start(now + i * 0.06);
        o.stop(now + i * 0.06 + 0.22);
      });
    } else if (type === 'zone') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.setValueAtTime(360, now);
      o.frequency.exponentialRampToValueAtTime(540, now + 0.14);
      g.gain.setValueAtTime(0.07, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      o.start(now);
      o.stop(now + 0.16);
    } else if (type === 'xp') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'triangle';
      o.frequency.setValueAtTime(587, now);
      o.frequency.setValueAtTime(880, now + 0.08);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      o.start(now);
      o.stop(now + 0.24);
    } else if (type === 'win') {
      [523, 659, 784, 1046].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gn = ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gn);
        gn.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gn.gain.setValueAtTime(0.11, now + i * 0.09);
        gn.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.36);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.36);
      });
    } else if (type === 'warp') {
      // Sci-fi hyper-warp riser sweep
      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      sweep.type = 'sawtooth';
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(320, now);
      lp.frequency.exponentialRampToValueAtTime(3600, now + 0.72);
      sweep.frequency.setValueAtTime(90, now);
      sweep.frequency.exponentialRampToValueAtTime(660, now + 0.72);
      sweepGain.gain.setValueAtTime(0.001, now);
      sweepGain.gain.linearRampToValueAtTime(0.11, now + 0.16);
      sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      sweep.connect(lp);
      lp.connect(sweepGain);
      sweepGain.connect(ctx.destination);
      sweep.start(now);
      sweep.stop(now + 0.88);

      // Wind-tunnel shimmer burst
      if (noiseBuffer) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.setValueAtTime(2.5, now);
        bp.frequency.setValueAtTime(420, now);
        bp.frequency.exponentialRampToValueAtTime(2800, now + 0.68);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.001, now);
        ng.gain.linearRampToValueAtTime(0.08, now + 0.25);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        noise.connect(bp);
        bp.connect(ng);
        ng.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.88);
      }

      // Teleport arrival crystal chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + 0.45 + i * 0.05);
        g.gain.setValueAtTime(0.001, now + 0.45 + i * 0.05);
        g.gain.linearRampToValueAtTime(0.075, now + 0.49 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.92 + i * 0.05);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + 0.45 + i * 0.05);
        o.stop(now + 0.95 + i * 0.05);
      });
    } else if (type === 'error') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(220, now);
      o.frequency.linearRampToValueAtTime(140, now + 0.16);
      g.gain.setValueAtTime(0.07, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      o.start(now);
      o.stop(now + 0.18);
    }
  } catch {
    // Ignore audio context autoplay errors silently
  }
}
