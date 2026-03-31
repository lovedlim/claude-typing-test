"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { loadResult, getGrade, PASSING_WPM, type TestResult } from "@/lib/wpm";
import { submitScore, checkNicknameExists } from "@/lib/scores";

function useCountUp(target: number, duration: number = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  size: number;
}

function Confetti({ grade }: { grade: string }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  useEffect(() => {
    const colorMap: Record<string, string[]> = {
      pass:   ["#22c55e", "#86efac", "#4ade80", "#ffffff", "#bbf7d0"],
      good:   ["#06b6d4", "#67e8f9", "#22d3ee", "#ffffff", "#a5f3fc"],
      legend: ["#f59e0b", "#fcd34d", "#fbbf24", "#ffffff", "#fde68a"],
    };
    const colors = colorMap[grade] ?? colorMap.pass;
    setPieces(Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      size: Math.random() * 10 + 4,
    })));
  }, [grade]);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: -20, width: p.size, height: p.size * 0.4, backgroundColor: p.color, rotate: p.rotation }}
          animate={{ y: "110vh", rotate: p.rotation + Math.random() * 720 - 360, x: (Math.random() - 0.5) * 200 }}
          transition={{ duration: 2.5 + Math.random() * 2, delay: Math.random() * 0.8, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

function StatRow({ label, value, unit = "", color = "text-white" }: {
  label: string; value: string | number; unit?: string; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-800/70">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`font-mono font-bold ${color}`}>
        {value}
        {unit && <span className="text-gray-500 font-normal ml-1 text-xs">{unit}</span>}
      </span>
    </div>
  );
}

const TIPS = [
  { icon: "🏠", title: "홈포지션 사수", desc: "항상 F, J 키(돌기가 있는 키)에 검지를 올려두세요. 모든 손가락이 여기서 출발합니다." },
  { icon: "👀", title: "화면만 보기", desc: "손을 보면 절대 빨라질 수 없어요. 틀려도 괜찮으니 화면만 보며 치는 습관을 먼저 들이세요." },
  { icon: "🎯", title: "정확도가 속도보다 먼저", desc: "빠르게 치려다 틀리면 오히려 느려집니다. 천천히 정확하게 → 익숙해지면 자연스럽게 빨라져요." },
  { icon: "🔁", title: "짧게 매일", desc: "하루 2~3시간 몰아치는 것보다 하루 10~15분씩 꾸준히 연습하는 게 훨씬 효과적입니다." },
  { icon: "🎵", title: "리듬감 유지", desc: "박자에 맞춰 일정한 속도로 치면 뇌가 패턴을 더 빠르게 학습합니다. 불규칙하게 치지 마세요." },
  { icon: "⌨️", title: "약한 손가락 집중 훈련", desc: "보통 약지·새끼손가락이 약합니다. 이 테스트를 반복하면서 약한 키를 집중 훈련하세요." },
];

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // 리더보드 등록 폼
  const [nickname, setNickname] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [dupWarning, setDupWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // 인증서 모달
  const [showCert, setShowCert] = useState(false);
  const [certName, setCertName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = loadResult();
    setResult(r);
    setLoaded(true);
    if (r && r.wpm >= PASSING_WPM) {
      setTimeout(() => setShowConfetti(true), 500);
    }
    setTimeout(() => setShowFlash(true), 150);
    setTimeout(() => setShowFlash(false), 600);
  }, []);

  const displayWpm = useCountUp(result?.wpm ?? 0, 1800);
  const displayAcc = useCountUp(result?.accuracy ?? 0, 1400);

  // html2canvas는 oklch(Tailwind v4) 파싱 불가 → Canvas 직접 드로잉
  const saveCert = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const W = 800, H = 480;
      const canvas = document.createElement("canvas");
      canvas.width = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);

      const GRADE_HEX: Record<string, { primary: string; bg: string; border: string }> = {
        legend: { primary: "#f59e0b", bg: "#0c0700", border: "#92400e" },
        good:   { primary: "#06b6d4", bg: "#00090d", border: "#155e75" },
        pass:   { primary: "#22c55e", bg: "#001a0a", border: "#166534" },
        fail:   { primary: "#f87171", bg: "#0d0000", border: "#7f1d1d" },
      };
      const c = GRADE_HEX[gradeInfo.grade] ?? GRADE_HEX.pass;

      // 배경
      ctx.fillStyle = "#030712";
      roundRect(ctx, 0, 0, W, H, 16);
      ctx.fill();

      // 테두리
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 1, 1, W - 2, H - 2, 16);
      ctx.stroke();

      // 타이틀바 배경
      ctx.fillStyle = c.bg;
      ctx.fillRect(0, 0, W, 44);
      ctx.strokeStyle = c.border + "80";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(W, 44); ctx.stroke();

      // 닷 버튼
      [["#ef4444", 22], ["#eab308", 42], ["#22c55e", 62]].forEach(([col, x]) => {
        ctx.beginPath();
        ctx.fillStyle = col as string;
        ctx.arc(x as number, 22, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // CERTIFICATE OF PASS
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText("CERTIFICATE OF PASS", W / 2, 27);

      // ✓ PASSED
      ctx.fillStyle = c.primary;
      ctx.textAlign = "right";
      ctx.fillText("✓ PASSED", W - 22, 27);

      // Claude Code Education
      ctx.font = "11px monospace";
      ctx.fillStyle = "#4b5563";
      ctx.textAlign = "center";
      ctx.letterSpacing = "0.2em";
      ctx.fillText("CLAUDE CODE EDUCATION", W / 2, 78);
      ctx.letterSpacing = "0";

      // 합격 인증서
      ctx.font = "bold 30px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("합격 인증서", W / 2, 116);

      // 이름
      ctx.font = "11px monospace";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText("이름 / NAME", W / 2, 152);
      ctx.font = "bold 22px monospace";
      ctx.fillStyle = c.primary;
      ctx.fillText(certName || "_______________", W / 2, 180);

      // 구분선 (dashed)
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(48, 198); ctx.lineTo(W - 48, 198); ctx.stroke();
      ctx.setLineDash([]);

      // WPM
      ctx.font = "bold 58px monospace";
      ctx.fillStyle = c.primary;
      ctx.textAlign = "center";
      ctx.fillText(String(result.wpm), W / 2 - 168, 278);
      ctx.font = "11px monospace";
      ctx.fillStyle = "#6b7280";
      ctx.fillText("WPM", W / 2 - 168, 298);

      // 세로 구분선
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(W / 2 - 60, 220); ctx.lineTo(W / 2 - 60, 300); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2 + 60, 220); ctx.lineTo(W / 2 + 60, 300); ctx.stroke();

      // 정확도
      ctx.font = "bold 38px monospace";
      ctx.fillStyle = "#d1d5db";
      ctx.textAlign = "center";
      ctx.fillText(result.accuracy + "%", W / 2, 274);
      ctx.font = "11px monospace";
      ctx.fillStyle = "#6b7280";
      ctx.fillText("정확도", W / 2, 296);

      // 등급
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = c.primary;
      ctx.textAlign = "center";
      ctx.fillText(gradeInfo.emoji + " " + gradeInfo.subLabel, W / 2 + 168, 270);
      ctx.font = "11px monospace";
      ctx.fillStyle = "#6b7280";
      ctx.fillText("등급", W / 2 + 168, 296);

      // 하단 구분선
      ctx.strokeStyle = "#1f2937";
      ctx.beginPath(); ctx.moveTo(48, 328); ctx.lineTo(W - 48, 328); ctx.stroke();

      // 취득일
      ctx.font = "10px monospace";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "left";
      ctx.fillText("취득일 / DATE", 48, 356);
      ctx.font = "12px monospace";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(todayStr, 48, 378);

      // 발급기관
      ctx.font = "10px monospace";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "right";
      ctx.fillText("발급기관", W - 48, 356);
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = c.primary;
      ctx.fillText("⚡ SideOnAI", W - 48, 378);

      const link = document.createElement("a");
      link.download = `claude-code-certificate-${certName || "pass"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSaving(false);
    }
  };

  // Canvas roundRect 헬퍼 (구형 브라우저 대응)
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const handleSubmit = async (forceSubmit = false) => {
    if (!nickname.trim() || !result) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (!forceSubmit) {
        const exists = await checkNicknameExists(nickname.trim());
        if (exists) {
          setDupWarning(true);
          setPendingSubmit(true);
          setSubmitting(false);
          return;
        }
      }
      await submitScore({
        nickname: nickname.trim(),
        wpm: result.wpm,
        accuracy: result.accuracy,
        grade: gradeInfo?.grade ?? "pass",
        comment: comment.trim(),
      });
      setSubmitted(true);
      setDupWarning(false);
    } catch (e) {
      console.error("submitScore error:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setSubmitError(`등록 실패: ${msg}`);
    } finally {
      setSubmitting(false);
      setPendingSubmit(false);
    }
  };

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-mono">결과 불러오는 중...</div>;
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 font-mono">결과를 찾을 수 없습니다.</p>
        <button onClick={() => router.push("/")} className="text-green-400 border border-green-600 px-4 py-2 rounded hover:bg-green-900/30">홈으로</button>
      </div>
    );
  }

  const gradeInfo = getGrade(result.wpm);
  const todayStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Flash */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className={`fixed inset-0 pointer-events-none z-50 ${gradeInfo.flashColor}`}
            initial={{ opacity: gradeInfo.passed ? 0.18 : 0.22 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {showConfetti && <Confetti grade={gradeInfo.grade} />}

      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-[0.05] ${gradeInfo.bgGlowClass}`} />
      </div>

      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Window chrome */}
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="ml-2">typing_test — result</span>
        </div>

        {/* Main result card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`bg-gray-950 border rounded-xl overflow-hidden shadow-2xl ${gradeInfo.borderClass} ${gradeInfo.glowClass}`}
        >
          <div className={`px-6 py-4 border-b flex items-center justify-between ${gradeInfo.titleBgClass} ${gradeInfo.titleBorderClass}`}>
            <span className="text-xs font-mono text-gray-400">Test Complete — Score Report</span>
            <span className={`text-xs font-bold font-mono tracking-widest ${gradeInfo.badgeTextClass}`}>
              {gradeInfo.passed ? "✓" : "✗"} {gradeInfo.subLabel}
            </span>
          </div>

          <div className="p-10 space-y-8">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <div className={`text-[7rem] font-black font-mono leading-none ${gradeInfo.wpmTextClass}`}>{displayWpm}</div>
                <div className="text-gray-400 text-lg font-mono -mt-2">WPM</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.55, type: "spring", stiffness: 200 }}
                className="mt-5"
              >
                <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border ${gradeInfo.badgeBgClass} ${gradeInfo.badgeBorderClass}`}>
                  <span className="text-2xl">{gradeInfo.emoji}</span>
                  <span className={`font-bold text-base ${gradeInfo.badgeTextClass}`}>{gradeInfo.label}</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-5 flex items-center justify-center gap-2 text-xs font-mono"
              >
                {[
                  { min: 0,  max: 24,  label: "😅",  active: gradeInfo.grade === "fail" },
                  { min: 25, max: 29,  label: "👍",  active: gradeInfo.grade === "pass" },
                  { min: 30, max: 39,  label: "😎",  active: gradeInfo.grade === "good" },
                  { min: 40, max: null, label: "🤩", active: gradeInfo.grade === "legend" },
                ].map((tier, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`px-3 py-1.5 rounded text-xs transition-all ${tier.active ? `${gradeInfo.badgeBgClass} ${gradeInfo.badgeTextClass} border ${gradeInfo.badgeBorderClass} font-bold` : "text-gray-700 border border-gray-800"}`}>
                      {tier.label} {tier.min}{tier.max ? `~${tier.max}` : "+"}
                    </div>
                    {i < 3 && <span className="text-gray-700">›</span>}
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>정확도</span>
                <span className={result.accuracy >= 95 ? "text-green-400" : result.accuracy >= 80 ? "text-amber-400" : "text-red-400"}>{displayAcc}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${result.accuracy >= 95 ? "bg-green-500" : result.accuracy >= 80 ? "bg-amber-500" : "bg-red-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.accuracy}%` }}
                  transition={{ duration: 1.2, delay: 0.5 }}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <StatRow label="완료한 명령어" value={result.commandsCompleted} unit="개" color="text-blue-400" />
              <StatRow label="총 입력 문자"  value={result.totalChars}        unit="자" />
              <StatRow label="정확한 문자"   value={result.correctChars}      unit="자" color="text-green-400" />
              <StatRow label="테스트 시간"   value={result.duration}          unit="초" />
              <StatRow label="합격 기준" value={`${PASSING_WPM} WPM 이상`} color={gradeInfo.passed ? "text-green-400" : "text-red-400"} />
            </motion.div>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col gap-4">
          {gradeInfo.passed ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 text-white font-bold rounded-xl text-lg tracking-wide transition-all duration-200
                  ${gradeInfo.grade === "legend"
                    ? "bg-amber-600 hover:bg-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                    : gradeInfo.grade === "good"
                      ? "bg-cyan-700 hover:bg-cyan-600 shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                      : "bg-green-600 hover:bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                  }`}
                onClick={() => {
                  setCertName(nickname || "");
                  setShowCert(true);
                }}
              >
                🏅 합격 인증서 보기
              </motion.button>
              <button
                onClick={() => router.push("/test")}
                className="w-full py-3 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 rounded-xl text-sm transition-all duration-200"
              >
                점수 더 올려보기
              </button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/test")}
                className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl text-lg tracking-wide transition-all duration-200"
              >
                🔄 다시 도전 (목표: {PASSING_WPM} WPM)
              </motion.button>
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 space-y-4">
                <p className="text-gray-200 font-semibold text-sm">💡 빠르게 늘리는 연습 팁</p>
                <div className="grid grid-cols-1 gap-3">
                  {TIPS.map((tip, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 + i * 0.08 }} className="flex gap-3 items-start">
                      <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
                      <div>
                        <p className="text-gray-300 text-xs font-semibold">{tip.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{tip.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-800 text-xs text-gray-600 font-mono">💪 연습 후 다시 도전하면 분명히 올라갑니다!</div>
              </div>
            </>
          )}

          <button onClick={() => router.push("/")} className="text-center text-xs text-gray-600 hover:text-gray-400 transition-colors font-mono">
            ← 홈으로 돌아가기
          </button>
        </motion.div>

        {/* 리더보드 등록 폼 (합격자만) */}
        {gradeInfo.passed && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/60 flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">🏆 리더보드에 등록하기</span>
              {submitted && <span className="text-xs text-green-400 font-mono">✓ 등록 완료!</span>}
            </div>
            <div className="p-8">
              {submitted ? (
                <div className="text-center space-y-3">
                  <p className="text-green-400 font-bold">점수가 리더보드에 등록됐어요! 🎉</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/leaderboard")}
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-sm tracking-wide transition-all duration-200 border border-gray-700"
                  >
                    📊 리더보드 확인하기
                  </motion.button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-mono">닉네임 *</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => { setNickname(e.target.value); setDupWarning(false); }}
                      maxLength={20}
                      placeholder="표시될 이름을 입력하세요"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                    />
                  </div>

                  {/* 닉네임 중복 경고 */}
                  <AnimatePresence>
                    {dupWarning && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-yellow-950 border border-yellow-700 rounded-lg px-4 py-3 text-xs space-y-2"
                      >
                        <p className="text-yellow-400 font-bold">⚠️ 이미 이 닉네임으로 등록된 기록이 있어요.</p>
                        <p className="text-yellow-600">최신 기록 시간이 리더보드에 함께 표시됩니다. 그래도 등록할까요?</p>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSubmit(true)}
                            disabled={submitting}
                            className="flex-1 py-1.5 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded text-xs transition-colors"
                          >
                            {submitting ? "등록 중..." : "그래도 등록"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDupWarning(false); setPendingSubmit(false); }}
                            className="flex-1 py-1.5 border border-yellow-800 text-yellow-600 hover:text-yellow-400 rounded text-xs transition-colors"
                          >
                            닉네임 바꿀게요
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-mono">코멘트 (선택)</label>
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={50}
                      placeholder="한마디 남겨보세요"
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                    />
                  </div>
                  {submitError && <p className="text-red-400 text-xs font-mono">{submitError}</p>}
                  {!dupWarning && (
                    <div className="flex gap-3 pt-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={!nickname.trim() || submitting || pendingSubmit}
                        className="flex-1 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold rounded-xl text-sm transition-all duration-200"
                      >
                        {submitting ? "확인 중..." : "🏅 기록 등록"}
                      </motion.button>
                      <button
                        type="button"
                        onClick={() => router.push("/leaderboard")}
                        className="px-4 py-3 border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 rounded-xl text-sm transition-all duration-200 font-mono"
                      >
                        📊 리더보드
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        )}

        {!gradeInfo.passed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="text-center">
            <button onClick={() => router.push("/leaderboard")} className="text-xs text-gray-600 hover:text-gray-400 transition-colors font-mono">
              📊 리더보드 구경하기
            </button>
          </motion.div>
        )}
      </div>

      {/* ── 합격 인증서 모달 ── */}
      <AnimatePresence>
        {showCert && result && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCert(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="w-full max-w-md space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 인증서 미리보기 */}
              <div
                className="bg-[#030712] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl"
                style={{ fontFamily: "monospace" }}
              >
                {/* 타이틀 바 */}
                <div className={`px-6 py-3 border-b flex items-center justify-between ${gradeInfo.titleBgClass} ${gradeInfo.titleBorderClass}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  </div>
                  <span className="text-xs text-gray-500 tracking-widest">CERTIFICATE OF PASS</span>
                  <span className={`text-xs font-bold tracking-widest ${gradeInfo.badgeTextClass}`}>✓ PASSED</span>
                </div>

                <div className="px-10 py-10 space-y-7">
                  {/* 헤더 */}
                  <div className="text-center space-y-1">
                    <p className="text-gray-500 text-xs tracking-[0.3em] uppercase">Claude Code Education</p>
                    <h1 className="text-white text-2xl font-black tracking-tight">합격 인증서</h1>
                  </div>

                  {/* 이름 */}
                  <div className="text-center border-b border-dashed border-gray-800 pb-5">
                    <p className="text-gray-600 text-xs mb-1 tracking-widest">이름 / NAME</p>
                    <p className={`text-xl font-bold ${gradeInfo.wpmTextClass}`}>
                      {certName || "_______________"}
                    </p>
                  </div>

                  {/* 점수 */}
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <div className={`text-5xl font-black ${gradeInfo.wpmTextClass}`}>{result.wpm}</div>
                      <div className="text-gray-500 text-xs mt-1">WPM</div>
                    </div>
                    <div className="w-px h-12 bg-gray-800" />
                    <div className="text-center">
                      <div className="text-3xl font-black text-gray-300">{result.accuracy}%</div>
                      <div className="text-gray-500 text-xs mt-1">정확도</div>
                    </div>
                    <div className="w-px h-12 bg-gray-800" />
                    <div className="text-center">
                      <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-bold ${gradeInfo.badgeBgClass} ${gradeInfo.badgeBorderClass} ${gradeInfo.badgeTextClass}`}>
                        <span>{gradeInfo.emoji}</span>
                        <span>{gradeInfo.subLabel}</span>
                      </div>
                      <div className="text-gray-500 text-xs mt-1">등급</div>
                    </div>
                  </div>

                  {/* 날짜 + 서명 */}
                  <div className="flex items-end justify-between border-t border-gray-800 pt-5">
                    <div>
                      <p className="text-gray-600 text-[10px] tracking-widest">취득일 / DATE</p>
                      <p className="text-gray-400 text-xs mt-0.5">{todayStr}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600 text-[10px] tracking-widest">발급기관</p>
                      <p className={`text-xs font-bold mt-0.5 ${gradeInfo.badgeTextClass}`}>⚡ SideOnAI</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 이름 입력 + 저장 버튼 */}
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    maxLength={20}
                    placeholder="인증서에 표시할 이름"
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-gray-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveCert}
                    disabled={saving}
                    className={`px-5 py-2 font-bold text-sm rounded-lg transition-all text-white
                      ${gradeInfo.grade === "legend"
                        ? "bg-amber-600 hover:bg-amber-500"
                        : gradeInfo.grade === "good"
                          ? "bg-cyan-700 hover:bg-cyan-600"
                          : "bg-green-700 hover:bg-green-600"
                      } disabled:bg-gray-800 disabled:text-gray-600`}
                  >
                    {saving ? "저장 중..." : "💾 저장"}
                  </motion.button>
                </div>
                <button
                  onClick={() => setShowCert(false)}
                  className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors font-mono py-1"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
