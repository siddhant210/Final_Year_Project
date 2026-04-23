// src/pages/ActivitySummaryPage.tsx
import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import supabase from '../supabaseClient';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

type ActivityRecord = {
  date: string;
  ActiveEnergyBurned: number;
  ExerciseTime: number;
  StandHours: number;
};

// Mock data that matches your CSV
const MOCK_DATA: ActivityRecord[] = [
  { date: '2025-02-08', ActiveEnergyBurned: 725.61, ExerciseTime: 7, StandHours: 18 },
  { date: '2025-02-09', ActiveEnergyBurned: 343.506, ExerciseTime: 4, StandHours: 11 },
  { date: '2025-02-10', ActiveEnergyBurned: 1631.46, ExerciseTime: 136, StandHours: 12 },
  { date: '2025-02-11', ActiveEnergyBurned: 804.165, ExerciseTime: 71, StandHours: 14 },
  { date: '2025-02-12', ActiveEnergyBurned: 1228.51, ExerciseTime: 112, StandHours: 16 },
  { date: '2025-02-13', ActiveEnergyBurned: 753.236, ExerciseTime: 74, StandHours: 16 },
  { date: '2025-02-14', ActiveEnergyBurned: 758.023, ExerciseTime: 60, StandHours: 16 },
  { date: '2025-02-15', ActiveEnergyBurned: 1056.15, ExerciseTime: 76, StandHours: 14 },
  { date: '2025-02-16', ActiveEnergyBurned: 614.191, ExerciseTime: 48, StandHours: 16 },
  { date: '2025-02-17', ActiveEnergyBurned: 1298.3, ExerciseTime: 96, StandHours: 13 },
  { date: '2025-02-18', ActiveEnergyBurned: 913.297, ExerciseTime: 67, StandHours: 16 },
  { date: '2025-02-19', ActiveEnergyBurned: 992.136, ExerciseTime: 64, StandHours: 11 },
  { date: '2025-02-20', ActiveEnergyBurned: 837.213, ExerciseTime: 66, StandHours: 15 },
  { date: '2025-02-21', ActiveEnergyBurned: 892.344, ExerciseTime: 73, StandHours: 14 },
  { date: '2025-02-22', ActiveEnergyBurned: 483.427, ExerciseTime: 4, StandHours: 13 }
];

// Target goals (adjust as needed)
const TARGETS = {
  Energy: 1000, // kcal
  Exercise: 60, // minutes
  Stand: 12 // hours
};

export default function ActivitySummaryPage() {
  const [activityData, setActivityData] = useState<ActivityRecord[]>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(MOCK_DATA[0].date);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  useEffect(() => {
    // In a real app, you would fetch data here
    // fetchActivityData();
  }, [timeRange]);

  // Get filtered data based on time range
  const filteredData = activityData.slice(0, 
    timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30
  );

  // Get selected day's data
  const selectedDayData = filteredData.find(item => item.date === selectedDate) || {
    ActiveEnergyBurned: 0,
    ExerciseTime: 0,
    StandHours: 0
  };

  // Calculate averages
  const averages = {
    Energy: filteredData.reduce((sum, item) => sum + item.ActiveEnergyBurned, 0) / filteredData.length,
    Exercise: filteredData.reduce((sum, item) => sum + item.ExerciseTime, 0) / filteredData.length,
    Stand: filteredData.reduce((sum, item) => sum + item.StandHours, 0) / filteredData.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>Error loading activity data:</p>
        <p className="font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Activity Summary</h1>
      
      {/* Time range selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['7d', '14d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md transition-colors ${
              timeRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range === '7d' ? 'Last 7 Days' : 
             range === '14d' ? 'Last 14 Days' : 
             'Last 30 Days'}
          </button>
        ))}
      </div>

      {/* Date selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {filteredData.map((record) => (
            <option key={record.date} value={record.date}>
              {new Date(record.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </option>
          ))}
        </select>
      </div>

      {/* Activity Rings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ActivityRing 
          title="Energy Burned"
          value={selectedDayData.ActiveEnergyBurned}
          target={TARGETS.Energy}
          unit="kcal"
          color="red"
        />
        <ActivityRing 
          title="Exercise"
          value={selectedDayData.ExerciseTime}
          target={TARGETS.Exercise}
          unit="mins"
          color="blue"
        />
        <ActivityRing 
          title="Stand Hours"
          value={selectedDayData.StandHours}
          target={TARGETS.Stand}
          unit="hrs"
          color="yellow"
        />
      </div>

      {/* Averages */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Averages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Energy Burned"
            value={`${averages.Energy.toFixed(0)} kcal`}
            progress={Math.min(100, (averages.Energy / TARGETS.Energy) * 100)}
            color="red"
          />
          <StatCard 
            title="Exercise Time"
            value={`${averages.Exercise.toFixed(0)} mins`}
            progress={Math.min(100, (averages.Exercise / TARGETS.Exercise) * 100)}
            color="blue"
          />
          <StatCard 
            title="Stand Hours"
            value={`${averages.Stand.toFixed(1)} hrs`}
            progress={Math.min(100, (averages.Stand / TARGETS.Stand) * 100)}
            color="yellow"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 border-b">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Energy (kcal)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exercise (mins)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stand (hrs)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((record) => (
                <tr 
                  key={record.date} 
                  className={record.date === selectedDate ? 'bg-blue-50' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {new Date(record.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ProgressBar 
                      value={record.ActiveEnergyBurned} 
                      max={TARGETS.Energy} 
                      color="red" 
                      showValue
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ProgressBar 
                      value={record.ExerciseTime} 
                      max={TARGETS.Exercise} 
                      color="blue" 
                      showValue
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <ProgressBar 
                      value={record.StandHours} 
                      max={TARGETS.Stand} 
                      color="yellow" 
                      showValue
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Custom Activity Ring Component
function ActivityRing({ title, value, target, unit, color }: { 
  title: string; 
  value: number; 
  target: number; 
  unit: string;
  color: 'red' | 'blue' | 'yellow';
}) {
  const percentage = Math.min(100, (value / target) * 100);
  const colorClasses = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color === 'red' ? '#ef4444' : color === 'blue' ? '#3b82f6' : '#f59e0b'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 282.6} 282.6`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={`text-3xl font-bold ${colorClasses[color]}`}>
            {value.toFixed(0)}
          </span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        {percentage.toFixed(0)}% of {target} {unit} target
      </p>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({ value, max, color, showValue }: { 
  value: number; 
  max: number; 
  color: 'red' | 'blue' | 'yellow';
  showValue?: boolean;
}) {
  const percentage = Math.min(100, (value / max) * 100);
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className="flex items-center">
      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
        <div 
          className={`h-2.5 rounded-full ${colorClasses[color]}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showValue && (
        <span className="text-sm font-medium">
          {value.toFixed(0)}
        </span>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, progress, color }: { 
  title: string; 
  value: string; 
  progress: number;
  color: 'red' | 'blue' | 'yellow';
}) {
  const colorClasses = {
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold mb-2">{value}</p>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}