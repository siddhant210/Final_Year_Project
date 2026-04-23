// src/pages/BloodOxygenPage.tsx
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import supabase from '../../supabaseClient';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

type BloodOxygenRecord = {
  id: number;
  created_at: string;
  value: number;
};

export default function BloodOxygenPage() {
  const [bloodOxygenData, setBloodOxygenData] = useState<BloodOxygenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [currentSpO2, setCurrentSpO2] = useState<number | null>(null);

  useEffect(() => {
    fetchBloodOxygenData();
  }, [timeRange]);

  const fetchBloodOxygenData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selection
      let fromDate = new Date();
      switch (timeRange) {
        case '24h':
          fromDate.setDate(fromDate.getDate() - 1);
          break;
        case '7d':
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case '30d':
          fromDate.setDate(fromDate.getDate() - 30);
          break;
        case 'all':
          fromDate = new Date(0); // Unix epoch
          break;
      }

      let query = supabase
        .from('blood_oxygen')
        .select('id, created_at, value')
        .order('created_at', { ascending: true });

      if (timeRange !== 'all') {
        query = query.gte('created_at', fromDate.toISOString());
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setBloodOxygenData(data || []);
      
      // Set current SpO2 to the most recent reading
      if (data && data.length > 0) {
        setCurrentSpO2(data[data.length - 1].value);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blood oxygen data');
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: bloodOxygenData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: 'Blood Oxygen (SpO2)',
        data: bloodOxygenData.map(item => item.value * 100), // Convert to percentage
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: timeRange === '24h' ? 'hour' : 'day',
          tooltipFormat: 'MMM d, yyyy h:mm a',
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        min: 80,
        max: 100,
        title: {
          display: true,
          text: 'SpO2 (%)'
        },
        ticks: {
          callback: (value: number) => `${value}%`
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw}%`;
          }
        }
      }
    }
  };

  // Calculate statistics
  const averageSpO2 = bloodOxygenData.length > 0 
    ? (bloodOxygenData.reduce((sum, item) => sum + item.value, 0) / bloodOxygenData.length) * 100
    : null;

  const maxSpO2 = bloodOxygenData.length > 0 
    ? Math.max(...bloodOxygenData.map(item => item.value * 100))
    : null;

  const minSpO2 = bloodOxygenData.length > 0 
    ? Math.min(...bloodOxygenData.map(item => item.value * 100))
    : null;

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
        <p>Error loading blood oxygen data:</p>
        <p className="font-medium">{error}</p>
        <button 
          onClick={fetchBloodOxygenData}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Blood Oxygen (SpO2) Monitoring</h1>
      
      {/* Time range selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['24h', '7d', '30d', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md transition-colors ${
              timeRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range === '24h' ? 'Last 24 Hours' : 
             range === '7d' ? 'Last 7 Days' : 
             range === '30d' ? 'Last 30 Days' : 
             'All Data'}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Current" 
          value={currentSpO2 ? `${Math.round(currentSpO2 * 100)}%` : '--'} 
          icon="❤️"
          status={currentSpO2 ? 
            (currentSpO2 >= 0.95 ? 'good' : 
             currentSpO2 >= 0.90 ? 'fair' : 'poor') : 'none'}
        />
        <StatCard 
          title="Average" 
          value={averageSpO2 ? `${averageSpO2.toFixed(1)}%` : '--'} 
          icon="📊"
          status={averageSpO2 ? 
            (averageSpO2 >= 95 ? 'good' : 
             averageSpO2 >= 90 ? 'fair' : 'poor') : 'none'}
        />
        <StatCard 
          title="Maximum" 
          value={maxSpO2 ? `${Math.round(maxSpO2)}%` : '--'} 
          icon="⬆️"
          status="good"
        />
        <StatCard 
          title="Minimum" 
          value={minSpO2 ? `${Math.round(minSpO2)}%` : '--'} 
          icon="⬇️"
          status={minSpO2 ? 
            (minSpO2 >= 95 ? 'good' : 
             minSpO2 >= 90 ? 'fair' : 'poor') : 'none'}
        />
      </div>

      {/* Data table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 border-b">Recent Measurements</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SpO2 Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bloodOxygenData.slice(-10).reverse().map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 py-1 rounded-full ${
                      record.value >= 0.95 ? 'bg-green-100 text-green-800' : 
                      record.value >= 0.90 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(record.value * 100)}%
                    </span>
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

// Enhanced Stat card component with status indicators
function StatCard({ title, value, icon, status }: { 
  title: string; 
  value: string; 
  icon: string;
  status: 'good' | 'fair' | 'poor' | 'none';
}) {
  const statusColors = {
    good: 'bg-green-100 text-green-800',
    fair: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-red-100 text-red-800',
    none: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
      <div className={`text-3xl mr-4 p-2 rounded-full ${statusColors[status]}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}