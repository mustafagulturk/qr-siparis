"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { addTable, regenerateToken, toggleTable } from "../actions";

export function AddTableForm() {
  const [state, action, pending] = useActionState(addTable, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="flex gap-2">
      <Input name="name" placeholder="Örn: Bahçe 3" required aria-label="Masa adı" className="w-40" />
      <Button disabled={pending}>Masa ekle</Button>
    </form>
  );
}

export function PrintButton() {
  return (
    <Button variant="secondary" onClick={() => print()}>
      🖨️ Yazdır
    </Button>
  );
}

export function TableActions({ id, isActive }: { id: number; isActive: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 flex justify-center gap-1 text-sm print:hidden">
      <button
        disabled={pending}
        onClick={() => start(() => toggleTable(id, !isActive))}
        className="rounded-lg px-2 py-1 text-stone-600 hover:bg-stone-100"
      >
        {isActive ? "Pasif yap" : "Aktif yap"}
      </button>
      <button
        disabled={pending}
        onClick={() => confirm("Eski QR kod çalışmayacak. Devam edilsin mi?") && start(() => regenerateToken(id))}
        className="rounded-lg px-2 py-1 text-stone-600 hover:bg-stone-100"
      >
        Yeni QR
      </button>
    </div>
  );
}
