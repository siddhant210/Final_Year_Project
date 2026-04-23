import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import supabase from '../../supabaseClient';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      // Call Supabase to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        throw new Error(error.message);
      }
      // Optionally, add username to the profile (assuming you have user profiles set up)
      await supabase
        .from('profiles') // Adjust this line based on your profiles table
        .insert([{ id: data.user.id, username }]);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(`Signup failed: ${error.message}`);
      console.error('Signup Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        toast.error(`Google sign-in failed: ${error.message}`);
      } else {
        // Optionally store additional user info, e.g. username, in your database
        toast.success('Signed in successfully with Google!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(`Google sign-in failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section for Signup */}
      <section className="pt-20 pb-32 bg-gradient-to-br from-primary-from/10 to-primary-to/10 dark:from-primary-from/5 dark:to-primary-to/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-primary-from to-primary-to bg-clip-text text-transparent mb-6">
                Sign Up
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                Join us now for personalized health management empowered by AI!
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Signup Form Section */}
      <section className="py-20">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
          >
            <form onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">Email Address</label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary-from">
                  <Mail className="w-6 h-6 p-2 text-gray-500" />
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-grow p-2 focus:outline-none"
                  />
                </div>
              </div>
              {/* Username Input */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="username">Username</label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary-from">
                  <UserPlus className="w-6 h-6 p-2 text-gray-500" />
                  <input
                    type="text"
                    id="username"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="flex-grow p-2 focus:outline-none"
                  />
                </div>
              </div>
              {/* Password Input */}
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">Create Password</label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary-from">
                  <Lock className="w-6 h-6 p-2 text-gray-500" />
                  <input
                    type="password"
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex-grow p-2 focus:outline-none"
                  />
                </div>
              </div>
              {/* Confirm Password Input */}
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="confirm-password">Confirm Password</label>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary-from">
                  <Lock className="w-6 h-6 p-2 text-gray-500" />
                  <input
                    type="password"
                    id="confirm-password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="flex-grow p-2 focus:outline-none"
                  />
                </div>
              </div>
              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                className={`w-full px-4 py-3 bg-gradient-to-r from-primary-from to-primary-to text-white rounded-lg font-medium transition-colors hover:opacity-90 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            </form>
            {/* Google Sign-In Button */}
            <div className="mt-4 text-center">
              <button
                onClick={handleGoogleSignIn}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 font-medium transition-colors hover:bg-gray-100"
                disabled={isLoading}
              >
                Sign in with Google
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
