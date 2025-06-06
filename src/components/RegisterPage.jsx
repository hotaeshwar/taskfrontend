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
import illustrationImage from '../assets/images/illustration.png';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: ''
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
      const response = await fetch('https://taskapi.buildingindiadigital.com/register', {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700/20 via-slate-900/50 to-slate-900"></div>
      
      {/* Bid Task Allocator Heading */}
      <div className="relative z-10 text-center mb-6">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
          <span>
            <span style={{ color: '#FF6600' }}>B</span>
            <span style={{ color: '#1E3A8A' }}>i</span>
            <span style={{ color: '#22C55E' }}>d</span>
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 ml-1">
            Task Allocator
          </span>
        </h1>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
          <div className="flex flex-col lg:flex-row min-h-[450px]">
            
            {/* Left Side - Illustration */}
            <div className="lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-700 p-6 lg:p-8 flex flex-col justify-center items-center relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-[url(data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)] opacity-30"></div>
              
              {/* Illustration Image */}
              <div className="relative z-10 w-full max-w-xs mx-auto mb-6">
                <img 
                  src={illustrationImage} 
                  alt="Registration Illustration" 
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
              
              {/* Welcome Text */}
              <div className="text-center text-white relative z-10">
                <h2 className="text-xl lg:text-2xl font-bold mb-3">Join Our Platform</h2>
                <p className="text-purple-100 text-sm lg:text-base opacity-90">Create your account and start managing tasks efficiently</p>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">REGISTER</h1>
                <p className="text-slate-400 text-sm">Create your new account</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg mb-4 backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs font-medium">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faUser} className="text-slate-400 text-sm" />
                  </div>
                  <input
                    name="username"
                    type="text"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-3 pl-10 pr-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm text-sm"
                    placeholder="USERNAME"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 text-sm" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-3 pl-10 pr-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm text-sm"
                    placeholder="EMAIL"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faLock} className="text-slate-400 text-sm" />
                  </div>
                  <input
                    name="password"
                    type={showPassword.password ? "text" : "password"}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-3 pl-10 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm text-sm"
                    placeholder="PASSWORD"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
                    onClick={() => togglePasswordVisibility('password')}
                    tabIndex="-1"
                  >
                    <FontAwesomeIcon icon={showPassword.password ? faEyeSlash : faEye} className="text-sm" />
                  </button>
                </div>

                {/* Confirm Password Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faLock} className="text-slate-400 text-sm" />
                  </div>
                  <input
                    name="confirm_password"
                    type={showPassword.confirm_password ? "text" : "password"}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-3 pl-10 pr-10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm text-sm"
                    placeholder="CONFIRM PASSWORD"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
                    onClick={() => togglePasswordVisibility('confirm_password')}
                    tabIndex="-1"
                  >
                    <FontAwesomeIcon icon={showPassword.confirm_password ? faEyeSlash : faEye} className="text-sm" />
                  </button>
                </div>

                {/* Role Selection */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faUserTag} className="text-slate-400 text-sm" />
                  </div>
                  <select
                    name="role"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg py-3 pl-10 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm appearance-none text-sm"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="" className="bg-slate-800">SELECT ROLE</option>
                    <option value="employee" className="bg-slate-800">Employee</option>
                    <option value="allocator" className="bg-slate-800">Allocator</option>
                    <option value="client" className="bg-slate-800">Client</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>CREATING ACCOUNT...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FontAwesomeIcon icon={faUserPlus} className="mr-2 text-sm" />
                      <span>REGISTER</span>
                    </div>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-3">
                  <p className="text-slate-400 text-sm">
                    Already have an account?{' '}
                    <Link 
                      to="/" 
                      className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-300 hover:underline"
                    >
                      SIGN IN
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
