"use client";

import { useEffect, useState, useCallback } from "react";
import { Compass, Navigation, Loader2, MapPin } from "lucide-react";

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

  // 1. Calculate the Great Circle Bearing to Mecca
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

    // Normalize to 0-360
    setQiblaBearing((bearing + 360) % 360);
    setLoading(false);
  }, []);

  // 2. Init Location Logic
  useEffect(() => {
    // Check if device is iOS (requires specific permission button)
    const isIOSDevice =
      typeof window !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function";
    setIsIOS(isIOSDevice);

    // Auto-start for non-iOS or get location immediately
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        calculateQibla(position.coords.latitude, position.coords.longitude);
        // If not iOS, we can usually start listening to orientation immediately
        if (!isIOSDevice) {
          setPermissionGranted(true);
        }
      },
      (err) => {
        setLocationError("Please enable location services to find Qibla.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, [calculateQibla]);

  // 3. Handle Device Orientation (The Compass)
  useEffect(() => {
    if (!permissionGranted) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading = 0;

      // iOS Webkit property
      if ((event as any).webkitCompassHeading) {
        heading = (event as any).webkitCompassHeading;
      }
      // Android / Standard Non-absolute
      else if (event.alpha !== null) {
        heading = 360 - event.alpha;
      }

      setCompassHeading(heading);
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [permissionGranted]);

  // 4. Request Permission (Required for iOS 13+)
  const requestCompassPermission = async () => {
    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const response = await (
          DeviceOrientationEvent as any
        ).requestPermission();
        if (response === "granted") {
          setPermissionGranted(true);
        } else {
          alert("Permission denied. We cannot show the compass rotation.");
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setPermissionGranted(true);
    }
  };

  // Calculate rotation: We want the compass to rotate opposite to the phone
  // The Qibla Marker should stay at the absolute Qibla bearing relative to North
  const compassRotation = -compassHeading;

  // Calculate if aligned (within ±5 degrees)
  const isAligned =
    Math.abs(((compassHeading - qiblaBearing + 540) % 360) - 180) < 5;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 z-0" />

      {/* Content */}
      <div className="z-10 flex flex-col items-center gap-8 max-w-md w-full text-center">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-md">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">
              Mecca, Saudi Arabia
            </span>
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Qibla Finder
          </h1>
        </div>

        {/* Error State */}
        {locationError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {locationError}
          </div>
        )}

        {/* Loading State */}
        {loading && !locationError && (
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 className="animate-spin w-8 h-8" />
            <p>Acquiring GPS Signal...</p>
          </div>
        )}

        {/* Main Compass UI */}
        {!loading && !locationError && (
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* 1. The Rotating Compass Dial (Moves as you turn phone) */}
            <div
              className="absolute w-full h-full rounded-full border-2 border-slate-700 bg-slate-900/50 shadow-2xl backdrop-blur-sm transition-transform duration-300 ease-out will-change-transform"
              style={{ transform: `rotate(${compassRotation}deg)` }}
            >
              {/* North Marker */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-red-500 font-bold text-lg">N</span>
                <div className="w-0.5 h-2 bg-red-500/50"></div>
              </div>

              {/* Cardinal Points */}
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-500 text-xs font-medium">
                S
              </span>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium">
                W
              </span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-medium">
                E
              </span>

              {/* Ticks */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-1/2 h-full w-0.5 bg-gradient-to-b from-slate-700 via-transparent to-slate-700 opacity-30"
                  style={{ transform: `rotate(${i * 30}deg)` }}
                />
              ))}

              {/* THE QIBLA INDICATOR (Fixed to the map bearing on the dial) */}
              <div
                className="absolute top-0 left-1/2 h-1/2 w-0 origin-bottom"
                style={{ transform: `rotate(${qiblaBearing}deg)` }}
              >
                {/* The Icon that points to Mecca */}
                <div className="absolute -top-1 -left-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse">
                  <Navigation className="w-3 h-3 text-emerald-950 fill-current transform rotate-180" />
                </div>
              </div>
            </div>

            {/* 2. Static Center Indicator (Phone Direction) */}
            <div
              className={`relative z-20 w-16 h-16 rounded-full border-4 flex items-center justify-center bg-slate-800 transition-colors duration-500 ${
                isAligned
                  ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  : "border-slate-600"
              }`}
            >
              <Compass
                className={`w-8 h-8 ${
                  isAligned ? "text-emerald-400" : "text-slate-400"
                }`}
              />
            </div>

            {/* Static top triangle indicating "Forward" */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-slate-500">
              <div className="w-0.5 h-4 bg-emerald-500/50 mx-auto mb-1"></div>
            </div>
          </div>
        )}

        {/* Feedback Text & iOS Button */}
        {!loading && !locationError && (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-sm uppercase tracking-wider">
                Qibla Angle
              </span>
              <span className="text-3xl font-mono font-light text-white">
                {qiblaBearing.toFixed(0)}°
              </span>
            </div>

            {isIOS && !permissionGranted && (
              <button
                onClick={requestCompassPermission}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
              >
                Enable Compass
              </button>
            )}

            {isAligned && (
              <div className="text-emerald-400 font-medium animate-bounce mt-4">
                You are facing the Qibla!
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
