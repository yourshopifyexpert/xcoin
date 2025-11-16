import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XCoin - Crypto Tax Platform',
  description: 'Calculate and file your crypto taxes with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
