import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const SubSubEventModal = ({ subEvent, isOpen, onClose, onRegister }) => {
  if (!isOpen || !subEvent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          // CHANGED: Increased max-width from max-w-3xl to max-w-6xl for better visibility
          className="bg-white w-full max-w-6xl mx-auto rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#ff6a3c]/10 to-[#df9400]/10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6a3c] to-[#df9400] bg-clip-text text-transparent">
              {subEvent.name}
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-200/50 rounded-full transition-colors"
            >
              <X size={28} className="text-gray-600" />
            </button>
          </div>
          
          {/* CHANGED: Increased max-height from 65vh to 80vh */}
          <div className="p-8 max-h-[80vh] overflow-y-auto">
            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
              {subEvent.description}
            </p>
            
            <h3 className="text-xl font-semibold text-[#df9400] border-b border-[#df9400]/30 pb-2 mb-6">
              Competitions & Workshops
            </h3>
            
            {subEvent.subSubEvents && subEvent.subSubEvents.length > 0 ? (
              // CHANGED: Grid now allows 3 columns on medium screens (md:grid-cols-3)
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                {subEvent.subSubEvents.map((ssEvent) => {
                  const isRegistrationOpen = subEvent.isOpen && ssEvent.isOpen;
                  return (
                    <div 
                      key={ssEvent.id} 
                      className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 flex flex-col justify-between h-full"
                    >
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">{ssEvent.name}</h4>
                        <p className="text-gray-600 mt-2 text-sm">{ssEvent.description}</p>
                      </div>
                      <button 
                        onClick={() => onRegister(ssEvent)} 
                        disabled={!isRegistrationOpen} 
                        className="mt-5 w-full px-4 py-3 rounded-md text-sm font-semibold bg-gradient-to-r from-[#ff6a3c] to-[#df9400] text-white hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {isRegistrationOpen ? 'Register Now' : 'Registration Closed'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 text-lg">
                No specific events announced yet. Stay tuned!
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubSubEventModal;