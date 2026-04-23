import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  HeartPulse, 
  Moon, 
  Droplet, 
  Activity, 
  Thermometer, 
  Scale,
  ArrowRight
} from 'lucide-react';

const MonitoringDashboard = () => {
  const healthMetrics = [
    {
      id: 'heart-rate',
      title: 'Heart Rate',
      icon: <HeartPulse className="w-8 h-8 text-red-500" />,
      description: 'Track your heart rate trends over time',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      link: '/monitoring/heart-rate'
    },
    {
      id: 'sleep',
      title: 'Sleep Tracking',
      icon: <Moon className="w-8 h-8 text-indigo-500" />,
      description: 'Analyze your sleep patterns and quality',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      link: '/monitoring/sleep'
    },
    {
      id: 'blood-oxygen',
      title: 'Blood Oxygen',
      icon: <Droplet className="w-8 h-8 text-blue-500" />,
      description: 'Monitor your SpO2 levels',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      link: '/monitoring/blood-oxygen'
    },
    {
      id: 'activity',
      title: 'Activity',
      icon: <Activity className="w-8 h-8 text-green-500" />,
      description: 'View your daily activity metrics',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      link: '/monitoring/exercise'
    },
    {
      id: 'temperature',
      title: 'Body Temperature',
      icon: <Thermometer className="w-8 h-8 text-orange-500" />,
      description: 'Track your body temperature trends',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      link: '/monitoring/temperature'
    },
    {
      id: 'weight',
      title: 'Weight',
      icon: <Scale className="w-8 h-8 text-purple-500" />,
      description: 'Monitor your weight changes over time',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      link: '/monitoring/weight'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track and visualize your health metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {healthMetrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Link to={metric.link}>
                <div className={`${metric.bgColor} p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-4">
                        {metric.icon}
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {metric.title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        {metric.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 mt-1" />
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Last reading: 2h ago
                    </span>
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      View details
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;