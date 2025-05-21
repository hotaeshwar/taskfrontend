import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faTasks,
  faUsers,
  faBuilding,
  faSignOutAlt,
  faBars,
  faTimes,
  faClock,
  faStopwatch,
  faCalendarAlt,
  faChartLine,
  faSync,
  faMoneyBillWave,
  faChevronRight,
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ userData, onLogout, isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const [clockStatus, setClockStatus] = useState({
    isClocked: false,
    sessionStartTime: null,
    currentDuration: 0,
    sessionStartedAt: null
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Get current clock status on component mount
  useEffect(() => {
    if (userData?.role === 'employee') {
      fetchClockStatus();
    }
    
    // Check if we should collapse by default on smaller screens
    const checkScreenSize = () => {
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    // Initial check
    checkScreenSize();
    
    // Listen for window resize
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [userData]);

  // Update timer for active session and current time
  useEffect(() => {
    let timer;
    if (clockStatus.isClocked && clockStatus.sessionStartedAt) {
      timer = setInterval(() => {
        const now = new Date();
        setCurrentTime(now);
        setClockStatus(prev => ({
          ...prev,
          currentDuration: prev.currentDuration + (1/60)
        }));
      }, 1000);
    } else {
      timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [clockStatus.isClocked, clockStatus.sessionStartedAt]);

  const fetchClockStatus = async () => {
    setSyncLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch( 'https://task.trizenttechserve.in/employees/work-session/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch clock status');
      
      const data = await response.json();
      
      if (data.is_clocked_in && data.clock_in_time) {
        setClockStatus({
          isClocked: true,
          sessionStartTime: data.clock_in_time,
          currentDuration: data.current_duration_minutes || 0,
          sessionStartedAt: new Date()
        });
      } else {
        setClockStatus({
          isClocked: false,
          sessionStartTime: null,
          currentDuration: 0,
          sessionStartedAt: null
        });
      }
    } catch (error) {
      console.error('Error fetching clock status:', error);
      setErrorMsg('Failed to sync with server. Please try again.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (clockStatus.isClocked) {
        await fetchClockStatus();
        setLoading(false);
        return;
      }
      
      const response = await fetch('https://task.trizenttechserve.in/employees/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes: 'Clocked in from dashboard' })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to clock in';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
          if (errorMessage.includes("already have an active work session")) {
            await fetchClockStatus();
            setErrorMsg("Already clocked in. Status has been synced.");
          } else {
            throw new Error(errorMessage);
          }
        } catch (jsonError) {
          throw new Error(errorMessage);
        }
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setClockStatus({
        isClocked: true,
        sessionStartTime: data.clock_in,
        currentDuration: 0,
        sessionStartedAt: new Date()
      });
      
    } catch (error) {
      console.error('Error clocking in:', error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!clockStatus.isClocked) {
        await fetchClockStatus();
        setLoading(false);
        return;
      }
      
      const response = await fetch( 'https://task.trizenttechserve.in/employees/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes: 'Clocked out from dashboard' })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to clock out';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
          if (errorMessage.includes("No active work session")) {
            await fetchClockStatus();
            setErrorMsg("No active session found. Status has been synced.");
          } else {
            throw new Error(errorMessage);
          }
        } catch (jsonError) {
          throw new Error(errorMessage);
        }
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setClockStatus({
        isClocked: false,
        sessionStartTime: null,
        currentDuration: 0,
        sessionStartedAt: null
      });
    } catch (error) {
      console.error('Error clocking out:', error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes === undefined || minutes === null) return '0h 0m 0s';
    minutes = Math.max(0, minutes);
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return `${hours}h ${mins}m ${secs}s`;
  };

  const formatISTTime = (date) => {
    if (!date) return '';
    const options = { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true
    };
    return new Intl.DateTimeFormat('en-IN', options).format(date);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'bg-indigo-700' : '';
  };

  const handleToggleClockStatus = () => {
    if (clockStatus.isClocked) {
      handleClockOut();
    } else {
      handleClockIn();
    }
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const handleMouseEnter = () => {
    if (isCollapsed && window.innerWidth >= 768) {
      setIsHovering(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (isCollapsed) {
      setIsHovering(false);
    }
  };

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 bg-gradient-to-b from-indigo-900 to-indigo-950 text-white transform transition-all duration-300 ease-in-out z-50 flex flex-col shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isCollapsed && !isHovering ? 'w-20' : 'w-64'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Collapse toggle button (only visible on desktop) */}
        <button 
          className="absolute -right-3 top-20 w-6 h-12 bg-indigo-600 text-white rounded-r-md hidden md:flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg"
          onClick={toggleCollapse}
        >
          <FontAwesomeIcon icon={isCollapsed && !isHovering ? faChevronRight : faChevronLeft} size="xs" />
        </button>
        
        {/* Close button for mobile */}
        <button 
          className="lg:hidden absolute top-4 right-4 text-white"
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>
        
        {/* Company Logo/Name */}
        <div className="h-16 flex items-center justify-center border-b border-indigo-800 bg-indigo-950 relative overflow-hidden">
          {isCollapsed && !isHovering ? (
            <h1 className="text-2xl font-bold text-white">B</h1>
          ) : (
            <h1 className="text-xl font-bold flex items-center">
              <span className="text-white">BID</span>
              <span className="text-indigo-200 ml-2 hidden sm:inline">Task Allocator</span>
            </h1>
          )}
        </div>
        
        {/* Main Navigation */}
        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-indigo-900">
          {/* Clock In/Out Section (Only for Employees) */}
          {userData?.role === 'employee' && !(isCollapsed && !isHovering) && (
            <div className={`p-4 mb-3 mx-2 mt-4 rounded-lg transition-colors duration-300 ${
              clockStatus.isClocked ? 'bg-emerald-800 bg-opacity-40' : 'bg-indigo-950 bg-opacity-60'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs text-indigo-300 font-semibold">WORK TRACKING</h3>
                <div className="text-xs font-mono text-gray-300 flex items-center">
                  <span className="mr-1">{formatISTTime(currentTime)}</span>
                  <button 
                    onClick={fetchClockStatus} 
                    disabled={syncLoading}
                    className="text-indigo-300 hover:text-white transition-colors ml-1"
                    title="Sync with server"
                  >
                    <FontAwesomeIcon icon={faSync} className={syncLoading ? 'animate-spin' : ''} size="xs" />
                  </button>
                </div>
              </div>
              
              {errorMsg && (
                <div className="mb-2 text-center text-xs text-red-300 bg-red-900 bg-opacity-25 p-1 rounded">
                  {errorMsg}
                  <button 
                    onClick={() => setErrorMsg(null)} 
                    className="ml-2 text-red-300 hover:text-white"
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {clockStatus.isClocked ? (
                <div className="mb-3">
                  <div className="flex items-center justify-center gap-2 mb-2 text-emerald-400">
                    <FontAwesomeIcon icon={faStopwatch} className="animate-pulse" />
                    <span className="text-xs font-medium">CURRENTLY WORKING</span>
                  </div>
                  <div className="text-center text-sm text-white">
                    <span className="font-mono">{formatDuration(clockStatus.currentDuration)}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-3 text-center text-gray-300 text-sm">
                  <span>Not clocked in</span>
                </div>
              )}
              
              <button
                onClick={handleToggleClockStatus}
                disabled={loading || syncLoading}
                className={`w-full py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2
                  ${clockStatus.isClocked 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }
                  ${(loading || syncLoading) ? 'opacity-70 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}
                `}
              >
                <FontAwesomeIcon icon={clockStatus.isClocked ? faTimes : faClock} />
                <span>
                  {loading ? 'Processing...' : (clockStatus.isClocked ? 'Clock Out' : 'Clock In')}
                </span>
              </button>
            </div>
          )}
          
          {/* Collapsed state mini clock for employees */}
          {userData?.role === 'employee' && isCollapsed && !isHovering && (
            <div className={`p-2 my-4 mx-auto rounded-lg transition-colors duration-300 w-14 ${
              clockStatus.isClocked ? 'bg-emerald-800 bg-opacity-40' : 'bg-indigo-950 bg-opacity-60'
            }`}>
              <button
                onClick={handleToggleClockStatus}
                disabled={loading || syncLoading}
                className={`w-full h-14 rounded-md flex items-center justify-center
                  ${clockStatus.isClocked 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }
                  ${(loading || syncLoading) ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg'}
                `}
                title={clockStatus.isClocked ? 'Clock Out' : 'Clock In'}
              >
                <FontAwesomeIcon icon={clockStatus.isClocked ? faTimes : faClock} size="lg" />
              </button>
            </div>
          )}
          
          {/* Navigation Links */}
          <nav className="mt-2">
            <ul>
              <li>
                <Link 
                  to="/dashboard" 
                  className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors ${isActive('/dashboard')} ${isCollapsed && !isHovering ? 'justify-center' : 'px-6'}`}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                >
                  <FontAwesomeIcon icon={faTachometerAlt} className={`${isCollapsed && !isHovering ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                  {(!isCollapsed || isHovering) && <span className="text-sm">Dashboard</span>}
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/tasks" 
                  className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors ${isActive('/tasks')} ${isCollapsed && !isHovering ? 'justify-center' : 'px-6'}`}
                  onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                >
                  <FontAwesomeIcon icon={faTasks} className={`${isCollapsed && !isHovering ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                  {(!isCollapsed || isHovering) && <span className="text-sm">Tasks</span>}
                </Link>
              </li>
              
              {/* Show Time Tracking link only to Employees */}
              {userData?.role === 'employee' && (
                <li>
                  <Link 
                    to="/time-tracking" 
                    className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors ${isActive('/time-tracking')} ${isCollapsed && !isHovering ? 'justify-center' : 'px-6'}`}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} className={`${isCollapsed && !isHovering ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                    {(!isCollapsed || isHovering) && <span className="text-sm">Time History</span>}
                  </Link>
                </li>
              )}
              
              {/* Show Employees link only to Allocators */}
              {userData?.role === 'allocator' && (
                <li>
                  <Link 
                    to="/employees" 
                    className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors ${isActive('/employees')} ${isCollapsed && !isHovering ? 'justify-center' : 'px-6'}`}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  >
                    <FontAwesomeIcon icon={faUsers} className={`${isCollapsed && !isHovering ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                    {(!isCollapsed || isHovering) && <span className="text-sm">Employees</span>}
                  </Link>
                </li>
              )}
              
              {/* Show Payroll Management link only to Allocators */}
              {userData?.role === 'allocator' && (
                <li>
                  <Link 
                    to="/attendance" 
                    className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors ${isActive('/attendance')} ${isCollapsed && !isHovering ? 'justify-center' : 'px-6'}`}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  >
                    <FontAwesomeIcon icon={faMoneyBillWave} className={`${isCollapsed && !isHovering ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                    {(!isCollapsed || isHovering) && <span className="text-sm">Payroll Management</span>}
                  </Link>
                </li>
              )}
              
              {/* Show Employee Work Reports only to Allocators */}
              {userData?.role === 'allocator' && (
                <li>
                  <Link 
                    to="/work-reports" 
                    className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors ${isActive('/work-reports')} ${isCollapsed && !isHovering ? 'justify-center' : 'px-6'}`}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  >
                    <FontAwesomeIcon icon={faChartLine} className={`${isCollapsed && !isHovering ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                    {(!isCollapsed || isHovering) && <span className="text-sm">Work Reports</span>}
                  </Link>
                </li>
              )}
              
              {/* Show Clients link only to Allocators */}
              {userData?.role === 'allocator' && (
                <li>
                  <Link 
                    to="/clients" 
                    className={`flex items-center px-4 py-3 hover:bg-indigo-700 transition-colors ${isActive('/clients')} ${isCollapsed && !isHovering ? 'justify-center' : 'px-6'}`}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                  >
                    <FontAwesomeIcon icon={faBuilding} className={`${isCollapsed && !isHovering ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
                    {(!isCollapsed || isHovering) && <span className="text-sm">Clients</span>}
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
        
        {/* Logout Button */}
        <div className="border-t border-indigo-800 mt-auto">
          <button 
            onClick={onLogout}
            className={`flex items-center py-4 w-full hover:bg-indigo-700 transition-colors ${isCollapsed && !isHovering ? 'justify-center px-4' : 'px-6'}`}
          >
            <FontAwesomeIcon icon={faSignOutAlt} className={`${isCollapsed && !isHovering ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`} />
            {(!isCollapsed || isHovering) && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>
      
      {/* Main content padding adjustment based on sidebar state */}
      <style jsx>{`
        /* Custom scrollbar styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-thumb-indigo-700::-webkit-scrollbar-thumb {
          background-color: #4338ca;
          border-radius: 2px;
        }

        .scrollbar-track-indigo-900::-webkit-scrollbar-track {
          background-color: #312e81;
        }
        
        /* Animation delay for blob animations */
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Transition timing for sidebar expand/collapse */
        .sidebar-transition {
          transition: width 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default Sidebar;