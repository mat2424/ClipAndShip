
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VideoIdeaForm } from "@/components/VideoIdeaForm";
import { VideoIdeasList } from "@/components/VideoIdeasList";
import { CreditBalance } from "@/components/CreditBalance";
import { PricingSection } from "@/components/PricingSection";
import { Button } from "@/components/ui/button";
import { User, LogOut, Clock, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session && event !== 'INITIAL_SESSION') {
          navigate('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-cool-charcoal">VideoSpark</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/pending-videos">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Approvals</span>
                </Button>
              </Link>
              
              <Link to="/connect-accounts">
                <Button variant="outline" size="sm">
                  Connect Accounts
                </Button>
              </Link>
              
              <CreditBalance />
              
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Video Creation */}
          <div className="lg:col-span-2 space-y-8">
            <VideoIdeaForm />
            <VideoIdeasList />
          </div>

          {/* Right Column - Pricing */}
          <div className="lg:col-span-1">
            <PricingSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
