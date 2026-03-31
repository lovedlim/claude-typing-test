export function calculateWPM(
  correctChars: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds <= 0) return 0;
  const words = correctChars / 5;
  const minutes = elapsedSeconds / 60;
  return Math.round(words / minutes);
}

export function calculateAccuracy(
  correctChars: number,
  totalTyped: number
): number {
  if (totalTyped === 0) return 100;
  return Math.round((correctChars / totalTyped) * 100);
}

export interface TestResult {
  wpm: number;
  accuracy: number;
  totalChars: number;
  correctChars: number;
  commandsCompleted: number;
  duration: number;
  passed: boolean;
}

export const PASSING_WPM = 25;

export type Grade = "fail" | "pass" | "good" | "legend";

export interface GradeInfo {
  grade: Grade;
  label: string;
  emoji: string;
  subLabel: string;
  passed: boolean;
  wpmTextClass: string;
  glowClass: string;
  borderClass: string;
  titleBgClass: string;
  titleBorderClass: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  badgeTextClass: string;
  bgGlowClass: string;
  flashColor: string;
}

export function getGrade(wpm: number): GradeInfo {
  if (wpm >= 45) {
    return {
      grade: "legend",
      label: "혹시 직업이 개발자세요?",
      emoji: "🤩",
      subLabel: "LEGEND",
      passed: true,
      wpmTextClass: "text-amber-400 text-glow-amber",
      glowClass: "shadow-[0_0_40px_rgba(245,158,11,0.25)]",
      borderClass: "border-amber-700",
      titleBgClass: "bg-amber-950",
      titleBorderClass: "border-amber-900",
      badgeBgClass: "bg-amber-950",
      badgeBorderClass: "border-amber-600",
      badgeTextClass: "text-amber-400",
      bgGlowClass: "bg-amber-500",
      flashColor: "bg-amber-400",
    };
  }
  if (wpm >= 35) {
    return {
      grade: "good",
      label: "오 제법인데요?",
      emoji: "😎",
      subLabel: "GOOD",
      passed: true,
      wpmTextClass: "text-cyan-400",
      glowClass: "shadow-[0_0_40px_rgba(6,182,212,0.2)]",
      borderClass: "border-cyan-800",
      titleBgClass: "bg-cyan-950",
      titleBorderClass: "border-cyan-900",
      badgeBgClass: "bg-cyan-950",
      badgeBorderClass: "border-cyan-600",
      badgeTextClass: "text-cyan-400",
      bgGlowClass: "bg-cyan-500",
      flashColor: "bg-cyan-400",
    };
  }
  if (wpm >= 25) {
    return {
      grade: "pass",
      label: "오케이, 들어와요",
      emoji: "👍",
      subLabel: "PASS",
      passed: true,
      wpmTextClass: "text-green-400 text-glow-green",
      glowClass: "shadow-[0_0_40px_rgba(34,197,94,0.2)]",
      borderClass: "border-green-800",
      titleBgClass: "bg-green-950",
      titleBorderClass: "border-green-900",
      badgeBgClass: "bg-green-950",
      badgeBorderClass: "border-green-700",
      badgeTextClass: "text-green-400",
      bgGlowClass: "bg-green-500",
      flashColor: "bg-green-500",
    };
  }
  return {
    grade: "fail",
    label: "아직 멀었어요",
    emoji: "😅",
    subLabel: "RETRY",
    passed: false,
    wpmTextClass: "text-red-400 text-glow-red",
    glowClass: "shadow-[0_0_40px_rgba(239,68,68,0.2)]",
    borderClass: "border-red-900",
    titleBgClass: "bg-red-950",
    titleBorderClass: "border-red-900",
    badgeBgClass: "bg-red-950",
    badgeBorderClass: "border-red-800",
    badgeTextClass: "text-red-400",
    bgGlowClass: "bg-red-500",
    flashColor: "bg-red-500",
  };
}

export function buildResult(params: {
  correctChars: number;
  totalTyped: number;
  commandsCompleted: number;
  duration: number;
}): TestResult {
  const { correctChars, totalTyped, commandsCompleted, duration } = params;
  const wpm = calculateWPM(correctChars, duration);
  const accuracy = calculateAccuracy(correctChars, totalTyped);
  return {
    wpm,
    accuracy,
    totalChars: totalTyped,
    correctChars,
    commandsCompleted,
    duration,
    passed: wpm >= PASSING_WPM,
  };
}

export function saveResult(result: TestResult): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("typing-test-result", JSON.stringify(result));
  }
}

export function loadResult(): TestResult | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("typing-test-result");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TestResult;
  } catch {
    return null;
  }
}
