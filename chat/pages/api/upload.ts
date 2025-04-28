
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = new formidable.IncomingForm()
    form.uploadDir = path.join(process.cwd(), 'public', 'uploads')
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(form.uploadDir)) {
      fs.mkdirSync(form.uploadDir, { recursive: true })
    }
    
    form.keepExtensions = true
    
    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err)
          res.status(500).json({ error: 'Failed to upload file' })
          return resolve(true)
        }
        
        const file = files.file as formidable.File
        if (!file) {
          res.status(400).json({ error: 'No file provided' })
          return resolve(true)
        }
        
        // Generate a unique filename
        const filename = `${uuidv4()}-${path.basename(file.originalFilename || 'file')}`
        const newPath = path.join(form.uploadDir, filename)
        
        // Move the file to the uploads directory with the new name
        fs.rename(file.filepath, newPath, (renameErr) => {
          if (renameErr) {
            console.error('Error renaming file:', renameErr)
            res.status(500).json({ error: 'Failed to process file' })
            return resolve(true)
          }
          
          // Return the URL to the uploaded file
          const fileUrl = `/uploads/${filename}`
          res.status(200).json({ fileUrl })
          return resolve(true)
        })
      })
    })
  } catch (error) {
    console.error('Error handling file upload:', error)
    res.status(500).json({ error: 'Failed to process request' })
  }
}
