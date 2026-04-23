import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  Loader2, Activity, Flame, Heart, Calendar, Clock, 
  TrendingUp, Filter, BarChart as BarChartIcon, RefreshCw, Zap,
  Dumbbell, Gauge, Target, Award, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, isValid } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const Exercise = () => {
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedMetric, setSelectedMetric] = useState('calories');
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState([]);
  const [analysis, setAnalysis] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/workout.csv');
        const data = await response.text();
        parseCSV(data);
      } catch (error) {
        console.error('Error fetching the CSV file:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (workouts.length > 0) {
      prepareChartData();
      applyFilters();
      generateAnalysis();
    }
  }, [workouts, selectedType, timeRange]);

  const cleanWorkoutType = (type) => {
    if (!type) return '';
    // Remove HKWorkoutActivityType prefix if present
    return type.replace(/^HKWorkoutActivityType/, '').replace(/([A-Z])/g, ' $1').trim();
  };

  const parseCSV = (data) => {
    Papa.parse(data, {
      header: true,
      complete: (results) => {
        const processedData = results.data
          .map(workout => {
            // Safely parse the date
            const date = workout.creationDate ? new Date(workout.creationDate) : null;
            
            return {
              ...workout,
              workoutActivityType: cleanWorkoutType(workout.workoutActivityType),
              duration: parseFloat(workout.duration) || 0,
              averageMET: parseFloat(workout.averageMET) || 0,
              ActiveEnergyBurned: parseFloat(workout.ActiveEnergyBurned) || 0,
              HeartRateAverage: parseFloat(workout.HeartRateAverage) || 0,
              date: isValid(date) ? date : null
            };
          })
          .filter(workout => workout.date !== null); // Filter out invalid dates

        setWorkouts(processedData);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setLoading(false);
      }
    });
  };

  const generateAnalysis = () => {
    if (workouts.length === 0) return;
    
    // Calculate averages and totals
    const totalWorkouts = workouts.length;
    const totalCalories = workouts.reduce((acc, curr) => acc + curr.ActiveEnergyBurned, 0);
    const avgCalories = totalCalories / totalWorkouts;
    const avgHeartRate = workouts.reduce((acc, curr) => acc + curr.HeartRateAverage, 0) / totalWorkouts;
    const avgDuration = workouts.reduce((acc, curr) => acc + curr.duration, 0) / totalWorkouts;
    
    // Get activity distribution
    const activityCounts = {};
    workouts.forEach(workout => {
      activityCounts[workout.workoutActivityType] = (activityCounts[workout.workoutActivityType] || 0) + 1;
    });
    
    const mostCommonActivity = Object.keys(activityCounts).reduce((a, b) => 
      activityCounts[a] > activityCounts[b] ? a : b
    );
    
    // Get intensity metrics
    const highIntensityWorkouts = workouts.filter(w => w.averageMET > 6).length;
    const moderateIntensityWorkouts = workouts.filter(w => w.averageMET > 3 && w.averageMET <= 6).length;
    const lowIntensityWorkouts = workouts.filter(w => w.averageMET <= 3).length;
    
    // Generate analysis text
    const analysisText = `
      <h3 class="text-lg font-semibold mb-2">Workout Analysis</h3>
      <p class="mb-2">Based on your ${totalWorkouts} recorded workouts, you're maintaining a good fitness routine. Here's my professional assessment:</p>
      
      <h4 class="font-medium mt-3 mb-1">Current Strengths:</h4>
      <ul class="list-disc pl-5 mb-3">
        <li>Your most frequent activity is <strong>${mostCommonActivity}</strong>, which is excellent for ${getActivityBenefits(mostCommonActivity)}</li>
        <li>Average workout duration of <strong>${avgDuration.toFixed(0)} minutes</strong> shows good commitment</li>
        <li>Heart rate average of <strong>${avgHeartRate.toFixed(0)} bpm</strong> indicates appropriate intensity levels</li>
      </ul>
      
      <h4 class="font-medium mt-3 mb-1">Recommendations:</h4>
      <ul class="list-disc pl-5 mb-3">
        ${getRecommendations(activityCounts, avgCalories, avgDuration, highIntensityWorkouts, moderateIntensityWorkouts, lowIntensityWorkouts)}
      </ul>
      
      <h4 class="font-medium mt-3 mb-1">Intensity Distribution:</h4>
      <p class="mb-1">High Intensity: ${highIntensityWorkouts} workouts</p>
      <p class="mb-1">Moderate Intensity: ${moderateIntensityWorkouts} workouts</p>
      <p class="mb-1">Low Intensity: ${lowIntensityWorkouts} workouts</p>
      <p class="mt-2">${getIntensityFeedback(highIntensityWorkouts, moderateIntensityWorkouts, lowIntensityWorkouts)}</p>
    `;
    
    setAnalysis(analysisText);
  };

  const getActivityBenefits = (activity) => {
    switch (activity.toLowerCase()) {
      case 'running': return 'cardiovascular health and endurance';
      case 'cycling': return 'leg strength and low-impact cardio';
      case 'swimming': return 'full-body workout and joint health';
      case 'walking': return 'sustainable daily activity and mental health';
      case 'yoga': return 'flexibility, balance, and stress reduction';
      case 'strength training': return 'muscle building and metabolic health';
      default: return 'maintaining overall fitness';
    }
  };

  const getRecommendations = (activityCounts, avgCalories, avgDuration, highIntensity, moderateIntensity, lowIntensity) => {
    const recommendations = [];
    const activities = Object.keys(activityCounts);
    
    // Check for variety
    if (activities.length < 3) {
      recommendations.push(
        'Try adding more variety to your workouts. Consider incorporating ' +
        (activities.includes('Running') ? 'strength training' : 'running') + 
        ' or ' + (activities.includes('Yoga') ? 'swimming' : 'yoga') + 
        ' to work different muscle groups.'
      );
    }
    
    // Check intensity balance
    if (highIntensity < moderateIntensity) {
      recommendations.push(
        'You might benefit from adding 1-2 high intensity interval training (HIIT) sessions per week ' +
        'to boost your metabolism and cardiovascular capacity.'
      );
    }
    
    // Check duration for cardio
    if (activities.some(a => ['Running', 'Cycling', 'Swimming'].includes(a))) {
      if (avgDuration < 30) {
        recommendations.push(
          'Try extending your cardio sessions to 45-60 minutes occasionally ' +
          'to build endurance and increase calorie burn.'
        );
      }
    }
    
    // Check for strength training
    if (!activities.some(a => ['Strength Training', 'Weight Lifting'].includes(a))) {
      recommendations.push(
        'Consider adding 2 strength training sessions per week to build muscle mass, ' +
        'which improves metabolism and prevents age-related muscle loss.'
      );
    }
    
    // Check for recovery
    if (lowIntensity < 1 && activities.length > 2) {
      recommendations.push(
        'Add at least one low-intensity recovery workout (like yoga or walking) per week ' +
        'to allow your body to recover while staying active.'
      );
    }
    
    return recommendations.map(rec => `<li>${rec}</li>`).join('');
  };

  const getIntensityFeedback = (high, moderate, low) => {
    const total = high + moderate + low;
    if (total === 0) return '';
    
    const highPercent = (high / total) * 100;
    const moderatePercent = (moderate / total) * 100;
    const lowPercent = (low / total) * 100;
    
    if (highPercent > 50) {
      return 'Your workout intensity is heavily skewed toward high intensity. Make sure you\'re allowing adequate recovery time between sessions.';
    } else if (moderatePercent > 60) {
      return 'Good balance of moderate intensity workouts. This is great for sustainable fitness.';
    } else if (lowPercent > 50) {
      return 'You have many low intensity workouts. Consider challenging yourself with higher intensity sessions 2-3 times per week.';
    } else {
      return 'Your intensity distribution shows a good mix. Keep varying your workout intensity for optimal results.';
    }
  };

  const applyFilters = () => {
    let filtered = [...workouts];
    
    // Apply time filter
    const days = parseInt(timeRange.replace('d', ''));
    const cutoffDate = subDays(new Date(), days);
    filtered = filtered.filter(workout => workout.date && workout.date >= cutoffDate);
    
    // Apply type filter
    if (selectedType !== 'All') {
      filtered = filtered.filter(workout => workout.workoutActivityType === selectedType);
    }
    
    setFilteredWorkouts(filtered.slice(0, 6));
  };

  const prepareChartData = () => {
    const days = parseInt(timeRange.replace('d', ''));
    const groupedData = {};
    
    // Initialize with empty values for each day
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'MMM dd');
      groupedData[dateKey] = {
        date: dateKey,
        calories: 0,
        heartRate: 0,
        duration: 0,
        met: 0,
        count: 0
      };
    }
    
    // Aggregate workout data - only process valid dates
    workouts.forEach(workout => {
      if (workout.date && isValid(workout.date)) {
        const workoutDate = format(workout.date, 'MMM dd');
        if (groupedData[workoutDate]) {
          groupedData[workoutDate].calories += workout.ActiveEnergyBurned;
          groupedData[workoutDate].heartRate += workout.HeartRateAverage;
          groupedData[workoutDate].duration += workout.duration;
          groupedData[workoutDate].met += workout.averageMET;
          groupedData[workoutDate].count++;
        }
      }
    });
    
    // Calculate averages
    const data = Object.values(groupedData).map(day => ({
      ...day,
      heartRate: day.count > 0 ? Math.round(day.heartRate / day.count) : 0,
      met: day.count > 0 ? (day.met / day.count).toFixed(1) : 0
    }));
    
    setChartData(data);
  };

  const workoutTypes = Array.from(new Set(workouts.map(workout => workout.workoutActivityType))).filter(Boolean);

  const getMetricColor = (metric) => {
    switch (metric) {
      case 'calories': return '#ef4444';
      case 'heartRate': return '#ec4899';
      case 'duration': return '#3b82f6';
      case 'met': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const calculateAverages = () => {
    if (filteredWorkouts.length === 0) return { 
      avgCalories: 0, 
      avgHeartRate: 0, 
      avgDuration: 0,
      totalCalories: 0,
      totalDuration: 0
    };
    
    return {
      avgCalories: Math.round(filteredWorkouts.reduce((acc, curr) => acc + curr.ActiveEnergyBurned, 0) / filteredWorkouts.length),
      avgHeartRate: Math.round(filteredWorkouts.reduce((acc, curr) => acc + curr.HeartRateAverage, 0) / filteredWorkouts.length),
      avgDuration: Math.round(filteredWorkouts.reduce((acc, curr) => acc + curr.duration, 0) / filteredWorkouts.length),
      totalCalories: Math.round(filteredWorkouts.reduce((acc, curr) => acc + curr.ActiveEnergyBurned, 0)),
      totalDuration: Math.round(filteredWorkouts.reduce((acc, curr) => acc + curr.duration, 0))
    };
  };

  const averages = calculateAverages();

  const activityDistribution = workoutTypes.map(type => {
    const typeWorkouts = workouts.filter(w => w.workoutActivityType === type);
    const totalDuration = typeWorkouts.reduce((acc, curr) => acc + curr.duration, 0);
    return {
      name: type,
      value: totalDuration
    };
  }).filter(activity => activity.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Exercise Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Track and analyze your workout performance
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none appearance-none"
              >
                <option value="All">All Activities</option>
                {workoutTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 outline-none appearance-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="14d">Last 14 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Workouts</p>
                    <h3 className="text-2xl font-bold mt-1">{filteredWorkouts.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Activity className="text-blue-500" size={20} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <span>View all</span>
                  <ChevronRight className="ml-1" size={16} />
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Calories Burned</p>
                    <h3 className="text-2xl font-bold mt-1">{averages.totalCalories} kcal</h3>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Flame className="text-red-500" size={20} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-green-500">↑</span> Avg: {averages.avgCalories} kcal/workout
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Duration</p>
                    <h3 className="text-2xl font-bold mt-1">{averages.totalDuration} min</h3>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Clock className="text-purple-500" size={20} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-green-500">↑</span> Avg: {averages.avgDuration} min/workout
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Heart Rate</p>
                    <h3 className="text-2xl font-bold mt-1">{averages.avgHeartRate} bpm</h3>
                  </div>
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                    <Heart className="text-pink-500" size={20} />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="text-green-500">↑</span> Optimal zone: 120-150 bpm
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Trainer Analysis */}
            {analysis && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.45 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Zap className="mr-2 text-yellow-500" size={20} />
                    Trainer's Analysis
                  </h2>
                </div>
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: analysis }}
                />
              </motion.div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Activity Trend */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center">
                    <TrendingUp className="mr-2 text-blue-500" size={20} />
                    Activity Trends
                  </h2>
                  <div className="flex space-x-2">
                    {['calories', 'heartRate', 'duration'].map((metric) => (
                      <button
                        key={metric}
                        onClick={() => setSelectedMetric(metric)}
                        className={`px-3 py-1 rounded-lg text-xs ${
                          selectedMetric === metric
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {metric === 'calories' ? 'Calories' : 
                         metric === 'heartRate' ? 'Heart Rate' : 'Duration'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={getMetricColor(selectedMetric)} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={getMetricColor(selectedMetric)} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" strokeOpacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          border: 'none',
                          backdropFilter: 'blur(4px)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke={getMetricColor(selectedMetric)}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorMetric)"
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Activity Distribution */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <h2 className="text-lg font-semibold flex items-center mb-6">
                  <PieChart className="mr-2 text-green-500" size={20} />
                  Activity Distribution
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {activityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} minutes`, 'Duration']}
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          border: 'none',
                          backdropFilter: 'blur(4px)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Recent Workouts */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.7 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center">
                  <Dumbbell className="mr-2 text-orange-500" size={20} />
                  Recent Workouts
                </h2>
                <button className="text-sm text-blue-600 dark:text-blue-400 flex items-center">
                  View all <ChevronRight className="ml-1" size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredWorkouts.map((workout, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 relative overflow-hidden group hover:shadow-md transition-all"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-bl-full transform group-hover:scale-150 transition-transform" />
                      
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {workout.workoutActivityType}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                          {workout.duration} min
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {workout.date ? format(workout.date, 'MMM dd, yyyy') : 'Unknown date'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-gray-600/30 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Calories</p>
                          <p className="font-semibold text-red-500 dark:text-red-400 flex items-center">
                            <Flame className="w-4 h-4 mr-1" />
                            {workout.ActiveEnergyBurned} kcal
                          </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-600/30 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Heart Rate</p>
                          <p className="font-semibold text-pink-500 dark:text-pink-400 flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {workout.HeartRateAverage} bpm
                          </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-600/30 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Intensity</p>
                          <p className="font-semibold text-green-500 dark:text-green-400 flex items-center">
                            <Gauge className="w-4 h-4 mr-1" />
                            {workout.averageMET} MET
                          </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-600/30 p-2 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Effort</p>
                          <p className="font-semibold text-purple-500 dark:text-purple-400 flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {(workout.averageMET * workout.duration / 60).toFixed(1)} pts
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.8 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold flex items-center mb-6">
                <Award className="mr-2 text-yellow-500" size={20} />
                Performance Metrics
              </h2>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={90} data={[
                    { subject: 'Calories', A: averages.avgCalories / 20, fullMark: 5 },
                    { subject: 'Heart Rate', A: averages.avgHeartRate / 30, fullMark: 5 },
                    { subject: 'Duration', A: averages.avgDuration / 20, fullMark: 5 },
                    { subject: 'Frequency', A: filteredWorkouts.length / 2, fullMark: 5 },
                    { subject: 'Intensity', A: filteredWorkouts[0]?.averageMET / 2 || 0, fullMark: 5 },
                    { subject: 'Consistency', A: 3.5, fullMark: 5 }
                  ]}>
                    <PolarGrid gridType="circle" radialLines={false} />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                      name="Performance"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#3b82f6' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${(value * 20).toFixed(1)}`, 'Score']}
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: 'none',
                        backdropFilter: 'blur(4px)'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Exercise;