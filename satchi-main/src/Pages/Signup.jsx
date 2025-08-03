import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Hash, Building, Briefcase, Calendar, ChevronDown, UserCheck, CheckCircle, GraduationCap, BookOpenCheck, School, Lock, Eye, EyeOff } from 'lucide-react';

// --- Reusable Component for Form Inputs ---
const InputField = ({ name, type = 'text', placeholder, icon, error, value, onChange, className = '' }) => (
    <div className={`relative ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            {icon}
        </div>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full p-3 pl-12 rounded-lg bg-gray-900/50 border backdrop-blur-sm ${error ? 'border-red-500/50' : 'border-white/10'} focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 outline-none focus:shadow-[0_0_15px_rgba(255,107,59,0.5)]`}
        />
        <AnimatePresence>
            {error && <motion.p initial={{opacity: 0, y: -5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="text-red-400 text-xs mt-1 ml-2">{error}</motion.p>}
        </AnimatePresence>
    </div>
);

// --- Reusable Component for Password Inputs ---
const PasswordField = ({ name, placeholder, icon, error, value, onChange, className = '' }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <div className={`relative ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                {icon}
            </div>
            <input
                type={showPassword ? 'text' : 'password'}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full p-3 pl-12 pr-12 rounded-lg bg-gray-900/50 border backdrop-blur-sm ${error ? 'border-red-500/50' : 'border-white/10'} focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 outline-none focus:shadow-[0_0_15px_rgba(255,107,59,0.5)]`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-gray-400 hover:text-accent"
            >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <AnimatePresence>
                {error && <motion.p initial={{opacity: 0, y: -5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="text-red-400 text-xs mt-1 ml-2">{error}</motion.p>}
            </AnimatePresence>
        </div>
    );
};


// --- Reusable Component for Select Dropdowns ---
const SelectField = ({ name, placeholder, icon, error, value, onChange, options, disabled = false, className = '' }) => (
     <div className={`relative ${className}`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            {icon}
        </div>
        <select
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full p-3 pl-12 pr-10 rounded-lg appearance-none bg-gray-900/50 border backdrop-blur-sm ${error ? 'border-red-500/50' : 'border-white/10'} focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300 outline-none focus:shadow-[0_0_15px_rgba(255,107,59,0.5)] disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <option value="" disabled>{placeholder}</option>
            {options.map(opt => <option key={opt} value={opt} className="bg-gray-800">{opt}</option>)}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <ChevronDown className="text-gray-400" size={20} />
        </div>
        <AnimatePresence>
            {error && <motion.p initial={{opacity: 0, y: -5}} animate={{opacity: 1, y: 0}} exit={{opacity: 0}} className="text-red-400 text-xs mt-1 ml-2">{error}</motion.p>}
        </AnimatePresence>
    </div>
);


const SignupPage = () => {
    // --- Hierarchical Data Structure for Schools, Degrees, and Courses ---
    const schoolData = {
      "Amrita International Law": {
        "B.A., LL.B. (Hons.)": { years: 5 },
        "B.B.A., LL.B. (Hons.)": { years: 5 },
      },
      "School of Agricultural Sciences": {
        "B. Sc. (Hons.) Agriculture": { years: 4 },
        "M. Sc. (Agriculture) in Agronomy": { years: 2 },
        "Ph. D. in Agronomy": { years: 0 },
      },
      "School of Architecture": {
        "Bachelor of Architecture": { years: 5 },
        "Bachelor of Interior Design": { years: 4 },
      },
      "School of Artificial Intelligence": {
        "B.Tech in Artificial Intelligence and Data Science": { years: 4 },
        "B.Tech. Artificial Intelligence (AI) and Data Science (Medical Engineering)": { years: 4 },
        "B. Tech. Artificial Intelligence (AI) and Data Science (Cyber Physical Systems and Security)": { years: 4 },
        "B. Tech. Artificial Intelligence (AI) and Data Science (Autonomous Agents and Robotic Systems)": { years: 4 },
        "B.Tech. Artificial Intelligence (AI) and Data Science (Quantum Technologies)": { years: 4 },
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
        "B.Sc. (Honours) in Chemistry": { years: 3 },
        "B.Sc. (Honours) in Physics": { years: 3 },
        "M.Sc. Chemistry": { years: 2 },
        "Integrated MSc Data Science": { years: 5 },
        "Ph.D. in Chemistry": { years: 0 },
      },
      "School of Social & Behavioral Sciences": {
        "Bachelor of Social Work Honours with Research": { years: 4 },
        "MSW (Master of Social Work)": { years: 2 },
        "Ph.D. in Social Work": { years: 0 },
        "Post Graduate Diploma in Counselling Psychology": { years: 1 },
      },
    };

    const initialFormData = {
        fullName: '', email: '', password: '', confirmPassword: '', phone: '', school: '',
        degree: '', course: '', rollNo: '', sex: '', currentYear: '', position: ''
    };

    const [userType, setUserType] = useState('student');
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [isSuccess, setIsSuccess] = useState(false);

    // --- Memoized options for dependent dropdowns ---
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


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            console.log('Form Submitted Successfully:', formData);
            setIsSuccess(true);
            setFormData(initialFormData);
            setTimeout(() => setIsSuccess(false), 4000);
        } else {
            console.log('Form validation failed:', errors);
        }
    };

    return (
        <div className="relative my-20 w-full min-h-screen px-4 sm:px-6 lg:px-8 flex items-center justify-center text-white font-body overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-black">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative z-10 w-full max-w-5xl p-8 space-y-6 bg-black/30 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl shadow-accent/10"
            >
                <div className="text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-vibrant bg-clip-text text-transparent">Create Account</h1>
                    <p className="text-gray-400 mt-2">Join the Amrita event ecosystem.</p>
                </div>

                <div className="relative flex bg-black/40 rounded-lg p-1 border border-white/10">
                    <button onClick={() => handleUserTypeChange('student')} className={`relative w-1/2 p-2 rounded-md text-sm font-semibold z-10 transition-colors duration-300 ${userType === 'student' ? 'text-black' : 'text-white'}`}>Student</button>
                    <button onClick={() => handleUserTypeChange('faculty')} className={`relative w-1/2 p-2 rounded-md text-sm font-semibold z-10 transition-colors duration-300 ${userType === 'faculty' ? 'text-black' : 'text-white'}`}>Faculty</button>
                    <motion.div className="absolute top-1 bottom-1 left-1 w-1/2 h-[calc(100%-0.5rem)] bg-accent rounded-md" layoutId="active-pill" transition={{ type: "spring", stiffness: 380, damping: 35 }} animate={{ x: userType === 'student' ? '0%' : '100%' }}/>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {isSuccess && (
                             <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="md:col-span-2 bg-green-500/10 border border-green-500/30 text-green-300 p-3 rounded-lg text-center flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} /><span>Signup successful!</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <InputField name="fullName" placeholder="Full Name" icon={<User className="text-gray-400" size={20} />} error={errors.fullName} value={formData.fullName} onChange={handleInputChange} />
                    <InputField name="email" type="email" placeholder="Amrita Email Address" icon={<Mail className="text-gray-400" size={20} />} error={errors.email} value={formData.email} onChange={handleInputChange} />
                    <PasswordField name="password" placeholder="Password" icon={<Lock className="text-gray-400" size={20} />} error={errors.password} value={formData.password} onChange={handleInputChange} />
                    <PasswordField name="confirmPassword" placeholder="Confirm Password" icon={<Lock className="text-gray-400" size={20} />} error={errors.confirmPassword} value={formData.confirmPassword} onChange={handleInputChange} />
                    <InputField name="phone" type="tel" placeholder="10-Digit Phone Number" icon={<Phone className="text-gray-400" size={20} />} error={errors.phone} value={formData.phone} onChange={handleInputChange} />
                    
                    {userType === 'student' && <InputField name="rollNo" placeholder="Roll Number" icon={<Hash className="text-gray-400" size={20} />} error={errors.rollNo} value={formData.rollNo} onChange={handleInputChange} />}
                    
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={userType}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="contents"
                        >
                            {userType === 'student' && (
                                <>
                                    <SelectField name="school" placeholder="Select School" icon={<School className="text-gray-400" size={20} />} error={errors.school} value={formData.school} onChange={handleInputChange} options={schoolOptions} className="md:col-span-2" />
                                    <SelectField name="degree" placeholder="Select Degree" icon={<GraduationCap className="text-gray-400" size={20} />} error={errors.degree} value={formData.degree} onChange={handleInputChange} options={degreeOptions} disabled={!formData.school} />
                                    <SelectField name="course" placeholder="Select Course" icon={<BookOpenCheck className="text-gray-400" size={20} />} error={errors.course} value={formData.course} onChange={handleInputChange} options={courseOptions} disabled={!formData.degree} />
                                    <SelectField name="sex" placeholder="Select Sex" icon={<UserCheck className="text-gray-400" size={20} />} error={errors.sex} value={formData.sex} onChange={handleInputChange} options={['Male', 'Female', 'Other']} />
                                    
                                    {yearOptions.length > 0 && (
                                        <SelectField name="currentYear" placeholder="Current Year" icon={<Calendar className="text-gray-400" size={20} />} error={errors.currentYear} value={formData.currentYear} onChange={handleInputChange} options={yearOptions} disabled={!formData.course} />
                                    )}
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
                    
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        className="w-full p-3 rounded-lg bg-gradient-to-r from-accent to-vibrant text-black font-bold text-lg hover:shadow-lg hover:shadow-accent/40 transition-all duration-300 md:col-span-2"
                    >
                        Sign Up
                    </motion.button>
                </form>

                <p className="text-center text-sm text-gray-400">
                    Already have an account? <a href="#" className="font-semibold text-accent hover:text-vibrant">Log In</a>
                </p>
            </motion.div>
        </div>
    );
};

export default SignupPage;
