// next.config.ts
import type { NextConfig } from 'next';
//import withPWA from 'next-pwa';

//const withPWAFn = withPWA({
 // dest: 'public',
 // register: true,
 // skipWaiting: true,
//});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

//export default withPWAFn(nextConfig);

export default nextConfig;