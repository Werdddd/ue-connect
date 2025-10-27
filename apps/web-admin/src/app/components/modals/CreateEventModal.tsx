'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { firestore, auth } from '@/Firebase';
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState<number | ''>('');
  const [bannerBase64, setBannerBase64] = useState('');
  const [proposalFileBase64, setProposalFileBase64] = useState('');
  const [proposalName, setProposalName] = useState('');
  const [isCollab, setIsCollab] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [conflictMessage, setConflictMessage] = useState('');

  // Load organizations with role admin
  useEffect(() => {
    const getOrganizations = async () => {
      const q = query(collection(firestore, 'Users'), where('role', '==', 'admin'));
      const snapshot = await getDocs(q);
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setOrgs(list);
    };
    getOrganizations();
  }, []);

  // Convert uploaded file to base64
  const handleFileToBase64 = (file: File, setter: (val: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Check for schedule conflicts + suggest slots
  useEffect(() => {
    const checkSchedule = async () => {
      if (!date || !startTime || !endTime || !location) return;

      setConflictMessage('');
      setSuggestions([]);

      const eventsRef = collection(firestore, 'events');
      const q = query(eventsRef, where('location', '==', location), where('date', '==', new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const selectedStart = new Date(`${date}T${startTime}`);
      const selectedEnd = new Date(`${date}T${endTime}`);
      const conflicts: any[] = [];

      snapshot.forEach((doc) => {
        const ev = doc.data();
        if (!ev.time) return;
        const [evStartStr, evEndStr] = ev.time.split(' - ');
        const evStart = new Date(`${date}T${evStartStr}`);
        const evEnd = new Date(`${date}T${evEndStr}`);
        if (
          (selectedStart >= evStart && selectedStart < evEnd) ||
          (selectedEnd > evStart && selectedEnd <= evEnd) ||
          (selectedStart <= evStart && selectedEnd >= evEnd)
        ) {
          conflicts.push(ev);
        }
      });

      if (conflicts.length > 0) {
        setConflictMessage('⚠️ This time conflicts with another event.');
        // Suggest 4 later slots
        const duration = (selectedEnd.getTime() - selectedStart.getTime()) / 60000;
        const suggestionsList: string[] = [];
        let nextStart = new Date(selectedEnd);
        while (suggestionsList.length < 4) {
          const nextEnd = new Date(nextStart.getTime() + duration * 60000);
          const overlap = snapshot.docs.some((doc) => {
            const ev = doc.data();
            const [evStartStr, evEndStr] = ev.time.split(' - ');
            const evStart = new Date(`${date}T${evStartStr}`);
            const evEnd = new Date(`${date}T${evEndStr}`);
            return (
              (nextStart >= evStart && nextStart < evEnd) ||
              (nextEnd > evStart && nextEnd <= evEnd) ||
              (nextStart <= evStart && nextEnd >= evEnd)
            );
          });
          if (!overlap) {
            const fmt = (d: Date) =>
              d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            suggestionsList.push(`${fmt(nextStart)} - ${fmt(nextEnd)}`);
          }
          nextStart = new Date(nextStart.getTime() + duration * 60000);
          if (nextStart.getHours() >= 22) break; // Stop if too late
        }
        setSuggestions(suggestionsList);
      }
    };
    checkSchedule();
  }, [date, startTime, endTime, location]);

  const handleCreateEvent = async () => {
    if (
      !selectedOrg ||
      !title ||
      !description ||
      !date ||
      !startTime ||
      !endTime ||
      !location ||
      !participants ||
      !bannerBase64 ||
      !proposalFileBase64
    ) {
      alert('Please fill out all required fields.');
      return;
    }

    if (conflictMessage) {
      alert('Please choose a non-conflicting time slot.');
      return;
    }

    const selectedOrganization = orgs.find((o) => o.id === selectedOrg);
    if (!selectedOrganization) return;

    setLoading(true);
    const formattedTime = `${startTime} - ${endTime}`;
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    try {
      await addDoc(collection(firestore, 'events'), {
        title,
        description,
        date: formattedDate,
        time: formattedTime,
        location,
        participants: Number(participants),
        banner: bannerBase64,
        proposalName: proposalName || 'Event Proposal',
        proposalFile: proposalFileBase64,
        isCollab,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || '',
        createdByName: selectedOrganization.firstName,
        organization: selectedOrganization.firstName,
        orgId: selectedOrg,
        status: 'Pending',
      });
      alert('Event submitted — waiting for approval.');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-black">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-semibold mb-4">Create Event</h2>

        <div className="space-y-4">
          {/* Organizer */}
          <div>
            <label className="font-medium">Organizer</label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1 bg-white"
            >
              <option value="">Select Organization</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.firstName}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="font-medium">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-medium">Event Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          {/* Date */}
          <div>
            <label className="font-medium">Event Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          {/* Time + Suggestions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="font-medium">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>

          {/* Notice Box */}
          {(conflictMessage || suggestions.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-yellow-800 font-medium">
                <AlertTriangle className="w-4 h-4" />
                {conflictMessage}
              </div>
              {suggestions.length > 0 && (
                <div className="text-sm text-yellow-700">
                  Suggested available slots:
                  <ul className="list-disc pl-5 mt-1">
                    {suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Location */}
          <div>
            <label className="font-medium">Event Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border rounded-lg p-2 mt-1 bg-white"
            >
              <option value="">Select a location</option>
              <option value="MPH 1, EN Building">MPH 1, EN Building</option>
              <option value="MPH 2, EN Building">MPH 2, EN Building</option>
              <option value="EE Laboratory Rooms, EN Building">EE Laboratory Rooms, EN Building</option>
              <option value="EN Briefing Room, EN Building">EN Briefing Room, EN Building</option>
              <option value="MPH 3, LCT Building">MPH 3, LCT Building</option>
              <option value="Conference Hall, TYK Building">Conference Hall, TYK Building</option>
            </select>
          </div>

          {/* Participants */}
          <div>
            <label className="font-medium">Event Participants</label>
            <input
              type="number"
              value={participants}
              onChange={(e) => setParticipants(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          {/* Banner */}
          <div>
            <label className="font-medium">Event Banner</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileToBase64(file, setBannerBase64);
              }}
              className="w-full border rounded-lg p-2 mt-1"
            />
            {bannerBase64 && (
              <img src={bannerBase64} className="mt-2 rounded-lg w-full max-h-48 object-cover" />
            )}
          </div>

          {/* Proposal PDF */}
          <div>
            <label className="font-medium">Event Proposal (PDF)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setProposalName(file.name);
                  handleFileToBase64(file, setProposalFileBase64);
                }
              }}
              className="w-full border rounded-lg p-2 mt-1"
            />
            {proposalFileBase64 && (
              <p className="text-green-600 mt-1 text-sm">
                📄 Uploaded: <span className="font-medium">{proposalName}</span>
              </p>
            )}
          </div>

          {/* Collaboration */}
          <div className="flex items-center gap-2 mt-4">
            <label className="font-medium">Collaboration Event?</label>
            <input
              type="checkbox"
              checked={isCollab}
              onChange={(e) => setIsCollab(e.target.checked)}
              className="w-5 h-5 accent-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleCreateEvent}
          disabled={loading}
          className="mt-6 w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </div>
  );
};

export default CreateEventModal;
