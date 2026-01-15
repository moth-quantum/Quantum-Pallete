# Quantum Palette

A new take on color mixing theory that accounts for quantum effects. Quantum Palette encodes colors into quantum states and allows users to explore how quantum entanglement affects color mixing.

## The Science

Quantum Palette is based on the HSL to single-qubit encoding presented in [arXiv:2509.01442](https://arxiv.org/abs/2509.01442). Each color is mapped to a quantum state where:

- **Hue (H)** is encoded as a rotation around the Z-axis (Rz gate)
- **Lightness (L)** is encoded as a rotation around the Y-axis (Ry gate)
- **Saturation (S)** remains classical and unchanged during quantum operations

When colors are mixed, a parametric SWAP (p-SWAP) gate with angle π/10 is applied between the corresponding qubits. This creates quantum entanglement between the color states, leading to non-classical color mixing behavior that depends on the order and history of mixing operations.

## How to Use

1. **Select a Color**: Click the color picker button (top-left) to open the color selector. Choose any color by clicking on the saturation/lightness gradient and adjusting the hue slider.

2. **Add Colors to the Palette**: With a color selected, click anywhere on the canvas to create a new color splash. Each color is assigned a qubit in the quantum circuit.

3. **Mix Colors**: Click on an existing color splash to select it, then click on another color splash to mix them. This applies a p-SWAP gate between their qubits, modifying both colors based on their quantum interaction.

4. **Explore Entanglement**: Mix multiple colors in different orders to create highly entangled quantum states. Notice how the resulting colors differ from classical mixing - the order of operations matters!

5. **Remove Colors**: Drag a color splash to the trash region (bottom-right) to remove it from the palette. Note that the underlying quantum state remains unchanged.

## Deployment

Your project is live at:
**[https://vercel.com/quantumjoaos-projects/v0-quantum-pallet-app](https://vercel.com/quantumjoaos-projects/v0-quantum-pallet-app)**

## Build

Continue building on:
**[https://v0.app/chat/t9VvabRVGOU](https://v0.app/chat/t9VvabRVGOU)**
