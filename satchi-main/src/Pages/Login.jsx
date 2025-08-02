import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState('');

  const [isFormValid, setIsFormValid] = useState(false);

  const emailRegex = /^[a-z0-9.@]+.amrita\.edu$/;

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword.length > 0 && (newPassword.length < 6 || newPassword.length > 8)) {
      setPasswordError('Password must be 6-8 characters long.');
    } else {
      setPasswordError('');
    }
  };

  const handleEmailChange = (e) => {
      const newEmail = e.target.value;
      setEmail(newEmail);
      if (newEmail.length > 0 && !emailRegex.test(newEmail)) {
          setEmailError("Invalid format. Email must end with amrita.edu");
      } else {
          setEmailError("");
      }
  };

  useEffect(() => {
    const isEmailValid = emailRegex.test(email);
    const isPasswordValid = password.length >= 6 && password.length <= 8;
    setIsFormValid(isEmailValid && isPasswordValid);
  }, [email, password, emailRegex]);


const handleSubmit = async (e) => {
  e.preventDefault();

  if (!isFormValid) {
    console.error("Attempted to submit with invalid form.");
    return;
  }

  try {
    const response = await fetch("http://localhost:8000/api/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    console.log("Login successful:", data);

    // e.g., store token or redirect
    // localStorage.setItem("token", data.token);
    // navigate("/dashboard");

  } catch (error) {
    console.error("Error during login:", error);
  }
};

  return(
    <div className="pt-12 my-40">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        viewport={{ once: true }}
        className="w-full max-w-md mx-auto backdrop-blur-md bg-white/5 border border-white/10 text-white shadow-xl rounded-xl p-8"
      >
        <h2 className="text-3xl font-semibold text-accent text-center mb-6">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email Input */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2 text-sm font-medium text-gray-300">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="e.g., yourname.amrita.edu"
              required
              className={`w-full px-4 py-2 rounded-md bg-black/20 text-white border ${emailError ? 'border-red-400' : 'border-white/20'} focus:outline-none focus:ring-2 focus:ring-accent`}
            />
            {emailError && <p className="text-red-400 text-sm mt-1">{emailError}</p>}
          </div>

          {/* Password Input */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-2 text-sm font-medium text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              required
              className={`w-full px-4 py-2 rounded-md bg-black/20 text-white border ${passwordError ? 'border-red-400' : 'border-white/20'} focus:outline-none focus:ring-2 focus:ring-accent`}
            />
            {passwordError && <p className="text-red-400 text-sm mt-1">{passwordError}</p>}
          </div>
          
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-accent text-deepBlue hover:shadow-[0_0_20px_#FFAB00] font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out mt-4 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Login
          </button>

          <p className="text-center text-gray-400 mt-4 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-[#FF805A] hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
    )
}

export default Login;