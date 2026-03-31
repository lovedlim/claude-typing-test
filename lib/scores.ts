import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface ScoreEntry {
  id?: string;
  nickname: string;
  wpm: number;
  accuracy: number;
  grade: string;
  comment: string;
  createdAt: Timestamp | Date;
}

const COLLECTION = "scores";

export async function submitScore(entry: Omit<ScoreEntry, "id" | "createdAt">) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...entry,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

// 닉네임 중복 확인
export async function checkNicknameExists(nickname: string): Promise<boolean> {
  const q = query(
    collection(db, COLLECTION),
    where("nickname", "==", nickname.trim()),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// 최근 기록 (등록 순)
export async function getRecentScores(count = 15): Promise<ScoreEntry[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScoreEntry));
}

// 전체 랭킹 (WPM 순)
export async function getAllTimeRanking(count = 50): Promise<ScoreEntry[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("wpm", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScoreEntry));
  return entries.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);
}

// 월간 랭킹 (이번 달, WPM 순)
export async function getMonthlyRanking(count = 50): Promise<ScoreEntry[]> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const q = query(
    collection(db, COLLECTION),
    where("createdAt", ">=", Timestamp.fromDate(startOfMonth)),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  const snap = await getDocs(q);
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScoreEntry));
  return entries.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy).slice(0, count);
}

export function formatTime(ts: Timestamp | Date): string {
  const date = ts instanceof Date ? ts : ts.toDate();
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
