import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const EventContent = ({ event, onOpenModal }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#ff6a3c] to-[#df9400] bg-clip-text text-transparent">
          {event.name}
        </h2>
        <span className={`flex-shrink-0 text-xs font-semibold mt-1 px-3 py-1.5 rounded-full ${
            event.isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {event.isOpen ? "Registrations Open" : "Registrations Closed"}
        </span>
      </div>
      
      <p className="text-gray-600 mb-6">{event.description || "An exciting event full of challenges and opportunities."}</p>

      <div>
        {event.subEvents.map((subEvent, index) => (
          <motion.button
            key={subEvent.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
            onClick={() => event.isOpen && onOpenModal(subEvent)}
            disabled={!event.isOpen}
            className="w-full text-left flex flex-col mb-3 p-4 rounded-xl bg-white/70 border border-transparent shadow-sm hover:shadow-md hover:border-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${subEvent.isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {subEvent.isOpen ? "Open" : "Closed"}
                </span>
                <h3 className="font-semibold text-base text-gray-800">{subEvent.name}</h3>
              </div>
              <p className="text-gray-600 text-sm">{subEvent.description}</p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-orange-500 text-sm font-semibold">
                <span>View Details</span>
                <ChevronDown size={16} className="-rotate-90" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default EventContent;