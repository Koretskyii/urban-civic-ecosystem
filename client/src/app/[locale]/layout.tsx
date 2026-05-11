import '../globals.css';
import type { Metadata } from 'next';
import { getMessages, getTranslations } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { QueryProvider, ThemeRegistry } from '@/providers';
import Header from '@/components/layout/header/Header';
import Footer from '@/components/layout/footer/Footer';
import { locales } from '@/i18n';

type MetadataProps = {
  params: Promise<{ locale: string }>;
};
interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });

  return {
    title: t('name'),
    description: t('tagline'),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <ThemeRegistry>
          <NextIntlClientProvider locale={locale} messages={messages}>
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
