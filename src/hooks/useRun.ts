import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isEngineError } from '../contracts/errors'
import type { EngineInput, EngineOutput } from '../contracts/types'
import { EngineWorkerClient } from '../worker/workerClient'
import { saveRunToHistory } from '../storage/localHistory'

export type RunPhase = 'idle' | 'processing' | 'completed' | 'cancelled' | 'error'

export interface UseRunState {
  readonly phase: RunPhase
  readonly output: EngineOutput | null
  readonly errorMessage: string | null
}

export interface RunOptions {
  readonly scenarioId: string
  readonly token: string
  readonly policyOverrides?: {
    readonly expectedIssuer?: string
    readonly expectedAudience?: string
  }
}

export function useRun(): {
  state: UseRunState
  execute: (options: RunOptions) => Promise<void>
  cancel: () => void
} {
  const [state, setState] = useState<UseRunState>({
    phase: 'idle',
    output: null,
    errorMessage: null,
  })
  const clientRef = useRef<EngineWorkerClient | null>(null)
  const activeRequestId = useRef<string | null>(null)

  useEffect(() => {
    clientRef.current = new EngineWorkerClient()
    return () => {
      clientRef.current?.dispose()
      clientRef.current = null
    }
  }, [])

  const execute = useCallback(async (options: RunOptions) => {
    const client = clientRef.current
    if (!client) return

    setState({ phase: 'processing', output: null, errorMessage: null })

    const input: EngineInput = {
      schemaVersion: '1.0.0',
      scenarioId: options.scenarioId,
      payload: options.policyOverrides
        ? { token: options.token, policyOverrides: options.policyOverrides }
        : { token: options.token },
      options: { deterministic: true },
    }

    try {
      const { requestId, result } = client.run(input)
      activeRequestId.current = requestId
      const output = await result
      activeRequestId.current = null

      if (output.status === 'cancelled') {
        setState({ phase: 'cancelled', output, errorMessage: null })
        return
      }

      setState({ phase: 'completed', output, errorMessage: null })
      void saveRunToHistory(output)
    } catch (error) {
      activeRequestId.current = null
      if (isEngineError(error) && error.code === 'RUN_CANCELLED') {
        setState({ phase: 'cancelled', output: null, errorMessage: null })
        return
      }
      const message = error instanceof Error ? error.message : 'Error interno no clasificado.'
      setState({ phase: 'error', output: null, errorMessage: message })
    }
  }, [])

  const cancel = useCallback(() => {
    const client = clientRef.current
    if (!client) return
    if (activeRequestId.current) {
      client.cancel(activeRequestId.current)
    }
    client.hardReset()
    setState({ phase: 'cancelled', output: null, errorMessage: null })
  }, [])

  return useMemo(() => ({ state, execute, cancel }), [state, execute, cancel])
}
