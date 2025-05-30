import { useState, useEffect } from 'react';
import { faCalendarAlt, faCalculator, faLock, faUnlock, faClock, faMoneyBillWave, faList, faTimes, faHome, faEye, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';

// API base URL - update this to match your backend
const API_BASE_URL = 'https://taskapi.buildingindiadigital.com';

const Payroll = () => {
  const navigate = useNavigate();
  const [payrollPeriods, setPayrollPeriods] = useState([]);
  const [newPeriod, setNewPeriod] = useState({
    start_date: '',
    end_date: '',
    name: ''
  });
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isAllocator, setIsAllocator] = useState(true); // Will be determined by user role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [calculationParams, setCalculationParams] = useState({
    standard_monthly_hours: 160,
    overtime_multiplier: 1.5,
    apply_deductions: true
  });
  const [employeePayrollRecords, setEmployeePayrollRecords] = useState([]);
  const [employeeMap, setEmployeeMap] = useState({}); // Store employee info
  
  // Function to format numbers as INR
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get auth token from local storage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // API request headers with authentication
  const getRequestHeaders = () => {
    return {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    };
  };

  // Navigate back to home
  const goToHome = () => {
    navigate('/');
  };

  // Fetch all employees first to have their data available
  const fetchAllEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'GET',
        headers: getRequestHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const employeesData = await response.json();
      
      // Create a map of employee IDs to names
      const empMap = {};
      employeesData.forEach(emp => {
        empMap[emp.id] = emp.username || `Employee ${emp.id}`;
      });
      
      setEmployeeMap(empMap);
      console.log("Employee data loaded:", empMap);
      return empMap;
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employee data');
      return {};
    }
  };

  // Fetch payroll periods from the API
  const fetchPayrollPeriods = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/payroll/periods`, {
        method: 'GET',
        headers: getRequestHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Payroll periods data:", data);
      
      // Map API response to component state format
      const mappedPeriods = data.map(period => ({
        id: period.id,
        name: period.name,
        start_date: period.start_date,
        end_date: period.end_date,
        status: period.status,
        calculated: period.status === 'completed' || period.status === 'locked',
        locked: period.status === 'locked',
        amount: 0 // Will be updated when fetching period details
      }));
      
      setPayrollPeriods(mappedPeriods);
      setError('');
    } catch (err) {
      console.error('Error fetching payroll periods:', err);
      setError('Failed to fetch payroll periods: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch period details with improved error handling and logging
  const fetchPeriodDetails = async (periodId) => {
    try {
      setLoading(true);
      console.log(`Fetching details for period ${periodId}`);
      
      const response = await fetch(`${API_BASE_URL}/payroll/periods/${periodId}`, {
        method: 'GET',
        headers: getRequestHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const records = await response.json();
      console.log("Payroll records received:", records);
      
      if (!records || records.length === 0) {
        console.log("No payroll records found for this period");
        setEmployeePayrollRecords([]);
        setError('No payroll records found for this period');
        setLoading(false);
        return;
      }
      
      // Use the employee map we already fetched or fetch it now if needed
      let employeeNamesMap = employeeMap;
      if (Object.keys(employeeNamesMap).length === 0) {
        employeeNamesMap = await fetchAllEmployees();
      }
      
      // Process payroll records with employee names
      const processedRecords = records.map(record => {
        const hoursWorked = record.total_minutes / 60;
        const overtimeHours = record.overtime_minutes / 60;
        const undertimeHours = (record.undertime_minutes !== undefined) 
          ? record.undertime_minutes / 60 
          : 0;
        
        const employeeName = employeeNamesMap[record.employee_id] || `Employee ${record.employee_id}`;
        
        return {
          id: record.id,
          employee_id: record.employee_id,
          name: employeeName,
          base_salary: record.base_salary,
          total_minutes: record.total_minutes,
          expected_minutes: record.expected_minutes || record.total_minutes,
          hourly_rate: record.hourly_rate,
          overtime_minutes: record.overtime_minutes,
          overtime_rate: record.overtime_rate,
          undertime_minutes: record.undertime_minutes || 0,
          undertime_deduction: record.undertime_deduction || 0,
          calculated_salary: record.calculated_salary
        };
      });
      
      console.log("Processed records with employee names:", processedRecords);
      setEmployeePayrollRecords(processedRecords);
      
      // Update total amount in the selected period
      if (selectedPeriod) {
        const totalAmount = records.reduce((sum, record) => sum + record.calculated_salary, 0);
        
        // Update the payroll periods list with the new amount
        setPayrollPeriods(prevPeriods => 
          prevPeriods.map(period => 
            period.id === periodId 
              ? { ...period, amount: totalAmount } 
              : period
          )
        );
        
        // Also update the selected period
        setSelectedPeriod(prev => ({ ...prev, amount: totalAmount }));
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching period details:', err);
      setError('Failed to fetch payroll details: ' + err.message);
      setEmployeePayrollRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate payroll for a period
  const calculatePayroll = async (periodId) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`Calculating payroll for period ${periodId} with params:`, calculationParams);
      
      // Create a compatible parameters object that matches your backend schema
      const compatibleParams = {
        standard_monthly_hours: calculationParams.standard_monthly_hours,
        overtime_multiplier: calculationParams.overtime_multiplier,
        apply_deductions: calculationParams.apply_deductions
      };
      
      // API call to calculate payroll
      const response = await fetch(
        `${API_BASE_URL}/payroll/periods/${periodId}/calculate`, 
        {
          method: 'POST',
          headers: {
            ...getRequestHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(compatibleParams)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }
      
      const calculatedRecords = await response.json();
      console.log("Calculation result:", calculatedRecords);
      
      // Update the status of the period
      const updatedPeriods = payrollPeriods.map(period => {
        if (period.id === periodId) {
          return { 
            ...period, 
            calculated: true,
            status: 'completed'
          };
        }
        return period;
      });
      
      setPayrollPeriods(updatedPeriods);
      
      // Fetch the updated period details
      await fetchPeriodDetails(periodId);
      
      setSuccess('Payroll calculated successfully!');
    } catch (err) {
      console.error('Error calculating payroll:', err);
      setError('Failed to calculate payroll: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lock a payroll period
  const lockPayrollPeriod = async (periodId) => {
    try {
      setLoading(true);
      setError('');
      
      // API call to lock payroll period
      const response = await fetch(
        `${API_BASE_URL}/payroll/periods/${periodId}/lock`,
        {
          method: 'POST',
          headers: getRequestHeaders()
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }
      
      // Update local state
      const updatedPeriods = payrollPeriods.map(period => {
        if (period.id === periodId) {
          return { 
            ...period, 
            locked: true,
            status: 'locked'
          };
        }
        return period;
      });
      
      setPayrollPeriods(updatedPeriods);
      
      // If this is the selected period, update it too
      if (selectedPeriod && selectedPeriod.id === periodId) {
        setSelectedPeriod(prev => ({ ...prev, locked: true, status: 'locked' }));
      }
      
      setSuccess('Payroll period locked successfully!');
    } catch (err) {
      console.error('Error locking payroll period:', err);
      setError('Failed to lock payroll period: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new payroll period
  const createPayrollPeriod = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      console.log("Creating new period:", newPeriod);
      
      // API call to create new period
      const response = await fetch(
        `${API_BASE_URL}/payroll/periods`,
        {
          method: 'POST',
          headers: {
            ...getRequestHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newPeriod.name,
            start_date: new Date(newPeriod.start_date).toISOString(),
            end_date: new Date(newPeriod.end_date).toISOString()
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }
      
      const createdPeriod = await response.json();
      console.log("Created period:", createdPeriod);
      
      // Add the new period to the list
      const newPeriodFormatted = {
        id: createdPeriod.id,
        name: createdPeriod.name,
        start_date: createdPeriod.start_date,
        end_date: createdPeriod.end_date,
        status: createdPeriod.status,
        calculated: false,
        locked: false,
        amount: 0
      };
      
      setPayrollPeriods(prev => [...prev, newPeriodFormatted]);
      setNewPeriod({ start_date: '', end_date: '', name: '' });
      setSuccess('Payroll period created successfully!');
    } catch (err) {
      console.error('Error creating payroll period:', err);
      setError('Failed to create payroll period: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is an allocator
  const checkUserRole = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: getRequestHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log("User data:", userData);
      
      // Set isAllocator based on user role
      setIsAllocator(userData.role === 'allocator');
    } catch (err) {
      console.error('Error fetching user role:', err);
      // Default to false if there's an error
      setIsAllocator(false);
    }
  };

  // Handle period selection
  const handlePeriodSelect = async (period) => {
    console.log("Selected period:", period);
    setSelectedPeriod(period);
    await fetchPeriodDetails(period.id);
  };

  // Fetch data on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      // Load essential data first
      await checkUserRole();
      await fetchAllEmployees();
      await fetchPayrollPeriods();
    };
    
    initializeComponent();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Header with eye-catching gradient background */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-700 text-white p-6 rounded-lg shadow-lg transform transition duration-500 hover:shadow-xl">
        <h1 className="text-3xl font-bold flex items-center">
          <FontAwesomeIcon icon={faMoneyBillWave} className="mr-3 text-yellow-300" />
          <span className="tracking-wide">Payroll Management</span>
        </h1>
        <button 
          onClick={goToHome}
          className="bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-90 text-white hover:text-red-600 font-bold py-2 px-4 rounded-lg flex items-center transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 border border-white border-opacity-30 hover:border-red-400"
        >
          <FontAwesomeIcon 
            icon={faTimes} 
            className="mr-2 text-lg hover:rotate-90 transition-transform duration-300" 
          />
          <span className="font-semibold">Close</span>
        </button>
      </div>

      {loading && (
        <div className="text-center p-6 bg-white rounded-lg shadow-md mb-6">
          <FontAwesomeIcon icon={faSpinner} spin className="text-indigo-600 text-4xl mb-3 animate-pulse" />
          <p className="text-indigo-600 font-semibold">Processing your request...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-6 animate-fadeIn">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md mb-6 animate-fadeIn">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <p>{success}</p>
          </div>
        </div>
      )}

      {isAllocator && (
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-t-4 border-indigo-500 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-indigo-800 flex items-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-indigo-600" />
            <span className="border-b-2 border-indigo-300 pb-1">Create New Payroll Period</span>
          </h2>
          <form onSubmit={createPayrollPeriod} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="transition-all duration-300 hover:transform hover:scale-105">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Period Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  placeholder="e.g. May 2025"
                  required
                />
              </div>
              <div className="transition-all duration-300 hover:transform hover:scale-105">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start_date">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  value={newPeriod.start_date}
                  onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="transition-all duration-300 hover:transform hover:scale-105">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end_date">
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  value={newPeriod.end_date}
                  onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  Creating...
                </span>
              ) : (
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  Create Period
                </span>
              )}
            </button>
          </form>
        </div>
      )}

      {isAllocator && selectedPeriod && !selectedPeriod.calculated && !selectedPeriod.locked && (
        <div className="mb-8 bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-indigo-800 flex items-center">
            <FontAwesomeIcon icon={faCalculator} className="mr-2 text-purple-600" />
            <span className="border-b-2 border-purple-300 pb-1">Payroll Calculation Parameters</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg shadow-inner transition-all duration-300 hover:shadow-md">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Standard Monthly Hours
              </label>
              <input
                type="number"
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                value={calculationParams.standard_monthly_hours}
                onChange={(e) => setCalculationParams({
                  ...calculationParams,
                  standard_monthly_hours: parseFloat(e.target.value)
                })}
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-inner transition-all duration-300 hover:shadow-md">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Overtime Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                value={calculationParams.overtime_multiplier}
                onChange={(e) => setCalculationParams({
                  ...calculationParams,
                  overtime_multiplier: parseFloat(e.target.value)
                })}
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow-inner flex items-center transition-all duration-300 hover:shadow-md">
              <div className="relative inline-block w-12 h-6 mr-2">
                <input
                  type="checkbox"
                  id="apply_deductions"
                  className="opacity-0 w-0 h-0"
                  checked={calculationParams.apply_deductions}
                  onChange={(e) => setCalculationParams({
                    ...calculationParams,
                    apply_deductions: e.target.checked
                  })}
                />
                <span className={`absolute cursor-pointer inset-0 rounded-full ${
                  calculationParams.apply_deductions ? 'bg-purple-600' : 'bg-gray-300'
                } transition-colors duration-300 ease-in-out`}></span>
                <span className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${
                  calculationParams.apply_deductions ? 'transform translate-x-6' : ''
                }`}></span>
              </div>
              <label htmlFor="apply_deductions" className="text-gray-700 font-bold">
                Apply Undertime Deductions
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 transition-all duration-300 hover:shadow-xl">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-800 to-purple-800 text-white">
          <h2 className="text-xl font-semibold flex items-center">
            <FontAwesomeIcon icon={faList} className="mr-2 text-yellow-300" />
            <span className="tracking-wide">Payroll Periods</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-indigo-100 to-purple-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Period Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-indigo-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrollPeriods.length > 0 ? (
                payrollPeriods.map((period) => (
                  <tr 
                    key={period.id} 
                    className={`hover:bg-indigo-50 cursor-pointer transition-colors duration-200 ${
                      selectedPeriod && selectedPeriod.id === period.id ? 'bg-indigo-50' : ''
                    }`}
                    onClick={() => handlePeriodSelect(period)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base font-medium text-gray-900">{period.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 font-medium">
                        {new Date(period.start_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })} -{' '}
                        {new Date(period.end_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                          period.locked
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : period.calculated
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        } transition-all duration-300 transform hover:scale-105`}
                      >
                        {period.locked ? 
                          <><FontAwesomeIcon icon={faLock} className="mr-1" /> Locked</> : 
                          period.calculated ? 
                          <><FontAwesomeIcon icon={faCalculator} className="mr-1" /> Calculated</> : 
                          <><FontAwesomeIcon icon={faClock} className="mr-1" /> Pending</>
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                      {formatINR(period.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* View button - always shown for all periods */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePeriodSelect(period);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 px-2 py-1 rounded transition-colors duration-200 flex items-center"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          View
                        </button>
                        
                        {/* Allocator-specific actions */}
                        {isAllocator && (
                          <>
                            {!period.calculated && !period.locked && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  calculatePayroll(period.id);
                                }}
                                className="text-purple-600 hover:text-purple-900 hover:bg-purple-50 px-2 py-1 rounded transition-colors duration-200 flex items-center"
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faCalculator} className="mr-1" />
                                Calculate
                              </button>
                            )}
                            {period.calculated && !period.locked && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  lockPayrollPeriod(period.id);
                                }}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200 flex items-center"
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faLock} className="mr-1" />
                                Lock
                              </button>
                            )}
                            {period.locked && (
                              <span className="text-gray-500 px-2 py-1 flex items-center">
                                <FontAwesomeIcon icon={faLock} className="mr-1" />
                                Locked
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-base text-gray-500 bg-gray-50">
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-indigo-500 mr-2" />
                        Loading payroll periods...
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>No payroll periods found</span>
                        {isAllocator && (
                          <p className="mt-2 text-indigo-600">Create your first period above!</p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPeriod && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 border-t-4 border-indigo-500 transition-all duration-300 hover:shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-indigo-800 flex items-center">
            <FontAwesomeIcon icon={faClock} className="mr-2 text-indigo-600" />
            <span className="border-b-2 border-indigo-300 pb-1">
              Payroll Details for {selectedPeriod.name}
            </span>
          </h2>
          {selectedPeriod.calculation_params && (
            <div className="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-inner">
              <h3 className="font-semibold text-indigo-800 mb-3 border-b border-indigo-200 pb-2">Calculation Parameters:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-500 block mb-1">Standard Hours:</span>
                  <p className="font-medium text-indigo-900 text-lg">{selectedPeriod.calculation_params.standard_monthly_hours}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-500 block mb-1">Overtime Multiplier:</span>
                  <p className="font-medium text-indigo-900 text-lg">{selectedPeriod.calculation_params.overtime_multiplier}x</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-sm text-gray-500 block mb-1">Undertime Deductions:</span>
                  <p className="font-medium text-indigo-900 text-lg">
                    {selectedPeriod.calculation_params.apply_deductions ? 
                      <span className="text-green-600">Enabled</span> : 
                      <span className="text-red-600">Disabled</span>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loading && (
            <div className="text-center py-8">
              <FontAwesomeIcon icon={faSpinner} spin className="text-indigo-500 text-3xl mb-2" />
              <p className="text-indigo-500 font-medium">Loading employee payroll records...</p>
            </div>
          )}
          
          {!loading && employeePayrollRecords.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 font-medium text-lg mb-4">No payroll records found for this period.</p>
              {isAllocator && !selectedPeriod.locked && (
                <button
                  onClick={() => calculatePayroll(selectedPeriod.id)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faCalculator} className="mr-2" />
                  Calculate Payroll Now
                </button>
              )}
            </div>
          )}
          
          {!loading && employeePayrollRecords.length > 0 && (
            <div className="overflow-x-auto shadow-lg rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      Base Salary
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      Hours Worked
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      Overtime
                    </th>
                    {calculationParams.apply_deductions && (
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                        Undertime
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                      Net Salary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeePayrollRecords.map((employee, index) => {
                    const hoursWorked = (employee.total_minutes / 60).toFixed(2);
                    const overtimeHours = (employee.overtime_minutes / 60).toFixed(2);
                    const undertimeHours = (employee.undertime_minutes / 60).toFixed(2);
                    const overtimePay = overtimeHours * employee.overtime_rate;
                    
                    return (
                      <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                          {formatINR(employee.base_salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                          <span className="font-medium">{hoursWorked}</span> hours
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base text-gray-700">
                            <span className="font-medium">{overtimeHours}</span> hours
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            +{formatINR(overtimePay)}
                          </div>
                        </td>
                        {calculationParams.apply_deductions && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base text-gray-700">
                              <span className="font-medium">{undertimeHours}</span> hours
                            </div>
                            <div className="text-sm text-red-600 font-medium">
                              -{formatINR(employee.undertime_deduction)}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-indigo-800">
                          {formatINR(employee.calculated_salary)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total row */}
                  <tr className="bg-gradient-to-r from-indigo-100 to-purple-100 border-t-2 border-indigo-300">
                    <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-indigo-800">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-700">
                      {formatINR(employeePayrollRecords.reduce((sum, emp) => sum + emp.base_salary, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-700">
                      {(employeePayrollRecords.reduce((sum, emp) => sum + emp.total_minutes, 0) / 60).toFixed(2)} hours
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-green-600">
                      {/* Calculate total overtime pay */}
                      +{formatINR(employeePayrollRecords.reduce((sum, emp) => 
                        sum + ((emp.overtime_minutes / 60) * emp.overtime_rate), 0)
                      )}
                    </td>
                    {calculationParams.apply_deductions && (
                      <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-red-600">
                        {/* Total undertime deduction */}
                        -{formatINR(employeePayrollRecords.reduce((sum, emp) => sum + (emp.undertime_deduction || 0), 0))}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-indigo-800">
                      {formatINR(employeePayrollRecords.reduce((sum, emp) => sum + emp.calculated_salary, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Add custom CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default Payroll;