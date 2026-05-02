const API_BASE = '/api'

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (!res.ok) throw new Error('API error')
    return res.json()
  },
  post: async (endpoint: string, data: unknown) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('API error')
    return res.json()
  },
  delete: async (endpoint: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('API error')
    return res.json()
  }
}
