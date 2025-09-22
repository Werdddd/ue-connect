'use client';

import React, { useState } from 'react';
import {
  Users,
  Building2,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  ChevronRight
} from 'lucide-react';

const Logo = ({ size = "w-8 h-8" }) => (
  <img 
    src="/logo.png" 
    alt="Logo" 
    className={`${size} object-contain flex-shrink-0`}
  />
);

type SidebarProps = {
  activeNav: string;
  setActiveNav: (nav: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ activeNav, setActiveNav }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const showExpandedContent = sidebarOpen || sidebarHovered;

  const navigationItems = [
    { name: 'Dashboard', icon: BarChart3 },
    { name: 'Users', icon: Users },
    { name: 'Organizations', icon: Building2 },
    { name: 'Events', icon: Calendar },
    { name: 'Documents', icon: FileText }
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40 ${
        showExpandedContent ? 'w-64' : 'w-16'
      }`}
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Logo />
          <div
            className={`ml-3 transition-all duration-300 ease-in-out ${
              showExpandedContent 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-4'
            }`}
          >
            <div className="font-semibold text-gray-900 whitespace-nowrap">UE Connect</div>
            <div className="text-sm text-gray-500 whitespace-nowrap">Admin Dashboard</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-2 py-4 space-y-2 content-center">
        {navigationItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setActiveNav(item.name)}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${
              activeNav === item.name
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon size={20} className="flex-shrink-0" />
            <span
              className={`ml-3 transition-all duration-300 ease-in-out whitespace-nowrap ${
                showExpandedContent 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 -translate-x-4'
              }`}
            >
              {item.name}
            </span>
            {activeNav === item.name && (
              <ChevronRight
                size={16}
                className={`ml-auto flex-shrink-0 transition-all duration-300 ease-in-out ${
                  showExpandedContent 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 translate-x-4'
                }`}
              />
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield size={16} />
          </div>
          <div
            className={`ml-3 transition-all duration-300 ease-in-out ${
              showExpandedContent 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-4'
            }`}
          >
            <div className="font-medium text-gray-900 whitespace-nowrap">Admin User</div>
            <div className="text-xs text-gray-500 whitespace-nowrap">System Administrator</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;