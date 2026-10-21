import Link from "next/link";

const FEATURES = [
  ["📱", "QR ile menü", "Müşteri masadaki kodu okutur, uygulama indirmeden menüyü görür ve sipariş verir."],
  ["⚡", "Gerçek zamanlı", "Sipariş mutfak ekranına anında düşer, müşteri durumunu canlı takip eder."],
  ["👨‍🍳", "Mutfak paneli", "Siparişler Alındı → Hazırlanıyor → Hazır akışında yönetilir, yeni siparişte ses çalar."],
  ["📊", "Yönetim paneli", "Menü ve fiyat yönetimi, masa QR kodları, günlük ciro ve en çok satanlar."],
];

export default function Home() {
  return (
    <main className="min-h-dvh">
      <section className="bg-gradient-to-br from-brand-600 to-brand-900 px-5 py-20 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="font-medium text-brand-100">Restoranlar için</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-6xl">QR Menü ve Sipariş Sistemi</h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-100">
            Garson beklemeden sipariş, mutfakta anlık bildirim ve işletme sahibi için raporlar. Hepsi tek bir web
            uygulamasında.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/m/demo-masa-1"
              className="rounded-xl bg-white px-5 py-3 font-semibold text-brand-700 hover:bg-brand-50"
            >
              📱 Müşteri olarak dene
            </Link>
            <Link href="/mutfak" className="rounded-xl bg-white/15 px-5 py-3 font-semibold hover:bg-white/25">
              👨‍🍳 Mutfak paneli
            </Link>
            <Link href="/yonetim" className="rounded-xl bg-white/15 px-5 py-3 font-semibold hover:bg-white/25">
              📊 Yönetim paneli
            </Link>
          </div>
          <p className="mt-4 text-sm text-brand-100">
            İpucu: Müşteri ekranını ve mutfak panelini yan yana açıp sipariş verin, siparişin anında düştüğünü görün.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-5 px-5 py-14 sm:grid-cols-2">
        {FEATURES.map(([icon, title, text]) => (
          <div key={title} className="rounded-2xl border border-stone-200 bg-white p-6">
            <div className="text-3xl">{icon}</div>
            <h2 className="mt-3 text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-stone-600">{text}</p>
          </div>
        ))}
      </section>

      <footer className="pb-10 text-center text-sm text-stone-500">
        <a href="https://github.com/mustafagulturk/qr-siparis" className="hover:underline">
          GitHub&apos;da kaynak kodu
        </a>{" "}
        · Mustafa Gültürk
      </footer>
    </main>
  );
}
