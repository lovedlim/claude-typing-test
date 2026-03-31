"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 border border-red-900 rounded-xl p-8 font-mono space-y-6">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          <span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />
          <span className="ml-2">claude-code-edu — error</span>
        </div>

        <div className="space-y-2">
          <p className="text-red-400 text-sm">⨯ 오류가 발생했습니다</p>
          <p className="text-gray-500 text-xs">
            {error.message || "알 수 없는 오류가 발생했습니다."}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 border border-green-700 text-green-400 text-xs rounded hover:bg-green-900/30 transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 text-xs rounded hover:bg-gray-800 transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
