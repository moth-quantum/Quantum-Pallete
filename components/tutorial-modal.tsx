"use client"

import { X } from "lucide-react"

interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-slate-800">Welcome to Quantum Palette</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <p className="text-slate-600 leading-relaxed">
            Quantum Palette is a new take on color mixing that uses quantum mechanics. Each color you create is encoded
            into a quantum state, and mixing colors creates quantum entanglement between them.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400 flex-shrink-0 flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Select a Color</h3>
                <p className="text-slate-600 text-sm">
                  Click the color picker button in the top-left corner. Use the gradient area to choose saturation and
                  lightness, and the slider below to select the hue.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex-shrink-0 flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Drop Colors on the Canvas</h3>
                <p className="text-slate-600 text-sm">
                  With a color selected, click anywhere on the canvas to create a color splash. Each color is assigned a
                  qubit in the quantum circuit. You can add up to 10 colors.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0 flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Mix Colors Quantum-Style</h3>
                <p className="text-slate-600 text-sm">
                  Click on one color splash, then click on another to mix them. This applies a quantum p-SWAP gate,
                  entangling the two colors. Notice how both colors change!
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-400 flex-shrink-0 flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Explore Entanglement</h3>
                <p className="text-slate-600 text-sm">
                  Mix many colors in different orders to create a highly entangled quantum state. The resulting palette
                  will be unique to your mixing history. Unlike classical mixing, the order matters!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="font-semibold text-slate-700 mb-2">The Science</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Based on the HSL to single-qubit encoding from{" "}
              <a
                href="https://arxiv.org/abs/2509.01442"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                arXiv:2509.01442
              </a>
              . Hue and Lightness are encoded as quantum rotations (Rz and Ry gates), while Saturation remains
              classical. Mixing applies a parametric SWAP gate that creates entanglement between color qubits.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-colors"
          >
            Start Creating
          </button>
        </div>
      </div>
    </div>
  )
}
