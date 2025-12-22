import React from "react";

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const ArrowUpIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
  </svg>
);


const Footer = () => {

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    // Added 'z-0' here to prevent footer from overlapping higher z-index modals
    <footer className="relative z-0 w-full bg-gradient-to-t from-orange-100 via-amber-50 to-white pt-16 pb-8 text-gray-800 font-body overflow-hidden">
      <div
        className="absolute inset-0 bg-grid-gray-200/[0.4] z-0"
        style={{ maskImage: 'linear-gradient(to top, black 20%, transparent 100%)' }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-sm">
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#df9400]">SATCHI Tech Fest</h4>
            <p className="text-gray-600 leading-relaxed">
              A celebration of technical ingenuity and a glimpse into the future, envisioned by the brightest young minds.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#df9400]">Quick Links</h4>
            <ul className="space-y-2 text-gray-600">
              <li><a href="/" className="hover:text-[#ff6a3c] transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-[#ff6a3c] transition-colors">About</a></li>
              <li><a href="/events" className="hover:text-[#ff6a3c] transition-colors">Events</a></li>
              <li><a href="/register" className="hover:text-[#ff6a3c] transition-colors">Register</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#df9400]">Venue</h4>
            <p className="text-gray-600 leading-relaxed">
              Amrita Vishwa Vidyapeetham <br />
              Amrita Nagar, Ettimadai, <br />
              Coimbatore, Tamil Nadu - 641112
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#df9400]">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" aria-label="Github" className="text-gray-500 hover:text-[#ff6a3c] transition-colors"><GithubIcon /></a>
              <a href="#" aria-label="LinkedIn" className="text-gray-500 hover:text-[#ff6a3c] transition-colors"><LinkedinIcon /></a>
              <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-[#ff6a3c] transition-colors"><InstagramIcon /></a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200/80 flex flex-col items-center text-center">
          <p className="text-sm text-gray-500">
            2025-2026 GYAN, All Rights Reserved.
          </p>
        </div>
      </div>
      
      <button
        onClick={scrollToTop}
        className="absolute bottom-8 right-8 p-3 rounded-full bg-[#ff6a3c] text-white shadow-lg shadow-orange-500/30 hover:bg-[#e65c30] transition-all"
        aria-label="Scroll to top"
      >
        <ArrowUpIcon />
      </button>
    </footer>
  );
};

export default Footer;
