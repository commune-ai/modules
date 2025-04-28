
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

// This is a Next.js API route that will proxy requests to the Python backend
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, model } = req.body
    
    // This should point to your Commune backend server
    const communeBackendUrl = process.env.COMMUNE_BACKEND_URL || 'http://localhost:8000'
    
    const response = await axios.post(`${communeBackendUrl}/api/agent/ask`, {
      text: message,
      model: model,
      // Add a timeout to prevent hanging requests
      timeout: 60000 // 60 seconds timeout
    }, {
      timeout: 60000
    })
    
    if (!response.data) {
      throw new Error('Empty response from backend')
    }
    
    return res.status(200).json({ response: response.data })
  } catch (error: any) {
    console.error('Error proxying to backend:', error)
    // Provide more detailed error information
    const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Failed to process request'
    return res.status(500).json({ error: errorMessage })
  }
}
