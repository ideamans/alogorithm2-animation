import React from 'react'
import { Alogorithm2Animation } from '../../src/react'

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Alogorithm2 Animation - React</h1>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h3>Morph Mode (Default)</h3>
          <Alogorithm2Animation width={300} height={300} mode="morph" />
        </div>
        
        <div>
          <h3>Fly Mode</h3>
          <Alogorithm2Animation width={300} height={300} mode="fly" />
        </div>
        
        <div>
          <h3>Custom Seed</h3>
          <Alogorithm2Animation width={300} height={300} seed="custom-seed" mode="morph" />
        </div>
        
        <div>
          <h3>Fast Animation</h3>
          <Alogorithm2Animation width={300} height={300} mode="morph" duration={500} interval={2000} />
        </div>
      </div>
    </div>
  )
}

export default App