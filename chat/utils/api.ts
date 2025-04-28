
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const fetchModels = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/models`);
    return response.data;
  } catch (error) {
    console.error('Error fetching models:', error);
    return ['gpt-3.5-turbo']; // Default fallback
  }
};

export const sendMessage = async (message: string, model: string): Promise<string> => {
  try {
    const response = await axios.post(`${API_URL}/api/chat`, {
      message,
      model,
    });
    return response.data.response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

// Add function to handle file uploads
export const uploadFile = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.fileUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};
