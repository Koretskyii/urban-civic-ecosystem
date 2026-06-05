import AdminSettingsView from './_components/AdminSettingsView';

interface AdminSettingsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}

export default async function AdminSettingsPage(props: AdminSettingsPageProps) {
  const { id } = await props.params;
  const { section } = await props.searchParams;

  return <AdminSettingsView cityId={id} section={section} />;
}
