import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom"; // ✅ Import Link for navigation
import { Activity, Calendar, Utensils, Dumbbell, Heart, Clock, Bell } from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "AI-powered scheduling system for medications and appointments",
    },
    {
      icon: <Utensils className="w-6 h-6" />,
      title: "Dietary Guidance",
      description: "Personalized meal plans based on your health conditions",
    },
    {
      icon: <Dumbbell className="w-6 h-6" />,
      title: "Exercise Routines",
      description: "Tailored workout plans that adapt to your progress",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Health Monitoring",
      description: "Real-time tracking of vital signs and health metrics",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Real-time Guidance",
      description: "24/7 AI assistance for your health journey",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Smart Alerts",
      description: "Proactive notifications for potential health risks",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="pt-20 pb-32 bg-gradient-to-br from-primary-from/10 to-primary-to/10 dark:from-primary-from/5 dark:to-primary-to/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-primary-from to-primary-to bg-clip-text text-transparent mb-6">
                Your AI Health Coach
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                Personalized health management powered by AI. Get real-time guidance for your chronic conditions.
              </p>
              <div className="flex justify-center gap-4">
                {/* ✅ Updated Buttons with Links */}
                <Link
                  to="/signup"
                  className="px-8 py-3 bg-gradient-to-r from-primary-from to-primary-to text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3 border border-primary-from text-primary-from dark:border-primary-to dark:text-primary-to rounded-lg font-medium hover:bg-primary-from/5 dark:hover:bg-primary-to/5 transition-colors"
                >
                  Login
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Comprehensive Health Management</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">Everything you need to manage your health, all in one place</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-from to-primary-to rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
