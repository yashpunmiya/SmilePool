import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface SmileResult {
  score: number;
  message: string;
  hasFace: boolean;
}

/**
 * Analyze a selfie image using Gemini Vision AI and return a smile score
 * @param base64Image Base64-encoded JPEG image data (without the data:image prefix)
 * @param mimeType MIME type of the image (default: image/jpeg)
 */
export async function analyzeSmile(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<SmileResult> {
  if (!apiKey) {
    throw new Error(
      "VITE_GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey"
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a smile detection AI. Analyze this selfie image and rate the person's smile on a scale from 0 to 100.

Rules:
- 0 = no smile at all, frowning, or neutral face
- 50 = slight smile
- 75 = good genuine smile
- 100 = the biggest, most joyful smile possible

Respond ONLY with valid JSON in this exact format, no other text:
{"score": <number 0-100>, "message": "<short fun description of their smile>", "hasFace": <true/false>}

If no human face is detected in the image, respond with:
{"score": 0, "message": "No face detected! Please take a selfie with your face visible.", "hasFace": false}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const text = response.text?.trim() ?? "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result: SmileResult = JSON.parse(jsonStr);

    // Clamp score between 0 and 100
    result.score = Math.max(0, Math.min(100, Math.round(result.score)));

    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      score: 0,
      message: "Failed to analyze image. Please try again.",
      hasFace: false,
    };
  }
}
