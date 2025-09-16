// 최소 설치 신호: 설치/활성화 즉시 클레임
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

// (선택) 기본 오프라인 대응은 나중에 캐시 전략 추가해도 됨
