'use client';
import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // localhost 또는 배포(HTTPS)에서만 등록
      const swUrl = '/sw.js';
      navigator.serviceWorker
        .register(swUrl)
        .catch((err) => console.error('SW register failed:', err));
    }
  }, []);
  return null;
}
