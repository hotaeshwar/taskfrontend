import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faEnvelope, 
  faLock, 
  faUserPlus, 
  faEye, 
  faEyeSlash,
  faUserTag
} from '@fortawesome/free-solid-svg-icons';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'employee'
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm_password: false
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Basic password validation
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://task.trizenttechserve.in/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting to login...');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative p-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-gray-100 relative overflow-hidden transition-all duration-500 hover:shadow-indigo-200">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            BID Task Allocator
          </h1>
          <p className="text-gray-600 mt-2 font-medium">Create your account to get started</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg mb-5 animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-lg mb-5">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="group">
            <label className="block text-gray-700 text-sm font-medium mb-2 ml-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                name="username"
                type="text"
                className="block w-full px-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="group">
            <label className="block text-gray-700 text-sm font-medium mb-2 ml-1">
              Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
              <input
                name="email"
                type="email"
                className="block w-full px-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="group">
            <label className="block text-gray-700 text-sm font-medium mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                name="password"
                type={showPassword.password ? "text" : "password"}
                className="block w-full px-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none"
                onClick={() => togglePasswordVisibility('password')}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showPassword.password ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="group">
            <label className="block text-gray-700 text-sm font-medium mb-2 ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                name="confirm_password"
                type={showPassword.confirm_password ? "text" : "password"}
                className="block w-full px-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
                placeholder="Confirm your password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none"
                onClick={() => togglePasswordVisibility('confirm_password')}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showPassword.confirm_password ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div className="group">
            <label className="block text-gray-700 text-sm font-medium mb-2 ml-1">
              Role
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300">
                <FontAwesomeIcon icon={faUserTag} />
              </span>
              <select
                name="role"
                className="block w-full px-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white appearance-none"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="employee">Employee</option>
                <option value="allocator">Allocator</option>
                <option value="client">Client</option>
              </select>
              {/* Custom arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:-translate-y-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                  <span>Create Account</span>
                </div>
              )}
            </button>
          </div>

          {/* Login Link - FIXED */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/" 
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-300 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
        
        {/* Bottom decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-70"></div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-indigo-500 rounded-full opacity-70 animate-float"></div>
      <div className="absolute bottom-20 right-20 w-2 h-2 bg-purple-500 rounded-full opacity-60 animate-float animation-delay-1000"></div>
      <div className="absolute top-1/3 right-10 w-4 h-4 bg-pink-500 rounded-full opacity-60 animate-float animation-delay-2000"></div>
      
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes blob {
          0% { transform: scale(1) translate(0px, 0px); }
          33% { transform: scale(1.1) translate(20px, -20px); }
          66% { transform: scale(0.9) translate(-20px, 20px); }
          100% { transform: scale(1) translate(0px, 0px); }
        }
        
        .animate-blob {
          animation: blob 15s infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;