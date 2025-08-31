import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { config, isEnvironment } from './config/environment.js'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>{config.app.name}</h1>
      
      {/* Environment Information */}
      <div className="environment-info">
        <h2>Environment Configuration</h2>
        <div className="env-details">
          <p><strong>Environment:</strong> {config.environment}</p>
          <p><strong>API Base URL:</strong> {config.api.baseUrl}</p>
          <p><strong>Version:</strong> {config.app.version}</p>
          <p><strong>Debug Mode:</strong> {config.features.debugMode ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Logging:</strong> {config.features.enableLogging ? 'Enabled' : 'Disabled'}</p>
        </div>
        
        <div className="env-badges">
          {isEnvironment('staging') && <span className="badge staging">Staging</span>}
          {isEnvironment('production') && <span className="badge production">Production</span>}
          {isEnvironment('local') && <span className="badge local">Local Development</span>}
        </div>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
