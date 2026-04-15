"use client";

import { useRef, useEffect, useCallback } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4";

const FADE_DURATION = 0.5; // seconds

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);

  const fadeLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const { currentTime, duration } = video;

    if (duration && duration > 0) {
      // Fade in during first 0.5s
      if (currentTime < FADE_DURATION) {
        video.style.opacity = String(Math.min(currentTime / FADE_DURATION, 1));
      }
      // Fade out during last 0.5s
      else if (currentTime > duration - FADE_DURATION) {
        const remaining = duration - currentTime;
        video.style.opacity = String(Math.max(remaining / FADE_DURATION, 0));
      }
      // Full opacity in the middle
      else {
        video.style.opacity = "1";
      }
    }

    rafRef.current = requestAnimationFrame(fadeLoop);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = "0";

    const handleEnded = () => {
      cancelAnimationFrame(rafRef.current);
      video.style.opacity = "0";
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
        rafRef.current = requestAnimationFrame(fadeLoop);
      }, 100);
    };

    const handlePlay = () => {
      rafRef.current = requestAnimationFrame(fadeLoop);
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);

    // Auto-play
    video.play().catch(() => {});

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
    };
  }, [fadeLoop]);

  return (
    <video
      ref={videoRef}
      src={VIDEO_URL}
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity: 0 }}
    />
  );
}
