import type { Metadata } from 'next';
import { QueryProvider, ThemeRegistry } from '@/providers';
import Header from '@/components/layout/header/Header';
import Footer from '@/components/layout/footer/Footer';
import { NextIntlClientProvider } from 'next-intl';
import { uk } from '@/i18n/uk';

export const metadata: Metadata = {
  title: uk.app.name,
  description: uk.app.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <ThemeRegistry>
          <NextIntlClientProvider locale="uk" messages={uk}>
            <QueryProvider>
              <Header />
              <main style={{ flexGrow: 1 }}>{children}</main>
              <Footer />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
