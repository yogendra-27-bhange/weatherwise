import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'WeatherWise',
  description: 'Next-gen Weather Forecasting Web App',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#69B4FF', // Default theme color, can be updated by ThemeSwitcher via CSS vars
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/fevicon.png" type="image/png" />
        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(registration => console.log('Service Worker registered: ', registration))
                    .catch(registrationError => console.log('Service Worker registration failed: ', registrationError));
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
