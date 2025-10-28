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
  <div className="text-xs font-medium text-gray-500 mb-1">{children}</div>
);

const Value: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm text-gray-900">{children ?? '—'}</div>
);

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-red-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Event Details</h2>
            <button 
              onClick={onClose} 
              className="text-white hover:text-red-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-6">
            {/* Banner */}
            {event?.banner && (
              <div>
                <Label>Event Banner</Label>
                <div className="rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center p-4">
                  <img
                    src={event.banner}
                    alt={`${event?.title ?? 'Event'} banner`}
                    className="block max-w-full max-h-64 object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Cell label="Event Title">{event?.title || '—'}</Cell>
              <Cell label="Organizing RSO">{event?.organizingRSO || '—'}</Cell>

              <div className="md:col-span-2">
                <Cell label="Description">{event?.description || '—'}</Cell>
              </div>

              <Cell label="Location">{event?.location || '—'}</Cell>
              <Cell label="Mode">{event?.mode || '—'}</Cell>

              <Cell label="Date">{start.date}</Cell>
              <Cell label="Time">{start.time}{end ? ` - ${end.time}` : ''}</Cell>

              <Cell label="Participants">
                {`${event?.participantCount ?? 0} / ${event?.maxCapacity ?? 0}`}
              </Cell>
              <Cell label="Created At">{humanDate(event?.createdAt)}</Cell>

              <Cell label="Proposal Status">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event?.proposalStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                  event?.proposalStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                  event?.proposalStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event?.proposalStatus || '—'}
                </span>
              </Cell>

              <Cell label="Event Status">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event?.eventStatus === 'Completed' ? 'bg-blue-100 text-blue-800' :
                  event?.eventStatus === 'Ongoing' ? 'bg-purple-100 text-purple-800' :
                  event?.eventStatus === 'Upcoming' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event?.eventStatus || '—'}
                </span>
              </Cell>

              <div className="md:col-span-2">
                <Cell label="Proposal File">
                  {proposalDownload ? (
                    <a
                      href={proposalDownload.href}
                      download={proposalDownload.filename}
                      target={proposalDownload.href.startsWith('http') ? '_blank' : undefined}
                      rel={proposalDownload.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-red-600 hover:text-red-700 hover:underline font-medium"
                    >
                      📄 {proposalDownload.filename}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">No file uploaded</span>
                  )}
                </Cell>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {event && (
                <>
                  <button
                    onClick={() => onOpenRemarks?.('Approved', event)}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onOpenRemarks?.('Rejected', event)}
                    className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
                  >
                    Reject
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => onAction?.('Cancelled', event)}
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? 'Saving…' : 'Cancel'}
                  </button>
                </>
              )}
            </div>

            <button 
              onClick={onClose} 
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}