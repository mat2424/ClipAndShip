
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BenefitsSection = () => {
  const benefits = [
    "Generate unlimited video ideas with AI assistance",
    "Automated cross-platform social media publishing",
    "Professional-quality videos without technical skills",
    "Customizable voice settings and styling options",
    "Credit-based system for flexible usage",
    "Secure account management and social media integration"
  ];

  return (
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
            <Link to="/app" className="inline-block">
              <Button className="bg-white text-[#621fff] hover:bg-gray-100 px-6 py-3 font-medium rounded-lg transition-colors w-full">
                Create Your First Video
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
