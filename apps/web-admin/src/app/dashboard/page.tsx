'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  Calendar, 
  FileText, 
  BarChart3, 
  Menu,
  X,
  UserCheck,
  Shield,
  TrendingUp,
  Activity,
  ChevronRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Changed to false (collapsed by default)
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  // Determine if sidebar should show expanded content
  const showExpandedContent = sidebarOpen || sidebarHovered;

  // Sample data
  const stats = {
    totalStudents: 15420,
    registeredOrgs: 147,
    rsoOfficers: 892,
    activeEvents: 23
  };

  const monthlyData = [
    { month: 'Jan', students: 14200, orgs: 132, events: 45 },
    { month: 'Feb', students: 14650, orgs: 138, events: 52 },
    { month: 'Mar', students: 14890, orgs: 141, events: 48 },
    { month: 'Apr', students: 15100, orgs: 144, events: 61 },
    { month: 'May', students: 15420, orgs: 147, events: 58 }
  ];

  const orgTypeData = [
    { name: 'University Wide', value: 45, color: '#DC2626' },
    { name: 'COE', value: 32, color: '#EF4444' },
    { name: 'CAS', value: 28, color: '#F87171' },
    { name: 'CFAD', value: 25, color: '#FCA5A5' },
    { name: 'CBA', value: 17, color: '#FECACA' }
  ];

  const recentActivities = [
    { action: 'New organization registered', org: 'UE Debate Society', time: '2 hours ago' },
    { action: 'Event approved', org: 'Engineering Club', time: '4 hours ago' },
    { action: 'Officer position updated', org: 'Student Council', time: '6 hours ago' },
    { action: 'Document uploaded', org: 'Arts Society', time: '1 day ago' }
  ];

  const navigationItems = [
    { name: 'Dashboard', icon: BarChart3, active: true },
    { name: 'Users', icon: Users, active: false },
    { name: 'Organizations', icon: Building2, active: false },
    { name: 'Events', icon: Calendar, active: false },
    { name: 'Documents', icon: FileText, active: false }
  ];

  // Logo component
  const Logo = ({ size = "w-8 h-8" }) => (
    <img src="/logo.png" alt="UE Connect Logo" className={`${size} rounded-lg`} />
    
  );

  type StatCardProps = {
    title: string;
    value: number;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    trend?: boolean;
    trendValue?: number;
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, trendValue }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+{trendValue}% from last month</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-red-50 rounded-full">
          <Icon className="h-8 w-8 text-red-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div 
        className={`${showExpandedContent ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col relative z-10`}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Logo />
              {showExpandedContent && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">UE Connect</h1>
                  <p className="text-sm text-gray-600">Admin Dashboard</p>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => setActiveNav(item.name)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
                    activeNav === item.name
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {showExpandedContent && (
                    <>
                      <span className="ml-3 font-medium">{item.name}</span>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-red-600" />
            </div>
            {showExpandedContent && (
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-600">System Administrator</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">Monitor and manage your UE Connect platform</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={Users}
              trend={true}
              trendValue={8.5}
            />
            <StatCard
              title="Registered Organizations"
              value={stats.registeredOrgs}
              icon={Building2}
              trend={true}
              trendValue={4.2}
            />
            <StatCard
              title="RSO Officers"
              value={stats.rsoOfficers}
              icon={UserCheck}
              trend={true}
              trendValue={6.1}
            />
            <StatCard
              title="Active Events"
              value={stats.activeEvents}
              icon={Calendar}
              trend={false}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Growth Trends */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#DC2626" 
                    strokeWidth={3}
                    name="Students"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orgs" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    name="Organizations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Organization Types */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Types</h3>
              <div className="flex flex-col lg:flex-row items-center">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={orgTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {orgTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="lg:ml-4 mt-4 lg:mt-0">
                  {orgTypeData.map((item, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <Activity className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.org}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-red-600 mr-3" />
                    <span className="font-medium text-red-900">Add New User</span>
                  </div>
                </button>
                <button className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-red-600 mr-3" />
                    <span className="font-medium text-red-900">Register Organization</span>
                  </div>
                </button>
                <button className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-red-600 mr-3" />
                    <span className="font-medium text-red-900">Create Event</span>
                  </div>
                </button>
                <button className="w-full p-3 text-left bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-red-600 mr-3" />
                    <span className="font-medium text-red-900">Generate Report</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;