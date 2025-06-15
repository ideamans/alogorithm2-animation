import React, { useState } from 'react'
import { Alogorithm2Animation } from 'alogorithm2-animation/react'

function App() {
  const [mode, setMode] = useState('morph')
  const [seed, setSeed] = useState('')

  return (
    <div className="app">
      <h1>Alogorithm2 Animation - React Example</h1>
      
      <div className="controls">
        <label>
          Mode:
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="morph">Morph</option>
            <option value="fly">Fly</option>
          </select>
        </label>
        
        <label>
          Seed:
          <input 
            type="text" 
            value={seed} 
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Leave empty for random"
          />
        </label>
      </div>

      <div className="animation-container">
        <Alogorithm2Animation 
          width={400} 
          height={400} 
          mode={mode}
          seed={seed || undefined}
          duration={2000}
          interval={4000}
        />
      </div>

      <div className="info">
        <p>Using Alogorithm2Animation from ../dist/react</p>
      </div>
    </div>
  )
}

export default App