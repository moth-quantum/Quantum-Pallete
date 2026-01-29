// Self-contained Quantum Circuit Unit Tests
// No external imports - all necessary code is included

// Simple complex number implementation
function complex(re, im = 0) {
  return { re, im }
}

function add(a, b) {
  return { re: a.re + b.re, im: a.im + b.im }
}

function multiply(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }
}

function abs(c) {
  return Math.sqrt(c.re * c.re + c.im * c.im)
}

// Quantum Circuit class
class QuantumCircuit {
  constructor(numQubits = 0) {
    this.numQubits = numQubits
    const size = Math.max(1, Math.pow(2, numQubits))
    this.statevector = Array(size)
      .fill(null)
      .map(() => complex(0, 0))
    this.statevector[0] = complex(1, 0)
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

  h(qubit) {
    const sqrt2inv = 1 / Math.sqrt(2)
    const matrix = [
      [complex(sqrt2inv, 0), complex(sqrt2inv, 0)],
      [complex(sqrt2inv, 0), complex(-sqrt2inv, 0)],
    ]
    this.applyGate(qubit, matrix)
  }

  cnot(control, target) {
    const matrix = [
      [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)],
      [complex(0, 0), complex(1, 0), complex(0, 0), complex(0, 0)],
      [complex(0, 0), complex(0, 0), complex(0, 0), complex(1, 0)],
      [complex(0, 0), complex(0, 0), complex(1, 0), complex(0, 0)],
    ]
    this.apply2QubitGate(control, target, matrix)
  }

