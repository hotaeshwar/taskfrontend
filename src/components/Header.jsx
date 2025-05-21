import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faUserCircle } from '@fortawesome/free-solid-svg-icons';

const Header = ({ userData, toggleSidebar }) => {
  return (
    <header className="bg-white bg-opacity-90 backdrop-blur-sm shadow-lg h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 border-b border-gray-100">
      {/* Left section: Hamburger menu for mobile & Company name */}
      <div className="flex items-center">
        <button 
          className="lg:hidden text-indigo-600 hover:text-indigo-800 focus:outline-none mr-4 transition-transform duration-300 hover:scale-110 active:scale-95"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar menu"
        >
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
        
        <h1 className="text-xl font-bold hidden lg:block">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">BID</span>
          <span className="text-gray-700"> Task Allocator</span>
        </h1>
      </div>
      
      {/* Right section: User profile (simplified) */}
      <div className="flex items-center">
        <div className="text-right mr-3">
          <p className="text-sm font-medium text-gray-900">{userData?.username || 'User'}</p>
          <p className="text-xs text-gray-500 capitalize">{userData?.role || 'Guest'}</p>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
          <FontAwesomeIcon icon={faUserCircle} />
        </div>
      </div>
    </header>
  );
};

export default Header;