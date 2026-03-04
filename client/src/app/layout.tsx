import type { Metadata } from 'next';
import { QueryProvider, ThemeRegistry } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Urban Civic Ecosystem',
  description: 'Платформа міської громадської екосистеми',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <QueryProvider>{children}</QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
