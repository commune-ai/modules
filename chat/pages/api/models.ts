
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // This should point to your Commune backend server
    const communeBackendUrl = process.env.COMMUNE_BACKEND_URL || 'http://localhost:8000'
    
    const response = await axios.get(`${communeBackendUrl}/api/agent/models`, {
      timeout: 5000 // 5 seconds timeout
    })
    
    return res.status(200).json(response.data)
  } catch (error) {
    console.error('Error fetching models from backend:', error)
    // Return a default list of models in case the backend is not available
    return res.status(200).json([
      'google/gemini-2.5-pro-exp-03-25:free',
      'anthropic/claude-3-opus-20240229',
      'anthropic/claude-3-sonnet-20240229',
      'meta-llama/llama-3-70b-instruct'
    ])
  }
}
