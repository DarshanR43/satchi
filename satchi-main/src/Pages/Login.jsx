import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Import the useAuth hook

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      await login(email, password);
      navigate("/profile"); // Navigate to profile page on successful login
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error("Error during login:", err);
    }
  };

  // The rest of your validation logic can remain the same
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const emailRegex = /^[^\s@]+@(.+\.)?amrita\.edu$/;

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(newPassword.length < 8 ? 'Password must be at least 8 characters long.' : '');
  };

  const handleEmailChange = (e) => {
      const newEmail = e.target.value;
      setEmail(newEmail);
      setEmailError(newEmail.length > 0 && !emailRegex.test(newEmail) ? "Invalid format. Email must end with amrita.edu" : "");
  };

  useEffect(() => {
    setIsFormValid(emailRegex.test(email) && password.length >= 8);
  }, [email, password]);


  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4 font-body text-gray-800">
        {/* Themed Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="relative z-10 w-full max-w-md mx-auto bg-white/80 backdrop-blur-lg border border-gray-200/90 shadow-2xl rounded-2xl p-8"
      >
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-[#ff6a3c] to-[#df9400] bg-clip-text text-transparent">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <p className="text-red-600 text-center bg-red-100 border border-red-300 p-3 rounded-lg text-sm">{error}</p>}
          
          {/* Email Input */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2 text-sm font-semibold text-gray-600">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="e.g., cb.en.u4cse21001@amrita.edu"
              required
              className={`w-full px-4 py-2 rounded-lg bg-gray-50 border ${emailError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition`}
            />
            {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
          </div>

          {/* Password Input */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-2 text-sm font-semibold text-gray-600">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
              className={`w-full px-4 py-2 rounded-lg bg-gray-50 border ${passwordError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition`}
            />
            {passwordError && <p className="text-red-600 text-xs mt-1">{passwordError}</p>}
          </div>
          
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-[#ff6a3c] text-white hover:shadow-lg hover:shadow-orange-500/50 font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out mt-4 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            Login
          </button>

          <p className="text-center text-gray-600 mt-4 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-[#df9400] hover:underline hover:text-[#ff6a3c]">
              Sign Up
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
