import React, { useEffect, useState } from 'react';
import { Loader2, PlusCircle, Calendar, Clock, AlertCircle, Pill, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import useAuth from '../../hooks/useAuth';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

// Types for TypeScript
type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  start_date: string;
  end_date: string;
  treatment_phase: string;
  times_per_day: number;
  specific_times: string[];
  with_food: boolean;
  side_effects: string;
  user_id: string;
  created_at: string;
};

type TreatmentPhase = {
  name: string;
  description: string;
  duration_days: number;
};

const Medication = () => {
  const { session } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMedication, setNewMedication] = useState<Omit<Medication, 'id' | 'user_id' | 'created_at'>>({ 
    name: '',
    dosage: '',
    frequency: '',
    instructions: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    treatment_phase: '',
    times_per_day: 1,
    specific_times: ['08:00'],
    with_food: false,
    side_effects: ''
  });
  const [activeTab, setActiveTab] = useState<'current' | 'upcoming' | 'completed'>('current');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Common treatment phases for chronic diseases
  const treatmentPhases: TreatmentPhase[] = [
    { name: 'Induction', description: 'Initial intensive treatment phase', duration_days: 28 },
    { name: 'Consolidation', description: 'Post-remission therapy', duration_days: 56 },
    { name: 'Maintenance', description: 'Long-term lower intensity treatment', duration_days: 365 },
    { name: 'Palliative', description: 'Symptom management', duration_days: 0 }
  ];

  useEffect(() => {
    const fetchMedications = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('medications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('start_date', { ascending: true });

        if (error) throw error;
        setMedications(data || []);
      } catch (error) {
        console.error('Error fetching medications:', error);
        toast.error('Failed to fetch medication data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedications();
  }, [session]);

  const filteredMedications = medications.filter(med => {
    const today = new Date();
    const startDate = new Date(med.start_date);
    const endDate = med.end_date ? new Date(med.end_date) : null;

    if (activeTab === 'current') {
      return (!endDate || endDate >= today) && startDate <= today;
    } else if (activeTab === 'upcoming') {
      return startDate > today;
    } else {
      return endDate && endDate < today;
    }
  });

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('You must be logged in to add medications');
      return;
    }

    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) {
      toast.error('Please fill out required fields.');
      return;
    }

    try {
      setLoading(true);
      const medicationData = {
        ...newMedication,
        user_id: session.user.id,
        specific_times: newMedication.specific_times.filter(time => time)
      };

      if (editingId) {
        const { data, error } = await supabase
          .from('medications')
          .update(medicationData)
          .eq('id', editingId)
          .select();

        if (error) throw error;

        setMedications(medications.map(med => 
          med.id === editingId ? data[0] : med
        ));
        toast.success('Medication updated successfully!');
      } else {
        const { data, error } = await supabase
          .from('medications')
          .insert([medicationData])
          .select();

        if (error) throw error;

        setMedications([...medications, data[0]]);
        toast.success('Medication added successfully!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving medication:', error);
      toast.error(error.message || 'Failed to save medication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medication?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedications(medications.filter(med => med.id !== id));
      toast.success('Medication deleted successfully!');
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast.error('Failed to delete medication.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medication: Medication) => {
    setNewMedication({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      instructions: medication.instructions,
      start_date: medication.start_date,
      end_date: medication.end_date,
      treatment_phase: medication.treatment_phase,
      times_per_day: medication.times_per_day,
      specific_times: [...medication.specific_times],
      with_food: medication.with_food,
      side_effects: medication.side_effects
    });
    setEditingId(medication.id);
    setShowAdvanced(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setNewMedication({ 
      name: '',
      dosage: '',
      frequency: '',
      instructions: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      treatment_phase: '',
      times_per_day: 1,
      specific_times: ['08:00'],
      with_food: false,
      side_effects: ''
    });
    setEditingId(null);
    setShowAdvanced(false);
  };

  const addTimeSlot = () => {
    if (newMedication.specific_times.length < 6) {
      setNewMedication({
        ...newMedication,
        specific_times: [...newMedication.specific_times, '']
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    const newTimes = [...newMedication.specific_times];
    newTimes.splice(index, 1);
    setNewMedication({
      ...newMedication,
      specific_times: newTimes
    });
  };

  const updateTimeSlot = (index: number, value: string) => {
    const newTimes = [...newMedication.specific_times];
    newTimes[index] = value;
    setNewMedication({
      ...newMedication,
      specific_times: newTimes
    });
  };

  const calculateEndDate = (days: number) => {
    if (!newMedication.start_date || !days) return;
    const startDate = new Date(newMedication.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days);
    setNewMedication({
      ...newMedication,
      end_date: endDate.toISOString().split('T')[0]
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl w-full mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Chronic Disease Medication Management
        </h1>
        
        <div className="bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="flex-shrink-0 h-5 w-5 text-blue-700 dark:text-blue-300 mt-0.5 mr-2" />
            <div>
              <p className="text-blue-700 dark:text-blue-300 font-bold">Important!</p>
              <p className="text-blue-600 dark:text-blue-200">
                Strict adherence to your medication schedule is crucial for effective treatment. 
                Always consult your oncologist before making any changes.
              </p>
            </div>
          </div>
        </div>

        {/* Medication Form */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            {editingId ? 'Edit Medication' : 'Add New Medication'}
          </h2>
          
          <form onSubmit={handleAddMedication} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Medication Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paclitaxel"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ 
                    ...newMedication, 
                    name: e.target.value 
                  })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Dosage *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 175mg/m²"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ 
                    ...newMedication, 
                    dosage: e.target.value 
                  })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Frequency *
                </label>
                <select
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ 
                    ...newMedication, 
                    frequency: e.target.value 
                  })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                >
                  <option value="">Select Frequency</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="As needed">As needed</option>
                  <option value="Cycle-specific">Cycle-specific</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Treatment Phase
                </label>
                <select
                  value={newMedication.treatment_phase}
                  onChange={(e) => setNewMedication({ 
                    ...newMedication, 
                    treatment_phase: e.target.value 
                  })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select Phase</option>
                  {treatmentPhases.map(phase => (
                    <option key={phase.name} value={phase.name}>
                      {phase.name} ({phase.duration_days} days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  Start Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={newMedication.start_date}
                    onChange={(e) => setNewMedication({ 
                      ...newMedication, 
                      start_date: e.target.value 
                    })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 pl-10"
                    required
                  />
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={newMedication.end_date}
                    onChange={(e) => setNewMedication({ 
                      ...newMedication, 
                      end_date: e.target.value 
                    })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 pl-10"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>

              {newMedication.treatment_phase && (
                <button
                  type="button"
                  onClick={() => {
                    const phase = treatmentPhases.find(p => p.name === newMedication.treatment_phase);
                    if (phase) calculateEndDate(phase.duration_days);
                  }}
                  className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-lg"
                >
                  Calculate End Date
                </button>
              )}
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Special Instructions
                  </label>
                  <textarea
                    placeholder="e.g. Take with 500ml water, avoid sunlight after taking"
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication({ 
                      ...newMedication, 
                      instructions: e.target.value 
                    })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Times Per Day
                    </label>
                    <select
                      value={newMedication.times_per_day}
                      onChange={(e) => {
                        const times = parseInt(e.target.value);
                        const newTimes = Array(times).fill('').map((_, i) => 
                          i < newMedication.specific_times.length 
                            ? newMedication.specific_times[i] 
                            : `${8 + i * 4}:00`
                        );
                        setNewMedication({ 
                          ...newMedication, 
                          times_per_day: times,
                          specific_times: newTimes
                        });
                      }}
                      className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} time{num !== 1 ? 's' : ''} per day</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                      Administration With Food
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={newMedication.with_food}
                          onChange={() => setNewMedication({ 
                            ...newMedication, 
                            with_food: true 
                          })}
                          className="mr-2"
                        />
                        <span>With Food</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!newMedication.with_food}
                          onChange={() => setNewMedication({ 
                            ...newMedication, 
                            with_food: false 
                          })}
                          className="mr-2"
                        />
                        <span>Without Food</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Specific Times
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {newMedication.specific_times.map((time, index) => (
                      <div key={index} className="flex items-center">
                        <div className="relative flex-1">
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => updateTimeSlot(index, e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 pl-10"
                          />
                          <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                        </div>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {newMedication.specific_times.length < 6 && (
                      <button
                        type="button"
                        onClick={addTimeSlot}
                        className="flex items-center justify-center p-2 border-2 border-dashed rounded-lg hover:border-blue-500"
                      >
                        <PlusCircle className="h-5 w-5 mr-1" />
                        Add Time
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Potential Side Effects
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nausea, fatigue, hair loss"
                    value={newMedication.side_effects}
                    onChange={(e) => setNewMedication({ 
                      ...newMedication, 
                      side_effects: e.target.value 
                    })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg flex items-center justify-center hover:opacity-90 disabled:opacity-70 transition-opacity"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <Pill className="h-5 w-5 mr-2" />
                )}
                {editingId ? 'Update Medication' : 'Add Medication'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Medication List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
          </div>
        ) : (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold dark:text-white">
                Your Medication Schedule
              </h2>
              
              <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-3 py-1 rounded-md text-sm ${activeTab === 'current' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                >
                  Current
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-3 py-1 rounded-md text-sm ${activeTab === 'upcoming' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-3 py-1 rounded-md text-sm ${activeTab === 'completed' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}
                >
                  Completed
                </button>
              </div>
            </div>
            
            {filteredMedications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No {activeTab} medications found.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMedications.map((med) => (
                  <motion.div
                    key={med.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg dark:text-white flex items-center">
                          <Pill className="h-5 w-5 mr-2 text-blue-600" />
                          {med.name}
                          {med.treatment_phase && (
                            <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                              {med.treatment_phase}
                            </span>
                          )}
                        </h3>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Dosage</p>
                            <p className="dark:text-gray-300">{med.dosage}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Frequency</p>
                            <p className="dark:text-gray-300">{med.frequency}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">Schedule</p>
                            <p className="dark:text-gray-300">
                              {new Date(med.start_date).toLocaleDateString()} -{' '}
                              {med.end_date ? new Date(med.end_date).toLocaleDateString() : 'Ongoing'}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500 dark:text-gray-400">With Food</p>
                            <p className="dark:text-gray-300">{med.with_food ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(med)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:hover:text-blue-400"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(med.id)}
                          className="p-2 text-red-600 hover:text-red-800 dark:hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {med.instructions && (
                      <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Special Instructions:</p>
                        <p className="text-yellow-700 dark:text-yellow-300">{med.instructions}</p>
                      </div>
                    )}

                    {med.side_effects && (
                      <div className="mt-3 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">
                        <p className="font-medium text-red-800 dark:text-red-200">Potential Side Effects:</p>
                        <p className="text-red-700 dark:text-red-300">{med.side_effects}</p>
                      </div>
                    )}

                    {med.specific_times && med.specific_times.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-gray-500 dark:text-gray-400 mb-1">Daily Schedule:</p>
                        <div className="flex flex-wrap gap-2">
                          {med.specific_times.map((time, index) => (
                            <span 
                              key={index} 
                              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center"
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Medication;