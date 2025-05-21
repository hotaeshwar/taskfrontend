import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { 
  faUser, 
  faLock, 
  faSignInAlt, 
  faEnvelope, 
  faUserPlus, 
  faKey,
  faTachometerAlt,
  faTasks,
  faUsers,
  faBuilding,
  faSignOutAlt,
  faBars,
  faTimes,
  faUserCircle,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faClipboardCheck,
  faFileAlt,
  faCalendarAlt,
  faCalendarDay,
  faClock,
  faFilter,
  faSearch,
  faEdit,
  faPlus
} from '@fortawesome/free-solid-svg-icons'

// Add icons to the library
library.add(
  faUser,
  faLock,
  faSignInAlt,
  faEnvelope,
  faUserPlus,
  faKey,
  faTachometerAlt,
  faTasks,
  faUsers,
  faBuilding,
  faSignOutAlt,
  faBars,
  faTimes,
  faUserCircle,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faClipboardCheck,
  faFileAlt,
  faCalendarAlt,
  faCalendarDay,
  faClock,
  faFilter,
  faSearch,
  faEdit,
  faPlus
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)