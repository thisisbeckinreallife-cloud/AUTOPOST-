"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function DeleteBusinessButton({ slug, name }: { slug: string; name: string }) {
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/businesses/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "No se pudo eliminar", "error");
        setDeleting(false);
        return;
      }
      toast(`"${name}" eliminada correctamente`, "success");
      router.push("/businesses");
      router.refresh();
    } catch {
      toast("Error de red", "error");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-300"
      >
        <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
        Eliminar cuenta
      </button>

      {/* Confirm modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => !deleting && setShowModal(false)}
          />
          <div className="relative w-full max-w-md glass-strong rounded-2xl p-6 animate-card-appear glow-border">
            {/* Close */}
            <button
              type="button"
              onClick={() => !deleting && setShowModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
              disabled={deleting}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 mx-auto mb-4">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>

            <h2 className="text-lg font-bold text-slate-100 text-center mb-1">
              Eliminar &quot;{name}&quot;?
            </h2>
            <p className="text-sm text-slate-500 text-center mb-5">
              Esta accion es <span className="text-red-400 font-bold">irreversible</span>. Se eliminaran todos los posts, subidas, conexiones y datos asociados.
            </p>

            {/* Confirm by typing name */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                Escribe &quot;{name}&quot; para confirmar
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-xl border border-slate-700/50 bg-white/[0.03] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                placeholder={name}
                disabled={deleting}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmText !== name || deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
