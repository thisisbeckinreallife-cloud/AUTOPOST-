"use client";

/**
 * Chat IA conversacional — UI principal del nuevo paradigma post-pivot.
 *
 * Flujo:
 *   - El usuario escribe mensajes en el textarea
 *   - El front llama POST /api/ai/chat con SSE
 *   - El stream emite eventos: text/tool_call/tool_result/done/error
 *   - Cada mensaje se renderiza como burbuja editorial
 *   - Tool calls aparecen como cards inline ("📊 Analizando batch...")
 *
 * Mantiene chatId entre turns para continuar conversación.
 * Auto-scroll al fondo cuando llegan deltas.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { Paperclip, Loader2, Check } from "lucide-react";

interface Props {
  businessId: string;
  businessName: string;
  businessSlug: string;
  brandTone: string | null;
  brandNiche: string | null;
}

interface UploadProgress {
  phase: "presigning" | "uploading" | "processing" | "done" | "error";
  fileName: string;
  pct: number;
  batchId?: string;
  error?: string;
}

// Whitelist de tool names válidos. Si el LLM alucina otros (como
// "Validation"), los ignoramos en lugar de mostrar chips falsos.
const VALID_TOOL_NAMES = new Set([
  "analyze_batch",
  "analyze_media_with_vision",
  "suggest_schedule",
  "confirm_batch_schedule",
  "recommend_posting_time",
  "update_brand_profile",
  "analyze_format_compatibility",
  "regroup_batch_with_ai",
  // legacy / planned
  "suggest_caption",
  "suggest_hashtags",
  "confirm_schedule",
]);

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: Array<{ name: string; input: unknown; output?: unknown; error?: string }>;
  pending?: boolean;
  /** Si está, se renderiza como banner rojo en lugar de burbuja del bot */
  errorBanner?: string;
}

