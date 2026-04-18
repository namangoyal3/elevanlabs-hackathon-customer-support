import type { Metadata } from 'next';
import { FONT_VARIABLES } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'CallPilot — AI co-pilot for customer support',
  description: 'Real-time knowledge retrieval, live sentiment, and post-call summaries for support agents on live calls.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={FONT_VARIABLES}>
      <body className="bg-bg text-fg font-sans antialiased">{children}</body>
    </html>
  );
}
