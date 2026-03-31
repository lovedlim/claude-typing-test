"use client";

import { motion, AnimatePresence } from "framer-motion";

interface HUDProps {
  wpm: number;
  accuracy: number;
  streak: number;
  commandsCompleted: number;
}

function StatBox({
  label,
  value,
  unit,
  color = "text-white",
}: {
  label: string;
  value: number;
  unit?: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-4 text-center min-w-[110px]">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold font-mono ${color} leading-none`}>
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
        {unit && (
          <span className="text-sm text-gray-500 ml-0.5 font-normal">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default function HUD({
  wpm,
  accuracy,
  streak,
  commandsCompleted,
}: HUDProps) {
  const wpmColor =
    wpm >= 40
      ? "text-amber-400"
      : wpm >= 30
        ? "text-cyan-400"
        : wpm >= 25
          ? "text-green-400"
          : "text-gray-300";

  const accColor =
    accuracy >= 95
      ? "text-green-400"
      : accuracy >= 80
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="flex items-center gap-4 flex-wrap justify-center">
      <StatBox label="WPM" value={wpm} color={wpmColor} />
      <StatBox label="정확도" value={accuracy} unit="%" color={accColor} />
      <StatBox label="완료" value={commandsCompleted} unit="개" />
      {streak > 2 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-orange-950 border border-orange-700 rounded-lg px-6 py-4 text-center min-w-[110px]"
        >
          <div className="text-xs text-orange-400 uppercase tracking-wider mb-1">
            STREAK
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400 leading-none">
            🔥 ×{streak}
          </div>
        </motion.div>
      )}
    </div>
  );
}
