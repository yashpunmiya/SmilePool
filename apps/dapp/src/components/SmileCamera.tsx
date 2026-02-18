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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-btc-card/80 border border-btc-border/50 p-5 flex flex-col items-center gap-5"
    >
      <h2 className="text-base font-bold text-btc-text flex items-center gap-2">
        <span className="text-xl">📸</span> Smile Scanner
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
                className="w-40 h-40 rounded-xl object-cover border border-btc-border/50"
              />
            )}
            <ScoreMeter score={result.score} />
            <p className="text-btc-muted text-center text-xs italic">
              "{result.message}"
            </p>
            <button
              onClick={resetAll}
              className="px-5 py-2 rounded-lg bg-btc-gray border border-btc-border/50 text-btc-text hover:bg-btc-border transition-colors text-xs font-medium"
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
                className="w-40 h-40 rounded-xl object-cover border border-btc-orange/50 animate-pulse"
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
                  className="w-64 h-48 rounded-xl object-cover border border-btc-orange/50"
                />
                <button
                  onClick={captureAndAnalyze}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-btc-orange hover:bg-btc-orange/80 transition-colors flex items-center justify-center shadow-md shadow-btc-orange/20"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white" />
                </button>
              </div>
            ) : (
              <div className="w-64 h-48 rounded-xl border border-dashed border-btc-border/50 bg-btc-gray/30 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">😊</span>
                <span className="text-btc-muted text-xs">
                  Take a selfie or upload
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="px-5 py-2 rounded-lg bg-btc-orange text-btc-dark font-semibold hover:bg-btc-orange/90 transition-colors text-xs"
                >
                  📷 Open Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="px-5 py-2 rounded-lg bg-btc-gray border border-btc-border/50 text-btc-text hover:bg-btc-border transition-colors text-xs font-medium"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 rounded-lg bg-btc-gray border border-btc-border/50 text-btc-text hover:bg-btc-border transition-colors text-xs font-medium"
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
