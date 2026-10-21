import Link from "next/link";
import { RESTAURANT_NAME } from "@/lib/config";

const FEATURES = [
  ["📱", "QR ile menü", "Müşteri masadaki kodu okutur, uygulama indirmeden menüyü görür ve sipariş verir.", "from-sky-500/15 to-sky-500/5"],
  ["⚡", "Gerçek zamanlı", "Sipariş mutfak ekranına anında düşer, müşteri durumunu saniye saniye takip eder.", "from-amber-500/15 to-amber-500/5"],
  ["👨‍🍳", "Mutfak paneli", "Siparişler Alındı → Hazırlanıyor → Hazır akışında yönetilir, yeni siparişte ses çalar.", "from-ember-500/15 to-ember-500/5"],
  ["📊", "Yönetim paneli", "Menü ve fiyat yönetimi, masa QR kodları, günlük ciro ve en çok satanlar.", "from-brand-500/15 to-brand-500/5"],
];

const STEPS = [
  ["1", "QR'ı okut", "Masadaki kodu telefon kamerasıyla okut."],
  ["2", "Seç ve gönder", "Menüden seç, not ekle, tek dokunuşla sipariş ver."],
  ["3", "Canlı takip et", "Siparişin hazırlanışını anlık olarak izle."],
];

function PhoneMockup() {
  return (
    <div className="animate-float relative mx-auto w-64 rounded-[2.5rem] border-[10px] border-stone-900 bg-stone-50 shadow-2xl shadow-black/40">
      <div className="absolute left-1/2 top-0 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-stone-900" />
      <div className="overflow-hidden rounded-[1.8rem]">
        <div className="bg-gradient-to-br from-brand-600 to-brand-900 px-4 pb-4 pt-8 text-white">
          <p className="text-[10px] text-brand-100">Hoş geldiniz · Masa 4</p>
          <p className="text-lg font-bold">{RESTAURANT_NAME}</p>
        </div>
        <div className="space-y-2 p-3">
          {[
            ["🍢", "Ali Nazik", "₺420"],
            ["🥮", "Fıstıklı Baklava", "₺260"],
            ["☕", "Menengiç Kahvesi", "₺75"],
          ].map(([e, n, p], i) => (
            <div key={n} className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm" style={{ animationDelay: `${i * 120}ms` }}>
              <span className="grid size-9 place-items-center rounded-lg bg-stone-100 text-lg">{e}</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-stone-800">{n}</p>
                <p className="text-[11px] font-bold text-brand-700">{p}</p>
              </div>
              <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">+</span>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-600 px-3 py-2.5 text-xs font-semibold text-white">
            <span className="rounded-full bg-white/20 px-2">3</span>
            <span>Sepeti görüntüle</span>
            <span>₺755</span>
          </div>
        </div>
      </div>
      <div className="animate-pop-in absolute -right-16 top-24 hidden rounded-2xl bg-white p-3 text-xs shadow-xl sm:block" style={{ animationDelay: "1s" }}>
        <p className="font-semibold text-stone-800">🔔 Yeni sipariş</p>
        <p className="text-stone-500">Masa 4 · 3 ürün</p>
      </div>
      <div className="animate-pop-in absolute -left-20 bottom-20 hidden rounded-2xl bg-white p-3 text-xs shadow-xl sm:block" style={{ animationDelay: "1.6s" }}>
        <p className="font-semibold text-brand-700">👨‍🍳 Hazırlanıyor</p>
        <p className="text-stone-500">Tahmini 12 dk</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-dvh overflow-x-clip">
      <section className="relative isolate overflow-hidden bg-brand-900 px-5 pb-24 pt-16 text-white">
        <div className="pattern-dots absolute inset-0 -z-10" />
        <div className="animate-blob absolute -left-32 -top-32 -z-10 size-96 rounded-full bg-brand-500/40 blur-3xl" />
        <div className="animate-blob absolute -bottom-40 right-0 -z-10 size-[28rem] rounded-full bg-ember-500/25 blur-3xl [animation-delay:-5s]" />

        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div className="animate-pop-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
              <span className="size-2 animate-pulse rounded-full bg-lime-300" /> Gerçek zamanlı sipariş sistemi
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-6xl">
              Restoranınız için <span className="text-shimmer">QR menü</span> ve sipariş
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">
              Garson beklemeden sipariş, mutfakta anlık bildirim ve işletme sahibi için raporlar. Hepsi tek bir web
              uygulamasında.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/m/demo-masa-1"
                className="press rounded-xl bg-white px-5 py-3 font-semibold text-brand-700 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-brand-50"
              >
                📱 Müşteri olarak dene
              </Link>
              <Link href="/mutfak" className="press rounded-xl border border-white/25 bg-white/10 px-5 py-3 font-semibold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">
                👨‍🍳 Mutfak paneli
              </Link>
              <Link href="/yonetim" className="press rounded-xl border border-white/25 bg-white/10 px-5 py-3 font-semibold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">
                📊 Yönetim paneli
              </Link>
            </div>
            <p className="mt-5 text-sm text-brand-100/80">
              💡 Müşteri ekranını ve mutfak panelini yan yana açıp sipariş verin, siparişin anında düştüğünü görün.
            </p>
          </div>
          <PhoneMockup />
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-12 grid max-w-5xl gap-4 px-5 sm:grid-cols-3">
        {STEPS.map(([n, title, text], i) => (
          <div
            key={n}
            className="animate-pop-in rounded-2xl border border-stone-200 bg-white p-5 shadow-lg shadow-stone-900/5"
            style={{ animationDelay: `${200 + i * 120}ms` }}
          >
            <span className="grid size-9 place-items-center rounded-full bg-brand-600 font-bold text-white">{n}</span>
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-stone-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20">
        <h2 className="text-center text-3xl font-bold">Tek sistemde üç ekran</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-stone-600">
          Müşteri, mutfak ve yönetici aynı veriyi gerçek zamanlı olarak paylaşır.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map(([icon, title, text, grad]) => (
            <div
              key={title}
              className={`group rounded-2xl border border-stone-200 bg-gradient-to-br ${grad} p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="grid size-12 place-items-center rounded-xl bg-white text-2xl shadow-sm transition group-hover:scale-110 group-hover:rotate-6">
                {icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        <a href="https://github.com/mustafagulturk/qr-siparis" className="hover:text-brand-700 hover:underline">
          GitHub&apos;da kaynak kodu
        </a>{" "}
        · Mustafa Gültürk
      </footer>
    </main>
  );
}
