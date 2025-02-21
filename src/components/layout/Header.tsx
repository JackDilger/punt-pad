import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const { session } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="flex items-center gap-6 flex-1">
          <span className="font-heading font-bold text-xl">Puntpad</span>
          {session && (
            <nav className="hidden md:flex gap-6">
              <Link to="/dashboard" className="text-sm font-medium">
                Dashboard
              </Link>
              <Link to="/history" className="text-sm font-medium">
                Bet History
              </Link>
            </nav>
          )}
        </div>
        {session ? (
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
};
