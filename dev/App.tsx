import React, { useState } from 'react'
import { generateRandomSeed } from './utils'
import { StaticIcon } from './components/StaticIcon'

function App() {
  const [currentSeed, setCurrentSeed] = useState(generateRandomSeed())

  const handleRegenerate = () => {
    setCurrentSeed(generateRandomSeed())
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Algorithm2 Icon Animation</h1>
        <p>Morphing algorithmic icon with Trianglify and Blobs</p>
      </header>

      <div className="controls">
        <button className="button" onClick={handleRegenerate}>
          Regenerate
        </button>
        <div className="info">Current seed: {currentSeed}</div>
      </div>

      <div className="icon-container">
        <StaticIcon seed={currentSeed} size={400} />
      </div>
    </div>
  )
}

export default App