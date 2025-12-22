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

  const getRotationAngle = (cor: Cor): number => {
    const seed = cor.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const x = Math.sin(seed) * 10000
    const random = x - Math.floor(x)
    return random * 360
  }

  const trashSize = Math.min(canvasDimensions.width, canvasDimensions.height) * 0.12
  const trashPadding = trashSize * 0.25

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
        const rotation = getRotationAngle(cor)

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
            <svg width="128" height="128" viewBox="0 0 297 297" className="drop-shadow-lg">
              <g transform={`translate(148.5 148.5) scale(0.85) rotate(${rotation}) translate(-148.5 -148.5)`}>
                <path
                  d="M165.797,288.71c-16.89,0-23.974-15.545-26.301-20.652c-1.919-4.214-4.4-6.728-6.637-6.728
                    c-1.343,0-2.797,0.826-3.621,2.059c-10.602,15.854-29.265,25.322-49.922,25.322c-34.197,0-62.021-27.887-62.021-62.166
                    c0-21.166,8.271-38.889,22.124-47.404c3.865-2.381,5.826-4.702,5.826-6.9c0-2.814-3.012-4.884-5.989-5.476
                    C15.409,162.026,0,144.645,0,122.485c0-24.713,20.065-44.82,44.729-44.82c11.259,0,22.653,4.772,30.479,12.766
                    c3.585,3.661,7.638,5.365,12.756,5.365c8.769,0,16.306-6.502,16.459-14.196c0.047-2.183-0.073-9.916-0.124-12.712
                    c-0.001-0.063-0.002-0.124-0.002-0.185c0-33.875,27.013-60.413,61.499-60.413c34.199,0,62.024,27.887,62.024,62.166
                    c0,14.94-7.221,31.259-12.493,43.174l-0.237,0.537c-3.781,8.552-3.697,16.272,0.246,22.327c4.468,6.86,13.725,11.124,24.159,11.124
                    c1.115,0,2.254-0.048,3.384-0.143c2.557-0.215,7.247-0.388,9.649-0.428c0.243-0.004,0.471-0.006,0.7-0.006
                    c24.135,0,43.77,20.104,43.77,44.818c0,24.714-20.065,44.82-44.729,44.82c-12.84,0-22.554-6.859-30.36-12.371
                    c-0.97-0.685-1.936-1.366-2.905-2.034c-4.171-2.877-7.974-4.159-12.333-4.159c-4.903,0-9.571,2.035-13.147,5.728
                    c-3.759,3.884-5.732,9.02-5.557,14.46c0.102,3.117,0.82,5.201,1.91,8.355c1.066,3.087,2.392,6.927,3.264,12.284
                    c1.13,6.959-0.928,13.939-5.793,19.656C181.964,284.93,173.906,288.71,165.797,288.71z"
                  fill={hslToRgbString(cor.color)}
                  stroke="white"
                  strokeWidth="3"
                  fillRule="evenodd"
                />
              </g>
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
