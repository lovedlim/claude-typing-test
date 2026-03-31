"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  getShuffledCommands,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type CommandEntry,
} from "@/lib/commands";
import { calculateWPM, calculateAccuracy, buildResult, saveResult } from "@/lib/wpm";
import { getRandomMessage } from "@/lib/loading-messages";
import Timer from "@/components/Timer";
import HUD from "@/components/HUD";

const TOTAL_TIME = 60;

interface CharState {
  char: string;
  status: "pending" | "correct" | "wrong";
}

function buildCharStates(text: string): CharState[] {
  return text.split("").map((char) => ({ char, status: "pending" as const }));
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
}

interface TypingMsg {
  id: number;
  text: string;
  x: number;
  y: number;
}

export default function TestPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Command state
  const [commands, setCommands] = useState<CommandEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [typedValue, setTypedValue] = useState("");

  // Timer
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  // Stats - using refs for real-time calculation
  const completedCorrectCharsRef = useRef(0); // chars from finished commands
  const completedTotalTypedRef = useRef(0);   // total keystrokes from finished commands
  const commandsCompletedRef = useRef(0);
  const currentCorrectCharsRef = useRef(0);   // correct chars in current command
  const elapsedRef = useRef(0);

  // Display stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [commandsCompleted, setCommandsCompleted] = useState(0);
  const [streak, setStreak] = useState(0);

  // Effects
  const [particles, setParticles] = useState<Particle[]>([]);
  const [screenFlash, setScreenFlash] = useState<"" | "green" | "red">("");
  const [shake, setShake] = useState(false);
  const [koreanWarning, setKoreanWarning] = useState(false);
  const koreanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [typingMsgs, setTypingMsgs] = useState<TypingMsg[]>([]);
  const typingMsgIdRef = useRef(0);
  const keystrokeCountRef = useRef(0);

  const particleIdRef = useRef(0);
  const finishedRef = useRef(false);

  // Load commands on mount
  useEffect(() => {
    const shuffled = getShuffledCommands();
    setCommands(shuffled);
    setCharStates(buildCharStates(shuffled[0]?.command ?? ""));
    inputRef.current?.focus();
  }, []);

  // Calculate and update live stats
  const updateStats = useCallback(() => {
    const totalCorrect = completedCorrectCharsRef.current + currentCorrectCharsRef.current;
    const totalTyped = completedTotalTypedRef.current;
    const elapsed = elapsedRef.current;
    setWpm(calculateWPM(totalCorrect, elapsed));
    setAccuracy(calculateAccuracy(totalCorrect, totalTyped > 0 ? totalTyped : 1));
  }, []);

  // Finish test and navigate to result
  const finishTest = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);

    const totalCorrect = completedCorrectCharsRef.current + currentCorrectCharsRef.current;
    const result = buildResult({
      correctChars: totalCorrect,
      totalTyped: completedTotalTypedRef.current,
      commandsCompleted: commandsCompletedRef.current,
      duration: elapsedRef.current || TOTAL_TIME,
    });
    saveResult(result);
    setTimeout(() => router.push("/result"), 800);
  }, [router]);

  // Timer tick
  useEffect(() => {
    if (!started || finished) return;
    const interval = setInterval(() => {
      if (pausedRef.current) return;
      setTimeLeft((prev) => {
        const next = prev - 1;
        elapsedRef.current = TOTAL_TIME - next;
        updateStats();
        if (next <= 0) {
          clearInterval(interval);
          finishTest();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, finished, finishTest, updateStats]);

  // 다음 명령어로 스킵
  const skipCommand = useCallback(() => {
    if (!started || finished || pausedRef.current) return;
    const nextIndex = currentIndex + 1;
    let nextCommands = commands;
    if (nextIndex >= commands.length) {
      const extra = getShuffledCommands();
      nextCommands = [...commands, ...extra];
      setCommands(nextCommands);
    }
    setCurrentIndex(nextIndex);
    setCharStates(buildCharStates(nextCommands[nextIndex]?.command ?? ""));
    setTypedValue("");
    if (inputRef.current) inputRef.current.value = "";
    currentCorrectCharsRef.current = 0;
    setTimeout(() => inputRef.current?.focus(), 10);
  }, [started, finished, currentIndex, commands]);

  // ESC → 일시정지 / Tab → 스킵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && started && !finished) {
        const next = !pausedRef.current;
        pausedRef.current = next;
        setPaused(next);
        if (!next) setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Tab" && started && !finished) {
        e.preventDefault();
        skipCommand();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [started, finished, skipCommand]);

  // Spawn particles
  const spawnParticles = useCallback((color: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + 80;
    const count = 8;
    const newP: Particle[] = Array.from({ length: count }, () => ({
      id: particleIdRef.current++,
      x: cx + (Math.random() - 0.5) * 60,
      y: cy + (Math.random() - 0.5) * 20,
      color,
      dx: (Math.random() - 0.5) * 160,
      dy: (Math.random() - 0.5) * 100 - 40,
    }));
    setParticles((prev) => [...prev.slice(-40), ...newP]);
    setTimeout(() => {
      const ids = new Set(newP.map((p) => p.id));
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 700);
  }, []);

  // Handle typing
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (finishedRef.current) return;
      const value = e.target.value;

      // Start timer on first key
      if (pausedRef.current) return;

      if (!started && value.length > 0) {
        setStarted(true);
      }

      // 한글 감지
      if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(value)) {
        setKoreanWarning(true);
        setTypedValue("");
        if (inputRef.current) inputRef.current.value = "";
        if (koreanTimerRef.current) clearTimeout(koreanTimerRef.current);
        koreanTimerRef.current = setTimeout(() => setKoreanWarning(false), 3000);
        return;
      }

      // 공백 문자 정규화 (IME 차이로 인한 non-breaking space 등 대응)
      const normalize = (s: string) => s.replace(/\s/g, " ");
      const normalizedValue = normalize(value);

      setTypedValue(normalizedValue);
      if (inputRef.current && inputRef.current.value !== normalizedValue) {
        inputRef.current.value = normalizedValue;
      }

      const cmd = commands[currentIndex];
      if (!cmd) return;
      const target = cmd.command;
      const normalizedTarget = normalize(target);

      // Update char states
      const newStates: CharState[] = normalizedTarget.split("").map((char, i) => {
        if (i >= normalizedValue.length) return { char, status: "pending" as const };
        return {
          char,
          status: (normalizedValue[i] === char ? "correct" : "wrong") as "correct" | "wrong",
        };
      });
      setCharStates(newStates);

      // Track correct chars in current command
      const currentCorrect = newStates.filter((s) => s.status === "correct").length;
      currentCorrectCharsRef.current = currentCorrect;

      // Track total keystrokes
      completedTotalTypedRef.current =
        completedTotalTypedRef.current + 1;

      // Spawn typing message every 8 correct keystrokes
      if (normalizedValue[normalizedValue.length - 1] === normalizedTarget[normalizedValue.length - 1]) {
        keystrokeCountRef.current += 1;
        if (keystrokeCountRef.current % 8 === 0 && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const msgId = typingMsgIdRef.current++;
          const newMsg: TypingMsg = {
            id: msgId,
            text: getRandomMessage(),
            x: rect.left + 40 + Math.random() * (rect.width - 120),
            y: rect.top + 20 + Math.random() * (rect.height - 40),
          };
          setTypingMsgs((prev) => [...prev.slice(-12), newMsg]);
          setTimeout(() => {
            setTypingMsgs((prev) => prev.filter((m) => m.id !== msgId));
          }, 2200);
        }
      }

      // Update streak
      const lastChar = normalizedValue[normalizedValue.length - 1];
      const expectedChar = normalizedTarget[normalizedValue.length - 1];
      if (lastChar === expectedChar) {
        setStreak((prev) => {
          const next = prev + 1;
          if (next > 0 && next % 10 === 0) {
            spawnParticles("#f59e0b");
            setScreenFlash("green");
            setTimeout(() => setScreenFlash(""), 350);
          }
          return next;
        });
      } else {
        setStreak(0);
        // Wrong key shake
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setScreenFlash("red");
        setTimeout(() => setScreenFlash(""), 200);
      }

      // Command completed?
      if (normalizedValue === normalizedTarget) {
        // Flush current command stats to completed refs
        completedCorrectCharsRef.current += target.length;
        currentCorrectCharsRef.current = 0;
        commandsCompletedRef.current += 1;
        setCommandsCompleted(commandsCompletedRef.current);

        spawnParticles("#22c55e");
        setScreenFlash("green");
        setTimeout(() => setScreenFlash(""), 350);

        // Burst 3 messages on command complete
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const burstMsgs: TypingMsg[] = Array.from({ length: 3 }, (_, i) => ({
            id: typingMsgIdRef.current++,
            text: getRandomMessage(),
            x: rect.left + 60 + ((rect.width - 120) / 3) * i + Math.random() * 80,
            y: rect.top + 30 + Math.random() * (rect.height / 2),
          }));
          setTypingMsgs((prev) => [...prev.slice(-12), ...burstMsgs]);
          burstMsgs.forEach((m) => {
            setTimeout(() => {
              setTypingMsgs((prev) => prev.filter((msg) => msg.id !== m.id));
            }, 2200);
          });
        }

        // Load next command
        const nextIndex = currentIndex + 1;
        let nextCommands = commands;

        if (nextIndex >= commands.length) {
          const extra = getShuffledCommands();
          nextCommands = [...commands, ...extra];
          setCommands(nextCommands);
        }

        setCurrentIndex(nextIndex);
        setCharStates(buildCharStates(nextCommands[nextIndex]?.command ?? ""));
        setTypedValue("");
      }

      updateStats();
    },
    [started, commands, currentIndex, spawnParticles, updateStats]
  );

  const currentCommand = commands[currentIndex];
  const cursorPos = typedValue.length;

  return (
    <div
      className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Screen flash */}
      <AnimatePresence>
        {screenFlash === "green" && (
          <motion.div
            key="flash-green"
            className="fixed inset-0 pointer-events-none z-50 bg-green-500"
            initial={{ opacity: 0.12 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        )}
        {screenFlash === "red" && (
          <motion.div
            key="flash-red"
            className="fixed inset-0 pointer-events-none z-50 bg-red-600"
            initial={{ opacity: 0.12 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="fixed w-2 h-2 rounded-full pointer-events-none z-50"
          style={{
            backgroundColor: p.color,
            left: p.x,
            top: p.y,
            boxShadow: `0 0 8px ${p.color}`,
          }}
          initial={{ scale: 1.2, opacity: 1, x: 0, y: 0 }}
          animate={{ scale: 0, opacity: 0, x: p.dx, y: p.dy }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}

      {/* Typing floating messages */}
      {typingMsgs.map((msg) => (
        <motion.div
          key={msg.id}
          className="fixed pointer-events-none z-40 font-mono text-sm select-none"
          style={{ left: msg.x, top: msg.y }}
          initial={{ opacity: 0, y: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.9, 0.9, 0], y: -70, scale: [0.8, 1, 1, 0.9] }}
          transition={{ duration: 2.1, ease: "easeOut", times: [0, 0.12, 0.7, 1] }}
        >
          <span className="text-green-400 font-bold">{msg.text}</span>
          <span className="text-green-600">...</span>
        </motion.div>
      ))}

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-green-500 opacity-[0.02] blur-3xl" />
      </div>

      <div className="w-full max-w-3xl space-y-5 relative z-10">
        {/* Window chrome */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="ml-2">claude-typing-test — live</span>
          </div>
          <div className="flex items-center gap-3">
            {!started && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-xs text-amber-400 font-mono"
              >
                ▶ 첫 글자를 입력하면 시작됩니다
              </motion.div>
            )}
            {started && !finished && (
              <div className="flex items-center gap-2">
                <button
                  onClick={skipCommand}
                  disabled={paused}
                  className="text-xs font-mono px-3 py-1 rounded border transition-all
                    border-gray-700 text-gray-500 hover:border-yellow-700 hover:text-yellow-500
                    disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Tab 키로도 스킵 가능"
                >
                  ⏭ 스킵
                </button>
                <button
                  onClick={() => {
                    const next = !pausedRef.current;
                    pausedRef.current = next;
                    setPaused(next);
                    if (!next) setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className={`text-xs font-mono px-3 py-1 rounded border transition-all
                    ${paused
                      ? "border-green-600 text-green-400 hover:bg-green-900/30"
                      : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                    }`}
                >
                  {paused ? "▶ 재개" : "⏸ 일시정지"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 한글 입력 경고 */}
        <AnimatePresence>
          {koreanWarning && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-4 bg-yellow-950 border border-yellow-600 rounded-xl px-6 py-4"
            >
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-yellow-400 font-bold text-sm">한글 입력이 감지됐어요!</p>
                <p className="text-yellow-600 text-xs mt-0.5 font-mono">
                  한/영 키를 눌러 영문 입력으로 전환하세요 &nbsp;
                  <kbd className="px-1.5 py-0.5 bg-yellow-900 border border-yellow-700 rounded text-yellow-400 text-xs">한/영</kbd>
                  &nbsp;또는&nbsp;
                  <kbd className="px-1.5 py-0.5 bg-yellow-900 border border-yellow-700 rounded text-yellow-400 text-xs">Caps Lock</kbd>
                </p>
              </div>
              <button
                onClick={() => setKoreanWarning(false)}
                className="ml-auto text-yellow-700 hover:text-yellow-400 text-lg leading-none flex-shrink-0"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main typing area */}
        <motion.div
          ref={containerRef}
          className={`bg-gray-950 border rounded-xl overflow-hidden shadow-2xl transition-colors duration-300
            ${shake ? "shake" : ""}
            ${started ? "border-green-900" : "border-gray-800"}`}
        >
          {/* Title bar */}
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentCommand && (
                <span
                  className={`text-xs font-bold font-mono px-2.5 py-1 rounded border
                    ${CATEGORY_COLORS[currentCommand.category]} border-current opacity-80`}
                >
                  {CATEGORY_LABELS[currentCommand.category]}
                </span>
              )}
              {currentCommand && (
                <span className="text-xs text-gray-500">
                  {currentCommand.label}
                </span>
              )}
            </div>
            <Timer timeLeft={timeLeft} totalTime={TOTAL_TIME} />
          </div>

          <div className="p-10 space-y-6">
            {/* Previous completed commands */}
            {commands
              .slice(Math.max(0, currentIndex - 2), currentIndex)
              .map((cmd, i) => (
                <div
                  key={`prev-${currentIndex - 2 + i}`}
                  className="font-mono text-sm text-gray-700 opacity-40 flex items-center gap-2"
                >
                  <span className="text-green-800">✓</span>
                  <span className="line-through">{cmd.command}</span>
                </div>
              ))}

            {/* Current command */}
            <div
              className="font-mono text-xl leading-[2.6] tracking-wide select-none py-2"
              aria-live="polite"
            >
              {charStates.map((cs, i) => (
                <span
                  key={i}
                  className={`relative
                    ${cs.status === "correct" ? "text-green-400" : ""}
                    ${cs.status === "wrong" ? "text-red-400 bg-red-950/60 rounded-sm" : ""}
                    ${cs.status === "pending" ? "text-gray-500" : ""}
                  `}
                >
                  {i === cursorPos && (
                    <span className="absolute -left-px inset-y-0 w-0.5 bg-green-400 cursor-blink" />
                  )}
                  {cs.char === " " ? "\u00A0" : cs.char}
                </span>
              ))}
              {cursorPos >= charStates.length && (
                <span className="inline-block w-0.5 h-6 bg-green-400 cursor-blink align-middle ml-0.5" />
              )}
            </div>

            {/* Next command preview */}
            {commands[currentIndex + 1] && (
              <div className="font-mono text-sm text-gray-700 border-t border-gray-900 pt-4 mt-2">
                <span className="text-gray-600 text-xs mr-2">next →</span>
                <span className="opacity-50">{commands[currentIndex + 1].command}</span>
              </div>
            )}

            {/* Hidden actual input */}
            <input
              ref={inputRef}
              value={typedValue}
              onChange={handleInput}
              className="sr-only"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              tabIndex={0}
              aria-label="타이핑 입력 필드"
            />
          </div>
        </motion.div>

        {/* HUD */}
        <HUD
          wpm={wpm}
          accuracy={accuracy}
          streak={streak}
          commandsCompleted={commandsCompleted}
        />

        {/* WPM progress bar */}
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-7 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-500">WPM 진행도</span>
            <span className="text-gray-500">
              {wpm >= 40
                ? <span className="text-amber-400 font-bold">🤩 혹시 직업이 개발자세요?</span>
                : wpm >= 30
                  ? <span className="text-cyan-400 font-bold">😎 오 제법인데요?</span>
                  : wpm >= 25
                    ? <span className="text-green-400 font-bold">👍 오케이, 들어와요</span>
                    : <span className="text-gray-600">합격 기준 <span className="text-green-500">25 WPM</span></span>
              }
            </span>
          </div>
          <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors duration-500 ${
                wpm >= 40
                  ? "bg-amber-400"
                  : wpm >= 30
                    ? "bg-cyan-500"
                    : wpm >= 25
                      ? "bg-green-500"
                      : "bg-red-500"
              }`}
              style={{
                boxShadow:
                  wpm >= 40 ? "0 0 14px rgba(245,158,11,0.7)"
                  : wpm >= 30 ? "0 0 12px rgba(6,182,212,0.6)"
                  : wpm >= 25 ? "0 0 12px rgba(34,197,94,0.6)"
                  : undefined,
              }}
              animate={{ width: `${Math.min((wpm / 60) * 100, 100)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {/* 25 WPM marker — 합격 */}
            <div
              className="absolute top-0 bottom-0 w-px bg-green-500 opacity-50"
              style={{ left: `${(25 / 60) * 100}%` }}
            />
            {/* 30 WPM marker — 굿 */}
            <div
              className="absolute top-0 bottom-0 w-px bg-cyan-400 opacity-50"
              style={{ left: `${(30 / 60) * 100}%` }}
            />
            {/* 40 WPM marker — 레전드 */}
            <div
              className="absolute top-0 bottom-0 w-px bg-amber-400 opacity-50"
              style={{ left: `${(40 / 60) * 100}%` }}
            />
          </div>
          <div className="relative flex justify-between text-xs text-gray-700 font-mono">
            <span>0</span>
            <span
              className="absolute text-green-800"
              style={{ left: `${(25 / 60) * 100}%`, transform: "translateX(-50%)" }}
            >
              25
            </span>
            <span
              className="absolute text-cyan-900"
              style={{ left: `${(30 / 60) * 100}%`, transform: "translateX(-50%)" }}
            >
              30
            </span>
            <span
              className="absolute text-amber-900"
              style={{ left: `${(40 / 60) * 100}%`, transform: "translateX(-50%)" }}
            >
              40
            </span>
            <span>60 WPM</span>
          </div>
        </div>

        <div className="text-center text-xs text-gray-700 font-mono space-x-2">
          <span>화면 클릭으로 포커스</span>
          <span>·</span>
          <kbd className="px-1 bg-gray-900 border border-gray-800 rounded text-gray-600">Tab</kbd>{" "}
          <span>명령어 스킵</span>
          <span>·</span>
          <kbd className="px-1 bg-gray-900 border border-gray-800 rounded text-gray-600">ESC</kbd>{" "}
          <span>일시정지</span>
        </div>
      </div>

      {/* 일시정지 오버레이 */}
      <AnimatePresence>
        {paused && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              pausedRef.current = false;
              setPaused(false);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="text-center space-y-5 bg-gray-950 border border-gray-700 rounded-2xl p-10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl">⏸</div>
              <div className="text-2xl font-bold text-white">일시정지</div>
              <div className="text-gray-500 text-sm font-mono">타이머가 멈췄습니다</div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  pausedRef.current = false;
                  setPaused(false);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="mt-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold
                  rounded-xl text-base tracking-wide transition-all duration-200
                  shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                ▶ 계속하기
              </motion.button>
              <div className="text-xs text-gray-700 font-mono">
                ESC 키 또는 버튼을 누르면 재개됩니다
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finished overlay */}
      <AnimatePresence>
        {finished && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-6xl"
              >
                ⏱
              </motion.div>
              <div className="text-3xl font-bold text-white">시간 종료!</div>
              <div className="text-gray-400 text-sm font-mono">
                결과 분석 중...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
