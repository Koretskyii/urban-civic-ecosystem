import CityLayoutShell from './city-home/CityLayoutShell';
interface CityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function CityLayout(props: CityLayoutProps) {
  const { children, params } = props;
  const { id } = await params;

  return <CityLayoutShell cityId={id}>{children}</CityLayoutShell>;
}
