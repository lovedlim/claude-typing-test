import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 font-mono space-y-6">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          <span className="ml-2">claude-code-edu — 404</span>
        </div>

        <div className="space-y-2">
          <p className="text-gray-300 text-4xl font-bold">404</p>
          <p className="text-gray-500 text-sm">페이지를 찾을 수 없습니다.</p>
        </div>

        <Link
          href="/"
          className="block text-center px-4 py-2 border border-green-700 text-green-400 text-xs rounded hover:bg-green-900/30 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
