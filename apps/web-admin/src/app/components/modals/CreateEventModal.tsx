'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { firestore, auth } from '@/Firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

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

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, orgData }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [participants, setParticipants] = useState<number | ''>('');
    const [bannerBase64, setBannerBase64] = useState('');
    const [proposalType, setProposalType] = useState<'link' | 'file'>('link');
    const [proposalLink, setProposalLink] = useState('');
    const [proposalFileBase64, setProposalFileBase64] = useState('');
    const [isCollab, setIsCollab] = useState(false);
    const [loading, setLoading] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    if (!isOpen) return null;

    // Convert uploaded file to base64
    const handleFileToBase64 = (file: File, setter: (val: string) => void) => {
        const reader = new FileReader();
        reader.onloadend = () => setter(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCreateEvent = async () => {
        if (!title || !description || !date || !startTime || !endTime || !location || !participants || !bannerBase64) {
            alert('Please fill out all required fields.');
            return;
        }

        setLoading(true);

        const formattedTime = `${startTime} - ${endTime}`;

        try {
            await addDoc(collection(firestore, 'events'), {
                title,
                description,
                date,
                time: formattedTime,
                location,
                participants: Number(participants),
                banner: bannerBase64,
                proposalLink: proposalType === 'link' ? proposalLink : '',
                proposalName: proposalType === 'file' ? 'Uploaded PDF' : '',
                proposalFile: proposalType === 'file' ? proposalFileBase64 : '',
                isCollab,
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser?.uid || '',
                createdByName: orgData.email,
                orgId: orgData.orgId,
                organization: orgData.organization,
                department: orgData.department,
                status: 'Pending',
            });

            alert('Event created successfully!');
            onClose();
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-600 hover:text-black"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-semibold mb-4">Create Event</h2>

                <div className="space-y-4">
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

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-medium">Start Time</label>
                            <input
                                type="time"
                                value={startTime || ''}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full border rounded-lg p-2 mt-1"
                            />
                        </div>

                        <div>
                            <label className="font-medium">End Time</label>
                            <input
                                type="time"
                                value={endTime || ''}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full border rounded-lg p-2 mt-1"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="font-medium">Event Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full border rounded-lg p-2 mt-1"
                        />
                    </div>

                    {/* Participants */}
                    <div>
                        <label className="font-medium">Event Participants</label>
                        <input
                            type="number"
                            value={participants}
                            onChange={(e) =>
                                setParticipants(e.target.value === '' ? '' : Number(e.target.value))
                            }
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
                            <img
                                src={bannerBase64}
                                alt="Preview"
                                className="mt-2 rounded-lg w-full max-h-48 object-cover"
                            />
                        )}
                    </div>

                    {/* Proposal Section */}
                    <div>
                        <label className="font-medium">Event Proposal</label>
                        <div className="flex items-center gap-3 mt-2">
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-lg border ${proposalType === 'link' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                                    }`}
                                onClick={() => setProposalType('link')}
                            >
                                Link
                            </button>
                            <button
                                type="button"
                                className={`px-3 py-1 rounded-lg border ${proposalType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                                    }`}
                                onClick={() => setProposalType('file')}
                            >
                                PDF
                            </button>
                        </div>

                        {proposalType === 'link' ? (
                            <input
                                type="url"
                                value={proposalLink}
                                onChange={(e) => setProposalLink(e.target.value)}
                                placeholder="https://..."
                                className="w-full border rounded-lg p-2 mt-3"
                            />
                        ) : (
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileToBase64(file, setProposalFileBase64);
                                }}
                                className="w-full border rounded-lg p-2 mt-3"
                            />
                        )}
                    </div>

                    {/* Collaboration Toggle */}
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
