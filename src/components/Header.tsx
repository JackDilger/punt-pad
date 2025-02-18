
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-xl font-heading font-bold text-gray-900">Puntpad</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Pricing
            </Link>
            <Link to="/features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Features
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              About
            </Link>
            <Link to="/blog" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Blog
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link to="/login" className="hidden md:inline-flex text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Log In
            </Link>
            <Button asChild className="bg-primary hover:bg-primary-hover text-white">
              <Link to="/signup">
                Start tracking
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
