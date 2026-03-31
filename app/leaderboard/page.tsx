"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  getRecentScores,
  getAllTimeRanking,
  getMonthlyRanking,
  formatTime,
  type ScoreEntry,
} from "@/lib/scores";

type RankTab = "monthly" | "alltime";

const GRADE_BADGE: Record<string, { label: string; cls: string }> = {
  legend: { label: "개발자", cls: "text-amber-400 bg-amber-900/30 border-amber-700" },
  good:   { label: "제법인데", cls: "text-cyan-400 bg-cyan-900/30 border-cyan-700" },
  pass:   { label: "합격",  cls: "text-green-400 bg-green-900/30 border-green-700" },
  fail:   { label: "도전",  cls: "text-gray-400 bg-gray-800/30 border-gray-700" },
};

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="text-xs font-mono text-gray-500 w-6 text-right tabular-nums">
      {rank}
    </span>
  );
}

function ScoreRow({
  entry,
  rank,
  showRank,
}: {
  entry: ScoreEntry;
  rank: number;
  showRank: boolean;
}) {
  const badge = GRADE_BADGE[entry.grade] ?? GRADE_BADGE.pass;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.03 }}
      className={`flex items-start gap-4 py-4 px-5 rounded-lg
        ${rank <= 3 && showRank ? "bg-gray-900/60" : "hover:bg-gray-900/40"}
        transition-colors`}
    >
      {showRank && (
        <div className="flex-shrink-0 w-7 flex items-center justify-center pt-0.5">
          <RankMedal rank={rank} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white text-sm truncate max-w-[120px]">
            {entry.nickname}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>
        {entry.comment && (
          <p className="text-gray-500 text-xs mt-0.5 truncate">{entry.comment}</p>
        )}
        <p className="text-gray-600 text-[10px] font-mono mt-0.5">
          {formatTime(entry.createdAt)}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <span
          className={`text-xl font-black font-mono tabular-nums
            ${entry.wpm >= 40 ? "text-amber-400" : entry.wpm >= 30 ? "text-cyan-400" : "text-green-400"}`}
        >
          {entry.wpm}
        </span>
        <span className="text-xs text-gray-600 font-mono block">WPM</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [recent, setRecent] = useState<ScoreEntry[]>([]);
  const [ranking, setRanking] = useState<ScoreEntry[]>([]);
  const [tab, setTab] = useState<RankTab>("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("요청 시간 초과 (10초) — Firebase 연결 또는 보안 규칙을 확인하세요")), 10000)
      );
      try {
        const [recentData, rankingData] = await Promise.race([
          Promise.all([
            getRecentScores(15),
            tab === "monthly" ? getMonthlyRanking(50) : getAllTimeRanking(50),
          ]),
          timeout,
        ]);
        setRecent(recentData);
        setRanking(rankingData);
      } catch (e) {
        console.error("leaderboard load error:", e);
        const msg = e instanceof Error ? e.message : String(e);
        setError(`데이터를 불러오지 못했어요: ${msg}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tab]);

  const reloadRanking = async () => {
    try {
      const data =
        tab === "monthly" ? await getMonthlyRanking(50) : await getAllTimeRanking(50);
      setRanking(data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!loading) reloadRanking();
  }, [tab]); // eslint-disable-line

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Scanline */}
      <div className="fixed inset-0 pointer-events-none z-0 scanline opacity-20" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/")}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-4 block"
          >
            ← 홈으로
          </button>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                🏆 리더보드
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Claude Code 타이핑 테스트 명예의 전당
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/test")}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-600 text-white font-bold
                rounded-xl text-sm transition-all duration-200"
            >
              ⌨️ 테스트 시작
            </motion.button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-gray-500 text-sm animate-pulse">불러오는 중...</div>
          </div>
        ) : error ? (
          <div className="text-center py-32 text-red-400 text-sm">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── 최근 기록 ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
                <h2 className="text-sm font-bold text-gray-200">🕐 최근 기록</h2>
                <p className="text-[10px] text-gray-600 mt-1">최신 등록 순</p>
              </div>
              <div className="divide-y divide-gray-900">
                {recent.length === 0 ? (
                  <p className="text-center text-gray-600 text-xs py-12">
                    아직 기록이 없어요
                  </p>
                ) : (
                  recent.map((entry, i) => (
                    <ScoreRow key={entry.id} entry={entry} rank={i + 1} showRank={false} />
                  ))
                )}
              </div>
            </motion.div>

            {/* ── 전체 랭킹 ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-gray-200">📊 전체 랭킹</h2>
                    <p className="text-[10px] text-gray-600 mt-1">WPM 높은 순</p>
                  </div>
                  {/* Tab */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-800 text-xs">
                    <button
                      onClick={() => setTab("monthly")}
                      className={`px-3 py-1.5 transition-colors font-mono
                        ${tab === "monthly"
                          ? "bg-gray-700 text-white"
                          : "bg-transparent text-gray-500 hover:text-gray-300"
                        }`}
                    >
                      이번 달
                    </button>
                    <button
                      onClick={() => setTab("alltime")}
                      className={`px-3 py-1.5 transition-colors font-mono
                        ${tab === "alltime"
                          ? "bg-gray-700 text-white"
                          : "bg-transparent text-gray-500 hover:text-gray-300"
                        }`}
                    >
                      전체
                    </button>
                  </div>
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="divide-y divide-gray-900"
                >
                  {ranking.length === 0 ? (
                    <p className="text-center text-gray-600 text-xs py-12">
                      {tab === "monthly" ? "이번 달 기록이 없어요" : "아직 기록이 없어요"}
                    </p>
                  ) : (
                    ranking.map((entry, i) => (
                      <ScoreRow key={entry.id} entry={entry} rank={i + 1} showRank={true} />
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
