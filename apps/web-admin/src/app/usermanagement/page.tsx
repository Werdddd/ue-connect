'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  GraduationCap,
  Shield,
  UserCheck,
  Mail,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  UserPlus,
  X,
  Phone,
  MapPin,
  Calendar,
  Building
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { fetchUsers, UserDoc } from '../../services/fetchUsers';

// User Details Modal Component
const UserDetailsModal = ({ user, onClose }: { user: UserDoc | null; onClose: () => void }) => {
  if (!user) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex items-center mb-6">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-2xl">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Year</p>
                <p className="text-sm font-medium text-gray-900">{user.Year || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Building className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Course</p>
                <p className="text-sm font-medium text-gray-900">{user.Course || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Shield className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* RSO Membership Section */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">RSO Membership</h4>
            {user.orgs && user.orgs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.orgs.map((org, index) => (
                  <span
                    key={index}
                    className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full"
                  >
                    {org}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Not a member of any RSO</p>
            )}
          </div>

          {/* Additional Info Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">User ID</p>
                  <p className="text-sm font-mono text-gray-900">{user.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Status</p>
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [activeNav, setActiveNav] = useState('User Management');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterRSO, setFilterRSO] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDoc | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [studentNumber, setStudentNumber] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [course, setCourse] = useState('');
    const [year, setYear] = useState('');
    const [activities, setActivities] = useState<any[]>([]);
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await fetchUsers(100);
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.role === 'user').length,
    rsoMembers: users.filter(u => Array.isArray(u.orgs) && u.orgs.length > 0).length,
    rsoOfficers: users.filter(u => u.role === 'admin').length,
  };

  const filteredUsers = users
    .filter((user) => user.role === 'user')
    .filter((user) => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesYear = filterYear === 'all' || user.Year === filterYear;
      const matchesCourse = filterCourse === 'all' || user.Course === filterCourse;
      const matchesRSO =
        filterRSO === 'all' ||
        (filterRSO === 'member' && (user.orgs?.length ?? 0) > 0) ||
        (filterRSO === 'officer' && user.role === 'admin') ||
        (filterRSO === 'non-member' && (user.orgs?.length ?? 0) === 0);

      return matchesSearch && matchesYear && matchesCourse && matchesRSO;
    });

  const handleUserSelect = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  };

  const handleRowClick = (user: UserDoc) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  type StatCardProps = {
    title: string;
    value: number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-full">
          <Icon className="h-8 w-8 text-red-600" />
        </div>
      </div>
    </div>
  );

  const handleAddUser = async (formData: Record<string, any>) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        alert("User created successfully!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading users...
      </div>
    );
  }

  return (
    <div className="ml-15 min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage students, RSO members, and officers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Students" value={stats.totalUsers} icon={Users} />
            <StatCard title="Active Students" value={stats.activeUsers} icon={UserCheck} />
            <StatCard title="RSO Members" value={stats.rsoMembers} icon={GraduationCap} />
            <StatCard title="RSO Officers" value={stats.rsoOfficers} icon={Shield} />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
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
                  <option value="all">All Courses</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSA">BSA</option>
                  <option value="BFA">BFA</option>
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

              <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors" onClick={() => setShowAddUserModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </button>
            </div>
          </div>

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
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year & Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RSO
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.Year} - {user.Course}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {user.orgs?.length ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Member
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            Non-member
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            </div>
          </div>
        </div>
      </div>
        {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Background Blur */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setShowAddUserModal(false)}
          ></div>

          {/* Modal Box */}
          <div className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg mx-4 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Add New User
            </h2>

            <form className="space-y-4" onSubmit={e => {
              e.preventDefault();
              handleAddUser({
                studentNumber,
                firstName,
                lastName,
                email,
                password,
                Course: course,
                Year: year,
              });
              setShowAddUserModal(false);
            }}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Student Number</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="e.g. 2021-12345"
                  value={studentNumber}
                  onChange={e => setStudentNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="example@ue.edu.ph"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {/* Course Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Course</label>
                <select className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={course}
                  onChange={e => setCourse(e.target.value)}>
                  <option value="">Select Course</option>
                  <option disabled>--- College of Engineering ---</option>
                  <option value="BSCE">BSCE</option>
                  <option value="BSCpE">BSCpE</option>
                  <option value="BSEE">BSEE</option>
                  <option value="BSECE">BSECE</option>
                  <option value="BSME">BSME</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSDS">BSDS</option>
                  <option disabled>--- College of Fine Arts, Architecture and Design ---</option>
                  <option value="BMA">BMA</option>
                  <option value="BSID">BSID</option>
                  <option value="BFA">BFA</option>
                  <option value="BS Architecture">BS Architecture</option>
                  <option disabled>--- Business Administration ---</option>
                  <option value="BS Accountancy">BS Accountancy</option>
                  <option value="BSMA">BSMA</option>
                  <option value="BSBA">BSBA</option>
                  <option disabled>--- College of Arts and Sciences ---</option>
                  <option value="BSC">BSC</option>
                  <option value="BSP">BSP</option>
                  <option value="BSHM">BSHM</option>
                  <option value="BSTM">BSTM</option>
                </select>
              </div>

              {/* Year Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <select className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={year}
                  onChange={e => setYear(e.target.value)}>
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* User Details Modal */}
      {selectedUser && (
        <UserDetailsModal user={selectedUser} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default UserManagement;