import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faKey, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import illustrationImage from '../assets/images/illustration.png';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Request token, 2: Reset password
  const [username, setUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const navigate = useNavigate();

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch( 'https://taskapi.buildingindiadigital.com/password-reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to request password reset');
      }

      setTokenData(data);
      setSuccess('Reset token generated. Please use the token to reset your password.');
      setStep(2);
    } catch (error) {
      console.error('Reset request error:', error);
      setError(error.message || 'Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: resetToken,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setSuccess('Password has been reset successfully! You can now login with your new password.');
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
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
          <span style={{ color: '#FF6600' }}>B</span>
          <span style={{ color: '#1E3A8A' }}>i</span>
          <span style={{ color: '#22C55E' }}>d</span>
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
                  alt="Password Reset Illustration" 
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
              
              {/* Welcome Text */}
              <div className="text-center text-white relative z-10">
                <h2 className="text-xl lg:text-2xl font-bold mb-3">Reset Your Password</h2>
                <p className="text-purple-100 text-sm lg:text-base opacity-90">
                  {step === 1 ? 'Enter your username to get a reset token' : 'Use your token to set a new password'}
                </p>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {step === 1 ? 'FORGOT PASSWORD' : 'RESET PASSWORD'}
                </h1>
                <p className="text-slate-400 text-sm">
                  {step === 1 ? 'Request a reset token' : 'Enter your new password'}
                </p>
              </div>

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

              {step === 1 ? (
                <form onSubmit={handleRequestToken} className="space-y-4">
                  <div className="group">
                    <label className="block text-slate-300 text-sm font-medium mb-2 ml-1" htmlFor="username">
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-purple-400" />
                      Username
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        type="text"
                        className="block w-full px-4 py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:border-purple-400 group-hover:bg-slate-700 text-sm placeholder-slate-400"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          <span>REQUESTING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <FontAwesomeIcon icon={faKey} className="mr-2" />
                          <span>REQUEST RESET TOKEN</span>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {tokenData && (
                    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
                      <p className="font-bold text-amber-400">Your reset token:</p>
                      <p className="mt-2 select-all font-mono bg-slate-700 p-3 rounded-lg border border-amber-500/30 text-amber-300">{tokenData.reset_token}</p>
                      <p className="mt-2 text-xs text-amber-300">{tokenData.message}</p>
                    </div>
                  )}
                  
                  <div className="group">
                    <label className="block text-slate-300 text-sm font-medium mb-2 ml-1" htmlFor="resetToken">
                      <FontAwesomeIcon icon={faKey} className="mr-2 text-purple-400" />
                      Reset Token
                    </label>
                    <div className="relative">
                      <input
                        id="resetToken"
                        type="text"
                        className="block w-full px-4 py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:border-purple-400 group-hover:bg-slate-700 text-sm placeholder-slate-400"
                        placeholder="Enter reset token"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-slate-300 text-sm font-medium mb-2 ml-1" htmlFor="newPassword">
                      <FontAwesomeIcon icon={faLock} className="mr-2 text-purple-400" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type="password"
                        className="block w-full px-4 py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:border-purple-400 group-hover:bg-slate-700 text-sm placeholder-slate-400"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-slate-300 text-sm font-medium mb-2 ml-1" htmlFor="confirmPassword">
                      <FontAwesomeIcon icon={faLock} className="mr-2 text-purple-400" />
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type="password"
                        className="block w-full px-4 py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:border-purple-400 group-hover:bg-slate-700 text-sm placeholder-slate-400"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          <span>RESETTING...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <FontAwesomeIcon icon={faKey} className="mr-2" />
                          <span>RESET PASSWORD</span>
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-6">
                <Link 
                  to="/" 
                  className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors duration-300 hover:underline cursor-pointer text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  BACK TO LOGIN
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;