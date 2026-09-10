// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, username, role, logout } = useAuth();
  const toast = useToast();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info("You have signed out successfully");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#c4c6cf]/30 shadow-sm transition-all duration-300">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 flex items-center justify-between h-20">
        {/* Brand */}
        <Link
          to="/"
          className="font-headline text-xl md:text-2xl font-bold text-[#002045] tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2.5"
        >
          <span className="w-9 h-9 rounded-xl bg-[#002045] text-white flex items-center justify-center text-base font-extrabold shadow-sm">
            🏠
          </span>
          <span>
            Namma <span className="text-[#ad3035]">Mane</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className={`font-semibold text-sm transition-all pb-1 ${
              isActive("/")
                ? "text-[#002045] border-b-2 border-[#002045]"
                : "text-[#43474e] hover:text-[#002045]"
            }`}
          >
            Browse Homes
          </Link>

          <Link
            to="/rental-agreement"
            className={`font-semibold text-sm transition-all pb-1 ${
              isActive("/rental-agreement")
                ? "text-[#002045] border-b-2 border-[#002045]"
                : "text-[#43474e] hover:text-[#002045]"
            }`}
          >
            Rental Agreement
          </Link>

          <Link
            to="/hra-receipts"
            className={`font-semibold text-sm transition-all pb-1 ${
              isActive("/hra-receipts")
                ? "text-[#002045] border-b-2 border-[#002045]"
                : "text-[#43474e] hover:text-[#002045]"
            }`}
          >
            HRA Receipts
          </Link>

          {isAuthenticated && (
            <Link
              to="/tenant-dashboard"
              className={`font-semibold text-sm transition-all pb-1 ${
                isActive("/tenant-dashboard")
                  ? "text-[#002045] border-b-2 border-[#002045]"
                  : "text-[#43474e] hover:text-[#002045]"
              }`}
            >
              My Requests
            </Link>
          )}

          {isAuthenticated && (role === "owner" || role === "admin") && (
            <Link
              to="/owner-dashboard"
              className={`font-semibold text-sm transition-all pb-1 ${
                isActive("/owner-dashboard")
                  ? "text-[#002045] border-b-2 border-[#002045]"
                  : "text-[#43474e] hover:text-[#002045]"
              }`}
            >
              Owner Dashboard
            </Link>
          )}

          {isAuthenticated && role === "admin" && (
            <Link
              to="/admin-dashboard"
              className={`font-semibold text-sm transition-all pb-1 ${
                isActive("/admin-dashboard")
                  ? "text-[#002045] border-b-2 border-[#002045]"
                  : "text-[#43474e] hover:text-[#002045]"
              }`}
            >
              Admin Dashboard
            </Link>
          )}
        </nav>

        {/* Trailing Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#e7eeff] px-3.5 py-1.5 rounded-full border border-[#c4c6cf]/40">
                <span className="w-6 h-6 rounded-full bg-[#002045] text-white flex items-center justify-center text-xs font-bold">
                  {username ? username[0].toUpperCase() : "U"}
                </span>
                <span className="text-xs font-semibold text-[#002045]">
                  {username} <span className="capitalize text-[#43474e]">({role})</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-[#ad3035] hover:bg-[#ffdad8] px-3.5 py-1.5 rounded-lg border border-[#ffdad8] transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-[#002045] border border-[#002045] px-5 py-2 rounded-lg hover:bg-[#002045] hover:text-white transition-all shadow-sm"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-[#ad3035] hover:bg-[#8c1620] px-5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5"
              >
                Post Property Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#002045] p-2 focus:outline-none"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#c4c6cf]/30 px-6 py-4 space-y-3 shadow-lg animate-fadeIn">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-[#002045]"
          >
            Browse Homes
          </Link>
          <Link
            to="/rental-agreement"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-[#002045]"
          >
            Rental Agreement
          </Link>
          <Link
            to="/hra-receipts"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-[#002045]"
          >
            HRA Receipts
          </Link>
          {isAuthenticated && (
            <Link
              to="/tenant-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#002045]"
            >
              My Requests
            </Link>
          )}
          {isAuthenticated && (role === "owner" || role === "admin") && (
            <Link
              to="/owner-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#002045]"
            >
              Owner Dashboard
            </Link>
          )}
          {isAuthenticated && role === "admin" && (
            <Link
              to="/admin-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-[#002045]"
            >
              Admin Dashboard
            </Link>
          )}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-center py-2 text-sm font-semibold text-[#ad3035] bg-[#ffdad8] rounded-lg"
              >
                Sign Out ({username})
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold text-[#002045] border border-[#002045] rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold text-white bg-[#ad3035] rounded-lg"
                >
                  Post Property Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
