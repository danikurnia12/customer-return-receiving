import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('GEMINI_API_KEY belum dikonfigurasi.')
}

const ai = new GoogleGenAI({
  apiKey,
})

export async function askGemini(prompt: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
  })

  return response.text ?? ''
}