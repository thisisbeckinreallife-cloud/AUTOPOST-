/**
 * /businesses/[slug]/upload — DEPRECADO
 *
 * Antes era el wizard de upload independiente. Ahora todo el flow de
 * subida pasa por el chat IA: el usuario sube su carpeta o medias sueltos
 * dentro del chat con el botón 📎, la IA analiza, agrupa carruseles,
 * propone calendario, y el usuario confirma desde el propio chat.
 *
 * Esta ruta redirige al chat para que las URLs antiguas o bookmarks
 * sigan funcionando.
 */
import { redirect } from "next/navigation";

export default function UploadRedirectPage({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/businesses/${params.slug}/chat`);
}
