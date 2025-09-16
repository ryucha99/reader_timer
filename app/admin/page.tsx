'use client';

import { useEffect, useMemo, useState } from 'react';

/* =========================
   타입
   ========================= */
type Step = {
  id: number;
  user: string;
  date: string;   // YYYY-MM-DD
  book: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  timestamp: number; // ms
};

/* =========================
   공통 fetch 유틸 (타입 안전)
   ========================= */
async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { cache: 'no-store', ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? `- ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}

/* =========================
   페이지
   ========================= */
export default function AdminPage() {
  // 인증/로그인
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [authChecking, setAuthChecking] = useState(true);

  // 선택/데이터
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');

  const [dates, setDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<string>('');

  const [steps, setSteps] = useState<Step[]>([]);

  // 로딩 상태
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState(false);

  /* =========================
     인증 체크 (초기 자동 로그인 유지)
     ========================= */
  useEffect(() => {
    (async () => {
      try {
        setAuthChecking(true);
        //const data = await fetchJSON<{ authed: boolean }>('/api/admin/me');
        const data = await fetchJSON<{ authed: boolean }>('/admin/login');
        setAuthed(!!data.authed);
      } catch {
        setAuthed(false);
      } finally {
        setAuthChecking(false);
      }
    })();
  }, []);

  async function login() {
    try {
      //const res = await fetch('/api/admin/login', {
      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'same-origin', // 같은 오리진 쿠키 전송/수신 보장
        body: JSON.stringify({ password: pw }), // ← 혹시몰라 여긴 'password'로 고정
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        alert(`비밀번호가 올바르지 않습니다. (status ${res.status}${msg ? ` / ${msg}` : ''})`);
        return;
      }

      // 쿠키가 실제로 저장됐는지 즉시 확인
     // const me = await fetch('/api/admin/me', { cache: 'no-store', credentials: 'same-origin' });
      //const data = await me.json().catch(() => ({ authed: false }));

      const me = await fetch('/admin/login', { cache: 'no-store', credentials: 'same-origin' });
      const data = await me.json().catch(() => ({ authed: false }));

      if (!data.authed) {
        alert('로그인은 성공했지만 세션 확인에 실패했습니다. 브라우저 쿠키/오리진을 확인해 주세요.');
        return;
      }

      setAuthed(true);
      setPw('');
      await fetchUsers();
    } catch (e) {
      alert('로그인 중 오류가 발생했습니다.');
    }
  }



  async function logout() {
    try {
      //await fetch('/api/admin/logout', { method: 'POST', cache: 'no-store' });
      await fetch('/admin/logout', { method: 'POST', cache: 'no-store' });
    } catch {
      /* noop */
    } finally {
      // 상태 초기화
      setAuthed(false);
      setUsers([]);
      setSelectedUser('');
      setDates([]);
      setSelectedDates([]);
      setTitles([]);
      setSelectedTitle('');
      setSteps([]);
    }
  }

  /* =========================
     데이터 로더
     ========================= */
  async function fetchUsers() {
    if (!authed) return;
    try {
      setLoadingUsers(true);
      const data = await fetchJSON<string[]>('/api/stats/users');
      setUsers(data);
      // 사용자 바뀌므로 하위 상태 초기화
      setSelectedUser('');
      setDates([]);
      setSelectedDates([]);
      setTitles([]);
      setSelectedTitle('');
      setSteps([]);
    } catch (e) {
      alert('사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchDates(user: string) {
    if (!authed || !user) return;
    try {
      setLoadingDates(true);
      const data = await fetchJSON<string[]>(`/api/stats/dates?user=${encodeURIComponent(user)}`);
      setDates(data);
      setSelectedDates([]);
      setTitles([]);
      setSelectedTitle('');
      setSteps([]);
    } catch {
      alert('날짜 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingDates(false);
    }
  }

  async function fetchTitles(user: string, datesPicked: string[]) {
    if (!authed || !user || datesPicked.length === 0) return;
    try {
      setLoadingTitles(true);
      const data = await fetchJSON<string[]>(
        `/api/stats/books?user=${encodeURIComponent(user)}&dates=${encodeURIComponent(
          datesPicked.join(',')
        )}`
      );
      setTitles(data);
      setSelectedTitle('');
      setSteps([]);
    } catch {
      alert('책 제목 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingTitles(false);
    }
  }

  async function fetchSteps(user: string, datesPicked: string[], title: string) {
    if (!authed || !user || datesPicked.length === 0 || !title) return;
    try {
      setLoadingSteps(true);
      const data = await fetchJSON<Step[]>(
        `/api/stats/steps?user=${encodeURIComponent(user)}&dates=${encodeURIComponent(
          datesPicked.join(',')
        )}&book=${encodeURIComponent(title)}`
      );
      setSteps(data);
    } catch {
      alert('스텝 데이터를 불러오지 못했습니다.');
    } finally {
      setLoadingSteps(false);
    }
  }

  /* =========================
     선택 핸들러
     ========================= */
  function onPickUser(u: string) {
    setSelectedUser(u);
    // 날짜/책/스텝 초기화 및 새로 로드
    void fetchDates(u);
  }

  function toggleDate(d: string) {
    setSelectedTitle('');
    setSteps([]);
    setSelectedDates((prev) => {
      const next = prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d];
      // 날짜 선택이 변하면 책 목록을 갱신
      void fetchTitles(selectedUser, next);
      return next;
    });
  }

  function onPickTitle(t: string) {
    setSelectedTitle(t);
    // 타이틀 선택 시 스텝 로드
    void fetchSteps(selectedUser, selectedDates, t);
  }

  /* =========================
     리프레시 버튼 동작
     ========================= */
  async function refetchAll() {
    if (!authed) return;

    // 선택 상태에 맞춰 필요한 것만 순서대로 갱신
    if (!selectedUser) {
      await fetchUsers();
      return;
    }
    // 사용자 고정 시 날짜 갱신
    await fetchDates(selectedUser);

    // 날짜가 선택돼 있었다면 다시 반영 후 제목 갱신
    if (selectedDates.length > 0) {
      await fetchTitles(selectedUser, selectedDates);
    }

    // 책 제목이 있었으면 스텝도 갱신
    if (selectedDates.length > 0 && selectedTitle) {
      await fetchSteps(selectedUser, selectedDates, selectedTitle);
    }
  }

  /* =========================
     통계
     ========================= */
  const stats = useMemo(() => {
    if (steps.length === 0) return null;
    const count = steps.length;
    const sumPages = steps.reduce((acc, s) => acc + s.pagesRead, 0);
    const minStart = Math.min(...steps.map((s) => s.startPage));
    const maxEnd = Math.max(...steps.map((s) => s.endPage));
    const rangeLen = Math.max(0, maxEnd - minStart + 1);
    return { count, sumPages, minStart, maxEnd, rangeLen };
  }, [steps]);

  /* =========================
     초기 사용자 목록 자동 로드 (로그인 직후)
     ========================= */
  useEffect(() => {
    if (authed) void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]); // fetchUsers 내부에서 authed를 확인하므로 OK

  /* =========================
     UI
     ========================= */
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">관리자 페이지</h1>
          {authed && (
            <div className="flex items-center gap-2">
              <button
                onClick={refetchAll}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm"
                title="데이터 새로고침"
              >
                🔄 데이터 새로고침
              </button>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-sm"
                title="로그아웃"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>

        {!authed ? (
          <section className="mt-6 rounded-2xl bg-white p-6 shadow">
            {authChecking ? (
              <div className="text-slate-600 text-sm">세션 확인 중…</div>
            ) : (
              <>
                <label className="block text-sm text-slate-700 mb-2">비밀번호</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                  />
                  <button
                    onClick={login}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  >
                    로그인
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  데모 비밀번호는 <span className="font-semibold">1234</span> 입니다. 로그인하면 세션이 쿠키에
                  저장되어 새로고침 후에도 유지됩니다.
                </p>
              </>
            )}
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* 사용자 */}
            <section className="rounded-2xl bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 mb-3">사용자</h2>
                {loadingUsers && <span className="text-xs text-slate-500">로딩…</span>}
              </div>
              {users.length === 0 ? (
                <div className="text-slate-500 text-sm">사용자 데이터가 없습니다.</div>
              ) : (
                <ul className="space-y-2">
                  {users.map((u) => (
                    <li key={u}>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="user"
                          checked={selectedUser === u}
                          onChange={() => onPickUser(u)}
                        />
                        <span className="font-medium">{u}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 날짜(복수 선택) */}
            <section className="rounded-2xl bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 mb-3">날짜 (복수 선택 가능)</h2>
                {loadingDates && <span className="text-xs text-slate-500">로딩…</span>}
              </div>
              {!selectedUser ? (
                <div className="text-slate-500 text-sm">먼저 사용자를 선택하세요.</div>
              ) : dates.length === 0 ? (
                <div className="text-slate-500 text-sm">날짜 데이터가 없습니다.</div>
              ) : (
                <ul className="space-y-2">
                  {dates.map((d) => (
                    <li key={d}>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedDates.includes(d)}
                          onChange={() => toggleDate(d)}
                        />
                        <span className="font-medium">{d}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 책 제목(단일 선택) */}
            <section className="rounded-2xl bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 mb-3">책 제목 (단일 선택)</h2>
                {loadingTitles && <span className="text-xs text-slate-500">로딩…</span>}
              </div>
              {!selectedUser || selectedDates.length === 0 ? (
                <div className="text-slate-500 text-sm">사용자와 날짜를 먼저 선택하세요.</div>
              ) : titles.length === 0 ? (
                <div className="text-slate-500 text-sm">책 데이터가 없습니다.</div>
              ) : (
                <ul className="space-y-2">
                  {titles.map((t) => (
                    <li key={t}>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="title"
                          checked={selectedTitle === t}
                          onChange={() => onPickTitle(t)}
                        />
                        <span className="font-medium">{t}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 통계 + 스텝표 */}
            <section className="lg:col-span-3 rounded-2xl bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 mb-3">통계</h2>
                {loadingSteps && <span className="text-xs text-slate-500">로딩…</span>}
              </div>

              {!selectedUser || selectedDates.length === 0 || !selectedTitle ? (
                <div className="text-slate-500 text-sm">
                  사용자, 날짜(복수), 책 제목을 모두 선택하세요.
                </div>
              ) : steps.length === 0 ? (
                <div className="text-slate-500 text-sm">선택한 조건에 해당하는 스텝이 없습니다.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-sm text-slate-600">총 스텝 수</div>
                      <div className="text-3xl font-semibold text-slate-900">
                        {stats?.count ?? 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-sm text-slate-600">총 읽은 페이지</div>
                      <div className="text-3xl font-semibold text-slate-900">
                        {stats?.sumPages ?? 0}{' '}
                        <span className="text-lg align-middle text-slate-500">페이지</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-sm text-slate-600">범위(최소~최대)</div>
                      <div className="text-3xl font-semibold text-slate-900">
                        {stats?.rangeLen ?? 0}{' '}
                        <span className="text-lg align-middle text-slate-500">페이지</span>
                      </div>
                      {stats && (
                        <div className="text-xs text-slate-500 mt-1">
                          {stats.minStart} ~ {stats.maxEnd}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-600 border-b">
                          <th className="py-2 pr-4">#</th>
                          <th className="py-2 pr-4">날짜</th>
                          <th className="py-2 pr-4">책</th>
                          <th className="py-2 pr-4">시작</th>
                          <th className="py-2 pr-4">종료</th>
                          <th className="py-2 pr-4">읽은 페이지</th>
                          <th className="py-2 pr-4">시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {steps.map((s, i) => (
                          <tr key={s.id !== undefined ? String(s.id) : `${s.timestamp}-${i}`} className="border-b last:border-0">
                            <td className="py-2 pr-4">{i + 1}</td>
                            <td className="py-2 pr-4">{s.date}</td>
                            <td className="py-2 pr-4">{s.book}</td>
                            <td className="py-2 pr-4">{s.startPage}</td>
                            <td className="py-2 pr-4">{s.endPage}</td>
                            <td className="py-2 pr-4">{s.pagesRead}</td>
                            <td className="py-2 pr-4">
                              {new Date(s.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
