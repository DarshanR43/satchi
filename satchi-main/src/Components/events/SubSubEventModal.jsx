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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white w-full max-w-3xl mx-auto rounded-lg shadow-xl border border-gray-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-[#ff6a3c]/10 to-[#df9400]/10">
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#ff6a3c] to-[#df9400] bg-clip-text text-transparent">{subEvent.name}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200/50 rounded-full transition-colors"><X size={22} className="text-gray-600" /></button>
          </div>
          <div className="p-6 max-h-[65vh] overflow-y-auto">
            <p className="text-gray-700 mb-6">{subEvent.description}</p>
            <h3 className="text-lg font-semibold text-[#df9400] border-b border-[#df9400]/30 pb-2 mb-4">Competitions & Workshops</h3>
            {subEvent.subSubEvents && subEvent.subSubEvents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {subEvent.subSubEvents.map((ssEvent) => {
                  const isRegistrationOpen = subEvent.isOpen && ssEvent.isOpen;
                  return (
                    <div key={ssEvent.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-lg hover:border-orange-300 transition-all duration-300">
                      <h4 className="font-semibold text-gray-800">{ssEvent.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{ssEvent.description}</p>
                      <button onClick={() => onRegister(ssEvent)} disabled={!isRegistrationOpen} className="mt-4 w-full px-4 py-2 rounded-md text-sm font-semibold bg-gradient-to-r from-[#ff6a3c] to-[#df9400] text-white hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none">
                        {isRegistrationOpen ? 'Register' : 'Registration Closed'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (<p className="text-gray-500 text-center py-4">No specific events announced yet. Stay tuned!</p>)}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubSubEventModal;