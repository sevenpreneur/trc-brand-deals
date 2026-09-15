import Sidebar from "@/components/layout/Sidebar";
import { requireSession } from "@/apis/session";

/** Menyediakan profil untuk sidebar; pagar sesi sebenarnya ada di tiap page. */
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await requireSession();

  return (
    <>
      <Sidebar user={user} />
      {/* Padding kiri menyisakan ruang untuk sidebar yang posisinya fixed. */}
      <div className="flex min-h-dvh flex-col lg:pl-62">{children}</div>
    </>
  );
}
