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

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: Array<{ name: string; input: unknown; output?: unknown; error?: string }>;
  pending?: boolean;
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
  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll cuando llegan mensajes
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  /**
   * Sube un ZIP directo desde el chat. Tras procesar el batch,
   * envía un mensaje pre-fabricado al LLM para que lo analice
   * y haga clarifying questions sobre lo que detecte.
   */
  const uploadFolder = useCallback(
    async (file: File) => {
      if (sending || upload) return;

      const isZip = file.name.toLowerCase().endsWith(".zip");
      if (!isZip) {
        toast("Solo carpetas comprimidas .zip por ahora", "error");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast("El ZIP supera los 100 MB", "error");
        return;
      }

      setUpload({ phase: "presigning", fileName: file.name, pct: 0 });

      try {
        // 1. Presign
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

        // 2. PUT a R2 con progress
        setUpload({ phase: "uploading", fileName: file.name, pct: 0 });
        await uploadWithProgress(presignData.uploadUrl, file, (pct) =>
          setUpload((u) => (u ? { ...u, pct } : u)),
        );

        // 3. POST /api/batches con storageKey
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

        // 4. Insertar mensaje "subido" en chat
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

        // 5. Auto-llamar al chat con el batchId — el LLM debería invocar
        // analyze_batch + analyze_format_compatibility + hacer clarifying questions
        await streamChat(
          `Acabo de subir un batch nuevo con ID "${presignData.batchId}". Por favor:\n` +
            `1. Llama a analyze_batch con ese batchId.\n` +
            `2. Para los posts más relevantes (max 3), llama a analyze_format_compatibility con su postId para ver en qué plataformas encajarán bien y en cuáles NO.\n` +
            `3. Resume en lenguaje natural qué encontraste: número de posts, tipos detectados, problemas de formato (imágenes horizontales en TikTok, videos largos para Shorts, ratios subóptimos, etc.). Sé honesto — si algo no encaja con una plataforma, desaconséjala explícitamente.\n` +
            `4. Hazme las preguntas que necesites para clarificar ambigüedades antes de proponer calendario.\n` +
            `Después espera mi confirmación para llamar suggest_schedule.`,
        );

        // Reset upload state después de 3s para no taparlo
        setTimeout(() => setUpload(null), 3000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de red";
        setUpload({
          phase: "error",
          fileName: file.name,
          pct: 0,
          error: msg,
        });
        toast(msg, "error");
        setTimeout(() => setUpload(null), 5000);
      }
    },
    [sending, upload, businessSlug, toast],
  );

  /**
   * Streamea una respuesta del chat con un mensaje arbitrario.
   * Usado tanto por sendMessage (input user) como por uploadFolder
   * (mensaje sintético post-upload).
   */
  const streamChat = useCallback(
    async (text: string) => {
      setSending(true);
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, businessId, message: text }),
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          updateLastAssistant(setMessages, () => ({
            content:
              res.status === 503
                ? "AI no disponible. El admin debe configurar TOGETHER_API_KEY."
                : err.error ?? `Error HTTP ${res.status}`,
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
              accToolCalls.push({
                name: String(payload.tool ?? ""),
                input: payload.input,
              });
              updateLastAssistant(setMessages, () => ({
                toolCalls: [...accToolCalls],
              }));
            } else if (eventName === "tool_result") {
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

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: 0,
        height: "calc(100vh - 280px)",
        minHeight: 500,
      }}
    >
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
          placeholder="Pregúntale lo que sea — sube tu carpeta con 📎 o pídele un calendario, captions, horarios..."
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
          accept=".zip"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFolder(file);
            e.target.value = ""; // reset para poder re-seleccionar mismo archivo
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || !!upload}
          title="Subir carpeta .zip"
          aria-label="Subir carpeta"
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
          ZIP
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
        Enter envía · Shift+Enter nueva línea · ZIP: arrastra o click 📎 · Negocio: {businessSlug}
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
    confirm_schedule: "✓ Confirmando programación",
    recommend_posting_time: "⏰ Calculando mejor hora",
    update_brand_profile: "✦ Guardando perfil de marca",
    suggest_caption: "✏ Sugiriendo caption",
    suggest_hashtags: "# Sugiriendo hashtags",
    analyze_format_compatibility: "🎯 Verificando compatibilidad por plataforma",
    analyze_media_with_vision: "👁 Analizando media con vision",
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
