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
  faBuilding,
  faTable,
  faCopy,
  faPaperPlane,
  faEye,
  faCalendar,
  faCheck,
  faTimes
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

  // NEW WEEKLY SHEET STATES
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'weekly-sheets'
  const [weeklySheets, setWeeklySheets] = useState([]);
  const [showCreateSheetModal, setShowCreateSheetModal] = useState(false);
  const [showSheetEditorModal, setShowSheetEditorModal] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetEntries, setSheetEntries] = useState([]);
  const [createSheetForm, setCreateSheetForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    assigned_to: ''
  });
  const [submittedSheets, setSubmittedSheets] = useState([]);
  const [currentMonthSheet, setCurrentMonthSheet] = useState(null);

  const CLIENT_LIST = ["DND", "LOD", "FANTASIA", "BROADWAY", "MDB", "CHAHAL", "XAU", "FINSYNC", "AMEY", "BiD"];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/tasks', {
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

  // NEW WEEKLY SHEET FUNCTIONS
  const fetchWeeklySheets = async () => {
    try {
      const endpoint = userData.role === 'allocator' 
        ? 'https://taskapi.buildingindiadigital.com/allocators/weekly-sheets'
        : 'https://taskapi.buildingindiadigital.com/employees/weekly-sheets';

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weekly sheets');
      }

      const data = await response.json();
      setWeeklySheets(data);

      if (userData.role === 'employee') {
        // Also fetch current month sheet
        try {
          const currentResponse = await fetch('https://taskapi.buildingindiadigital.com/employees/weekly-sheets/current', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (currentResponse.ok) {
            const currentData = await currentResponse.json();
            setCurrentMonthSheet(currentData);
          }
        } catch (error) {
          console.error('Error fetching current month sheet:', error);
        }
      }

      if (userData.role === 'allocator') {
        // Fetch submitted sheets for review
        try {
          const submittedResponse = await fetch('https://taskapi.buildingindiadigital.com/allocators/employee-sheets/submitted', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (submittedResponse.ok) {
            const submittedData = await submittedResponse.json();
            setSubmittedSheets(submittedData);
          }
        } catch (error) {
          console.error('Error fetching submitted sheets:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching weekly sheets:', error);
      setError('Failed to load weekly sheets. Please try again.');
    }
  };

  const createWeeklySheet = async (e) => {
    e.preventDefault();
    
    try {
      const entries = [];
      CLIENT_LIST.forEach(client => {
        for (let week = 1; week <= 5; week++) {
          entries.push({
            client_name: client,
            week_number: week,
            posts_count: 1,
            reels_count: 1,
            story_description: "COLLAGE + WTSAP STORY",
            is_topical_day: false
          });
        }
      });

      const sheetData = {
        ...createSheetForm,
        entries
      };

      const response = await fetch('https://taskapi.buildingindiadigital.com/allocators/weekly-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(sheetData)
      });

      if (!response.ok) {
        throw new Error('Failed to create weekly sheet');
      }

      setShowCreateSheetModal(false);
      setCreateSheetForm({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        assigned_to: ''
      });
      fetchWeeklySheets();
    } catch (error) {
      console.error('Error creating weekly sheet:', error);
      setError('Failed to create weekly sheet. Please try again.');
    }
  };

  const autoGenerateMonthlySheets = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const response = await fetch(`https://taskapi.buildingindiadigital.com/allocators/auto-generate-monthly-sheets?month=${currentMonth}&year=${currentYear}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to auto-generate sheets');
      }

      const result = await response.json();
      alert(`Created ${result.created_sheets.length} sheets for ${currentMonth}/${currentYear}`);
      fetchWeeklySheets();
    } catch (error) {
      console.error('Error auto-generating sheets:', error);
      setError('Failed to auto-generate sheets. Please try again.');
    }
  };

  const copySheetForEmployee = async (sheetId) => {
    try {
      const response = await fetch(`https://taskapi.buildingindiadigital.com/employees/weekly-sheets/${sheetId}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to copy sheet');
      }

      alert('Working copy created! You can now edit your sheet.');
      fetchWeeklySheets();
    } catch (error) {
      console.error('Error copying sheet:', error);
      alert('Error creating working copy. You may already have one.');
    }
  };

  const submitEmployeeSheet = async (sheetId) => {
    try {
      const response = await fetch(`https://taskapi.buildingindiadigital.com/employees/weekly-sheets/${sheetId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to submit sheet');
      }

      alert('Sheet submitted for review!');
      fetchWeeklySheets();
    } catch (error) {
      console.error('Error submitting sheet:', error);
      setError('Failed to submit sheet. Please try again.');
    }
  };

  const updateSheetStatus = async (sheetId, status) => {
    try {
      const response = await fetch(`https://taskapi.buildingindiadigital.com/allocators/weekly-sheets/${sheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update sheet status');
      }

      fetchWeeklySheets();
    } catch (error) {
      console.error('Error updating sheet status:', error);
      setError('Failed to update sheet status. Please try again.');
    }
  };

  const openSheetEditor = async (sheet) => {
    setSelectedSheet(sheet);
    setSheetEntries(sheet.entries || []);
    setShowSheetEditorModal(true);
  };

  const updateSheetEntry = (entryId, field, value) => {
    setSheetEntries(entries => 
      entries.map(entry => 
        entry.id === entryId 
          ? { ...entry, [field]: value }
          : entry
      )
    );
  };

  const saveSheetChanges = async () => {
    try {
      const updates = { 
        entries: sheetEntries.map(entry => ({
          id: entry.id,
          posts_count: entry.posts_count,
          reels_count: entry.reels_count,
          story_description: entry.story_description
        }))
      };

      const endpoint = userData.role === 'allocator' 
        ? `https://taskapi.buildingindiadigital.com/allocators/weekly-sheets/${selectedSheet.sheet_id}`
        : `https://taskapi.buildingindiadigital.com/employees/weekly-sheets/${selectedSheet.sheet_id}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      alert('Changes saved successfully!');
      setShowSheetEditorModal(false);
      fetchWeeklySheets();
    } catch (error) {
      console.error('Error saving changes:', error);
      setError('Failed to save changes. Please try again.');
    }
  };

  // Only for allocator role
  const fetchClientsAndEmployees = async () => {
    if (userData.role !== 'allocator') return;
    
    try {
      // Fetch clients
      const clientsResponse = await fetch('https://taskapi.buildingindiadigital.com/clients', {
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
      const employeesResponse = await fetch('https://taskapi.buildingindiadigital.com/employees', {
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
    fetchWeeklySheets();
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
      const response = await fetch(`https://taskapi.buildingindiadigital.com/tasks/${selectedTask.id}/report`, {
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
      const response = await fetch(`https://taskapi.buildingindiadigital.com/tasks/${selectedTask.id}/status`, {
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
      const response = await fetch('https://taskapi.buildingindiadigital.com/tasks', {
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
      case 'draft':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            <FontAwesomeIcon icon={faEdit} className="mr-1" />
            Draft
          </span>
        );
      case 'submitted':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
            <FontAwesomeIcon icon={faPaperPlane} className="mr-1" />
            Submitted
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

  // Helper function to get month name
  const getMonthName = (month) => {
    return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
  };

  const renderWeeklySheetContent = () => {
    if (userData.role === 'allocator') {
      return (
        <div>
          {/* Allocator Weekly Sheets */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
              Weekly Sheets Management
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreateSheetModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 flex items-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create Sheet
              </button>
              <button
                onClick={autoGenerateMonthlySheets}
                className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 flex items-center"
              >
                <FontAwesomeIcon icon={faCalendar} className="mr-2" />
                Auto-Generate Monthly
              </button>
            </div>
          </div>

          {/* Submitted Sheets for Review */}
          {submittedSheets.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Submitted Sheets (Pending Review)</h4>
              <div className="grid gap-4">
                {submittedSheets.map(sheet => (
                  <div key={sheet.id} className="border p-4 rounded bg-yellow-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-medium">{sheet.assignee?.username}</h5>
                        <p className="text-sm text-gray-600">
                          {getMonthName(sheet.month)} {sheet.year}
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(sheet.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openSheetEditor(sheet)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          <FontAwesomeIcon icon={faEye} className="mr-1" />
                          View
                        </button>
                        <button 
                          onClick={() => updateSheetStatus(sheet.sheet_id, 'approved')}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          <FontAwesomeIcon icon={faCheck} className="mr-1" />
                          Approve
                        </button>
                        <button 
                          onClick={() => updateSheetStatus(sheet.sheet_id, 'rejected')}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          <FontAwesomeIcon icon={faTimes} className="mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Sheets */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-3">All Weekly Sheets</h4>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklySheets.map((sheet) => (
                      <tr key={sheet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getMonthName(sheet.month)} {sheet.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {sheet.assignee?.username || 'Template'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(sheet.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(sheet.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openSheetEditor(sheet)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <FontAwesomeIcon icon={faEdit} className="mr-1" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Employee Weekly Sheets
      return (
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
              My Weekly Sheets
            </h3>
          </div>

          {/* Current Month Sheet */}
          {currentMonthSheet && (
            <div className="mb-8 p-4 border rounded bg-blue-50">
              <h4 className="text-lg font-semibold mb-2">Current Month Sheet</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    {getMonthName(currentMonthSheet.month)} {currentMonthSheet.year}
                  </p>
                  <p className="text-sm text-gray-600">Status: {currentMonthSheet.status}</p>
                </div>
                <div className="flex gap-2">
                  {currentMonthSheet.status === 'draft' && currentMonthSheet.created_by !== currentMonthSheet.assigned_to && (
                    <button 
                      onClick={() => copySheetForEmployee(currentMonthSheet.sheet_id)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      <FontAwesomeIcon icon={faCopy} className="mr-1" />
                      Start Working
                    </button>
                  )}
                  <button 
                    onClick={() => openSheetEditor(currentMonthSheet)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    <FontAwesomeIcon icon={faEye} className="mr-1" />
                    View Sheet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All My Sheets */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-3">All My Sheets</h4>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklySheets.map((sheet) => (
                      <tr key={sheet.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {getMonthName(sheet.month)} {sheet.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(sheet.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {sheet.submitted_at ? new Date(sheet.submitted_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {sheet.status === 'draft' && sheet.created_by === sheet.assigned_to && (
                            <button 
                              onClick={() => submitEmployeeSheet(sheet.sheet_id)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2"
                            >
                              <FontAwesomeIcon icon={faPaperPlane} className="mr-1" />
                              Submit
                            </button>
                          )}
                          <button 
                            onClick={() => openSheetEditor(sheet)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                          >
                            <FontAwesomeIcon icon={sheet.created_by === sheet.assigned_to ? faEdit : faEye} className="mr-1" />
                            {sheet.created_by === sheet.assigned_to ? 'Edit' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    }
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
          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`${
                  activeTab === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                <FontAwesomeIcon icon={faTasks} className="mr-2" />
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('weekly-sheets')}
                className={`${
                  activeTab === 'weekly-sheets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                <FontAwesomeIcon icon={faTable} className="mr-2" />
                Weekly Sheets
              </button>
            </nav>
          </div>

          {activeTab === 'tasks' ? (
            <div>
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
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                <FontAwesomeIcon icon={faTable} className="mr-2" />
                Weekly Sheets
              </h2>
              {renderWeeklySheetContent()}
            </div>
          )}
        </main>
      </div>
      
      {/* Create Weekly Sheet Modal for Allocators */}
      {showCreateSheetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Create Weekly Sheet
            </h3>
            
            <form onSubmit={createWeeklySheet}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={createSheetForm.month}
                  onChange={(e) => setCreateSheetForm({...createSheetForm, month: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>
                      {getMonthName(i+1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={createSheetForm.year}
                  onChange={(e) => setCreateSheetForm({...createSheetForm, year: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To Employee (Optional)
                </label>
                <select
                  value={createSheetForm.assigned_to}
                  onChange={(e) => setCreateSheetForm({...createSheetForm, assigned_to: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Create as Template</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.username}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateSheetModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Sheet Editor Modal */}
      {showSheetEditorModal && selectedSheet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                <FontAwesomeIcon icon={faTable} className="mr-2" />
                Weekly Sheet - {getMonthName(selectedSheet.month)} {selectedSheet.year}
              </h3>
              <div className="flex gap-2">
                {userData.role === 'employee' && selectedSheet.status !== 'submitted' && selectedSheet.created_by === selectedSheet.assigned_to && (
                  <button 
                    onClick={saveSheetChanges}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Changes
                  </button>
                )}
                <button 
                  onClick={() => setShowSheetEditorModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Sheet Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 p-2 bg-gray-100">CLIENTS</th>
                    {[1, 2, 3, 4, 5].map(week => (
                      <th key={week} className="border border-gray-300 p-2 bg-gray-100" colSpan="3">
                        WEEK {week}
                        <div className="text-xs text-gray-600">
                          ({week === 1 ? '1-7' : week === 2 ? '8-14' : week === 3 ? '15-21' : week === 4 ? '22-28' : '29-30'})
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="border border-gray-300 p-2 bg-gray-50"></th>
                    {[1, 2, 3, 4, 5].map(week => (
                      <React.Fragment key={week}>
                        <th className="border border-gray-300 p-1 bg-gray-50 text-xs">POSTS</th>
                        <th className="border border-gray-300 p-1 bg-gray-50 text-xs">REELS</th>
                        <th className="border border-gray-300 p-1 bg-gray-50 text-xs">STORY</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CLIENT_LIST.map(client => (
                    <tr key={client}>
                      <td className="border border-gray-300 p-2 font-medium">{client}</td>
                      {[1, 2, 3, 4, 5].map(week => {
                        const entry = sheetEntries.find(e => e.client_name === client && e.week_number === week);
                        const isReadOnly = userData.role === 'allocator' ? false : 
                          (selectedSheet.status === 'submitted' || selectedSheet.created_by !== selectedSheet.assigned_to);
                        
                        return (
                          <React.Fragment key={week}>
                            <td className="border border-gray-300 p-1">
                              <input
                                type="number"
                                value={entry?.posts_count || 0}
                                onChange={(e) => updateSheetEntry(entry?.id, 'posts_count', parseInt(e.target.value))}
                                readOnly={isReadOnly}
                                className="w-full text-center border-none outline-none"
                                min="0"
                              />
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input
                                type="number"
                                value={entry?.reels_count || 0}
                                onChange={(e) => updateSheetEntry(entry?.id, 'reels_count', parseInt(e.target.value))}
                                readOnly={isReadOnly}
                                className="w-full text-center border-none outline-none"
                                min="0"
                              />
                            </td>
                            <td className="border border-gray-300 p-1">
                              <input
                                type="text"
                                value={entry?.story_description || ""}
                                onChange={(e) => updateSheetEntry(entry?.id, 'story_description', e.target.value)}
                                readOnly={isReadOnly}
                                className="w-full text-center border-none outline-none text-xs"
                                placeholder="Story description"
                              />
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
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
