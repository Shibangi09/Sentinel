import { GoogleGenAI, Type } from "@google/genai";
import { DrowsinessAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using a fast model for near real-time analysis
const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
You are a highly accurate Drowsiness Detection System for vehicle safety.
Your job is to analyze the provided image of a driver's face and determine if they are showing signs of drowsiness or distraction.

Specific criteria for Drowsiness/Danger:
1. Yawning (Mouth open wide).
2. Rubbing eyes (Hands touching or covering eyes).
3. Eyes closed (Both eyes closed for a prolonged moment - assume captured frame is representative).
4. Head facing downward (Nodding off, chin near chest).

Return a strict JSON response.
`;

export const analyzeFrame = async (base64Image: string): Promise<DrowsinessAnalysisResult> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analyze the driver's state. Are they drowsy based on: yawning, rubbing eyes, eyes closed, or head down?"
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isDrowsy: {
              type: Type.BOOLEAN,
              description: "True if any drowsiness criteria are met."
            },
            reason: {
              type: Type.STRING,
              description: "Short description of the detected state (e.g., 'User is yawning')."
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence level between 0 and 1."
            },
            detectedSigns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific signs detected (e.g., ['yawning', 'eyes_closed'])."
            }
          },
          required: ["isDrowsy", "reason", "confidence", "detectedSigns"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    const result = JSON.parse(text) as DrowsinessAnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fail safe: assume not drowsy if API fails to avoid spamming alerts, but log error
    return {
      isDrowsy: false,
      reason: "Analysis failed",
      confidence: 0,
      detectedSigns: []
    };
  }
};
