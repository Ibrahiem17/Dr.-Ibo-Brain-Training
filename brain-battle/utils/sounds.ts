// expo-av is not available in Expo Go — sounds are silently disabled.
// Re-enable when building a standalone APK with expo run:android.

export type SoundKey =
  | 'correct'
  | 'wrong'
  | 'countdownBeep'
  | 'countdownGo'
  | 'results'
  | 'newBest'
  | 'buttonTap'

export async function preloadSounds(): Promise<void> {}
export function setAudioActive(_active: boolean): void {}
export function setMuted(_muted: boolean): void {}
export async function playSound(_key: SoundKey, _volume = 1.0): Promise<void> {}