  measureAndRemoveQubit(qubit) {
    if (this.numQubits === 0) throw new Error("Cannot measure: no qubits")
    if (qubit < 0 || qubit >= this.numQubits) throw new Error(`Invalid qubit: ${qubit}`)

    const size = Math.pow(2, this.numQubits)
    const bitPos = this.numQubits - 1 - qubit

    let prob0 = 0, prob1 = 0
    for (let i = 0; i < size; i++) {
      const prob = Math.pow(abs(this.statevector[i]), 2)
      if (((i >> bitPos) & 1) === 0) prob0 += prob
      else prob1 += prob
    }

    const outcome = Math.random() < prob0 ? 0 : 1
    const newNumQubits = this.numQubits - 1
    const newSize = Math.max(1, Math.pow(2, newNumQubits))
    const newStatevector = Array(newSize).fill(null).map(() => complex(0, 0))
    const normFactor = Math.sqrt(outcome === 0 ? prob0 : prob1)

    if (normFactor > 1e-10) {
      for (let i = 0; i < size; i++) {
        if (((i >> bitPos) & 1) !== outcome) continue
        const highBits = (i >> (bitPos + 1)) << bitPos
        const lowBits = i & ((1 << bitPos) - 1)
        const newIndex = highBits | lowBits
        const amp = this.statevector[i]
        newStatevector[newIndex] = complex(amp.re / normFactor, amp.im / normFactor)
      }
    } else {
      newStatevector[0] = complex(1, 0)
    }

    this.numQubits = newNumQubits
    this.statevector = newStatevector
    return { outcome, prob0, prob1 }
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

// Test utilities
function approxEqual(a, b, tolerance = 0.01) {
  return Math.abs(a - b) < tolerance
}

// Run tests
function runTests() {
  console.log("=== Quantum Circuit Unit Tests ===\n")

  let passed = 0
  let failed = 0

  // Test 1: Create 2 qubits, rotate with Ry, measure X,Y,Z
  console.log("Test 1: Two qubits with Ry rotations")
  try {
    const circuit = new QuantumCircuit()

    // Add first qubit and rotate by Ry(pi/2) - should point along +X axis
    circuit.addQubit()
    circuit.ry(0, Math.PI / 2)

    // Add second qubit and rotate by Ry(pi) - should point to |1> (Z = -1)
    circuit.addQubit()
    circuit.ry(1, Math.PI)

    const expectations = circuit.calculateExpectationValues()

    // Qubit 0: After Ry(pi/2), should have X=1, Y=0, Z=0
    const q0 = expectations.get(0)
    const q0XPass = approxEqual(q0.x, 1, 0.05)
    const q0YPass = approxEqual(q0.y, 0, 0.05)
    const q0ZPass = approxEqual(q0.z, 0, 0.05)

    // Qubit 1: After Ry(pi), should have X=0, Y=0, Z=-1
    const q1 = expectations.get(1)
    const q1XPass = approxEqual(q1.x, 0, 0.05)
    const q1YPass = approxEqual(q1.y, 0, 0.05)
    const q1ZPass = approxEqual(q1.z, -1, 0.05)

    console.log(`  Qubit 0: X=${q0.x.toFixed(5)}, Y=${q0.y.toFixed(5)}, Z=${q0.z.toFixed(5)}`)
    console.log(`    Expected: X=1, Y=0, Z=0`)
    console.log(`    X: ${q0XPass ? "PASS" : "FAIL"}, Y: ${q0YPass ? "PASS" : "FAIL"}, Z: ${q0ZPass ? "PASS" : "FAIL"}`)

    console.log(`  Qubit 1: X=${q1.x.toFixed(5)}, Y=${q1.y.toFixed(5)}, Z=${q1.z.toFixed(5)}`)
    console.log(`    Expected: X=0, Y=0, Z=-1`)
    console.log(`    X: ${q1XPass ? "PASS" : "FAIL"}, Y: ${q1YPass ? "PASS" : "FAIL"}, Z: ${q1ZPass ? "PASS" : "FAIL"}`)

    if (q0XPass && q0YPass && q0ZPass && q1XPass && q1YPass && q1ZPass) {
      console.log("  Test 1: PASSED\n")
      passed++
    } else {
      console.log("  Test 1: FAILED\n")
      failed++
    }
  } catch (e) {
    console.log(`  Test 1: ERROR - ${e.message}\n`)
    failed++
  }

  // Test 2: Rotate one qubit and swap, measure X,Y,Z
  console.log("Test 2: Rotate and pswap (pi)")
  try {
    const circuit = new QuantumCircuit()

    // Add two qubits
    circuit.addQubit()
    circuit.addQubit()

    // Rotate qubit 0 to |1> state
    circuit.ry(0, Math.PI)

    // Apply full swap (pswap with angle pi)
    circuit.pswap(0, 1, Math.PI)

    const expectations = circuit.calculateExpectationValues()

    // After swap: qubit 0 should be |0> (Z=1), qubit 1 should be |1> (Z=-1)
    const q0 = expectations.get(0)
    const q1 = expectations.get(1)

    const q0ZPass = approxEqual(q0.z, 1, 0.05)
    const q1ZPass = approxEqual(q1.z, -1, 0.05)

    console.log(`  Qubit 0: X=${q0.x.toFixed(3)}, Y=${q0.y.toFixed(3)}, Z=${q0.z.toFixed(3)}`)
    console.log(`    Expected: Z=1 (back to |0>)`)
    console.log(`    Z: ${q0ZPass ? "PASS" : "FAIL"}`)

    console.log(`  Qubit 1: X=${q1.x.toFixed(3)}, Y=${q1.y.toFixed(3)}, Z=${q1.z.toFixed(3)}`)
    console.log(`    Expected: Z=-1 (now |1>)`)
    console.log(`    Z: ${q1ZPass ? "PASS" : "FAIL"}`)

    if (q0ZPass && q1ZPass) {
      console.log("  Test 2: PASSED\n")
      passed++
    } else {
      console.log("  Test 2: FAILED\n")
      failed++
    }
  } catch (e) {
    console.log(`  Test 2: ERROR - ${e.message}\n`)
    failed++
  }

  console.log("Test 3: Rx(pi/3) and Rz(pi/3) on separate qubits")
  try {
    const circuit = new QuantumCircuit()

    circuit.addQubit()
    circuit.addQubit()

    // Rotate qubit 0 by Rx(pi/3) - rotates around X axis
    // Starting from |0> (Z=1), Rx(pi/3) rotates toward -Y
    // Expected: X=0, Y=-sin(pi/3)=-sqrt(3)/2, Z=cos(pi/3)=0.5
    circuit.rx(0, Math.PI / 3)

    // Rotate qubit 1 by Rz(pi/3) - rotates around Z axis
    // Starting from |0>, Rz only adds phase, state remains |0>
    // Expected: X=0, Y=0, Z=1
    circuit.rz(1, Math.PI / 3)

    const expectations = circuit.calculateExpectationValues()

    const q0 = expectations.get(0)
    const q1 = expectations.get(1)

    // Qubit 0 after Rx(pi/3): X=0, Y=-sin(pi/3), Z=cos(pi/3)
    const expectedQ0X = 0
    const expectedQ0Y = -Math.sin(Math.PI / 3) // -sqrt(3)/2 ~ -0.866
    const expectedQ0Z = Math.cos(Math.PI / 3) // 0.5

    const q0XPass = approxEqual(q0.x, expectedQ0X, 0.05)
    const q0YPass = approxEqual(q0.y, expectedQ0Y, 0.05)
    const q0ZPass = approxEqual(q0.z, expectedQ0Z, 0.05)

    // Qubit 1 after Rz(pi/3): stays at |0>, so X=0, Y=0, Z=1
    const q1XPass = approxEqual(q1.x, 0, 0.05)
    const q1YPass = approxEqual(q1.y, 0, 0.05)
    const q1ZPass = approxEqual(q1.z, 1, 0.05)

    console.log(`  Qubit 0 (Rx pi/3): X=${q0.x.toFixed(3)}, Y=${q0.y.toFixed(3)}, Z=${q0.z.toFixed(3)}`)
    console.log(`    Expected: X=${expectedQ0X.toFixed(3)}, Y=${expectedQ0Y.toFixed(3)}, Z=${expectedQ0Z.toFixed(3)}`)
    console.log(`    X: ${q0XPass ? "PASS" : "FAIL"}, Y: ${q0YPass ? "PASS" : "FAIL"}, Z: ${q0ZPass ? "PASS" : "FAIL"}`)

    console.log(`  Qubit 1 (Rz pi/3): X=${q1.x.toFixed(3)}, Y=${q1.y.toFixed(3)}, Z=${q1.z.toFixed(3)}`)
    console.log(`    Expected: X=0, Y=0, Z=1`)
    console.log(`    X: ${q1XPass ? "PASS" : "FAIL"}, Y: ${q1YPass ? "PASS" : "FAIL"}, Z: ${q1ZPass ? "PASS" : "FAIL"}`)

    if (q0XPass && q0YPass && q0ZPass && q1XPass && q1YPass && q1ZPass) {
      console.log("  Test 3: PASSED\n")
      passed++
    } else {
      console.log("  Test 3: FAILED\n")
      failed++
    }
  } catch (e) {
    console.log(`  Test 3: ERROR - ${e.message}\n`)
    failed++
  }

  console.log("Test 4: pswap(pi/4) partial swap")
  try {
    const circuit = new QuantumCircuit()

    circuit.addQubit()
    circuit.addQubit()

    // Put qubit 0 in |1> state
    circuit.ry(0, Math.PI)

    // Apply partial swap pswap(pi/4)
    // pswap(theta) mixes |01> and |10> with cos(theta/2) and i*sin(theta/2)
    // At theta=pi/4: cos(pi/8) ~ 0.924, sin(pi/8) ~ 0.383
    // State |10> -> cos(pi/8)|10> + i*sin(pi/8)|01>
    // So qubit 0 Z expectation: cos^2(pi/8) * (-1) + sin^2(pi/8) * 1 = -cos(pi/4) ~ -0.707
    // And qubit 1 Z expectation: cos^2(pi/8) * 1 + sin^2(pi/8) * (-1) = cos(pi/4) ~ 0.707
    circuit.pswap(0, 1, Math.PI / 4)

    const expectations = circuit.calculateExpectationValues()

    const q0 = expectations.get(0)
    const q1 = expectations.get(1)

    // Expected Z values based on partial swap
    const cos2 = Math.pow(Math.cos(Math.PI / 8), 2)
    const sin2 = Math.pow(Math.sin(Math.PI / 8), 2)
    const expectedQ0Z = -cos2 + sin2 // ~ -0.707
    const expectedQ1Z = cos2 - sin2 // ~ 0.707

    const q0ZPass = approxEqual(q0.z, expectedQ0Z, 0.05)
    const q1ZPass = approxEqual(q1.z, expectedQ1Z, 0.05)

    console.log(`  Qubit 0: X=${q0.x.toFixed(3)}, Y=${q0.y.toFixed(3)}, Z=${q0.z.toFixed(3)}`)
    console.log(`    Expected Z: ${expectedQ0Z.toFixed(3)}`)
    console.log(`    Z: ${q0ZPass ? "PASS" : "FAIL"}`)

    console.log(`  Qubit 1: X=${q1.x.toFixed(3)}, Y=${q1.y.toFixed(3)}, Z=${q1.z.toFixed(3)}`)
    console.log(`    Expected Z: ${expectedQ1Z.toFixed(3)}`)
    console.log(`    Z: ${q1ZPass ? "PASS" : "FAIL"}`)

    if (q0ZPass && q1ZPass) {
      console.log("  Test 4: PASSED\n")
      passed++
    } else {
      console.log("  Test 4: FAILED\n")
      failed++
    }
  } catch (e) {
    console.log(`  Test 4: ERROR - ${e.message}\n`)
    failed++
  }

  // Test 5: Bell State Measurement
  console.log("Test 5: Bell State Creation and Measurement")
  try {
    const numTrials = 100
    let outcome0Count = 0
    let outcome1Count = 0
    let sumZ0 = 0 // Sum of Z for remaining qubit when outcome=0
    let sumZ1 = 0 // Sum of Z for remaining qubit when outcome=1

    for (let trial = 0; trial < numTrials; trial++) {
      const circuit = new QuantumCircuit()
      circuit.addQubit()
      circuit.addQubit()
      
      // Create Bell state: H on qubit 0, then CNOT(0,1)
      circuit.h(0)
      circuit.cnot(0, 1)
      
      // Measure and remove qubit 0
      const result = circuit.measureAndRemoveQubit(0)
      
      // Get remaining qubit state
      const expectations = circuit.calculateExpectationValues()
      const remainingZ = expectations.get(0).z
      
      if (result.outcome === 0) {
        outcome0Count++
        sumZ0 += remainingZ
      } else {
        outcome1Count++
        sumZ1 += remainingZ
      }
    }

    const avgZ0 = outcome0Count > 0 ? sumZ0 / outcome0Count : 0
    const avgZ1 = outcome1Count > 0 ? sumZ1 / outcome1Count : 0
    const pct0 = (outcome0Count / numTrials) * 100
    const pct1 = (outcome1Count / numTrials) * 100

    console.log(`  Ran ${numTrials} trials of Bell state measurement`)
    console.log(`  Outcome |0⟩: ${outcome0Count} times (${pct0.toFixed(1)}%), avg remaining Z = ${avgZ0.toFixed(3)} (expected +1)`)
    console.log(`  Outcome |1⟩: ${outcome1Count} times (${pct1.toFixed(1)}%), avg remaining Z = ${avgZ1.toFixed(3)} (expected -1)`)

    // Check that probabilities are roughly 50/50 (within statistical error)
    const probPass = pct0 > 30 && pct0 < 70 // Very loose bounds for statistical test
    // Check that correlations are correct
    const corrPass = avgZ0 > 0.9 && avgZ1 < -0.9

    if (probPass && corrPass) {
      console.log("  Test 5: PASSED\n")
      passed++
    } else {
      console.log("  Test 5: FAILED (correlations may be wrong)\n")
      failed++
    }
  } catch (e) {
    console.log(`  Test 5: ERROR - ${e.message}\n`)
    failed++
  }

  console.log("=== Summary ===")
  console.log(`Passed: ${passed}, Failed: ${failed}`)

  return { passed, failed }
}

runTests()
