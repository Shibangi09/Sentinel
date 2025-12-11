import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, AlertOctagon, CheckCircle2, RefreshCw, Power } from 'lucide-react';
import { analyzeFrame } from '../services/geminiService';
import { playAlarm, stopAlarm } from '../utils/sound';
import { DetectionStatus, DrowsinessAnalysisResult } from '../types';

interface DrowsinessDetectorProps {
  onActiveChange: (isActive: boolean) => void;
}

export const DrowsinessDetector: React.FC<DrowsinessDetectorProps> = ({ onActiveChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [status, setStatus] = useState<DetectionStatus>(DetectionStatus.IDLE);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastResult, setLastResult] = useState<DrowsinessAnalysisResult | null>(null);
  const [alertTimeLeft, setAlertTimeLeft] = useState<number>(0);
  
  // Configurations
  const SCAN_INTERVAL_MS = 2000; // Check every 2 seconds
  const ALERT_DURATION_MS = 3000; // Alert for 3 seconds

  // Start/Stop Camera
  const toggleMonitoring = async () => {
    if (status === DetectionStatus.IDLE || status === DetectionStatus.ERROR) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStatus(DetectionStatus.SCANNING);
        onActiveChange(true);
      } catch (err) {
        console.error("Camera error:", err);
        alert("Could not access camera. Please allow permissions.");
        setStatus(DetectionStatus.ERROR);
      }
    } else {
      // Stop
      stopMonitoring();
    }
  };

  const stopMonitoring = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setStatus(DetectionStatus.IDLE);
    onActiveChange(false);
    stopAlarm();
  }, [stream, onActiveChange]);

  // Capture and Analyze
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || status !== DetectionStatus.SCANNING) return;

    // Draw video frame to canvas
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Get Base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.7);

    // Set status processing (optional, might flicker UI too much, so maybe keep SCANNING)
    // We'll keep SCANNING but show a loading indicator somewhere if needed.
    
    // Call Gemini
    const result = await analyzeFrame(base64Image);
    setLastResult(result);

    if (result.isDrowsy) {
      triggerAlert();
    }
  }, [status]);

  // Alert Trigger Logic
  const triggerAlert = () => {
    setStatus(DetectionStatus.ALERT);
    setAlertTimeLeft(3); // 3 seconds
    playAlarm();
  };

  // Main Loop
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (status === DetectionStatus.SCANNING) {
      intervalId = setInterval(captureAndAnalyze, SCAN_INTERVAL_MS);
    }

    return () => {
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [status, captureAndAnalyze]);

  // Alert Timer Countdown
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (status === DetectionStatus.ALERT && alertTimeLeft > 0) {
      timerId = setTimeout(() => {
        setAlertTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (status === DetectionStatus.ALERT && alertTimeLeft <= 0) {
      // Reset
      stopAlarm();
      setStatus(DetectionStatus.SCANNING);
      setLastResult(null); // Clear the bad result to reset UI
    }

    return () => {
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [status, alertTimeLeft]);

  return (
    <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
      
      {/* Alert Overlay */}
      {status === DetectionStatus.ALERT && (
        <div className="absolute inset-0 z-50 bg-red-500/90 flex flex-col items-center justify-center animate-pulse">
          <AlertOctagon className="w-24 h-24 text-white mb-4 animate-bounce" />
          <h2 className="text-5xl font-black text-white tracking-wider uppercase drop-shadow-md">WAKE UP</h2>
          <p className="text-white/90 text-xl mt-2 font-medium">{lastResult?.reason || "Drowsiness Detected"}</p>
          <div className="mt-8 text-white/80 font-mono text-2xl">
            Resuming in {alertTimeLeft}s
          </div>
        </div>
      )}

      {/* Video Feed Container */}
      <div className="relative aspect-video bg-black flex items-center justify-center group">
        
        {status === DetectionStatus.IDLE && (
          <div className="flex flex-col items-center text-slate-500">
            <Camera className="w-16 h-16 mb-4 opacity-50" />
            <p>Camera inactive</p>
          </div>
        )}

        {status === DetectionStatus.ERROR && (
           <div className="flex flex-col items-center text-red-500">
             <AlertOctagon className="w-16 h-16 mb-4" />
             <p>Camera Error</p>
           </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${status === DetectionStatus.IDLE ? 'hidden' : 'block'}`}
        />
        
        {/* Scanning Effect Overlay */}
        {status === DetectionStatus.SCANNING && (
          <>
            <div className="scan-line"></div>
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-mono">LIVE FEED ANALYSIS</span>
            </div>
            
            {/* Face Bounding Box Simulation (Visual Flair) */}
            <div className="absolute inset-0 border-[30px] border-slate-900/30 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-emerald-500/30 rounded-3xl pointer-events-none opacity-50">
               <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
               <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
               <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
               <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
            </div>
          </>
        )}
      </div>

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Control Panel */}
      <div className="p-6 bg-slate-900 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMonitoring}
            className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              status === DetectionStatus.SCANNING
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {status === DetectionStatus.SCANNING ? (
              <>
                <Power className="w-5 h-5" /> STOP SYSTEM
              </>
            ) : (
              <>
                <Power className="w-5 h-5" /> ACTIVATE SENTINEL
              </>
            )}
          </button>
        </div>

        {/* Status Display */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">System Status</span>
              {status === DetectionStatus.SCANNING && (
                <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
              )}
            </div>
            
            {status === DetectionStatus.IDLE && <div className="text-slate-500 font-mono">Waiting for activation...</div>}
            
            {status === DetectionStatus.SCANNING && (
               <div>
                  <div className="text-emerald-400 font-mono text-lg flex items-center gap-2">
                     <CheckCircle2 className="w-5 h-5" />
                     {lastResult ? "Monitoring Driver" : "Initializing..."}
                  </div>
                  {lastResult && (
                    <div className="mt-2 text-xs text-slate-400">
                      Last Check: {lastResult.isDrowsy ? <span className="text-red-400 font-bold">WARNING</span> : <span className="text-emerald-500">NORMAL</span>}
                      <span className="mx-2">•</span>
                      Conf: {(lastResult.confidence * 100).toFixed(0)}%
                    </div>
                  )}
               </div>
            )}
        </div>
      </div>
    </div>
  );
};