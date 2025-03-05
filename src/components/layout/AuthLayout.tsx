import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-24">
        {children}
      </main>
    </div>
  );
};
