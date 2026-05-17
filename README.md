# Roblox UI Motion Studio

A web-based visual animation editor designed for Roblox developers to replace manual TweenService scripting with a full visual workflow.

It combines a Figma/After Effects-like experience with a Roblox-accurate UI rendering engine and a Luau code compiler.

---

## Core Concept

Instead of writing complex TweenService logic manually, developers:

1. Build UI structure visually
2. Animate it on a timeline
3. Preview Roblox-accurate playback at 60 FPS
4. Export optimized Luau code instantly

---

## System Overview

### 1. UI Hierarchy (Explorer System)
A Roblox Studio-style tree editor for UI objects.

- Create Frames, Buttons, TextLabels, Icons
- Nest elements hierarchically
- Control inheritance of animations (parent → child propagation)
- Independent or grouped animation behaviors

---

### 2. Preview Engine (60 FPS Simulation Canvas)

A custom React-based renderer that replicates Roblox UI behavior:

- AnchorPoint-based positioning
- Scale + Offset resolution system
- Real-time animation playback
- Frame-accurate simulation loop

This ensures exported animations behave identically in Roblox Studio.

---

### 3. Multi-Lane Timeline Sequencer

A professional animation timeline inspired by video editing software.

Supports:

- Multi-object animation lanes
- Keyframe dragging and snapping
- Staggered animation sequencing
- Property tracks:
  - Position
  - Size
  - Rotation
  - Transparency
  - BackgroundColor
  - BorderColor
  - TextSize
  - TextTransparency

---

### 4. Advanced Easing System

Supports Roblox easing styles:

- Quad, Cubic, Quint
- Bounce, Elastic, Back, Sine

Extended feature:

- Cubic Bézier Curve Editor
  - Custom velocity shaping
  - Fine-grained motion control beyond Roblox defaults

---

### 5. Target Inspector Panel

Precision control system for animation data:

- Define initial UI state
- Edit keyframe-level values
- Direct numeric control over all animation parameters
- Property validation aligned with Roblox constraints

---

### 6. Luau Code Compiler (Exporter)

The core compiler translates timeline data into optimized Roblox scripts.

It performs:

- TweenInfo synthesis
- Keyframe interpolation resolution
- Animation grouping optimization
- Clean Luau generation

### Export formats:
- LocalScript
- Reusable function
- ModuleScript

Output is production-ready for Roblox Studio with no manual edits required.

---

## Output Example

The compiler generates:

- TweenService setup
- Clean animation loops
- Optimized property transitions
- Structured reusable code blocks

---

## Vision

This tool acts as a bridge between:

- UI/UX design tools (Figma, After Effects)
- Game engine scripting (Roblox Studio)

It removes repetitive animation coding and replaces it with deterministic visual authoring.

---

## Future Extensions

- Roblox Studio plugin sync
- Cloud animation storage
- Collaboration mode (multi-user timelines)
- Marketplace for animation presets
- Real-time Roblox live preview integration
