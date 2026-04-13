"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const COMMON_TIMEZONES = [
  "UTC",
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
];

export default function NewBusinessPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    timezone: "UTC",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: slugify(name),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create business");
        toast(data.error ?? "Error al crear la cuenta", "error");
        return;
      }

      toast("Cuenta creada correctamente", "success");
      router.push(`/businesses/${data.data.slug}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-white">Nueva cuenta</h1>
        <p className="text-zinc-500 mt-1">Anade una nueva cuenta de Instagram</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Nombre *
              </label>
              <Input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Mi Marca"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Slug *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm">/</span>
                <Input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  className="flex-1"
                  placeholder="mi-marca"
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Minusculas, alfanumerico y guiones
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Zona horaria *
              </label>
              <select
                required
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
                className="w-full rounded-lg border border-white/[0.08] bg-surface-secondary px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-all"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Descripcion
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                className="w-full rounded-lg border border-white/[0.08] bg-surface-secondary px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-transparent transition-all"
                placeholder="Descripcion opcional"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Crear cuenta
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
