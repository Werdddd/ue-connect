'use client';

import React from 'react';
import { X } from 'lucide-react';

export type EventDetails = {
  id: string;
  title: string;
  organizingRSO: string;
  category: string;
  dateTime: string;
  endDateTime?: string;
  location?: string;
  mode?: string;
  participantCount: number;
  maxCapacity: number;

  proposalStatus: string;
  eventStatus: string;

  // anything extra you pass in is fine
  orgId?: string;
  department?: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
  proposalLink?: string;
  proposalFile?: string;
  proposalName?: string;
  isCollab?: boolean;
  statusRaw?: string;
};

export const formatDateTime = (iso?: string) => {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '', time: '' };
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
};


export type ModalAction = 'Approved' | 'Rejected' | 'Cancelled';

// EventDetailsModal.tsx (top of file, near other helpers)
// 🔧 Helper to safely display Firestore Timestamps, Dates, or strings
function formatMaybeTimestamp(value: unknown): string {
  if (!value) return '—';

  // Handle Firestore Timestamp-like objects
  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in (value as any) &&
    'nanoseconds' in (value as any)
  ) {
    const v = value as { seconds: number; nanoseconds: number };
    const ms = v.seconds * 1000 + Math.floor(v.nanoseconds / 1e6);
    const d = new Date(ms);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // If already a JS Date
  if (value instanceof Date) {
    return value.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Fallback for string or number
  return String(value);
}

type Props = {
  open: boolean;
  event: EventDetails | null;
  onClose: () => void;
  onAction?: (action: ModalAction, ev: EventDetails) => Promise<void> | void;
  busy?: boolean;
};

const EventDetailsModal: React.FC<Props> = ({ open, event, onClose, onAction, busy }) => {
  if (!open || !event) return null;

  const start = formatDateTime(event.dateTime);
  const end = formatDateTime(event.endDateTime);

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{children}</div>
  );
  const Value = ({ children }: { children?: React.ReactNode }) => (
    <div className="text-sm text-gray-900 mt-1">{children ?? <span className="text-gray-400">—</span>}</div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onClose} />
      <div className="relative bg-white w-full max-w-3xl rounded-lg shadow-xl">
        {/* header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Event Details</h2>
          <button
            onClick={onClose}
            disabled={busy}
            className="p-2 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-60"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            <div><Label>Title</Label><Value>{event.title}</Value></div>
            <div><Label>Organization</Label><Value>{event.organizingRSO}</Value></div>

            <div><Label>Date</Label><Value>{start.date}</Value></div>
            <div><Label>Time</Label><Value>{start.time}{event.endDateTime ? ` - ${end.time}` : ''}</Value></div>

            <div><Label>Location</Label><Value>{event.location}</Value></div>
            <div><Label>Mode</Label><Value>{event.mode}</Value></div>

            <div><Label>Participants</Label><Value>{event.participantCount} / {event.maxCapacity}</Value></div>
            <div><Label>Status (Proposal)</Label><Value>{event.proposalStatus}</Value></div>

            <div><Label>Status (Event)</Label><Value>{event.eventStatus}</Value></div>
            <div><Label>Category</Label><Value>{event.category}</Value></div>

            <div><Label>Created at</Label><Value>{formatMaybeTimestamp(event.createdAt)}</Value></div>

            <div><Label>Proposal File</Label><Value>{event.proposalFile}</Value></div>

            <div><Label>Is Collaboration</Label><Value>{event.isCollab ? 'Yes' : 'No'}</Value></div>
          </div>
        </div>

        {/* footer with actions */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-between gap-2">
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => onAction?.('Approved', event)}
              className="px-3 py-1.5 rounded border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-60"
            >
              {busy ? 'Approving…' : 'Approve'}
            </button>
            <button
              disabled={busy}
              onClick={() => onAction?.('Rejected', event)}
              className="px-3 py-1.5 rounded border border-amber-600 text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              {busy ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              disabled={busy}
              onClick={() => onAction?.('Cancelled', event)}
              className="px-3 py-1.5 rounded border border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {busy ? 'Cancelling…' : 'Cancel'}
            </button>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
