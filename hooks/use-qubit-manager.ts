"use client"

import { useState, useCallback } from "react"

export function useQubitManager(maxQubits = 4) {
  // Track the next fresh qubit index
  const [nextFreshQubit, setNextFreshQubit] = useState(0)
  // Track released qubit indices that can be reused
  const [releasedQubits, setReleasedQubits] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const requestQubit = useCallback((): number | null => {
    setError(null)

    // First, try to reuse a released qubit
    if (releasedQubits.length > 0) {
      const reusedQubit = releasedQubits[0]
      setReleasedQubits((prev) => prev.slice(1))
      return reusedQubit
    }

    // Otherwise, allocate a fresh qubit
    if (nextFreshQubit >= maxQubits) {
      setError("Maximum number of qubits reached.")
      return null
    }

    const qubit = nextFreshQubit
    setNextFreshQubit((prev) => prev + 1)
    return qubit
  }, [nextFreshQubit, releasedQubits, maxQubits])

  const releaseQubit = useCallback((qubit: number) => {
    // When a qubit is measured and removed, its index becomes available again
    setReleasedQubits((prev) => {
      if (prev.includes(qubit)) return prev
      return [...prev, qubit].sort((a, b) => a - b)
    })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Calculate how many qubits are currently in use
  const usedQubits = nextFreshQubit - releasedQubits.length

  return {
    requestQubit,
    releaseQubit,
    error,
    clearError,
    usedQubits,
    availableQubits: maxQubits - usedQubits,
  }
}
