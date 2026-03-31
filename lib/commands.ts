export interface CommandEntry {
  command: string;
  category: "claude" | "slash" | "git" | "npm";
  label: string;
}

export const COMMANDS: CommandEntry[] = [
  // ── Claude CLI ──────────────────────────────────────────────
  { command: "claude", category: "claude", label: "Claude 시작" },
  { command: "claude -c", category: "claude", label: "이전 대화 이어하기" },
  { command: "claude --plan", category: "claude", label: "플랜 모드" },
  { command: "claude --accept-edits", category: "claude", label: "편집 자동 승인" },
  { command: "claude --dangerously-skip-permissions", category: "claude", label: "권한 스킵" },
  { command: "claude --model opus", category: "claude", label: "Opus 모델 사용" },
  { command: "claude --model sonnet", category: "claude", label: "Sonnet 모델 사용" },
  { command: "claude --model haiku", category: "claude", label: "Haiku 모델 사용" },
  { command: "claude --version", category: "claude", label: "버전 확인" },
  { command: "claude doctor", category: "claude", label: "설치 상태 점검" },
  { command: "claude mcp list", category: "claude", label: "MCP 서버 목록" },
  { command: "npm install -g @anthropic-ai/claude-code", category: "claude", label: "Claude Code 설치" },
  { command: "npm update -g @anthropic-ai/claude-code", category: "claude", label: "Claude Code 업데이트" },

  // ── 슬래시 명령어 ─────────────────────────────────────────────
  { command: "/help", category: "slash", label: "도움말 보기" },
  { command: "/clear", category: "slash", label: "대화 초기화" },
  { command: "/compact", category: "slash", label: "컨텍스트 압축" },
  { command: "/quit", category: "slash", label: "세션 종료" },
  { command: "/plan", category: "slash", label: "플랜 모드 전환" },
  { command: "/commit", category: "slash", label: "커밋 메시지 생성" },
  { command: "/review", category: "slash", label: "코드 리뷰" },
  { command: "/config", category: "slash", label: "설정 열기" },
  { command: "/memory", category: "slash", label: "메모리 확인/수정" },
  { command: "/model", category: "slash", label: "모델 전환" },
  { command: "/cost", category: "slash", label: "토큰 비용 확인" },
  { command: "/init", category: "slash", label: "CLAUDE.md 생성" },
  { command: "/permissions", category: "slash", label: "권한 설정" },
  { command: "/add-dir src", category: "slash", label: "src 디렉토리 추가" },

  // ── Git (바이브 코딩 필수) ─────────────────────────────────────
  { command: "git status", category: "git", label: "Git 상태 확인" },
  { command: "git add .", category: "git", label: "전체 스테이징" },
  { command: 'git commit -m "feat: add new feature"', category: "git", label: "Git 커밋" },
  { command: 'git commit -m "fix: resolve bug"', category: "git", label: "버그 수정 커밋" },
  { command: "git push origin main", category: "git", label: "Git 푸시" },
  { command: "git pull origin main", category: "git", label: "Git 풀" },
  { command: "git checkout -b feature/my-feature", category: "git", label: "브랜치 생성" },
  { command: "git checkout main", category: "git", label: "main 브랜치 이동" },

  // ── NPM (바이브 코딩 필수) ────────────────────────────────────
  { command: "npm run dev", category: "npm", label: "개발 서버 시작" },
  { command: "npm run build", category: "npm", label: "빌드" },
  { command: "npm install", category: "npm", label: "패키지 설치" },
  { command: "npm install framer-motion", category: "npm", label: "패키지 추가" },
  { command: "npx create-next-app@latest my-app --typescript", category: "npm", label: "Next.js 앱 생성" },
  { command: "npx shadcn@latest init", category: "npm", label: "shadcn 초기화" },
  { command: "npx shadcn@latest add button", category: "npm", label: "shadcn 컴포넌트 추가" },
];

export function getShuffledCommands(): CommandEntry[] {
  return [...COMMANDS].sort(() => Math.random() - 0.5);
}

export const CATEGORY_COLORS: Record<CommandEntry["category"], string> = {
  claude: "text-amber-400",
  slash:  "text-purple-400",
  git:    "text-blue-400",
  npm:    "text-red-400",
};

export const CATEGORY_LABELS: Record<CommandEntry["category"], string> = {
  claude: "CLAUDE",
  slash:  "SLASH",
  git:    "GIT",
  npm:    "NPM",
};
