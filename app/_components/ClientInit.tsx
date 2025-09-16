'use client';
import { useEffect } from 'react';

export default function ClientInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const onLoad = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .catch(console.error);
      };
      // 이미 로드된 상태면 즉시 등록, 아니면 load 후 등록
      if (document.readyState === 'complete') onLoad();
      else window.addEventListener('load', onLoad, { once: true });
    }
  }, []);
  return null;
}
