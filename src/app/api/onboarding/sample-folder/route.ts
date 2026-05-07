/**
 * GET /api/onboarding/sample-folder
 *
 * Devuelve un ZIP de ejemplo que el usuario puede descargar durante el
 * onboarding para entender la estructura esperada. Contenido:
 *
 *   muestra-autopost/
 *   ├── README.txt                  ← instrucciones en español
 *   ├── 2026-05-10_post-imagen/
 *   │   ├── caption.txt             ← copy del post
 *   │   └── imagen.jpg              ← placeholder JPG (1×1 px)
 *   ├── 2026-05-12_post-carrusel/
 *   │   ├── caption.txt
 *   │   ├── 01.jpg
 *   │   ├── 02.jpg
 *   │   └── 03.jpg
 *   └── 2026-05-14_post-reel/
 *       ├── caption.txt
 *       └── reel-anuncio.mp4        ← placeholder (en realidad TXT renombrado)
 *
 * Notas:
 *  - Los JPG son una imagen 1×1 minimal en bytes literales — el parser
 *    los reconoce por mimetype y los reemplazará por las imágenes reales
 *    cuando el user suba contenido propio.
 *  - El "reel-anuncio.mp4" es un TXT renombrado intencionalmente: la idea
 *    es que el user vea el patrón de naming pero no pesar 5MB en cada
 *    descarga.
 *  - jszip ya está instalado (lo confirmaste). NO usamos compresión por
 *    defecto (NO_COMPRESSION) — los archivos ya son tan pequeños que
 *    deflate añade overhead.
 *
 * Headers:
 *  - Content-Type: application/zip
 *  - Content-Disposition: attachment con nombre legible.
 *  - Cache-Control: public, max-age=3600 — el contenido es estático.
 */

import { NextResponse } from "next/server";
import JSZip from "jszip";

export const runtime = "nodejs";
export const dynamic = "force-static";

// JPG 1×1 píxel blanco — bytes mínimos válidos.
const TINY_JPG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AB//Z",
  "base64"
);

const README_TEXT = `MUESTRA — AUTOPOST
====================

Esta es una carpeta de ejemplo. Reemplaza los archivos por los tuyos
y comprime en .zip antes de subir.

Reglas básicas:

1. Cada subcarpeta = un post. El nombre debe empezar por la fecha (AAAA-MM-DD).
2. Cada subcarpeta debe contener:
   - 1 archivo "caption.txt" con el texto del post.
   - 1 o más imágenes (.jpg, .png, .webp) o un vídeo (.mp4, .mov).

Tipos de post:

- IMAGEN — 1 sola imagen. Ej: "imagen.jpg".
- CARRUSEL — 2 a 10 imágenes numeradas. Ej: "01.jpg", "02.jpg", "03.jpg".
- REEL — 1 vídeo .mp4 o .mov de máx. 90s. Ej: "reel-anuncio.mp4".

La IA detecta automáticamente el tipo según los archivos que encuentre.

Más detalles en https://autopost.app/docs/onboarding
`;

const SAMPLE_CAPTIONS = {
  imagen: `Lo que aprendimos en la última semana 👇

Tres cosas que cambiaron cómo trabajamos:

1. Menos reuniones, más asincronía.
2. Documentar todo, hablar después.
3. Decisiones explícitas con dueño claro.

¿Cuál te llevarías al equipo? 💬

#productividad #equipo`,

  carrusel: `Cómo organizamos el contenido de 1 mes en 30 minutos 👇

Te enseñamos paso a paso (desliza →):

1. Lluvia de ideas con IA.
2. Agrupar por tema.
3. Calendario con horarios óptimos.
4. Programar y olvidarse.

¿Lo probamos contigo esta semana? Comenta "SÍ".

#socialmedia #IA #marketing`,

  reel: `Lo que pasa cuando dejas de publicar todos los días.

Spoiler: nada bueno. Pero tampoco hace falta.

La frecuencia importa MENOS que la consistencia.
Mejor 3 posts buenos a la semana que 7 mediocres.

#contentcreator #estrategia`,
};

export async function GET() {
  try {
    const zip = new JSZip();
    const root = zip.folder("muestra-autopost");
    if (!root) throw new Error("zip folder create failed");

    root.file("README.txt", README_TEXT);

    // Post 1 — imagen.
    const post1 = root.folder("2026-05-10_post-imagen");
    if (!post1) throw new Error("post1 folder create failed");
    post1.file("caption.txt", SAMPLE_CAPTIONS.imagen);
    post1.file("imagen.jpg", TINY_JPG);

    // Post 2 — carrusel.
    const post2 = root.folder("2026-05-12_post-carrusel");
    if (!post2) throw new Error("post2 folder create failed");
    post2.file("caption.txt", SAMPLE_CAPTIONS.carrusel);
    post2.file("01.jpg", TINY_JPG);
    post2.file("02.jpg", TINY_JPG);
    post2.file("03.jpg", TINY_JPG);

    // Post 3 — reel (placeholder TXT renombrado).
    const post3 = root.folder("2026-05-14_post-reel");
    if (!post3) throw new Error("post3 folder create failed");
    post3.file("caption.txt", SAMPLE_CAPTIONS.reel);
    post3.file(
      "reel-anuncio.mp4",
      `[Placeholder] Reemplaza este archivo por tu vídeo .mp4 o .mov real (máx 90s).
Este archivo es solo un marcador en la muestra para mostrar el patrón de naming.
`
    );

    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="muestra-autopost.zip"',
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (err) {
    console.error("[onboarding/sample-folder] error", err);
    return NextResponse.json(
      {
        error: "ZIP_GENERATION_FAILED",
        message: "No pudimos generar la muestra. Inténtalo más tarde.",
      },
      { status: 500 }
    );
  }
}
