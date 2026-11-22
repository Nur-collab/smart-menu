/**
 * Синтезатор звукового колокольчика кухни и зала (Web Audio API)
 * Не требует скачивания внешних mp3-файлов, работает автономно и мгновенно.
 */

let sharedAudioContext: AudioContext | null = null;
let isAudioUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioContext) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioContext = new AudioCtx();
    }
  }

  if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {
      // Игнорируем ошибку, если пользователь еще не взаимодействовал со страницей
    });
  }

  return sharedAudioContext;
}

/**
 * Разблокировка звука при первом клике пользователя в интерфейсе
 */
export function unlockAudio(): boolean {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {
        isAudioUnlocked = false;
      });
    } else {
      isAudioUnlocked = true;
    }
  }
  return isAudioUnlocked;
}

export function isAudioReady(): boolean {
  return isAudioUnlocked && sharedAudioContext !== null && sharedAudioContext.state === 'running';
}

/**
 * Воспроизведение звонкого двойного ресторанного колокольчика (Новый заказ со стола)
 */
export function playOrderChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Первый тон колокольчика (нота A5 - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(870, now + 0.8);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.8);

    // Второй высокий обертон (нота E6 - 1318Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1310, now + 0.9);

    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.12);
    osc2.stop(now + 0.9);
  } catch {
    // Безопасный перехват, если аудио заблокировано политикой браузера
  }
}

/**
 * Воспроизведение звука вызова официанта (Тревожный мягкий звонок)
 */
export function playWaiterCallChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Тройной короткий колокольчик
    [0, 0.15, 0.3].forEach((delay, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = 1046.5 + index * 100; // C6
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.28, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.35);
    });
  } catch {
    // Безопасный перехват
  }
}
