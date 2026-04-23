import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Pill, Dumbbell, Heart, MessageSquare, Settings,
  Bell, ChevronRight, Calendar, CheckCircle, 
  AlertCircle, Clock, ChevronDown, ChevronUp, Plus, Loader2,
  Flame, Move, Watch, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Link } from 'react-router-dom';
import supabase from '../../supabaseClient';
import useAuth from '../../hooks/useAuth';
import Sidebar from './sidebar';
import FloatingChatbot from '../ai/FloatingChatbot';

const healthData = {
  nutrition: [
    { name: 'Carbs', value: 45 },
    { name: 'Protein', value: 30 },
    { name: 'Fats', value: 25 },
  ],
  activity: [
    { day: 'Mon', steps: 8500 },
    { day: 'Tue', steps: 10200 },
    { day: 'Wed', steps: 7800 },
    { day: 'Thu', steps: 9200 },
    { day: 'Fri', steps: 11000 },
    { day: 'Sat', steps: 6500 },
    { day: 'Sun', steps: 4800 },
  ]
};

const COLORS = ['#3B82F6', '#10B981', '#22D3EE'];

export default function Dashboard() {
  const { session } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedCard, setExpandedCard] = useState(null);
  const [medications, setMedications] = useState([
    { name: 'Metformin', time: '8:00', taken: true },
    { name: 'Lisinopril', time: '12:00', taken: false },
    { name: 'Aspirin', time: '20:00', taken: false },
  ]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Health summary data
  const healthSummary = {
    calories: 1850,
    exercise: 45, // minutes
    standHours: 10
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('name, email, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session]);

  const alerts = [
    { type: 'warning', message: 'Blood oxygen level is below normal', time: '2 hours ago' },
    { type: 'reminder', message: 'Take your medication now', time: '5 minutes ago' },
    { type: 'success', message: 'You have reached your step goal!', time: 'Just now' },
  ];

  const tasks = [
    { task: 'Take morning medication', completed: true },
    { task: 'Walk for 30 minutes', completed: false },
    { task: 'Check blood oxygen levels', completed: true },
    { task: 'Log lunch meal', completed: false },
  ];

  const toggleCard = (cardId) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const toggleMedication = (index) => {
    const updatedMeds = [...medications];
    updatedMeds[index].taken = !updatedMeds[index].taken;
    setMedications(updatedMeds);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <div className="m-auto">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar Component */}
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        userProfile={userProfile}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 border-b border-gray-200/30 dark:border-gray-700/30">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome, {userProfile?.name || 'User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                {format(new Date(), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Health Monitoring Quick Actions */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-blue-500" />
                    Health Monitoring
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Link 
                    to="/blood-oxygen" 
                    className="flex flex-col items-center justify-center h-24 rounded-lg border border-blue-500 text-blue-500 bg-white hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition p-4"
                  >
                    <Heart className="w-6 h-6 mb-2" />
                    <p className="text-lg font-medium text-center">Take Blood Oxygen Reading</p>
                  </Link>
                  <Link 
                    to="/heart-rate-monitor" 
                    className="flex flex-col items-center justify-center h-24 rounded-lg border border-blue-500 text-blue-500 bg-white hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition p-4"
                  >
                    <Activity className="w-6 h-6 mb-2" />
                    <p className="text-lg font-medium text-center">Take Heart Rate Reading</p>
                  </Link>
                </div>
              </motion.div>

              {/* Health Summary Card */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-500" />
                    Health Summary
                  </h2>
                  <button className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                    View Details <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 mb-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shadow-md">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Calories
                    </p>
                    <p className="text-lg font-bold">{healthSummary.calories}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kcal</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 mb-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center shadow-md">
                      <Move className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Exercise
                    </p>
                    <p className="text-lg font-bold">{healthSummary.exercise}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      minutes
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 mb-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
                      <Watch className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Stand Hours
                    </p>
                    <p className="text-lg font-bold">{healthSummary.standHours}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      hours
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Activity Card */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30"
              >
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Dumbbell className="w-5 h-5 mr-2 text-teal-500" />
                  Weekly Activity
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthData.activity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: '#6b7280' }}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280' }}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'white',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          border: 'none'
                        }}
                        formatter={(value) => [`${value}`, 'Steps']}
                      />
                      <Bar
                        dataKey="steps"
                        fill="#22D3EE"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Medication Card */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-blue-500" />
                    Medications
                  </h2>
                  <button className="text-blue-600 dark:text-blue-400 flex items-center text-sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {medications.map((med, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-green-50/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <Pill className={`w-5 h-5 mr-3 ${med.taken ? 'text-green-500' : 'text-blue-500'}`} />
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {med.time}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleMedication(index)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          med.taken
                            ? 'bg-green-100 dark:bg-green-900/50'
                            : 'bg-blue-100 dark:bg-blue-900/50'
                        }`}
                      >
                        <CheckCircle
                          className={`w-5 h-5 ${
                            med.taken
                              ? 'text-green-500 dark:text-green-400'
                              : 'text-blue-500 dark:text-blue-400'
                          }`}
                        />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Alerts Card */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30"
              >
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
                  Alerts
                </h2>
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 2 }}
                      className={`flex items-start p-4 rounded-xl border-l-4 ${
                        alert.type === 'warning'
                          ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20'
                          : alert.type === 'success'
                          ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20'
                          : 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                      }`}
                    >
                      <AlertCircle
                        className={`w-5 h-5 mr-3 mt-0.5 ${
                          alert.type === 'warning'
                            ? 'text-yellow-500'
                            : alert.type === 'success'
                            ? 'text-green-500'
                            : 'text-blue-500'
                        }`}
                      />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{alert.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Tasks Card */}
              <motion.div 
                whileHover={{ y: -2 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30"
              >
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-teal-500" />
                  Tasks
                </h2>
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ x: 2 }}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50/50 to-green-50/50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg transition-colors"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => {}}
                          className={`w-5 h-5 rounded border-2 ${
                            task.completed
                              ? 'border-green-500 bg-green-500'
                              : 'border-blue-300 dark:border-gray-500'
                          } focus:ring-0 focus:ring-offset-0`}
                        />
                        <span
                          className={`ml-3 ${
                            task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''
                          }`}
                        >
                          {task.task}
                        </span>
                      </div>
                      {task.completed && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <FloatingChatbot />
    </div>
  );
}