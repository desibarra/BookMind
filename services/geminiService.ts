
import { GoogleGenAI } from "@google/genai";
import { BookData } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey });
};

const generatePrompt = (data: BookData, t: (key: string) => string): string => {
  const task = data.plan === 'Free' 
    ? t('plan_free_desc') 
    : `${t('plan_pro_desc')} in ${data.language}. If the plan is 'Creator', you will also need to be ready to translate it to French, German, and Spanish.`;

  return `
You are BookMind.ai, an expert authoring assistant. Your task is to write a book based on the following specifications. The output should be in well-formatted Markdown.

**Book Specifications:**
- **Topic:** ${data.topic}
- **Type:** ${data.type}
- **Purpose:** ${data.purpose}
- **Target Audience:** ${data.audience}
- **Tone:** ${data.tone}
- **Language:** ${data.language}
- **Structure/Outline:** ${data.structure}
- **Custom Details:** ${data.customization}

**Task:**
Generate the content for this book according to the plan: **${data.plan}**.
- **Task Description:** ${task}

Start directly with the book content. Begin with a suitable title for the book. Do not include any introductory text like "Here is the book content".
  `;
};

export const generateBookContent = async (data: BookData, t: (key: string) => string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = generatePrompt(data, t);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', 
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating book content:", error);
    if (error instanceof Error) {
        return `Error generating content: ${error.message}`;
    }
    return "An unknown error occurred during content generation.";
  }
};
