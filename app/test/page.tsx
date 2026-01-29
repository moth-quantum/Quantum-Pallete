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

interface BellTestResult {
  outcome: 0 | 1
  prob0: number
  prob1: number
  remainingQubitState: {
    x: number
    y: number
    z: number
  }
}

export default function TestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [hasRun, setHasRun] = useState(false)
  const [bellTestResults, setBellTestResults] = useState<BellTestResult[]>([])
  const [bellTestStats, setBellTestStats] = useState<{
    total: number
    outcome0Count: number
    outcome1Count: number
    avgZ0: number
    avgZ1: number
  } | null>(null)

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

  /**
   * Run multiple Bell state experiments:
   * 1. Create Bell state: |Φ+⟩ = (|00⟩ + |11⟩)/√2
   * 2. Measure qubit 0 (collapse the wavefunction)
   * 3. Check the state of the remaining qubit 1
   * 
   * Expected behavior:
   * - P(0) = P(1) = 0.5 for the first qubit
   * - If outcome = 0, remaining qubit should be |0⟩ (Z = +1)
   * - If outcome = 1, remaining qubit should be |1⟩ (Z = -1)
   */
  const runBellTest = (numTrials = 20) => {
    const results: BellTestResult[] = []
    
    for (let i = 0; i < numTrials; i++) {
      // Create a fresh circuit
      const circuit = new QuantumCircuit()
      
      // Add two qubits (both start in |0⟩)
      circuit.addQubit() // qubit 0
      circuit.addQubit() // qubit 1
      
      // Create Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2
      // Step 1: Apply Hadamard to qubit 0
      circuit.h(0)
      // Step 2: Apply CNOT with qubit 0 as control, qubit 1 as target
      circuit.cnot(0, 1)
      
      // Measure and remove qubit 0
      const measurement = circuit.measureAndRemoveQubit(0)
      
      // Get the state of the remaining qubit (now at index 0 after removal)
      const expectations = circuit.calculateExpectationValues()
      const remainingState = expectations.get(0)!
      
      results.push({
        outcome: measurement.outcome,
        prob0: measurement.prob0,
        prob1: measurement.prob1,
        remainingQubitState: remainingState,
      })
    }
    
    // Calculate statistics
    const outcome0Results = results.filter(r => r.outcome === 0)
    const outcome1Results = results.filter(r => r.outcome === 1)
    
    const avgZ0 = outcome0Results.length > 0 
      ? outcome0Results.reduce((sum, r) => sum + r.remainingQubitState.z, 0) / outcome0Results.length
      : 0
    const avgZ1 = outcome1Results.length > 0
      ? outcome1Results.reduce((sum, r) => sum + r.remainingQubitState.z, 0) / outcome1Results.length
      : 0
    
    setBellTestResults(results)
    setBellTestStats({
      total: numTrials,
      outcome0Count: outcome0Results.length,
      outcome1Count: outcome1Results.length,
      avgZ0,
      avgZ1,
    })
  }

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Quantum Circuit Unit Tests</h1>

        <div className="flex gap-4 mb-6">
          <button onClick={runTests} className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90">
            Run Unit Tests
          </button>
          <button 
            onClick={() => runBellTest(20)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Run Bell State Test (20 trials)
          </button>
        </div>

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

        {/* Bell State Test Results */}
        {bellTestStats && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Bell State Measurement Test</h2>
            
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Test:</strong> Create Bell state |Phi+⟩ = (|00⟩ + |11⟩)/sqrt(2), measure qubit 0, observe qubit 1
              </p>
              <p className="text-sm text-blue-800">
                <strong>Expected:</strong> When measuring qubit 0, P(0)=P(1)=50%. After collapse, 
                qubit 1 should be |0⟩ (Z=+1) if outcome=0, or |1⟩ (Z=-1) if outcome=1.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h3 className="font-semibold text-green-800">Outcome |0⟩</h3>
                <p className="text-2xl font-mono text-green-700">{bellTestStats.outcome0Count} / {bellTestStats.total}</p>
                <p className="text-sm text-green-600">({((bellTestStats.outcome0Count / bellTestStats.total) * 100).toFixed(1)}%)</p>
                <p className="text-sm text-green-700 mt-2">
                  Avg Z of remaining qubit: <span className="font-mono">{bellTestStats.avgZ0.toFixed(3)}</span>
                </p>
                <p className="text-xs text-green-600">(Expected: +1.000)</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <h3 className="font-semibold text-red-800">Outcome |1⟩</h3>
                <p className="text-2xl font-mono text-red-700">{bellTestStats.outcome1Count} / {bellTestStats.total}</p>
                <p className="text-sm text-red-600">({((bellTestStats.outcome1Count / bellTestStats.total) * 100).toFixed(1)}%)</p>
                <p className="text-sm text-red-700 mt-2">
                  Avg Z of remaining qubit: <span className="font-mono">{bellTestStats.avgZ1.toFixed(3)}</span>
                </p>
                <p className="text-xs text-red-600">(Expected: -1.000)</p>
              </div>
            </div>

            {/* Bloch sphere visualization */}
            <h3 className="font-semibold mb-3">Remaining Qubit States on Bloch Sphere (Z axis projection)</h3>
            <div className="relative h-64 bg-slate-100 rounded-lg border overflow-hidden">
              {/* Z axis */}
              <div className="absolute left-1/2 top-4 bottom-4 w-px bg-slate-300" />
              <div className="absolute left-1/2 top-2 -translate-x-1/2 text-xs text-slate-500">|0⟩ (Z=+1)</div>
              <div className="absolute left-1/2 bottom-2 -translate-x-1/2 text-xs text-slate-500">|1⟩ (Z=-1)</div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-slate-400">Z=0</div>
              
              {/* Plot points */}
              {bellTestResults.map((result, i) => {
                // Map Z from [-1, 1] to vertical position
                const yPercent = 50 - (result.remainingQubitState.z * 40) // Z=+1 at top, Z=-1 at bottom
                const xOffset = (i % 10) * 20 - 90 // Spread horizontally
                return (
                  <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full border-2 ${
                      result.outcome === 0 
                        ? "bg-green-400 border-green-600" 
                        : "bg-red-400 border-red-600"
                    }`}
                    style={{
                      left: `calc(50% + ${xOffset}px)`,
                      top: `${yPercent}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    title={`Trial ${i + 1}: outcome=${result.outcome}, Z=${result.remainingQubitState.z.toFixed(3)}`}
                  />
                )
              })}
            </div>

            {/* Individual trial details */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800">
                Show individual trial results
              </summary>
              <div className="mt-2 max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-2 py-1 text-left">Trial</th>
                      <th className="px-2 py-1 text-left">P(0)</th>
                      <th className="px-2 py-1 text-left">P(1)</th>
                      <th className="px-2 py-1 text-left">Outcome</th>
                      <th className="px-2 py-1 text-left">Remaining X</th>
                      <th className="px-2 py-1 text-left">Remaining Y</th>
                      <th className="px-2 py-1 text-left">Remaining Z</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bellTestResults.map((result, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-2 py-1">{i + 1}</td>
                        <td className="px-2 py-1 font-mono">{(result.prob0 * 100).toFixed(1)}%</td>
                        <td className="px-2 py-1 font-mono">{(result.prob1 * 100).toFixed(1)}%</td>
                        <td className="px-2 py-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            result.outcome === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            |{result.outcome}⟩
                          </span>
                        </td>
                        <td className="px-2 py-1 font-mono">{result.remainingQubitState.x.toFixed(3)}</td>
                        <td className="px-2 py-1 font-mono">{result.remainingQubitState.y.toFixed(3)}</td>
                        <td className="px-2 py-1 font-mono">{result.remainingQubitState.z.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
