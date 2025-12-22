"use client"
import type { Cor, HSL } from "@/types/quantum"
import { hslToRgbString } from "@/utils/quantum-circuit"

interface PaletteBarProps {
  palette: Record<string, HSL>
  cors: Cor[]
}

function formatHsl(hsl: HSL): string {
  const [h, s, l] = hsl
  return `hsl(${Math.round(h * 360)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

export function PaletteBar({ palette, cors }: PaletteBarProps) {
  return (
    <div className="w-full h-full flex items-center gap-3 overflow-x-auto px-2">
      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Palette:</span>
      <div className="flex gap-2 items-center">
        {cors.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No colors in palette yet</span>
        ) : (
          cors.map((cor) => (
            <div key={cor.id} className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1 whitespace-nowrap">
              <div
                className="w-5 h-5 rounded border border-slate-300"
                style={{ backgroundColor: hslToRgbString(cor.color) }}
              ></div>
              <span className="text-xs text-slate-600 font-mono">{formatHsl(cor.color)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
