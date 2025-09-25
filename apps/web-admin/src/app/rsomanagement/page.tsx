'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  Calendar,
  Users,
  UserCheck,
  Shield,
  Eye,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Mail,
  FileText,
  Award
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const RSOManagement = () => {
  const [activeNav, setActiveNav] = useState('RSO Management');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCollege, setFilterCollege] = useState('all');
  const [selectedRSOs, setSelectedRSOs] = useState<string[]>([]);

  // Sample RSO data
  const rsos = [
    {
      id: 'RSO-001',
      name: 'UE Programming Club',
      type: 'University Wide',
      college: 'All Colleges',
      registrationStatus: 'Active',
      memberCount: 156,
      officerInCharge: 'Juan Dela Cruz',
      officerPosition: 'President',
      adviser: 'Dr. Maria Santos',
      eventsProposed: 8,
      eventsCompleted: 5,
      establishedDate: '2019-09-15',
      description: 'Promoting programming excellence and innovation across all engineering disciplines',
      contactEmail: 'programming@ue.edu.ph',
      meetingSchedule: 'Every Friday, 4:00 PM',
      lastActivity: '2024-01-15'
    },
    {
      id: 'RSO-025',
      name: 'Business Leaders Society',
      type: 'College-Based',
      college: 'CBA',
      registrationStatus: 'Active',
      memberCount: 89,
      officerInCharge: 'Ana Garcia',
      officerPosition: 'President',
      adviser: 'Prof. Carlos Martinez',
      eventsProposed: 12,
      eventsCompleted: 10,
      establishedDate: '2020-02-10',
      description: 'Developing future business leaders and entrepreneurs',
      contactEmail: 'business.leaders@ue.edu.ph',
      meetingSchedule: 'Every Tuesday, 3:00 PM',
      lastActivity: '2024-01-20'
    },
    {
      id: 'RSO-042',
      name: 'Fine Arts Collective',
      type: 'College-Based',
      college: 'CFAD',
      registrationStatus: 'Pending Renewal',
      memberCount: 67,
      officerInCharge: 'Miguel Torres',
      officerPosition: 'President',
      adviser: 'Prof. Isabella Cruz',
      eventsProposed: 6,
      eventsCompleted: 4,
      establishedDate: '2021-01-20',
      description: 'Showcasing and promoting various forms of fine arts',
      contactEmail: 'finearts@ue.edu.ph',
      meetingSchedule: 'Every Wednesday, 2:00 PM',
      lastActivity: '2023-12-10'
    },
    {
      id: 'RSO-067',
      name: 'Psychology Research Society',
      type: 'College-Based',
      college: 'CAS',
      registrationStatus: 'Active',
      memberCount: 43,
      officerInCharge: 'Sofia Reyes',
      officerPosition: 'President',
      adviser: 'Dr. Roberto Kim',
      eventsProposed: 4,
      eventsCompleted: 3,
      establishedDate: '2022-08-05',
      description: 'Advancing psychological research and mental health awareness',
      contactEmail: 'psych.research@ue.edu.ph',
      meetingSchedule: 'Every Thursday, 5:00 PM',
      lastActivity: '2024-01-18'
    },
    {
      id: 'RSO-089',
      name: 'Environmental Action Group',
      type: 'University Wide',
      college: 'All Colleges',
      registrationStatus: 'Under Review',
      memberCount: 23,
      officerInCharge: 'Luis Mendoza',
      officerPosition: 'Interim President',
      adviser: 'Dr. Carmen Flores',
      eventsProposed: 3,
      eventsCompleted: 1,
      establishedDate: '2023-11-15',
      description: 'Promoting environmental sustainability and awareness',
      contactEmail: 'environment@ue.edu.ph',
      meetingSchedule: 'Every Monday, 4:30 PM',
      lastActivity: '2024-01-12'
    }
  ];

  const stats = {
    totalActiveRSOs: 147,
    eventsPendingApproval: 23,
    eventsCompleted: 142,
    totalStudentMembers: 8234
  };

  // Filter RSOs based on search and filters
  const filteredRSOs = rsos.filter(rso => {
    const matchesSearch = rso.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rso.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rso.officerInCharge.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || rso.type === filterType;
    const matchesStatus = filterStatus === 'all' || rso.registrationStatus === filterStatus;
    const matchesCollege = filterCollege === 'all' || rso.college === filterCollege;

    return matchesSearch && matchesType && matchesStatus && matchesCollege;
  });

  const handleRSOSelect = (rsoId: string) => {
    setSelectedRSOs(prev => 
      prev.includes(rsoId) 
        ? prev.filter(id => id !== rsoId)
        : [...prev, rsoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRSOs.length === filteredRSOs.length) {
      setSelectedRSOs([]);
    } else {
      setSelectedRSOs(filteredRSOs.map(rso => rso.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'Pending Renewal':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending Renewal
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Eye className="h-3 w-3 mr-1" />
            Under Review
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </span>
        );
      default:
        return null;
    }
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
      <Sidebar/>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RSO Management</h1>
            <p className="text-gray-600">Manage Recognized Student Organizations and their activities</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Registered RSOs"
              value={stats.totalActiveRSOs}
              icon={Building2}
              color="text-red-600"
              bgColor="bg-red-50"
            />
            <StatCard
              title="RSOs Pending Approval"
              value={stats.eventsPendingApproval}
              icon={Calendar}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
            />
            <StatCard
              title="Re-accredited RSOs"
              value={stats.eventsCompleted}
              icon={CheckCircle}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Total Members Across All RSOs"
              value={stats.totalStudentMembers}
              icon={Users}
              color="text-green-600"
              bgColor="bg-green-50"
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
                    placeholder="Search RSOs..."
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
                  <option value="all">All Types</option>
                  <option value="University Wide">University Wide</option>
                  <option value="College-Based">College-Based</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Pending Renewal">Pending Renewal</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <select
                  value={filterCollege}
                  onChange={(e) => setFilterCollege(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Colleges</option>
                  <option value="All Colleges">University Wide</option>
                  <option value="COE">COE</option>
                  <option value="CAS">CAS</option>
                  <option value="CBA">CBA</option>
                  <option value="CFAD">CFAD</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
               
                <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Register RSO
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedRSOs.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-red-900 font-medium">
                    {selectedRSOs.length} RSOs selected
                  </span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Send Notice
                    </button>
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Export Selected
                    </button>
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Bulk Update
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RSOs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRSOs.length === filteredRSOs.length && filteredRSOs.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RSO Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & College
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leadership
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Events
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRSOs.map((rso) => (
                    <tr key={rso.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRSOs.includes(rso.id)}
                          onChange={() => handleRSOSelect(rso.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                            {rso.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {rso.name}
                            </div>
                            <div className="text-sm text-gray-500 font-mono">{rso.id}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Est. {new Date(rso.establishedDate).getFullYear()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{rso.type}</div>
                        <div className="text-gray-500">{rso.college}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(rso.registrationStatus)}
                        <div className="text-xs text-gray-500 mt-1">
                          Last active: {new Date(rso.lastActivity).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <Users className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-lg font-semibold text-gray-900">
                            {rso.memberCount}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">members</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center mb-1">
                          <Shield className="h-4 w-4 text-blue-500 mr-2" />
                          <div>
                            <div className="font-medium text-gray-900">{rso.officerInCharge}</div>
                            <div className="text-gray-500">{rso.officerPosition}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-green-500 mr-2" />
                          <div className="text-gray-600">{rso.adviser}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {rso.eventsProposed}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">proposed</div>
                          <div className="flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600">
                              {rso.eventsCompleted}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">completed</div>
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
                            title="Edit RSO"
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
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete RSO"
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredRSOs.length} of {rsos.length} RSOs
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

export default RSOManagement;