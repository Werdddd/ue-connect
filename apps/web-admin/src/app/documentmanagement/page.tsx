'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  Eye,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Building2,
  User,
  Mail,
  FileCheck,
  FileX,
  FileClock,
  ArrowUp,
  ArrowDown,
  Paperclip,
  Star,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

// Type definitions
interface Document {
  id: string;
  title: string;
  type: string;
  associatedRSO: string;
  rsoId: string;
  submissionDate: string;
  dueDate: string;
  status: string;
  submittedBy: string;
  submitterRole: string;
  reviewedBy: string | null;
  reviewDate: string | null;
  priority: string;
  fileSize: string;
  fileFormat: string;
  version: string;
  description: string;
  comments: string | null;
  category: string;
  confidential: boolean;
  attachments: number;
}

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bgColor?: string;
}




const DocumentManagement = () => {
  const [activeNav, setActiveNav] = useState('Document Management');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRSO, setFilterRSO] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const documentsPerPage = 10;

  // Sample document data
  const documents: Document[] = [
    {
      id: 'DOC-001',
      title: 'Annual Financial Report 2024',
      type: 'Financial Report',
      associatedRSO: 'UE Programming Club',
      rsoId: 'RSO-001',
      submissionDate: '2024-01-15T10:30:00',
      dueDate: '2024-01-20T23:59:00',
      status: 'Approved',
      submittedBy: 'Juan Dela Cruz',
      submitterRole: 'President',
      reviewedBy: 'Dr. Maria Santos',
      reviewDate: '2024-01-18T14:20:00',
      priority: 'High',
      fileSize: '2.5 MB',
      fileFormat: 'PDF',
      version: '1.0',
      description: 'Annual financial report including budget breakdown and expenditures',
      comments: 'Well documented financial activities. Approved for records.',
      category: 'Compliance',
      confidential: false,
      attachments: 3
    },
    {
      id: 'DOC-025',
      title: 'Event Proposal: Business Summit 2024',
      type: 'Event Proposal',
      associatedRSO: 'Business Leaders Society',
      rsoId: 'RSO-025',
      submissionDate: '2024-01-20T09:15:00',
      dueDate: '2024-01-25T23:59:00',
      status: 'Pending Review',
      submittedBy: 'Ana Garcia',
      submitterRole: 'President',
      reviewedBy: null,
      reviewDate: null,
      priority: 'Medium',
      fileSize: '1.8 MB',
      fileFormat: 'PDF',
      version: '2.1',
      description: 'Comprehensive proposal for annual business leadership summit',
      comments: null,
      category: 'Event Planning',
      confidential: false,
      attachments: 5
    },
    {
      id: 'DOC-042',
      title: 'Membership Registration Form',
      type: 'Registration Document',
      associatedRSO: 'Fine Arts Collective',
      rsoId: 'RSO-042',
      submissionDate: '2024-01-22T16:45:00',
      dueDate: '2024-02-01T23:59:00',
      status: 'Rejected',
      submittedBy: 'Miguel Torres',
      submitterRole: 'Secretary',
      reviewedBy: 'Prof. Isabella Cruz',
      reviewDate: '2024-01-24T11:30:00',
      priority: 'Low',
      fileSize: '850 KB',
      fileFormat: 'DOCX',
      version: '1.0',
      description: 'Updated membership registration form with new requirements',
      comments: 'Missing required signatures. Please resubmit with complete documentation.',
      category: 'Administrative',
      confidential: false,
      attachments: 1
    },
    {
      id: 'DOC-067',
      title: 'Workshop Materials Request',
      type: 'Resource Request',
      associatedRSO: 'Psychology Research Society',
      rsoId: 'RSO-067',
      submissionDate: '2024-01-23T13:20:00',
      dueDate: '2024-01-28T23:59:00',
      status: 'Under Review',
      submittedBy: 'Sofia Reyes',
      submitterRole: 'Vice President',
      reviewedBy: 'Dr. Roberto Kim',
      reviewDate: null,
      priority: 'High',
      fileSize: '3.2 MB',
      fileFormat: 'PDF',
      version: '1.2',
      description: 'Request for materials and resources for mental health workshop',
      comments: 'Currently reviewing budget allocation and availability.',
      category: 'Resource Management',
      confidential: false,
      attachments: 7
    },
    {
      id: 'DOC-089',
      title: 'Constitution and Bylaws Amendment',
      type: 'Constitutional Document',
      associatedRSO: 'Environmental Action Group',
      rsoId: 'RSO-089',
      submissionDate: '2024-01-19T14:50:00',
      dueDate: '2024-01-30T23:59:00',
      status: 'Returned',
      submittedBy: 'Luis Mendoza',
      submitterRole: 'President',
      reviewedBy: 'Legal Affairs Office',
      reviewDate: '2024-01-21T09:45:00',
      priority: 'Critical',
      fileSize: '4.1 MB',
      fileFormat: 'PDF',
      version: '3.0',
      description: 'Proposed amendments to organization constitution and bylaws',
      comments: 'Requires legal review and compliance check. Some clauses need revision.',
      category: 'Legal',
      confidential: true,
      attachments: 2
    },
    {
      id: 'DOC-112',
      title: 'Equipment Purchase Request',
      type: 'Resource Request',
      associatedRSO: 'Engineering Society',
      rsoId: 'RSO-112',
      submissionDate: '2024-01-24T11:15:00',
      dueDate: '2024-02-05T23:59:00',
      status: 'Pending Review',
      submittedBy: 'Carlos Mendez',
      submitterRole: 'Treasurer',
      reviewedBy: null,
      reviewDate: null,
      priority: 'Medium',
      fileSize: '1.2 MB',
      fileFormat: 'PDF',
      version: '1.0',
      description: 'Request for new laboratory equipment for student projects',
      comments: null,
      category: 'Resource Management',
      confidential: false,
      attachments: 4
    },
    {
      id: 'DOC-098',
      title: 'Annual Activity Report 2023',
      type: 'Activity Report',
      associatedRSO: 'Student Council',
      rsoId: 'RSO-098',
      submissionDate: '2024-01-16T08:30:00',
      dueDate: '2024-01-22T23:59:00',
      status: 'Approved',
      submittedBy: 'Maria Rodriguez',
      submitterRole: 'Secretary',
      reviewedBy: 'Dean Office',
      reviewDate: '2024-01-19T10:15:00',
      priority: 'High',
      fileSize: '5.8 MB',
      fileFormat: 'PDF',
      version: '2.0',
      description: 'Comprehensive annual report of all student council activities',
      comments: 'Excellent documentation of activities. Approved with commendations.',
      category: 'Compliance',
      confidential: false,
      attachments: 8
    }
  ];

  const stats = {
    totalDocuments: 2847,
    pendingReview: 156,
    approvedDocuments: 2341,
    rejectedReturned: 350
  };

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.associatedRSO.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesRSO = filterRSO === 'all' || doc.associatedRSO === filterRSO;

    return matchesSearch && matchesType && matchesStatus && matchesRSO;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);
  const startIndex = (currentPage - 1) * documentsPerPage;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + documentsPerPage);

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === paginatedDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(paginatedDocuments.map(doc => doc.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Eye className="h-3 w-3 mr-1" />
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
      case 'Returned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <ArrowUp className="h-3 w-3 mr-1" />
            Returned
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            Low
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

  const isOverdue = (dueDateStr: string, status: string) => {
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    return dueDate < now && (status === 'Pending Review' || status === 'Under Review');
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
      <Sidebar  />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Management</h1>
            <p className="text-gray-600">Manage RSO documents, submissions, and approvals</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Documents Submitted"
              value={stats.totalDocuments}
              icon={FileText}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <StatCard
              title="Pending Review Documents"
              value={stats.pendingReview}
              icon={FileClock}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
            <StatCard
              title="Approved Documents"
              value={stats.approvedDocuments}
              icon={FileCheck}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <StatCard
              title="Rejected/Returned Documents"
              value={stats.rejectedReturned}
              icon={FileX}
              color="text-orange-600"
              bgColor="bg-orange-50"
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
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full sm:w-80"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Document Types</option>
                  <option value="Financial Report">Financial Report</option>
                  <option value="Event Proposal">Event Proposal</option>
                  <option value="Registration Document">Registration Document</option>
                  <option value="Resource Request">Resource Request</option>
                  <option value="Constitutional Document">Constitutional Document</option>
                  <option value="Activity Report">Activity Report</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Returned">Returned</option>
                </select>

                <select
                  value={filterRSO}
                  onChange={(e) => setFilterRSO(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All RSOs</option>
                  <option value="UE Programming Club">UE Programming Club</option>
                  <option value="Business Leaders Society">Business Leaders Society</option>
                  <option value="Fine Arts Collective">Fine Arts Collective</option>
                  <option value="Psychology Research Society">Psychology Research Society</option>
                  <option value="Environmental Action Group">Environmental Action Group</option>
                  <option value="Engineering Society">Engineering Society</option>
                  <option value="Student Council">Student Council</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                
                <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedDocuments.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-red-900 font-medium">
                    {selectedDocuments.length} documents selected
                  </span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Approve Selected
                    </button>
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Download Selected
                    </button>
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Request Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.length === paginatedDocuments.length && paginatedDocuments.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Associated RSO
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submission Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review Info
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedDocuments.map((doc) => {
                    const submissionDateTime = formatDateTime(doc.submissionDate);
                    const dueDateFormatted = formatDateTime(doc.dueDate);
                    const overdue = isOverdue(doc.dueDate, doc.status);
                    
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(doc.id)}
                            onChange={() => handleDocumentSelect(doc.id)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {doc.title}
                                {doc.confidential && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    Confidential
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-mono mb-1">{doc.id}</div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  {doc.type}
                                </span>
                                {getPriorityBadge(doc.priority)}
                                {doc.attachments > 0 && (
                                  <span className="inline-flex items-center text-xs text-gray-500">
                                    <Paperclip className="h-3 w-3 mr-1" />
                                    {doc.attachments}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {doc.fileFormat} • {doc.fileSize} • v{doc.version}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2">
                              {doc.associatedRSO.split(' ').map(word => word[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{doc.associatedRSO}</div>
                              <div className="text-gray-500 text-xs">{doc.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center mb-1">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium text-gray-900">{doc.submittedBy}</div>
                              <div className="text-gray-500 text-xs">{doc.submitterRole}</div>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {submissionDateTime.date} at {submissionDateTime.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className={`flex items-center ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                            <Calendar className={`h-4 w-4 mr-2 ${overdue ? 'text-red-500' : 'text-gray-400'}`} />
                            <div>
                              <div className="font-medium">{dueDateFormatted.date}</div>
                              <div className="text-xs text-gray-500">{dueDateFormatted.time}</div>
                              {overdue && (
                                <div className="text-xs text-red-600 font-medium mt-1">
                                  OVERDUE
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {getStatusBadge(doc.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {doc.reviewedBy ? (
                            <div>
                              <div className="flex items-center mb-1">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="font-medium text-gray-900">{doc.reviewedBy}</span>
                              </div>
                              {doc.reviewDate && (
                                <div className="text-xs text-gray-500">
                                  Reviewed: {formatDateTime(doc.reviewDate).date}
                                </div>
                              )}
                              {doc.comments && (
                                <div className="flex items-start mt-1">
                                  <MessageCircle className="h-3 w-3 text-gray-400 mr-1 mt-0.5" />
                                  <span className="text-xs text-gray-600 line-clamp-2">
                                    {doc.comments}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Not yet reviewed</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="View Document"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Download Document"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Edit Document"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete Document"
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

            {/* Empty State */}
            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}

            {/* Pagination */}
            {filteredDocuments.length > 0 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(startIndex + documentsPerPage, filteredDocuments.length)} of {filteredDocuments.length} documents
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center px-3 py-1 text-sm border rounded hover:bg-gray-50 transition-colors ${
                        currentPage === 1 
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              currentPage === pageNumber
                                ? 'bg-red-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="px-2 text-gray-500">...</span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center px-3 py-1 text-sm border rounded hover:bg-gray-50 transition-colors ${
                        currentPage === totalPages 
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Panel
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors cursor-pointer">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Review Pending</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {documents.filter(doc => doc.status === 'Pending Review').length} documents need review
                </p>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                  View All →
                </button>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors cursor-pointer">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Overdue Items</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {documents.filter(doc => isOverdue(doc.dueDate, doc.status)).length} documents are overdue
                </p>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                  View All →
                </button>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors cursor-pointer">
                <div className="flex items-center mb-2">
                  <FileX className="h-5 w-5 text-orange-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Returned Documents</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {documents.filter(doc => doc.status === 'Returned').length} documents need resubmission
                </p>
                <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                  View All →
                </button>
              </div>
            </div>
          </div> */}

          {/* Recent Activity */}
          {/* <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {documents.slice(0, 5).map((doc, index) => (
                <div key={doc.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.status === 'Approved' ? 'Approved' : 
                       doc.status === 'Rejected' ? 'Rejected' : 
                       doc.status === 'Returned' ? 'Returned for revision' : 
                       'Submitted'} by {doc.submittedBy} • {doc.associatedRSO}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDateTime(doc.submissionDate).date}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm text-red-600 hover:text-red-700 font-medium">
              View All Activity →
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;