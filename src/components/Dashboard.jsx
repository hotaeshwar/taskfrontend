import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTasks,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faCalendarDay,
  faClock,
  faBuilding,
  faStopwatch,
  faUserClock,
  faUsers,
  faChartLine,
  faCalendarWeek,
  faPlayCircle,
  faPauseCircle,
  faListAlt,
  faClipboardList,
  faUserPlus,
  faUserCheck,
  faUserTimes,
  faBell,
  faUser,
  faMoneyBillWave,
  faFileInvoiceDollar,
  faHistory,
  faCalendarAlt,
  faReceipt,
  faTrash,
  faEye,
  faChevronDown,
  faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import Header from './Header';
import Loader from './Loader';

const Dashboard = ({ userData, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [clientTasks, setClientTasks] = useState({});
  const [employeeTasks, setEmployeeTasks] = useState({});
  const [allTasks, setAllTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [timesheetData, setTimesheetData] = useState([]);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState(null);
  const [showPayrollDetail, setShowPayrollDetail] = useState(false);
  const [timesheetStartDate, setTimesheetStartDate] = useState('');
  const [timesheetEndDate, setTimesheetEndDate] = useState('');
  // State for allocator viewing employee timesheets
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [allocatorViewingEmployeeTimesheets, setAllocatorViewingEmployeeTimesheets] = useState(false);
  const [employeeTimesheetData, setEmployeeTimesheetData] = useState([]);
  const [deleteBeforeDate, setDeleteBeforeDate] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // States for collapsible timesheet entries
  const [expandedDays, setExpandedDays] = useState({});
  const [expandedEmployeeDays, setExpandedEmployeeDays] = useState({});

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle function for employee timesheet day
  const toggleDayExpanded = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Toggle function for allocator viewing employee timesheets
  const toggleEmployeeDayExpanded = (date) => {
    setExpandedEmployeeDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };
  
  // Initialize all days as expanded when data is loaded
  useEffect(() => {
    const initialExpandedState = {};
    timesheetData.forEach(day => {
      initialExpandedState[day.date] = true; // Default to expanded
    });
    setExpandedDays(initialExpandedState);
  }, [timesheetData]);

  // Initialize all employee days as expanded when data is loaded
  useEffect(() => {
    const initialExpandedState = {};
    employeeTimesheetData.forEach(day => {
      initialExpandedState[day.date] = true; // Default to expanded
    });
    setExpandedEmployeeDays(initialExpandedState);
  }, [employeeTimesheetData]);

  // Approval handler function
  const handleApprovalAction = async (employeeId, action) => {
    try {
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const response = await fetch('https://taskapi.buildingindiadigital.com/allocators/employee-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: employeeId,
          action: action // This should be either "approve" or "reject"
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} employee`);
      }

      // Handle successful response
      const data = await response.json();
      console.log(`Employee ${action}d successfully:`, data);
      
      const pendingResponse = await fetch('https://taskapi.buildingindiadigital.com/allocators/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingApprovals(pendingData);
      }
      
      // Show success message
      alert(`Employee ${action}d successfully`);
      
    } catch (error) {
      console.error(`Error handling ${action}:`, error);
      alert(`Error ${action}ing employee: ${error.message}`);
    }
  };

  // Function to fetch all employees for allocator
  const fetchEmployees = async () => {
    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Function for allocator to view employee timesheets
  const fetchEmployeeTimesheets = async (employeeId, startDate = null, endDate = null) => {
    try {
      let url =  `https://taskapi.buildingindiadigital.com/allocators/employee/${employeeId}/timesheets`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee timesheet data');
      }

      const data = await response.json();
      setEmployeeTimesheetData(data);
    } catch (error) {
      console.error('Error fetching employee timesheet data:', error);
      setEmployeeTimesheetData([]);
    }
  };

  // Function for allocator to clear employee timesheets
  const clearEmployeeTimesheets = async (employeeId, beforeDate) => {
    if (!beforeDate || !employeeId) {
      showNotificationMessage('Please select a date and employee');
      return;
    }

    if (!confirm(`Are you sure you want to delete all timesheet entries before ${beforeDate} for this employee?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // FIXED: Pass before_date as a query parameter
      const response = await fetch( `https://taskapi.buildingindiadigital.com/allocators/employee/${employeeId}/timesheets?before_date=${beforeDate}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear timesheet data');
      }

      const data = await response.json();
      showNotificationMessage(data.message);
      
      // Refresh the employee's timesheet data
      await fetchEmployeeTimesheets(employeeId, timesheetStartDate, timesheetEndDate);
    } catch (error) {
      console.error('Error clearing timesheet data:', error);
      showNotificationMessage(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Function for employee to delete their own old timesheets
  const deleteOwnTimesheets = async (beforeDate) => {
    if (!beforeDate) {
      showNotificationMessage('Please select a date');
      return;
    }

    if (!confirm(`Are you sure you want to delete all your timesheet entries before ${beforeDate}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Make the DELETE request with the date as a query parameter
      const response = await fetch( `https://taskapi.buildingindiadigital.com/employees/timesheets?before_date=${beforeDate}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Log the response for debugging
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to delete timesheet data');
      }

      // Parse the response
      const data = await response.json();
      console.log('Delete response data:', data);
      
      // Show success message
      showNotificationMessage(data.message || 'Records deleted successfully');
      
      // Force UI update by clearing the data
      setTimesheetData([]);
      
      // Add a small delay before refreshing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch fresh data
      await fetchTimesheetData();
      
    } catch (error) {
      console.error('Error deleting timesheet data:', error);
      showNotificationMessage(`Error: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeSimple = (minutes) => {
    if (minutes === undefined || minutes === null) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format((amount || 0) * 75); // Assuming 1 USD = 75 INR
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateLiveDuration = useCallback((clockInTime) => {
    if (!clockInTime) return 0;
    const clockIn = new Date(clockInTime);
    const diffMs = currentTime - clockIn;
    return Math.floor(diffMs / 60000);
  }, [currentTime]);

  // Transform API data to match the expected format in your UI
  const fetchPayrollRecords = async () => {
    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/employees/payroll', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payroll records');
      }

      const apiData = await response.json();
      console.log('Raw API data:', apiData); // Log raw data for debugging
      
      // Transform the data to match what your UI expects
      const transformedData = apiData.map(record => {
        // Calculate values that UI expects based on API data
        const regular_hours = record.total_minutes / 60;
        const overtime_hours = record.overtime_minutes / 60;
        const gross_pay = record.calculated_salary;
        
        // Assume tax is 10% of gross for this example - adjust as needed
        const tax_deductions = gross_pay * 0.1;
        
        // Calculate net pay (you might need to adjust this based on your actual calculation)
        const net_pay = gross_pay - tax_deductions;
        
        // Get period name if available
        const pay_period = record.period ? record.period.name : `Period ${record.period_id}`;
        
        return {
          id: record.id,
          period_id: record.period_id,
          pay_period: pay_period,
          regular_hours: regular_hours.toFixed(2),
          overtime_hours: overtime_hours.toFixed(2),
          hourly_rate: record.hourly_rate,
          gross_pay: record.calculated_salary,
          tax_deductions: tax_deductions,
          benefits_deductions: 0, // Set default or calculate if available
          other_deductions: record.undertime_deduction || 0,
          net_pay: net_pay,
          payment_date: record.created_at, // Or use a specific payment date if available
          status: record.status
        };
      });
      
      console.log('Transformed data:', transformedData);
      setPayrollRecords(transformedData);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      setPayrollRecords([]);
    }
  };

  const fetchPayrollDetail = async (periodId) => {
    try {
      const response = await fetch(`https://taskapi.buildingindiadigital.com/employees/payroll/${periodId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payroll detail');
      }

      const apiData = await response.json();
      console.log('Raw payroll detail:', apiData);
      
      // Transform to match UI expectations
      const transformedData = {
        id: apiData.id,
        period_id: apiData.period_id,
        pay_period: apiData.period ? apiData.period.name : `Period ${apiData.period_id}`,
        regular_hours: (apiData.total_minutes / 60).toFixed(2),
        overtime_hours: (apiData.overtime_minutes / 60).toFixed(2),
        hourly_rate: apiData.hourly_rate,
        gross_pay: apiData.calculated_salary,
        tax_deductions: apiData.calculated_salary * 0.1, // Example tax calculation
        benefits_deductions: 0,
        other_deductions: apiData.undertime_deduction || 0,
        net_pay: apiData.calculated_salary * 0.9, // Example - adjust based on your deductions
        payment_date: apiData.created_at,
        status: apiData.status,
        notes: "" // Add notes if available in API
      };
      
      console.log('Transformed detail:', transformedData);
      setSelectedPayPeriod(transformedData);
      setShowPayrollDetail(true);
    } catch (error) {
      console.error('Error fetching payroll detail:', error);
    }
  };

  const fetchTimesheetData = async (startDate = null, endDate = null) => {
    try {
      let url = 'https://taskapi.buildingindiadigital.com/employees/timesheets';
      const params = new URLSearchParams();
      
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch timesheet data');
      }

      const data = await response.json();
      setTimesheetData(data);
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
    }
  };

  const handleTimesheetFilter = (e) => {
    e.preventDefault();
    fetchTimesheetData(timesheetStartDate, timesheetEndDate);
  };

  const showNotificationMessage = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const endpoint = userData.role === 'allocator'
        ? 'https://taskapi.buildingindiadigital.com/allocators/dashboard'
        : 'https://taskapi.buildingindiadigital.com/employees/dashboard'
;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data. Status: ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data);

      if (userData.role === 'employee') {
        await fetchPayrollRecords();
        await fetchTimesheetData();
      }

      if (userData.role === 'allocator') {
        try {
          const approvalsResponse = await fetch('https://taskapi.buildingindiadigital.com/allocators/pending-approvals', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (approvalsResponse.ok) {
            const approvalsData = await approvalsResponse.json();
            setPendingApprovals(approvalsData);

            if (approvalsData.length > 0 && pendingApprovals.length !== approvalsData.length) {
              showNotificationMessage(`You have ${approvalsData.length} pending employee approvals`);
            }
          }
          
          // Fetch employees for the allocator
          await fetchEmployees();
        } catch (error) {
          console.error('Error fetching pending approvals:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    const fetchData = () => {
      if (userData) {
        fetchDashboardData();
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [userData, fetchDashboardData]);

  // Collapsible Timesheet Day Component
  const TimesheetDay = ({ day, isExpanded, onToggle }) => (
    <div key={day.date} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-4 transition-all duration-300">
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 px-3 sm:px-4 py-2 sm:py-3 border-l-4 border-indigo-500 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
        onClick={() => onToggle(day.date)}
      >
        <div className="flex items-center mb-1 sm:mb-0">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-indigo-500 mr-2" />
          <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base">
            {new Date(day.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h4>
        </div>
        <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
          <span className="bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium mr-2">
            Total: {formatTimeSimple(day.total_minutes)}
          </span>
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronUp : faChevronDown} 
            className="text-indigo-500 dark:text-indigo-400 transition-transform duration-300" 
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700 transition-all duration-500 ease-in-out">
          {day.sessions.map((session) => (
            <div key={session.id} className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faClock} className="text-indigo-500 mr-2 text-sm sm:text-base" />
                  <span className="text-xs sm:text-sm text-black dark:text-gray-300">{new Date(session.clock_in).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center mt-1 sm:mt-0">
                  <FontAwesomeIcon icon={faStopwatch} className="text-gray-500 mr-2 text-sm sm:text-base" />
                  <span className="text-xs sm:text-sm text-black dark:text-gray-300">{new Date(session.clock_out).toLocaleTimeString()}</span>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 sm:px-3 py-1 rounded-full text-xs w-fit mt-2 mb-2">
                Duration: {formatTimeSimple(session.duration_minutes)}
              </div>
              
              {session.notes && (
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-black dark:text-gray-300 mt-2">
                  <span className="font-medium text-black dark:text-gray-200">Notes:</span> {session.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:text-white transition-all duration-300">
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-fadeIn max-w-[90%] sm:max-w-md">
          <div className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl flex items-center transform hover:scale-105 transition-transform duration-300">
            <FontAwesomeIcon icon={faBell} className="mr-2 sm:mr-3 text-yellow-300 text-lg sm:text-xl animate-pulse" />
            <span className="font-semibold text-sm sm:text-base">{notificationMessage}</span>
          </div>
        </div>
      )}

      <Sidebar
        userData={userData}
        onLogout={onLogout}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Header userData={userData} toggleSidebar={toggleSidebar} />

        <main className="flex-grow p-2 sm:p-3 md:p-4 lg:p-6 transition-all">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">Dashboard</h2>
            <div className="px-2 sm:px-3 py-1 bg-white dark:bg-gray-800 rounded-full shadow-md text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Last updated: {currentTime.toLocaleTimeString()}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg shadow-lg animate-fadeIn">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faTimesCircle} className="mr-3 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          ) : dashboardData ? (
            <>
              {userData.role === 'allocator' && (
                <>
                  {pendingApprovals.length > 0 && (
                    <div className="mb-6 sm:mb-8 animate-slideInUp">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 flex items-center">
                        <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mr-3">
                          <FontAwesomeIcon icon={faUserPlus} />
                        </div>
                        Pending Employee Approvals
                        <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-500 text-white">{pendingApprovals.length}</span>
                      </h3>

                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                              <tr>
                                <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Employee
                                </th>
                                <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  <span className="hidden sm:inline">Requested At</span>
                                  <span className="sm:hidden">Date</span>
                                </th>
                                <th scope="col" className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {pendingApprovals.map((request) => (
                                <tr key={request.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faUser} className="text-indigo-500 dark:text-indigo-300" />
                                      </div>
                                      <div className="ml-3 sm:ml-4">
                                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                                          {request.employee_username}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {request.employee_email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    <span className="hidden sm:inline">{new Date(request.requested_at).toLocaleString()}</span>
                                    <span className="sm:hidden">{new Date(request.requested_at).toLocaleDateString()}</span>
                                  </td>
                                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <button
                                        onClick={() => handleApprovalAction(request.employee_id, 'approve')}
                                        className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 sm:px-3 py-1 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex items-center justify-center"
                                      >
                                        <FontAwesomeIcon icon={faUserCheck} className="mr-1" />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleApprovalAction(request.employee_id, 'reject')}
                                        className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 sm:px-3 py-1 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center justify-center"
                                      >
                                        <FontAwesomeIcon icon={faUserTimes} className="mr-1" />
                                        Reject
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Employee Timesheet Viewer for Allocators */}
                  <div className="mb-6 sm:mb-8 animate-fadeIn">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 flex items-center">
                      <div className="p-2 rounded-md bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 mr-3">
                        <FontAwesomeIcon icon={faHistory} />
                      </div>
                      Employee Timesheets
                    </h3>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 mb-6 border border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                        <div className="col-span-1 md:col-span-2 lg:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Employee</label>
                          <select 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={selectedEmployeeId || ''}
                            onChange={(e) => {
                              const id = e.target.value;
                              setSelectedEmployeeId(id);
                              if (id) {
                                const emp = employees.find(e => e.id.toString() === id);
                                setSelectedEmployeeName(emp ? emp.username : '');
                                fetchEmployeeTimesheets(id, timesheetStartDate, timesheetEndDate);
                                setAllocatorViewingEmployeeTimesheets(true);
                              } else {
                                setAllocatorViewingEmployeeTimesheets(false);
                              }
                            }}
                          >
                            <option value="">Select an employee</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.username}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
                          <input 
                            type="date" 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                            value={timesheetStartDate}
                            onChange={(e) => setTimesheetStartDate(e.target.value)}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
                          <input 
                            type="date" 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                            value={timesheetEndDate}
                            onChange={(e) => setTimesheetEndDate(e.target.value)}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 opacity-0">Action</label>
                          <button
                            onClick={() => {
                              if (selectedEmployeeId) {
                                fetchEmployeeTimesheets(selectedEmployeeId, timesheetStartDate, timesheetEndDate);
                              } else {
                                showNotificationMessage('Please select an employee first');
                              }
                            }}
                            className="w-full p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center text-sm"
                          >
                            <FontAwesomeIcon icon={faEye} className="mr-2" />
                            View Timesheets
                          </button>
                        </div>
                      </div>

                      {/* Delete timesheet section */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2 text-sm">Delete Old Timesheet Entries</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delete Records Before</label>
                            <input 
                              type="date" 
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                              value={deleteBeforeDate}
                              onChange={(e) => setDeleteBeforeDate(e.target.value)}
                            />
                          </div>
                          <div className="sm:col-span-1">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 opacity-0">Action</label>
                            <button
                              onClick={() => {
                                if (selectedEmployeeId) {
                                  clearEmployeeTimesheets(selectedEmployeeId, deleteBeforeDate);
                                } else {
                                  showNotificationMessage('Please select an employee first');
                                }
                              }}
                              disabled={isDeleting}
                              className="w-full p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg flex items-center justify-center text-sm"
                            >
                              {isDeleting ? (
                                <Loader small />
                              ) : (
                                <>
                                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                  Delete Old Records
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Display employee timesheet data with collapsible sections */}
                    {allocatorViewingEmployeeTimesheets && (
                      <div className="animate-fadeIn">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                          <h4 className="text-sm md:text-md font-medium text-gray-800 dark:text-gray-200 flex items-center mb-2 sm:mb-0">
                            <FontAwesomeIcon icon={faUser} className="mr-2 text-indigo-500" />
                            Timesheets for: {selectedEmployeeName}
                          </h4>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => {
                                const newState = {};
                                employeeTimesheetData.forEach(day => {
                                  newState[day.date] = true;
                                });
                                setExpandedEmployeeDays(newState);
                              }}
                              className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                            >
                              Expand All
                            </button>
                            <button 
                              onClick={() => {
                                const newState = {};
                                employeeTimesheetData.forEach(day => {
                                  newState[day.date] = false;
                                });
                                setExpandedEmployeeDays(newState);
                              }}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              Collapse All
                            </button>
                          </div>
                        </div>

                        {employeeTimesheetData.length > 0 ? (
                          <div className="space-y-4">
                            {employeeTimesheetData.map((day) => (
                              <TimesheetDay 
                                key={day.date}
                                day={day}
                                isExpanded={expandedEmployeeDays[day.date] !== false} // Default to expanded
                                onToggle={toggleEmployeeDayExpanded}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 md:p-8 text-center shadow-lg">
                            <FontAwesomeIcon icon={faReceipt} className="text-gray-300 dark:text-gray-600 text-3xl sm:text-4xl md:text-5xl mb-3" />
                            <p className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400">No timesheet data found for this employee</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-6 sm:mb-8 animate-fadeIn">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 flex items-center">
                      <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mr-3">
                        <FontAwesomeIcon icon={faUserClock} />
                      </div>
                      Employee Work Status
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-5 border-t-4 border-green-500 hover:shadow-xl transition-shadow transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm sm:text-base">Currently Working</h4>
                          <span className="px-2 sm:px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium animate-pulse">Live</span>
                        </div>
                        <div className="flex items-center">
                          <div className="p-3 sm:p-4 rounded-full bg-green-100 dark:bg-green-900 text-green-500 dark:text-green-300 mr-3 sm:mr-4">
                            <FontAwesomeIcon icon={faStopwatch} className="text-base sm:text-lg" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active employees</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text bg-gradient-to-br from-green-500 to-teal-400">
                              {dashboardData.currently_working_employees || 0}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              out of {dashboardData.total_employees || 0} total
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-5 border-t-4 border-blue-500 hover:shadow-xl transition-shadow transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm sm:text-base">Total Work Today</h4>
                          <span className="px-2 sm:px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">Today</span>
                        </div>
                        <div className="flex items-center">
                          <div className="p-3 sm:p-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-300 mr-3 sm:mr-4">
                            <FontAwesomeIcon icon={faChartLine} className="text-base sm:text-lg" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Team time worked</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text bg-gradient-to-br from-blue-500 to-indigo-400">
                              {formatTimeSimple(dashboardData.total_today_minutes_worked || 0)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatTimeSimple(dashboardData.average_work_minutes_today || 0)} avg per employee
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 sm:mb-8 animate-fadeIn">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 flex items-center">
                      <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-3">
                        <FontAwesomeIcon icon={faTasks} />
                      </div>
                      Task Statistics
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-5 border-l-4 border-yellow-500 hover:shadow-xl transition-all transform hover:-translate-y-1">
                        <div className="flex items-center">
                          <div className="p-2 sm:p-3 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-500 dark:text-yellow-300 mr-3 sm:mr-4">
                            <FontAwesomeIcon icon={faHourglassHalf} className="text-base sm:text-lg" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pending Tasks</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-700 dark:text-gray-100">{dashboardData.pending_tasks || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-5 border-l-4 border-blue-500 hover:shadow-xl transition-all transform hover:-translate-y-1">
                        <div className="flex items-center">
                          <div className="p-2 sm:p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-500 dark:text-blue-300 mr-3 sm:mr-4">
                            <FontAwesomeIcon icon={faTasks} className="text-base sm:text-lg" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Awaiting Review</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-700 dark:text-gray-100">
                              {dashboardData.completed_tasks_awaiting_review || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-5 border-l-4 border-green-500 hover:shadow-xl transition-all transform hover:-translate-y-1">
                        <div className="flex items-center">
                          <div className="p-2 sm:p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-500 dark:text-green-300 mr-3 sm:mr-4">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-base sm:text-lg" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Approved Tasks</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-700 dark:text-gray-100">{dashboardData.approved_tasks || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-5 border-l-4 border-red-500 hover:shadow-xl transition-all transform hover:-translate-y-1">
                        <div className="flex items-center">
                          <div className="p-2 sm:p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 mr-3 sm:mr-4">
                            <FontAwesomeIcon icon={faTimesCircle} className="text-base sm:text-lg" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Rejected Tasks</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-700 dark:text-gray-100">{dashboardData.rejected_tasks || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {userData.role === 'employee' && (
                <>
                  <div className="mb-6 sm:mb-8 animate-fadeIn">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex flex-col sm:flex-row items-start sm:items-center">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mr-3">
                          <FontAwesomeIcon icon={faReceipt} />
                        </div>
                        <span>Timesheet History</span>
                      </div>
                      <div className="ml-0 sm:ml-auto w-full sm:w-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap mb-1">From:</span>
                            <input
                              type="date"
                              value={timesheetStartDate}
                              onChange={(e) => setTimesheetStartDate(e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-2 py-1 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap mb-1">To:</span>
                            <input
                              type="date"
                              value={timesheetEndDate}
                              onChange={(e) => setTimesheetEndDate(e.target.value)}
                              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg px-2 py-1 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={handleTimesheetFilter}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-lg text-xs transition-colors flex items-center justify-center"
                            >
                              <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
                              <span>Filter</span>
                            </button>
                            <button
                              onClick={() => {
                                setTimesheetStartDate('');
                                setTimesheetEndDate('');
                                fetchTimesheetData();
                              }}
                              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg text-xs transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    </h3>

                    {/* Delete old timesheets section for employees */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-100 dark:border-gray-700">
                      <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2 text-sm">Delete Old Timesheet Entries</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delete Records Before</label>
                          <input 
                            type="date" 
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                            value={deleteBeforeDate}
                            onChange={(e) => setDeleteBeforeDate(e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 opacity-0">Action</label>
                          <button
                            onClick={() => deleteOwnTimesheets(deleteBeforeDate)}
                            disabled={isDeleting}
                            className="w-full p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg flex items-center justify-center text-sm"
                          >
                            {isDeleting ? (
                              <Loader small />
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                Delete Old Records
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Employee Timesheet section with collapsible days */}
                    <div className="mb-2 flex justify-end space-x-2">
                      <button 
                        onClick={() => {
                          const newState = {};
                          timesheetData.forEach(day => {
                            newState[day.date] = true;
                          });
                          setExpandedDays(newState);
                        }}
                        className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                      >
                        Expand All
                      </button>
                      <button 
                        onClick={() => {
                          const newState = {};
                          timesheetData.forEach(day => {
                            newState[day.date] = false;
                          });
                          setExpandedDays(newState);
                        }}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Collapse All
                      </button>
                    </div>

                    {timesheetData.length > 0 ? (
                      <div className="space-y-4">
                        {timesheetData.map((day) => (
                          <TimesheetDay 
                            key={day.date}
                            day={day}
                            isExpanded={expandedDays[day.date] !== false} // Default to expanded
                            onToggle={toggleDayExpanded}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 md:p-8 text-center shadow-lg">
                        <FontAwesomeIcon icon={faReceipt} className="text-gray-300 dark:text-gray-600 text-3xl sm:text-4xl md:text-5xl mb-3" />
                        <p className="text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400">No timesheet data found for the selected period</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg shadow-md animate-pulse">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faBell} className="mr-3 text-yellow-500" />
                <p className="text-sm sm:text-base">No dashboard data available. Please check your connection to the server.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;