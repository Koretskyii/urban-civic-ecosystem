import PlatformAdminSettingsView from './_components/PlatformAdminSettingsView';

interface PlatformAdminSettingsPageProps {
  searchParams: Promise<{ section?: string }>;
}

export default async function PlatformAdminSettingsPage(
  props: PlatformAdminSettingsPageProps,
) {
  const { section } = await props.searchParams;

  return <PlatformAdminSettingsView section={section} />;
}
