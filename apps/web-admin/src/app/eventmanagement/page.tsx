'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  MapPin,
  Users,
  Clock,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Monitor,
  Building,
  Mail,
  FileText,
  Star,
  DollarSign,
  Camera
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const EventManagement = () => {
  const [activeNav, setActiveNav] = useState('Event Management');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProposalStatus, setFilterProposalStatus] = useState('all');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Sample event data
  const events = [
    {
      id: 'EVT-001',
      title: 'Annual Programming Competition',
      organizingRSO: 'UE Programming Club',
      rsoId: 'RSO-001',
      category: 'Competition',
      dateTime: '2024-02-15T09:00:00',
      endDateTime: '2024-02-15T17:00:00',
      location: 'Computer Laboratory 1',
      mode: 'In-Person',
      proposalStatus: 'Approved',
      eventStatus: 'Upcoming',
      participantCount: 156,
      maxCapacity: 200,
      description: 'Annual inter-college programming competition featuring algorithmic challenges',
      contactPerson: 'Juan Dela Cruz',
      contactEmail: 'juan.delacruz@ue.edu.ph',
      registrationDeadline: '2024-02-10T23:59:00',
      requirements: 'Laptop, Student ID',
      submittedDate: '2024-01-05',
      approvedDate: '2024-01-12'
    },
    {
      id: 'EVT-025',
      title: 'Business Leadership Summit',
      organizingRSO: 'Business Leaders Society',
      rsoId: 'RSO-025',
      category: 'Seminar',
      dateTime: '2024-01-28T14:00:00',
      endDateTime: '2024-01-28T18:00:00',
      location: 'Main Auditorium',
      mode: 'Hybrid',
      proposalStatus: 'Approved',
      eventStatus: 'Ongoing',
      participantCount: 245,
      maxCapacity: 300,
      description: 'Leadership development seminar with industry experts',
      contactPerson: 'Ana Garcia',
      contactEmail: 'ana.garcia@ue.edu.ph',
      registrationDeadline: '2024-01-25T23:59:00',
      requirements: 'Business attire required',
      submittedDate: '2023-12-15',
      approvedDate: '2023-12-22'
    },
    {
      id: 'EVT-042',
      title: 'Art Exhibition: Colors of UE',
      organizingRSO: 'Fine Arts Collective',
      rsoId: 'RSO-042',
      category: 'Exhibition',
      dateTime: '2024-01-20T10:00:00',
      endDateTime: '2024-01-22T18:00:00',
      location: 'UE Gallery',
      mode: 'In-Person',
      proposalStatus: 'Approved',
      eventStatus: 'Completed',
      participantCount: 89,
      maxCapacity: 150,

      description: '3-day art exhibition showcasing student works',
      contactPerson: 'Miguel Torres',
      contactEmail: 'miguel.torres@ue.edu.ph',
      registrationDeadline: '2024-01-18T23:59:00',
      requirements: 'None',
      submittedDate: '2023-11-20',
      approvedDate: '2023-12-01'
    },
    {
      id: 'EVT-067',
      title: 'Mental Health Awareness Workshop',
      organizingRSO: 'Psychology Research Society',
      rsoId: 'RSO-067',
      category: 'Workshop',
      dateTime: '2024-02-05T13:00:00',
      endDateTime: '2024-02-05T16:00:00',
      location: 'Psychology Building Room 301',
      mode: 'In-Person',
      proposalStatus: 'Under Review',
      eventStatus: 'Planning',
      participantCount: 0,
      maxCapacity: 80,

      description: 'Interactive workshop on mental health awareness and coping strategies',
      contactPerson: 'Sofia Reyes',
      contactEmail: 'sofia.reyes@ue.edu.ph',
      registrationDeadline: '2024-02-03T23:59:00',
      requirements: 'Notebook, Pen',
      submittedDate: '2024-01-20',
      approvedDate: null
    },
    {
      id: 'EVT-089',
      title: 'Environmental Cleanup Drive',
      organizingRSO: 'Environmental Action Group',
      rsoId: 'RSO-089',
      category: 'Community Service',
      dateTime: '2024-01-25T07:00:00',
      endDateTime: '2024-01-25T12:00:00',
      location: 'UE Campus Grounds',
      mode: 'In-Person',
      proposalStatus: 'Rejected',
      eventStatus: 'Cancelled',
      participantCount: 0,
      maxCapacity: 100,
 
      description: 'Campus-wide environmental cleanup and tree planting activity',
      contactPerson: 'Luis Mendoza',
      contactEmail: 'luis.mendoza@ue.edu.ph',
      registrationDeadline: '2024-01-23T23:59:00',
      requirements: 'Gloves, Old clothes',
      submittedDate: '2024-01-10',
      approvedDate: null
    }
  ];

  const stats = {
    totalEvents: 165,
    pendingApproval: 12,
    upcomingEvents: 28,
    completedEvents: 98
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizingRSO.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || event.eventStatus === filterStatus;
    const matchesProposalStatus = filterProposalStatus === 'all' || event.proposalStatus === filterProposalStatus;

    return matchesSearch && matchesCategory && matchesStatus && matchesProposalStatus;
  });

  const handleEventSelect = (eventId: string) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map(event => event.id));
    }
  };

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

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  type StatCardProps = {
    title: string;
    value: number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
    bgColor?: string;
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, bgColor = "bg-red-50" }) => (
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

  return (
    <div className="ml-15 min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h1>
            <p className="text-gray-600">Manage RSO events, proposals, and activities</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              icon={Calendar}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <StatCard
              title="Pending Approval"
              value={stats.pendingApproval}
              icon={Clock}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
            <StatCard
              title="Upcoming Events"
              value={stats.upcomingEvents}
              icon={PlayCircle}
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
            <StatCard
              title="Completed Events"
              value={stats.completedEvents}
              icon={CheckCircle}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
          </div>

          {/* Controls Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search and Filters */}
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

              {/* Action Buttons */}
              <div className="flex gap-3">
               
                <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedEvents.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-red-900 font-medium">
                    {selectedEvents.length} events selected
                  </span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Approve Selected
                    </button>
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Export Selected
                    </button>
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Cancel Selected
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Events Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizing RSO
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
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
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => {
                    const startDateTime = formatDateTime(event.dateTime);
                    const endDateTime = formatDateTime(event.endDateTime);
                    
                    return (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedEvents.includes(event.id)}
                            onChange={() => handleEventSelect(event.id)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                              <Calendar className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {event.title}
                              </div>
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
                              {event.organizingRSO.split(' ').map(word => word[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{event.organizingRSO}</div>
                              <div className="text-gray-500 text-xs">{event.contactPerson}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">{startDateTime.date}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{startDateTime.time} - {endDateTime.time}</span>
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
                            <span className="text-gray-500 ml-1">/{event.maxCapacity}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-red-600 h-1.5 rounded-full" 
                              style={{ 
                                width: `${Math.min((event.participantCount / event.maxCapacity) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round((event.participantCount / event.maxCapacity) * 100)}% full
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit Event"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                              title="Event Photos"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Cancel Event"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="More Options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;