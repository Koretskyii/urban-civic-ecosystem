import CommunityView from './_components/CommunityView';

export default async function CityCommunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CommunityView cityId={id} />;
}
