
import { Zap, Share2, Clock } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: <Zap className="w-8 h-8 text-cool-turquoise" />,
      title: "AI-Powered Video Generation",
      description: "Transform your ideas into engaging videos using advanced AI technology. Just describe your concept and watch it come to life."
    },
    {
      icon: <Share2 className="w-8 h-8 text-cool-turquoise" />,
      title: "Multi-Platform Publishing",
      description: "Automatically publish your videos across YouTube, TikTok, Instagram, and more social media platforms with a single click."
    },
    {
      icon: <Clock className="w-8 h-8 text-cool-turquoise" />,
      title: "Save Time & Effort",
      description: "Create professional-quality videos in minutes, not hours. Perfect for content creators, marketers, and businesses."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cool-navy/30">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4 text-white">
          Powerful Features for Content Creators
        </h2>
        <p className="text-gray-300 text-center text-lg mb-16 max-w-2xl mx-auto">
          Everything you need to create professional videos and grow your social media presence
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-cool-navy/70 border border-cool-turquoise/30 rounded-lg p-8 text-center hover:border-cool-turquoise/60 transition-colors">
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
  );
};
