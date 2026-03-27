import { router } from 'expo-router'
import { useSessionStore } from '../store/sessionStore'
import { useQuickPlayStore } from '../store/quickPlayStore'
import { useSoloStore } from '../store/soloStore'
import { useEndlessStore } from '../store/endlessStore'

export type GameMode = 'battle' | 'solo' | 'quickplay' | 'endless'

export function useQuitGame(mode: GameMode) {
  const resetSession = useSessionStore((s) => s.resetSession)
  const resetQuickPlay = useQuickPlayStore((s) => s.reset)
  const resetSolo = useSoloStore((s) => s.reset)
  const resetEndless = useEndlessStore((s) => s.reset)

  const handleConfirmQuit = () => {
    if (mode === 'battle') resetSession()
    else if (mode === 'quickplay') resetQuickPlay()
    else if (mode === 'solo') resetSolo()
    else if (mode === 'endless') resetEndless()
    router.replace('/')
  }

  return { handleConfirmQuit }
}
