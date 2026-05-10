import CityLayoutShell from './_components/CityLayoutShell';
interface CityLayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export default async function CityLayout(props: CityLayoutProps) {
  const { children, params } = props;
  const { id } = params;

  return <CityLayoutShell cityId={id}>{children}</CityLayoutShell>;
}
