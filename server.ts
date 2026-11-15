import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT) || 3000;

// Cache synthesized female TTS WAV buffers in memory to eliminate latency on replay
const ttsCache = new Map<string, string>();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/tts', async (req, res) => {
  try {
    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const style =
      typeof req.body?.style === 'string' && req.body.style.trim()
        ? req.body.style.trim()
        : 'Warm, clear, expressive Malaysian Malay woman speaking naturally as Puan Aminah, a concerned village resident reporting river pollution.';

    if (!rawText) {
      return res.status(400).json({ error: 'Text is required for speech generation.' });
    }

    const cacheKey = `${style}::${rawText}`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      return res.json({ audioBase64: cached, mimeType: 'audio/wav', voiceName: 'Kore' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: rawText,
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || 'audio/wav';

    if (!base64Audio) {
      return res.status(502).json({ error: 'No audio returned from speech synthesizer.' });
    }

    ttsCache.set(cacheKey, base64Audio);
    return res.json({ audioBase64: base64Audio, mimeType, voiceName: 'Kore' });
  } catch (err) {
    console.error('TTS error:', err);
    return res.status(500).json({ error: 'Failed to synthesize female voice audio.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoWorld server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
