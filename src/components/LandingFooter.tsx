
export const LandingFooter = () => {
  return (
    <footer className="bg-gray-900 border-t border-pink-500 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <img 
            src="/lovable-uploads/f280c057-8466-4c81-8f30-692c7acda621.png" 
            alt="Clip & Ship AI Logo" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold text-white">Clip & Ship AI</span>
        </div>
        <p className="text-gray-400">
          © 2025 Clip & Ship AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
