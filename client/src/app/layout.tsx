import type { Metadata } from 'next';
import { QueryProvider, ThemeRegistry } from '@/providers';
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
      <body
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <ThemeRegistry>
          <QueryProvider>
            <Header />
            <main style={{ flexGrow: 1 }}>{children}</main>
            <Footer />
          </QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
