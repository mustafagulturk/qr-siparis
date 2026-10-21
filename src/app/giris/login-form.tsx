"use client";

import { useActionState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { login } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [error, action, pending] = useActionState(login, null);
  return (
    <Card>
      <form action={action} className="space-y-4">
        <input type="hidden" name="sonra" value={next ?? ""} />
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            E-posta
          </label>
          <Input id="email" name="email" type="email" required autoComplete="username" className="mt-1" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Şifre
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1"
          />
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button className="w-full" disabled={pending}>
          {pending ? "Giriş yapılıyor..." : "Giriş yap"}
        </Button>
      </form>
    </Card>
  );
}
