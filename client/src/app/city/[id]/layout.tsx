import CityLayoutShell from './_components/CityLayoutShell';

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CityLayoutShell cityId={id}>{children}</CityLayoutShell>;
}
