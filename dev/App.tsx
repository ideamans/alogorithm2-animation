import React, { useState } from 'react'
import { generateRandomSeed } from './utils'
import { AnimatedIcon } from './components/AnimatedIcon'

function App() {
  const [currentSeed, setCurrentSeed] = useState(generateRandomSeed())
  const [autoAnimate, setAutoAnimate] = useState(true)
  const [manualProgress, setManualProgress] = useState(0)

  const handleRegenerate = () => {
    setCurrentSeed(generateRandomSeed())
  }

  const handleToggleAnimation = () => {
    setAutoAnimate(!autoAnimate)
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualProgress(parseFloat(e.target.value))
  }

  const handleNextFrame = () => {
    setCurrentSeed(generateRandomSeed())
    setManualProgress(0)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Algorithm2 Icon Animation</h1>
        <p>Morphing algorithmic icon with Trianglify and Blobs</p>
      </header>

      <div className="controls">
        <div className="button-group">
          <button className="button" onClick={handleRegenerate}>
            Regenerate
          </button>
          <button className="button" onClick={handleToggleAnimation}>
            {autoAnimate ? 'Stop Animation' : 'Start Animation'}
          </button>
        </div>
        <div className="info">Current seed: {currentSeed}</div>
        {!autoAnimate && (
          <div className="debug-controls">
            <div className="progress-control">
              <label>Progress: {(manualProgress * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={manualProgress}
                onChange={handleProgressChange}
                style={{ width: '300px' }}
              />
            </div>
            <button className="button" onClick={handleNextFrame}>
              Next Frame
            </button>
          </div>
        )}
      </div>

      <div className="icons-wrapper">
        <div className="icon-container">
          <h3>Fly Mode</h3>
          <AnimatedIcon 
            seed={currentSeed} 
            size={300} 
            autoAnimate={autoAnimate}
            animationInterval={4000}
            mode="fly"
            manualProgress={manualProgress}
          />
        </div>
        <div className="icon-container">
          <h3>Morph Mode</h3>
          <AnimatedIcon 
            seed={currentSeed} 
            size={300} 
            autoAnimate={autoAnimate}
            animationInterval={4000}
            mode="morph"
            manualProgress={manualProgress}
          />
        </div>
      </div>
    </div>
  )
}

export default App