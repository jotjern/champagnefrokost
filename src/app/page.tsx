"use client";

import { useState, useEffect, useCallback } from "react";
import Confetti from "react-dom-confetti";
import { Settings } from "lucide-react";
import Image from "next/image";

type Figure = {
  image: string;
  top: number;
  left: number;
  rotation: number;
  size: number;
  animationDuration: string;
  flipped?: boolean;
};

const ChampagneTimer = ({
  audioContext,
}: {
  audioContext: AudioContext | null;
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [intervalsPerHour, setIntervalsPerHour] = useState(2);
  const [nextTarget, setNextTarget] = useState(0);
  const [showZero, setShowZero] = useState(false);
  const [audioTriggered, setAudioTriggered] = useState(false);
  const [figures, setFigures] = useState<Figure[]>([]);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const confettiConfig = {
    spread: 360,
    startVelocity: 30,
    elementCount: 150,
    dragFriction: 0.12,
    duration: 10000,
    colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
  };

  useEffect(() => {
    if (showZero) {
      const figureCount = Math.floor(Math.random() * 10) + 20;
      const newFigures = Array.from({ length: figureCount }, () => ({
        image: `/figures/flagg.png`,
        top: Math.random() * 20 + 70,
        left: Math.random() * 100,
        rotation: Math.random() * 20 - 10,
        size: 8 + Math.random() * 8,
        animationDuration: `${0.3 + Math.random() * 0.3}s`,
        flipped: Math.random() < 0.5,
      }));
      setFigures(newFigures);
    } else {
      setFigures([]);
    }
  }, [showZero]);

  useEffect(() => {
    if (!audioContext) return;

    const loadAudio = async () => {
      try {
        const response = await fetch("/rodthvittogblatt.mp3");
        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(decodedBuffer);
      } catch (error) {
        console.error("Error loading audio:", error);
      }
    };

    loadAudio();
  }, [audioContext]);

  const playAlert = useCallback(() => {
    if (!audioContext || !audioBuffer) return;

    const source = audioContext.createBufferSource();
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

    fetch(`/api/set-spotify-volume?target_volume=0`).then(async (response) => {
      const data = await response.json();
      const start_volume = data["start_volume"];

      setTimeout(
        () => fetch(`/api/set-spotify-volume?target_volume=${start_volume}`),
        42 * 1000
      );
    });
  }, [audioContext, audioBuffer]);

  const calculateNextTarget = useCallback(() => {
    const now = Date.now();
    const msPerInterval = (60 * 60 * 1000) / intervalsPerHour;
    return Math.ceil(now / msPerInterval) * msPerInterval;
  }, [intervalsPerHour]);

  useEffect(() => {
    if (!audioBuffer) return;

    const target = calculateNextTarget();
    setNextTarget(target);

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.floor((target - now) / 1000);

      if (remaining == 40 && !audioTriggered) {
        playAlert();
      }

      if (remaining < 40) {
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
  }, [nextTarget, calculateNextTarget, playAlert, audioTriggered, audioBuffer]);

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
    <div className="min-h-screen bg-gradient-to-br from-red-300 via-white to-blue-300 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="absolute top-4 right-4 p-2 hover:bg-[#d9dadd7a] rounded-full transition-colors"
      >
        <Settings className="w-6 h-6 text-black" />
      </button>
      {settingsOpen && (
        <div className="absolute top-16 right-4 bg-white p-4 rounded-lg shadow-lg text-black">
          <div className="mb-4">
            <label className="flex items-center gap-2">
              Chugs/time:
              <div className="flex items-center">
                <button
                  onClick={() =>
                    setIntervalsPerHour(Math.max(1, intervalsPerHour - 1))
                  }
                  className="w-8 h-8 flex items-center justify-center bg-orange-100 hover:bg-orange-200 rounded-l-md"
                >
                  -
                </button>
                <div className="w-12 py-1 text-center font-bold bg-orange-50">
                  {intervalsPerHour}
                </div>
                <button
                  onClick={() =>
                    setIntervalsPerHour(Math.min(60, intervalsPerHour + 1))
                  }
                  className="w-8 h-8 flex items-center justify-center bg-orange-100 hover:bg-orange-200 rounded-r-md"
                >
                  +
                </button>
              </div>
            </label>
          </div>
        </div>
      )}
      {audioBuffer && (
        <>
          <div
            className={`text-center transition-all duration-300 ${
              showZero ? "scale-150" : "scale-100"
            }`}
          >
            <div
              className={`text-9xl font-bold mb-8 
          ${
            isCritical
              ? "animate-pulse bg-gradient-to-r from-[#6299ff] to-[#BA0C2F]"
              : "bg-gradient-to-r from-[#00205B] to-[#00205bc8]"
          }
          text-transparent bg-clip-text`}
            >
              {formatTime(showZero ? 0 : timeLeft)}
            </div>

            <Confetti active={showZero} config={confettiConfig} />

            {showZero && (
              <div className="animate-bounce text-4xl font-bold text-[#00205B]">
                🥳 SKÅL! 🥳
              </div>
            )}
          </div>
          {isCritical && !showZero && (
            <div className="mt-8 text-2xl text-[#00205B] animate-pulse">
              🚨 Fyll opp glassene! 🚨
            </div>
          )}
          {showZero && (
            <div className="fixed inset-0 pointer-events-none z-50 w-full h-full">
              {figures.map((figure, index) => (
                <Image
                  width={figure.size * 100}
                  height={figure.size * 100}
                  key={index}
                  src={figure.image}
                  alt="Celebration figure"
                  className="absolute"
                  style={{
                    top: `${figure.top}%`,
                    left: `${figure.left}%`,
                    transform: `rotate(${figure.rotation}deg)`,
                    width: `${figure.size}rem`,
                    height: `${figure.size}rem`,
                    animation: `${
                      figure.flipped ? "shakeFlipped" : "shakeNormal"
                    }
                 ${figure.animationDuration} infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const LandingPage = ({ onNavigate }: { onNavigate: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-300 via-white to-blue-300 p-8 overflow-hidden">
    <div className="max-w-4xl mx-auto mt-16">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border-4 border-[#BA0C2F] backdrop-blur-sm">
        <h2 className="text-4xl mb-6 text-[#00205B] font-comic">
          Velkommen til 17. mai på Solsiden!
        </h2>
        <p className="text-xl text-black mb-8 leading-relaxed">
          Gjør dere klare for{" "}
          <span className="font-bold text-[#00205B]">
            ChampagneFrokost 2025
          </span>
          ! Vi feirer eksamensperioden og barnas dag med å drikke oss kanakkas
          drita klokken 9 om morgenen 🥳
        </p>
        <button
          onClick={onNavigate}
          className="mx-auto cursor-pointer block bg-gradient-to-r from-[#00205B] to-[#BA0C2F] hover:to-[#00205B] hover:from-[#BA0C2F] text-white px-12 py-4 rounded-full text-2xl font-bold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-2xl"
        >
          🇳🇴 Start Sjæmpis-timer! 🇳🇴
        </button>
      </div>
    </div>
  </div>
);

const Logo = ({ onClick }: { onClick: () => void }) => (
  <div
    className="absolute top-6 left-8 cursor-pointer group z-50"
    onClick={onClick}
  >
    <h1 className="text-3xl font-extrabold text-center  drop-shadow-lg animate-pulse-slow">
      <span className="bg-clip-text text-transparent bg-[url('/bg.png')] bg-[length:100%_100%] bg-no-repeat">
        🍾
      </span>{" "}
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#BA0C2F] to-[#00205B]">
        ChampagneFrokost 2025
      </span>
      <span className="bg-clip-text text-transparent bg-[url('/bg.png')] bg-[length:100%_100%] bg-no-repeat">
        🍾
      </span>{" "}
    </h1>
  </div>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "timer">("home");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const handleNavigateToTimer = () => {
    const context = new AudioContext();
    setAudioContext(context);
    setCurrentPage("timer");
  };

  return (
    <div className="relative overflow-hidden">
      <Logo onClick={() => setCurrentPage("home")} />

      {currentPage === "home" ? (
        <LandingPage onNavigate={handleNavigateToTimer} />
      ) : (
        <ChampagneTimer audioContext={audioContext} />
      )}
    </div>
  );
}
