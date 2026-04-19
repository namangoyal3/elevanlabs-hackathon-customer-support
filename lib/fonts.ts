import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';

/**
 *  Type system for CallPilot.
 *
 *    sans  → Inter           — UI body, labels, controls. Variable, subsetted.
 *    serif → Instrument Serif — editorial serif for brand + customer name.
 *                               Italic is the only weight Google ships;
 *                               we use the upright 400 exclusively.
 *    mono  → JetBrains Mono   — transcripts, IDs, numbers. Crisper than
 *                               ui-monospace, has tabular-nums + proper
 *                               italics.
 *
 *  Each font exposes a CSS variable so tailwind.config.ts can wire them
 *  into `font-sans / font-serif / font-mono` utilities.
 */

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
});

export const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const FONT_VARIABLES = `${inter.variable} ${instrumentSerif.variable} ${jetBrainsMono.variable}`;
