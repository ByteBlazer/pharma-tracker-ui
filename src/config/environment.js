// Environment configuration for pharma-tracker-ui
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    timeout: 10000, // 10 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  },
  
  // Environment info
  environment: import.meta.env.VITE_ENV || 'local',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isStaging: import.meta.env.VITE_ENV === 'staging',
  
  // App Configuration
  app: {
    name: 'Pharma Tracker',
    version: '1.0.0',
  },
  
  // Feature flags
  features: {
    debugMode: import.meta.env.VITE_ENV === 'staging' || import.meta.env.DEV,
    enableLogging: import.meta.env.VITE_ENV === 'staging' || import.meta.env.DEV,
  },
}

// Helper functions
export const getApiUrl = (endpoint = '') => {
  const baseUrl = config.api.baseUrl.replace(/\/$/, '')
  const cleanEndpoint = endpoint.replace(/^\//, '')
  return `${baseUrl}/${cleanEndpoint}`
}

export const isEnvironment = (env) => config.environment === env

export default config
