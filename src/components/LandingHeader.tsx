
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";

interface LandingHeaderProps {
  user: User | null;
}

export const LandingHeader = ({ user }: LandingHeaderProps) => {
  return (
    <header className="bg-gray-900 shadow-lg border-b border-pink-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src="/lovable-uploads/f280c057-8466-4c81-8f30-692c7acda621.png" 
              alt="Clip & Ship AI Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
            />
            <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Clip & Ship AI</h1>
          </div>
          <div className="flex items-center">
            {user ? (
              <Link
                to="/app"
                className="bg-pink-600 text-white px-3 py-2 sm:px-6 sm:py-2 rounded-md hover:bg-pink-700 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
              >
                <span className="hidden sm:inline">Go to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/app"
                className="bg-pink-600 text-white px-3 py-2 sm:px-6 sm:py-2 rounded-md hover:bg-pink-700 transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
              >
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
