let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Unlock audio context on user tap/interaction so mobile browsers allow loud sounds
 */
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (e) {
    // Silent fail
  }
}

/**
 * High-attention restaurant incoming order ring/chime.
 * Plays a double melodic chime (Swiggy/Zomato restaurant bell style) + phone vibration.
 */
export function playNewOrderAlertSound() {
  if (typeof window === 'undefined') return;

  // Trigger mobile vibration if supported
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 120, 300, 120, 450]);
    }
  } catch (e) {
    // Vibration ignored if not permitted
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const baseTime = Math.max(ctx.currentTime + 0.05, 0.05);

    // Helper to play a chime note
    const playNote = (freq: number, timeOffset: number, duration: number = 0.35, vol: number = 0.35) => {
      try {
        const time = baseTime + timeOffset;
        if (time < ctx.currentTime) return;

        // Primary chime oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        // Soft attack & exponential decay
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(vol, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        // Overtone harmonic for rich bell timbre
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, time);
        overtoneGain.gain.setValueAtTime(0.001, time);
        overtoneGain.gain.exponentialRampToValueAtTime(vol * 0.25, time + 0.02);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration + 0.05);

        overtone.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);
        overtone.start(time);
        overtone.stop(time + duration + 0.05);
      } catch (err) {
        // Individual note fail safe
      }
    };

    // Melody Cycle 1 (Ding - Dong - Ring)
    playNote(587.33, 0, 0.25, 0.4);        // D5
    playNote(739.99, 0.14, 0.25, 0.4);     // F#5
    playNote(880.00, 0.28, 0.35, 0.45);    // A5
    playNote(1174.66, 0.44, 0.6, 0.5);     // D6

    // Melody Cycle 2 (Repeating high bell alert for noisy kitchens/phone pockets)
    playNote(739.99, 0.85, 0.25, 0.45);     // F#5
    playNote(880.00, 0.99, 0.25, 0.45);     // A5
    playNote(1174.66, 1.13, 0.7, 0.55);    // D6
    playNote(1479.98, 1.29, 0.85, 0.6);    // F#6

  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

/**
 * General gentle chime for notifications
 */
export function playChimeNotification() {
  playNewOrderAlertSound();
}

/**
 * Subtle tap feedback sound
 */
export function playTapSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = Math.max(ctx.currentTime + 0.01, 0.01);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {
    // Silent fail
  }
}
