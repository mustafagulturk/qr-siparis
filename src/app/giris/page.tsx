import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Personel girişi" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sonra?: string }> }) {
  const { sonra } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-br from-brand-50 to-stone-100 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-4xl">🍽️</div>
          <h1 className="mt-2 text-2xl font-bold">Personel girişi</h1>
          <p className="text-sm text-stone-500">Mutfak ve yönetim paneline erişim</p>
        </div>
        <LoginForm next={sonra} />
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 p-4 text-xs text-stone-500">
          <p className="font-semibold text-stone-700">Demo hesapları</p>
          <p className="mt-1">Yönetici: yonetici@demo.com / demo1234</p>
          <p>Mutfak: mutfak@demo.com / demo1234</p>
        </div>
      </div>
    </main>
  );
}
