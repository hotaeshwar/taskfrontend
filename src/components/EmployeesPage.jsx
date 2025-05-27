import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faSearch,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faClipboardCheck,
  faTasks,
  faEnvelope,
  faUser,
  faMoneyBillWave,
  faEdit,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import Header from './Header';
import Loader from './Loader';

const EmployeesPage = ({ userData, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [employeeSalary, setEmployeeSalary] = useState(null);
  const [workSessions, setWorkSessions] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [salaryFormData, setSalaryFormData] = useState({
    monthly_salary: '',
    currency: 'INR'
  });
  const [currentMonthEarnings, setCurrentMonthEarnings] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError('');
    
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
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeeTasks = async (employeeId) => {
    setIsLoadingTasks(true);
    
    try {
      const response = await fetch(`https://taskapi.buildingindiadigital.com/tasks?employee_id=${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setEmployeeTasks(data);
    } catch (error) {
      console.error('Error fetching employee tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchEmployeeSalary = async (employeeId) => {
    try {
      // Changed from GET to GET from employee's salary-history endpoint
      // This is the correct endpoint according to the FastAPI code
      const response = await fetch( `https://taskapi.buildingindiadigital.com/employees/${employeeId}/salary-history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        // If no salary is set, the endpoint might return 404
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch salary');
      }

      const data = await response.json();
      // Take the first (most recent) salary record if there are any
      if (data && data.length > 0) {
        setEmployeeSalary(data[0]);
        return data[0];
      } else {
        setEmployeeSalary(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching employee salary:', error);
      setEmployeeSalary(null);
      return null;
    }
  };

  const fetchEmployeeWorkSessions = async (employeeId) => {
    try {
      // Get current month start and end dates
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Use the allocators endpoint instead as that's what the backend has implemented
      const response = await fetch(
        `https://taskapi.buildingindiadigital.com/${employeeId}/work-sessions?` +
        `start_date=${firstDay.toISOString().split('T')[0]}&end_date=${lastDay.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch work sessions');
      }

      const data = await response.json();
      setWorkSessions(data);
      return data;
    } catch (error) {
      console.error('Error fetching work sessions:', error);
      return [];
    }
  };

  const calculateCurrentMonthEarnings = async (employeeId) => {
    try {
      const [sessions, salary] = await Promise.all([
        fetchEmployeeWorkSessions(employeeId),
        employeeSalary || fetchEmployeeSalary(employeeId)
      ]);
      
      if (!salary) {
        setCurrentMonthEarnings(null);
        return;
      }

      // Calculate total minutes worked this month
      const totalMinutes = sessions.reduce((sum, session) => {
        if (session.clock_in && session.clock_out) {
          const clockIn = new Date(session.clock_in);
          const clockOut = new Date(session.clock_out);
          return sum + (clockOut - clockIn) / (1000 * 60); // Convert ms to minutes
        }
        return sum;
      }, 0);

      // Calculate earnings (160 standard hours/month)
      const standardMonthlyHours = 160;
      const hourlyRate = salary.monthly_salary / standardMonthlyHours;
      const overtimeMultiplier = 1.5;
      
      const standardMinutes = standardMonthlyHours * 60;
      const overtimeMinutes = Math.max(0, totalMinutes - standardMinutes);
      
      const earnings = {
        totalMinutes,
        standardMinutes,
        overtimeMinutes,
        hourlyRate,
        baseEarnings: salary.monthly_salary,
        overtimeEarnings: (overtimeMinutes / 60) * (hourlyRate * overtimeMultiplier),
        totalEarnings: salary.monthly_salary + 
                    (overtimeMinutes / 60) * (hourlyRate * overtimeMultiplier)
      };

      setCurrentMonthEarnings(earnings);
    } catch (error) {
      console.error('Error calculating earnings:', error);
      setCurrentMonthEarnings(null);
    }
  };

  const handleSetSalary = async () => {
  if (!selectedEmployee) return;
  
  try {
    const monthlySalary = parseFloat(salaryFormData.monthly_salary);
    if (isNaN(monthlySalary) || monthlySalary <= 0) {
      throw new Error('Please enter a valid salary amount');
    }

    // Create the proper payload according to API requirements
    const payload = {
      employee_id: selectedEmployee.id,
      monthly_salary: monthlySalary,
      currency: salaryFormData.currency
    };

    const response = await fetch(
      `https://taskapi.buildingindiadigital.com/employees/${selectedEmployee.id}/salary`, // FIXED: Added "employees/" prefix
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to set salary');
    }

    const data = await response.json();
    setEmployeeSalary(data);
    setShowSalaryForm(false);
    // Recalculate earnings with new salary
    await calculateCurrentMonthEarnings(selectedEmployee.id);
  } catch (error) {
    console.error('Error setting salary:', error);
    setError(error.message || 'Failed to set salary. Please try again.');
  }
};
  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const filtered = employees.filter(employee => 
        employee.username.toLowerCase().includes(search) || 
        employee.email.toLowerCase().includes(search)
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDetails(true);
    setError('');
    
    // Fetch tasks
    await fetchEmployeeTasks(employee.id);
    
    // Fetch salary and then calculate earnings
    const salary = await fetchEmployeeSalary(employee.id);
    
    if (salary) {
      await calculateCurrentMonthEarnings(employee.id);
    }
  };

  const handleSalaryFormChange = (e) => {
    const { name, value } = e.target;
    setSalaryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openSalaryForm = () => {
    if (employeeSalary) {
      setSalaryFormData({
        monthly_salary: employeeSalary.monthly_salary.toString(),
        currency: employeeSalary.currency
      });
    } else {
      setSalaryFormData({
        monthly_salary: '',
        currency: 'INR'
      });
    }
    setShowSalaryForm(true);
  };

  const getTaskStatusCount = (status) => {
    return employeeTasks.filter(task => task.status === status).length;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center w-fit">
            <FontAwesomeIcon icon={faHourglassHalf} className="mr-1" />
            Pending
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center w-fit">
            <FontAwesomeIcon icon={faClipboardCheck} className="mr-1" />
            Completed
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center w-fit">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center w-fit">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center w-fit">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <Sidebar 
        userData={userData} 
        onLogout={onLogout} 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Header userData={userData} toggleSidebar={toggleSidebar} />
        
        <main className="flex-grow p-4 lg:p-6 transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-300 mb-2 sm:mb-0 flex items-center">
              <FontAwesomeIcon icon={faUsers} className="mr-3 text-indigo-600 dark:text-indigo-400" />
              <span>Employees Management</span>
            </h2>
            <div className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">
              Total: {filteredEmployees.length} employees
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 shadow-md animate-pulse">
              <div className="flex items-center">
                <svg className="h-6 w-6 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 transition-all duration-300 hover:shadow-xl border border-indigo-100 dark:border-gray-700">
            <div className="flex items-center bg-indigo-50 dark:bg-gray-700 rounded-lg px-4 py-2">
              <FontAwesomeIcon icon={faSearch} className="text-indigo-400 dark:text-indigo-300 mr-3 text-lg" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search employees by name or email..."
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 placeholder-indigo-300 dark:placeholder-indigo-400 text-indigo-700 dark:text-indigo-200"
              />
            </div>
          </div>
          
          {/* Employees List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-indigo-100 dark:border-gray-700 transition-all duration-300">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon icon={faUsers} className="text-indigo-500 dark:text-indigo-300 text-3xl" />
              </div>
              <h3 className="text-xl font-medium text-indigo-900 dark:text-indigo-100 mb-2">No employees found</h3>
              <p className="text-indigo-500 dark:text-indigo-400">
                {searchTerm ? 'No employees match your search criteria.' : 'No employees available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredEmployees.map((employee) => (
                <div 
                  key={employee.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-indigo-50 dark:border-gray-700"
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <div className="flex items-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl font-semibold shadow-md">
                      {employee.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-100">{employee.username}</h3>
                      <p className="text-sm text-indigo-600 dark:text-indigo-300 flex items-center">
                        <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-indigo-400" />
                        {employee.email}
                      </p>
                      {employee.is_approved ? (
                        <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-sm font-medium">
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 shadow-sm font-medium">
                          <FontAwesomeIcon icon={faHourglassHalf} className="mr-1" />
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      
      {/* Employee Details Modal */}
      {showEmployeeDetails && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto border border-indigo-100 dark:border-gray-700 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                  {selectedEmployee.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">{selectedEmployee.username}</h3>
                  <p className="text-indigo-600 dark:text-indigo-300 flex items-center">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-indigo-400" />
                    {selectedEmployee.email}
                  </p>
                  {selectedEmployee.is_approved ? (
                    <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-sm font-medium">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                      Approved Employee
                    </span>
                  ) : (
                    <span className="inline-block mt-2 px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 shadow-sm font-medium">
                      <FontAwesomeIcon icon={faHourglassHalf} className="mr-1" />
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEmployeeDetails(false);
                  setShowSalaryForm(false);
                  setError('');
                }}
                className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-100 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Salary Information Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 flex items-center">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-indigo-500" />
                  Salary Information
                </h4>
                {userData.role === 'allocator' && (
                  <button
                    onClick={openSalaryForm}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg flex items-center"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    {employeeSalary ? 'Edit Salary' : 'Set Salary'}
                  </button>
                )}
              </div>
              
              {showSalaryForm ? (
                <div className="bg-indigo-50 dark:bg-indigo-900 p-5 rounded-xl mb-4 shadow-inner border border-indigo-100 dark:border-indigo-800">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-lg mb-4 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-indigo-700 dark:text-indigo-200 mb-2">
                        Monthly Salary
                      </label>
                      <input
                        type="number"
                        name="monthly_salary"
                        value={salaryFormData.monthly_salary}
                        onChange={handleSalaryFormChange}
                        className="w-full px-4 py-3 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-indigo-800 dark:text-indigo-100"
                        placeholder="e.g. 30000"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-indigo-700 dark:text-indigo-200 mb-2">
                        Currency
                      </label>
                      <select
                        name="currency"
                        value={salaryFormData.currency}
                        onChange={handleSalaryFormChange}
                        className="w-full px-4 py-3 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-indigo-800 dark:text-indigo-100"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowSalaryForm(false);
                        setError('');
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSetSalary}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Save Salary
                    </button>
                  </div>
                </div>
              ) : employeeSalary ? (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900 dark:to-blue-900 p-5 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                      <p className="text-sm font-medium text-indigo-500 dark:text-indigo-300 mb-1">Monthly Salary</p>
                      <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-100">
                        {formatCurrency(employeeSalary.monthly_salary, employeeSalary.currency)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                      <p className="text-sm font-medium text-indigo-500 dark:text-indigo-300 mb-1">Effective From</p>
                      <p className="text-xl font-bold text-indigo-800 dark:text-indigo-100">
                        {new Date(employeeSalary.effective_from).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900 p-5 rounded-xl text-center shadow-md border border-yellow-100 dark:border-yellow-800">
                  <div className="flex items-center justify-center text-yellow-700 dark:text-yellow-300 mb-2">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-3xl" />
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    No salary information set for this employee
                  </p>
                </div>
              )}
            </div>

            {/* Monthly Earnings Calculation */}
            {employeeSalary && currentMonthEarnings && (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 p-5 rounded-xl shadow-md border border-green-100 dark:border-green-800">
                <h4 className="text-lg font-bold text-green-800 dark:text-green-200 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faClock} className="mr-2 text-green-600 dark:text-green-400" />
                  Current Month Earnings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-inner">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Total Hours</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-100">
                      {formatHours(currentMonthEarnings.totalMinutes)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-inner">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Standard Hours</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-100">
                      {formatHours(currentMonthEarnings.standardMinutes)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-inner">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Overtime Hours</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-100">
                      {formatHours(currentMonthEarnings.overtimeMinutes)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-inner">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Hourly Rate</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-100">
                      {formatCurrency(currentMonthEarnings.hourlyRate, employeeSalary.currency)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-inner">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Base Earnings</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-100">
                      {formatCurrency(currentMonthEarnings.baseEarnings, employeeSalary.currency)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-inner">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Overtime Earnings</p>
                    <p className="text-xl font-bold text-green-800 dark:text-green-100">
                      {formatCurrency(currentMonthEarnings.overtimeEarnings, employeeSalary.currency)}
                    </p>
                  </div>
                  <div className="md:col-span-3 p-4 mt-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-800 dark:to-emerald-800 rounded-lg shadow-md border border-green-200 dark:border-green-700">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-100">
                      {formatCurrency(currentMonthEarnings.totalEarnings, employeeSalary.currency)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Task Summary Section */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mb-4 flex items-center">
                <FontAwesomeIcon icon={faTasks} className="mr-2 text-indigo-500" />
                Task Summary
              </h4>
              {isLoadingTasks ? (
                <div className="flex justify-center py-8">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : employeeTasks.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 text-center shadow-inner">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faTasks} className="text-gray-500 dark:text-gray-400 text-2xl" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">No tasks assigned to this employee yet.</p>
                </div>
              ) : (
                <>
                  {/* Task Statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900 dark:to-blue-900 p-4 rounded-xl shadow-md">
                      <div className="font-medium text-indigo-600 dark:text-indigo-300 mb-1">Total Tasks</div>
                      <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-100">{employeeTasks.length}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900 dark:to-amber-900 p-4 rounded-xl shadow-md">
                      <div className="font-medium text-yellow-700 dark:text-yellow-300 mb-1">Pending</div>
                      <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-100">{getTaskStatusCount('pending')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900 dark:to-sky-900 p-4 rounded-xl shadow-md">
                      <div className="font-medium text-blue-600 dark:text-blue-300 mb-1">Completed</div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-100">{getTaskStatusCount('completed')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 p-4 rounded-xl shadow-md">
                      <div className="font-medium text-green-600 dark:text-green-300 mb-1">Approved</div>
                      <div className="text-2xl font-bold text-green-800 dark:text-green-100">{getTaskStatusCount('approved')}</div>
                    </div>
                  </div>
                  
                  {/* Task List */}
                  <div className="border border-indigo-100 dark:border-indigo-800 rounded-xl overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-indigo-200 dark:divide-indigo-700">
                        <thead className="bg-indigo-50 dark:bg-indigo-900">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              Task
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              Client
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-indigo-100 dark:divide-indigo-800">
                          {employeeTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-colors duration-150">
                              <td className="px-4 py-3">
                                <div className="text-sm font-medium text-indigo-800 dark:text-indigo-200">{task.title}</div>
                                <div className="text-xs text-indigo-500 dark:text-indigo-400 truncate max-w-xs">{task.description}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-indigo-700 dark:text-indigo-300">{task.client?.name || 'N/A'}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-indigo-700 dark:text-indigo-300">
                                  {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }) : 'N/A'}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {getStatusBadge(task.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowEmployeeDetails(false);
                  setShowSalaryForm(false);
                  setError('');
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;