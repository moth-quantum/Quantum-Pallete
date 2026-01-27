"use client"

import { useState, useRef, useEffect } from "react"
import { HelpCircle } from "lucide-react"
import { Canvas } from "@/components/canvas"
import { ColorPicker } from "@/components/color-picker"
import { PaletteBar } from "@/components/palette-bar"
import { TutorialModal } from "@/components/tutorial-modal"
import { useQuantumState } from "@/hooks/use-quantum-state"
import { useSelectionState } from "@/hooks/use-selection-state"
import { useQubitManager } from "@/hooks/use-qubit-manager"
import type { Cor } from "@/types/quantum"
import { hslToRgbString } from "@/utils/quantum-circuit"

export default function Page() {
  const { requestQubit, releaseQubit, error: qubitError, clearError } = useQubitManager(10)
  const { cors, setCors, palette, createCor, mixCors, removeCor, lastMeasurement } = useQuantumState(requestQubit, releaseQubit)
  const { selectedColor, selectColor, deselectColor } = useSelectionState()

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [firstSelectedCor, setFirstSelectedCor] = useState<Cor | null>(null)
  const [measurementToast, setMeasurementToast] = useState<{
    outcome: 0 | 1
    prob0: number
    prob1: number
  } | null>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowTutorial(true)
  }, [])

  // Show measurement toast when a measurement occurs
  useEffect(() => {
    if (lastMeasurement) {
      setMeasurementToast({
        outcome: lastMeasurement.outcome,
        prob0: lastMeasurement.prob0,
        prob1: lastMeasurement.prob1,
      })
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setMeasurementToast(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [lastMeasurement])

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
            onTrashClick={deselectColor}
            onTrashDrop={handleTrashDrop}
          />
          
          {/* Measurement Toast */}
          {measurementToast && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-mono font-bold">
                  M = |{measurementToast.outcome}&#x27E9;
                </div>
                <div className="text-sm text-slate-300 border-l border-slate-600 pl-4">
                  <div>P(0) = {(measurementToast.prob0 * 100).toFixed(1)}%</div>
                  <div>P(1) = {(measurementToast.prob1 * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-2 text-center">
                Wavefunction collapsed
              </div>
            </div>
          )}
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
