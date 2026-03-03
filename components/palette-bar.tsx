"use client"
import type { Cor, HSL, ColorFormat } from "@/types/quantum"
import { hslToRgbString, hslToHex } from "@/utils/quantum-circuit"

interface PaletteBarProps {
  palette: Record<string, HSL>
  cors: Cor[]
  colorFormat: ColorFormat
}

function formatColor(hsl: HSL, format: ColorFormat): string {
  const [h, s, l] = hsl
  switch (format) {
    case "hsl":
      return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
    case "rgb":
      return hslToRgbString(hsl)
    case "hex":
      return hslToHex(hsl)
  }
}

export function PaletteBar({ palette, cors, colorFormat }: PaletteBarProps) {
  return (
    <div className="w-full h-full flex flex-wrap items-center gap-3 overflow-y-auto px-2">
      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Palette:</span>
      <div className="flex flex-wrap gap-2 items-center">
        {cors.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No colors in palette yet</span>
        ) : (
          cors.map((cor) => (
            <div key={cor.id} className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1 whitespace-nowrap">
              <div
                className="w-5 h-5 rounded border border-slate-300"
                style={{ backgroundColor: hslToRgbString(cor.color) }}
              ></div>
              <span className="text-xs text-slate-600 font-mono">{formatColor(cor.color, colorFormat)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
