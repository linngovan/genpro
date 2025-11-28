import { GoogleGenAI } from "@google/genai";
import { DetailLevel, PromptRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert at reverse-engineering image prompts for AI image generators (like Midjourney, Stable Diffusion, DALL-E). 
Your task is to look at an image and describe it in a way that, if fed back into an image generator, would produce a similar result. 
Focus on subject, medium, style, lighting, color palette, composition, and quality modifiers.`;

const getPromptInstruction = (level: DetailLevel): string => {
  switch (level) {
    case DetailLevel.CONCISE:
      return "Generate a very short, punchy caption. Focus only on the main subject and the most obvious style. Maximum 2 sentences.";
    case DetailLevel.STANDARD:
      return "Generate a standard, balanced prompt. Describe the subject, the action, the setting, and the art style. Use comma-separated tags where appropriate.";
    case DetailLevel.DETAILED:
      return "Generate a highly detailed description. Include specifics about textures, lighting (e.g., volumetric, cinematic), camera angles, artistic influences, and mood.";
    case DetailLevel.EXTREME:
      return "Generate an extremely exhaustive and verbose prompt. Analyze every micro-detail, background element, lighting nuance, lens type, rendering engine style (e.g., Unreal Engine 5, Octane Render), and complex artistic modifiers.";
    default:
      return "Describe this image.";
  }
};

export const generateImagePrompt = async (request: PromptRequest): Promise<string> => {
  try {
    // Strip the data URL prefix to get raw base64 (e.g., "data:image/png;base64,...")
    const base64Data = request.imageBase64.split(',')[1];
    
    if (!base64Data) {
      throw new Error("Invalid image data");
    }

    const promptText = getPromptInstruction(request.detailLevel);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            text: promptText,
          },
          {
            inlineData: {
              mimeType: request.mimeType,
              data: base64Data
            }
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4, // Lower temperature for more accurate descriptions
      }
    });

    return response.text || "Could not generate a description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate prompt. Please try again.");
  }
};

export const generateRefinedImage = async (imageBase64: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const base64Data = imageBase64.split(',')[1];
    if (!base64Data) throw new Error("Invalid image data");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Specialized model for image tasks
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Refine and recreate this image based on the following description: ${prompt}`,
          },
        ],
      },
    });

    // Iterate to find the image part
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw new Error("Failed to refine image.");
  }
};