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

// ─── 10 diverse plans covering all onboarding combinations ───────────────────
const ALL_PLANS = [
  {
    tags: ['heart disease', 'hypertension', 'lower blood pressure', 'low-sodium', 'better sleep'],
    name: 'Heart-Healthy Low-Sodium Plan',
    description:
      'Designed for individuals with heart disease or hypertension, this plan minimises sodium and saturated fat while maximising potassium and fibre to support cardiovascular health.',
    meals: {
      breakfast:
        'Oats porridge with banana slices + 1 cup green tea (no sugar)\nOR Moong dal chilla (2 pcs) with mint-coriander chutney',
      lunch:
        '1 cup brown rice + arhar dal (low salt) + lauki sabzi + cucumber-tomato salad\nOR 2 jowar rotis + palak dal + raita (low fat)',
      dinner:
        '2 bajra rotis + mixed vegetable sabzi (no pickle) + 1 bowl vegetable soup\nOR Daliya khichdi + steamed broccoli + thin buttermilk',
      snacks:
        'Handful of unsalted walnuts + almonds\nOR 1 medium apple or pear\nOR Roasted chana (unsalted)',
    },
    advice:
      'Keep daily sodium under 1500 mg. Avoid processed foods, pickles, and papad. Sleep 7–8 hours and practice deep breathing for blood pressure control.',
  },
  {
    tags: ['type 2 diabetes', 'obesity', 'weight loss', 'better blood sugar control', 'walking', 'low-carb'],
    name: 'Diabetic Weight-Loss Plan',
    description:
      'A low glycemic index, calorie-controlled plan for managing Type 2 Diabetes and obesity. Focuses on complex carbs, lean protein, and portion control.',
    meals: {
      breakfast:
        'Methi paratha (1) with low-fat curd + 1 glass warm water with lemon\nOR Vegetable oats (no sugar) + boiled egg whites (2)',
      lunch:
        '1 small cup brown rice + sambar + bitter gourd stir-fry + salad\nOR 2 bajra rotis + moong dal + tinda sabzi',
      dinner:
        'Grilled paneer (100g) + 1 roti + palak soup\nOR Mixed dal khichdi (less rice ratio) + steamed vegetables',
      snacks:
        'Cucumber + carrot sticks with hummus\nOR Small handful of peanuts\nOR 1 guava or small orange',
    },
    advice:
      'Walk 30 minutes after lunch and dinner. Avoid rice at dinner. Monitor blood sugar 2 hours after meals. Eat every 3–4 hours to avoid spikes.',
  },
  {
    tags: ['dairy-free', 'kosher', 'lower blood pressure', 'better sleep', 'yoga', 'hiit'],
    name: 'Dairy-Free Kosher Wellness Plan',
    description:
      'A fully dairy-free and kosher-compliant plan rich in plant proteins, omega-3s, and anti-inflammatory foods to support yoga and HIIT recovery.',
    meals: {
      breakfast:
        'Smoothie: banana + berries + almond milk + chia seeds + flaxseeds\nOR Avocado toast on rye bread + fresh orange juice',
      lunch:
        'Quinoa salad with roasted vegetables + lemon-tahini dressing\nOR Lentil soup + 2 whole grain pitas + green salad',
      dinner:
        'Baked salmon (kosher) + roasted sweet potato + steamed broccoli\nOR Chickpea stew + brown rice + cucumber salad',
      snacks:
        'Almonds + dried cranberries mix\nOR Hummus with bell pepper sticks\nOR Rice cakes with almond butter',
    },
    advice:
      'Get calcium from almonds, broccoli, and fortified almond milk. Take a Vitamin B12 supplement. Chamomile tea before bed helps with better sleep.',
  },
  {
    tags: ['weight loss', 'increased fitness', 'hiit', 'weight training', 'running', 'vegetarian'],
    name: 'High-Protein Fitness Plan',
    description:
      'Built for HIIT and weight training enthusiasts, this high-protein vegetarian plan supports muscle gain, fat loss, and fast recovery.',
    meals: {
      breakfast:
        'Paneer bhurji (150g) + 2 multigrain rotis + 1 glass low-fat milk\nOR 4 egg whites scrambled + whole wheat toast + banana',
      lunch:
        'Soya chunks curry + 1 cup brown rice + mixed salad\nOR Rajma (high protein) + 2 rotis + cucumber raita',
      dinner:
        'Grilled tofu tikka + 1 roti + mixed vegetable soup\nOR Moong dal + quinoa khichdi + steamed spinach',
      snacks:
        'Whey protein shake OR 1 glass milk + banana\nOR Boiled chana chaat\nOR Peanut butter on whole wheat bread',
    },
    advice:
      'Eat 20–30g protein within 30 mins post-workout. Drink 3–4 litres of water on training days. Sleep 8 hours for optimal muscle recovery.',
  },
  {
    tags: ['arthritis', 'low impact', 'swimming', 'stress management', 'gluten-free'],
    name: 'Anti-Inflammatory Gluten-Free Plan',
    description:
      'An anti-inflammatory, gluten-free plan ideal for arthritis management. Rich in omega-3 fatty acids, antioxidants, and joint-supportive nutrients.',
    meals: {
      breakfast:
        'Rice poha with turmeric + ginger tea (no gluten)\nOR Gluten-free oats with berries + flaxseed powder + almond milk',
      lunch:
        '1 cup red rice + fish curry (omega-3 rich) + stir-fried vegetables\nOR Moong dal + jowar roti + lauki sabzi + salad',
      dinner:
        'Baked fish or grilled chicken + sweet potato mash + steamed greens\nOR Jowar khichdi + ghee + vegetable soup',
      snacks:
        'Walnut + cherry mix (anti-inflammatory)\nOR Turmeric milk (golden milk) with almond milk\nOR Rice crackers with avocado',
    },
    advice:
      'Include turmeric and ginger daily — both reduce joint inflammation. Avoid processed gluten-free packaged foods. Low-impact swimming is excellent for joints.',
  },
  {
    tags: ['type 1 diabetes', 'better blood sugar control', 'medication adherence', 'cycling', 'low-carb'],
    name: 'Type 1 Diabetes Management Plan',
    description:
      'A carefully structured low-carb plan for Type 1 Diabetes with consistent meal timing to support insulin management and stable blood glucose.',
    meals: {
      breakfast:
        'Besan cheela (2) + mint chutney + herbal tea (no sugar)\nOR Scrambled eggs + 1 slice whole grain toast + 1 small fruit',
      lunch:
        '2 jowar rotis + dal palak + cucumber raita\nOR 1 small bowl brown rice + fish curry + salad',
      dinner:
        'Grilled paneer + 1 roti + clear vegetable soup\nOR Moong dal khichdi (small portion) + steamed vegetables',
      snacks:
        'Cheese slice (if not dairy-free) + cucumber\nOR Hard-boiled egg\nOR Small handful of mixed seeds',
    },
    advice:
      'Never skip meals — consistent carb intake is critical for insulin dosing. Always carry fast-acting glucose for hypoglycemia. Test blood sugar before and after cycling.',
  },
  {
    tags: ['asthma', 'copd', 'stress management', 'better sleep', 'low impact', 'vegan'],
    name: 'Respiratory Health Vegan Plan',
    description:
      'A vegan, anti-oxidant-rich plan supporting lung health for asthma and COPD. Focuses on vitamin C, magnesium, and anti-inflammatory plant foods.',
    meals: {
      breakfast:
        'Papaya + kiwi fruit bowl + flaxseed smoothie with almond milk\nOR Vegetable upma + ginger-tulsi tea',
      lunch:
        'Lentil and spinach soup + 2 whole wheat rotis\nOR Brown rice + mixed vegetable curry + salad',
      dinner:
        'Tofu stir-fry with bell peppers + quinoa\nOR Vegetable daliya + steamed broccoli + lemon dressing',
      snacks:
        'Vitamin C rich fruits: orange, guava, amla\nOR Pumpkin seeds + sunflower seeds\nOR Carrot sticks with hummus',
    },
    advice:
      'Avoid cold foods and drinks which can trigger airway spasm. Magnesium-rich foods (spinach, pumpkin seeds) support bronchial relaxation. Practise pranayama breathing daily.',
  },
  {
    tags: ['obesity', 'weight loss', 'stress management', 'walking', 'halal', 'vegetarian'],
    name: 'Halal Vegetarian Weight Loss Plan',
    description:
      'A halal-compliant vegetarian weight-loss plan focused on high fibre, low calorie density foods to reduce obesity while managing stress levels.',
    meals: {
      breakfast:
        'Vegetable poha (small portion, less oil) + 1 glass buttermilk\nOR Sprouts chaat + 1 cup green tea',
      lunch:
        '2 multigrain rotis + chana masala (less oil) + salad + thin lassi\nOR 1 cup brown rice + dal + stir-fried vegetables',
      dinner:
        '1 roti + palak paneer (minimal oil) + vegetable soup\nOR Daliya khichdi + raita + salad',
      snacks:
        'Roasted makhana (fox nuts)\nOR 1 fruit (apple / guava / pear)\nOR Greek yogurt with cucumber',
    },
    advice:
      'Eat slowly and mindfully — it reduces overeating by 20%. Walk 45 minutes daily in morning sunlight which also helps stress. Avoid emotional eating by journalling.',
  },
  {
    tags: ['hypertension', 'heart disease', 'better sleep', 'stress management', 'yoga', 'low-sodium', 'vegan'],
    name: 'Vegan Stress-Relief Heart Plan',
    description:
      'A vegan, low-sodium plan combining heart health with stress reduction. Rich in magnesium, potassium, and adaptogens to calm the nervous system.',
    meals: {
      breakfast:
        'Banana + oat smoothie with ashwagandha powder + almond milk\nOR Moong dal idli (2) + coconut chutney + tulsi tea',
      lunch:
        'Brown rice + rajma (potassium-rich) + cucumber raita (coconut yogurt)\nOR 2 rotis + mixed dal + spinach sabzi + salad',
      dinner:
        'Palak tofu curry + 1 bajra roti + chamomile tea\nOR Vegetable khichdi + roasted papad (low sodium)',
      snacks:
        'Dark chocolate (70%+) + almonds — stress-reducing combo\nOR Banana + peanut butter\nOR Warm turmeric almond milk',
    },
    advice:
      'Practice 20 minutes of yoga or meditation daily — clinically proven to lower blood pressure. Avoid caffeine after 2 PM for better sleep. Magnesium from dark leafy greens supports sleep quality.',
  },
  {
    tags: ['increased fitness', 'weight loss', 'running', 'cycling', 'swimming', 'gluten-free', 'halal'],
    name: 'Athletic Performance Halal Plan',
    description:
      'A halal, gluten-free performance plan for runners, cyclists, and swimmers. High in complex carbs for endurance and lean protein for recovery.',
    meals: {
      breakfast:
        'Gluten-free oats + banana + honey + chia seeds\nOR Rice flour dosa + sambar + coconut chutney + 1 boiled egg',
      lunch:
        'Grilled chicken (halal) + sweet potato + steamed vegetables\nOR Brown rice + fish curry + salad + lemon water',
      dinner:
        'Baked salmon or grilled chicken (halal) + quinoa + roasted vegetables\nOR Egg fried rice (gluten-free soy sauce) + vegetable stir-fry',
      snacks:
        'Banana + peanut butter (pre-workout)\nOR Dates + almonds (quick energy)\nOR Coconut water + rice cakes (post-workout)',
    },
    advice:
      'Eat a carb-rich snack 45 minutes before training. Rehydrate with electrolytes after swimming. For endurance sports, increase complex carb intake on training days.',
  },
];

