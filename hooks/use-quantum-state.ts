"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import type { Cor, HSL } from "@/types/quantum"
import { QuantumCircuit, hslToAngles, expectationValuesToHsl } from "@/utils/quantum-circuit"

export interface MeasurementResult {
  outcome: 0 | 1
  prob0: number
  prob1: number
  qubitIndex: number
}

export function useQuantumState(
  requestQubit: () => number | null,
  releaseQubit: (qubit: number) => void
) {
  const [cors, setCors] = useState<Cor[]>([])
  const [lastMeasurement, setLastMeasurement] = useState<MeasurementResult | null>(null)

  const circuitRef = useRef<QuantumCircuit>(new QuantumCircuit())
  
  // Maps logical qubit index (from qubitManager) to circuit qubit index (position in statevector)
  // When qubits are removed, circuit indices shift but logical indices stay the same
  const logicalToCircuitMapRef = useRef<Map<number, number>>(new Map())

  const generateId = useCallback(() => {
    return `cor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const computeColorsFromCircuit = useCallback((currentCors: Cor[]): Map<number, HSL> => {
    const circuit = circuitRef.current
    const logicalToCircuit = logicalToCircuitMapRef.current

    if (circuit.getNumQubits() === 0) return new Map()

    const expectationValues = circuit.calculateExpectationValues()
    const colors = new Map<number, HSL>()

    // expectationValues is keyed by circuit qubit index
    // We need to map back to logical qubit index for each cor
    for (const cor of currentCors) {
      const circuitIndex = logicalToCircuit.get(cor.qubit)
      if (circuitIndex === undefined) continue
      
      const values = expectationValues.get(circuitIndex)
      if (!values) continue
      
      const saturation = cor.color[1]
      const newHsl = expectationValuesToHsl(values.x, values.y, values.z, saturation)
      colors.set(cor.qubit, newHsl) // Use logical qubit index as key
    }

    return colors
  }, [])

  const updateCorColors = useCallback(() => {
    setCors((prevCors) => {
      console.log("[v0] Updating cor colors, current cors:", prevCors.length)
      const colors = computeColorsFromCircuit(prevCors)
      console.log("[v0] Computed colors from circuit:", Array.from(colors.entries()))

      const updatedCors = prevCors.map((cor) => {
        const newColor = colors.get(cor.qubit)
        if (newColor) {
          console.log(`[v0] Updating cor ${cor.id} (qubit ${cor.qubit}):`, cor.color, "->", newColor)
        }
        return newColor ? { ...cor, color: newColor } : cor
      })

      console.log("[v0] Updated cors:", updatedCors)
      return updatedCors
    })
  }, [computeColorsFromCircuit])

  const createCor = useCallback(
    (pos: { x: number; y: number }, color: HSL) => {
      const newLogicalQubit = requestQubit()
      if (newLogicalQubit === null) return

      // Add qubit to circuit - this returns the circuit index
      const circuitIndex = circuitRef.current.addQubit()
      
      // Map logical qubit to circuit qubit
      logicalToCircuitMapRef.current.set(newLogicalQubit, circuitIndex)

      const { ryAngle, rzAngle } = hslToAngles(color)

      // Apply gates using circuit index
      circuitRef.current.ry(circuitIndex, ryAngle)
      circuitRef.current.rz(circuitIndex, rzAngle)

      const newCor: Cor = {
        id: generateId(),
        color,
        qubit: newLogicalQubit, // Store logical qubit index
        x: Math.max(0, Math.min(1, pos.x)),
        y: Math.max(0, Math.min(1, pos.y)),
      }

      setCors((prev) => [...prev, newCor])
      setTimeout(updateCorColors, 0)
    },
    [generateId, requestQubit, updateCorColors],
  )

  const mixCors = useCallback(
    (cor1LogicalQubit: number, cor2LogicalQubit: number) => {
      const logicalToCircuit = logicalToCircuitMapRef.current
      const circuit1 = logicalToCircuit.get(cor1LogicalQubit)
      const circuit2 = logicalToCircuit.get(cor2LogicalQubit)
      
      if (circuit1 === undefined || circuit2 === undefined) {
        console.warn(`[v0] Cannot mix: qubit mapping not found for ${cor1LogicalQubit} or ${cor2LogicalQubit}`)
        return
      }
      
      circuitRef.current.pswap(circuit1, circuit2, Math.PI / 10)
      updateCorColors()
    },
    [updateCorColors],
  )

  /**
   * Removes a Cor by performing a quantum measurement (collapse) on its qubit.
   * This implements a quantum trajectory: we measure in Z basis, probabilistically
   * choose outcome 0 or 1, project the state, and trace out the qubit.
   * The qubit index is then released for reuse.
   */
  const removeCor = useCallback(
    (corId: string): MeasurementResult | null => {
      // Find the cor to remove
      const corToRemove = cors.find((c) => c.id === corId)
      if (!corToRemove) {
        console.warn(`[v0] Attempted to remove non-existent cor: ${corId}`)
        return null
      }

      const logicalQubitToRemove = corToRemove.qubit
      const circuit = circuitRef.current
      const logicalToCircuit = logicalToCircuitMapRef.current

      // Get the circuit index for this logical qubit
      const circuitQubitIndex = logicalToCircuit.get(logicalQubitToRemove)

      if (circuitQubitIndex === undefined || circuit.getNumQubits() === 0) {
        console.warn(`[v0] Qubit ${logicalQubitToRemove} not found in circuit mapping`)
        setCors((prev) => prev.filter((cor) => cor.id !== corId))
        logicalToCircuit.delete(logicalQubitToRemove)
        releaseQubit(logicalQubitToRemove)
        return null
      }

      // Perform measurement and collapse
      const measurementResult = circuit.measureAndRemoveQubit(circuitQubitIndex)

      console.log(
        `[v0] Measured logical qubit ${logicalQubitToRemove} (circuit index ${circuitQubitIndex}): ` +
          `outcome=${measurementResult.outcome}, P(0)=${measurementResult.prob0.toFixed(4)}, P(1)=${measurementResult.prob1.toFixed(4)}`
      )

      // Update the logical-to-circuit mapping
      // Remove the measured qubit's mapping
      logicalToCircuit.delete(logicalQubitToRemove)
      
      // Decrement circuit indices for all qubits that had a higher circuit index
      for (const [logicalQubit, circuitIdx] of logicalToCircuit.entries()) {
        if (circuitIdx > circuitQubitIndex) {
          logicalToCircuit.set(logicalQubit, circuitIdx - 1)
        }
      }

      // Update cors: remove the measured cor
      setCors((prev) => prev.filter((cor) => cor.id !== corId))

      // Release the logical qubit for reuse
      releaseQubit(logicalQubitToRemove)

      const result: MeasurementResult = {
        outcome: measurementResult.outcome,
        prob0: measurementResult.prob0,
        prob1: measurementResult.prob1,
        qubitIndex: logicalQubitToRemove,
      }

      setLastMeasurement(result)

      // Update colors for remaining cors
      setTimeout(updateCorColors, 0)

      return result
    },
    [cors, releaseQubit, updateCorColors]
  )

  const palette = useMemo(() => {
    return cors.reduce(
      (acc, cor) => {
        acc[cor.id] = cor.color
        return acc
      },
      {} as Record<string, HSL>,
    )
  }, [cors])

  return {
    cors,
    setCors,
    palette,
    createCor,
    mixCors,
    removeCor,
    lastMeasurement,
  }
}
