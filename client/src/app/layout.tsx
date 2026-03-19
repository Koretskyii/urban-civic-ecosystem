import type { Metadata } from 'next';
import { QueryProvider, ThemeRegistry } from '@/providers';
import './globals.css';
import Header from '@/components/layout/header/Header';
import Footer from '@/components/layout/footer/Footer';

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
          <QueryProvider>
            <Header />
            <main>
              {children}
            </main>
            <Footer />
          </QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
