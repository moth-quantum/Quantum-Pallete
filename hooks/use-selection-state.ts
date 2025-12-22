"use client"

import { useState, useCallback } from "react"
import type { HSL } from "@/types/quantum"

export function useSelectionState() {
  const [selectedColor, setSelectedColor] = useState<HSL | null>(null)

  const selectColor = useCallback((color: HSL) => {
    setSelectedColor(color)
  }, [])

  const deselectColor = useCallback(() => {
    setSelectedColor(null)
  }, [])

  return {
    selectedColor,
    selectColor,
    deselectColor,
  }
}
