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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={session ? "/dashboard" : "/"} className="flex items-center">
            <span className="text-xl font-heading font-bold text-gray-900">Puntpad</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {session ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/my-bets" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  My Bets
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
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
                <Link to="/auth">
                  <Button variant="default">Sign In</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
