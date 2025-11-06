
import { GoogleGenAI, Modality } from "@google/genai";
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
- **Tone:** ${Array.isArray(data.tone) ? data.tone.join(', ') : data.tone}
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

export const generateCoverImage = async (prompt: string): Promise<string | null> => {
    if (!prompt) return null;
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `Generate an elegant, minimalist book cover for a book described as: "${prompt}". The style should be symbolic and artistic, with a soft color palette. Avoid text.` }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating cover image:", error);
        return null;
    }
}

const generatePrompt = (data: BookData): string => {
  
  const formatFinalDetails = (details: BookData['finalDetails']): string => {
    const parts: string[] = [];
    if (details.author) parts.push(`- The author's name is ${details.author}.`);
    if (details.dedication) parts.push(`- It includes a dedication: "${details.dedication}".`);
    if (details.quotes) parts.push(`- It should incorporate these favorite quotes naturally: "${details.quotes}".`);
    return parts.length > 0 ? parts.join('\n') : 'No personal details were provided.';
  };

  const creatorPlanInstructions = data.plan === 'Creator'
    ? `
**Multi-Language Generation (Creator Plan):**
After generating the full book in ${data.language}, you MUST provide complete, high-quality translations of the entire book into the following languages: English, Spanish, French, and German. Ensure the emotional tone and narrative quality are preserved in each translation. Use clear separators for each language version, for example:
--- ENGLISH VERSION ---
[Full book content]
--- SPANISH VERSION ---
[Contenido completo del libro]
--- FRENCH VERSION ---
[Contenu complet du livre]
--- GERMAN VERSION ---
[Vollständiger Buchinhalt]
`
    : '';

  return `
**SYSTEM INSTRUCTION:**
You are BookMind.ai, a world-class authoring AI. Your writing style is human, warm, empathetic, and professional. You excel at creating emotionally resonant narratives with a clear, inspiring message. You do not sound like a generic AI.

**TASK:**
Write a complete, high-quality book based on the specifications below. The output must be in well-formatted Markdown.

**WRITING & STRUCTURE GUIDELINES:**
1.  **Overall Tone:** ${Array.isArray(data.tone) ? data.tone.join(', ') : data.tone}. The narrative must be fluid, natural, and avoid repetition.
2.  **Preface/Introduction:** Begin with an emotionally engaging preface. Use gentle metaphors and connect with the reader's aspirations related to the book's topic. Seamlessly integrate the user's personalization details into this section. If no details are provided, write a warm, universally relatable preface.
3.  **Chapter Structure:** Each chapter in the provided outline MUST have:
    - A brief, engaging introduction that sets the stage.
    - A well-developed body that explores the chapter's topic with clarity, using practical examples or comparisons where helpful.
    - A thoughtful concluding paragraph that summarizes the key points.
    - A final, single, inspirational takeaway sentence.
4.  **Epilogue/Conclusion:** End the book with a powerful and reflective epilogue that reinforces the book's core message and leaves the reader feeling inspired and empowered.
5.  **Branding:** Conclude the entire book with the following line, exactly as written:
    > *Hecho con amor y IA por BookMind.ai — Crea, inspira y publica sin límites.*

**BOOK SPECIFICATIONS:**
- **Title:** ${data.title}
- **Topic:** ${data.topic}
- **Type:** ${data.type}
- **Purpose:** ${data.purpose}
- **Target Audience:** ${data.audience}
- **Primary Language:** ${data.language}
- **Structure/Outline:**
${data.structure}
- **Personalization Details to Integrate:**
${formatFinalDetails(data.finalDetails)}
- **Plan:** ${data.plan} (${data.plan === 'Free' ? 'Approx. 500 words' : 'Approx. 2000 words'})

${creatorPlanInstructions}

**CRITICAL INSTRUCTION:**
Begin the response *directly* with the book's content in Markdown, starting with the title. Do not add any conversational text, introductions, or apologies.
  `;
};

export const generateBookContent = async (data: BookData): Promise<{ content: string; coverImage: string | null }> => {
  try {
    const ai = getAI();
    const prompt = generatePrompt(data);
    
    // Generate content and cover image in parallel
    const [contentResponse, coverImage] = await Promise.all([
        ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        }),
        generateCoverImage(data.finalDetails.cover || `A book about ${data.topic} with a ${Array.isArray(data.tone) ? data.tone.join(', ') : data.tone} tone.`)
    ]);

    return { content: contentResponse.text, coverImage };

  } catch (error) {
    console.error("Error generating book content:", error);
    const errorMessage = error instanceof Error ? `Error generating content: ${error.message}` : "An unknown error occurred during content generation.";
    return { content: errorMessage, coverImage: null };
  }
};
