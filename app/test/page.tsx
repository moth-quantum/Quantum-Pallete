"use client"

import { useState } from "react"
import { QuantumCircuit } from "@/utils/quantum-circuit"

function approxEqual(a: number, b: number, tolerance = 0.1): boolean {
  return Math.abs(a - b) < tolerance
}

interface TestResult {
  name: string
  passed: boolean
  details: string[]
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [hasRun, setHasRun] = useState(false)

  const runTests = () => {
    const testResults: TestResult[] = []

    // Test 1: Create 2 qubits, rotate with Ry, measure X,Y,Z
    try {
      const circuit = new QuantumCircuit()
      circuit.addQubit()
      circuit.ry(0, Math.PI / 2)
      circuit.addQubit()
      circuit.ry(1, Math.PI)

      const expectations = circuit.calculateExpectationValues()
      const q0 = expectations.get(0)!
      const q1 = expectations.get(1)!

      const details: string[] = []
      details.push(`Qubit 0: X=${q0.x.toFixed(3)}, Y=${q0.y.toFixed(3)}, Z=${q0.z.toFixed(3)}`)
      details.push(`  Expected: X≈1, Y≈0, Z≈0`)
      details.push(`Qubit 1: X=${q1.x.toFixed(3)}, Y=${q1.y.toFixed(3)}, Z=${q1.z.toFixed(3)}`)
      details.push(`  Expected: X≈0, Y≈0, Z≈-1`)

      const passed =
        approxEqual(q0.x, 1) &&
        approxEqual(q0.y, 0) &&
        approxEqual(q0.z, 0) &&
        approxEqual(q1.x, 0) &&
        approxEqual(q1.y, 0) &&
        approxEqual(q1.z, -1)

      testResults.push({ name: "Test 1: Two qubits with Ry rotations", passed, details })
    } catch (e) {
      testResults.push({ name: "Test 1: Two qubits with Ry rotations", passed: false, details: [`Error: ${e}`] })
    }

    // Test 2: Rotate one qubit and swap, measure X,Y,Z
    try {
      const circuit = new QuantumCircuit()
      circuit.addQubit()
      circuit.addQubit()
      circuit.ry(0, Math.PI)
      circuit.pswap(0, 1, Math.PI)

      const expectations = circuit.calculateExpectationValues()
      const q0 = expectations.get(0)!
      const q1 = expectations.get(1)!

      const details: string[] = []
      details.push(`Qubit 0: X=${q0.x.toFixed(3)}, Y=${q0.y.toFixed(3)}, Z=${q0.z.toFixed(3)}`)
      details.push(`  Expected: Z≈1 (back to |0⟩)`)
      details.push(`Qubit 1: X=${q1.x.toFixed(3)}, Y=${q1.y.toFixed(3)}, Z=${q1.z.toFixed(3)}`)
      details.push(`  Expected: Z≈-1 (now |1⟩)`)

      const passed = approxEqual(q0.z, 1) && approxEqual(q1.z, -1)

      testResults.push({ name: "Test 2: Rotate and pswap", passed, details })
    } catch (e) {
      testResults.push({ name: "Test 2: Rotate and pswap", passed: false, details: [`Error: ${e}`] })
    }

    setResults(testResults)
    setHasRun(true)
  }

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Quantum Circuit Unit Tests</h1>

        <button onClick={runTests} className="px-4 py-2 bg-foreground text-background rounded-lg mb-6 hover:opacity-90">
          Run Tests
        </button>

        {hasRun && (
          <>
            <div className="mb-6 p-4 rounded-lg bg-muted">
              <span className="font-semibold">Summary: </span>
              <span className="text-green-600">{passedCount} passed</span>
              {failedCount > 0 && <span className="text-red-600">, {failedCount} failed</span>}
            </div>

            <div className="space-y-4">
              {results.map((result, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    result.passed ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-semibold ${result.passed ? "text-green-700" : "text-red-700"}`}>
                      {result.passed ? "✓" : "✗"} {result.name}
                    </span>
                  </div>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                    {result.details.join("\n")}
                  </pre>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
