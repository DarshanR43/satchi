import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, ArrowRight, Bell, Info } from 'lucide-react';

const SubSubEventModal = ({ subEvent, isOpen, onClose, onRegister }) => {
  if (!isOpen || !subEvent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 10 }}
          className="bg-white w-full max-w-5xl mx-auto rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Unified with Admin Dashboard Theme */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex p-2.5 bg-orange-50 rounded-xl text-[#ff6a3c]">
                <Trophy size={20} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                  {subEvent.name}
                </h2>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                  Available Programs
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Content Area */}
          <div className="p-8 max-h-[75vh] overflow-y-auto">
            {/* Description Section */}
            <div className="flex gap-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100 mb-8">
              <Info className="text-[#df9400] shrink-0" size={20} />
              <p className="text-sm text-gray-700 leading-relaxed">
                {subEvent.description || "Select from the list of workshops and competitions below to register for this event track."}
              </p>
            </div>

            {/* List-Based Competition Layout */}
            <div className="space-y-3">
              {subEvent.subSubEvents && subEvent.subSubEvents.length > 0 ? (
                subEvent.subSubEvents.map((ssEvent) => {
                  const isRegistrationOpen = subEvent.isOpen && ssEvent.isOpen;
                  return (
                    <motion.div 
                      key={ssEvent.id}
                      whileHover={{ x: 4 }}
                      className="group flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white hover:border-orange-200 hover:shadow-md transition-all gap-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 group-hover:text-[#ff6a3c] transition-colors">
                          {ssEvent.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {ssEvent.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isRegistrationOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isRegistrationOpen ? 'OPEN' : 'CLOSED'}
                        </span>
                        <button 
                          onClick={() => onRegister(ssEvent)} 
                          disabled={!isRegistrationOpen} 
                          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            isRegistrationOpen 
                              ? 'bg-gray-900 text-white hover:bg-[#ff6a3c] shadow-sm' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Register <ArrowRight size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <Bell className="mx-auto text-gray-300 mb-3" size={32} />
                  <p className="text-gray-400">No events scheduled yet. Please check back later.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubSubEventModal;