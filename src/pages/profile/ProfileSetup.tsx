import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, User, Heart, Watch, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '', 
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

type Step = 'basic' | 'health' | 'vitals' | 'lifestyle';

interface FormData {
  name: string;
  age: number | null;
  gender: string;
  height: number | null;
  weight: number | null;
  email: string;
  phone: string;
  conditions: string[];
  medication: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  wearableDevice: string;
  bloodSugar: string;
  heartrate: string;
  bloodPressure: string;
  dietaryRestrictions: string[];
  exercisePreference: string[];
  healthGoals: string[];
}

const initialFormData: FormData = {
  name: '',
  age: null,
  gender: '',
  height: null,
  weight: null,
  email: '',
  phone: '',
  conditions: [],
  medication: [],
  wearableDevice: '',
  bloodSugar: '',
  heartrate: '',
  bloodPressure: '',
  dietaryRestrictions: [],
  exercisePreference: [],
  healthGoals: [],
};

const chronicConditions = [
  'Type 1 Diabetes', 'Type 2 Diabetes', 'Hypertension', 
  'Heart Disease', 'Asthma', 'COPD', 'Arthritis', 
  'Obesity', 'Other',
];

const dietaryRestrictions = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
  'Low-Sodium', 'Low-Carb', 'Kosher', 'Halal', 'None',
];

const exercisePreferences = [
  'Walking', 'Running', 'Swimming', 'Cycling', 
  'Yoga', 'Weight Training', 'HIIT', 'Low Impact',
];

const healthGoals = [
  'Weight Loss', 'Better Blood Sugar Control', 
  'Lower Blood Pressure', 'Increased Fitness', 
  'Better Sleep', 'Stress Management', 
  'Medication Adherence',
];

