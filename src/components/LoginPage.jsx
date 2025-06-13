import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLock, 
  faSignInAlt, 
  faUserTag, 
  faExclamationTriangle,
  faUserCheck,
  faUserTimes,
  faBell,
  faTimes,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import illustrationImage from '../assets/images/illustration.png';

const LoginPage = ({ onLogin }) => {
  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [approvalPending, setApprovalPending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Approval modal states
  const [isAllocatorUser, setIsAllocatorUser] = useState(false);
  const [allocatorToken, setAllocatorToken] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  
  const navigate = useNavigate();

  // Handle employee login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setApprovalPending(false);

    // Validate that role is selected
    if (!role) {
      setError('Please select your role to continue');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('role', role); // Now always included since role is required

    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/login', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if this is an approval pending error
        if (response.status === 403 && data.detail?.includes('pending approval')) {
          setApprovalPending(true);
          throw new Error('Your account is pending approval by an allocator. Please try again later.');
        } else {
          throw new Error(data.detail || 'Login failed');
        }
      }

      // Get access token
      const token = data.access_token;

      // Fetch user data
      const userResponse = await fetch('https://taskapi.buildingindiadigital.com/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();
      
      // If user is an allocator, store token for approvals
      if (userData.role === 'allocator') {
        setIsAllocatorUser(true);
        setAllocatorToken(token);
        // Check for pending approvals
        fetchPendingApprovalCount(token);
      }
      
      // Call the onLogin prop with token and userData
      onLogin(token, userData);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // FIXED: Fetch count of pending approval requests
  const fetchPendingApprovalCount = async (token) => {
    try {
      // FIXED: Added /allocators/ prefix to match backend endpoint
      const response = await fetch('https://taskapi.buildingindiadigital.com/allocators/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${token || allocatorToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals');
      }

      const data = await response.json();
      setPendingApprovalCount(data.length);
    } catch (error) {
      console.error('Error fetching approval count:', error);
    }
  };

  // Fetch pending approval requests for modal
  const fetchPendingApprovals = async () => {
    if (!allocatorToken) return;
    
    setApprovalLoading(true);
    setApprovalError('');
    
    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/allocators/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${allocatorToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending approvals');
      }

      const data = await response.json();
      setPendingApprovals(data);
      setPendingApprovalCount(data.length);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setApprovalError('Failed to load approval requests');
    } finally {
      setApprovalLoading(false);
    }
  };

  // Handle approval/rejection of employee requests
  const handleApprovalAction = async (employeeId, action) => {
    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/allocators/employee-approval', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${allocatorToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: employeeId,
          action: action
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} employee`);
      }

      // Remove the processed approval from the list
      setPendingApprovals(pendingApprovals.filter(approval => approval.employee_id !== employeeId));
      setPendingApprovalCount(prevCount => prevCount - 1);
      
      // Show success message (could add toast notification here)
      alert(`Employee ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error(`Error ${action}ing employee:`, error);
      setApprovalError(`Failed to ${action} employee: ${error.message}`);
    }
  };

  // Open approval modal and fetch data
  const openApprovalModal = () => {
    setShowApprovalModal(true);
    fetchPendingApprovals();
  };

  // Notification bell with badge for allocators
  const renderApprovalNotification = () => {
    if (isAllocatorUser && pendingApprovalCount > 0) {
      return (
        <div className="fixed top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-20">
          <button
            onClick={openApprovalModal}
            className="bg-slate-800 p-2 sm:p-3 rounded-full shadow-lg text-purple-400 hover:text-purple-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 relative hover:shadow-xl transform hover:-translate-y-1"
            aria-label="Pending Approval Notifications"
          >
            <FontAwesomeIcon icon={faBell} className="text-base sm:text-lg md:text-xl" />
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold animate-pulse">
              {pendingApprovalCount}
            </span>
          </button>
        </div>
      );
    }
    return null;
  };

  // Approval requests modal
  const renderApprovalModal = () => {
    if (!showApprovalModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-5 md:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-4 sm:mb-5">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center">
              <FontAwesomeIcon icon={faBell} className="mr-2 sm:mr-3 text-purple-400 text-sm sm:text-base" />
              <span className="hidden sm:inline">Pending Approvals</span>
              <span className="sm:hidden">Approvals</span>
            </h2>
            <button 
              onClick={() => setShowApprovalModal(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-700 p-1.5 sm:p-2 rounded-full transition-colors duration-300 transform hover:rotate-90"
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm sm:text-base" />
            </button>
          </div>

          {approvalError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 sm:p-4 rounded-lg mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm">{approvalError}</p>
            </div>
          )}

          {approvalLoading ? (
            <div className="flex justify-center py-8 sm:py-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-8 sm:py-10 text-slate-400">
              <p className="text-sm sm:text-base">No pending approval requests</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.request_id} className="border border-slate-600 rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 bg-slate-700 hover:bg-slate-600">
                  <div className="space-y-1.5 sm:space-y-2 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-slate-400 text-xs sm:text-sm sm:w-24 mb-1 sm:mb-0">Username:</span> 
                      <span className="font-semibold text-white text-sm sm:text-base break-all">{approval.employee_username}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-slate-400 text-xs sm:text-sm sm:w-24 mb-1 sm:mb-0">Email:</span> 
                      <span className="text-white text-sm break-all">{approval.employee_email}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-slate-400 text-xs sm:text-sm sm:w-24 mb-1 sm:mb-0">Requested:</span> 
                      <span className="text-slate-300 text-xs sm:text-sm">{new Date(approval.requested_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-3 sm:mt-4">
                    <button
                      onClick={() => handleApprovalAction(approval.employee_id, 'approve')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-md flex-1 text-sm sm:text-base"
                    >
                      <FontAwesomeIcon icon={faUserCheck} className="mr-1.5 sm:mr-2 text-sm" /> 
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleApprovalAction(approval.employee_id, 'reject')}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-md flex-1 text-sm sm:text-base"
                    >
                      <FontAwesomeIcon icon={faUserTimes} className="mr-1.5 sm:mr-2 text-sm" /> 
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 sm:mt-5 flex justify-end">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 sm:px-5 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700/20 via-slate-900/50 to-slate-900"></div>
      
      {/* Notification bell for allocators */}
      {renderApprovalNotification()}
      
      {/* Approval modal */}
      {renderApprovalModal()}
      
      {/* Bid Task Allocator Heading */}
      <div className="relative z-10 text-center mb-6">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
          <span style={{ color: '#FF6600' }}>B</span>
          <span style={{ color: '#1E3A8A' }}>i</span>
          <span style={{ color: '#22C55E' }}>D</span>
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
                  alt="Login Illustration" 
                  className="w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
              
              {/* Welcome Text */}
              <div className="text-center text-white relative z-10">
                <h2 className="text-xl lg:text-2xl font-bold mb-3">Welcome Back</h2>
                <p className="text-purple-100 text-sm lg:text-base opacity-90">Sign in to access your dashboard</p>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">LOGIN</h1>
                <p className="text-slate-400 text-sm">Sign in to your account</p>
              </div>

              {error && (
                <div className={`border px-3 sm:px-4 py-3 rounded-lg mb-4 sm:mb-6 ${approvalPending ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                  {approvalPending ? (
                    <div className="flex items-start">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 mt-1 text-amber-400 text-sm flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm">{error}</p>
                        <p className="text-xs mt-1 text-amber-300">An allocator will review your request soon.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-red-400 text-sm flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{error}</span>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="group">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-purple-400 transition-colors duration-300">
                      <FontAwesomeIcon icon={faUser} className="text-sm sm:text-base" />
                    </span>
                    <input
                      id="username"
                      type="text"
                      className="block w-full px-9 sm:px-10 py-2.5 sm:py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:border-purple-400 group-hover:bg-slate-700 text-sm sm:text-base placeholder-slate-400"
                      placeholder="USERNAME"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="group">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-purple-400 transition-colors duration-300">
                      <FontAwesomeIcon icon={faLock} className="text-sm sm:text-base" />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="block w-full px-9 sm:px-10 py-2.5 sm:py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:border-purple-400 group-hover:bg-slate-700 text-sm sm:text-base pr-12 placeholder-slate-400"
                      placeholder="PASSWORD"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white focus:outline-none"
                      onClick={togglePasswordVisibility}
                      tabIndex="-1"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm sm:text-base" />
                    </button>
                  </div>
                </div>

                <div className="group">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-purple-400 transition-colors duration-300">
                      <FontAwesomeIcon icon={faUserTag} className="text-sm sm:text-base" />
                    </span>
                    <select
                      id="role"
                      className="block w-full px-9 sm:px-10 py-2.5 sm:py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:border-purple-400 appearance-none group-hover:bg-slate-700 text-sm sm:text-base"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    >
                      <option value="" className="bg-slate-800">Select Role *</option>
                      <option value="client" className="bg-slate-800">Client</option>
                      <option value="allocator" className="bg-slate-800">Allocator</option>
                      <option value="employee" className="bg-slate-800">Employee</option>
                    </select>
                    {/* Custom arrow */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 ml-1">
                    Role selection is required for login
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3"></div>
                        <span>SIGNING IN...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faSignInAlt} className="mr-2 text-sm sm:text-base" />
                        <span>SUBMIT</span>
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 space-y-2 sm:space-y-0">
                  <a 
                    href="/forgot-password" 
                    className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors duration-300 underline"
                  >
                    FORGOT PASSWORD
                  </a>
                  
                  <a 
                    href="/register" 
                    className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 transition-colors duration-300 underline"
                  >
                    REGISTER
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
