'use client';

import * as React from 'react';
import { X } from 'lucide-react';

/** Actions the footer buttons can trigger */
export type ModalAction = 'Approved' | 'Rejected' | 'Cancelled';

/** Event shape used by the modal. */
export interface EventDetails {
  id: string;
  title?: string;
  organizingRSO?: string;
  category?: string;

  dateTime?: string;
  endDateTime?: string;
  location?: string;
  mode?: string;

  proposalStatus?: string;
  eventStatus?: string;

  participantCount?: number;
  maxCapacity?: number;

  description?: string;
  createdAt?: string | Date | { seconds: number; nanoseconds?: number };
  createdBy?: string;
  createdByName?: string;

  // files
  proposalBase64?: string;
  proposalFile?: string;
  proposalLink?: string;
  proposalName?: string;

  // NEW: show banner
  banner?: string;
}

/** Format helper used by the table too */
export function formatDateTime(dateTime?: string) {
  if (!dateTime) return { date: '—', time: '—' };
  const d = new Date(dateTime);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '—' };
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

/** Turn Firestore Timestamp / string / Date into a readable string */
function humanDate(val?: EventDetails['createdAt']) {
  if (!val) return '—';
  try {
    if (typeof val === 'string') {
      const d = new Date(val);
      return Number.isNaN(d.getTime()) ? val : d.toLocaleString('en-US', { hour12: false });
    }
    if (val instanceof Date) return val.toLocaleString('en-US', { hour12: false });
    if (typeof val === 'object' && typeof val.seconds === 'number') {
      const d = new Date(val.seconds * 1000);
      return d.toLocaleString('en-US', { hour12: false });
    }
  } catch {}
  return '—';
}

/** Basic mime guess based on a filename */
function guessMimeFromName(name?: string) {
  const n = (name || '').toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.doc')) return 'application/msword';
  return 'application/octet-stream';
}

/** Convert raw base64 (no data: prefix) into a Blob URL */
function base64ToBlobUrl(rawBase64: string, mime = 'application/octet-stream') {
  const byteString = atob(rawBase64);
  const len = byteString.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = byteString.charCodeAt(i);
  const blob = new Blob([u8], { type: mime });
  return URL.createObjectURL(blob);
}

type Props = {
  open: boolean;
  event: EventDetails | null;
  onClose: () => void;

  // NEW: ask parent to open the remarks modal for these actions
  onOpenRemarks?: (action: 'Approved' | 'Rejected', ev: EventDetails) => void;

  // still allow direct action for Cancel
  onAction?: (action: ModalAction, ev: EventDetails) => void | Promise<void>;
  busy?: boolean;
};



const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">{children}</div>
);

const Value: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-gray-900">{children ?? '—'}</div>
);

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Value>{children}</Value>
  </div>
);

export default function EventDetailsModal({ open, event, onClose, onOpenRemarks, onAction, busy }: Props) {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  const proposalDownload = React.useMemo(() => {
    if (!event) return null;
    const raw = event.proposalBase64 || event.proposalFile || event.proposalLink || '';
    if (!raw) return null;

    const filename = event.proposalName || 'proposal';

    if (raw.startsWith('http://') || raw.startsWith('https://')) return { href: raw, filename };
    if (raw.startsWith('data:')) return { href: raw, filename };

    const mime = guessMimeFromName(filename);
    const url = base64ToBlobUrl(raw, mime);
    setObjectUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    return { href: url, filename };
  }, [event?.proposalBase64, event?.proposalFile, event?.proposalLink, event?.proposalName]);

  React.useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);

  if (!open) return null;

  const start = formatDateTime(event?.dateTime);
  const end   = event?.endDateTime ? formatDateTime(event.endDateTime) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Event Details</h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Banner on top, full width, contained */}
            {event?.banner && (
              <div className="md:col-span-2 space-y-1">
                <Label>Banner</Label>
                <div className="rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
                  <img
                    src={event.banner}
                    alt={`${event?.title ?? 'Event'} banner`}
                    className="block max-w-full max-h-64 object-contain"
                  />
                </div>
              </div>
            )}

            <Cell label="Title">{event?.title || '—'}</Cell>
            <Cell label="Organization">{event?.organizingRSO || '—'}</Cell>

            <Cell label="Description">{event?.description || '—'}</Cell>
            <Cell label="Location">{event?.location || '—'}</Cell>

            <Cell label="Date">{start.date}</Cell>
            <Cell label="Time">{start.time}{end ? ` - ${end.time}` : ''}</Cell>

            <Cell label="Participants">
              {`${event?.participantCount ?? 0} / ${event?.maxCapacity ?? 0}`}
            </Cell>

            <Cell label="Mode">{event?.mode || '—'}</Cell>
            <Cell label="Status (Proposal)">{event?.proposalStatus || '—'}</Cell>
            <Cell label="Status (Event)">{event?.eventStatus || '—'}</Cell>

            <Cell label="Created at">{humanDate(event?.createdAt)}</Cell>

            <Cell label="Proposal File">
              {proposalDownload ? (
                <a
                  href={proposalDownload.href}
                  download={proposalDownload.filename}
                  target={proposalDownload.href.startsWith('http') ? '_blank' : undefined}
                  rel={proposalDownload.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-blue-600 hover:underline"
                >
                  {proposalDownload.filename} <span className="opacity-70">(Download)</span>
                </a>
              ) : (
                <span className="text-gray-500 italic">No file uploaded</span>
              )}
            </Cell>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
          <div className="flex gap-2">
            {event && (
              <>
                {/* Open the separate remarks modal */}
                <button
                  onClick={() => onOpenRemarks?.('Approved', event)}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => onOpenRemarks?.('Rejected', event)}
                  className="rounded-md border border-amber-400 bg-amber-50 px-4 py-2 text-amber-700 hover:bg-amber-100"
                >
                  Reject
                </button>
                {/* Cancel stays as a direct action */}
                <button
                  disabled={busy}
                  onClick={() => onAction?.('Cancelled', event)}
                  className="rounded-md border border-rose-400 bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  {busy ? 'Saving…' : 'Cancel'}
                </button>
              </>
            )}
          </div>

          <button onClick={onClose} className="rounded-md border px-4 py-2 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
