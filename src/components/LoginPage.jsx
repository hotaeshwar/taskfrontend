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

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    if (role) {
      formData.append('role', role);
    }

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

  // Fetch count of pending approval requests
  const fetchPendingApprovalCount = async (token) => {
    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/pending-approvals', {
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
        <div className="absolute top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 z-20">
          <button
            onClick={openApprovalModal}
            className="bg-white p-3 rounded-full shadow-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 relative hover:shadow-xl transform hover:-translate-y-1"
            aria-label="Pending Approval Notifications"
          >
            <FontAwesomeIcon icon={faBell} className="text-lg md:text-xl" />
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
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
      <div className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-5 md:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl border border-indigo-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faBell} className="mr-3 text-indigo-500" />
              Pending Approvals
            </h2>
            <button 
              onClick={() => setShowApprovalModal(false)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors duration-300 transform hover:rotate-90"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {approvalError && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-lg mb-4">
              {approvalError}
            </div>
          )}

          {approvalLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No pending approval requests
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.request_id} className="border border-gray-100 rounded-xl p-4 hover:shadow-lg transition-all duration-300 bg-white hover:bg-indigo-50">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-500 w-24">Username:</span> 
                      <span className="font-semibold text-gray-800">{approval.employee_username}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-500 w-24">Email:</span> 
                      <span className="text-gray-800">{approval.employee_email}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-500 w-24">Requested:</span> 
                      <span className="text-gray-600 text-sm">{new Date(approval.requested_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => handleApprovalAction(approval.employee_id, 'approve')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-md flex-1"
                    >
                      <FontAwesomeIcon icon={faUserCheck} className="mr-2" /> Approve
                    </button>
                    <button
                      onClick={() => handleApprovalAction(approval.employee_id, 'reject')}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-md flex-1"
                    >
                      <FontAwesomeIcon icon={faUserTimes} className="mr-2" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-5 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative p-4 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Notification bell for allocators */}
      {renderApprovalNotification()}
      
      {/* Approval modal */}
      {renderApprovalModal()}
      
      <div className="bg-white bg-opacity-90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-gray-100 relative overflow-hidden transition-all duration-500 hover:shadow-indigo-200">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            BID Task Allocator
          </h1>
          <p className="text-gray-600 mt-2 font-medium">Sign in to your dashboard</p>
        </div>

        {error && (
          <div className={`border px-4 py-3 rounded-lg mb-6 ${approvalPending ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            {approvalPending ? (
              <div className="flex items-start">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 mt-1 text-amber-500" />
                <div>
                  <p className="text-sm">{error}</p>
                  <p className="text-xs mt-1 text-amber-600">An allocator will review your request soon.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-rose-500" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300">
                <FontAwesomeIcon icon={faUser} />
              </span>
              <input
                id="username"
                type="text"
                className="block w-full px-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="group">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="block w-full px-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 group-hover:bg-white"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none"
                onClick={togglePasswordVisibility}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          <div className="group">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-300">
                <FontAwesomeIcon icon={faUserTag} />
              </span>
              <select
                id="role"
                className="block w-full px-10 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all duration-300 hover:border-indigo-300 appearance-none group-hover:bg-white"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select Role (Optional)</option>
                <option value="client">Client</option>
                <option value="allocator">Allocator</option>
                <option value="employee">Employee</option>
              </select>
              {/* Custom arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 ml-1">
              Select your role to enhance security (optional)
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-300 transform hover:-translate-y-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link 
              to="/forgot-password" 
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-300 hover:underline cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                navigate('/forgot-password');
              }}
            >
              Forgot Password?
            </Link>
            
            <Link 
              to="/register" 
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors duration-300 hover:underline cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
            >
              Create Account
            </Link>
          </div>
        </form>
        
        {/* Bottom decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-70"></div>
      </div>
    </div>
  );
};

export default LoginPage;