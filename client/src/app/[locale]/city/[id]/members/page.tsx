import { redirect } from 'next/navigation';

interface MembersPageProps {
  params: Promise<{ id: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { id: cityId } = await params;

  redirect(`/city/${cityId}/admin-settings?section=members`);
}
