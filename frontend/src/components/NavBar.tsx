import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 shadow-lg sticky top-0 z-10">
      <div className="w-full flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white">
          Movie Radar
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="hover:text-gray-400 font-medium transition">
            Home
          </Link>
          <Link
            to="/favorites"
            className="hover:text-gray-400 font-medium transition"
          >
            Favorites
          </Link>
          <Link
            to="/logout"
            className="hover:text-gray-400 font-medium transition"
          >
            Logout
          </Link>
        </div>

        {/* Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md hover:bg-gray-700 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
          <div className="flex flex-col space-y-4 pt-4">
            <Link
              to="/"
              className="text-xl hover:text-gray-400 font-medium transition"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/favorites"
              className="text-xl hover:text-gray-400 font-medium transition"
              onClick={() => setIsOpen(false)}
            >
              Favorites
            </Link>
            <Link
              to="/logout"
              className="text-xl hover:text-gray-400 font-medium transition"
              onClick={() => setIsOpen(false)}
            >
              Logout
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
