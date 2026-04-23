import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import useAuth from '../../hooks/useAuth';
import { Loader2, Utensils, Heart, Target, PlusCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

type DietPlan = {
  id: string;
  name: string;
  description: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  created_at: string;
  user_id: string;
};

type UserData = {
  dietaryRestrictions: string[];
  exercisePreference: string[];
  healthGoals: string[];
  conditions: string[];
  age: number | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
};

const DietRecommendations = () => {
  const { session } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [newPlanName, setNewPlanName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        
        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('dietaryRestrictions, exercisePreference, healthGoals, conditions, age, gender, weight, height')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;

        setUserData(userData);

        // Fetch saved diet plans
        const { data: plansData, error: plansError } = await supabase
          .from('diet_plans')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (plansError) throw plansError;

        setDietPlans(plansData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const generateDietPlan = async () => {
    if (!userData || !session?.user?.id) return;
  
    try {
      setGenerating(true);
      
      // Prepare prompt for Gemini API
      const prompt = `Create a detailed personalized diet plan based on the following information:
      
      User Profile:
      - Age: ${userData.age || 'Not specified'}
      - Gender: ${userData.gender || 'Not specified'}
      - Weight: ${userData.weight || 'Not specified'} kg
      - Height: ${userData.height || 'Not specified'} cm
      
      Health Factors:
      - Conditions: ${userData.conditions.join(', ') || 'None'}
      - Dietary Restrictions: ${userData.dietaryRestrictions.join(', ') || 'None'}
      - Exercise Preferences: ${userData.exercisePreference.join(', ') || 'None'}
      - Health Goals: ${userData.healthGoals.join(', ') || 'None'}
      
      Please provide:
      1. A name for this diet plan
      2. A brief description of its benefits
      3. Specific meal suggestions for breakfast, lunch, dinner, and snacks
      4. Any additional nutritional advice
      
      Format the response as a JSON object with these properties:
      {
        "name": "Plan Name",
        "description": "Plan description",
        "meals": {
          "breakfast": "...",
          "lunch": "...",
          "dinner": "...",
          "snacks": "..."
        },
        "advice": "..."
      }
  
      Return ONLY the JSON object without any additional text or markdown formatting.`;
  
      // Call Gemini API
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key is not configured');
  
      const response = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST', // 🔥 MOST IMPORTANT FIX
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 1,
              topK: 40,
              maxOutputTokens: 2048,
            }
          }),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate diet plan');
      }
  
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      try {
        // Clean the response by removing markdown formatting
        let cleanedResponse = textResponse;
        if (cleanedResponse.includes('```json')) {
          cleanedResponse = cleanedResponse.replace(/```json/g, '').replace(/```/g, '');
        }
        cleanedResponse = cleanedResponse.trim();
  
        const planData = JSON.parse(cleanedResponse);
        
        // Save to database
        const { data: savedPlan, error } = await supabase
          .from('diet_plans')
          .insert([{
            name: planData.name,
            description: planData.description,
            meals: planData.meals,
            additional_advice: planData.advice,
            user_id: session.user.id
          }])
          .select()
          .single();
  
        if (error) throw error;
  
        setDietPlans([savedPlan, ...dietPlans]);
        setSelectedPlan(savedPlan);
        setNewPlanName('');
        toast.success('Diet plan generated successfully!');
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.error('Original response:', textResponse);
        toast.error('Failed to parse diet plan response. Please try again.');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      toast.error(error.message || 'Failed to generate diet plan');
    } finally {
      setGenerating(false);
    }
  };

  const saveCustomPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !session?.user?.id) return;

    try {
      setGenerating(true);
      
      const { data, error } = await supabase
        .from('diet_plans')
        .insert([{
          name: newPlanName,
          description: 'Custom diet plan',
          meals: {
            breakfast: '',
            lunch: '',
            dinner: '',
            snacks: ''
          },
          user_id: session.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setDietPlans([data, ...dietPlans]);
      setSelectedPlan(data);
      setShowForm(false);
      setNewPlanName('');
      toast.success('Custom diet plan created!');
    } catch (error) {
      console.error('Error saving custom plan:', error);
      toast.error('Failed to save custom plan');
    } finally {
      setGenerating(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this diet plan?')) return;

    try {
      const { error } = await supabase
        .from('diet_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDietPlans(dietPlans.filter(plan => plan.id !== id));
      if (selectedPlan?.id === id) setSelectedPlan(null);
      toast.success('Diet plan deleted');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete diet plan');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Personalized Diet Recommendations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Based on your health profile and preferences
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Summary */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Your Health Profile
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400">Dietary Restrictions</h3>
                    <p className="dark:text-gray-300">
                      {userData?.dietaryRestrictions?.length ? (
                        <span className="flex flex-wrap gap-1 mt-1">
                          {userData.dietaryRestrictions.map((item, index) => (
                            <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
                              {item}
                            </span>
                          ))}
                        </span>
                      ) : 'None specified'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400">Exercise Preferences</h3>
                    <p className="dark:text-gray-300">
                      {userData?.exercisePreference?.length ? (
                        <span className="flex flex-wrap gap-1 mt-1">
                          {userData.exercisePreference.map((item, index) => (
                            <span key={index} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm">
                              {item}
                            </span>
                          ))}
                        </span>
                      ) : 'None specified'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400">Health Goals</h3>
                    <p className="dark:text-gray-300">
                      {userData?.healthGoals?.length ? (
                        <span className="flex flex-wrap gap-1 mt-1">
                          {userData.healthGoals.map((item, index) => (
                            <span key={index} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-sm">
                              {item}
                            </span>
                          ))}
                        </span>
                      ) : 'None specified'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500 dark:text-gray-400">Health Conditions</h3>
                    <p className="dark:text-gray-300">
                      {userData?.conditions?.length ? (
                        <span className="flex flex-wrap gap-1 mt-1">
                          {userData.conditions.map((item, index) => (
                            <span key={index} className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-sm">
                              {item}
                            </span>
                          ))}
                        </span>
                      ) : 'None specified'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-500" />
                  Actions
                </h2>
                
                <div className="space-y-3">
                  <button
                    onClick={generateDietPlan}
                    disabled={generating}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70 transition-opacity"
                  >
                    {generating ? (
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    ) : (
                      <Utensils className="h-5 w-5 mr-2" />
                    )}
                    Generate New Diet Plan
                  </button>

                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Custom Plan
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={saveCustomPlan} className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      placeholder="Enter custom plan name"
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      required
                    />
                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70 transition-opacity"
                    >
                      {generating ? (
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      ) : (
                        'Save Custom Plan'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Diet Plans List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center">
                  <Utensils className="h-5 w-5 mr-2 text-blue-500" />
                  Your Diet Plans
                </h2>
                
                {dietPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No diet plans yet. Generate one or create a custom plan.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dietPlans.map((plan) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'}`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold dark:text-white">{plan.name}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlan(plan.id);
                            }}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Plan Details */}
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                >
                  <h2 className="text-xl font-semibold mb-2 dark:text-white">{selectedPlan.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedPlan.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full p-1 mr-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        Breakfast
                      </h3>
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {selectedPlan.meals.breakfast || 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full p-1 mr-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        Lunch
                      </h3>
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {selectedPlan.meals.lunch || 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full p-1 mr-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        Dinner
                      </h3>
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {selectedPlan.meals.dinner || 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full p-1 mr-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                        Snacks
                      </h3>
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {selectedPlan.meals.snacks || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Advice */}
                  {(selectedPlan as any).additional_advice && (
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Additional Nutritional Advice
                      </h3>
                      <p className="text-blue-700 dark:text-blue-300 whitespace-pre-line">
                        {(selectedPlan as any).additional_advice}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DietRecommendations;