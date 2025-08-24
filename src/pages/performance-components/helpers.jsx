import React from 'react';

export const classNames = (...xs) => xs.filter(Boolean).join(" ");
export const daysBetween = (a, b) => Math.round((+new Date(b) - +new Date(a)) / 86400000);
export const pct = (n) => `${Math.round(n)}%`;

export function sixMonthsFrom(d = new Date()) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 6);
  return x;
}

export const weightedProgress = (objectives) => {
  if (!objectives || objectives.length === 0) return 0;
  const totalW = objectives.reduce((s, o) => s + o.weightPct, 0) || 1;
  const score = objectives.reduce((s, o) => s + (o.progress || 0) * (o.weightPct / 100), 0);
  return Math.max(0, Math.min(100, (score / (totalW / 100))));
};

export const statusBadge = (status) => {
  const map = {
    not_started: { text: "Not started", cls: "bg-gray-100 text-gray-700" },
    on_track: { text: "On track", cls: "bg-emerald-100 text-emerald-700" },
    at_risk: { text: "At risk", cls: "bg-amber-100 text-amber-700" },
    blocked: { text: "Blocked", cls: "bg-red-100 text-red-700" },
    done: { text: "Done", cls: "bg-blue-100 text-blue-700" },
  };
  const m = map[status] || map.not_started;
  return <span className={`px-2 py-1 rounded text-xs font-medium ${m.cls}`}>{m.text}</span>;
};