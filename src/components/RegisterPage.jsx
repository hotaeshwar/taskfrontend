import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/bid.png";
// Import FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faMapMarkerAlt, 
  faUserTag, 
  faIdCard, 
  faLock, 
  faEye, 
  faEyeSlash,
  faUserPlus 
} from "@fortawesome/free-solid-svg-icons";

const Register = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    state: "",
    role: "",
    password: "",
  });
  const [aadhaarCardFile, setAadhaarCardFile] = useState(null);
  const [states, setStates] = useState([]);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Fetch states from the backend
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get("https://admissionapi.buildingindiadigital.com/auth/states");
        if (response.data.success) {
          setStates(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch states:", err);
      }
    };
    fetchStates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setAadhaarCardFile(e.target.files[0]);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataObj = new FormData();
      formDataObj.append("first_name", formData.first_name);
      formDataObj.append("last_name", formData.last_name);
      formDataObj.append("state", formData.state);
      formDataObj.append("role", formData.role);
      formDataObj.append("password", formData.password);
      formDataObj.append("aadhaar_card", aadhaarCardFile);

      const response = await axios.post("https://admissionapi.buildingindiadigital.com/auth/register", formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Backend response:", response.data);

      if (response.data.success) {
        navigate("/login");
      } else {
        setError(response.data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      if (err.response && err.response.data) {
        console.log("Error response:", err.response.data);
        setError(err.response.data.detail?.message || "Registration failed. Please check your input.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FF9933] to-[#FFFFFF] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white shadow-2xl rounded-2xl border border-[#FF9933] overflow-hidden transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_60px_-10px_rgba(255,153,51,0.3)]">
        <div className="grid md:grid-cols-2">
          {/* Left Side - Decorative Background */}
          <div className="hidden md:flex bg-gradient-to-br from-[#FF9933] to-[#138808] opacity-90 items-center justify-center p-8">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Create Your Account</h2>
              <p className="text-lg mb-6">Join BID Admission and start your journey</p>
              <img 
                src={logo} 
                alt="BID Admission Logo" 
                className="mx-auto max-h-32 object-contain"
              />
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="p-6 sm:p-8 md:p-10 space-y-6">
            {/* Mobile Logo */}
            <div className="md:hidden flex justify-center mb-6">
              <img 
                src={logo} 
                alt="BID Admission Logo" 
                className="max-h-24 object-contain"
              />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#FF9933] to-[#138808]">
              Create Your Account
            </h2>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg animate-bounce">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FF9933]" 
                    />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-[#FF9933] focus:border-[#138808] transition duration-300 hover:border-[#138808]"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <div className="relative">
                    <FontAwesomeIcon 
                      icon={faUser} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FF9933]" 
                    />
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-[#FF9933] focus:border-[#138808] transition duration-300 hover:border-[#138808]"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* State Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <div className="relative">
                  <FontAwesomeIcon 
                    icon={faMapMarkerAlt} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FF9933]" 
                  />
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-[#FF9933] focus:border-[#138808] transition duration-300 hover:border-[#138808] appearance-none"
                    required
                  >
                    <option value="" disabled>Select your state</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.name}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="relative">
                  <FontAwesomeIcon 
                    icon={faUserTag} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FF9933]" 
                  />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-[#FF9933] focus:border-[#138808] transition duration-300 hover:border-[#138808] appearance-none"
                    required
                  >
                    <option value="" disabled>Select your role</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <FontAwesomeIcon 
                    icon={faLock} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FF9933]" 
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 p-3 border rounded-lg focus:ring-2 focus:ring-[#FF9933] focus:border-[#138808] transition duration-300 hover:border-[#138808]"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#FF9933] hover:text-[#138808] focus:outline-none"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Aadhaar Card Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Card</label>
                <div className="relative border-2 border-dashed border-[#FF9933] rounded-lg p-4 bg-[#FFFFFF] hover:bg-[#F0F0F0] transition duration-300 group">
                  <FontAwesomeIcon 
                    icon={faIdCard} 
                    className="absolute left-4 top-6 text-[#FF9933] group-hover:text-[#138808]" 
                  />
                  <input
                    type="file"
                    name="aadhaar_card"
                    onChange={handleFileChange}
                    className="w-full pl-10 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#FF9933] file:text-white hover:file:bg-[#FF7F00]"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2 pl-10">Upload a clear image of your Aadhaar card</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF9933] to-[#138808] text-white py-3 rounded-lg hover:from-[#FF7F00] hover:to-[#007F3D] transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                <span>Create Account</span>
              </button>
            </form>
            
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-[#FF9933] font-bold hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
