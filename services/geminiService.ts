
import { GoogleGenAI } from "@google/genai";
import { BookData } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey });
};

const generateOutlinePrompt = (data: BookData): string => {
  return `
You are BookMind.ai, an expert authoring assistant. Based on the following book specifications, generate a compelling, single-line book title and a list of 5-10 chapter titles.

**Book Specifications:**
- **Topic:** ${data.topic}
- **Type:** ${data.type}
- **Purpose:** ${data.purpose}
- **Target Audience:** ${data.audience}
- **Tone:** ${data.tone}
- **Language:** ${data.language}

**Output Format:**
Provide the response in the specified language (${data.language}). Your output MUST follow this exact format, with no extra text or explanations:
Title: [Your Generated Book Title]
[Your Generated Chapter 1 Title]
[Your Generated Chapter 2 Title]
[Your Generated Chapter 3 Title]
...
`;
};


export const generateBookOutline = async (data: BookData): Promise<{ title: string, structure: string }> => {
  try {
    const ai = getAI();
    const prompt = generateOutlinePrompt(data);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });
    
    const text = response.text;
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const titleLine = lines.find(line => line.toLowerCase().startsWith('title:'));
    const title = titleLine ? titleLine.substring(titleLine.indexOf(':') + 1).trim() : data.topic;
    
    const structure = lines.filter(line => !line.toLowerCase().startsWith('title:')).join('\n');
    
    return { title, structure };

  } catch (error) {
    console.error("Error generating book outline:", error);
    return {
      title: data.topic,
      structure: "Chapter 1: Introduction\nChapter 2: The Core Idea\nChapter 3: Practical Applications\nChapter 4: Advanced Concepts\nChapter 5: Conclusion"
    };
  }
};


const generatePrompt = (data: BookData, t: (key: string) => string): string => {
  const task = data.plan === 'Free' 
    ? t('plan_free_desc') 
    : `${t('plan_pro_desc')} in ${data.language}. If the plan is 'Creator', you will also need to be ready to translate it to French, German, and Spanish.`;

  const formatFinalDetails = (details: BookData['finalDetails']): string => {
    const parts: string[] = [];
    if (details.author) parts.push(`- **Author Name:** ${details.author}`);
    if (details.dedication) parts.push(`- **Dedication:** ${details.dedication}`);
    if (details.quotes) parts.push(`- **Favorite Quotes to include:** ${details.quotes}`);
    if (details.cover) parts.push(`- **AI Cover Description:** ${details.cover}`);
    
    return parts.length > 0 ? parts.join('\n') : 'None provided.';
  };

  return `
You are BookMind.ai, an expert authoring assistant. Your task is to write a book based on the following specifications. The output should be in well-formatted Markdown.

**Book Specifications:**
- **Title:** ${data.title}
- **Topic:** ${data.topic}
- **Type:** ${data.type}
- **Purpose:** ${data.purpose}
- **Target Audience:** ${data.audience}
- **Tone:** ${data.tone}
- **Language:** ${data.language}
- **Structure/Outline:** ${data.structure}
- **Final Customization Details:** 
${formatFinalDetails(data.finalDetails)}

**Task:**
Generate the content for this book according to the plan: **${data.plan}**.
- **Task Description:** ${task}

Start directly with the book content. Begin with the book title. Do not include any introductory text like "Here is the book content".
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
