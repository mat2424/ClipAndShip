
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CallToActionSection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/20 to-accent/20">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-foreground mb-6">
          Start Creating Amazing Videos Today
        </h2>
        <p className="text-cool-light text-lg mb-8">
          No credit card required. Get started in minutes and see the power of AI-driven video creation.
        </p>
        <Link to="/app" className="inline-block">
          <Button className="bg-accent hover:bg-cool-aqua-hover text-accent-foreground px-8 py-4 text-lg font-medium rounded-lg transition-colors">
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
