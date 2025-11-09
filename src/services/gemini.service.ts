import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { MoodAnalysis } from '../types';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | undefined;

  constructor() {
    // Per instructions, API_KEY is available in process.env
    // This assumes the execution environment handles this, as process.env is not standard in browser environments without a build step.
    try {
      if (!process.env.API_KEY) {
        throw new Error('API_KEY environment variable not set!');
      }
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch (e) {
      console.error("Could not initialize GoogleGenAI. Is API_KEY set?", e);
    }
  }

  async analyzeJournalEntry(entry: string): Promise<MoodAnalysis> {
    if (!this.ai) {
        return { mood: 'Error', insights: ['Gemini service not initialized.'] };
    }
    const prompt = `Analyze the following journal entry and provide a primary mood and three brief, insightful, and constructive observations. The mood should be a single word. The insights should be encouraging and forward-looking.
    
    Journal Entry: "${entry}"`;

    try {
        const response = await this.ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mood: {
                            type: Type.STRING,
                            description: "The primary mood detected in the journal entry."
                        },
                        insights: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "An insightful and constructive observation."
                            },
                            description: "A list of three brief insights."
                        }
                    },
                    required: ["mood", "insights"]
                }
            }
        });

        const jsonString = response.text;
        const result = JSON.parse(jsonString);

        if (result && typeof result.mood === 'string' && Array.isArray(result.insights)) {
            return result as MoodAnalysis;
        } else {
            console.error("Invalid JSON structure from Gemini:", result);
            return { mood: 'Neutral', insights: ['Could not analyze entry.'] };
        }
    } catch (error) {
        console.error('Error analyzing journal entry with Gemini:', error);
        return { mood: 'Unknown', insights: ['There was an error analyzing your entry. Please try again later.'] };
    }
  }

  async getMotivationalQuote(): Promise<string> {
    if (!this.ai) {
        return "Focus on progress, not perfection.";
    }
    const prompt = "Give me a short, powerful motivational quote for someone using a Pomodoro timer to focus on their work. The quote should be inspiring and related to productivity or focus. Just the quote, no attribution.";

    try {
        const response = await this.ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text.trim().replace(/"/g, ''); // Clean up quotes
    } catch (error) {
        console.error('Error getting motivational quote from Gemini:', error);
        return "Focus on progress, not perfection."; // Fallback quote
    }
  }
}