export function ChatStudio({
  businessId,
  businessName,
  businessSlug,
  brandTone,
  brandNiche,
}: Props) {
  const { toast } = useToast();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hola. Soy tu asistente editorial para ${businessName}. Puedo:\n\n• Analizar batches que hayas subido\n• Sugerir captions y hashtags con la voz de tu marca\n• Recomendarte mejores horarios por plataforma\n• Proponerte un calendario completo de publicación\n\n¿En qué te ayudo?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [upload, setUpload] = useState<UploadProgress | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Auto-scroll cuando llegan mensajes
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  /**
   * Sube archivos desde el chat. Acepta:
   *   - Un ZIP → procesa como batch (carpeta comprimida con varios posts)
   *   - 1 imagen → 1 post tipo IMAGE
   *   - N imágenes (≤10) → 1 post tipo CAROUSEL
   *   - 1 video → 1 post tipo REEL
   *   - Mezclas raras → error claro
   * Tras procesar, envía mensaje pre-fabricado al LLM con el contexto.
   */
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (sending || upload || files.length === 0) return;

      // Clasificar
      const exts = files.map((f) => extOf(f.name));
      const types = files.map((f) => fileKind(f));

      // Caso 1: un único ZIP
      if (files.length === 1 && exts[0] === ".zip") {
        return uploadZipBatch(files[0]);
      }

      // Si hay un ZIP mezclado con otros tipos → error
      if (exts.some((e) => e === ".zip") && files.length > 1) {
        toast(
          "No mezcles un ZIP con otros archivos. Sube el ZIP solo o los archivos sueltos solos.",
          "error",
        );
        return;
      }

      // Validar todos los tipos
      if (types.some((t) => t === "unknown")) {
        const bad = files.find((_, i) => types[i] === "unknown");
        toast(
          `Formato no soportado: ${bad?.name ?? ""}. Usa JPG/PNG/WEBP/MP4/MOV/ZIP.`,
          "error",
        );
        return;
      }

      const hasImage = types.includes("image");
      const hasVideo = types.includes("video");
      if (hasImage && hasVideo) {
        toast(
          "No mezcles imágenes y videos en una misma subida — TikTok/Pinterest no aceptan mezcla. Súbelos por separado.",
          "error",
        );
        return;
      }

      if (files.length > 10) {
        toast("Máximo 10 archivos en una subida (límite del feed Instagram).", "error");
        return;
      }

      // Tamaños
      const oversized = files.find(
        (f, i) =>
          (types[i] === "image" && f.size > 8 * 1024 * 1024) ||
          (types[i] === "video" && f.size > 100 * 1024 * 1024),
      );
      if (oversized) {
        toast(
          `${oversized.name} excede el límite de tamaño (8 MB imagen, 100 MB video).`,
          "error",
        );
        return;
      }

      // Caso 2-4: medias sueltos → /api/batches/direct
      return uploadDirectMedia(files, hasVideo ? "reel" : files.length > 1 ? "carousel" : "image");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sending, upload, businessSlug],
  );

  /**
   * Sube un único ZIP usando el flow batch original.
   */
  const uploadZipBatch = useCallback(
    async (file: File) => {
      if (file.size > 100 * 1024 * 1024) {
        toast("El ZIP supera los 100 MB", "error");
        return;
      }

      setUpload({ phase: "presigning", fileName: file.name, pct: 0 });

      try {
        const presignRes = await fetch("/api/batches/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessSlug,
            fileName: file.name,
            fileSize: file.size,
            contentType: "application/zip",
          }),
        });
        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          throw new Error(err.error ?? `Presign falló (${presignRes.status})`);
        }
        const { data: presignData } = await presignRes.json();

        setUpload({ phase: "uploading", fileName: file.name, pct: 0 });
        await uploadWithProgress(presignData.uploadUrl, file, (pct) =>
          setUpload((u) => (u ? { ...u, pct } : u)),
        );

        setUpload({
          phase: "processing",
          fileName: file.name,
          pct: 100,
          batchId: presignData.batchId,
        });
        const batchRes = await fetch("/api/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchId: presignData.batchId,
            businessId: presignData.businessId,
            storageKey: presignData.storageKey,
            fileName: file.name,
            fileSize: file.size,
          }),
        });
        if (!batchRes.ok) {
          const err = await batchRes.json().catch(() => ({}));
          throw new Error(err.error ?? `Procesado falló (${batchRes.status})`);
        }

        setUpload({
          phase: "done",
          fileName: file.name,
          pct: 100,
          batchId: presignData.batchId,
        });

        const uploadMsg: Message = {
          id: `u-upload-${Date.now()}`,
          role: "user",
          content: `📦 He subido la carpeta "${file.name}". Analízala y dime qué detectas.`,
        };
        const pendingMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "",
          toolCalls: [],
          pending: true,
        };
        setMessages((m) => [...m, uploadMsg, pendingMsg]);

        await streamChat(
          `He subido un ZIP nuevo. batchId: "${presignData.batchId}". Por favor sigue el flow del producto:\n` +
            `1. analyze_batch con ese batchId.\n` +
            `2. Si la respuesta tiene recommendsRegrouping=true, llama AUTOMÁTICAMENTE a regroup_batch_with_ai sin preguntarme — solo avísame: "voy a reagrupar visualmente porque...".\n` +
            `3. Tras (re)agrupar, llama analyze_format_compatibility para 1-3 posts representativos.\n` +
            `4. Resume en lenguaje natural: cuántos posts, tipos, qué carruseles detectaste y por qué, problemas de formato por plataforma.\n` +
            `5. Si tengo brand profile sin configurar, pregunta lo esencial (nicho, tono, audiencia) antes de proponer calendario.\n` +
            `6. Propón calendario con suggest_schedule y enséñamelo. Espera mi confirmación expresa antes de llamar confirm_batch_schedule.`,
        );

        setTimeout(() => setUpload(null), 3000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de red";
        setUpload({ phase: "error", fileName: file.name, pct: 0, error: msg });
        toast(msg, "error");
        setTimeout(() => setUpload(null), 5000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [businessSlug, toast],
  );

  /**
   * Sube N archivos sueltos como UN único PostDraft (image | carousel | reel).
   * Hace presign per-file → PUT a R2 → /api/batches/direct con storageKeys.
   * El user no pone caption ni publishAt — los pondrá luego en el editor.
   * Por defecto: publishAt = mañana 10:00 local del business.
   */
  const uploadDirectMedia = useCallback(
    async (files: File[], postType: "image" | "carousel" | "reel") => {
      const labelFile =
        files.length === 1
          ? files[0].name
          : `${files.length} archivos (${postType})`;
      setUpload({ phase: "presigning", fileName: labelFile, pct: 0 });

      try {
        // Presign + upload de cada file
        const storageKeys: string[] = [];
        const filenames: string[] = [];
        const fileSizes: number[] = [];
        const mimeTypes: string[] = [];
        let batchId = "";

        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const presignRes = await fetch("/api/batches/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessSlug,
              fileName: f.name,
              fileSize: f.size,
              contentType: f.type,
            }),
          });
          if (!presignRes.ok) {
            const err = await presignRes.json().catch(() => ({}));
            throw new Error(err.error ?? `Presign falló (${presignRes.status})`);
          }
          const { data: presignData } = await presignRes.json();
          if (!batchId) batchId = presignData.batchId;

          setUpload({
            phase: "uploading",
            fileName: `${i + 1}/${files.length} ${f.name}`,
            pct: 0,
          });
          // Upload con XHR progress
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", presignData.uploadUrl);
            xhr.setRequestHeader("Content-Type", f.type || "application/octet-stream");
            xhr.upload.onprogress = (evt) => {
              if (evt.lengthComputable) {
                const filePct = Math.round((evt.loaded / evt.total) * 100);
                // Progreso global = (archivos completados + porcentaje del actual) / total
                const overall = Math.round(((i + filePct / 100) / files.length) * 100);
                setUpload((u) => (u ? { ...u, pct: overall } : u));
              }
            };
            xhr.onload = () =>
              xhr.status >= 200 && xhr.status < 300
                ? resolve()
                : reject(new Error(`Upload ${xhr.status}: ${f.name}`));
            xhr.onerror = () => reject(new Error("Network error during upload"));
            xhr.send(f);
          });

          storageKeys.push(presignData.storageKey);
          filenames.push(f.name);
          fileSizes.push(f.size);
          mimeTypes.push(f.type || "application/octet-stream");
        }

        // POST /api/batches/direct con todos los archivos como UN post
        setUpload({
          phase: "processing",
          fileName: labelFile,
          pct: 100,
          batchId,
        });

        // publishAt por defecto: mañana 10:00 local
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        const directRes = await fetch("/api/batches/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessSlug,
            batchId,
            posts: [
              {
                storageKeys,
                filenames,
                fileSizes,
                mimeTypes,
                caption: "", // sin caption — el user lo añade después o lo pide al chat
                postType,
                publishAt: tomorrow.toISOString(),
              },
            ],
          }),
        });
        if (!directRes.ok) {
          const err = await directRes.json().catch(() => ({}));
          throw new Error(err.error ?? `Procesado falló (${directRes.status})`);
        }

        setUpload({ phase: "done", fileName: labelFile, pct: 100, batchId });

        const labels: Record<typeof postType, string> = {
          image: "📷 una imagen",
          carousel: `📚 un carrusel de ${files.length} imágenes`,
          reel: "🎬 un video",
        };
        const uploadMsg: Message = {
          id: `u-upload-${Date.now()}`,
          role: "user",
          content: `He subido ${labels[postType]} (${files.map((f) => f.name).join(", ")}). ¿Qué hago con esto?`,
        };
        const pendingMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "",
          toolCalls: [],
          pending: true,
        };
        setMessages((m) => [...m, uploadMsg, pendingMsg]);

        await streamChat(
          `Acabo de subir ${labels[postType]} como un único post nuevo (tipo: ${postType.toUpperCase()}, batchId "${batchId}"). Está sin caption ni horario fijo — programado por defecto para mañana 10:00.\n\n` +
            `Por favor:\n` +
            `1. Llama a analyze_batch con ese batchId para encontrar el postId del nuevo draft.\n` +
            `2. Llama a analyze_format_compatibility con ese postId para evaluar en qué plataformas encajará bien.\n` +
            `3. Cuéntame en lenguaje natural qué he subido y propónme:\n` +
            `   - Sugerencia de caption (basada en mi marca si la tengo configurada)\n` +
            `   - Plataformas recomendadas\n` +
            `   - Mejor horario sugerido\n` +
            `4. Pregúntame si quiero que ajuste algo o programe ya.`,
        );

        setTimeout(() => setUpload(null), 3000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de red";
        setUpload({ phase: "error", fileName: labelFile, pct: 0, error: msg });
        toast(msg, "error");
        setTimeout(() => setUpload(null), 5000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [businessSlug, toast],
  );

  // Wrapper para mantener compatibilidad con el botón existente
  const uploadFolder = useCallback(
    (file: File) => uploadFiles([file]),
    [uploadFiles],
  );

  /**
   * Streamea una respuesta del chat con un mensaje arbitrario.
   * Usado tanto por sendMessage (input user) como por uploadFiles
   * (mensaje sintético post-upload).
   */
  const streamChat = useCallback(
    async (text: string) => {
      setSending(true);
      try {
        // Construir body OMITIENDO chatId si es null (Zod .optional() no
        // acepta null, solo undefined). Bug histórico que causaba
        // 400 "Validation" en cada primer mensaje.
        const requestBody: Record<string, string> = {
          businessId,
          message: text,
        };
        if (chatId) requestBody.chatId = chatId;

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          const friendlyMsg =
            res.status === 503
              ? "AI no disponible — el admin debe configurar TOGETHER_API_KEY."
              : res.status === 429
                ? "Demasiadas peticiones. Espera un momento e inténtalo de nuevo."
                : res.status === 401
                  ? "Sesión expirada. Recarga la página y vuelve a entrar."
                  : err.details
                    ? `Error de validación: ${JSON.stringify(err.details).slice(0, 200)}`
                    : err.error
                      ? `${err.error} (HTTP ${res.status})`
                      : `Error HTTP ${res.status}`;
          updateLastAssistant(setMessages, () => ({
            content: "",
            errorBanner: friendlyMsg,
            pending: false,
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";
        const accToolCalls: Message["toolCalls"] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const evt of events) {
            let eventName = "";
            let dataStr = "";
            for (const line of evt.split("\n")) {
              if (line.startsWith("event:")) eventName = line.slice(6).trim();
              else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
            }
            if (!eventName) continue;
            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(dataStr);
            } catch {}

            if (eventName === "chat" && typeof payload.chatId === "string") {
              setChatId(payload.chatId);
            } else if (eventName === "text" && typeof payload.delta === "string") {
              acc += payload.delta;
              updateLastAssistant(setMessages, () => ({
                content: acc,
                pending: true,
              }));
            } else if (eventName === "tool_call") {
              const toolName = String(payload.tool ?? "");
              // 🛡 Si el nombre no está en la whitelist, ignorar evento
              // (Llama 3.3 alucina nombres como "Validation" — no chips falsos)
              if (!VALID_TOOL_NAMES.has(toolName)) {
                console.warn("[chat] ignored unknown tool:", toolName);
                continue;
              }
              accToolCalls.push({
                name: toolName,
                input: payload.input,
              });
              updateLastAssistant(setMessages, () => ({
                toolCalls: [...accToolCalls],
              }));
            } else if (eventName === "tool_result") {
              if (!VALID_TOOL_NAMES.has(String(payload.tool ?? ""))) {
                continue;
              }
              const idx = accToolCalls.findIndex(
                (c) => c.name === payload.tool && !c.output && !c.error,
              );
              if (idx >= 0) {
                accToolCalls[idx] = {
                  ...accToolCalls[idx],
                  output: payload.output,
                  error: payload.error as string | undefined,
                };
                updateLastAssistant(setMessages, () => ({
                  toolCalls: [...accToolCalls],
                }));
              }
            } else if (eventName === "done") {
              updateLastAssistant(setMessages, () => ({ pending: false }));
            } else if (eventName === "error") {
              updateLastAssistant(setMessages, (m) => ({
                content:
                  (m.content || "") +
                  "\n\n❌ Error: " +
                  (typeof payload.error === "string" ? payload.error : "desconocido"),
                pending: false,
              }));
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de red";
        updateLastAssistant(setMessages, () => ({
          content: `❌ ${msg}`,
          pending: false,
        }));
      } finally {
        setSending(false);
      }
    },
    [chatId, businessId],
  );

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const pendingMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      toolCalls: [],
      pending: true,
    };
    setMessages((m) => [...m, userMsg, pendingMsg]);
    setInput("");

    await streamChat(text);
  }, [input, sending, streamChat]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Drag & drop handlers — usamos contador para evitar el flicker
  // de drag enter/leave que dispara React por cada hijo recursivamente.
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sending || upload) return;
    if (e.dataTransfer.types.includes("Files")) {
      dragCounterRef.current++;
      setIsDragging(true);
    }
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (sending || upload) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: 0,
        height: "calc(100vh - 280px)",
        minHeight: 500,
        position: "relative",
      }}
    >
      {/* Drop overlay — visible solo durante drag activo */}
      {isDragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background: "rgba(241,236,226,0.96)",
            border: "2px dashed var(--ap-stamp)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            pointerEvents: "none",
          }}
        >
          <Paperclip
            strokeWidth={1.5}
            style={{ width: 40, height: 40, color: "var(--ap-stamp)" }}
          />
          <p
            className="ap-display"
            style={{
              fontSize: 28,
              fontStyle: "italic",
              color: "var(--ap-ink)",
              margin: 0,
            }}
          >
            Suelta aquí.
          </p>
          <p
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-3)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            ZIP · Imágenes · Video · Carrusel
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-stamp)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          ✦ Asistente editorial
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--ap-ink-3)",
            margin: "4px 0 0",
            fontFamily: "var(--ap-font-mono)",
            letterSpacing: "0.1em",
          }}
        >
          {brandNiche ? `Nicho: ${brandNiche}` : "Sin nicho configurado"}
          {brandTone ? ` · ${brandTone}` : ""}
        </p>
      </div>

      {/* Mensajes */}
      <div
        ref={messagesRef}
        style={{
          overflowY: "auto",
          background: "var(--ap-paper-2)",
          border: "1px solid var(--ap-line-2)",
          padding: "16px 20px",
        }}
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Upload progress */}
      {upload && <UploadProgressBanner upload={upload} />}

      {/* Input */}
      <div style={{ marginTop: 12, position: "relative" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Pregúntale lo que sea o sube con 📎 — un ZIP, una imagen, varias para carrusel, un video..."
          rows={2}
          maxLength={4000}
          disabled={sending}
          style={{
            width: "100%",
            background: "var(--ap-paper)",
            border: "1px solid var(--ap-line-2)",
            padding: "12px 150px 12px 14px",
            fontSize: 14,
            fontFamily: "inherit",
            color: "var(--ap-ink)",
            lineHeight: 1.55,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            minHeight: 60,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ap-ink)")}
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--ap-line-2)")
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.jpg,.jpeg,.png,.webp,.mp4,.mov,.m4v,image/*,video/*,application/zip"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) uploadFiles(files);
            e.target.value = ""; // reset para poder re-seleccionar mismos archivos
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || !!upload}
          title="Subir carpeta ZIP, imágenes o video"
          aria-label="Subir archivos"
          style={{
            position: "absolute",
            bottom: 12,
            right: 86,
            background: "transparent",
            border: "1px solid var(--ap-line-2)",
            padding: "8px 10px",
            cursor: sending || !!upload ? "not-allowed" : "pointer",
            color: "var(--ap-ink-3)",
            opacity: sending || !!upload ? 0.4 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontFamily: "var(--ap-font-mono)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <Paperclip strokeWidth={1.8} style={{ width: 12, height: 12 }} />
          Subir
        </button>
        <button
          type="button"
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="ap-btn ap-btn--stamp"
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            padding: "8px 14px",
            fontSize: 12,
            opacity: !input.trim() || sending ? 0.4 : 1,
          }}
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>

      <p
        style={{
          fontSize: 10,
          color: "var(--ap-ink-4)",
          fontFamily: "var(--ap-font-mono)",
          letterSpacing: "0.1em",
          margin: "8px 0 0",
          textTransform: "uppercase",
        }}
      >
        Enter envía · Shift+Enter nueva línea · 📎 ZIP / imagen / carrusel / video · Arrastra o suelta · Negocio: {businessSlug}
      </p>
    </div>
  );
}

function UploadProgressBanner({ upload }: { upload: UploadProgress }) {
  const labels: Record<UploadProgress["phase"], string> = {
    presigning: "Pidiendo permiso...",
    uploading: `Subiendo a R2 — ${upload.pct}%`,
    processing: "Procesando ZIP en servidor...",
    done: "✓ Carpeta subida — la IA está analizándola",
    error: `✗ Error: ${upload.error ?? "desconocido"}`,
  };

  const isDone = upload.phase === "done";
  const isError = upload.phase === "error";

  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 14px",
        background: "var(--ap-paper-2)",
        border: `1px solid ${
          isDone ? "#6B7A2E" : isError ? "var(--ap-stamp)" : "var(--ap-line-2)"
        }`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {isDone ? (
        <Check strokeWidth={2} style={{ width: 14, height: 14, color: "#6B7A2E" }} />
      ) : isError ? (
        <span style={{ fontSize: 14, color: "var(--ap-stamp)" }}>!</span>
      ) : (
        <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: "var(--ap-ink-3)" }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="ap-mono"
          style={{
            margin: 0,
            fontSize: 11,
            color: "var(--ap-ink-2)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {upload.fileName}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ap-ink-3)" }}>
          {labels[upload.phase]}
        </p>
      </div>
      {upload.phase === "uploading" && (
        <div
          style={{
            width: 60,
            height: 4,
            background: "var(--ap-line-2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: `${upload.pct}%`,
              background: "var(--ap-stamp)",
              transition: "width 0.2s",
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Extrae la extensión en lowercase con punto incluido. e.g. "foto.JPG" → ".jpg"
 */
function extOf(filename: string): string {
  const m = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return m ? m[0] : "";
}

/**
 * Clasifica un File por su extensión + mime type.
 */
function fileKind(file: File): "image" | "video" | "zip" | "unknown" {
  const ext = extOf(file.name);
  const mime = (file.type || "").toLowerCase();
  if (ext === ".zip" || mime === "application/zip") return "zip";
  if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) return "image";
  if (mime.startsWith("image/")) return "image";
  if ([".mp4", ".mov", ".m4v"].includes(ext)) return "video";
  if (mime.startsWith("video/")) return "video";
  return "unknown";
}

/**
 * Sube un blob a una URL prefirmada con progress callback usando XHR
 * (fetch nativo no expone progress en uploads). Resuelve cuando 2xx.
 */
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/zip");
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

function updateLastAssistant(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  updater: (current: Message) => Partial<Message>,
) {
  setMessages((prev) => {
    const arr = [...prev];
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i].role === "assistant") {
        arr[i] = { ...arr[i], ...updater(arr[i]) };
        break;
      }
    }
    return arr;
  });
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  // Si es un banner de error, renderiza estilo distinto y SIN burbuja del bot
  if (message.errorBanner) {
    return (
      <div
        style={{
          marginBottom: 16,
          padding: "12px 16px",
          background: "rgba(229,75,38,0.06)",
          border: "1px solid var(--ap-stamp)",
          borderLeft: "3px solid var(--ap-stamp)",
          color: "var(--ap-stamp)",
          fontSize: 13,
          lineHeight: 1.5,
          fontFamily: "var(--ap-font-mono)",
          letterSpacing: "0.02em",
        }}
        role="alert"
      >
        <strong style={{ marginRight: 8 }}>⚠ Error:</strong>
        {message.errorBanner}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      <p
        className="ap-mono"
        style={{
          fontSize: 9,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          margin: "0 0 4px",
        }}
      >
        {isUser ? "Tú" : "✦ AutoPost"}
        {message.pending ? " · escribiendo..." : ""}
      </p>
      <div
        style={{
          maxWidth: "85%",
          background: isUser ? "var(--ap-ink)" : "var(--ap-paper)",
          color: isUser ? "var(--ap-paper)" : "var(--ap-ink)",
          padding: "12px 16px",
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          border: isUser ? "none" : "1px solid var(--ap-line)",
        }}
      >
        {message.content || (message.pending ? "..." : "")}
      </div>

      {/* Tool calls */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            maxWidth: "85%",
          }}
        >
          {message.toolCalls.map((tc, i) => (
            <ToolCallChip key={i} call={tc} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCallChip({
  call,
}: {
  call: { name: string; input: unknown; output?: unknown; error?: string };
}) {
  const labels: Record<string, string> = {
    analyze_batch: "📊 Analizando batch",
    suggest_schedule: "📅 Proponiendo calendario",
    confirm_batch_schedule: "✅ Programando publicación",
    confirm_schedule: "✓ Confirmando programación",
    recommend_posting_time: "⏰ Calculando mejor hora",
    update_brand_profile: "✦ Guardando perfil de marca",
    suggest_caption: "✏ Sugiriendo caption",
    suggest_hashtags: "# Sugiriendo hashtags",
    analyze_format_compatibility: "🎯 Verificando compatibilidad por plataforma",
    analyze_media_with_vision: "👁 Analizando media con vision",
    regroup_batch_with_ai: "🔍 Reagrupando con visión IA",
  };
  const label = labels[call.name] ?? call.name;
  const finished = call.output !== undefined || call.error !== undefined;

  return (
    <div
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line)",
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--ap-ink-2)",
        fontFamily: "var(--ap-font-mono)",
        letterSpacing: "0.04em",
      }}
    >
      <span style={{ color: call.error ? "var(--ap-stamp)" : "var(--ap-ink-2)" }}>
        {label} {finished ? "✓" : "..."}
      </span>
      {call.error && (
        <span style={{ color: "var(--ap-stamp)", marginLeft: 8 }}>
          {call.error}
        </span>
      )}
    </div>
  );
}
