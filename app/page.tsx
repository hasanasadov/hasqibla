"use client";

import { useEffect, useState } from "react";

export default function QiblaFinder() {
  const [qibla, setQibla] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const direction = getQiblaDirection(latitude, longitude);
        setQibla(direction);
      },
      () => {
        setError("Location permission denied.");
      }
    );
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1.5rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1>🕌 Qibla Finder</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {qibla !== null ? (
        <>
          <div
            style={{
              width: "150px",
              height: "150px",
              border: "3px solid black",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "3rem",
                transform: `rotate(${qibla}deg)`,
                transition: "transform 0.3s ease",
              }}
            >
              ↑
            </div>
          </div>

          <p>
            Qibla Direction: <strong>{qibla.toFixed(2)}°</strong>
          </p>
        </>
      ) : (
        !error && <p>Finding your location…</p>
      )}
    </main>
  );
}

/* ------------------ Qibla Math ------------------ */

function getQiblaDirection(lat: number, lon: number): number {
  const kaabaLat = (21.4225 * Math.PI) / 180;
  const kaabaLon = (39.8262 * Math.PI) / 180;

  const userLat = (lat * Math.PI) / 180;
  const userLon = (lon * Math.PI) / 180;

  const y = Math.sin(kaabaLon - userLon);
  const x =
    Math.cos(userLat) * Math.tan(kaabaLat) -
    Math.sin(userLat) * Math.cos(kaabaLon - userLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}
