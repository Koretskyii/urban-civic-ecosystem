import '../globals.css';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getMessages, getTranslations } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { QueryProvider, ThemeRegistry } from '@/providers';
import Header from '@/components/layout/header/Header';
import Footer from '@/components/layout/footer/Footer';
import { locales } from '@/i18n';
import { queryKeys } from '@/api/queryKeys';
import { API_BASE_URL } from '@/config';

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
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const queryClient = new QueryClient();

  if (accessToken) {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.auth.me(),
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Cookie: `access_token=${accessToken}`,
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to prefetch auth profile');
        }

        return response.json();
      },
    });
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <html lang={locale}>
      <body
        style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
      >
        <ThemeRegistry>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <QueryProvider dehydratedState={dehydratedState}>
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
