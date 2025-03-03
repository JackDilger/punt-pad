import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";

export const Header = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={session ? "/dashboard" : "/"} className="flex items-center">
            <span className="text-2xl font-heading font-bold text-gray-900">Puntpad</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-10">
            {session ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/my-bets" className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors">
                  My Bets
                </Link>
                <Link to="/fantasy-league" className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors">
                  Fantasy League
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors">
                  Pricing
                </Link>
                <Link to="/" className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors">
                  Features
                </Link>
                <Link to="/" className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors">
                  About
                </Link>
                <Link to="/" className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors">
                  Blog
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {session.user.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </div>
            ) : (
              <>
                <Link to="/auth" className="text-gray-600 hover:text-gray-900 text-base font-medium transition-colors">
                  Log In
                </Link>
                <Link to="/auth">
                  <Button variant="default" className="rounded-lg px-6 py-3 text-base font-medium text-white bg-primary hover:bg-primary-hover transform transition-all duration-200 hover:scale-105 hover:shadow-md">
                    Start Tracking
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
