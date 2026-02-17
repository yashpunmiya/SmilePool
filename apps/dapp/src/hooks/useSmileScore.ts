import { useState, useCallback } from "react";
import { analyzeSmile, type SmileResult } from "../lib/gemini";

export function useSmileScore() {
  const [result, setResult] = useState<SmileResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (base64Image: string, mimeType?: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const smileResult = await analyzeSmile(base64Image, mimeType);
      setResult(smileResult);
      return smileResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return { result, isAnalyzing, error, analyze, reset };
}
