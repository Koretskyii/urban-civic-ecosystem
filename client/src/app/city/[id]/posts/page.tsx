import PostsGrid from './_components/PostsGrid';

export default async function CityPostsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PostsGrid cityId={id} />;
}
