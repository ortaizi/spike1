import type { Metadata } from 'next';
import { Assistant, Heebo, Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
});

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'spike - פלטפורמת ניהול אקדמי',
  description: 'פלטפורמה מקיפה לניהול אקדמי לסטודנטים ישראלים',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='he' dir='rtl' suppressHydrationWarning>
      <body
        className={`${heebo.variable} ${assistant.variable} ${inter.variable} ${poppins.variable} font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
