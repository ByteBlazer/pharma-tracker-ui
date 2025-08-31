import { config, getApiUrl } from '../config/environment.js'

class ApiService {
  constructor() {
    this.baseUrl = config.api.baseUrl
    this.timeout = config.api.timeout
    this.defaultHeaders = config.api.headers
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = getApiUrl(endpoint)
    const headers = { ...this.defaultHeaders, ...options.headers }
    
    const config = {
      method: options.method || 'GET',
      headers,
      timeout: this.timeout,
      ...options,
    }

    // Add body for non-GET requests
    if (options.body && config.method !== 'GET') {
      config.body = JSON.stringify(options.body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Handle different response types
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return await response.text()
    } catch (error) {
      if (config.features?.enableLogging) {
        console.error('API Request failed:', error)
      }
      throw error
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body: data })
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body: data })
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body: data })
  }
}

// Create and export a singleton instance
export const apiService = new ApiService()

// Export individual methods for convenience
export const { get, post, put, delete: del, patch } = apiService

export default apiService
