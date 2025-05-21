import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faKey, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch( 'https://task.trizenttechserve.in/password-reset-request', {
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
      const response = await fetch('https://task.trizenttechserve.in/reset-password', {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative p-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-gray-100 relative overflow-hidden transition-all duration-500 hover:shadow-indigo-200">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            BID Task Allocator
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            {step === 1 ? 'Request Password Reset' : 'Reset Your Password'}
          </p>
        </div>

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

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-5">
            <div className="group">
              <label className="block text-gray-700 text-sm font-medium mb-2 ml-1" htmlFor="username">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-indigo-500" />
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  className="block w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
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
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span>Requesting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faKey} className="mr-2" />
                    <span>Request Reset Token</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {tokenData && (
              <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg text-sm">
                <p className="font-bold text-amber-800">Your reset token:</p>
                <p className="mt-2 select-all font-mono bg-white p-3 rounded-lg border border-amber-200 text-amber-900">{tokenData.reset_token}</p>
                <p className="mt-2 text-xs text-amber-700">{tokenData.message}</p>
              </div>
            )}
            
            <div className="group">
              <label className="block text-gray-700 text-sm font-medium mb-2 ml-1" htmlFor="resetToken">
                <FontAwesomeIcon icon={faKey} className="mr-2 text-indigo-500" />
                Reset Token
              </label>
              <div className="relative">
                <input
                  id="resetToken"
                  type="text"
                  className="block w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
                  placeholder="Enter reset token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-gray-700 text-sm font-medium mb-2 ml-1" htmlFor="newPassword">
                <FontAwesomeIcon icon={faLock} className="mr-2 text-indigo-500" />
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type="password"
                  className="block w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-gray-700 text-sm font-medium mb-2 ml-1" htmlFor="confirmPassword">
                <FontAwesomeIcon icon={faLock} className="mr-2 text-indigo-500" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  className="block w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
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
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span>Resetting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <FontAwesomeIcon icon={faKey} className="mr-2" />
                    <span>Reset Password</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-300 hover:underline"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Login
          </Link>
        </div>
        
        {/* Bottom decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-70"></div>
      </div>
      
      <style jsx>{`
        @keyframes blob {
          0% { transform: scale(1) translate(0px, 0px); }
          33% { transform: scale(1.1) translate(20px, -20px); }
          66% { transform: scale(0.9) translate(-20px, 20px); }
          100% { transform: scale(1) translate(0px, 0px); }
        }
        
        .animate-blob {
          animation: blob 15s infinite alternate;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;