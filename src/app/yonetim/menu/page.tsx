import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { formatTL } from "@/lib/money";
import { TAGS, isTag } from "@/lib/tags";
import { CategoryForm, DeleteCategory, ProductActions, ProductForm } from "./forms";

export const metadata: Metadata = { title: "Menü yönetimi" };
export const dynamic = "force-dynamic";

export default async function MenuAdminPage() {
  const menu = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
    with: { products: { orderBy: [asc(products.sortOrder), asc(products.id)] } },
  });
  const options = menu.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Menü yönetimi</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {menu.length === 0 && <Card>Henüz kategori yok. Sağdaki formdan ekleyin.</Card>}
          {menu.map((c) => (
            <Card key={c.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{c.name}</h2>
                <span className="text-sm text-stone-500">{c.products.length} ürün</span>
              </div>
              <ul className="divide-y divide-stone-100">
                {c.products.map((p) => (
                  <li key={p.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {p.name}
                          {!p.isAvailable && (
                            <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-600">
                              Tükendi
                            </span>
                          )}
                        </p>
                        <p className="truncate text-sm text-stone-500">{p.description}</p>
                        {p.tags.filter(isTag).length > 0 && (
                          <p className="mt-1 flex gap-1">
                            {p.tags.filter(isTag).map((t) => (
                              <span key={t} className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${TAGS[t].className}`}>
                                {TAGS[t].icon} {TAGS[t].label}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold">{formatTL(p.price)}</span>
                    </div>
                    <ProductActions product={p} categories={options} />
                  </li>
                ))}
              </ul>
              <DeleteCategory id={c.id} name={c.name} empty={c.products.length === 0} />
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold">Yeni ürün</h2>
            {options.length ? <ProductForm categories={options} /> : <p className="text-sm">Önce kategori ekleyin.</p>}
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">Yeni kategori</h2>
            <CategoryForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
