import { NextResponse } from "next/server";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

/** Minimal valid 1x1 JPEG */
const MIN_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof" +
    "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh" +
    "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR" +
    "CAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAA" +
    "AAAAAQIDBBEhMQUSQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAA" +
    "AAP/aAAwDAQACEQMRAD8Aj3e5p6rU2s7V3F9r4Nae8QrZdxKdyKqiZ/mKKAP/2Q==",
  "base64",
);

const LEEME = `=== AUTOPOST — Ejemplo de ZIP ===

Este ZIP de ejemplo muestra las dos formas de organizar tu contenido.


── OPCIÓN FÁCIL (carpeta "opcion-facil") ──

Pon tus fotos sueltas en una carpeta y listo.
Nosotros las programamos automáticamente, una por día.

  mi-carpeta/
    foto1.jpg
    foto2.jpg
    foto3.jpg


── OPCIÓN COMPLETA (carpeta "opcion-completa") ──

Crea una subcarpeta por cada publicación.
El nombre de la carpeta lleva la fecha y un título:

  mi-carpeta/
    2026-04-15_promo-verano/
      foto.jpg           ← la imagen del post
      caption.txt        ← el texto que se publicará
    2026-04-20_sorteo/
      imagen.jpg
      caption.txt

Formato del nombre: AAAA-MM-DD_titulo-del-post

El archivo caption.txt es el texto de tu publicación.
Puedes incluir hashtags, emojis, lo que quieras.


── CONSEJOS ──

• Formatos admitidos: JPG, PNG, WEBP
• Puedes mezclar ambas opciones en el mismo ZIP
• Las fechas deben ser futuras
• Un post puede tener varias imágenes (carrusel)

¡Eso es todo! Sube tu ZIP y nosotros hacemos el resto.
`;

const CAPTION_PROMO = `☀️ ¡Llega el verano y nuestras ofertas también!

20% de descuento en toda la colección.
Solo esta semana — no te lo pierdas.

👉 Link en bio

#verano #ofertas #moda #descuentos #rebajas`;

const CAPTION_SORTEO = `🎁 ¡SORTEO! Gana un lote de productos gratis.

Para participar:
1. Síguenos
2. Dale like a este post
3. Menciona a 2 amigos en comentarios

Ganador el 25 de abril. ¡Suerte! 🍀

#sorteo #gratis #concurso #giveaway`;

export async function GET() {
  const zip = new JSZip();
  const root = zip.folder("ejemplo-autopost")!;

  // LEEME.txt
  root.file("LEEME.txt", LEEME);

  // ── Option 1: simple (just images) ──
  const easy = root.folder("opcion-facil")!;
  easy.file("foto1.jpg", MIN_JPEG);
  easy.file("foto2.jpg", MIN_JPEG);
  easy.file("foto3.jpg", MIN_JPEG);

  // ── Option 2: full control (date folders + captions) ──
  const full = root.folder("opcion-completa")!;

  const post1 = full.folder("2026-04-15_promo-verano")!;
  post1.file("foto.jpg", MIN_JPEG);
  post1.file("caption.txt", CAPTION_PROMO);

  const post2 = full.folder("2026-04-20_sorteo")!;
  post2.file("imagen.jpg", MIN_JPEG);
  post2.file("caption.txt", CAPTION_SORTEO);

  // Generate ZIP
  const buf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return new NextResponse(buf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="ejemplo-autopost.zip"',
      "Content-Length": String(buf.length),
    },
  });
}
