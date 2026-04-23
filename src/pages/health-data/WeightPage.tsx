// src/pages/WeightPage.tsx
import { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { FiPlus, FiTrendingUp, FiTrendingDown, FiRefreshCw, FiActivity } from 'react-icons/fi';
import { GiWeight } from 'react-icons/gi';
import { IoScaleOutline } from 'react-icons/io5';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

type WeightRecord = {
  id: number;
  date: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  notes?: string;
};

export default function WeightPage() {
  // Generate realistic fluctuating data between 75kg and 80kg
  const generateFluctuatingData = (): WeightRecord[] => {
    const startDate = new Date('2023-05-01');
    const data: WeightRecord[] = [];
    let currentWeight = 77.5; // Starting point
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i * 2); // Every 2 days
      
      // Simulate natural daily fluctuations (-0.5kg to +0.5kg)
      const dailyChange = (Math.random() * 1) - 0.5;
      currentWeight += dailyChange;
      
      // Keep within 75-80kg range
      currentWeight = Math.max(75, Math.min(80, currentWeight));
      
      // Simulate weekly pattern (often lighter mid-week)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 3 || dayOfWeek === 4) {
        currentWeight -= 0.3; // Slightly lighter mid-week
      }
      
      // Body composition with realistic correlations
      const bodyFat = 20 + (currentWeight - 77.5) * 0.8 + (Math.random() * 0.6 - 0.3);
      const muscleMass = 58 + (77.5 - currentWeight) * 0.3 + (Math.random() * 0.4 - 0.2);
      
      data.push({
        id: i + 1,
        date: date.toISOString().split('T')[0],
        weight: parseFloat(currentWeight.toFixed(1)),
        bodyFat: parseFloat(Math.max(19, Math.min(25, bodyFat)).toFixed(1)),
        muscleMass: parseFloat(Math.max(57, Math.min(62, muscleMass)).toFixed(1))
      });
    }
    
    return data;
  };

  const [weightData, setWeightData] = useState<WeightRecord[]>(generateFluctuatingData());
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<Omit<WeightRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    weight: 0,
    bodyFat: undefined,
    muscleMass: undefined,
    notes: ''
  });

  // Calculate statistics
  const latestWeight = weightData.length > 0 ? weightData[weightData.length - 1] : null;
  const startingWeight = weightData.length > 0 ? weightData[0] : null;
  const weightChange = latestWeight && startingWeight ? latestWeight.weight - startingWeight.weight : 0;
  const weeklyChange = weightData.length > 1 ? 
    (weightData[weightData.length - 1].weight - weightData[weightData.length - 2].weight) : 0;

  // Filter data based on time range
  const filteredData = weightData.filter(record => {
    if (timeRange === 'all') return true;
    
    const days = parseInt(timeRange.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return new Date(record.date) >= cutoffDate;
  });

  // Prepare chart data
  const weightChartData = {
    labels: filteredData.map(item => item.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: filteredData.map(item => item.weight),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        fill: true,
      }
    ]
  };

  const bodyCompositionChartData = {
    labels: filteredData.filter(item => item.bodyFat && item.muscleMass).map(item => item.date),
    datasets: [
      {
        label: 'Body Fat %',
        data: filteredData.filter(item => item.bodyFat).map(item => item.bodyFat),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Muscle Mass (kg)',
        data: filteredData.filter(item => item.muscleMass).map(item => item.muscleMass),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 4,
      }
    ]
  };

  const weightChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        min: 74,
        max: 81,
        title: {
          display: true,
          text: 'Weight (kg)',
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw.toFixed(1)} kg`;
          }
        }
      }
    }
  };

  const bodyCompositionChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Value',
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw.toFixed(1)}${context.dataset.label.includes('%') ? '%' : ' kg'}`;
          }
        }
      }
    }
  };

  const handleAddEntry = () => {
    if (newEntry.weight <= 0) return;
    
    const entryToAdd = {
      ...newEntry,
      id: weightData.length > 0 ? Math.max(...weightData.map(item => item.id)) + 1 : 1,
      date: newEntry.date || new Date().toISOString().split('T')[0],
      weight: parseFloat(newEntry.weight.toFixed(1)),
      bodyFat: newEntry.bodyFat ? parseFloat(newEntry.bodyFat.toFixed(1)) : undefined,
      muscleMass: newEntry.muscleMass ? parseFloat(newEntry.muscleMass.toFixed(1)) : undefined
    };
    
    setWeightData([...weightData, entryToAdd].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setIsAdding(false);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      weight: 0,
      bodyFat: undefined,
      muscleMass: undefined,
      notes: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weight Tracking</h1>
            <p className="text-gray-500 mt-2">Monitor your progress and body composition</p>
          </div>
          
          {/* Time range selector */}
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : 
                 range === '30d' ? 'Last 30 Days' : 
                 range === '90d' ? 'Last 90 Days' : 
                 'All Data'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Current Weight" 
            value={latestWeight ? `${latestWeight.weight.toFixed(1)} kg` : '--'} 
            icon={<IoScaleOutline className="text-blue-500" size={24} />}
            description={latestWeight ? `as of ${new Date(latestWeight.date).toLocaleDateString()}` : 'No data'}
            color="bg-blue-50"
          />
          <StatCard 
            title="Total Change" 
            value={weightChange !== 0 ? `${Math.abs(weightChange).toFixed(1)} kg ${weightChange > 0 ? 'gain' : 'loss'}` : 'No change'} 
            icon={weightChange > 0 ? 
              <FiTrendingUp className="text-red-500" size={24} /> : 
              <FiTrendingDown className="text-green-500" size={24} />}
            description={startingWeight ? `from ${startingWeight.weight.toFixed(1)} kg` : ''}
            color={weightChange > 0 ? 'bg-red-50' : 'bg-green-50'}
          />
          <StatCard 
            title="Weekly Change" 
            value={weeklyChange !== 0 ? `${Math.abs(weeklyChange).toFixed(1)} kg ${weeklyChange > 0 ? 'gain' : 'loss'}` : 'No change'} 
            icon={<FiActivity className={weeklyChange > 0 ? 'text-red-500' : 'text-green-500'} size={24} />}
            description="Since last measurement"
            color={weeklyChange > 0 ? 'bg-red-50' : 'bg-green-50'}
          />
          <StatCard 
            title="Body Fat" 
            value={latestWeight?.bodyFat ? `${latestWeight.bodyFat.toFixed(1)}%` : '--'} 
            icon={<GiWeight className="text-purple-500" size={24} />}
            description={latestWeight?.muscleMass ? `Muscle: ${latestWeight.muscleMass.toFixed(1)} kg` : 'No composition data'}
            color="bg-purple-50"
          />
        </div>

        {/* Add New Entry Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Weight Entry
          </button>
        </div>

        {/* Add New Entry Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add New Weight Entry</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.weight || ''}
                    onChange={(e) => setNewEntry({...newEntry, weight: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter your weight"
                    min="30"
                    max="300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Fat % (optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.bodyFat || ''}
                    onChange={(e) => setNewEntry({...newEntry, bodyFat: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter body fat percentage"
                    min="5"
                    max="50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muscle Mass (kg, optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.muscleMass || ''}
                    onChange={(e) => setNewEntry({...newEntry, muscleMass: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter muscle mass"
                    min="20"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={newEntry.notes || ''}
                    onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Any additional notes"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEntry}
                  disabled={!newEntry.weight}
                  className={`px-4 py-2 rounded-md text-white ${
                    !newEntry.weight ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weight trend chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Weight Trend</h2>
              <div className="text-sm text-gray-500">Kilograms over time</div>
            </div>
            <div className="h-80">
              <Line data={weightChartData} options={weightChartOptions} />
            </div>
          </div>

          {/* Body composition chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Body Composition</h2>
              <div className="text-sm text-gray-500">Fat % vs Muscle Mass</div>
            </div>
            <div className="h-80">
              <Bar data={bodyCompositionChartData} options={bodyCompositionChartOptions} />
            </div>
          </div>
        </div>

        {/* Data table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Weight History</h2>
            <div className="text-sm text-gray-500">
              Showing {filteredData.length} {filteredData.length === 1 ? 'entry' : 'entries'}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Body Fat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Muscle Mass
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.slice().reverse().map((record, index, arr) => {
                  const prevWeight = index < arr.length - 1 ? arr[index + 1].weight : null;
                  const change = prevWeight ? record.weight - prevWeight : null;
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {record.weight.toFixed(1)} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {change !== null ? (
                          <span className={`inline-flex items-center ${
                            change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)} kg
                            {change > 0 ? (
                              <FiTrendingUp className="ml-1" />
                            ) : change < 0 ? (
                              <FiTrendingDown className="ml-1" />
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.bodyFat ? `${record.bodyFat.toFixed(1)}%` : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.muscleMass ? `${record.muscleMass.toFixed(1)} kg` : '--'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {record.notes || '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat card component
function StatCard({ title, value, icon, description, color }: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  description: string;
  color?: string;
}) {
  return (
    <div className={`${color || 'bg-white'} rounded-xl shadow-sm p-5 flex items-start`}>
      <div className="p-3 rounded-lg bg-white shadow-sm mr-4">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
}