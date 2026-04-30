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

interface Props {
  businessId: string;
  businessName: string;
  businessSlug: string;
  brandTone: string | null;
  brandNiche: string | null;
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
  const messagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cuando llegan mensajes
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

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
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          businessId,
          message: text,
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 503) {
          updateLastAssistant(setMessages, () => ({
            content: "AI no disponible. El admin debe configurar TOGETHER_API_KEY.",
            pending: false,
          }));
        } else {
          updateLastAssistant(setMessages, () => ({
            content: err.error ?? `Error HTTP ${res.status}`,
            pending: false,
          }));
        }
        setSending(false);
        return;
      }

      // Parse SSE
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
      toast(msg, "error");
    } finally {
      setSending(false);
    }
  }, [input, sending, chatId, businessId, toast]);

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

      {/* Input */}
      <div style={{ marginTop: 12, position: "relative" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Pregúntale lo que sea — análisis de batch, sugerencias de horario, captions..."
          rows={2}
          maxLength={4000}
          disabled={sending}
          style={{
            width: "100%",
            background: "var(--ap-paper)",
            border: "1px solid var(--ap-line-2)",
            padding: "12px 80px 12px 14px",
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
        Enter envía · Shift+Enter nueva línea · Negocio: {businessSlug}
      </p>
    </div>
  );
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
