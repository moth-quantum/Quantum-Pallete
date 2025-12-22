"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import type { Cor, HSL } from "@/types/quantum"
import { hslToRgbString } from "@/utils/quantum-circuit"

interface CanvasProps {
  cors: Cor[]
  selectedColor: HSL | null
  onCanvasClick: (pos: { x: number; y: number }) => void
  onCorClick: (cor: Cor) => void
  onTrashClick: () => void
  onTrashDrop?: (corId: string) => void
}

export function Canvas({ cors, selectedColor, onCanvasClick, onCorClick, onTrashClick, onTrashDrop }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 })

  const updateCanvasDimensions = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      console.log("[v0] Canvas dimensions updated:", rect.width, rect.height)
      setCanvasDimensions({ width: rect.width, height: rect.height })
    }
  }

  useEffect(() => {
    updateCanvasDimensions()
    window.addEventListener("resize", updateCanvasDimensions)
    return () => window.removeEventListener("resize", updateCanvasDimensions)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    setCursorPos(pos)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return

    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()

    const percentX = (e.clientX - rect.left) / rect.width
    const percentY = (e.clientY - rect.top) / rect.height

    onCanvasClick({
      x: percentX,
      y: percentY,
    })
  }

  const generateBlobPath = (cor: Cor): string => {
    const seed = cor.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const random = (index: number) => {
      const x = Math.sin(seed + index) * 10000
      return x - Math.floor(x)
    }

    const points = 5
    const baseRadius = 64
    let path = "M "

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2
      const nextAngle = ((i + 1) / points) * Math.PI * 2

      const radiusVariation = 0.7 + random(i) * 0.3
      const radius = baseRadius * radiusVariation

      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      const nextRadius = baseRadius * (0.7 + random(i + 1) * 0.3)
      const nextX = Math.cos(nextAngle) * nextRadius
      const nextY = Math.sin(nextAngle) * nextRadius

      const cp1x = x + Math.cos(angle + Math.PI / 2) * (radius * 0.6 * (random(i + 10) - 0.5))
      const cp1y = y + Math.sin(angle + Math.PI / 2) * (radius * 0.6 * (random(i + 11) - 0.5))
      const cp2x = nextX - Math.cos(nextAngle + Math.PI / 2) * (nextRadius * 0.6 * (random(i + 12) - 0.5))
      const cp2y = nextY - Math.sin(nextAngle + Math.PI / 2) * (nextRadius * 0.6 * (random(i + 13) - 0.5))

      if (i === 0) {
        path += `${x} ${y} `
      }

      path += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${nextX} ${nextY} `
    }

    path += "Z"
    return path
  }

  const trashSize = Math.min(canvasDimensions.width, canvasDimensions.height) * 0.12 // 12% of smaller dimension
  const trashPadding = trashSize * 0.25 // 25% of trash size

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      className="w-full h-full relative cursor-crosshair select-none"
    >
      {/* Trash Region */}
      <div
        ref={trashRef}
        onClick={onTrashClick}
        className="absolute rounded-2xl border-2 bg-black border-slate-900 hover:bg-slate-900 transition-all flex items-center justify-center cursor-pointer shadow-lg group"
        style={{
          bottom: trashPadding,
          right: trashPadding,
          width: trashSize,
          height: trashSize,
        }}
        title="Click to deselect"
      >
        <svg
          className="text-white transition-transform group-hover:scale-110"
          fill="currentColor"
          viewBox="0 0 24 24"
          style={{ width: trashSize * 0.4, height: trashSize * 0.4 }}
        >
          <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z" />
        </svg>
      </div>

      {cors.map((cor) => {
        if (canvasDimensions.width === 0 || canvasDimensions.height === 0) {
          return null
        }

        const absoluteX = cor.x * canvasDimensions.width
        const absoluteY = cor.y * canvasDimensions.height

        return (
          <div
            key={cor.id}
            onClick={() => onCorClick(cor)}
            className="absolute cursor-pointer transition-transform hover:scale-105"
            style={{
              left: absoluteX - 64,
              top: absoluteY - 64,
              width: 128,
              height: 128,
            }}
          >
            <svg width="128" height="128" viewBox="-64 -64 128 128" className="drop-shadow-lg">
              <path d={generateBlobPath(cor)} fill={hslToRgbString(cor.color)} stroke="white" strokeWidth="2" />
            </svg>
          </div>
        )
      })}

      {/* Custom Cursor - Selected Color Circle */}
      {selectedColor && cursorPos && (
        <div
          className="pointer-events-none absolute w-8 h-8 rounded-full border-2 border-slate-300 shadow-lg"
          style={{
            left: cursorPos.x - 16,
            top: cursorPos.y - 16,
            backgroundColor: hslToRgbString(selectedColor),
          }}
        ></div>
      )}
    </div>
  )
}
