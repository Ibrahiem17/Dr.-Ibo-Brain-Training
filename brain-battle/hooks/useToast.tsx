import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { MotiView } from 'moti'
import { colors } from '../constants/colors'

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    timerRef.current = setTimeout(() => setMessage(null), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={{ flex: 1 }}>
        {children}
        <MotiView
          animate={{ translateY: message ? 0 : 120, opacity: message ? 1 : 0 }}
          transition={{ type: 'timing', duration: 280 }}
          style={styles.toast}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{message ?? ''}</Text>
        </MotiView>
      </View>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(30,30,40,0.95)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
})
