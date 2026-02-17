import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSmileScore } from "../hooks/useSmileScore";
import { ScoreMeter } from "./ScoreMeter";

interface SmileCameraProps {
  onScoreReady: (score: number) => void;
}

export function SmileCamera({ onScoreReady }: SmileCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { result, isAnalyzing, error, analyze, reset } = useSmileScore();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1];

    setCapturedImage(dataUrl);
    stopCamera();

    const result = await analyze(base64, "image/jpeg");
    if (result && result.hasFace) {
      onScoreReady(result.score);
    }
  }, [analyze, onScoreReady, stopCamera]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        const mimeType = file.type || "image/jpeg";

        setCapturedImage(dataUrl);
        stopCamera();

        const result = await analyze(base64, mimeType);
        if (result && result.hasFace) {
          onScoreReady(result.score);
        }
      };
      reader.readAsDataURL(file);
    },
    [analyze, onScoreReady, stopCamera]
  );

  const resetAll = useCallback(() => {
    reset();
    setCapturedImage(null);
    stopCamera();
  }, [reset, stopCamera]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-btc-card border border-btc-border p-6 flex flex-col items-center gap-6"
    >
      <h2 className="text-xl font-bold text-btc-orange flex items-center gap-2">
        <span className="text-2xl">📸</span> Smile Scanner
      </h2>

      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence mode="wait">
        {/* Result view */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured selfie"
                className="w-48 h-48 rounded-xl object-cover border-2 border-btc-border"
              />
            )}
            <ScoreMeter score={result.score} />
            <p className="text-btc-muted text-center text-sm italic">
              "{result.message}"
            </p>
            <button
              onClick={resetAll}
              className="px-6 py-2.5 rounded-xl bg-btc-gray border border-btc-border text-btc-text hover:bg-btc-border transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* Analyzing view */}
        {!result && isAnalyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Analyzing"
                className="w-48 h-48 rounded-xl object-cover border-2 border-btc-orange animate-pulse"
              />
            )}
            <div className="flex items-center gap-3">
              <motion.div
                className="w-5 h-5 border-2 border-btc-orange border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-btc-orange font-medium">
                AI analyzing your smile...
              </span>
            </div>
          </motion.div>
        )}

        {/* Camera/Upload view */}
        {!result && !isAnalyzing && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            {isStreaming ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-72 h-54 rounded-xl object-cover border-2 border-btc-orange"
                />
                <button
                  onClick={captureAndAnalyze}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-btc-orange hover:bg-btc-orange/80 transition-colors flex items-center justify-center shadow-lg shadow-btc-orange/30"
                >
                  <div className="w-10 h-10 rounded-full border-3 border-white" />
                </button>
              </div>
            ) : (
              <div className="w-72 h-54 rounded-xl border-2 border-dashed border-btc-border bg-btc-gray/50 flex flex-col items-center justify-center gap-3">
                <span className="text-4xl">😊</span>
                <span className="text-btc-muted text-sm">
                  Take a selfie or upload a photo
                </span>
              </div>
            )}

            <div className="flex gap-3">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 rounded-xl bg-btc-orange text-btc-dark font-semibold hover:bg-btc-orange/90 transition-colors text-sm"
                >
                  📷 Open Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-6 py-2.5 rounded-xl bg-btc-gray border border-btc-border text-btc-text hover:bg-btc-border transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-xl bg-btc-gray border border-btc-border text-btc-text hover:bg-btc-border transition-colors text-sm font-medium"
              >
                📁 Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {error && (
              <p className="text-btc-danger text-sm text-center">{error}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
