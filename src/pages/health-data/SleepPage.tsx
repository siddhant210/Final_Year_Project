// src/pages/SleepPage.tsx
import { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
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
import supabase from '../../supabaseClient';

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

type SleepRecord = {
  id: number;
  created_at: string;
  value: string;
  duration: string;
};

type SleepSummary = {
  date: string;
  totalSleep: number;
  deepSleep: number;
  remSleep: number;
  coreSleep: number;
  awakeTime: number;
  efficiency: number;
};

export default function SleepPage() {
  const [sleepData, setSleepData] = useState<SleepRecord[]>([]);
  const [sleepSummary, setSleepSummary] = useState<SleepSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('7d');
  const [doctorAnalysis, setDoctorAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchSleepData();
  }, [timeRange]);

  const fetchSleepData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selection
      let fromDate = new Date();
      switch (timeRange) {
        case '7d':
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case '30d':
          fromDate.setDate(fromDate.getDate() - 30);
          break;
        case '90d':
          fromDate.setDate(fromDate.getDate() - 90);
          break;
        case 'all':
          fromDate = new Date(0); // Unix epoch
          break;
      }

      let query = supabase
        .from('sleep_data')
        .select('id, created_at, value, duration')
        .order('created_at', { ascending: true });

      if (timeRange !== 'all') {
        query = query.gte('created_at', fromDate.toISOString());
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setSleepData(data || []);
      processSleepData(data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sleep data');
      setLoading(false);
    }
  };

  const analyzeWithGemini = async () => {
    setIsAnalyzing(true);
    setDoctorAnalysis(null);
  
    try {
      const dataSummary = `
      Sleep Data Analysis:
      - Average total sleep: ${averageTotalSleep ? (averageTotalSleep / 60).toFixed(1) : 'N/A'} hours
      - Average deep sleep: ${averageDeepSleep ? averageDeepSleep.toFixed(1) : 'N/A'} minutes
      - Average REM sleep: ${averageREMSleep ? averageREMSleep.toFixed(1) : 'N/A'} minutes
      - Average efficiency: ${averageEfficiency ? averageEfficiency.toFixed(1) : 'N/A'}%
      - Latest sleep efficiency: ${latestSleep ? (latestSleep.efficiency * 100).toFixed(1) : 'N/A'}%
      `;
  
      // ✅ Fix: Use import.meta.env
      const response = await fetch(import.meta.env.VITE_GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `As a sleep specialist, provide a concise analysis of this patient's sleep data:
  
                  ${dataSummary}
  
                  Provide:
                  1. A brief overall assessment (2-3 sentences)
                  2. 3 specific recommendations for improvement
                  3. 1 positive aspect to continue
  
                  Format your response clearly with these headings:
                  **Assessment**
                  **Recommendations**
                  **Positive Aspect**`,
                },
              ],
            },
          ],
        }),
      });
  
      const data = await response.json();
      setDoctorAnalysis(data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.');
    } catch (err) {
      setError('Failed to get analysis. Please try again.');
      console.error('Gemini API error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  

  const processSleepData = (data: SleepRecord[]) => {
    // Group by date and calculate summary statistics
    const groupedData: Record<string, SleepSummary> = {};
    
    data.forEach(record => {
      const date = new Date(record.created_at).toISOString().split('T')[0];
      const durationMinutes = convertDurationToMinutes(record.duration);
      
      if (!groupedData[date]) {
        groupedData[date] = {
          date,
          totalSleep: 0,
          deepSleep: 0,
          remSleep: 0,
          coreSleep: 0,
          awakeTime: 0,
          efficiency: 0
        };
      }
      
      switch (record.value) {
        case 'Deep':
          groupedData[date].deepSleep += durationMinutes;
          groupedData[date].totalSleep += durationMinutes;
          break;
        case 'REM':
          groupedData[date].remSleep += durationMinutes;
          groupedData[date].totalSleep += durationMinutes;
          break;
        case 'Core':
          groupedData[date].coreSleep += durationMinutes;
          groupedData[date].totalSleep += durationMinutes;
          break;
        case 'Awake':
          groupedData[date].awakeTime += durationMinutes;
          break;
      }
    });
    
    // Calculate efficiency for each day
    Object.keys(groupedData).forEach(date => {
      const day = groupedData[date];
      const timeInBed = day.totalSleep + day.awakeTime;
      day.efficiency = timeInBed > 0 ? day.totalSleep / timeInBed : 0;
    });
    
    setSleepSummary(Object.values(groupedData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const convertDurationToMinutes = (duration: string): number => {
    const [hours, minutes, seconds] = duration.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  };

  // Prepare chart data for sleep stages
  const sleepStageChartData = {
    labels: sleepSummary.map(item => item.date),
    datasets: [
      {
        label: 'Deep Sleep',
        data: sleepSummary.map(item => item.deepSleep),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        stack: 'stack_1',
      },
      {
        label: 'REM Sleep',
        data: sleepSummary.map(item => item.remSleep),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        stack: 'stack_1',
      },
      {
        label: 'Core Sleep',
        data: sleepSummary.map(item => item.coreSleep),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        stack: 'stack_1',
      },
      {
        label: 'Awake',
        data: sleepSummary.map(item => item.awakeTime),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        stack: 'stack_1',
      }
    ]
  };

  // Prepare chart data for sleep efficiency
  const efficiencyChartData = {
    labels: sleepSummary.map(item => item.date),
    datasets: [
      {
        label: 'Sleep Efficiency',
        data: sleepSummary.map(item => item.efficiency * 100),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointRadius: 3,
        borderWidth: 2,
      }
    ]
  };

  const sleepStageChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Minutes'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw} minutes`;
          }
        }
      }
    }
  };

  const efficiencyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Efficiency (%)'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
          }
        }
      }
    }
  };

   // Calculate statistics
   const averageTotalSleep = sleepSummary.length > 0 
   ? sleepSummary.reduce((sum, item) => sum + item.totalSleep, 0) / sleepSummary.length
   : null;

 const averageDeepSleep = sleepSummary.length > 0 
   ? sleepSummary.reduce((sum, item) => sum + item.deepSleep, 0) / sleepSummary.length
   : null;

 const averageREMSleep = sleepSummary.length > 0 
   ? sleepSummary.reduce((sum, item) => sum + item.remSleep, 0) / sleepSummary.length
   : null;

 const averageEfficiency = sleepSummary.length > 0 
   ? (sleepSummary.reduce((sum, item) => sum + item.efficiency, 0) / sleepSummary.length) * 100
   : null;

  const latestSleep = sleepSummary.length > 0 ? sleepSummary[sleepSummary.length - 1] : null;

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
        <p>Error loading sleep data:</p>
        <p className="font-medium">{error}</p>
        <button onClick={fetchSleepData} className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sleep Analysis</h1>
      
      {/* Time range selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['7d', '30d', '90d', 'all'] as const).map((range) => (
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
             range === '30d' ? 'Last 30 Days' : 
             range === '90d' ? 'Last 90 Days' : 
             'All Data'}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Last Night" 
          value={latestSleep ? `${Math.floor(latestSleep.totalSleep / 60)}h ${Math.round(latestSleep.totalSleep % 60)}m` : '--'} 
          icon="🌙"
        />
        <StatCard 
          title="Avg Sleep" 
          value={averageTotalSleep ? `${Math.floor(averageTotalSleep / 60)}h ${Math.round(averageTotalSleep % 60)}m` : '--'} 
          icon="⏱️"
        />
        <StatCard 
          title="Avg Deep" 
          value={averageDeepSleep ? `${Math.round(averageDeepSleep)}m` : '--'} 
          icon="💤"
        />
        <StatCard 
          title="Avg Efficiency" 
          value={averageEfficiency ? `${averageEfficiency.toFixed(1)}%` : '--'} 
          icon="📈"
        />
      </div>

      {/* Sleep stage composition chart */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sleep Stage Composition</h2>
        <div className="h-80">
          <Bar data={sleepStageChartData} options={sleepStageChartOptions} />
        </div>
      </div>

      {/* Sleep efficiency chart */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sleep Efficiency</h2>
        <div className="h-80">
          <Line data={efficiencyChartData} options={efficiencyChartOptions} />
        </div>
      </div>

      {/* Gemini Analysis Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={analyzeWithGemini}
          disabled={isAnalyzing || sleepSummary.length === 0}
          className={`px-4 py-2 rounded-md text-white ${
            isAnalyzing || sleepSummary.length === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Get Professional Sleep Analysis'}
        </button>
      </div>

      {/* Doctor's Analysis Results */}
      {doctorAnalysis && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Doctor's Analysis</h2>
          <div className="whitespace-pre-wrap">{doctorAnalysis}</div>
        </div>
      )}

      {/* Data table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 border-b">Sleep Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sleep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  REM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sleepSummary.slice().reverse().map((record) => (
                <tr key={record.date}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {Math.floor(record.totalSleep / 60)}h {Math.round(record.totalSleep % 60)}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(record.deepSleep)}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(record.remSleep)}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full ${
                      record.efficiency * 100 > 85 ? 'bg-green-100 text-green-800' : 
                      record.efficiency * 100 > 70 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {(record.efficiency * 100).toFixed(1)}%
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

// Stat card component
function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}