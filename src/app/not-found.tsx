import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <div className="text-5xl">🤔</div>
        <h1 className="mt-3 text-2xl font-bold">Sayfa bulunamadı</h1>
        <p className="mt-1 text-stone-500">QR kod eski olabilir. Lütfen garsondan yardım isteyin.</p>
        <Link href="/" className="mt-6 inline-block text-brand-700 hover:underline">
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
