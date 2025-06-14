# Animation Implementation Guide for Algorithm2

This document describes how to add morphing animations to the Algorithm2 static logo generator.

## Overview

The original Algorithm2 generates static algorithmic logos using Trianglify and Blobs. This implementation adds smooth morphing animations between different seeds, creating a living, breathing effect.

## Key Animation Concepts

### 1. Morphing State Management

Instead of generating a single static image, maintain two states:
- **From State**: The current visible state (triangles and blob path)
- **To State**: The target state to morph into
- **Progress**: A value from 0 to 1 indicating morph completion

```typescript
interface MorphState {
  fromTriangles: Triangle[];
  toTriangles: Triangle[];
  fromBlobPath: string;
  toBlobPath: string;
  progress: number;
}
```

### 2. Continuous Seed Generation

- Generate new seeds automatically every N seconds (e.g., 4 seconds)
- When morph completes, the "to" state becomes the new "from" state
- Generate a new "to" state with a fresh seed

### 3. Interpolation Techniques

#### Triangle Interpolation
- Interpolate each vertex position linearly
- Interpolate colors in HSL color space for smooth transitions
- Maintain triangle count consistency between states

#### Path Interpolation
- Extract numeric values from SVG path strings
- Interpolate each number individually
- Reconstruct the path with interpolated values

#### Color Interpolation
- Parse HSL values from color strings
- Interpolate H, S, L components separately
- This prevents muddy colors during transitions

### 4. Easing Functions

Use sine-based easing for natural, breathing-like motion:
```typescript
easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}
```

This creates:
- Slow start and end
- Smooth acceleration/deceleration
- Natural, organic feel

## Implementation Steps

### Step 1: Modify Data Structures

1. Keep the existing Triangulation and Blob generation logic
2. Store generated results in state objects instead of directly rendering
3. Add interpolation methods for triangles and paths

### Step 2: Animation Loop

```typescript
private animate(): void {
  // Calculate progress
  const elapsed = currentTime - lastMorphTime;
  const rawProgress = elapsed / morphDuration;
  
  if (rawProgress >= 1) {
    // Start new morph cycle
    morphState.fromTriangles = morphState.toTriangles;
    morphState.fromBlobPath = morphState.toBlobPath;
    morphState.toTriangles = createTriangles(newSeed);
    morphState.toBlobPath = createBlobPath(newSeed);
    morphState.progress = 0;
    lastMorphTime = currentTime;
  } else {
    // Apply easing
    morphState.progress = easeInOutSine(rawProgress);
  }
  
  // Update visuals
  updateMorph();
  
  requestAnimationFrame(() => animate());
}
```

### Step 3: Rendering Updates

Instead of creating SVG once:
1. Update SVG elements on each frame
2. Modify polygon points and colors
3. Update clipPath path data
4. Keep the same DOM structure, just update attributes

## Critical Details

### Color Consistency
- Keep base hue range limited (e.g., 180-280 for blue-green to purple)
- Use seed to vary within this range, not across entire spectrum
- This maintains visual coherence during morphs

### Performance Optimization
- Reuse DOM elements instead of recreating
- Update only changed attributes
- Use requestAnimationFrame for smooth 60fps
- Consider reducing triangle count for better performance

### Edge Cases
- Handle different triangle counts between states
- Validate path data has same number of points
- Fallback to hard transition if interpolation fails

## Configuration Options

```typescript
interface AnimationOptions {
  morphDuration: 4000,      // Time for one complete morph
  cellSize: 60,            // Triangle size (affects performance)
  variance: 0.75,          // Triangle position randomness
  blobComplexity: 8,       // Number of blob vertices
  blobContrast: 0.3,       // Blob shape variation
}
```

## Testing the Animation

1. Start with longer morphDuration (6-8 seconds) to see interpolation clearly
2. Verify smooth transitions without flickering
3. Check color interpolation doesn't create gray/muddy colors
4. Ensure blob and triangles stay synchronized
5. Test performance with different cellSize values

## Common Pitfalls

1. **Color Jumps**: Use consistent color space (HSL) and limit hue range
2. **Path Misalignment**: Ensure blob paths have consistent point counts
3. **Performance**: Too many triangles can cause stuttering
4. **Seed Repetition**: Use proper random seed generation to avoid loops

## Final Notes

The key to beautiful algorithmic animations is subtlety. The morphing should feel like a living crystal slowly shifting its internal structure, not a chaotic transformation. Keep movements smooth, colors harmonious, and timing relaxed.