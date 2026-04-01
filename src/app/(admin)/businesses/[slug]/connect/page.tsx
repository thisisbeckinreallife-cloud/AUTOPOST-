"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink, CheckCircle } from "lucide-react";
import { useParams } from "next/navigation";

export default function ConnectPage() {
  const { slug } = useParams() as { slug: string };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${slug}/connect`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar la conexión. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }
      window.location.href = data.data.oauthUrl;
    } catch {
      setError("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Conecta tu Instagram</h1>
        <p className="text-slate-500 mt-1">
          Conecta tu cuenta para que AutoPost pueda publicar por ti automáticamente
        </p>
      </div>

      {/* Requirements */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-semibold text-slate-700">Antes de continuar, asegúrate de que:</p>
        <div className="space-y-2.5">
          <Req text="Tu cuenta de Instagram es una cuenta profesional (empresa o creador)" />
          <Req text="Tu cuenta está vinculada a una página de Facebook" />
          <Req text="Eres administrador de esa página de Facebook" />
        </div>
        <p className="text-xs text-slate-400 pt-1">
          ¿No tienes cuenta profesional?{" "}
          <a
            href="https://help.instagram.com/502981923235522"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-500 underline inline-flex items-center gap-0.5"
          >
            Cómo cambiarla <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <Button onClick={handleConnect} loading={loading} className="w-full h-12 text-base">
        <Instagram className="h-5 w-5 mr-2" />
        Conectar mi cuenta de Instagram
      </Button>

      <p className="text-xs text-center text-slate-400">
        Serás redirigido a Instagram para autorizar el acceso. No compartimos tu contraseña.
      </p>
    </div>
  );
}

function Req({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}
