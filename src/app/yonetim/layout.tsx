import { StaffHeader } from "@/components/staff-header";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("admin");
  return (
    <>
      <StaffHeader session={session} />
      <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
    </>
  );
}
