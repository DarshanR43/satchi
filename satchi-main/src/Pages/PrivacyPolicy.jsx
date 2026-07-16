import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <div className="relative min-h-[75vh] flex flex-col items-center justify-center p-8 bg-gradient-to-br from-white via-amber-50 to-orange-100 font-body">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl w-full bg-white/70 backdrop-blur-md rounded-3xl p-10 shadow-xl border border-white text-center"
      >
        <div className="inline-flex p-4 bg-orange-50 rounded-2xl text-[#ff6a3c] mb-6">
          <ShieldCheck size={48} />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent pb-2 mb-4">
          Privacy Policy
        </h1>
        <p className="text-lg text-gray-500 font-medium tracking-wide">
          Yet to be updated
        </p>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
