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
  orgData: {
    orgId: string;
    organization: string;
    department: string;
    email: string;
  };
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

  const handleFileToBase64 = (file: File, setter: (val: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

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
          if (nextStart.getHours() >= 22) break;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Create Event</h2>
            <button 
              onClick={onClose} 
              className="text-white hover:text-red-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-6">
            {/* Organizer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organizer</label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">Select organization</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.firstName}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="Enter event name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe your event"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Conflict Warning */}
            {(conflictMessage || suggestions.length > 0) && (
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4">
                <div className="flex items-start gap-3 text-amber-800 text-sm mb-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="font-medium">{conflictMessage}</span>
                </div>
                {suggestions.length > 0 && (
                  <div className="text-sm text-amber-700 ml-8">
                    <p className="font-medium mb-2">Available slots:</p>
                    <div className="space-y-1">
                      {suggestions.map((s, i) => (
                        <div key={i} className="pl-3 border-l-2 border-amber-300">{s}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              >
                <option value="">Select location</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Participants</label>
              <input
                type="number"
                value={participants}
                onChange={(e) => setParticipants(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Banner</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileToBase64(file, setBannerBase64);
                }}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-600 hover:file:bg-red-100 file:cursor-pointer cursor-pointer"
              />
              {bannerBase64 && (
                <img src={bannerBase64} className="mt-3 rounded-lg w-full h-40 object-cover border border-gray-200" alt="Banner preview" />
              )}
            </div>

            {/* Proposal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Proposal (PDF)</label>
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
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-600 hover:file:bg-red-100 file:cursor-pointer cursor-pointer"
              />
              {proposalFileBase64 && (
                <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                  <span className="text-green-600">✓</span> {proposalName}
                </p>
              )}
            </div>

            {/* Collaboration */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="collab"
                checked={isCollab}
                onChange={(e) => setIsCollab(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="collab" className="text-sm text-gray-700 font-medium">
                This is a collaboration event
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleCreateEvent}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEventModal;