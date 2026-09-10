// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full pt-16 pb-12 bg-[#1b2127] text-[#c1c7cf] border-t border-[#30363c]">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Copyright */}
        <div className="col-span-1 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-white text-[#002045] flex items-center justify-center text-sm font-bold">
                🏠
              </span>
              <span className="font-headline text-xl font-bold text-white tracking-tight">
                Namma <span className="text-[#fe6c6b]">Mane</span>
              </span>
            </div>
            <p className="text-sm text-[#989fa6] max-w-sm leading-relaxed">
              Find your home which matches your vibe. Connect directly with verified owners in Bengaluru, Mumbai, Delhi NCR, Goa, Hyderabad & Pune with zero broker commission.
            </p>
          </div>
          <p className="text-xs text-[#989fa6] mt-8 md:mt-0">
            © {new Date().getFullYear()} Namma Mane India Technologies Pvt. Ltd. All rights reserved.
          </p>
        </div>

        {/* Top Cities */}
        <div>
          <h4 className="font-headline text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Popular Cities
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/" className="text-[#c1c7cf] hover:text-white transition-colors">
                Homes in Bengaluru
              </Link>
            </li>
            <li>
              <Link to="/" className="text-[#c1c7cf] hover:text-white transition-colors">
                Flats in Mumbai
              </Link>
            </li>
            <li>
              <Link to="/" className="text-[#c1c7cf] hover:text-white transition-colors">
                Villas in Goa
              </Link>
            </li>
            <li>
              <Link to="/" className="text-[#c1c7cf] hover:text-white transition-colors">
                Apartments in Delhi NCR
              </Link>
            </li>
            <li>
              <Link to="/" className="text-[#c1c7cf] hover:text-white transition-colors">
                Stays in Hyderabad & Pune
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links & Legal */}
        <div>
          <h4 className="font-headline text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Quick Links
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/register" className="text-[#c1c7cf] hover:text-white transition-colors">
                Post Property Free
              </Link>
            </li>

            <li>
              <Link to="/login" className="text-[#c1c7cf] hover:text-white transition-colors">
                Owner & Tenant Login
              </Link>
            </li>
            <li>
              <a href="#experience" className="text-[#c1c7cf] hover:text-white transition-colors">
                Zero Brokerage Guarantee
              </a>
            </li>
            <li>
              <a href="#" className="text-[#c1c7cf] hover:text-white transition-colors">
                Privacy Policy & Terms
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
