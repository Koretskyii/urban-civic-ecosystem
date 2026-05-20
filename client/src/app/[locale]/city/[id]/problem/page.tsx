import ProblemWorkspace from './_components/ProblemWorkspace';

interface CityProblemPageProps {
  params: Promise<{ id: string }>;
}

export default async function CityProblemPage({
  params,
}: CityProblemPageProps) {
  const { id: cityId } = await params;

  return <ProblemWorkspace cityId={cityId} />;
}
