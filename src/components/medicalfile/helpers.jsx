import React from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

export const STATUS = [
    "Draft", "HR review", "Submitted to CNSS", "In progress", "Approved", "Rejected", "Closed"
];

const statusColor = {
    "Draft": "bg-slate-100 text-slate-700",
    "HR review": "bg-amber-100 text-amber-700",
    "Submitted to CNSS": "bg-blue-100 text-blue-700",
    "In progress": "bg-indigo-100 text-indigo-700",
    "Approved": "bg-emerald-100 text-emerald-700",
    "Rejected": "bg-rose-100 text-rose-700",
    "Closed": "bg-slate-200 text-slate-700",
};

export const StatusBadge = ({ value }) => (
    <span className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[value]}`}>
        {value}
    </span>
);

export function dayCount(start, end) {
    if (!start || !end) return 0;
    try {
        return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
    } catch {
        return 0;
    }
}

export function parseLinks(value) {
    return (value || "")
        .split(/\r?\n|,|;/)
        .map((s) => s.trim())
        .filter(Boolean);
}
