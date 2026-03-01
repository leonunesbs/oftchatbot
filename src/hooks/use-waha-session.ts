import { useCallback, useEffect, useMemo, useState } from "react"

import { checkAndRecoverSession, getSessionQrCode, WahaApiError } from "@/lib/waha-client"

interface UseWahaSessionOptions {
  session?: string
  liveIntervalMs?: number
}

interface WahaSessionState {
  isChecking: boolean
  isLoadingQr: boolean
  available: boolean
  authorized: boolean
  connected: boolean
  requiresPairing: boolean
  attemptedReactivation: boolean
  status: string
  message: string | null
  qrCode: string | null
}

const INITIAL_STATE: WahaSessionState = {
  isChecking: true,
  isLoadingQr: false,
  available: true,
  authorized: true,
  connected: true,
  requiresPairing: false,
  attemptedReactivation: false,
  status: "unknown",
  message: null,
  qrCode: null,
}

export function useWahaSession(options?: UseWahaSessionOptions) {
  const session = options?.session ?? "default"
  const liveIntervalMs = options?.liveIntervalMs ?? 10000
  const [state, setState] = useState<WahaSessionState>(INITIAL_STATE)

  const verify = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setState((current) => ({ ...current, isChecking: true }))
      }
      const result = await checkAndRecoverSession(session)
      setState((current) => ({
        isChecking: false,
        isLoadingQr: result.requiresPairing ? current.isLoadingQr : false,
        available: result.available,
        authorized: result.authorized,
        connected: result.connected,
        requiresPairing: result.requiresPairing,
        attemptedReactivation: result.attemptedReactivation,
        status: result.status,
        message: result.message ?? null,
        qrCode: result.requiresPairing ? current.qrCode : null,
      }))
    } catch (error) {
      const message =
        error instanceof WahaApiError
          ? error.message
          : "Falha ao verificar sessão WAHA."
      setState({
        isChecking: false,
        isLoadingQr: false,
        available: false,
        authorized: true,
        connected: true,
        requiresPairing: false,
        attemptedReactivation: false,
        status: "unknown",
        message,
        qrCode: null,
      })
    }
  }, [session])

  const refreshQr = useCallback(async () => {
    setState((current) => ({ ...current, isLoadingQr: true }))
    try {
      const qrCode = await getSessionQrCode(session)
      setState((current) => ({
        ...current,
        isLoadingQr: false,
        qrCode,
      }))
    } catch (error) {
      const message =
        error instanceof WahaApiError
          ? error.message
          : "Falha ao buscar QR code da sessão."
      setState((current) => ({
        ...current,
        isLoadingQr: false,
        qrCode: null,
        message,
      }))
    }
  }, [session])

  useEffect(() => {
    void verify()
  }, [verify])

  useEffect(() => {
    if (liveIntervalMs <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      void verify(true)
    }, liveIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [liveIntervalMs, verify])

  useEffect(() => {
    if (!state.requiresPairing) {
      return
    }
    if (state.qrCode || state.isLoadingQr) {
      return
    }
    void refreshQr()
  }, [refreshQr, state.isLoadingQr, state.qrCode, state.requiresPairing])

  const canOperate = useMemo(
    () => state.authorized && state.connected,
    [state.authorized, state.connected]
  )

  return {
    ...state,
    canOperate,
    verify,
    refreshQr,
  }
}
