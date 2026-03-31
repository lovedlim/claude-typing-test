"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getRandomMessage } from "@/lib/loading-messages";

interface FloatingMsg {
  id: number;
  text: string;
  x: number;
  y: number;
  duration: number;
  delay: number;
  size: "sm" | "md" | "lg";
}

function FloatingMessages() {
  const [messages, setMessages] = useState<FloatingMsg[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const initial: FloatingMsg[] = Array.from({ length: 12 }, () => ({
      id: idRef.current++,
      text: getRandomMessage(),
      x: Math.random() * 100,
      y: 20 + Math.random() * 70,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 4,
      size: (["sm", "md", "lg"] as const)[Math.floor(Math.random() * 3)],
    }));
    setMessages(initial);

    const interval = setInterval(() => {
      setMessages((prev) => {
        const filtered = prev.slice(-20);
        return [
          ...filtered,
          {
            id: idRef.current++,
            text: getRandomMessage(),
            x: Math.random() * 90 + 5,
            y: 85 + Math.random() * 10,
            duration: 9 + Math.random() * 8,
            delay: 0,
            size: (["sm", "md", "lg"] as const)[Math.floor(Math.random() * 3)],
          },
        ];
      });
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {messages.map((msg) => (
        <motion.div
          key={msg.id}
          className={`absolute font-mono select-none whitespace-nowrap ${sizeClasses[msg.size]}`}
          style={{ left: `${msg.x}%`, top: `${msg.y}%` }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.18, 0.18, 0], y: -180 }}
          transition={{
            duration: msg.duration,
            delay: msg.delay,
            ease: "easeOut",
            times: [0, 0.1, 0.7, 1],
          }}
          onAnimationComplete={() => {
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
          }}
        >
          <span className="text-green-500">{msg.text}</span>
          <span className="text-green-700 animate-pulse">...</span>
        </motion.div>
      ))}
    </div>
  );
}

const BOOT_LINES = [
  { text: "$ claude-typing-test --init", delay: 0 },
  { text: "> Loading Claude Code Education System...", delay: 400 },
  { text: "> Connecting to anthropic servers... OK", delay: 900 },
  { text: "> Verifying terminal capabilities... OK", delay: 1400 },
  { text: "> Checking keyboard response rate... OK", delay: 1900 },
  { text: "> SYSTEM READY", delay: 2500, highlight: true },
];

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

function AnimatedKey({ char, delay }: { char: string; delay: number }) {
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => {
        if (Math.random() < 0.08) {
          setLit(true);
          setTimeout(() => setLit(false), 150);
        }
      },
      100 + delay * 10
    );
    return () => clearInterval(interval);
  }, [delay]);

  return (
    <motion.div
      className={`
        w-8 h-8 rounded flex items-center justify-center text-xs font-bold uppercase
        border transition-all duration-100 select-none
        ${
          lit
            ? "bg-green-500 border-green-400 text-black shadow-[0_0_12px_rgba(34,197,94,0.8)]"
            : "bg-gray-900 border-gray-700 text-gray-500"
        }
      `}
      whileHover={{ scale: 1.1, borderColor: "#22c55e" }}
    >
      {char}
    </motion.div>
  );
}

function BootTerminal({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, i]);
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => setDone(true), 600);
        }
      }, line.delay);
    });
  }, []);

  useEffect(() => {
    if (!done) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") onComplete();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [done, onComplete]);

  return (
    <div className="font-mono text-sm space-y-2">
      {BOOT_LINES.map((line, i) => (
        <AnimatePresence key={i}>
          {visibleLines.includes(i) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={
                line.highlight ? "text-green-400 font-bold" : "text-gray-400"
              }
            >
              {line.text}
              {i === BOOT_LINES.length - 1 && (
                <span className="cursor-blink ml-1 text-green-400">█</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      <AnimatePresence>
        {done && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onComplete}
            className="mt-6 px-8 py-3 border border-green-500 text-green-400 rounded
              hover:bg-green-500 hover:text-black transition-all duration-200
              font-bold text-base tracking-widest uppercase
              shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]
              relative overflow-hidden group"
          >
            <span className="relative z-10">[ 테스트 시작 ] →</span>
            <span className="relative z-10 ml-3 text-xs text-green-600 font-normal normal-case tracking-normal">
              또는 Enter ↵
            </span>
            <motion.div
              className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-10"
              initial={false}
            />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [booted, setBooted] = useState(false);
  const [showMain, setShowMain] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowMain(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    router.push("/test");
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <FloatingMessages />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500 opacity-[0.03] blur-3xl" />
      </div>

      <AnimatePresence>
        {showMain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl space-y-8 relative z-10"
          >
            {/* Header badge */}
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="ml-2">claude-code-edu — typing_test v1.0</span>
            </div>

            {/* Main terminal window */}
            <div
              className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden
              shadow-[0_0_60px_rgba(0,0,0,0.5)]"
            >
              {/* Title bar */}
              <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  ⚡ Claude Code Education — Entry Test
                </span>
                <span className="text-xs text-gray-600 font-mono">
                  made by <span className="text-green-600">SideOnAI</span>
                </span>
              </div>

              <div className="p-10 space-y-8">
                {/* Title */}
                <div>
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl font-bold text-white leading-tight"
                  >
                    Claude Code 교육
                    <br />
                    <span className="text-green-400 text-glow-green">
                      입장 테스트
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400 mt-3 text-sm leading-relaxed"
                  >
                    Claude Code 교육에 참여하기 전, 터미널 명령어 영타 속도를
                    측정합니다.
                    <br />
                    <span className="text-green-400 font-semibold">
                      25 WPM 이상
                    </span>
                    이면 교육 신청이 가능합니다. 35·45 WPM은 특별 등급!
                  </motion.p>
                </div>

                {/* Rules */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-3 gap-4"
                >
                  {[
                    {
                      icon: "⏱",
                      title: "60초",
                      desc: "제한 시간",
                      color: "blue",
                    },
                    {
                      icon: "⌨️",
                      title: "25 WPM",
                      desc: "최소 합격",
                      color: "green",
                    },
                    {
                      icon: "🎯",
                      title: "정확도",
                      desc: "함께 측정",
                      color: "amber",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center"
                    >
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <div
                        className={`text-lg font-bold ${
                          item.color === "green"
                            ? "text-green-400"
                            : item.color === "blue"
                              ? "text-blue-400"
                              : "text-amber-400"
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                  ))}
                </motion.div>

                {/* Boot terminal */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-black rounded-lg p-8 border border-gray-800 min-h-[200px]"
                >
                  <BootTerminal onComplete={handleStart} />
                </motion.div>
              </div>
            </div>

            {/* Keyboard decoration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col items-center gap-1.5 opacity-60"
            >
              {KEYBOARD_ROWS.map((row, ri) => (
                <div key={ri} className="flex gap-1">
                  {row.map((char, ci) => (
                    <AnimatedKey
                      key={char}
                      char={char}
                      delay={ri * 10 + ci}
                    />
                  ))}
                </div>
              ))}
            </motion.div>

            {/* Bottom row: warning + leaderboard link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-xs text-gray-600 font-mono">
                ⚠ 타이핑이 느린 경우, 결과 화면에서 연습 팁을 확인하세요
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-700 font-mono hidden sm:block">
                  SideOnAI(퇴근후딴짓)
                </span>
                <button
                  onClick={() => router.push("/leaderboard")}
                  className="text-xs text-gray-500 hover:text-amber-400 transition-colors font-mono flex items-center gap-1"
                >
                  🏆 리더보드
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
