import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTasks,
  faPlus,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faClipboardCheck,
  faFileAlt,
  faCalendarAlt,
  faFilter,
  faSearch,
  faEdit,
  faHome,
  faBuilding
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import Header from './Header';
import Loader from './Loader';

const TasksPage = ({ userData, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reportForm, setReportForm] = useState({
    completion_description: '',
    hurdles_faced: '',
    hours_worked: 0,
    work_location: 'office' // Added work location field
  });
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 'approved',
    allocator_feedback: ''
  });
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [createTaskForm, setCreateTaskForm] = useState({
    client_id: '',
    employee_id: '',
    title: '',
    description: '',
    due_date: '',
    completion_instructions: ''
  });
  // Added state to control showing older tasks
  const [showOlderTasks, setShowOlderTasks] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://task.trizenttechserve.in/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const data = await response.json();
      setTasks(data);
      setFilteredTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Only for allocator role
  const fetchClientsAndEmployees = async () => {
    if (userData.role !== 'allocator') return;
    
    try {
      // Fetch clients
      const clientsResponse = await fetch('https://task.trizenttechserve.in/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!clientsResponse.ok) {
        throw new Error('Failed to fetch clients');
      }

      const clientsData = await clientsResponse.json();
      setClients(clientsData);

      // Fetch employees
      const employeesResponse = await fetch('https://task.trizenttechserve.in/employees', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!employeesResponse.ok) {
        throw new Error('Failed to fetch employees');
      }

      const employeesData = await employeesResponse.json();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching clients and employees:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (userData.role === 'allocator') {
      fetchClientsAndEmployees();
    }
  }, [userData]);

  useEffect(() => {
    // Apply filters
    let result = tasks;
    
    // Filter out tasks older than 30 days unless showOlderTasks is true
    if (!showOlderTasks) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // First try to filter based on due_date
      result = result.filter(task => {
        const taskDate = new Date(task.due_date);
        return taskDate >= thirtyDaysAgo;
      });
    }
    
    if (statusFilter) {
      result = result.filter(task => task.status === statusFilter);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(search) || 
        task.description.toLowerCase().includes(search) ||
        task.client.name.toLowerCase().includes(search)
      );
    }
    
    setFilteredTasks(result);
  }, [statusFilter, searchTerm, tasks, showOlderTasks]);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // New function to toggle showing older tasks
  const toggleShowOlderTasks = () => {
    setShowOlderTasks(!showOlderTasks);
  };

  // For employee to submit task report - updated with work location
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`https://task.trizenttechserve.in/tasks/${selectedTask.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportForm)
      });

      if (!response.ok) {
        throw new Error('Failed to submit task report');
      }

      // Close modal and refresh tasks
      setShowReportModal(false);
      setSelectedTask(null);
      setReportForm({
        completion_description: '',
        hurdles_faced: '',
        hours_worked: 0,
        work_location: 'office'
      });
      fetchTasks();
    } catch (error) {
      console.error('Error submitting task report:', error);
      setError('Failed to submit task report. Please try again.');
    }
  };

  // For allocator to update task status
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`https://task.trizenttechserve.in/tasks/${selectedTask.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(statusUpdateForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // Close modal and refresh tasks
      setShowUpdateStatusModal(false);
      setSelectedTask(null);
      setStatusUpdateForm({
        status: 'approved',
        allocator_feedback: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    }
  };

  // For allocator to create new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('https://task.trizenttechserve.in/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(createTaskForm)
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      // Close modal and refresh tasks
      setShowCreateTaskModal(false);
      setCreateTaskForm({
        client_id: '',
        employee_id: '',
        title: '',
        description: '',
        due_date: '',
        completion_instructions: ''
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task. Please try again.');
    }
  };

  const openReportModal = (task) => {
    setSelectedTask(task);
    setShowReportModal(true);
  };

  const openUpdateStatusModal = (task) => {
    setSelectedTask(task);
    setShowUpdateStatusModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
            <FontAwesomeIcon icon={faHourglassHalf} className="mr-1" />
            Pending
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            <FontAwesomeIcon icon={faClipboardCheck} className="mr-1" />
            Completed
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            <FontAwesomeIcon icon={faTimesCircle} className="mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Helper function to show work location icon
  const getWorkLocationIcon = (location) => {
    return location === 'home' ? (
      <FontAwesomeIcon icon={faHome} className="text-purple-500 mr-1" title="Work from Home" />
    ) : (
      <FontAwesomeIcon icon={faBuilding} className="text-blue-500 mr-1" title="Work from Office" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar 
        userData={userData} 
        onLogout={onLogout} 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header userData={userData} toggleSidebar={toggleSidebar} />
        
        <main className="flex-grow p-4 lg:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
              <FontAwesomeIcon icon={faTasks} className="mr-2" />
              Tasks
            </h2>
            
            {/* Create Task button for allocators */}
            {userData.role === 'allocator' && (
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create New Task
              </button>
            )}
          </div>
          
          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
              <div className="w-full md:w-1/4 mb-4 md:mb-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FontAwesomeIcon icon={faFilter} className="mr-2" />
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="w-full md:w-1/4 mb-4 md:mb-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                  Task Age
                </label>
                <div className="flex items-center mt-1">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={showOlderTasks}
                      onChange={toggleShowOlderTasks}
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show tasks older than 30 days</span>
                  </label>
                </div>
              </div>
              <div className="w-full md:w-2/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FontAwesomeIcon icon={faSearch} className="mr-2" />
                  Search Tasks
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by title, description or client"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Tasks List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FontAwesomeIcon icon={faTasks} className="text-gray-400 text-5xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500">
                {!showOlderTasks
                  ? "No recent tasks found. Try enabling 'Show tasks older than 30 days' to see older tasks."
                  : statusFilter 
                    ? `No ${statusFilter} tasks match your search criteria.`
                    : searchTerm
                      ? 'No tasks match your search criteria.'
                      : 'You have no tasks assigned yet.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{task.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{task.client.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {task.report && getWorkLocationIcon(task.report.work_location)}
                            {getStatusBadge(task.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {userData.role === 'employee' && task.status === 'pending' && (
                            <button
                              onClick={() => openReportModal(task)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                              Submit Report
                            </button>
                          )}
                          
                          {userData.role === 'allocator' && task.status === 'completed' && (
                            <button
                              onClick={() => openUpdateStatusModal(task)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              <FontAwesomeIcon icon={faEdit} className="mr-1" />
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* Create Task Modal for Allocators */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Create New Task
            </h3>
            
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  value={createTaskForm.client_id}
                  onChange={(e) => setCreateTaskForm({...createTaskForm, client_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  value={createTaskForm.employee_id}
                  onChange={(e) => setCreateTaskForm({...createTaskForm, employee_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.username}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={createTaskForm.title}
                  onChange={(e) => setCreateTaskForm({...createTaskForm, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createTaskForm.description}
                  onChange={(e) => setCreateTaskForm({...createTaskForm, description: e.target.value})}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={createTaskForm.due_date}
                  onChange={(e) => setCreateTaskForm({...createTaskForm, due_date: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Instructions (Optional)
                </label>
                <textarea
                  value={createTaskForm.completion_instructions}
                  onChange={(e) => setCreateTaskForm({...createTaskForm, completion_instructions: e.target.value})}
                  rows="2"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Submit Report Modal for Employees */}
      {showReportModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
              Submit Task Report
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-800">{selectedTask.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
            </div>
            
            <form onSubmit={handleReportSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Description
                </label>
                <textarea
                  value={reportForm.completion_description}
                  onChange={(e) => setReportForm({...reportForm, completion_description: e.target.value})}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hurdles Faced
                </label>
                <textarea
                  value={reportForm.hurdles_faced}
                  onChange={(e) => setReportForm({...reportForm, hurdles_faced: e.target.value})}
                  rows="2"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Worked
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={reportForm.hours_worked}
                  onChange={(e) => setReportForm({...reportForm, hours_worked: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Added Work Location Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Location
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="work_location"
                      value="office"
                      checked={reportForm.work_location === 'office'}
                      onChange={() => setReportForm({...reportForm, work_location: 'office'})}
                    />
                    <span className="ml-2">Office <FontAwesomeIcon icon={faBuilding} className="ml-1 text-blue-500" /></span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-purple-600"
                      name="work_location"
                      value="home"
                      checked={reportForm.work_location === 'home'}
                      onChange={() => setReportForm({...reportForm, work_location: 'home'})}
                    />
                    <span className="ml-2">Home <FontAwesomeIcon icon={faHome} className="ml-1 text-purple-500" /></span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Task Review Modal for Allocators */}
      {showUpdateStatusModal && selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <FontAwesomeIcon icon={faEdit} className="mr-2" />
              Review Task
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-800">{selectedTask.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
            </div>
            
            {selectedTask.report && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <h4 className="font-medium text-gray-800">Employee Report</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Description:</strong> {selectedTask.report.completion_description}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Hurdles:</strong> {selectedTask.report.hurdles_faced}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Hours Worked:</strong> {selectedTask.report.hours_worked}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Work Location:</strong> {selectedTask.report.work_location === 'home' ? (
                    <span className="text-purple-600"><FontAwesomeIcon icon={faHome} className="mr-1" /> Work from Home</span>
                  ) : (
                    <span className="text-blue-600"><FontAwesomeIcon icon={faBuilding} className="mr-1" /> Work from Office</span>
                  )}
                </p>
              </div>
            )}
            
            <form onSubmit={handleStatusUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Status
                </label>
                <select
                  value={statusUpdateForm.status}
                  onChange={(e) => setStatusUpdateForm({...statusUpdateForm, status: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback (Optional)
                </label>
                <textarea
                  value={statusUpdateForm.allocator_feedback}
                  onChange={(e) => setStatusUpdateForm({...statusUpdateForm, allocator_feedback: e.target.value})}
                  rows="3"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUpdateStatusModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;