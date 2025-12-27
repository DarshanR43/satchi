import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Hash, School, Briefcase, Calendar, ChevronDown, UserCheck, CheckCircle, GraduationCap, BookOpenCheck, Lock, Eye, EyeOff, WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InputField = ({ name, type = 'text', placeholder, icon, error, value, onChange, className = '' }) => (
    <div className={`relative ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">{icon}</div>
        <input
            type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
            className={`w-full p-3 pl-12 rounded-lg bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition-all duration-300 outline-none`}
        />
        <AnimatePresence>
            {error && <motion.p initial={{opacity: 0, y: -5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="text-red-600 text-xs mt-1 ml-2">{error}</motion.p>}
        </AnimatePresence>
    </div>
);

const PasswordField = ({ name, placeholder, icon, error, value, onChange, onGenerateClick, isGenerating, className = '' }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">{icon}</div>
            <input
                type={showPassword ? 'text' : 'password'} name={name} value={value} onChange={onChange} placeholder={placeholder}
                className={`w-full p-3 pl-12 pr-24 rounded-lg bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition-all duration-300 outline-none`}
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center z-10">
                {onGenerateClick && (
                    <button type="button" onClick={onGenerateClick} disabled={isGenerating} className="p-2 text-gray-400 hover:text-[#ff6a3c] disabled:opacity-50 disabled:cursor-wait">
                        {isGenerating ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><WandSparkles size={20} /></motion.div> : <WandSparkles size={20} />}
                    </button>
                )}
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-gray-400 hover:text-[#ff6a3c]">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <AnimatePresence>
                {error && <motion.p initial={{opacity: 0, y: -5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="text-red-600 text-xs mt-1 ml-2">{error}</motion.p>}
            </AnimatePresence>
        </div>
    );
};

const SelectField = ({ name, placeholder, icon, error, value, onChange, options, disabled = false, className = '' }) => (
    <div className={`relative ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">{icon}</div>
        <select
            name={name} value={value} onChange={onChange} disabled={disabled}
            className={`w-full p-3 pl-12 pr-10 rounded-lg appearance-none bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition-all duration-300 outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(opt => <option key={opt} value={opt} className="bg-white">{opt}</option>)}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none"><ChevronDown className="text-gray-400" size={20} /></div>
        <AnimatePresence>
            {error && <motion.p initial={{opacity: 0, y: -5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="text-red-600 text-xs mt-1 ml-2">{error}</motion.p>}
        </AnimatePresence>
    </div>
);


const SignupPage = () => {
    const navigate = useNavigate();
    const schoolData = {
      "Amrita International Law": {
        "B.A., LL.B. (Hons.)": { years: 5 },
        "B.B.A., LL.B. (Hons.)": { years: 5 },
      },
      "School of Agricultural Sciences": {
        "B. Sc. in (Hons.) Agriculture": { years: 4 },
        "M. Sc. in (Agriculture) in Agronomy": { years: 2 },
        "Ph. D. in Agronomy": { years: 0 },
      },
      "School of Architecture": {
        "Bachelor of Architecture": { years: 5 },
        "Bachelor of Interior Design": { years: 4 },
      },
      "School of Artificial Intelligence": {
        "B. Tech. in Artificial Intelligence and Data Science": { years: 4 },
        "B. Tech. in  Artificial Intelligence (AI) and Data Science (Medical Engineering)": { years: 4 },
        "B. Tech. in Artificial Intelligence (AI) and Data Science (Cyber Physical Systems and Security)": { years: 4 },
        "B. Tech. in Artificial Intelligence (AI) and Data Science (Autonomous Agents and Robotic Systems)": { years: 4 },
        "B. Tech. in Artificial Intelligence (AI) and Data Science (Quantum Technologies)": { years: 4 },
      },
      "School of Arts, Humanities & Commerce": {
        "B. A. (Hons) with Research in Mass Communication with Business Management and Media": { years: 4 },
        "B. A. (Hons) with Research in Mass Communication with Digital Design and Animation": { years: 4 },
        "MA Communication": { years: 2 },
        "Ph. D. in Communication": { years: 0 },
      },
      "School of Business": {
        "MBA": { years: 2 },
      },
      "School of Computing": {
        "B. Tech. in Computer Science and Engineering (CSE)": { years: 4 },
        "B. Tech. in Computer Science and Engineering (Cyber Security)": { years: 4 },
        "B. Tech. in Computer Science and Engineering (Artificial Intelligence)": { years: 4 },
        "M. Tech. in Computer Science & Engineering": { years: 2 },
        "M. Tech. in Data Science": { years: 2 },
        "M. Tech. in Cyber Security": { years: 2 },
        "M. Tech. in Artificial Intelligence": { years: 2 },
      },
      "School of Engineering": {
        "B. Tech. in Mechanical Engineering": { years: 4 },
        "B. Tech. in Electronics and Communication Engineering": { years: 4 },
        "M. Tech. in VLSI Design": { years: 2 },
        "Ph. D. in Cyber Security": { years: 0 },
      },
      "School of Physical Sciences": {
        "B. Sc. in (Honours) in Chemistry": { years: 3 },
        "B. Sc. in (Honours) in Physics": { years: 3 },
        "M. Sc. in Chemistry": { years: 2 },
        "Integrated M. Sc. in Data Science": { years: 5 },
        "Ph. D. in Chemistry": { years: 0 },
      },
      "School of Social & Behavioral Sciences": {
        "Bachelor of Social Work Honours with Research": { years: 4 },
        "MSW (Master of Social Work)": { years: 2 },
        "Ph. D. in Social Work": { years: 0 },
        "Post Graduate Diploma in Counselling Psychology": { years: 1 },
      },
    };

    const initialFormData = { fullName: '', email: '', password: '', confirmPassword: '', phone: '', school: '', degree: '', course: '', rollNo: '', sex: '', currentYear: '', position: '' };
    const [userType, setUserType] = useState('student');
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);

    const schoolOptions = Object.keys(schoolData);
    const degreeOptions = useMemo(() => formData.school ? Object.keys(schoolData[formData.school]).map(d => d.split(' in ')[0]).filter((v, i, a) => a.indexOf(v) === i) : [], [formData.school]);
    const courseOptions = useMemo(() => {
        if (!formData.school || !formData.degree) return [];
        return Object.keys(schoolData[formData.school]).filter(courseName => courseName.startsWith(formData.degree));
    }, [formData.school, formData.degree]);
    const yearOptions = useMemo(() => {
        if (!formData.course || !formData.school) return [];
        const years = schoolData[formData.school][formData.course]?.years;
        if (!years) return [];
        return Array.from({ length: years }, (_, i) => `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Year`);
    }, [formData.course, formData.school]);

    useEffect(() => {
        if (degreeOptions.length === 1 && formData.degree !== degreeOptions[0]) {
            setFormData(prev => ({ ...prev, degree: degreeOptions[0] }));
        }
    }, [degreeOptions, formData.degree]);

    useEffect(() => {
        if (courseOptions.length === 1 && formData.course !== courseOptions[0]) {
            setFormData(prev => ({ ...prev, course: courseOptions[0] }));
        }
    }, [courseOptions, formData.course]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            
            if (name === 'email' && userType === 'student') {
                newState.rollNo = value.slice(0, 16).toUpperCase();
            }

            if (name === 'school') {
                newState.degree = '';
                newState.course = '';
                newState.currentYear = '';
            }
            if (name === 'degree') {
                newState.course = '';
                newState.currentYear = '';
            }
            if (name === 'course') {
                newState.currentYear = '';
            }
            return newState;
        });
    };

    const handleUserTypeChange = (newUserType) => {
        if (userType !== newUserType) {
            setUserType(newUserType);
            setErrors({});
            setFormData(initialFormData);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/^[^\s@]+@(.+\.)?amrita\.edu$/.test(formData.email.trim())) {
            newErrors.email = 'Email must be a valid Amrita domain (e.g., user@cb.amrita.edu)';
        }
        
        // Password validation
        if (!formData.password) newErrors.password = 'Password is required.';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
        if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
        else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (!phoneDigits) newErrors.phone = 'Phone number is required.';
        else if (phoneDigits.length !== 10) newErrors.phone = 'Please enter a valid 10-digit phone number.';

        if (userType === 'student') {
            if (!formData.school) newErrors.school = 'School is required.';
            if (!formData.degree) newErrors.degree = 'Degree is required.';
            if (!formData.course) newErrors.course = 'Course is required.';
            if (!formData.rollNo.trim()) newErrors.rollNo = 'Roll number is required.';
            if (!formData.sex) newErrors.sex = 'Sex is required.';
            if (yearOptions.length > 0 && !formData.currentYear) newErrors.currentYear = 'Current year is required.';
        }

        if (userType === 'faculty') {
            if (!formData.position.trim()) newErrors.position = 'Position is required.';
            if (!formData.school) newErrors.school = 'School is required.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSuccess(false);
        setErrors({});

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/signup/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...formData,
                userType,
            }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setFormData({
                    fullName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    phone: '',
                    rollNo: '',
                    school: '',
                    degree: '',
                    course: '',
                    sex: '',
                    currentYear: '',
                    position: '',
                });
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
            setErrors(data.errors || { general: data.message || "Signup failed." });
            }
        } catch (error) {
            console.error("Signup error:", error);
            setErrors({ general: "Something went wrong. Please try again." });
        }
    };


    return (
        <div className="relative w-full min-h-screen px-4 sm:px-6 flex items-center justify-center font-body text-gray-800 py-20">
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-amber-50 to-orange-100"></div>
            <div className="absolute inset-0 z-0 bg-grid-gray-200/[0.4]"></div>

            <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative z-10 w-full max-w-4xl p-8 space-y-6 bg-white/80 border border-gray-200/90 rounded-3xl backdrop-blur-lg shadow-2xl"
            >
                <div className="text-center">
                    <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent">Create an Account</h1>
                    <p className="text-gray-600 mt-2">Join the GYAN Community.</p>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200/90">
                    <button onClick={() => handleUserTypeChange('student')} className={`relative w-1/2 p-2 rounded-md text-sm font-semibold transition-colors duration-300 ${userType !== 'student' ? 'text-gray-600' : ''}`}>
                        {userType === 'student' && <motion.div layoutId="userTypePill" className="absolute inset-0 bg-white shadow-md rounded-md z-0"></motion.div>}
                        <span className="relative z-10">Student</span>
                    </button>
                    <button onClick={() => handleUserTypeChange('faculty')} className={`relative w-1/2 p-2 rounded-md text-sm font-semibold transition-colors duration-300 ${userType !== 'faculty' ? 'text-gray-600' : ''}`}>
                        {userType === 'faculty' && <motion.div layoutId="userTypePill" className="absolute inset-0 bg-white shadow-md rounded-md z-0"></motion.div>}
                        <span className="relative z-10">Faculty</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {isSuccess && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:col-span-2 bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg text-center flex items-center justify-center gap-2">
                                <CheckCircle size={20} /><span>Signup Successful! Redirecting to login...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <InputField name="fullName" placeholder="Full Name" icon={<User className="text-gray-400" size={20} />} error={errors.fullName} value={formData.fullName} onChange={handleInputChange} />
                    <InputField name="email" type="email" placeholder="Amrita Email Address" icon={<Mail className="text-gray-400" size={20} />} error={errors.email} value={formData.email} onChange={handleInputChange} />
                    <PasswordField name="password" placeholder="Password" icon={<Lock className="text-gray-400" size={20} />} error={errors.password} value={formData.password} onChange={handleInputChange} isGenerating={isGeneratingPassword}/>
                    <PasswordField name="confirmPassword" placeholder="Confirm Password" icon={<Lock className="text-gray-400" size={20} />} error={errors.confirmPassword} value={formData.confirmPassword} onChange={handleInputChange} />
                    <InputField name="phone" type="tel" placeholder="10-Digit Phone Number" icon={<Phone className="text-gray-400" size={20} />} error={errors.phone} value={formData.phone} onChange={handleInputChange} />
                    
                    {userType === 'student' && <InputField name="rollNo" placeholder="Roll Number" icon={<Hash className="text-gray-400" size={20} />} error={errors.rollNo} value={formData.rollNo} onChange={handleInputChange} />}
                    
                    <AnimatePresence mode="wait">
                        <motion.div key={userType} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3 }} className="contents">
                            {userType === 'student' && (
                                <>
                                    <SelectField name="school" placeholder="Select School" icon={<School className="text-gray-400" size={20} />} error={errors.school} value={formData.school} onChange={handleInputChange} options={schoolOptions} className="md:col-span-2" />
                                    <SelectField name="degree" placeholder="Select Degree" icon={<GraduationCap className="text-gray-400" size={20} />} error={errors.degree} value={formData.degree} onChange={handleInputChange} options={degreeOptions} disabled={!formData.school} />
                                    <SelectField name="course" placeholder="Select Course" icon={<BookOpenCheck className="text-gray-400" size={20} />} error={errors.course} value={formData.course} onChange={handleInputChange} options={courseOptions} disabled={!formData.degree} />
                                    <SelectField name="sex" placeholder="Select Sex" icon={<UserCheck className="text-gray-400" size={20} />} error={errors.sex} value={formData.sex} onChange={handleInputChange} options={['Male', 'Female', 'Other']} />
                                    {yearOptions.length > 0 && <SelectField name="currentYear" placeholder="Current Year" icon={<Calendar className="text-gray-400" size={20} />} error={errors.currentYear} value={formData.currentYear} onChange={handleInputChange} options={yearOptions} disabled={!formData.course} />}
                                </>
                            )}
                            {userType === 'faculty' && (
                                <>
                                    <SelectField name="school" placeholder="Select School" icon={<School className="text-gray-400" size={20} />} error={errors.school} value={formData.school} onChange={handleInputChange} options={schoolOptions} />
                                    <InputField name="position" placeholder="Position (e.g., Professor)" icon={<Briefcase className="text-gray-400" size={20} />} error={errors.position} value={formData.position} onChange={handleInputChange} />
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                    
                    <motion.button whileHover={{ scale: 1.02, boxShadow: "0px 10px 25px -10px rgba(255, 106, 60, 0.6)" }} whileTap={{ scale: 0.98 }} type="submit" className="w-full p-3 rounded-lg bg-[#ff6a3c] text-white font-bold text-lg transition-all duration-300 md:col-span-2">
                        Sign Up
                    </motion.button>
                </form>

                <p className="text-center text-sm text-gray-600">
                    Already have an account? <a href="/login" className="font-semibold text-[#df9400] hover:text-[#ff6a3c] hover:underline">Log In</a>
                </p>
            </motion.div>
        </div>
    );
};

export default SignupPage;