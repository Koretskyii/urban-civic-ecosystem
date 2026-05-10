import PostsGrid from './_components/PostsGrid';

interface CityPostsProps {
  params: { id: string };
}

export default async function CityPostsPage(props: CityPostsProps) {
  const { id } = props.params;

  return <PostsGrid cityId={id} />;
}
