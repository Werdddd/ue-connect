'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter,
  UserPlus,
  Edit3,
  Trash2,
  Download,
  Upload,
  Mail,
  GraduationCap,
  Shield,
  UserCheck,
  Eye,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const UserManagement = () => {
  const [activeNav, setActiveNav] = useState('User Management');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterRSO, setFilterRSO] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Sample user data
  const users = [
    {
      id: 'UE2021-0001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan.delacruz@ue.edu.ph',
      year: '4th Year',
      course: 'Computer Engineering',
      college: 'COE',
      rsoMember: true,
      rsoOfficer: false,
      rsoOrganization: 'UE Programming Club',
      status: 'Active',
      enrollmentDate: '2021-08-15'
    },
    {
      id: 'UE2020-0125',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@ue.edu.ph',
      year: '3rd Year',
      course: 'Business Administration',
      college: 'CBA',
      rsoMember: true,
      rsoOfficer: true,
      rsoOrganization: 'Business Club',
      rsoPosition: 'President',
      status: 'Active',
      enrollmentDate: '2020-08-20'
    },
    {
      id: 'UE2022-0089',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      email: 'carlos.rodriguez@ue.edu.ph',
      year: '2nd Year',
      course: 'Fine Arts',
      college: 'CFAD',
      rsoMember: false,
      rsoOfficer: false,
      rsoOrganization: null,
      status: 'Active',
      enrollmentDate: '2022-08-10'
    },
    {
      id: 'UE2021-0234',
      firstName: 'Ana',
      lastName: 'Garcia',
      email: 'ana.garcia@ue.edu.ph',
      year: '3rd Year',
      course: 'Psychology',
      college: 'CAS',
      rsoMember: true,
      rsoOfficer: true,
      rsoOrganization: 'Psychology Society',
      rsoPosition: 'Vice President',
      status: 'Active',
      enrollmentDate: '2021-08-18'
    },
    {
      id: 'UE2023-0012',
      firstName: 'Miguel',
      lastName: 'Torres',
      email: 'miguel.torres@ue.edu.ph',
      year: '1st Year',
      course: 'Civil Engineering',
      college: 'COE',
      rsoMember: false,
      rsoOfficer: false,
      rsoOrganization: null,
      status: 'Active',
      enrollmentDate: '2023-08-14'
    }
  ];

  const stats = {
    totalUsers: 15420,
    activeUsers: 14892,
    rsoMembers: 8234,
    rsoOfficers: 892
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = filterYear === 'all' || user.year === filterYear;
    const matchesCourse = filterCourse === 'all' || user.college === filterCourse;
    const matchesRSO = filterRSO === 'all' || 
                      (filterRSO === 'member' && user.rsoMember) ||
                      (filterRSO === 'officer' && user.rsoOfficer) ||
                      (filterRSO === 'non-member' && !user.rsoMember);

    return matchesSearch && matchesYear && matchesCourse && matchesRSO;
  });

  const handleUserSelect = (userId: any) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  type StatCardProps = {
    title: string;
    value: number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 ${color} rounded-full`}>
          <Icon className="h-8 w-8 text-red-600" />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage students, RSO members, and officers</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Students"
              value={stats.totalUsers}
              icon={Users}
              color="bg-red-50"
            />
            <StatCard
              title="Active Students"
              value={stats.activeUsers}
              icon={UserCheck}
              color="bg-red-50"
            />
            <StatCard
              title="RSO Members"
              value={stats.rsoMembers}
              icon={GraduationCap}
              color="bg-red-50"
            />
            <StatCard
              title="RSO Officers"
              value={stats.rsoOfficers}
              icon={Shield}
              color="bg-red-50"
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
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full sm:w-80"
                  />
                </div>
                
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>

                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All Colleges</option>
                  <option value="COE">COE</option>
                  <option value="CAS">CAS</option>
                  <option value="CBA">CBA</option>
                  <option value="CFAD">CFAD</option>
                </select>

                <select
                  value={filterRSO}
                  onChange={(e) => setFilterRSO(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">All RSO Status</option>
                  <option value="member">RSO Members</option>
                  <option value="officer">RSO Officers</option>
                  <option value="non-member">Non-Members</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
               
                <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-red-900 font-medium">
                    {selectedUsers.length} users selected
                  </span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Send Email
                    </button>
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Export Selected
                    </button>
                    <button className="px-3 py-1 text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors text-sm">
                      Delete Selected
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year & Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RSO Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-medium">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.college}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{user.year}</div>
                        <div className="text-gray-500">{user.course}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {user.rsoMember ? (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Member
                              </span>
                              {user.rsoOfficer && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-1">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Officer
                                </span>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                {user.rsoOrganization}
                              </div>
                              {user.rsoPosition && (
                                <div className="text-xs text-gray-500">
                                  {user.rsoPosition}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Non-member
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
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
                  Showing {filteredUsers.length} of {users.length} users
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

export default UserManagement;