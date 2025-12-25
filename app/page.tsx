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

    let bearing = (Math.atan2(y, x) * 180.0) / Math.PI;
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

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 z-0" />

      <div className="z-10 flex flex-col items-center gap-6 max-w-md w-full text-center">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-md">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">
              Mecca, Saudi Arabia
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">Qibla Finder</h1>
        </div>

        {locationError && (
          <div className="text-red-400 bg-red-900/20 p-4 rounded-lg">
            {locationError}
          </div>
        )}

        {loading && !locationError && (
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8" />
            <p>Calibrating...</p>
          </div>
        )}

        {!loading && !locationError && (
          <>
            {/* COMPASS VISUAL */}
            <div className="relative w-72 h-72 flex items-center justify-center my-4">
              {/* Rotating Dial */}
              <div
                className="absolute w-full h-full rounded-full border-2 border-slate-700 bg-slate-900/80 shadow-2xl backdrop-blur-sm transition-transform duration-300 ease-out will-change-transform"
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

                {/* --- QIBLA MARKER (CUSTOM KAABA ICON) --- */}
                <div
                  className="absolute top-0 left-1/2 h-1/2 w-0 origin-bottom"
                  style={{ transform: `rotate(${qiblaBearing}deg)` }}
                >
                  {/* Container for the Kaaba Icon */}
                  <div className="absolute -top-3 -left-4 w-8 h-8 bg-slate-900 rounded-lg border border-slate-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] z-50">
                    <KaabaIcon className="w-6 h-6" />
                  </div>

                  {/* Green line connecting center to Kaaba */}
                  <div className="absolute top-5 left-[-1px] w-0.5 h-[calc(100%-20px)] bg-emerald-500/30"></div>
                </div>
              </div>

              {/* Static Phone Pointer (Center) */}
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

              {/* Arrow Indicator at top of phone */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-slate-500 opacity-50"></div>
              </div>
            </div>

            {/* GUIDANCE TEXT */}
            <div className="w-full bg-slate-900/60 rounded-2xl p-6 border border-slate-800 backdrop-blur-md">
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

            {isIOS && !permissionGranted && (
              <button
                onClick={requestCompassPermission}
                className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold w-full transition-all active:scale-95"
              >
                Tap to Enable Compass
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// --- Custom Kaaba Icon Component ---
function KaabaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main Cube Body (Black) */}
      <rect x="4" y="4" width="16" height="16" rx="2" fill="black" />

      {/* Gold Band (Yellow/Gold) */}
      <path d="M4 8h16v3H4z" fill="#FBBF24" />

      {/* Door details (Subtle) */}
      <path d="M13 14h4v6h-4z" fill="#374151" />
    </svg>
  );
}
