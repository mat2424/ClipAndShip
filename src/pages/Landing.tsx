
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { Play, Zap, Share2, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-pink-400" />,
      title: "AI-Powered Video Generation",
      description: "Transform your ideas into engaging videos using advanced AI technology. Just describe your concept and watch it come to life."
    },
    {
      icon: <Share2 className="w-8 h-8 text-pink-400" />,
      title: "Multi-Platform Publishing",
      description: "Automatically publish your videos across YouTube, TikTok, Instagram, and more social media platforms with a single click."
    },
    {
      icon: <Clock className="w-8 h-8 text-pink-400" />,
      title: "Save Time & Effort",
      description: "Create professional-quality videos in minutes, not hours. Perfect for content creators, marketers, and businesses."
    }
  ];

  const benefits = [
    "Generate unlimited video ideas with AI assistance",
    "Automated cross-platform social media publishing",
    "Professional-quality videos without technical skills",
    "Customizable voice settings and styling options",
    "Credit-based system for flexible usage",
    "Secure account management and social media integration"
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
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
                to="/"
                className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/"
                className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-600 bg-clip-text text-transparent">
              Create & Publish Videos with AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
              Transform your ideas into engaging videos and automatically publish them across all your social media platforms. 
              No video editing skills required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/" className="inline-block">
                <Button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 text-lg font-medium rounded-lg transition-colors">
                  Start Creating Videos
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" className="border-pink-500 text-pink-400 hover:bg-pink-500/10 px-8 py-4 text-lg font-medium rounded-lg">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#621fff]/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-white">
            Powerful Features for Content Creators
          </h2>
          <p className="text-gray-300 text-center text-lg mb-16 max-w-2xl mx-auto">
            Everything you need to create professional videos and grow your social media presence
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-900/50 border border-pink-500/30 rounded-lg p-8 text-center hover:border-pink-500/60 transition-colors">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Why Choose AI Video Publisher?
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Our platform combines cutting-edge AI technology with seamless social media integration 
                to help you create and distribute content faster than ever before.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-pink-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#621fff] rounded-lg p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
              <p className="text-pink-200 mb-6">
                Join thousands of content creators who are already using AI Video Publisher to grow their audience.
              </p>
              <Link to="/" className="inline-block">
                <Button className="bg-white text-[#621fff] hover:bg-gray-100 px-6 py-3 font-medium rounded-lg transition-colors w-full">
                  Create Your First Video
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start Creating Amazing Videos Today
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            No credit card required. Get started in minutes and see the power of AI-driven video creation.
          </p>
          <Link to="/" className="inline-block">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 text-lg font-medium rounded-lg transition-colors">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-pink-500 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/lovable-uploads/f280c057-8466-4c81-8f30-692c7acda621.png" 
              alt="AI Video Publisher Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-white">AI Video Publisher</span>
          </div>
          <p className="text-gray-400">
            © 2025 AI Video Publisher. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
