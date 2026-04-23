import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Pill, Dumbbell, Apple, Heart, MessageSquare, Settings,
  User, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaRobot } from "react-icons/fa";
import { RiRobot2Line } from "react-icons/ri";
import { GiRobotAntennas } from 'react-icons/gi';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  userProfile: {
    name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, userProfile }) => {
  const navItems = [
    { id: 'overview', icon: Activity, label: 'Overview' },
    { id: 'medications', icon: Pill, label: 'Medications', link: '/medication' },
    { id: 'diet', icon: Apple, label: 'Diet', link: '/diet' },
    { id: 'monitoring', icon: Heart, label: 'Monitoring', link: '/monitoring' },
    { id: 'activity', icon: Activity, label: 'Activity', link: '/activity-summary' },
    { id: 'documents', icon: FileText, label: 'Documents', link: '/documents' },
    { id: 'AI', icon: FaRobot, label: 'AI', link: '/ai' },
  ];

  return (
    <div className="sticky top-0 h-screen">
      <motion.nav 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-20 md:w-64 h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 shadow-lg"
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center space-x-4 mb-8">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt="Profile"
                className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-green-400 object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="hidden md:block">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {userProfile?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userProfile?.email || ''}
              </p>
            </div>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.link || '#'}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                    : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="hidden md:block font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </motion.nav>
    </div>
  );
};

export default Sidebar;