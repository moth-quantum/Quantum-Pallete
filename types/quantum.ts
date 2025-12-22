export type HSL = [number, number, number] // [h, s, l] all in range [0, 1]

export interface Cor {
  id: string
  color: HSL
  qubit: number
  x: number
  y: number
}
