'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Monitor,
  Building,
  MapPin,
} from 'lucide-react';

import Sidebar from '../components/Sidebar';
import {
  getEventsCount,
  getPendingEventsCount,
  getOnGoingEventsCount,
  getCompletedEventsCount,
} from '../../services/events';
import { fetchEvents } from '../../services/fetchEvents';

import { firestore } from '../../Firebase';
import { writeBatch, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import CreateEventModal from '../components/modals/CreateEventModal';
import EventDetailsModal, {
  EventDetails,
  formatDateTime as fmtDT,
  ModalAction,
} from '../components/modals/EventDetailsModal';

import RemarkModal from '../components/modals/RemarkModal';

/* ---------------- helpers ---------------- */

function countParticipants(participantsList?: Record<string, any>) {
  if (!participantsList || typeof participantsList !== 'object') return 0;
  return Object.values(participantsList).filter(
    (p: any) => p && typeof p === 'object' && (p.status || '').toLowerCase() === 'approved'
  ).length;
}

function toProposalStatus(s?: string) {
  switch (s) {
    case 'Applied': return 'Under Review';
    case 'Approved': return 'Approved';
    case 'Rejected': return 'Rejected';
    case 'Finished': return 'Approved';
    default: return 'Under Review';
  }
}

function toEventStatus(s?: string) {
  switch (s) {
    case 'Applied': return 'Planning';
    case 'Approved': return 'Ongoing';
    case 'Finished': return 'Completed';
    case 'Rejected': return 'Cancelled';
    default: return 'Planning';
  }
}



const buildISO = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return '';
  const composed = timeStr ? `${dateStr} ${timeStr}` : dateStr;
  const d = new Date(composed);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

/* ---------------- types ---------------- */

type Row = {
  id: string;
  title: string;
  organizingRSO: string;
  rsoId: string;
  category: string;
  dateTime: string;
  endDateTime?: string;
  location?: string;
  mode?: string;
  proposalStatus: string;
  eventStatus: string;
  participantCount: number;
  maxCapacity: number;
  description?: string;

  banner?: string;
  date?: string;
  department?: string;
  isCollab?: boolean;
  orgId?: string;
  organization?: string;
  proposalFile?: string;
  proposalLink?: string;
  proposalName?: string;
  proposalBase64?: string;
  statusRaw?: string;
  timeRaw?: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
};

/* --------------- page --------------- */

const EventManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProposalStatus, setFilterProposalStatus] = useState('all');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [orgData, setOrgData] = useState<{
    orgId: string;
    organization: string;
    department: string;
    email: string;
  } | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(0);
  const [onGoingEvents, setOnGoingEvents] = useState(0);
  const [completedEvents, setCompletedEvents] = useState(0);

  const [events, setEvents] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<EventDetails | null>(null);

  const [bulkBusy, setBulkBusy] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);

  // NEW: remark modal state
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkAction, setRemarkAction] = useState<'Approved' | 'Rejected' | null>(null);
  const [remarkFor, setRemarkFor] = useState<EventDetails | null>(null);
  const [remarkBusy, setRemarkBusy] = useState(false);

  /* stat cards */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [approved, pending, ongoing, completed] = await Promise.all([
          getEventsCount(),
          getPendingEventsCount(),
          getOnGoingEventsCount(),
          getCompletedEventsCount(),
        ]);
        if (!cancelled) {
          setTotalEvents(approved);
          setPendingApproval(pending);
          setOnGoingEvents(ongoing);
          setCompletedEvents(completed);
        }
      } catch (e) {
        console.error('Failed to load counts:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* fetch events & resolve RSO name from Users/{email}.firstName */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rows = await fetchEvents(200);

        const emails = Array.from(
          new Set(
            rows
              .map((e: any) => (e.createdByName || e.createdBy || '').trim())
              .filter(Boolean)
          )
        );

        const nameMap = new Map<string, string>();
        await Promise.all(
          emails.map(async (email) => {
            try {
              const snap = await getDoc(doc(firestore, 'Users', email));
              if (snap.exists()) {
                const data = snap.data() || {};
                const firstName = (data.firstName as string) || '';
                if (firstName) nameMap.set(email, firstName);
              }
            } catch {}
          })
        );

        const mapped: Row[] = rows.map((e: any) => {
          const proposalStatus = toProposalStatus(e.status);
          const eventStatus = toEventStatus(e.status);
          const [timeStart, timeEnd] = (e.time || '').split('-').map((s: string) => s.trim());

          const email = (e.createdByName || e.createdBy || '').trim();
          const fromUsers = nameMap.get(email);
          const fallbackEmailLocal = email.includes('@') ? email.split('@')[0] : email;
          const organizingRSO =
            fromUsers || (e.organization || '').toString() || fallbackEmailLocal || '—';

          const approvedCount = countParticipants(e.participantsList);
          const capacity =
            typeof e.participants === 'number' ? e.participants : Number(e.participants) || 100;

          return {
            id: e.id,
            title: e.title,
            organizingRSO,
            rsoId: '',
            category: (e.description || '').trim() || 'General',
            dateTime: buildISO(e.date, timeStart),
            endDateTime: buildISO(e.date, timeEnd),
            location: e.location || '—',
            mode: 'In-Person',
            proposalStatus,
            eventStatus,
            participantCount:
              approvedCount > 0
                ? approvedCount
                : typeof e.participantsCount === 'number'
                ? e.participantsCount
                : 0,
            maxCapacity: capacity,
            description: e.description || '',

            banner: e.banner || '',              // <— banner from DB
            proposalBase64: e.proposalBase64 || '',
            proposalFile: e.proposalFile || '',
            proposalLink: e.proposalLink || '',
            proposalName: e.proposalName || '',

            date: e.date,
            department: e.department,
            isCollab: !!e.isCollab,
            orgId: e.orgId || e.orgid || e.orgID || '',
            organization: e.organization || '',
            statusRaw: e.status || '',
            timeRaw: e.time || '',
            createdAt: e.createdAt || '',
            createdBy: e.createdBy || '',
            createdByName: e.createdByName || '',
          };
        });

        if (!cancelled) setEvents(mapped);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  /* filtering */
  const filteredEvents = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return (events ?? []).filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(search) ||
        event.organizingRSO.toLowerCase().includes(search) ||
        event.id.toLowerCase().includes(search);

      const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || event.eventStatus === filterStatus;
      const matchesProposal =
        filterProposalStatus === 'all' || event.proposalStatus === filterProposalStatus;

      return matchesSearch && matchesCategory && matchesStatus && matchesProposal;
    });
  }, [events, searchTerm, filterCategory, filterStatus, filterProposalStatus]);

  /* selection (banner still optional) */
  const handleEventSelect = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map((e) => e.id));
    }
  };

  /* bulk actions */
  const bulkSetStatus = async (newStatus: 'Approved' | 'Rejected') => {
    if (selectedEvents.length === 0 || bulkBusy) return;
    try {
      setBulkBusy(true);
      const batch = writeBatch(firestore);
      selectedEvents.forEach((id) =>
        batch.update(doc(firestore, 'events', id), { status: newStatus })
      );
      await batch.commit();

      setEvents((prev) =>
        prev.map((row) =>
          selectedEvents.includes(row.id)
            ? {
                ...row,
                proposalStatus: toProposalStatus(newStatus),
                eventStatus: toEventStatus(newStatus),
                statusRaw: newStatus,
              }
            : row
        )
      );
      setSelectedEvents([]);
    } catch (err) {
      console.error('Bulk update failed:', err);
    } finally {
      setBulkBusy(false);
    }
  };

  /* event details modal */
  const openDetails = (ev: Row) => {
    setDetailsEvent({ ...ev });
    setDetailsOpen(true);
  };
  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsEvent(null);
  };

  // Cancel (no remarks)
  const handleModalAction = async (action: ModalAction, ev: EventDetails) => {
    if (action !== 'Cancelled') return;
    try {
      setModalBusy(true);
      const firestoreStatus = 'Rejected'; // map "Cancelled" to DB 'Rejected' if that's your convention
      await updateDoc(doc(firestore, 'events', ev.id), {
        status: firestoreStatus,
        adminAction: action,
        adminActionAt: serverTimestamp(),
      });

      setEvents((prev) =>
        prev.map((r) =>
          r.id !== ev.id
            ? r
            : {
                ...r,
                statusRaw: firestoreStatus,
                proposalStatus: toProposalStatus(firestoreStatus),
                eventStatus: toEventStatus(firestoreStatus),
              }
        )
      );

      setDetailsEvent((cur) =>
        !cur
          ? cur
          : {
              ...cur,
              statusRaw: firestoreStatus,
              proposalStatus: toProposalStatus(firestoreStatus),
              eventStatus: toEventStatus(firestoreStatus),
            }
      );
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setModalBusy(false);
    }
  };

  /* --------- REMARKS FLOW --------- */

  // Open the remarks modal when Approve/Reject is clicked from EventDetailsModal
  const handleOpenRemarks = (action: 'Approved' | 'Rejected', ev: EventDetails) => {
    setRemarkAction(action);
    setRemarkFor(ev);
    setRemarkOpen(true);
  };

  // Save status + remarks to Firestore
  const handleSubmitRemarks = async (text: string) => {
    if (!remarkOpen || !remarkAction || !remarkFor) return;
    try {
      setRemarkBusy(true);
      const statusToSet = remarkAction; // in DB you use the same strings

      await updateDoc(doc(firestore, 'events', remarkFor.id), {
        status: statusToSet,
        adminAction: remarkAction,
        adminRemarks: text || '',
        adminActionAt: serverTimestamp(),
      });

      // Update table
      setEvents((prev) =>
        prev.map((r) =>
          r.id !== remarkFor.id
            ? r
            : {
                ...r,
                statusRaw: statusToSet,
                proposalStatus: toProposalStatus(statusToSet),
                eventStatus: toEventStatus(statusToSet),
              }
        )
      );

      // Update open detail modal too (so badges change immediately)
      setDetailsEvent((cur) =>
        !cur
          ? cur
          : {
              ...cur,
              statusRaw: statusToSet,
              proposalStatus: toProposalStatus(statusToSet),
              eventStatus: toEventStatus(statusToSet),
            }
      );

      setRemarkOpen(false);
      setRemarkFor(null);
      setRemarkAction(null);
    } catch (err) {
      console.error('Saving remarks failed:', err);
    } finally {
      setRemarkBusy(false);
    }
  };

  /* badges */
  const getProposalStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getEventStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'Ongoing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <PlayCircle className="h-3 w-3 mr-1" />
            Ongoing
          </span>
        );
      case 'Upcoming':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Calendar className="h-3 w-3 mr-1" />
            Upcoming
          </span>
        );
      case 'Planning':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Planning
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  /* stat card */
  type StatCardProps = {
    title: string;
    value: number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    bgColor?: string;
  };
  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, bgColor = 'bg-red-50' }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 ${bgColor} rounded-full`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  /* render */
  return (
    <div className="ml-15 min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
            <p className="text-gray-600">Manage RSO events, proposals, and activities</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Events" value={totalEvents} icon={Calendar} color="text-red-600" bgColor="bg-red-50" />
            <StatCard title="Pending Approval" value={pendingApproval} icon={Clock} color="text-yellow-600" bgColor="bg-yellow-50" />
            <StatCard title="On Going" value={onGoingEvents} icon={PlayCircle} color="text-purple-600" bgColor="bg-purple-50" />
            <StatCard title="Completed Events" value={completedEvents} icon={CheckCircle} color="text-blue-600" bgColor="bg-blue-50" />
          </div>

          {/* Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full sm:w-80"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Competition">Competition</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Exhibition">Exhibition</option>
                  <option value="Community Service">Community Service</option>
                </select>

                <select
                  value={filterProposalStatus}
                  onChange={(e) => setFilterProposalStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Proposal Status</option>
                  <option value="Approved">Approved</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Event Status</option>
                  <option value="Planning">Planning</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </button>
              </div>
            </div>

            {/* Optional bulk banner */}
            {selectedEvents.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-red-900 font-medium">
                    {selectedEvents.length} {selectedEvents.length === 1 ? 'event' : 'events'} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => bulkSetStatus('Approved')}
                      disabled={bulkBusy}
                      className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm disabled:opacity-60"
                    >
                      {bulkBusy ? 'Approving…' : 'Approve Selected'}
                    </button>
                    <button
                      onClick={() => bulkSetStatus('Rejected')}
                      disabled={bulkBusy}
                      className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm disabled:opacity-60"
                    >
                      {bulkBusy ? 'Rejecting…' : 'Reject Selected'}
                    </button>
                    <button
                      onClick={() => bulkSetStatus('Rejected')}
                      disabled={bulkBusy}
                      className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm disabled:opacity-60"
                    >
                      {bulkBusy ? 'Cancelling…' : 'Cancel Selected'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 text-sm text-gray-500">Loading events…</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organizing RSO
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date &amp; Time
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location/Mode
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participants
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEvents.map((event) => {
                        const start = fmtDT(event.dateTime);
                        const cap = Math.max(event.maxCapacity || 0, 1);
                        const pct = Math.min(Math.round((event.participantCount / cap) * 100), 100);

                        return (
                          <tr
                            key={event.id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => openDetails(event)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-start">
                                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                                  <Calendar className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 mb-1">{event.title}</div>
                                  <div className="text-xs text-gray-500 font-mono mb-1">{event.id}</div>
                                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {event.category}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center">
                                <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">
                                  {event.organizingRSO
                                    .split(' ')
                                    .map((w) => w[0])
                                    .join('')
                                    .slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{event.organizingRSO}</div>
                                  <div className="text-gray-500 text-xs">—</div>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center mb-1">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="font-medium text-gray-900">{start.date}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-gray-600">
                                  {start.time}
                                  {event.endDateTime ? ` - ${fmtDT(event.endDateTime).time}` : ''}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center mb-1">
                                {event.mode === 'In-Person' ? (
                                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                                ) : event.mode === 'Online' ? (
                                  <Monitor className="h-4 w-4 text-gray-400 mr-2" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                )}
                                <span className="text-gray-900">{event.location}</span>
                              </div>
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {event.mode}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {getProposalStatusBadge(event.proposalStatus)}
                                {getEventStatusBadge(event.eventStatus)}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center mb-1">
                                <Users className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-lg font-semibold text-gray-900">
                                  {event.participantCount}
                                </span>
                                <span className="text-gray-500 ml-1">/{cap}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{pct}% full</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination stub */}
                <div className="bg-white px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {filteredEvents.length} of {events.length} events
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        Previous
                      </button>
                      <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                        1
                      </button>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        2
                      </button>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <EventDetailsModal
        open={detailsOpen}
        event={detailsEvent}
        onClose={closeDetails}
        onOpenRemarks={handleOpenRemarks}
        onAction={handleModalAction}
        busy={modalBusy}
      />
      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        orgData={orgData}
      />
      {/* Remarks Modal */}
      <RemarkModal
        open={remarkOpen}
        action={remarkAction || 'Approved'}
        busy={remarkBusy}
        onClose={() => {
          if (!remarkBusy) {
            setRemarkOpen(false);
            setRemarkFor(null);
            setRemarkAction(null);
          }
        }}
        onSubmit={handleSubmitRemarks}
      />
    </div>
  );
};

export default EventManagement;
