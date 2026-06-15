import { AdminTabsNav } from './_components/AdminTabsNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <AdminTabsNav />
      </div>
      {children}
    </div>
  );
}
