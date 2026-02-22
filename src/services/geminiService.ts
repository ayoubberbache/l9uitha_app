import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askGemini(prompt: string, context?: string, highThinking: boolean = false) {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are L9uitha AI, a helpful assistant for a tech high school's Lost and Found platform. 
  Your tone is friendly, cartoonic, and tech-savvy. 
  You help students find their lost items or report found ones.
  Current items in database context: ${context || 'None'}.
  If someone asks about an item, check the context and suggest matches.
  Always encourage students to be honest and helpful.`;

  const config: any = {
    systemInstruction,
  };

  if (highThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  return response.text;
}
