/**
 * Tab "Chat IA" — generador completo de posts.
 *
 * El usuario selecciona formato (post / carrusel / reel / story), aspect ratio,
 * sube imágenes de referencia opcionales, escribe un prompt, y la IA genera:
 *   - Caption (con voz de marca aprendida del Brand DNA)
 *   - Imagen(es) FLUX que matchean el estilo y el ratio
 *   - Hashtags
 *
 * Server component que carga el business → pasa props al cliente que tiene la
 * lógica de generación.
 */
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ChatStudio } from "./chat-studio";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireAuth();

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      brandProfile: {
        select: { tone: true, niche: true },
      },
    },
  });
  if (!business) notFound();

  return (
    <ChatStudio
      businessId={business.id}
      businessName={business.name}
      businessSlug={params.slug}
      brandTone={business.brandProfile?.tone ?? null}
      brandNiche={business.brandProfile?.niche ?? null}
    />
  );
}