// Smart plan selector based on user profile
const selectBestPlan = (userData: UserData | null, usedNames: string[]) => {
  if (!userData) {
    const available = ALL_PLANS.filter(p => !usedNames.includes(p.name));
    const pool = available.length > 0 ? available : ALL_PLANS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const userTags = [
    ...(userData.conditions || []).map(c => c.toLowerCase()),
    ...(userData.dietaryRestrictions || []).map(d => d.toLowerCase()),
    ...(userData.exercisePreference || []).map(e => e.toLowerCase()),
    ...(userData.healthGoals || []).map(g => g.toLowerCase()),
  ];

  // Score each plan by how many tags match user profile
  const scored = ALL_PLANS
    .filter(p => !usedNames.includes(p.name))
    .map(plan => ({
      plan,
      score: plan.tags.filter(tag =>
        userTags.some(ut => ut.includes(tag) || tag.includes(ut))
      ).length,
    }))
    .sort((a, b) => b.score - a.score);

  // If all used, reset
  const pool = scored.length > 0 ? scored : ALL_PLANS
    .map(plan => ({
      plan,
      score: plan.tags.filter(tag =>
        userTags.some(ut => ut.includes(tag) || tag.includes(ut))
      ).length,
    }))
    .sort((a, b) => b.score - a.score);

  // Pick from top 3 matches randomly to add variety
  const top = pool.slice(0, 3);
  return top[Math.floor(Math.random() * top.length)].plan;
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

        // Refresh session to avoid JWT expired errors
        const { data: { session: refreshedSession }, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !refreshedSession) {
          toast.error('Session expired. Please log in again.');
          setLoading(false);
          return;
        }

        const { data: userDataResult, error: userError } = await supabase
          .from('users')
          .select('dietaryRestrictions, exercisePreference, healthGoals, conditions, age, gender, weight, height')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;
        setUserData(userDataResult);

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
    if (!session?.user?.id) return;

    try {
      setGenerating(true);

      const usedNames = dietPlans.map(p => p.name);
      const preset = selectBestPlan(userData, usedNames);

      // Simulate generation delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      const { data: savedPlan, error } = await supabase
        .from('diet_plans')
        .insert([
          {
            name: preset.name,
            description: preset.description,
            meals: preset.meals,
            additional_advice: preset.advice,
            user_id: session.user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setDietPlans([savedPlan, ...dietPlans]);
      setSelectedPlan(savedPlan);
      toast.success('Diet plan generated successfully!');
    } catch (error: any) {
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
        .insert([
          {
            name: newPlanName,
            description: 'Custom diet plan',
            meals: { breakfast: '', lunch: '', dinner: '', snacks: '' },
            user_id: session.user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setDietPlans([data, ...dietPlans]);
      setSelectedPlan(data);
      setShowForm(false);
      setNewPlanName('');
      toast.success('Custom diet plan created!');
    } catch (error: any) {
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
    } catch (error: any) {
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

            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">

              {/* Health Profile Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Your Health Profile
                </h2>
                <div className="space-y-4">
                  {[
                    { label: 'Dietary Restrictions', items: userData?.dietaryRestrictions, color: 'blue' },
                    { label: 'Exercise Preferences', items: userData?.exercisePreference, color: 'green' },
                    { label: 'Health Goals', items: userData?.healthGoals, color: 'purple' },
                    { label: 'Health Conditions', items: userData?.conditions, color: 'yellow' },
                  ].map(({ label, items, color }) => (
                    <div key={label}>
                      <h3 className="font-medium text-gray-500 dark:text-gray-400">{label}</h3>
                      {items?.length ? (
                        <span className="flex flex-wrap gap-1 mt-1">
                          {items.map((item, index) => (
                            <span
                              key={index}
                              className={`bg-${color}-100 dark:bg-${color}-900 text-${color}-800 dark:text-${color}-200 px-2 py-1 rounded-full text-sm`}
                            >
                              {item}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">None specified</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Card */}
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
                    {generating ? 'Generating...' : 'Generate New Diet Plan'}
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

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Diet Plans List */}
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
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPlan?.id === plan.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                        onClick={() => setSelectedPlan(plan)}
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold dark:text-white">{plan.name}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlan(plan.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {plan.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Plan Detail */}
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
                    {(
                      [
                        { key: 'breakfast', label: 'Breakfast', color: 'blue' },
                        { key: 'lunch', label: 'Lunch', color: 'green' },
                        { key: 'dinner', label: 'Dinner', color: 'purple' },
                        { key: 'snacks', label: 'Snacks', color: 'yellow' },
                      ] as const
                    ).map(({ key, label, color }) => (
                      <div key={key}>
                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <span className={`bg-${color}-100 dark:bg-${color}-900 text-${color}-800 dark:text-${color}-200 rounded-full p-1 mr-2`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                          {label}
                        </h3>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {selectedPlan.meals[key] || 'Not specified'}
                        </p>
                      </div>
                    ))}
                  </div>

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