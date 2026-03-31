"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body style={{ margin: 0, background: "#030712", fontFamily: "monospace" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              background: "#111827",
              border: "1px solid #7f1d1d",
              borderRadius: "0.75rem",
              padding: "2rem",
            }}
          >
            <p style={{ color: "#f87171", fontSize: "0.875rem", marginBottom: "1rem" }}>
              ⨯ 치명적 오류가 발생했습니다
            </p>
            <p style={{ color: "#6b7280", fontSize: "0.75rem", marginBottom: "1.5rem" }}>
              {error.message || "알 수 없는 오류"}
            </p>
            <button
              onClick={reset}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                border: "1px solid #166534",
                color: "#4ade80",
                fontSize: "0.75rem",
                borderRadius: "0.375rem",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
