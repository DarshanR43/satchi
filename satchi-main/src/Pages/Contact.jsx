import React from 'react';
import ContactUs from '../Components/ContactUs';

const Contact = () => {
    return (
        <div className="relative w-full min-h-screen px-6 pb-20 pt-40 text-white font-body overflow-hidden bg-black">
            <canvas
                className="absolute inset-0 w-full h-full z-0 opacity-20 pointer-events-none"
                style={{ background: 'radial-gradient(circle, #FFAB00 0%, transparent 70%)' }}
            />
        <ContactUs />
        </div>
    );
};

export default Contact;