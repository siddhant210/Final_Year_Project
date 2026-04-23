import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Activity } from 'lucide-react'; // Import Heart and Activity icons
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HeartRateData {
  heartRate: number;
  timestamp: string;
  sampleCount: number;
}

export default function HeartRateMonitor() {
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [history, setHistory] = useState<{time: string, value: number}[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // WebSocket connection setup
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
      console.log('Connected to heart rate server');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data: HeartRateData = JSON.parse(event.data);
      setHeartRate(data.heartRate);
      setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
      
      // Update history
      setHistory(prev => {
        const newHistory = [...prev, {
          time: new Date(data.timestamp).toLocaleTimeString(),
          value: data.heartRate
        }];
        return newHistory.slice(-20); // Keep only the latest 20 entries
      });
    };

    ws.onclose = () => {
      console.log('Disconnected from heart rate server');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Animation variants
  const pulseVariants = {
    normal: { scale: 1 },
    pulse: { scale: [1, 1.1, 1], transition: { duration: 0.8, repeat: Infinity } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <main className="flex-1 overflow-y-auto p-6">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-500" />
                  Live Heart Rate Monitor
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {isConnected ? 'Connected to monitor' : 'Connecting...'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{isConnected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </motion.div>

          {/* Main Heart Rate Display */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Rate Card */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  Current Heart Rate
                </h2>
                {lastUpdated && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Updated: {lastUpdated}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col items-center justify-center py-8">
                <AnimatePresence mode="wait">
                  {heartRate ? (
                    <motion.div
                      key="heart-rate"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="text-center"
                    >
                      <motion.div
                        variants={pulseVariants}
                        animate={heartRate > 100 ? "pulse" : "normal"}
                        className="mb-4"
                      >
                        <Heart className="w-16 h-16 mx-auto text-red-500" />
                      </motion.div>
                      <div className="text-5xl font-bold text-red-600 dark:text-red-400">
                        {heartRate}
                        <span className="text-2xl text-gray-500 dark:text-gray-400 ml-1">BPM</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {heartRate < 60 ? 'Resting' : 
                         heartRate < 100 ? 'Normal' : 
                         'Elevated'}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-data"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8 text-gray-500 dark:text-gray-400"
                    >
                      Waiting for heart rate data...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* History Chart */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                Recent History
              </h2>
              <div className="h-64">
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                      />
                      <YAxis 
                        domain={['dataMin - 10', 'dataMax + 10']}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'white',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          border: 'none'
                        }}
                        formatter={(value) => [`${value} BPM`, 'Heart Rate']}
                        labelFormatter={(label) => `Time: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6, fill: '#dc2626' }}
                        animationDuration={300}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex justify-center items-center text-sm text-gray-500 dark:text-gray-400">
                    No recent data available
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div> 
        </motion.div>
      </main>
    </div>
  );
}
