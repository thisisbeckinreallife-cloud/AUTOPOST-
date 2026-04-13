"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, Globe } from "lucide-react";

export interface ScheduleSettings {
  time: string;
  days: boolean[];
  spacing: "daily" | "every2" | "every3" | "weekdays";
  timezone: string;
  startDate: string;
}

interface ScheduleConfigProps {
  postCount: number;
  initialSettings: ScheduleSettings;
  onChange: (settings: ScheduleSettings) => void;
}

const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
const DAY_LABELS_FULL = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

const SPACING_OPTIONS = [
  { value: "daily", label: "Todos los dias", desc: "Un post cada dia" },
  { value: "every2", label: "Cada 2 dias", desc: "Dejando un dia entre posts" },
  { value: "every3", label: "Cada 3 dias", desc: "Dejando dos dias entre posts" },
  { value: "weekdays", label: "Solo entre semana", desc: "Lunes a viernes" },
] as const;

function getDefaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/Mexico_City";
  }
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getCurrentHourCeil(): string {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  return `${String(now.getHours()).padStart(2, "0")}:00`;
}

export function getDefaultScheduleSettings(): ScheduleSettings {
  return {
    time: getCurrentHourCeil(),
    days: [true, true, true, true, true, true, true],
    spacing: "daily",
    timezone: getDefaultTimezone(),
    startDate: getTodayDate(),
  };
}

export function calculatePublishDates(
  postCount: number,
  settings: ScheduleSettings
): Date[] {
  const dates: Date[] = [];
  const [hours, minutes] = settings.time.split(":").map(Number);
  const now = new Date();
  let current = new Date(`${settings.startDate}T00:00:00`);

  let iterations = 0;
  const maxIterations = postCount * 30;

  while (dates.length < postCount && iterations < maxIterations) {
    iterations++;
    const dayOfWeek = current.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    let shouldPublish = settings.days[dayIndex];

    if (settings.spacing === "weekdays" && (dayIndex === 5 || dayIndex === 6)) {
      shouldPublish = false;
    }

    if (shouldPublish) {
      const publishDate = new Date(current);
      publishDate.setHours(hours, minutes, 0, 0);

      const minTime = now.getTime() + 10 * 60 * 1000;
      if (publishDate.getTime() > minTime) {
        dates.push(publishDate);
      }

      if (settings.spacing === "every2") {
        current.setDate(current.getDate() + 2);
        continue;
      } else if (settings.spacing === "every3") {
        current.setDate(current.getDate() + 3);
        continue;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function ScheduleConfig({ postCount, initialSettings, onChange }: ScheduleConfigProps) {
  const [settings, setSettings] = useState<ScheduleSettings>(initialSettings);

  useEffect(() => {
    onChange(settings);
  }, [settings]);

  function update(partial: Partial<ScheduleSettings>) {
    setSettings((prev) => ({ ...prev, ...partial }));
  }

  const lastDate = calculatePublishDates(postCount, settings).pop();
  const lastDateStr = lastDate
    ? lastDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const isToday = settings.startDate === getTodayDate();
  const now = new Date();
  const [selH, selM] = settings.time.split(":").map(Number);
  const timeInPast = isToday && (selH < now.getHours() || (selH === now.getHours() && selM <= now.getMinutes()));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/[0.06] bg-surface-card p-5">
        <p className="font-semibold text-white">Configura como quieres publicar</p>
        <p className="text-sm text-zinc-500 mt-1">
          {postCount} posts seran programados automaticamente segun tu configuracion.
        </p>
      </div>

      {/* Start date */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <label className="text-sm font-medium text-zinc-300">Empezar a publicar desde</label>
        </div>
        <input
          type="date"
          value={settings.startDate}
          min={getTodayDate()}
          onChange={(e) => update({ startDate: e.target.value })}
          className="w-full"
        />
        {isToday && (
          <p className="text-xs text-blue-400 mt-2">
            Publicando hoy — solo se programaran posts con hora futura.
          </p>
        )}
      </div>

      {/* Time */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-zinc-500" />
          <label className="text-sm font-medium text-zinc-300">Hora de publicacion</label>
        </div>
        <input
          type="time"
          value={settings.time}
          onChange={(e) => update({ time: e.target.value })}
          className="w-full"
        />
        {timeInPast ? (
          <p className="text-xs text-amber-400 mt-2">
            Esta hora ya paso hoy. El primer post se programara para manana.
          </p>
        ) : (
          <p className="text-xs text-zinc-600 mt-2">
            Todos tus posts se publicaran a esta hora.
          </p>
        )}
      </div>

      {/* Spacing */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4">
        <label className="text-sm font-medium text-zinc-300 mb-3 block">Frecuencia</label>
        <div className="grid grid-cols-2 gap-2">
          {SPACING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => update({ spacing: option.value })}
              className={`text-left border rounded-lg p-3 transition-all ${
                settings.spacing === option.value
                  ? "border-brand-500/40 bg-brand-500/[0.06] ring-1 ring-brand-500/30"
                  : "border-white/[0.06] hover:border-white/[0.1]"
              }`}
            >
              <p className="text-sm font-medium text-zinc-200">{option.label}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Days */}
      {settings.spacing === "daily" && (
        <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4">
          <label className="text-sm font-medium text-zinc-300 mb-3 block">Dias de publicacion</label>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((day, i) => (
              <button
                key={i}
                onClick={() => {
                  const newDays = [...settings.days];
                  newDays[i] = !newDays[i];
                  if (newDays.some(Boolean)) {
                    update({ days: newDays });
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  settings.days[i]
                    ? "bg-brand-500/20 text-brand-300"
                    : "bg-zinc-800/60 text-zinc-600 hover:text-zinc-400"
                }`}
                title={DAY_LABELS_FULL[i]}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timezone */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-zinc-500" />
          <label className="text-sm font-medium text-zinc-300">Zona horaria</label>
        </div>
        <div className="flex items-center gap-2 bg-surface-secondary rounded-lg px-3 py-2 text-sm text-zinc-400">
          <span>{settings.timezone}</span>
          <span className="text-xs text-zinc-600">(detectada automaticamente)</span>
        </div>
      </div>

      {/* Summary */}
      {lastDateStr && (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <p className="text-sm text-zinc-400">
            Tu ultimo post se publicaria el{" "}
            <span className="font-semibold text-zinc-200">{lastDateStr}</span>
          </p>
        </div>
      )}
    </div>
  );
}
