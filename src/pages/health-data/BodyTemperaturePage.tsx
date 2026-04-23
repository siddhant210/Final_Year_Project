// src/pages/WristTemperaturePage.tsx
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

type WristTempRecord = {
  id: number;
  created_at: string;
  value: number; // in Celsius
};

export default function WristTemperaturePage() {
  const [tempData, setTempData] = useState<WristTempRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('7d');

  useEffect(() => {
    fetchTempData();
  }, [timeRange]);

  const fetchTempData = async () => {
    try {
      setLoading(true);
      setError(null);

      let fromDate = new Date();
      switch (timeRange) {
        case '7d':
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case '14d':
          fromDate.setDate(fromDate.getDate() - 14);
          break;
        case '30d':
          fromDate.setDate(fromDate.getDate() - 30);
          break;
        case 'all':
          fromDate = new Date(0);
          break;
      }

      const { data, error: queryError } = await supabase
        .from('wrist_temperature')
        .select('id, created_at, value')
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: true });

      if (queryError) throw queryError;

      setTempData(data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch temperature data');
      setLoading(false);
    }
  };

  // Prepare chart data with wrist-specific ranges
  const chartData = {
    labels: tempData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: 'Wrist Temperature (°C)',
        data: tempData.map(item => item.value),
        borderColor: 'rgb(234, 88, 12)',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        tension: 0.4,
        pointRadius: 4,
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
        type: 'time',
        time: {
          unit: timeRange === '7d' ? 'day' : 'week',
          tooltipFormat: 'MMM d, yyyy h:mm a',
        },
        title: { display: true, text: 'Date' }
      },
      y: {
        min: 34,
        max: 37,
        title: { display: true, text: 'Temperature (°C)' },
        ticks: { callback: (value: number) => `${value}°C` }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw.toFixed(2)}°C`
        }
      }
    }
  };

  // Calculate statistics
  const latestTemp = tempData.length > 0 ? tempData[tempData.length - 1].value : null;
  const avgTemp = tempData.length > 0 
    ? tempData.reduce((sum, item) => sum + item.value, 0) / tempData.length 
    : null;
  const minTemp = tempData.length > 0 ? Math.min(...tempData.map(item => item.value)) : null;
  const maxTemp = tempData.length > 0 ? Math.max(...tempData.map(item => item.value)) : null;

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <p className="font-medium">Error: {error}</p>
      <button onClick={fetchTempData} className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
        Retry
      </button>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Wrist Temperature</h1>
      
      <div className="flex flex-wrap gap-2 mb-6">
        {(['7d', '14d', '30d', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md ${
              timeRange === range ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {range === '7d' ? 'Last 7 Days' : 
             range === '14d' ? 'Last 14 Days' : 
             range === '30d' ? 'Last 30 Days' : 'All Data'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Latest" 
          value={latestTemp ? `${latestTemp.toFixed(2)}°C` : '--'} 
          icon="🖐️"
          status={getWristTempStatus(latestTemp)}
        />
        <StatCard 
          title="Average" 
          value={avgTemp ? `${avgTemp.toFixed(2)}°C` : '--'} 
          icon="📊"
          status={getWristTempStatus(avgTemp)}
        />
        <StatCard 
          title="High" 
          value={maxTemp ? `${maxTemp.toFixed(2)}°C` : '--'} 
          icon="⬆️"
          status={getWristTempStatus(maxTemp)}
        />
        <StatCard 
          title="Low" 
          value={minTemp ? `${minTemp.toFixed(2)}°C` : '--'} 
          icon="⬇️"
          status={getWristTempStatus(minTemp)}
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 border-b">Recent Measurements</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tempData.slice().reverse().map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 py-1 rounded-full ${
                      getWristTempColor(record.value)
                    }`}>
                      {record.value.toFixed(2)}°C
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

// Wrist temperature specific status functions
function getWristTempStatus(temp: number | null): string {
  if (temp === null) return 'none';
  if (temp > 36.5) return 'high';
  if (temp < 35.0) return 'low';
  return 'normal';
}

function getWristTempColor(temp: number): string {
  if (temp > 36.5) return 'bg-red-100 text-red-800';
  if (temp < 35.0) return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}

function StatCard({ title, value, icon, status }: { 
  title: string; 
  value: string; 
  icon: string;
  status: string;
}) {
  const statusColors = {
    high: 'bg-red-100 text-red-800',
    normal: 'bg-green-100 text-green-800',
    low: 'bg-blue-100 text-blue-800',
    none: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
      <div className={`text-2xl mr-3 p-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}