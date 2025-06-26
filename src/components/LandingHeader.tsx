
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";

interface LandingHeaderProps {
  user: User | null;
}

export const LandingHeader = ({ user }: LandingHeaderProps) => {
  return (
    <header className="bg-gray-900 shadow-lg border-b border-pink-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/f280c057-8466-4c81-8f30-692c7acda621.png" 
            alt="AI Video Publisher Logo" 
            className="w-10 h-10 object-contain"
          />
          <h1 className="text-2xl font-bold text-white">AI Video Publisher</h1>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Link
              to="/app"
              className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 transition-colors font-medium"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              to="/app"
              className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
