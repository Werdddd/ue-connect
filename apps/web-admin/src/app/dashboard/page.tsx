'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Calendar,
  FileText,
  UserCheck,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from '@/Firebase';
import { getTotalUsers, getUserGrowth, getTotalJoinedStudents } from "@/services/users";
import { getTotalOrganizations } from "@/services/organizations";
import { getActiveEvents } from "@/services/events";
import { getGrowthTrends } from "@/services/analytics";

const Dashboard = () => {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [totalUsers, setTotalUsers] = useState(0);
  const [trendValue, setTrendValue] = useState<number | null>(null);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [joinedStudents, setJoinedStudents] = useState(0);
  const [activeEvents, setActiveEvents] = useState(0);
  const [studentTrend, setStudentTrend] = useState<number>(0);
  const [monthlyData, setMonthlyData] = useState<{ month: string; students: number; orgs: number }[]>([]);


  useEffect(() => {
    const fetchData = async () => {
      const total = await getTotalUsers();
      const growth = await getUserGrowth();
      const orgs = await getTotalOrganizations();
      const joined = await getTotalJoinedStudents();
      const events = await getActiveEvents();
      const growthTrends = await getGrowthTrends();

      setTotalUsers(total);
      setTrendValue(growth);
      setTotalOrgs(orgs);
      setJoinedStudents(joined);
      setActiveEvents(events);

      setMonthlyData(
        growthTrends.map((item) => ({
          month: item.month,
          students: item.students,
          orgs: orgs 
        }))
      );
      
    };
    fetchData();
  }, []);


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
    <div className="ml-15 min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

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
              value={totalUsers}
              icon={Users}
              trend={trendValue !== null}
              trendValue={trendValue ?? 0}
            />
            <StatCard
              title="Registered Organizations"
              value={totalOrgs}
              icon={Building2}
              trend={false}
            />
            <StatCard
              title="Students in Organizations"
              value={joinedStudents}
              icon={UserCheck}
              trend={false}
            />

            <StatCard
              title="Active Events"
              value={activeEvents}
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