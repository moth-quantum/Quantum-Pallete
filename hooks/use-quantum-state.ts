"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import type { Cor, HSL } from "@/types/quantum"
import { QuantumCircuit, hslToAngles, expectationValuesToHsl } from "@/utils/quantum-circuit"

export function useQuantumState(requestQubit: () => number | null) {
  const [cors, setCors] = useState<Cor[]>([])

  const circuitRef = useRef<QuantumCircuit>(new QuantumCircuit())

  const generateId = useCallback(() => {
    return `cor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const computeColorsFromCircuit = useCallback((currentCors: Cor[]): Map<number, HSL> => {
    const circuit = circuitRef.current

    if (circuit.getNumQubits() === 0) return new Map()

    const expectationValues = circuit.calculateExpectationValues()
    const colors = new Map<number, HSL>()

    for (const [qubit, values] of expectationValues) {
      const cor = currentCors.find((c) => c.qubit === qubit)
      const saturation = cor ? cor.color[1] : 0.7
      const newHsl = expectationValuesToHsl(values.x, values.y, values.z, saturation)
      colors.set(qubit, newHsl)
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
      const newQubit = requestQubit()
      if (newQubit === null) return

      circuitRef.current.addQubit()

      const { ryAngle, rzAngle } = hslToAngles(color)

      circuitRef.current.ry(newQubit, ryAngle)
      circuitRef.current.rz(newQubit, rzAngle)

      const newCor: Cor = {
        id: generateId(),
        color,
        qubit: newQubit,
        x: Math.max(0, Math.min(1, pos.x)), // Clamp to 0-1
        y: Math.max(0, Math.min(1, pos.y)), // Clamp to 0-1
      }

      setCors((prev) => [...prev, newCor])
      setTimeout(updateCorColors, 0)
    },
    [generateId, requestQubit, updateCorColors],
  )

  const mixCors = useCallback(
    (cor1Qubit: number, cor2Qubit: number) => {
      circuitRef.current.pswap(cor1Qubit, cor2Qubit, Math.PI / 10)
      updateCorColors()
    },
    [updateCorColors],
  )

  const removeCor = useCallback((corId: string) => {
    setCors((prev) => prev.filter((cor) => cor.id !== corId))
  }, [])

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
  }
}
