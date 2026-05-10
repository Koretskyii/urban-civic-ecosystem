import PostsGrid from './_components/PostsGrid';

interface CityPostsProps {
  params: Promise<{ id: string }>;
}

export default async function CityPostsPage(props: CityPostsProps) {
  const { id } = await props.params;

  return <PostsGrid cityId={id} />;
}
