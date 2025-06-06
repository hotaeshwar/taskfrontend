import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faSearch,
  faTasks,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faClipboardCheck,
  faPlus,
  faTrash,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from './Sidebar';
import Header from './Header';
import Loader from './Loader';

const ClientsPage = ({ userData, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [clientTasks, setClientTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  
  // New states for add/delete functionality
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchClients = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientTasks = async (clientId) => {
    setIsLoadingTasks(true);
    
    try {
      const response = await fetch(`https://taskapi.buildingindiadigital.com/tasks/client/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch client tasks');
      }

      const data = await response.json();
      setClientTasks(data);
    } catch (error) {
      console.error('Error fetching client tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // New function to add client
  const handleAddClient = async () => {
    if (!newClientName.trim()) {
      setError('Client name cannot be empty');
      return;
    }

    setIsAddingClient(true);
    setError('');

    try {
      const response = await fetch('https://taskapi.buildingindiadigital.com/clients/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newClientName.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add client');
      }

      const newClient = await response.json();
      setClients(prev => [...prev, newClient]);
      setNewClientName('');
      setShowAddClientModal(false);
      setError('');
    } catch (error) {
      console.error('Error adding client:', error);
      setError(error.message);
    } finally {
      setIsAddingClient(false);
    }
  };

  // New function to delete client
  const handleDeleteClient = async (clientId) => {
    setIsDeletingClient(true);
    setError('');

    try {
      const response = await fetch(`https://taskapi.buildingindiadigital.com/clients/delete/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete client');
      }

      // Remove client from state
      setClients(prev => prev.filter(client => client.id !== clientId));
      setDeleteConfirmClient(null);
      setError('');
    } catch (error) {
      console.error('Error deleting client:', error);
      setError(error.message);
    } finally {
      setIsDeletingClient(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(search)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    fetchClientTasks(client.id);
    setShowClientDetails(true);
  };

  const getTaskStatusCount = (status) => {
    return clientTasks.filter(task => task.status === status).length;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100 transition-all duration-300">
      <Sidebar 
        userData={userData} 
        onLogout={onLogout} 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
        <Header userData={userData} toggleSidebar={toggleSidebar} />
        
        <main className="flex-grow p-3 sm:p-4 lg:p-6 transition-all">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-400 flex items-center">
              <div className="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 mr-3">
                <FontAwesomeIcon icon={faBuilding} />
              </div>
              Clients
            </h2>
            
            {/* Add Client Button - Only show for allocators */}
            {userData?.role === 'allocator' && (
              <button
                onClick={() => setShowAddClientModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Client
              </button>
            )}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg shadow-md mb-6">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faTimesCircle} className="mr-3 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
          
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faSearch} className="text-indigo-400 dark:text-indigo-300 mr-3 text-lg" />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search clients by name"
                className="w-full border-none focus:outline-none focus:ring-0 bg-transparent text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
          
          {/* Clients List */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <FontAwesomeIcon icon={faBuilding} className="text-gray-400 dark:text-gray-500 text-5xl mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No clients found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                No clients match your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center cursor-pointer flex-grow"
                      onClick={() => handleClientClick(client)}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl shadow-md">
                        <FontAwesomeIcon icon={faBuilding} />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{client.name}</h3>
                        <p className="text-sm text-indigo-500 dark:text-indigo-300 flex items-center mt-1">
                          <FontAwesomeIcon icon={faTasks} className="mr-1" />
                          Click to view tasks
                        </p>
                      </div>
                    </div>
                    
                    {/* Delete Button - Only show for allocators */}
                    {userData?.role === 'allocator' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmClient(client);
                        }}
                        className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                        title="Delete client"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      
      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Client</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Enter client name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isAddingClient}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddClientModal(false);
                  setNewClientName('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                disabled={isAddingClient}
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={isAddingClient}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isAddingClient ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmClient && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Delete Client</h3>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <strong>{deleteConfirmClient.name}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmClient(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                disabled={isDeletingClient}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClient(deleteConfirmClient.id)}
                disabled={isDeletingClient}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isDeletingClient ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Client Details Modal */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5 w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl shadow-lg">
                  <FontAwesomeIcon icon={faBuilding} />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedClient.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setShowClientDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-full transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Tasks for {selectedClient.name}</h4>
              {isLoadingTasks ? (
                <div className="flex justify-center py-4">
                  <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : clientTasks.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-center py-8 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  <FontAwesomeIcon icon={faTasks} className="text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <p>No tasks assigned to this client yet.</p>
                </div>
              ) : (
                <>
                  {/* Task Statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700">
                      <div className="font-medium text-gray-600 dark:text-gray-400 text-sm">Total Tasks</div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{clientTasks.length}</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg shadow-inner border border-yellow-200 dark:border-yellow-900/50">
                      <div className="font-medium text-yellow-700 dark:text-yellow-500 text-sm">Pending</div>
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{getTaskStatusCount('pending')}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-inner border border-blue-200 dark:border-blue-900/50">
                      <div className="font-medium text-blue-700 dark:text-blue-500 text-sm">Completed</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{getTaskStatusCount('completed')}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow-inner border border-green-200 dark:border-green-900/50">
                      <div className="font-medium text-green-700 dark:text-green-500 text-sm">Approved</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{getTaskStatusCount('approved')}</div>
                    </div>
                  </div>
                  
                  {/* Task List */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Task
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Assigned To
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {clientTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap sm:whitespace-normal">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{task.description}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {task.employee ? (
                                    <span className="bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full text-indigo-700 dark:text-indigo-300 text-xs">
                                      {task.employee.username}
                                    </span>
                                  ) : (
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500 dark:text-gray-400 text-xs">
                                      Unassigned
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                  {new Date(task.due_date).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
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
                onClick={() => setShowClientDetails(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg hover:shadow-lg transition-all"
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

export default ClientsPage;

