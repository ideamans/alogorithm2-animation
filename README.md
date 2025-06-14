# Alogorithm2 Animation

A browser-focused animation library providing morphing triangular patterns and organic blob shapes. Create beautiful, animated logo marks with customizable transitions for React, Vue, and Astro applications.

## Features

- 🎨 **Morphing Animations** - Smooth transitions between randomly generated triangle patterns
- 🌊 **Organic Blob Shapes** - Natural-looking blob masks that evolve over time
- ⚡ **Framework Support** - Native components for React, Vue, and Astro
- 🎯 **Two Animation Modes** - Choose between "morph" (crossfade) or "fly" (movement) transitions
- 🎛️ **Fully Customizable** - Control size, timing, colors, and animation behavior
- 📦 **Lightweight** - Minimal dependencies, optimized for browsers

## Installation

```bash
npm install alogorithm2-animation
# or
yarn add alogorithm2-animation
```

## Usage

### React

```jsx
import { Alogorithm2Animation } from 'alogorithm2-animation/react'

function App() {
  return (
    <Alogorithm2Animation 
      width={400} 
      height={400} 
      mode="morph"
      seed="my-seed"
      duration={2000}
      interval={4000}
    />
  )
}
```

### Vue

```vue
<template>
  <Alogorithm2Animation 
    :width="400" 
    :height="400" 
    mode="morph"
    seed="my-seed"
    :duration="2000"
    :interval="4000"
  />
</template>

<script>
import Alogorithm2Animation from 'alogorithm2-animation/vue'

export default {
  components: {
    Alogorithm2Animation
  }
}
</script>
```

### Astro

```astro
---
import Alogorithm2Animation from 'alogorithm2-animation/astro'
---

<Alogorithm2Animation 
  client:load
  width={400} 
  height={400} 
  mode="morph"
  seed="my-seed"
  duration={2000}
  interval={4000}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | number | 400 | Width of the animation canvas |
| `height` | number | 400 | Height of the animation canvas |
| `seed` | string | random | Seed for initial pattern generation |
| `mode` | 'morph' \| 'fly' | 'morph' | Animation transition style |
| `duration` | number | 2000 | Animation duration in milliseconds |
| `interval` | number | 4000 | Pause between animations in milliseconds |

### Animation Modes

- **morph**: Triangles crossfade between patterns with smooth opacity transitions
- **fly**: Triangles move from their positions with physics-based animations

## Core Utilities

You can also use the core animation utilities directly:

```javascript
import { 
  generateTriangles,
  generateBlobPath,
  easeInOutSine,
  interpolateColor
} from 'alogorithm2-animation'

// Generate triangle pattern
const triangles = generateTriangles(seed, size, 'morph')

// Generate blob path
const blobPath = generateBlobPath(seed, size)
```

## Development

```bash
# Install dependencies
yarn install

# Run React development environment
yarn dev:react

# Run Vue development environment
yarn dev:vue

# Run Astro development environment
yarn dev:astro

# Run tests
yarn test:react
yarn test:vue

# Build for production
yarn build
```

## Browser Support

This library requires modern browsers with support for:
- SVG animations
- ES6+ JavaScript features
- CSS custom properties
- requestAnimationFrame API

## License

GPL-3.0 License

## Credits

Created by ideaman's Inc. Based on the Alogorithm v2 visual identity system.