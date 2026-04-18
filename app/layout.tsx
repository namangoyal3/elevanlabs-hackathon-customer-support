import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CallPilot — AI Co-Pilot for Customer Support',
  description: 'Real-time AI co-pilot for support agents on live calls.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-white antialiased">{children}</body>
    </html>
  );
}
