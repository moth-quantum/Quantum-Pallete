"use client"

import type React from "react"
import { useState, useRef } from "react"
import type { HSL } from "@/types/quantum"

interface ColorPickerProps {
  onColorSelect: (color: HSL) => void
}

export function ColorPicker({ onColorSelect }: ColorPickerProps) {
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(1)
  const [lightness, setLightness] = useState(0.5)
  const svRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const [isDraggingSV, setIsDraggingSV] = useState(false)
  const [isDraggingHue, setIsDraggingHue] = useState(false)

  const updateSV = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!svRef.current) return
    const rect = svRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const newSaturation = Math.max(0, Math.min(1, x))
    const newLightness = Math.max(0, Math.min(1, 1 - y))

    setSaturation(newSaturation)
    setLightness(newLightness)

    // Auto-select the new color
    onColorSelect([hue, newSaturation, newLightness])
  }

  const handleSVClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    updateSV(e)
  }

  const handleSVMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsDraggingSV(true)
    updateSV(e)
  }

  const handleSVMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingSV) {
      e.stopPropagation()
      updateSV(e)
    }
  }

  const handleSVMouseUp = () => {
    setIsDraggingSV(false)
  }

  const updateHue = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return
    const rect = hueRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const newHue = Math.max(0, Math.min(1, x))

    setHue(newHue)

    // Auto-select the new color
    onColorSelect([newHue, saturation, lightness])
  }

  const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    updateHue(e)
  }

  const handleHueMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsDraggingHue(true)
    updateHue(e)
  }

  const handleHueMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingHue) {
      e.stopPropagation()
      updateHue(e)
    }
  }

  const handleHueMouseUp = () => {
    setIsDraggingHue(false)
  }

  const hueColor = `hsl(${hue * 360}, 100%, 50%)`

  return (
    <div
      className="w-full space-y-4"
      onClick={(e) => e.stopPropagation()}
      onMouseUp={() => {
        handleSVMouseUp()
        handleHueMouseUp()
      }}
      onMouseLeave={() => {
        handleSVMouseUp()
        handleHueMouseUp()
      }}
    >
      {/* Saturation/Lightness Rectangle */}
      <div
        ref={svRef}
        onClick={handleSVClick}
        onMouseDown={handleSVMouseDown}
        onMouseMove={handleSVMouseMove}
        onMouseUp={handleSVMouseUp}
        className="w-full aspect-[4/3] rounded-xl cursor-crosshair relative overflow-hidden shadow-lg border-2 border-slate-200"
        style={{
          background: `linear-gradient(to bottom, white, transparent, black),linear-gradient(to right, #808080, ${hueColor})`
        }}
      >
        {/* Indicator */}
        <div
          className="absolute w-6 h-6 border-2 border-white rounded-full pointer-events-none shadow-lg"
          style={{
            left: `calc(${saturation * 100}% - 12px)`,
            top: `calc(${(1 - lightness) * 100}% - 12px)`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* Hue Slider */}
      <div
        ref={hueRef}
        onClick={handleHueClick}
        onMouseDown={handleHueMouseDown}
        onMouseMove={handleHueMouseMove}
        onMouseUp={handleHueMouseUp}
        className="w-full h-10 rounded-full cursor-pointer relative overflow-hidden shadow-lg border-2 border-slate-200"
        style={{
          background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
        }}
      >
        {/* Hue Indicator */}
        <div
          className="absolute top-1/2 w-8 h-8 border-3 border-white rounded-full -translate-y-1/2 pointer-events-none shadow-lg"
          style={{
            left: `calc(${hue * 100}% - 16px)`,
            backgroundColor: hueColor,
            boxShadow: "0 0 0 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </div>
  )
}
