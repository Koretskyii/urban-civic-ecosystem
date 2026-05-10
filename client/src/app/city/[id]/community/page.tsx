import CommunityView from './_components/CommunityView';

interface CityCommunityPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityCommunityPage(props: CityCommunityPageProps) {
  const { id } = await props.params;

  return <CommunityView cityId={id} />;
}
