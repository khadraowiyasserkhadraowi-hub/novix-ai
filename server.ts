import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
     return res.status(400).json({ error: 'messages array is required' });
    }

    const ai = getAiClient();
    
    // Map client messages to Gemini content format with multimodal support
    const contents = messages.map(msg => {
      const parts: any[] = [{ text: msg.content || "" }];
      
      if (msg.image) {
        const match = msg.image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }
      
      return {
        role: msg.role === 'assistant' ? 'model' : msg.role,
        parts: parts
      };
    });

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash',
      contents: contents,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error: any) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Error communicating with Gemini' });
    } else {
      res.end();
    }
  }
});

// API endpoint for Image Generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    if (!prompt) {
     return res.status(400).json({ error: 'prompt is required' });
    }

    const ai = getAiClient();
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      }
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('No images generated from the model');
    }

    const base64Image = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    res.json({ imageUrl });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Error generating image with Imagen' });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Novix AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
