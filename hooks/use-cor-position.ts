"use client"

import { useCallback } from "react"

export function useCorPosition(cors: any[], setCors: any) {
  const updateCorPosition = useCallback(
    (corId: string, pos: { x: number; y: number }) => {
      setCors((prev: any) => prev.map((cor: any) => (cor.id === corId ? { ...cor, x: pos.x, y: pos.y } : cor)))
    },
    [setCors],
  )

  return {
    updateCorPosition,
  }
}
