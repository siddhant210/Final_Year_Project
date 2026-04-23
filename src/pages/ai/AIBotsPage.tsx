import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot } from 'react-icons/fa';
import { GiRobotAntennas } from 'react-icons/gi';
import { RiRobot2Line } from 'react-icons/ri';
import { Link } from 'react-router-dom';

const bots = [
  {
    id: 'MedGuardian',
    icon: FaRobot,
    name: 'MedGuardian',
    description: 'Your medication reminder and health tracking assistant',
    link: 'https://web.telegram.org/k/#@MedGuardian_bot',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'DietaryBot',
    icon: GiRobotAntennas,
    name: 'DietaryBot',
    description: 'Personalized nutrition and meal planning assistant',
    link: 'https://web.telegram.org/k/#@MedGuardianDietBot',
    color: 'from-green-500 to-teal-500'
  },
  {
    id: 'DailyTaskBot',
    icon: RiRobot2Line,
    name: 'DailyTaskBot',
    description: 'Helps you maintain healthy daily routines and habits',
    link: 'https://web.telegram.org/k/#@MedGaurdianDaily_bot',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'ExerciseBot',
    icon: RiRobot2Line,
    name: 'ExerciseBot',
    description: 'Your personal workout and exercise planner',
    link: 'https://web.telegram.org/k/#@medExerciseBot',
    color: 'from-orange-500 to-yellow-500'
  }
];

export default function AIBotsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const handleBotClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <main className="flex-1 overflow-y-auto p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <FaRobot className="w-5 h-5 mr-2 text-blue-500" />
                  AI Health Assistants
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect with our specialized health bots on Telegram
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bots Grid */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <motion.div
                key={bot.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/30 dark:border-gray-700/30 overflow-hidden transition-all duration-300 hover:shadow-xl"
              >
                <div className={`h-2 bg-gradient-to-r ${bot.color}`}></div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${bot.color} text-white`}>
                      <bot.icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold ml-4">{bot.name}</h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">{bot.description}</p>
                  <button
                    onClick={() => handleBotClick(bot.link)}
                    className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center"
                  >
                    Open in Telegram
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional Info */}
          <motion.div variants={itemVariants} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30 dark:border-gray-700/30">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              How to use these bots
            </h2>
            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 space-y-2">
              <li>Click on any bot to open Telegram (app or web)</li>
              <li>Start a chat with the bot by clicking "Start"</li>
              <li>Follow the bot's instructions to set up your preferences</li>
              <li>The bots will proactively send you reminders and health tips</li>
            </ul>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
