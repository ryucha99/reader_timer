'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* =========================
   타입 선언
   ========================= */
type MyWakeLockSentinel = {
  released: boolean;
  release: () => Promise<void>;
};
type NavigatorMaybeWakeLock = Navigator & {
  wakeLock?: { request: (type: 'screen') => Promise<MyWakeLockSentinel> };
};
type ElWithWebkitFS = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type DocWithWebkitFS = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
};

type Step = {
  id: number;
  startPage: number;
  endPage: number;
  pagesRead: number;
  timestamp: number;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
function formatDateYYYYMMDD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const today = formatDateYYYYMMDD();

/* =========================
   서버 API 저장 함수
   ========================= */
async function postStepToServer(
  user: string,
  date: string,
  book: string,
  step: Step
) {
  await fetch('/api/steps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user,
      date,
      book,
      startPage: step.startPage,
      endPage: step.endPage,
      pagesRead: step.pagesRead,
      timestamp: step.timestamp,
    }),
  });
}

/* =========================
   메인 컴포넌트
   ========================= */
export default function Page() {
  // 사용자/책 입력
  const [userName, setUserName] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookInput, setBookInput] = useState('');

  // 타이머 (길이 설정 포함)
  const [totalSeconds, setTotalSeconds] = useState(180); // 기본 3분
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [isRunning, setIsRunning] = useState(false);

  // 설정 패널
  const [showSettings, setShowSettings] = useState(false);
  const [minInput, setMinInput] = useState('3');
  const [secInput, setSecInput] = useState('0');

  // 입력/스텝
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [requireEndPage, setRequireEndPage] = useState(false);

  // Wake Lock
  const wakeLockRef = useRef<MyWakeLockSentinel | null>(null);

  /* 공통 입력/버튼 스타일 */
  const inputBase =
    'w-full h-10 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 ' +
    'disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed';
  const btnBase =
    'px-4 py-2 rounded text-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed';

  /* =========================
     타이머 동작
     ========================= */
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, secondsLeft]);

  const releaseWakeLock = useCallback(() => {
    try {
      wakeLockRef.current?.release?.();
      wakeLockRef.current = null;
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      releaseWakeLock();
      beep();
      // eslint-disable-next-line no-alert
      alert('타이머가 종료되었습니다. 종료페이지를 입력하세요.');
      setRequireEndPage(true);
      setTimeout(() => {
        const el = document.getElementById('endPageInput') as HTMLInputElement | null;
        el?.focus();
      }, 0);
    }
  }, [secondsLeft, isRunning, releaseWakeLock]);

  const requestWakeLock = useCallback(async () => {
    try {
      const nav = navigator as NavigatorMaybeWakeLock;
      if (nav.wakeLock?.request) {
        wakeLockRef.current = await nav.wakeLock.request('screen');
      }
    } catch {
      /* noop */
    }
  }, []);

  const elapsedPct = useMemo(() => {
    const used = totalSeconds - secondsLeft;
    return clamp((used / Math.max(1, totalSeconds)) * 100, 0, 100);
  }, [secondsLeft, totalSeconds]);

  /* =========================
     Fullscreen
     ========================= */
  const enterFullscreen = useCallback(async () => {
    const el = document.documentElement as ElWithWebkitFS;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  }, []);
  const exitFullscreen = useCallback(async () => {
    const d = document as DocWithWebkitFS;
    if (document.fullscreenElement) await document.exitFullscreen?.();
    else await d.webkitExitFullscreen?.();
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void exitFullscreen();
    else void enterFullscreen();
  }, [enterFullscreen, exitFullscreen]);

  /* =========================
     컨트롤러
     ========================= */
  function handleStartStop() {
    if (isRunning) {
      setIsRunning(false);
      releaseWakeLock();
      return;
    }
    if (!canStart) return;
    if (secondsLeft === 0) setSecondsLeft(totalSeconds);
    setIsRunning(true);
    void requestWakeLock();
  }

  function handleReset() {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    releaseWakeLock();
  }

  function formatTime(totalSec: number) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function beep() {
    try {
      const ACtor =
        ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) ??
        AudioContext;
      const ctx = new ACtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch {
      /* noop */
    }
  }

  // 책 제목 입력 → 세션 초기화
  function applyBookTitle() {
    if (!bookInput.trim()) {
      // eslint-disable-next-line no-alert
      alert('책 제목을 입력하세요.');
      return;
    }
    setBookTitle(bookInput.trim());
    setIsRunning(false);
    setRequireEndPage(false);
    setSteps([]);
    setStartPage('');
    setEndPage('');
    setSecondsLeft(totalSeconds);
    releaseWakeLock();
  }

  // 설정 패널 숫자 입력 유틸
  function handleNumberInput(value: string, setter: (v: string) => void, maxLen = 3) {
    if (value === '') return setter('');
    const re = new RegExp(`^\\d{0,${maxLen}}$`);
    if (re.test(value)) setter(value);
  }

  // 설정 적용
  function applySettings() {
    const m = parseInt(minInput || '0', 10);
    const s = parseInt(secInput || '0', 10);
    const secs = clamp(m * 60 + s, 1, 2 * 60 * 60); // 1초 ~ 2시간
    setIsRunning(false);
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setShowSettings(false);
    releaseWakeLock();
  }

  // 스텝 기록
  function recordStep() {
    const sp = parseInt(startPage, 10);
    const ep = parseInt(endPage, 10);
    if (Number.isNaN(sp)) {
      // eslint-disable-next-line no-alert
      alert('시작페이지가 비어 있습니다.');
      return;
    }
    if (Number.isNaN(ep)) {
      // eslint-disable-next-line no-alert
      alert('종료페이지를 입력하세요.');
      return;
    }
    const pagesRead = Math.max(0, ep - sp + 1);
    const newStep: Step = {
      id: steps.length + 1,
      startPage: sp,
      endPage: ep,
      pagesRead,
      timestamp: Date.now(),
    };
    setSteps((prev) => [...prev, newStep]);
    void postStepToServer(userName || '(이름없음)', today, bookTitle || '(제목없음)', newStep);

    setStartPage(String(ep));
    setEndPage('');
    setRequireEndPage(false);
    setSecondsLeft(totalSeconds);
  }

  /* =========================
     상태/조건
     ========================= */
  const canEditStartPage = steps.length === 0 && !isRunning && !requireEndPage;
  const startPageIsValid = !Number.isNaN(parseInt(startPage, 10)) && parseInt(startPage, 10) >= 1;
  const bookReady = bookTitle.trim().length > 0;

  const canStart = useMemo(() => {
    if (isRunning) return true;
    if (!bookReady) return false;
    if (requireEndPage) return false;
    if (steps.length === 0) return startPageIsValid;
    return true;
  }, [isRunning, requireEndPage, steps.length, startPageIsValid, bookReady]);

  const stats = useMemo(() => {
    if (steps.length === 0) return { totalPages: 0, range: null as [number, number] | null };
    const minStart = Math.min(...steps.map((s) => s.startPage));
    const maxEnd = Math.max(...steps.map((s) => s.endPage));
    return {
      totalPages: Math.max(0, maxEnd - minStart + 1),
      range: [minStart, maxEnd] as [number, number],
    };
  }, [steps]);

  /* =========================
     UI
     ========================= */
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="rounded-2xl bg-white shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">독서 타이머</h1>
              <div className="text-xs text-slate-500">오늘: {today}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings((v) => !v)}
                className={`${btnBase} border border-slate-300 text-slate-700 hover:bg-slate-100`}
                title="타이머 길이 설정"
              >
                ⚙️ 설정
              </button>
              <button
                onClick={toggleFullscreen}
                className={`${btnBase} border border-slate-300 text-slate-700 hover:bg-slate-100`}
                title="전체화면 전환"
              >
                ⛶ 전체화면
              </button>
            </div>
          </div>

          {/* 이름 */}
          <div className="mt-3 flex items-center gap-2">
            <label className="text-sm">이름</label>
            <input
              type="text"
              className={`${inputBase}`}
              placeholder="예: 홍길동"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          {/* 책 제목 */}
          <div className="mt-3 flex items-center gap-2">
            <label className="text-sm">책 제목</label>
            <input
              type="text"
              className={`${inputBase}`}
              value={bookInput}
              onChange={(e) => setBookInput(e.target.value)}
              placeholder="예: 달빛 토끼의 모험"
            />
            <button
              onClick={applyBookTitle}
              className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}
              title="책 제목 설정 및 세션 초기화"
            >
              입력
            </button>
            {bookTitle && <span className="text-xs">현재 책: {bookTitle}</span>}
          </div>

          {/* 설정 패널 */}
          {showSettings && (
            <div className="mt-4 rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="text-sm text-slate-700 font-semibold mb-2">타이머 길이</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">분</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`${inputBase}`}
                    value={minInput}
                    onChange={(e) => handleNumberInput(e.target.value, setMinInput, 3)}
                    placeholder="예: 3"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">초</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`${inputBase}`}
                    value={secInput}
                    onChange={(e) => handleNumberInput(e.target.value, setSecInput, 2)}
                    placeholder="예: 0"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={applySettings}
                  className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}
                >
                  적용
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`${btnBase} border border-slate-300 text-slate-700 hover:bg-slate-100`}
                >
                  닫기
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                최소 1초, 최대 2시간. 적용 시 현재 라운드는 초기화됩니다.
              </div>
            </div>
          )}

          {/* 타이머 */}
          <div className="mt-4 border rounded p-4">
            <div className="text-center text-sm text-slate-500 mb-1">
              총 길이: {formatTime(totalSeconds)}
            </div>
            <div className="text-5xl font-semibold text-center">{formatTime(secondsLeft)}</div>
            <div className="mt-2 h-2 rounded bg-slate-200 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${elapsedPct}%` }} />
            </div>
            <div className="mt-3 flex gap-2 justify-center">
              <button
                onClick={handleStartStop}
                disabled={!canStart}
                className={`${btnBase} ${
                  isRunning
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : canStart
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-400 text-white'
                }`}
                title={
                  !bookTitle
                    ? '책 제목을 먼저 입력하세요'
                    : isRunning
                    ? '정지'
                    : steps.length === 0
                    ? '시작 (시작페이지 필요)'
                    : '시작'
                }
              >
                {isRunning ? '정지' : '시작'}
              </button>
              <button
                onClick={handleReset}
                disabled={isRunning}
                className={`${btnBase} border border-slate-300 text-slate-700 hover:bg-slate-100`}
              >
                리셋
              </button>
            </div>
            <div className="mt-2 text-center text-xs text-slate-500">
              {!bookTitle
                ? '책 제목을 입력하고 [입력]을 누르면 시작할 수 있습니다.'
                : requireEndPage
                ? '종료페이지를 입력하고 [기록]을 누르세요.'
                : steps.length === 0
                ? '첫 스텝: 시작페이지를 입력해야 시작할 수 있습니다.'
                : '다음 스텝: 종료페이지만 입력하면 됩니다.'}
            </div>
          </div>

          {/* 페이지 입력 */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* 시작페이지 */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">시작페이지</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`${inputBase} ${
                    canEditStartPage ? 'focus:ring-blue-500' : ''
                  }`}
                  value={startPage}
                  onChange={(e) => canEditStartPage && setStartPage(e.target.value)}
                  disabled={!canEditStartPage} // 비활성화 시 회색 스타일 표시
                  placeholder="예: 1"
                />
                {/* 버튼 높이/정렬 보정용 더미 버튼 (보이지 않음) */}
                <button
                  aria-hidden
                  tabIndex={-1}
                  className={`${btnBase} invisible min-w-[72px] h-10`}
                >
                  기록
                </button>
              </div>
            </div>

            {/* 종료페이지 */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">종료페이지</label>
              <div className="flex gap-2">
                <input
                  id="endPageInput"
                  type="text"
                  className={`${inputBase} ${
                    requireEndPage ? 'focus:ring-amber-500' : ''
                  }`}
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  disabled={!requireEndPage || isRunning}
                  placeholder={requireEndPage ? '예: 10' : '타이머 종료 후 활성화'}
                />
                <button
                  onClick={recordStep}
                  disabled={!requireEndPage || !endPage}
                  className={`${btnBase} min-w-[72px] h-10 bg-emerald-600 text-white hover:bg-emerald-700`}
                  title="타이머 종료 후에만 기록할 수 있어요"
                >
                  기록
                </button>
              </div>
            </div>
          </div>

          {/* 스텝 리스트 */}
          <div className="mt-4 space-y-2">
            {steps.map((st) => (
              <div key={st.id} className="border rounded p-3">
                <div className="font-semibold">
                  스텝 {st.id}
                  {st.pagesRead < 5 && (
                    <span className="ml-2 text-xs font-semibold text-rose-600">5페이지 미만</span>
                  )}
                  {st.pagesRead >= 10 && (
                    <span className="ml-2 text-xs font-semibold text-blue-600">10페이지 이상</span>
                  )}
                </div>
                <div className="text-sm text-slate-600">
                  {st.startPage} → {st.endPage} ({st.pagesRead}페이지)
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(st.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* 통계 패널 */}
          <div className="mt-6 rounded-xl border border-slate-200 p-4 bg-white">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">통계</h2>
            <div className="text-sm text-slate-600 mb-1">총 읽은 페이지(범위)</div>
            <div className="text-2xl font-semibold">
              {stats.totalPages} <span className="text-sm">페이지</span>
            </div>
            {stats.range ? (
              <div className="text-xs text-slate-500 mt-1">
                범위: {stats.range[0]} ~ {stats.range[1]}
              </div>
            ) : (
              <div className="text-sm text-slate-500 mt-1">아직 기록된 스텝이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
