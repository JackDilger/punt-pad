import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useEffect, useRef, useState } from "react";

export const Header = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; opacity: number }>({ 
    left: 0, 
    width: 0, 
    opacity: 0 
  });
  const navContainerRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<Map<string, HTMLElement>>(new Map());
  const loginRef = useRef<HTMLAnchorElement>(null);
  const signOutRef = useRef<HTMLButtonElement>(null);
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updatePillStyle = (element: HTMLElement | null) => {
    if (!element || !navContainerRef.current) {
      setPillStyle(prev => ({ ...prev, opacity: 0 }));
      return;
    }

    const containerRect = navContainerRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    setPillStyle({
      left: elementRect.left - containerRect.left,
      width: elementRect.width,
      opacity: 1
    });
  };

  const handleNavItemMouseEnter = (id: string) => {
    const element = navItemsRef.current.get(id);
    updatePillStyle(element || null);
  };

  const handleLoginMouseEnter = () => {
    updatePillStyle(loginRef.current);
  };

  const handleSignOutMouseEnter = () => {
    updatePillStyle(signOutRef.current);
  };

  const handleMouseLeave = () => {
    setPillStyle(prev => ({ ...prev, opacity: 0 }));
  };

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

  const navItems = session ? [
    { id: "dashboard", label: "Dashboard", to: "/dashboard" },
    { id: "my-bets", label: "My Bets", to: "/my-bets" },
    { id: "fantasy-league", label: "Fantasy League", to: "/fantasy-league" }
  ] : [
    { id: "pricing", label: "Pricing", to: "/" },
    { id: "features", label: "Features", to: "/" },
    { id: "about", label: "About", to: "/" },
    { id: "blog", label: "Blog", to: "/" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm" 
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={session ? "/dashboard" : "/"} className="flex items-center">
            <span className="text-2xl font-heading font-bold text-gray-900">Puntpad</span>
          </Link>

          {/* Navigation Links with Hover Effect */}
          <div 
            ref={navContainerRef}
            className="hidden md:flex items-center relative"
            onMouseLeave={handleMouseLeave}
          >
            {/* Single moving hover pill */}
            <div
              className="absolute bg-gray-100 rounded-lg transition-all duration-200 ease-out"
              style={{
                left: pillStyle.left,
                width: pillStyle.width,
                height: 36,
                top: '50%',
                marginTop: -18,
                opacity: pillStyle.opacity,
                zIndex: -1
              }}
            />
            
            <nav className="flex items-center space-x-8">
              {navItems.map((item) => (
                <Link 
                  key={item.id}
                  to={item.to}
                  ref={(el) => {
                    if (el) navItemsRef.current.set(item.id, el);
                  }}
                  onMouseEnter={() => handleNavItemMouseEnter(item.id)}
                  className="px-3 py-2 text-gray-600 text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Auth Buttons */}
          <div 
            className="hidden md:flex items-center space-x-4"
            onMouseLeave={handleMouseLeave}
          >
            {session ? (
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {session.user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  ref={signOutRef}
                  onMouseEnter={handleSignOutMouseEnter}
                  className="px-3 py-2 text-gray-600 text-sm font-medium"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link 
                  to="/auth" 
                  ref={loginRef}
                  onMouseEnter={handleLoginMouseEnter}
                  className="px-3 py-2 text-gray-600 text-sm font-medium"
                >
                  Log In
                </Link>
                <Link to="/auth">
                  <Button 
                    variant="default" 
                    className="rounded-lg px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover transform transition-all duration-200 hover:scale-105 hover:shadow-md"
                  >
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
