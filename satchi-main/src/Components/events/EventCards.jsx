import React from 'react';
import { motion } from 'framer-motion';

const EventSidebar = ({ events, selectedEventId, onSelectEvent }) => {
  return (
    <aside className="lg:col-span-1">
      <div className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">Categories</h2>
        <ul className="space-y-2">
          {events.map(event => {
            const isSelected = event.id === selectedEventId;
            return (
              <li key={event.id}>
                <button
                  onClick={() => onSelectEvent(event.id)}
                  className={`w-full text-left font-semibold p-3 rounded-lg transition-all duration-300 flex items-center justify-between ${
                    isSelected 
                      ? 'bg-gradient-to-r from-[#ff6a3c] to-[#df9400] text-white shadow-md' 
                      : 'hover:bg-orange-100/50 text-gray-700'
                  }`}
                >
                  {event.name}
                  <span className={`w-2.5 h-2.5 rounded-full ml-2 ${event.isOpen ? 'bg-green-400' : 'bg-red-400'} ${isSelected ? 'bg-opacity-100' : 'bg-opacity-50'}`}></span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default EventSidebar;