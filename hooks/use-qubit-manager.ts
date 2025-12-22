"use client"

import { useState, useCallback } from "react"

export function useQubitManager(maxQubits = 4) {
  const [nextQubit, setNextQubit] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const requestQubit = useCallback((): number | null => {
    setError(null)

    if (nextQubit >= maxQubits) {
      setError("Maximum number of qubits reached.")
      return null
    }

    const qubit = nextQubit
    setNextQubit((prev) => prev + 1)
    return qubit
  }, [nextQubit, maxQubits])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    requestQubit,
    error,
    clearError,
    usedQubits: nextQubit,
    availableQubits: maxQubits - nextQubit,
  }
}
