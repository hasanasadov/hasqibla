"use client";

import { useEffect, useState, useCallback } from "react";
import { Compass, Loader2, MapPin, ArrowRight, ArrowLeft } from "lucide-react";

export default function QiblaFinder() {
  const [qiblaBearing, setQiblaBearing] = useState<number>(0);
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  // Constants for Kaaba Location
  const KAABA_LAT = 21.422487;
  const KAABA_LONG = 39.826206;

  const calculateQibla = useCallback((latitude: number, longitude: number) => {
    const phiK = (KAABA_LAT * Math.PI) / 180.0;
    const lambdaK = (KAABA_LONG * Math.PI) / 180.0;
    const phi = (latitude * Math.PI) / 180.0;
    const lambda = (longitude * Math.PI) / 180.0;

    const y = Math.sin(lambdaK - lambda);
    const x =
      Math.cos(phi) * Math.tan(phiK) -
      Math.sin(phi) * Math.cos(lambdaK - lambda);

    const bearing = (Math.atan2(y, x) * 180.0) / Math.PI;
    setQiblaBearing((bearing + 360) % 360);
    setLoading(false);
  }, []);

  useEffect(() => {
    const isIOSDevice =
      typeof window !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function";
    setIsIOS(isIOSDevice);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        calculateQibla(position.coords.latitude, position.coords.longitude);
        // On Android/Desktop, permission is usually auto-granted
        if (!isIOSDevice) setPermissionGranted(true);
      },
      () => {
        setLocationError("Please enable location services.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, [calculateQibla]);

  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading = 0;
      if ((event as any).webkitCompassHeading) {
        heading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        heading = 360 - event.alpha;
      }
      setCompassHeading(heading);
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () =>
      window.removeEventListener("deviceorientation", handleOrientation, true);
  }, [permissionGranted]);

  const requestCompassPermission = async () => {
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      const response = await (
        DeviceOrientationEvent as any
      ).requestPermission();
      if (response === "granted") setPermissionGranted(true);
      else alert("Permission denied.");
    } else {
      setPermissionGranted(true);
    }
  };

  // --- LOGIC ---
  const compassRotation = -compassHeading;
  let diff = qiblaBearing - compassHeading;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const isAligned = Math.abs(diff) < 5;
  const turnDirection = diff > 0 ? "RIGHT" : "LEFT";

  // --- RENDERING CONDITIONS ---
  const showLoading = loading && !locationError;
  const showPermissionButton =
    !loading && !locationError && isIOS && !permissionGranted;
  const showCompass =
    !loading && !locationError && (!isIOS || permissionGranted);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start p-6 pt-10 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 z-0" />

      <div className="z-10 flex flex-col items-center gap-6 max-w-md w-full text-center">
        {/* Header - Always Visible */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-md">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">
              Mecca, Saudi Arabia
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">Qibla Finder</h1>
        </div>

        {/* 1. ERROR STATE */}
        {locationError && (
          <div className="text-red-400 bg-red-900/20 p-6 rounded-2xl border border-red-900/50">
            <p className="font-bold mb-2">Location Required</p>
            {locationError}
          </div>
        )}

        {/* 2. LOADING STATE */}
        {showLoading && (
          <div className="flex flex-col items-center gap-4 text-slate-400 py-10">
            <Loader2 className="animate-spin w-12 h-12 text-emerald-500" />
            <p className="animate-pulse">Acquiring GPS Signal...</p>
          </div>
        )}

        {/* 3. iOS PERMISSION STATE (No Compass Data Yet) */}
        {showPermissionButton && (
          <div className="flex flex-col items-center gap-6 py-10 max-w-xs mx-auto">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700">
              <Compass className="w-10 h-10 text-slate-500" />
            </div>
            <div className="text-slate-400 text-sm">
              To show the Qibla direction accurately, we need access to your
              device&apos;s digital compass.
            </div>
            <button
              onClick={requestCompassPermission}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-xl font-bold w-full transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Tap to Start Compass
            </button>
          </div>
        )}

        {/* 4. ACTIVE STATE (Compass Ready) */}
        {showCompass && (
          <>
            {/* COMPASS VISUAL */}
            <div className="relative w-72 h-72 flex items-center justify-center my-4 animate-in fade-in zoom-in duration-700">
              {/* Rotating Dial */}
              <div
                className="absolute w-full h-full rounded-full border-2 border-slate-700 bg-slate-900/80 shadow-2xl backdrop-blur-sm transition-transform duration-500 ease-out will-change-transform"
                style={{ transform: `rotate(${compassRotation}deg)` }}
              >
                {/* North */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-red-500 font-bold text-lg">N</span>
                  <div className="w-0.5 h-2 bg-red-500/50"></div>
                </div>

                {/* Ticks */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-1/2 h-full w-0.5 bg-slate-700 opacity-30"
                    style={{ transform: `rotate(${i * 30}deg)` }}
                  />
                ))}

                {/* --- QIBLA MARKER --- */}
                <div
                  className="absolute top-0 left-1/2 h-1/2 w-0 origin-bottom"
                  style={{ transform: `rotate(${qiblaBearing}deg)` }}
                >
                  <div className="absolute -top-3 -left-4 w-8 h-8 bg-slate-900 rounded-lg border border-slate-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] z-50">
                    <KaabaIcon className="w-6 h-6" />
                  </div>
                  <div className="absolute top-5 left-[-1px] w-0.5 h-[calc(100%-20px)] bg-emerald-500/30"></div>
                </div>
              </div>

              {/* Center Phone Pointer */}
              <div
                className={`relative z-20 w-20 h-20 rounded-full border-4 flex items-center justify-center bg-slate-800 transition-colors duration-300 ${
                  isAligned
                    ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                    : "border-slate-600"
                }`}
              >
                <Compass
                  className={`w-10 h-10 ${
                    isAligned ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
              </div>

              {/* Arrow Indicator at top */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-slate-500 opacity-50"></div>
              </div>
            </div>

            {/* GUIDANCE TEXT */}
            <div className="w-full bg-slate-900/60 rounded-2xl p-6 border border-slate-800 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-700">
              {/* 1. Alignment Status */}
              <div className="flex items-center justify-center h-16 mb-4">
                {isAligned ? (
                  <div className="text-emerald-400 text-2xl font-bold animate-bounce flex items-center gap-2">
                    ✓ You are facing Qibla
                  </div>
                ) : (
                  <div
                    className={`text-2xl font-bold flex items-center gap-3 ${
                      turnDirection === "RIGHT"
                        ? "text-amber-400"
                        : "text-amber-400"
                    }`}
                  >
                    {turnDirection === "LEFT" ? (
                      <>
                        <ArrowLeft className="w-8 h-8 animate-pulse" />
                        <span>Turn Left</span>
                      </>
                    ) : (
                      <>
                        <span>Turn Right</span>
                        <ArrowRight className="w-8 h-8 animate-pulse" />
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-700 w-full mb-4"></div>

              {/* 2. Numeric Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">
                    Your Heading
                  </span>
                  <span className="text-2xl font-mono text-white">
                    {compassHeading.toFixed(0)}°
                  </span>
                </div>
                <div className="flex flex-col border-l border-slate-700">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">
                    Qibla Angle
                  </span>
                  <span className="text-2xl font-mono text-emerald-400">
                    {qiblaBearing.toFixed(0)}°
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// --- Custom Kaaba Icon ---
function KaabaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" fill="black" />
      <path d="M4 8h16v3H4z" fill="#FBBF24" />
      <path d="M13 14h4v6h-4z" fill="#374151" />
    </svg>
  );
}
