
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos', // For mock news images
        port: '',
        pathname: '/**',
      },
      { // For OpenWeatherMap icons
        protocol: 'https',
        hostname: 'openweathermap.org',
        port: '',
        pathname: '/img/wn/**',
      },
      { // For YouTube thumbnails
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/vi/**',
      },
      // NewsAPI images can come from various sources.
      // Add specific known hostnames from NewsAPI sources if possible for better security.
      // Using a wildcard for now, but this is broad.
      {
        protocol: 'https',
        hostname: '*.com', // General TLDs, try to be more specific if possible
      },
      {
        protocol: 'https',
        hostname: '*.org',
      },
      {
        protocol: 'https',
        hostname: '*.net',
      },
      // Add other TLDs or specific news image hostnames as needed.
      // Example for a specific news image host:
      // {
      //   protocol: 'https',
      //   hostname: 'media.cnn.com',
      //   pathname: '/**',
      // }
    ],
  },
};

export default nextConfig;

    