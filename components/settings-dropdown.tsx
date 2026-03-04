"use client"

import { useState, useRef, useEffect } from "react"
import { Settings } from "lucide-react"
import type { ColorFormat } from "@/types/quantum"

interface SettingsDropdownProps {
  colorFormat: ColorFormat
  onColorFormatChange: (format: ColorFormat) => void
  gateStrength: number
  onGateStrengthChange: (strength: number) => void
}

const colorFormats: { value: ColorFormat; label: string }[] = [
  { value: "rgb", label: "RGB" },
  { value: "hsl", label: "HSL" },
  { value: "hex", label: "Hex" },
]

export function SettingsDropdown({
  colorFormat,
  onColorFormatChange,
  gateStrength,
  onGateStrengthChange,
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="w-8 h-8 rounded-full border-2 border-slate-300 hover:border-slate-500 transition-colors flex items-center justify-center bg-white hover:bg-slate-50 flex-shrink-0"
        title="Settings"
      >
        <Settings className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div
          className="absolute top-12 left-0 z-50 bg-white rounded-xl shadow-lg border border-slate-200 p-4 w-56"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Color Format
              </span>
              <div className="mt-2 flex rounded-lg border border-slate-200 overflow-hidden">
                {colorFormats.map((format) => (
                  <button
                    key={format.value}
                    onClick={() => onColorFormatChange(format.value)}
                    className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
                      colorFormat === format.value
                        ? "bg-slate-800 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  SWAP^p Strength
                </span>
                <span className="text-xs font-mono text-slate-600">
                  {Math.round(gateStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(gateStrength * 100)}
                onChange={(e) => onGateStrengthChange(Number(e.target.value) / 100)}
                className="mt-2 w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-800"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-400">None</span>
                <span className="text-[10px] text-slate-400">Full</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
