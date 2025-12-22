import { complex, add, multiply, abs, pi, type Complex } from "mathjs"
import type { HSL } from "@/types/quantum"

export class QuantumCircuit {
  numQubits: number
  statevector: Complex[]

  constructor(numQubits = 0) {
    this.numQubits = numQubits
    const size = Math.max(1, Math.pow(2, numQubits))
    this.statevector = Array(size)
      .fill(null)
      .map(() => complex(0, 0))
    this.statevector[0] = complex(1, 0)
  }

  getNumQubits(): number {
    return this.numQubits
  }

  addQubit() {
    const newQubit = this.numQubits
    this.numQubits++
    const newSize = Math.pow(2, this.numQubits)
    const newStatevector = Array(newSize)
      .fill(null)
      .map(() => complex(0, 0))

    for (let i = 0; i < this.statevector.length; i++) {
      newStatevector[i * 2] = this.statevector[i]
    }

    this.statevector = newStatevector
    return newQubit
  }

  getMatrix(gate, theta) {
    if (gate === "rx") {
      const c = Math.cos(theta / 2)
      const s = Math.sin(theta / 2)
      return [
        [complex(c, 0), complex(0, -s)],
        [complex(0, -s), complex(c, 0)],
      ]
    } else if (gate === "ry") {
      const c = Math.cos(theta / 2)
      const s = Math.sin(theta / 2)
      return [
        [complex(c, 0), complex(-s, 0)],
        [complex(s, 0), complex(c, 0)],
      ]
    } else if (gate === "rz") {
      const c = Math.cos(theta / 2)
      const s = Math.sin(theta / 2)
      return [
        [complex(c, -s), complex(0, 0)],
        [complex(0, 0), complex(c, s)],
      ]
    } else if (gate === "x") {
      return [
        [complex(0, 0), complex(1, 0)],
        [complex(1, 0), complex(0, 0)],
      ]
    }
    throw new Error(`Unknown gate: ${gate}`)
  }

  applyGate(qubit, matrix) {
    const size = Math.pow(2, this.numQubits)
    const newStatevector = Array(size)
      .fill(null)
      .map(() => complex(0, 0))

    // The bit position for this qubit (big-endian: qubit 0 is MSB)
    const bitPos = this.numQubits - 1 - qubit

    // Iterate through pairs of indices that differ only at bitPos
    for (let i = 0; i < size; i++) {
      // Only process when the bit at bitPos is 0 to avoid double-processing
      if ((i >> bitPos) & 1) continue

      const i0 = i // index with bit=0 at bitPos
      const i1 = i | (1 << bitPos) // index with bit=1 at bitPos

      const amp0 = this.statevector[i0]
      const amp1 = this.statevector[i1]

      // Apply 2x2 matrix: [new0, new1] = matrix * [amp0, amp1]
      newStatevector[i0] = add(multiply(matrix[0][0], amp0), multiply(matrix[0][1], amp1))
      newStatevector[i1] = add(multiply(matrix[1][0], amp0), multiply(matrix[1][1], amp1))
    }

    this.statevector = newStatevector
  }

  apply2QubitGate(qubit1, qubit2, matrix) {
    const size = Math.pow(2, this.numQubits)
    const newStatevector = Array(size)
      .fill(null)
      .map(() => complex(0, 0))

    const bitPos1 = this.numQubits - 1 - qubit1
    const bitPos2 = this.numQubits - 1 - qubit2

    // Process each basis state
    for (let i = 0; i < size; i++) {
      const bit1 = (i >> bitPos1) & 1
      const bit2 = (i >> bitPos2) & 1
      const inputState = bit1 * 2 + bit2

      // For each output state
      for (let outputState = 0; outputState < 4; outputState++) {
        const outBit1 = (outputState >> 1) & 1
        const outBit2 = outputState & 1

        // Compute the output index by flipping bits as needed
        let outIndex = i
        outIndex = (outIndex & ~(1 << bitPos1)) | (outBit1 << bitPos1)
        outIndex = (outIndex & ~(1 << bitPos2)) | (outBit2 << bitPos2)

        const matrixElement = matrix[outputState][inputState]
        const product = multiply(matrixElement, this.statevector[i])
        newStatevector[outIndex] = add(newStatevector[outIndex], product)
      }
    }

    this.statevector = newStatevector
  }

  rx(qubit, theta) {
    this.applyGate(qubit, this.getMatrix("rx", theta))
  }

  ry(qubit, theta) {
    this.applyGate(qubit, this.getMatrix("ry", theta))
  }

  rz(qubit, theta) {
    this.applyGate(qubit, this.getMatrix("rz", theta))
  }

  x(qubit) {
    this.applyGate(qubit, this.getMatrix("x", 0))
  }

