"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button, Input, cx } from "@/components/ui";
import { TAGS, TAG_KEYS } from "@/lib/tags";
import { addCategory, deleteCategory, deleteProduct, saveProduct, toggleProduct } from "../actions";

type Option = { id: number; name: string };
type Product = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  price: number;
  emoji: string;
  isAvailable: boolean;
  tags: string[];
};

const priceText = (kurus: number) => (kurus / 100).toFixed(2).replace(".", ",");

export function ProductForm({
  categories,
  product,
  onDone,
}: {
  categories: Option[];
  product?: Product;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(saveProduct, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      if (!product) form.current?.reset();
      onDone?.();
    }
  }, [state, product, onDone]);

  return (
    <form ref={form} action={action} className="space-y-3">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="flex gap-2">
        <Input name="emoji" defaultValue={product?.emoji ?? "🍽️"} className="w-16 text-center" aria-label="Emoji" />
        <Input name="name" defaultValue={product?.name} placeholder="Ürün adı" required aria-label="Ürün adı" />
      </div>
      <Input name="description" defaultValue={product?.description} placeholder="Açıklama" aria-label="Açıklama" />
      <div className="flex gap-2">
        <select
          name="categoryId"
          defaultValue={product?.categoryId}
          aria-label="Kategori"
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Input
          name="price"
          inputMode="decimal"
          defaultValue={product ? priceText(product.price) : ""}
          placeholder="Fiyat ₺"
          required
          aria-label="Fiyat"
          className="w-32"
        />
      </div>
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">Etiketler</legend>
        {TAG_KEYS.map((t) => (
          <label key={t} className="cursor-pointer">
            <input type="checkbox" name="tags" value={t} defaultChecked={product?.tags.includes(t)} className="peer sr-only" />
            <span
              className={cx(
                "inline-block rounded-lg border border-transparent px-2 py-1 text-xs font-semibold opacity-50 transition",
                "peer-checked:border-current peer-checked:opacity-100 peer-focus-visible:ring-2",
                TAGS[t].className,
              )}
            >
              {TAGS[t].icon} {TAGS[t].label}
            </span>
          </label>
        ))}
      </fieldset>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button disabled={pending} className="flex-1">
          {product ? "Kaydet" : "Ürün ekle"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Vazgeç
          </Button>
        )}
      </div>
    </form>
  );
}

export function CategoryForm() {
  const [state, action, pending] = useActionState(addCategory, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="flex gap-2">
      <Input name="name" placeholder="Örn: Kahvaltılar" required aria-label="Kategori adı" />
      <Button disabled={pending}>Ekle</Button>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function ProductActions({ product, categories }: { product: Product; categories: Option[] }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (editing) {
    return (
      <div className="mt-3 rounded-xl bg-stone-50 p-3">
        <ProductForm categories={categories} product={product} onDone={() => setEditing(false)} />
      </div>
    );
  }
  return (
    <div className="mt-2 flex gap-1 pl-11 text-sm">
      <button
        disabled={pending}
        onClick={() => start(() => toggleProduct(product.id, !product.isAvailable))}
        className="rounded-lg px-2 py-1 text-stone-600 hover:bg-stone-100"
      >
        {product.isAvailable ? "Tükendi olarak işaretle" : "Satışa aç"}
      </button>
      <button onClick={() => setEditing(true)} className="rounded-lg px-2 py-1 text-stone-600 hover:bg-stone-100">
        Düzenle
      </button>
      <button
        disabled={pending}
        onClick={() => confirm(`${product.name} silinsin mi?`) && start(() => deleteProduct(product.id))}
        className="rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
      >
        Sil
      </button>
    </div>
  );
}

export function DeleteCategory({
  id,
  name,
  empty,
}: {
  id: number;
  name: string;
  empty: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        confirm(empty ? `${name} kategorisi silinsin mi?` : `${name} ve içindeki tüm ürünler silinsin mi?`) &&
        start(() => deleteCategory(id))
      }
      className="mt-3 text-sm text-red-600 hover:underline"
    >
      Kategoriyi sil
    </button>
  );
}
