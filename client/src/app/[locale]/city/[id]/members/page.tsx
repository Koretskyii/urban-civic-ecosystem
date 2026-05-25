import MembersView from './_components/MembersView';

interface MembersPageProps {
  params: Promise<{ id: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { id: cityId } = await params;

  return <MembersView cityId={cityId} />;
}
