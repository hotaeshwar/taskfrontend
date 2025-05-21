import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import TasksPage from './components/TasksPage';
import EmployeesPage from './components/EmployeesPage';
import ClientsPage from './components/ClientsPage';
import Attendance from './components/Attendance'; // Import the Attendance component
import Loader from './components/Loader';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Function to check authentication status
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoggedIn(false);
      setUserData(null);
      setIsLoading(false);
      return;
    }

    // Fetch user data with the token
    fetch('http://localhost:8000/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          // If token is invalid, clear it
          localStorage.removeItem('token');
          throw new Error('Invalid token');
        }
      })
      .then(data => {
        setUserData(data);
        setIsLoggedIn(true);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setIsLoggedIn(false);
        setUserData(null);
        setIsLoading(false);
      });
  };

  // Check auth status when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setUserData(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserData(null);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard userData={userData} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/tasks"
          element={isLoggedIn ? <TasksPage userData={userData} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/employees"
          element={isLoggedIn ? <EmployeesPage userData={userData} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/clients"
          element={isLoggedIn ? <ClientsPage userData={userData} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        {/* Add the Attendance route */}
        <Route
          path="/attendance"
          element={isLoggedIn ? <Attendance userData={userData} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;