import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, JSX } from "react";
import {
  Menu,
  X,
  Film,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function NavBar(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Function to check if current path matches the link
  const isActiveLink = (path: string): boolean => {
    return location.pathname === path;
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query parameter
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Clear search input after search
      setIsOpen(false); // Close mobile menu if open
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const userName = user?.username || "User";
  const userInitials = getUserInitials(userName);

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 shadow-lg sticky top-0 z-50 border-b border-gray-700">
      <div className="w-full flex justify-between items-center">
        {/* Left Side: Logo + Navigation */}
        <div className="flex items-center space-x-6">
          {/* Logo and Brand */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold text-white hover:text-blue-400 transition-colors"
          >
            <Film size={28} className="text-blue-500" />
            <span>MovieRadar</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/"
              className={`hover:text-blue-400 font-medium transition-colors relative ${
                isActiveLink("/")
                  ? "text-blue-400 after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-400"
                  : "text-gray-300"
              }`}
            >
              Home
            </Link>
            <Link
              to="/favorites"
              className={`hover:text-blue-400 font-medium transition-colors relative ${
                isActiveLink("/favorites")
                  ? "text-blue-400 after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-400"
                  : "text-gray-300"
              }`}
            >
              Favorites
            </Link>
          </div>
        </div>

        {/* Right Side: Search + User */}
        <div className="hidden lg:flex items-center space-x-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search movies..."
                  className="w-64 pl-10 pr-4 py-2 rounded-l-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors flex items-center"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* User Profile Dropdown */}
          {isAuthenticated && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-3 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-md font-semibold">
                  {userInitials}
                </div>
                <span className="text-md font-medium">{userName}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 py-2 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-600 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-600 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings size={16} />
                    <span>Settings (Unfinished)</span>
                  </Link>
                  <div className="border-t border-gray-600 my-2"></div>
                  <Link
                    to="/logout"
                    className="flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-600 text-red-400 hover:text-red-300 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="lg:hidden p-2 rounded-md hover:bg-gray-700 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t border-gray-700">
          <div className="flex flex-col space-y-4 pt-4">
            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="flex items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search movies..."
                    className="w-full pl-10 pr-4 py-2 rounded-l-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-r-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Mobile Navigation Links */}
            <Link
              to="/"
              className={`text-xl font-medium transition-colors ${
                isActiveLink("/")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/favorites"
              className={`text-xl font-medium transition-colors ${
                isActiveLink("/favorites")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-blue-400"
              }`}
              onClick={() => setIsOpen(false)}
            >
              Favorites
            </Link>

            {/* Mobile User Section */}
            {isAuthenticated && (
              <div className="border-t border-gray-600 pt-4 mt-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {userInitials}
                  </div>
                  <span className="text-lg font-medium">{userName}</span>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center space-x-3 text-lg hover:text-blue-400 font-medium transition-colors mb-3"
                  onClick={() => setIsOpen(false)}
                >
                  <User size={20} />
                  <span>Profile</span>
                </Link>

                <Link
                  to="/"
                  className="flex items-center space-x-3 text-lg hover:text-blue-400 font-medium transition-colors mb-3"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings size={20} />
                  <span>Settings (Unfinished)</span>
                </Link>

                <Link
                  to="/logout"
                  className="flex items-center space-x-3 text-lg hover:text-red-400 font-medium transition-colors text-red-400"
                  onClick={() => setIsOpen(false)}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
