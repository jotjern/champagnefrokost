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

type TequilaTimerProps = {
  audioContext: AudioContext | null;
};

const TequilaTimer = ({ audioContext }: TequilaTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [intervalsPerHour, setIntervalsPerHour] = useState(6);
  const [nextTarget, setNextTarget] = useState(0);
  const [showZero, setShowZero] = useState(false);
  const [audioTriggered, setAudioTriggered] = useState(false);
  const [figures, setFigures] = useState<Figure[]>([]);

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
        image: `/figures/figure${1}.png`,
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

  const playAlert = useCallback(async () => {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-orange-100 to-yellow-100 flex flex-col items-center justify-center p-4 relative">
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
              Shots/time:
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
                animation: `${figure.flipped ? "shakeFlipped" : "shakeNormal"}
                 ${figure.animationDuration} infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TimelineEvent = ({
  date,
  title,
  description,
}: {
  date: string;
  title: string;
  description: string;
}) => (
  <div className="relative group flex flex-col items-center p-6 bg-orange-50/50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-4 border-dashed border-yellow-300">
    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <span className="text-4xl">🌵</span>
    </div>
    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full mb-4 animate-pulse" />
    <h3 className="text-3xl font-comic mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
      {date}
    </h3>
    <h4 className="font-bold text-xl mb-3 text-pink-700 text-center">
      {title}
    </h4>
    <p className="text-orange-900/80 text-lg leading-snug">{description}</p>
    <div className="absolute -right-8 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <span className="text-4xl animate-bounce">🍋</span>
    </div>
    <div className="absolute -left-8 top-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <span className="text-4xl animate-spin">🍍</span>
    </div>
  </div>
);

const LandingPage = ({ onNavigate }: { onNavigate: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-pink-200 via-orange-100 to-yellow-100 p-8 overflow-hidden">
    <div className="max-w-4xl mx-auto mt-16">
      <div className="bg-orange-50/80 rounded-2xl shadow-xl p-8 mb-12 border-4 border-yellow-300 backdrop-blur-sm">
        <h2 className="text-4xl mb-6 text-pink-700 font-comic">
          ¡Velkommen til den fjerde årlige Agaveaften!
        </h2>
        <p className="text-xl text-orange-900/90 mb-8 leading-relaxed">
          Gjør dere klare for{" "}
          <span className="font-bold text-pink-600">Agaveaften 2025</span>! For
          fjerde år på rad samles en gjeng tullinger for en rolig kveld med
          tequilasmaking{":)"}
        </p>
        <button
          onClick={onNavigate}
          className="mx-auto block bg-gradient-to-r from-pink-500 to-orange-500 hover:from-yellow-400 hover:to-pink-600 text-white px-12 py-4 rounded-full text-2xl font-bold transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-2xl"
        >
          ¡Start Tequila-timer!
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
        <TimelineEvent
          date={"23. Feb 2022"}
          title="Den første kvelden"
          description="4 deltagere, 3 flasker tequila og en drøm"
        />
        <TimelineEvent
          date={"4. Mar 2023"}
          title="God nummer to"
          description="Ukjent antall deltagere. Lite som huskes"
        />
        <TimelineEvent
          date={"26. Apr 2024"}
          title="Sliten kjellergjeng"
          description="Stappet inn i en kjeller. Fastslått som en tradisjon"
        />
        <TimelineEvent date={"19. Apr 2025"} title="?" description="???" />
      </div>
    </div>
  </div>
);

const Logo = ({ onClick }: { onClick: () => void }) => (
  <div
    className="absolute top-6 left-8 cursor-pointer group z-50"
    onClick={onClick}
  >
    <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse-slow drop-shadow-lg">
      🎉 Agaveaften 2025 🎉
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
        <TequilaTimer audioContext={audioContext} />
      )}
    </div>
  );
}
