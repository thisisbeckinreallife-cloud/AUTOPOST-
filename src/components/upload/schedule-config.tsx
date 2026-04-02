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
  // Round up to next hour + 1 for safety margin
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

/** Calculate publish dates based on settings, skipping past times */
export function calculatePublishDates(
  postCount: number,
  settings: ScheduleSettings
): Date[] {
  const dates: Date[] = [];
  const [hours, minutes] = settings.time.split(":").map(Number);
  const now = new Date();
  let current = new Date(`${settings.startDate}T00:00:00`);

  // Safety: limit iterations to prevent infinite loops
  let iterations = 0;
  const maxIterations = postCount * 30;

  while (dates.length < postCount && iterations < maxIterations) {
    iterations++;
    const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon...
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    let shouldPublish = settings.days[dayIndex];

    if (settings.spacing === "weekdays" && (dayIndex === 5 || dayIndex === 6)) {
      shouldPublish = false;
    }

    if (shouldPublish) {
      const publishDate = new Date(current);
      publishDate.setHours(hours, minutes, 0, 0);

      // Skip if the date+time is in the past
      if (publishDate.getTime() > now.getTime()) {
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

  // Check if start date is today and selected time is in the past
  const isToday = settings.startDate === getTodayDate();
  const now = new Date();
  const [selH, selM] = settings.time.split(":").map(Number);
  const timeInPast = isToday && (selH < now.getHours() || (selH === now.getHours() && selM <= now.getMinutes()));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
        <p className="font-semibold text-slate-800">Configura como quieres publicar</p>
        <p className="text-sm text-slate-500 mt-1">
          {postCount} posts seran programados automaticamente segun tu configuracion.
        </p>
      </div>

      {/* Start date */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-slate-500" />
          <label className="text-sm font-medium text-slate-700">Empezar a publicar desde</label>
        </div>
        <input
          type="date"
          value={settings.startDate}
          min={getTodayDate()}
          onChange={(e) => update({ startDate: e.target.value })}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none"
        />
        {isToday && (
          <p className="text-xs text-blue-600 mt-2">
            Publicando hoy — solo se programaran posts con hora futura.
          </p>
        )}
      </div>

      {/* Time */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-slate-500" />
          <label className="text-sm font-medium text-slate-700">
            Hora de publicacion
          </label>
        </div>
        <input
          type="time"
          value={settings.time}
          onChange={(e) => update({ time: e.target.value })}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none"
        />
        {timeInPast ? (
          <p className="text-xs text-amber-600 mt-2">
            Esta hora ya paso hoy. El primer post se programara para manana a esta hora.
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-2">
            Todos tus posts se publicaran a esta hora.
          </p>
        )}
      </div>

      {/* Spacing */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <label className="text-sm font-medium text-slate-700 mb-3 block">
          Frecuencia de publicacion
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SPACING_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => update({ spacing: option.value })}
              className={`text-left border rounded-xl p-3 transition-all ${
                settings.spacing === option.value
                  ? "border-pink-400 bg-pink-50 ring-1 ring-pink-300"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-medium text-slate-800">{option.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Days of the week (when spacing is daily) */}
      {settings.spacing === "daily" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Dias de publicacion
          </label>
          <div className="flex gap-2">
            {DAY_LABELS.map((day, i) => (
              <button
                key={i}
                onClick={() => {
                  const newDays = [...settings.days];
                  newDays[i] = !newDays[i];
                  // Ensure at least one day is selected
                  if (newDays.some(Boolean)) {
                    update({ days: newDays });
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  settings.days[i]
                    ? "bg-pink-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
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
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-slate-500" />
          <label className="text-sm font-medium text-slate-700">Zona horaria</label>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
          <span>{settings.timezone}</span>
          <span className="text-xs text-slate-400">(detectada automaticamente)</span>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-sm text-slate-600">
          Tu ultimo post se publicaria el{" "}
          <span className="font-semibold text-slate-800">{lastDateStr}</span>
        </p>
      </div>
    </div>
  );
}
