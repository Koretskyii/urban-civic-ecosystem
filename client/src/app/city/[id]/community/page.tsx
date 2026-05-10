import CommunityView from './_components/CommunityView';

interface CityCommunityPageProps {
  params: { id: string };
}

export default async function CityCommunityPage(props: CityCommunityPageProps) {
  const { id } = props.params;

  return <CommunityView cityId={id} />;
}
