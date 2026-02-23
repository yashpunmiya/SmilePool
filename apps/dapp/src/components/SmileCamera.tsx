import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSmileScore } from "../hooks/useSmileScore";
import { ScoreMeter } from "./ScoreMeter";

interface SmileCameraProps {
  onScoreReady: (score: number) => void;
  onPhotoReady?: (dataUrl: string, score: number) => void;
}

export function SmileCamera({ onScoreReady, onPhotoReady }: SmileCameraProps) {
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
      onPhotoReady?.(dataUrl, result.score);
    }
  }, [analyze, onScoreReady, onPhotoReady, stopCamera]);

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
          onPhotoReady?.(dataUrl, result.score);
        }
      };
      reader.readAsDataURL(file);
    },
    [analyze, onScoreReady, onPhotoReady, stopCamera]
  );

  const resetAll = useCallback(() => {
    reset();
    setCapturedImage(null);
    stopCamera();
  }, [reset, stopCamera]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[32px] glass-panel p-6 flex flex-col items-center gap-5 border border-black/5 overflow-hidden relative shadow-sm"
    >
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-btc-orange/10 rounded-full blur-[100px] pointer-events-none" />
      <h2 className="text-xl font-black text-btc-dark flex items-center gap-3 z-10">
        <span className="text-2xl drop-shadow-md">📸</span> Smile Scanner
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
                className="w-48 h-48 rounded-3xl object-cover shadow-2xl shadow-black/40 ring-4 ring-btc-orange/20"
              />
            )}
            <ScoreMeter score={result.score} />
            <p className="text-btc-muted text-center text-sm font-medium italic mt-2">
              "{result.message}"
            </p>
            <button
              onClick={resetAll}
              className="px-6 py-2.5 rounded-xl bg-black/5 border border-black/5 text-btc-dark hover:bg-black/10 transition-colors text-sm font-bold mt-2"
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
                className="w-40 h-40 rounded-3xl object-cover ring-4 ring-btc-orange/50 animate-pulse shadow-2xl shadow-btc-orange/20"
              />
            )}
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-10 flex flex-col gap-3 rounded-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-btc-orange border-t-transparent rounded-full drop-shadow-md"
              />
              <p className="text-btc-dark font-black tracking-widest uppercase text-sm drop-shadow-md">
                Analyzing Smile...
              </p>
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
                  className="w-64 h-64 md:w-72 md:h-72 rounded-3xl object-cover ring-4 ring-btc-orange/30 shadow-2xl"
                />
                <button
                  onClick={captureAndAnalyze}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-btc-orange to-btc-amber hover:opacity-90 transition-all flex items-center justify-center shadow-lg shadow-btc-orange/40 hover:scale-105 active:scale-95 border-2 border-white/20"
                >
                  <div className="w-10 h-10 rounded-full border-[3px] border-white/90" />
                </button>
              </div>
            ) : (
              <div className="text-center py-10 px-4">
                <div className="w-20 h-20 mx-auto bg-btc-orange/10 rounded-full flex items-center justify-center mb-5 shadow-inner border border-btc-orange/20">
                  <span className="text-4xl drop-shadow-md">👀</span>
                </div>
                <h3 className="text-xl font-black text-btc-dark mb-2 tracking-tight">Show us your best smile!</h3>
                <p className="text-btc-dark/70 text-sm max-w-[280px] mx-auto leading-relaxed font-bold mb-6">
                  Take a selfie or upload an image to see your smile score.
                </p>
              </div>
            )}

            <div className="flex gap-3 z-10 w-full justify-center mt-2">
              {isStreaming ? (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={captureAndAnalyze}
                    disabled={isAnalyzing}
                    className="bg-white text-btc-dark font-black px-8 py-3.5 rounded-full hover:bg-black/5 hover:text-btc-orange transition-all shadow-lg active:scale-95 disabled:opacity-50 border border-black/5"
                  >
                    📸 Capture
                  </button>
                  <button
                    onClick={stopCamera}
                    disabled={isAnalyzing}
                    className="bg-black/5 text-btc-muted font-bold px-8 py-3.5 rounded-full hover:bg-black/10 transition-all active:scale-95 disabled:opacity-50 border border-black/5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={startCamera}
                    className="flex-1 max-w-[160px] py-3 rounded-[16px] bg-gradient-to-r from-btc-orange to-[#FF7A00] text-white font-black hover:brightness-110 transition-all shadow-lg shadow-btc-orange/20 text-sm active:scale-95"
                  >
                    📸 Start Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 max-w-[160px] py-3 rounded-[16px] bg-black/5 border border-black/5 text-btc-dark hover:bg-black/10 transition-colors text-sm font-black active:scale-95 shadow-sm"
                  >
                    📁 Upload Image
                  </button>
                </>
              )}
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
