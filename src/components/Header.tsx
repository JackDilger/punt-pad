import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={session ? "/dashboard" : "/"} className="flex items-center">
            <span className="text-2xl font-heading font-bold text-gray-900">Puntpad</span>
          </Link>

          {/* Navigation Links with Hover Effect - Desktop */}
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

          {/* Auth Buttons - Desktop */}
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

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[350px] pt-12">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <nav className="flex flex-col space-y-4 mt-8">
                      {navItems.map((item) => (
                        <Link 
                          key={item.id}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-4 py-3 text-lg font-medium text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6 pb-8">
                    {session ? (
                      <div className="space-y-4">
                        <div className="flex items-center px-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-3">
                            {session.user.email?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{session.user.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start px-4 py-3 text-gray-600 text-base font-medium"
                        >
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 px-4">
                        <Link 
                          to="/auth" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full text-center py-3 text-gray-600 text-base font-medium border border-gray-200 rounded-lg"
                        >
                          Log In
                        </Link>
                        <Link 
                          to="/auth"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button 
                            variant="default" 
                            className="w-full rounded-lg py-3 text-base font-medium text-white bg-primary hover:bg-primary-hover"
                          >
                            Start Tracking
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