export default function ProfileSetup() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define steps array
  const steps = [
    { id: 'basic', icon: User, title: 'Basic Information' },
    { id: 'health', icon: Heart, title: 'Health Conditions' },
    { id: 'vitals', icon: Watch, title: 'Vitals Integration' },
    { id: 'lifestyle', icon: Target, title: 'Lifestyle & Goals' },
  ];

  // Safe array helper function
  const safeArray = (arr: any[] | undefined): any[] => {
    return Array.isArray(arr) ? arr : [];
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as Step);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as Step);
    }
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 'basic':
        if (!formData.name || !formData.age || !formData.gender) {
          toast.error('Please fill in all required fields');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("No user ID found");
      }

      const submissionData = {
        id: userId,
        name: formData.name || null,
        age: formData.age || null,
        gender: formData.gender || null,
        height: formData.height || null,
        weight: formData.weight || null,
        email: formData.email || null,
        phone: formData.phone || null,
        conditions: safeArray(formData.conditions),
        medication: safeArray(formData.medication),
        wearableDevice: formData.wearableDevice || null,
        bloodSugar: formData.bloodSugar || null,
        heartRate: formData.heartrate || null,
        bloodPressure: formData.bloodPressure || null,
        dietaryRestrictions: safeArray(formData.dietaryRestrictions),
        exercisePreference: safeArray(formData.exercisePreference),
        healthGoals: safeArray(formData.healthGoals),
      };

      const { error } = await supabase
        .from('users')
        .upsert(submissionData)
        .eq('id', userId);

      if (error) {
        if (error.code === '23505') {
          toast.error('Profile already exists');
        } else {
          toast.error(`Save failed: ${error.message}`);
        }
        throw error;
      }
      
      toast.success('Profile saved successfully!');
      navigate('/profile');
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { label: 'Full Name', field: 'name', type: 'text', required: true },
        { label: 'Age', field: 'age', type: 'number', required: true },
        { 
          label: 'Gender', 
          field: 'gender', 
          type: 'select', 
          options: ['Select Gender', 'Male', 'Female', 'Other', 'Prefer not to say'],
          required: true 
        },
        { label: 'Height (cm)', field: 'height', type: 'number' },
        { label: 'Weight (kg)', field: 'weight', type: 'number' },
        { label: 'Email', field: 'email', type: 'email' },
        { label: 'Phone', field: 'phone', type: 'tel' },
      ].map(({ label, field, type, options, required }) => (
        <div key={field}>
          <label className="block text-sm font-medium mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {type === 'select' ? (
            <select
              value={formData[field as keyof FormData] as string}
              onChange={(e) => updateFormData(field as keyof FormData, e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-from"
              required={required}
            >
              {options?.map((option) => (
                <option value={option} key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={formData[field as keyof FormData] as string | number | undefined}
              onChange={(e) => {
                const value = type === 'number' 
                  ? e.target.value ? parseInt(e.target.value) : null
                  : e.target.value;
                updateFormData(field as keyof FormData, value);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-from"
              required={required}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderHealthConditions = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-4">Chronic Conditions</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {chronicConditions.map((condition) => (
            <label key={condition} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.conditions.includes(condition)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData('conditions', [...formData.conditions, condition]);
                  } else {
                    updateFormData('conditions', formData.conditions.filter(c => c !== condition));
                  }
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-from focus:ring-primary-from"
              />
              <span>{condition}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-4">Medications</label>
        {formData.medication.map((med, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              placeholder="Medication Name"
              value={med.name}
              onChange={(e) => {
                const newMeds = [...formData.medication];
                newMeds[index].name = e.target.value;
                updateFormData('medication', newMeds);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
            <input
              placeholder="Dosage"
              value={med.dosage}
              onChange={(e) => {
                const newMeds = [...formData.medication];
                newMeds[index].dosage = e.target.value;
                updateFormData('medication', newMeds);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
            <input
              placeholder="Frequency"
              value={med.frequency}
              onChange={(e) => {
                const newMeds = [...formData.medication];
                newMeds[index].frequency = e.target.value;
                updateFormData('medication', newMeds);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
          </div>
        ))}
        <button
          onClick={() => updateFormData('medication', [...formData.medication, { name: '', dosage: '', frequency: '' }])}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Add Medication
        </button>
      </div>
    </div>
  );

  const renderVitalsIntegration = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Wearable Device</label>
        <select
          value={formData.wearableDevice}
          onChange={(e) => updateFormData('wearableDevice', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        >
          <option value="">Select Device</option>
          <option value="apple-watch">Apple Watch</option>
          <option value="fitbit">Fitbit</option>
          <option value="samsung">Samsung Galaxy Watch</option>
          <option value="garmin">Garmin</option>
          <option value="none">No Device</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Blood Sugar (mg/dL)', field: 'bloodSugar' },
          { label: 'Heart Rate (bpm)', field: 'heartrate' },
          { label: 'Blood Pressure (mmHg)', field: 'bloodPressure', placeholder: '120/80' },
        ].map(({ label, field, placeholder }) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <input
              type="text"
              value={formData[field as keyof FormData] as string}
              onChange={(e) => updateFormData(field as keyof FormData, e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-from"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderLifestyleGoals = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-4">Dietary Restrictions</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {dietaryRestrictions.map((restriction) => (
            <label key={restriction} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.dietaryRestrictions.includes(restriction)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData('dietaryRestrictions', [...formData.dietaryRestrictions, restriction]);
                  } else {
                    updateFormData('dietaryRestrictions', formData.dietaryRestrictions.filter(r => r !== restriction));
                  }
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-from focus:ring-primary-from"
              />
              <span>{restriction}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-4">Exercise Preferences</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {exercisePreferences.map((exercise) => (
            <label key={exercise} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.exercisePreference.includes(exercise)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData('exercisePreference', [...formData.exercisePreference, exercise]);
                  } else {
                    updateFormData('exercisePreference', formData.exercisePreference.filter(ex => ex !== exercise));
                  }
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-from focus:ring-primary-from"
              />
              <span>{exercise}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-4">Health Goals</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {healthGoals.map((goal) => (
            <label key={goal} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.healthGoals.includes(goal)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData('healthGoals', [...formData.healthGoals, goal]);
                  } else {
                    updateFormData('healthGoals', formData.healthGoals.filter(g => g !== goal));
                  }
                }}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-from focus:ring-primary-from"
              />
              <span>{goal}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep === step.id
                      ? 'bg-gradient-to-r from-primary-from to-primary-to text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                {index < steps.length - 1 && (
                  <div className="w-full h-1 mx-2 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span
                key={step.id}
                className={`text-sm font-medium ${
                  currentStep === step.id
                    ? 'text-primary-from dark:text-primary-to'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 'basic' && renderBasicInfo()}
              {currentStep === 'health' && renderHealthConditions()}
              {currentStep === 'vitals' && renderVitalsIntegration()}
              {currentStep === 'lifestyle' && renderLifestyleGoals()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mb-4">
          <button
            onClick={handleBack}
            className={`flex items-center px-4 py-2 rounded-lg ${
              currentStep === 'basic'
                ? 'opacity-50 cursor-not-allowed'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            disabled={currentStep === 'basic'}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={`flex items-center px-4 py-2 bg-gradient-to-r from-primary-from to-primary-to text-white rounded-lg hover:opacity-90 transition-opacity ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              'Processing...'
            ) : (
              <>
                {currentStep === 'lifestyle' ? 'Complete' : 'Next'}
                {currentStep !== 'lifestyle' && <ChevronRight className="w-5 h-5 ml-2" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}