  pswap(qubit1, qubit2, theta) {
    const c = Math.cos(theta / 2)
    const s = Math.sin(theta / 2)

    // pswap matrix: swaps |01> <-> |10> with phase
    const matrix = [
      [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)], // |00> -> |00>
      [complex(0, 0), complex(c, 0), complex(0, s), complex(0, 0)], // |01> -> c|01> + is|10>
      [complex(0, 0), complex(0, s), complex(c, 0), complex(0, 0)], // |10> -> is|01> + c|10>
      [complex(0, 0), complex(0, 0), complex(0, 0), complex(1, 0)], // |11> -> |11>
    ]

    this.apply2QubitGate(qubit1, qubit2, matrix)
  }

  copy() {
    const copied = new QuantumCircuit(0)
    copied.numQubits = this.numQubits
    copied.statevector = this.statevector.map((c) => complex(c.re, c.im))
    return copied
  }

  getStatevector() {
    return this.statevector.map((c) => complex(c.re, c.im))
  }

  measureExpectations(statevector) {
    const size = Math.pow(2, this.numQubits)
    const expectations = new Array(this.numQubits).fill(0)

    for (let i = 0; i < size; i++) {
      const amplitude = statevector[i]
      const prob = Math.pow(abs(amplitude), 2)
      for (let qubit = 0; qubit < this.numQubits; qubit++) {
        const bitPos = this.numQubits - 1 - qubit
        const bitAtQubit = (i >> bitPos) & 1
        expectations[qubit] += bitAtQubit === 0 ? prob : -prob
      }
    }

    return expectations
  }

  calculateExpectationValues() {
    const expectationValues = new Map()

    if (this.numQubits === 0) return expectationValues

    const bases = [
      { name: "z", gate: null, angle: 0 },
      { name: "x", gate: "ry", angle: -Math.PI / 2 },
      { name: "y", gate: "rx", angle: Math.PI / 2 },
    ]

    const allExpectations = { z: [], x: [], y: [] }

    for (const basis of bases) {
      let statevectorToMeasure

      if (basis.gate === null) {
        statevectorToMeasure = this.statevector
      } else {
        const circuitCopy = this.copy()
        for (let qubit = 0; qubit < this.numQubits; qubit++) {
          if (basis.gate === "ry") {
            circuitCopy.ry(qubit, basis.angle)
          } else if (basis.gate === "rx") {
            circuitCopy.rx(qubit, basis.angle)
          }
        }
        statevectorToMeasure = circuitCopy.getStatevector()
      }

      allExpectations[basis.name] = this.measureExpectations(statevectorToMeasure)
    }

    for (let qubit = 0; qubit < this.numQubits; qubit++) {
      expectationValues.set(qubit, {
        x: allExpectations.x[qubit],
        y: allExpectations.y[qubit],
        z: allExpectations.z[qubit],
      })
    }

    return expectationValues
  }
}

// Convert HSL to RGB string (only for display)
export function hslToRgbString(hsl: HSL): string {
  const [h, s, l] = hsl
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const red = Math.round(Math.max(0, Math.min(1, r)) * 255)
  const green = Math.round(Math.max(0, Math.min(1, g)) * 255)
  const blue = Math.round(Math.max(0, Math.min(1, b)) * 255)

  return `rgb(${red}, ${green}, ${blue})`
}

// Convert HSL to gate angles
export function hslToAngles(hsl: HSL): { ryAngle: number; rzAngle: number } {
  const [h, , l] = hsl
  return {
    ryAngle: (pi as number) * l,
    rzAngle: 2 * (pi as number) * h,
  }
}

// Convert hex to HSL
export function hexToHsl(hex: string): HSL {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [0, 0, 0.5]

  const r = Number.parseInt(result[1], 16) / 255
  const g = Number.parseInt(result[2], 16) / 255
  const b = Number.parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return [h, s, l]
}

// Convert expectation values to HSL
export function expectationValuesToHsl(ex: number, ey: number, ez: number, saturation: number): HSL {
  const x = typeof ex === "number" && !isNaN(ex) ? ex : 0
  const y = typeof ey === "number" && !isNaN(ey) ? ey : 0
  const z = typeof ez === "number" && !isNaN(ez) ? ez : 1

  // H = arctan(Y/X) / (2*pi)
  const h = Math.atan2(y, x) / (2 * Math.PI)

  // L = arctan(sqrt(X^2 + Y^2) / Z) / pi
  const l = Math.atan2(Math.sqrt(x * x + y * y), z) / Math.PI

  // Normalize hue to [0, 1]
  const hNormalized = ((h % 1) + 1) % 1
  const lClamped = Math.max(0, Math.min(1, l))

  return [hNormalized, saturation, lClamped]
}
