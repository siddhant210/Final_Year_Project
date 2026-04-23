import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import useAuth from "../../hooks/useAuth";
import { 
  Loader2, 
  User, 
  HeartPulse, 
  Ruler, 
  Scale, 
  Droplets, 
  Activity, 
  Pill, 
  Utensils,
  Dumbbell,
  Target,
  Edit
} from "lucide-react";
import { motion } from "framer-motion";

const Profile = () => {
  const { session, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'lifestyle'>('overview');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const userId = session?.user?.id;

        if (!userId) {
          console.error("Error: User ID not found.");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) throw error;

        setUserData(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        if (error.code === 'PGRST116') {
          navigate("/profile-setup");
        }
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchUserProfile();
  }, [session, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No profile data found.</p>
          <button 
            onClick={() => navigate("/profile-setup")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Setup Your Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {userData.name || "User"}!
            </h1>
            <p className="text-blue-100 mt-2">
              Here's your personalized health profile
            </p>
          </div>
          <button 
            onClick={() => navigate("/profile-setup")}
            className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'overview' ? 'bg-white shadow' : ''}`}
          >
            <User className="h-4 w-4 mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'health' ? 'bg-white shadow' : ''}`}
          >
            <HeartPulse className="h-4 w-4 mr-2" />
            Health
          </button>
          <button
            onClick={() => setActiveTab('lifestyle')}
            className={`px-4 py-2 rounded-md flex items-center ${activeTab === 'lifestyle' ? 'bg-white shadow' : ''}`}
          >
            <Target className="h-4 w-4 mr-2" />
            Lifestyle
          </button>
        </div>

        {/* Profile Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="bg-blue-100 p-4">
              <h2 className="text-xl font-semibold text-blue-800 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <ProfileField 
                label="Email" 
                value={userData.email} 
                icon={<span className="text-gray-400">@</span>}
              />
              <ProfileField 
                label="Age" 
                value={userData.age} 
                icon={<span className="text-gray-400">🎂</span>}
              />
              <ProfileField 
                label="Gender" 
                value={userData.gender} 
                icon={<span className="text-gray-400">👤</span>}
              />
              <ProfileField 
                label="Phone" 
                value={userData.phone} 
                icon={<span className="text-gray-400">📱</span>}
              />
            </div>
          </motion.div>

          {/* Health Card - Only shown on overview or health tab */}
          {(activeTab === 'overview' || activeTab === 'health') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-red-100 p-4">
                <h2 className="text-xl font-semibold text-red-800 flex items-center">
                  <HeartPulse className="h-5 w-5 mr-2" />
                  Health Metrics
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <ProfileField 
                  label="Height" 
                  value={userData.height ? `${userData.height} cm` : null} 
                  icon={<Ruler className="h-4 w-4 text-gray-400" />}
                />
                <ProfileField 
                  label="Weight" 
                  value={userData.weight ? `${userData.weight} kg` : null} 
                  icon={<Scale className="h-4 w-4 text-gray-400" />}
                />
                <ProfileField 
                  label="Blood Pressure" 
                  value={userData.bloodPressure} 
                  icon={<Droplets className="h-4 w-4 text-gray-400" />}
                />
                <ProfileField 
                  label="Heart Rate" 
                  value={userData.heartRate ? `${userData.heartRate} bpm` : null} 
                  icon={<Activity className="h-4 w-4 text-gray-400" />}
                />
              </div>
            </motion.div>
          )}

          {/* Conditions Card - Only shown on health tab */}
          {activeTab === 'health' && userData.conditions?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-purple-100 p-4">
                <h2 className="text-xl font-semibold text-purple-800 flex items-center">
                  <Pill className="h-5 w-5 mr-2" />
                  Health Conditions
                </h2>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {userData.conditions.map((condition: string) => (
                    <span 
                      key={condition} 
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      <Pill className="h-3 w-3 mr-1" />
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Lifestyle Card - Only shown on overview or lifestyle tab */}
          {(activeTab === 'overview' || activeTab === 'lifestyle') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="bg-green-100 p-4">
                <h2 className="text-xl font-semibold text-green-800 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Lifestyle Preferences
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {userData.dietaryRestrictions?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 flex items-center mb-2">
                      <Utensils className="h-4 w-4 mr-2 text-gray-500" />
                      Dietary Restrictions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.dietaryRestrictions.map((item: string) => (
                        <span key={item} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {userData.exercisePreference?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 flex items-center mb-2">
                      <Dumbbell className="h-4 w-4 mr-2 text-gray-500" />
                      Exercise Preferences
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.exercisePreference.map((item: string) => (
                        <span key={item} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {userData.healthGoals?.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 flex items-center mb-2">
                      <Target className="h-4 w-4 mr-2 text-gray-500" />
                      Health Goals
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {userData.healthGoals.map((item: string) => (
                        <span key={item} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileField = ({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: any;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 h-5 w-5 mr-3 mt-0.5">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-gray-900">
        {value || <span className="text-gray-400">Not provided</span>}
      </p>
    </div>
  </div>
);

export default Profile;