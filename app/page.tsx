"use client"

import { useState, useRef, useEffect } from "react"
import { HelpCircle } from "lucide-react"
import { Canvas } from "@/components/canvas"
import { ColorPicker } from "@/components/color-picker"
import { PaletteBar } from "@/components/palette-bar"
import { TutorialModal } from "@/components/tutorial-modal"
import { useQuantumState } from "@/hooks/use-quantum-state"
import { useSelectionState } from "@/hooks/use-selection-state"
import { useCorPosition } from "@/hooks/use-cor-position"
import { useQubitManager } from "@/hooks/use-qubit-manager"
import type { Cor } from "@/types/quantum"
import { hslToRgbString } from "@/utils/quantum-circuit"

export default function Page() {
  const { requestQubit, error: qubitError, clearError } = useQubitManager(10)
  const { cors, setCors, palette, createCor, mixCors, removeCor } = useQuantumState(requestQubit)
  const { selectedColor, selectColor, deselectColor } = useSelectionState()
  const { updateCorPosition } = useCorPosition(cors, setCors)

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [firstSelectedCor, setFirstSelectedCor] = useState<Cor | null>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowTutorial(true)
  }, [])

  const handleCorClick = (cor: Cor) => {
    if (firstSelectedCor && firstSelectedCor.id !== cor.id) {
      mixCors(firstSelectedCor.qubit, cor.qubit)
      setFirstSelectedCor(null)
      deselectColor()
    } else {
      selectColor(cor.color)
      setFirstSelectedCor(cor)
    }
  }

  const handleTrashDrop = (corId: string) => {
    removeCor(corId)
    deselectColor()
    setFirstSelectedCor(null)
  }

  return (
    <div className="w-screen h-screen bg-slate-700 flex flex-col p-4 overflow-hidden">
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="h-16 flex items-center gap-4 px-4 border-b border-slate-100 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowColorPicker(!showColorPicker)
            }}
            className="w-8 h-8 rounded-full border-2 border-slate-300 hover:border-slate-500 transition-colors flex items-center justify-center bg-white hover:bg-slate-50 relative flex-shrink-0"
            title="Color Picker"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400"></div>

            {showColorPicker && (
              <div
                ref={colorPickerRef}
                className="absolute top-12 left-0 z-50 bg-white rounded-2xl shadow-lg border border-slate-200 p-4"
                style={{ width: "calc(25vw)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <ColorPicker
                  onColorSelect={(color) => {
                    selectColor(color)
                  }}
                />
              </div>
            )}
          </button>

          <button
            onClick={() => setShowTutorial(true)}
            className="w-8 h-8 rounded-full border-2 border-slate-300 hover:border-slate-500 transition-colors flex items-center justify-center bg-white hover:bg-slate-50 flex-shrink-0"
            title="How to use"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
          </button>

          {selectedColor && (
            <div
              className="w-10 h-10 rounded-full border-2 border-slate-300 shadow-md flex-shrink-0"
              style={{ backgroundColor: hslToRgbString(selectedColor) }}
              title={`Selected: hsl(${Math.round(selectedColor[0] * 360)}°, ${Math.round(selectedColor[1] * 100)}%, ${Math.round(selectedColor[2] * 100)}%)`}
            ></div>
          )}

          <span className="text-sm text-slate-500 ml-auto">Quantum Palette</span>
        </div>

        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 to-white">
          <Canvas
            cors={cors}
            selectedColor={selectedColor}
            onCanvasClick={(pos) => {
              if (selectedColor) {
                createCor(pos, selectedColor)
                deselectColor()
                setFirstSelectedCor(null)
              }
            }}
            onCorClick={handleCorClick}
            onCorDrag={(corId, pos) => updateCorPosition(corId, pos)}
            onTrashClick={deselectColor}
            onTrashDrop={handleTrashDrop}
          />
        </div>

        {qubitError && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm font-medium flex-shrink-0">
            {qubitError}
          </div>
        )}

        <div className="h-24 border-t border-slate-100 bg-white rounded-b-3xl p-3 overflow-y-auto flex-shrink-0">
          <PaletteBar palette={palette} cors={cors} />
        </div>
      </div>
    </div>
  )
}
