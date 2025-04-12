"use client";

import { useState, useEffect, useCallback } from "react";
import Confetti from "react-dom-confetti";
import { Settings } from "lucide-react";

const TequilaTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [intervalsPerHour, setIntervalsPerHour] = useState(6);
  const [nextTarget, setNextTarget] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [showZero, setShowZero] = useState(false);
  const [audioTriggered, setAudioTriggered] = useState(false);

  const confettiConfig = {
    spread: 360,
    startVelocity: 30,
    elementCount: 150,
    dragFriction: 0.12,
    duration: 10000,
    colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
  };

  const playAlert = useCallback(async () => {
    if (!audioContext) {
      const newAudioContext = new AudioContext();
      setAudioContext(newAudioContext);
    }

    const source = audioContext?.createBufferSource();
    if (source && audioContext) {
      const response = await fetch("/tequila.mp3");
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      source.buffer = audioBuffer;
      const gainNode = audioContext.createGain();

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startTime = audioContext.currentTime;
      source.start(0);

      gainNode.gain.setValueAtTime(1, startTime);
      gainNode.gain.setValueAtTime(1, startTime + 55);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 60);

      source.stop(startTime + 60);
      setAudioTriggered(true);
    }
  }, [audioContext]);

  const calculateNextTarget = useCallback(() => {
    const now = Date.now();
    const msPerInterval = (60 * 60 * 1000) / intervalsPerHour;
    return Math.ceil(now / msPerInterval) * msPerInterval;
  }, [intervalsPerHour]);

  useEffect(() => {
    const target = calculateNextTarget();
    setNextTarget(target);

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.floor((target - now) / 1000);

      if (remaining <= 52 && remaining >= 50 && !audioTriggered) {
        playAlert();
      }

      if (remaining < 50) {
        setAudioTriggered(false);
      }

      if (remaining <= 0) {
        setShowZero(true);
        setTimeout(() => {
          setNextTarget(calculateNextTarget());
          setShowZero(false);
          setAudioTriggered(false);
        }, 10000);
      } else {
        setTimeLeft(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextTarget, calculateNextTarget, playAlert, audioTriggered]);

  const formatTime = (seconds: number) => {
    if (showZero) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const isCritical = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-yellow-100 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="absolute top-4 right-4 p-2 hover:bg-yellow-200 rounded-full transition-colors"
      >
        <Settings className="w-6 h-6 text-black" />
      </button>

      {settingsOpen && (
        <div className="absolute top-16 right-4 bg-white p-4 rounded-lg shadow-lg text-black">
          <div className="mb-4">
            <label className="flex items-center gap-2">
              Intervals/hour:
              <input
                type="number"
                min="1"
                max="60"
                value={intervalsPerHour}
                onChange={(e) =>
                  setIntervalsPerHour(
                    Math.max(1, Math.min(60, Number(e.target.value)))
                  )
                }
                className="w-16 px-2 py-1 border rounded"
              />
            </label>
          </div>
        </div>
      )}

      <div
        className={`text-center transition-all duration-300 ${
          showZero ? "scale-150" : "scale-100"
        }`}
      >
        <div
          className={`text-9xl font-bold mb-8 
          ${
            isCritical
              ? "animate-pulse bg-gradient-to-r from-red-500 to-yellow-500"
              : "bg-gradient-to-r from-blue-500 to-green-500"
          }
          text-transparent bg-clip-text`}
        >
          {formatTime(showZero ? 0 : timeLeft)}
        </div>

        <Confetti active={showZero} config={confettiConfig} />

        {showZero && (
          <div className="animate-bounce text-4xl font-bold text-red-600">
            🥳 ¡TEQUILA! 🥳
          </div>
        )}
      </div>

      {isCritical && !showZero && (
        <div className="mt-8 text-2xl text-red-600 animate-pulse">
          🚨 ¡Gjør klar shots! 🚨
        </div>
      )}
    </div>
  );
};

export default TequilaTimer;
