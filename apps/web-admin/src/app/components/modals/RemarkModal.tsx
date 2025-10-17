'use client';

import * as React from 'react';

type RemarkModalProps = {
  open: boolean;
  action: 'Approved' | 'Rejected';
  busy?: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
};

export default function RemarkModal({
  open,
  action,
  busy,
  onClose,
  onSubmit,
}: RemarkModalProps) {
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    if (open) setText('');
  }, [open]);

  if (!open) return null;

  const title = action === 'Approved' ? 'Approval Remarks' : 'Rejection Remarks';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">
            Add remarks for the organization (optional).
          </p>
        </div>

        <div className="px-6 py-4">
          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your remarks here…"
            className="w-full rounded-md border p-2 focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-md border px-4 py-2 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(text)}
            disabled={busy}
            className={`rounded-md px-4 py-2 text-white disabled:opacity-60 ${
              action === 'Approved'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {busy ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
