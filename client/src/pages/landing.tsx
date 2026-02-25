import { Link } from "wouter";
import { ArrowRight, Star, ShieldCheck, TrendingUp, Truck, Users, CreditCard, BarChart3, Leaf, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@assets/generated_images/happy_african_farmers_in_field.png";

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: "Direct Producer-Buyer Connection",
      description: "Eliminate middlemen and connect directly with verified producers and bulk buyers across Zambia."
    },
    {
      icon: ShieldCheck,
      title: "Secure Escrow Payments",
      description: "Your payments are held securely until delivery is confirmed. Fair trade guaranteed."
    },
    {
      icon: Truck,
      title: "Integrated Logistics",
      description: "Book verified logistics partners directly through the platform for seamless delivery coordination."
    },
    {
      icon: BarChart3,
      title: "Real-Time Market Insights",
      description: "Track commodity prices and trends to make informed buying and selling decisions."
    }
  ];

  const howItWorks = [
    { step: 1, title: "Create an Account", description: "Sign up as a producer, buyer, or logistics partner in minutes." },
    { step: 2, title: "Browse or List", description: "Explore listings or add your produce, livestock, or grains." },
    { step: 3, title: "Negotiate & Transact", description: "Make bids, negotiate prices, and complete secure transactions." },
    { step: 4, title: "Coordinate Delivery", description: "Book logistics and track your shipment to completion." }
  ];

  const testimonials = [
    {
      name: "Joseph Mwamba",
      role: "Maize Producer, Chipata",
      quote: "Farmly helped me sell my maize harvest at 20% better prices than local markets. The escrow system gives me peace of mind.",
      rating: 5
    },
    {
      name: "Grace Banda",
      role: "Bulk Buyer, Lusaka",
      quote: "I can now source produce directly from producers across all provinces. The quality verification saves me time and money.",
      rating: 5
    },
    {
      name: "Peter Chilufya",
      role: "Logistics Partner, Kitwe",
      quote: "The logistics booking feature keeps my trucks busy. I get consistent work from the platform.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl text-primary">Farmly</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild data-testid="button-browse-listings">
              <Link href="/marketplace">Browse Listings</Link>
            </Button>
            <Button asChild data-testid="button-get-started">
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Zambia's Agricultural Marketplace
              </div>
              
              <h1 className="font-heading text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
                Connecting Producers Directly to{" "}
                <span className="text-primary">Bulk Buyers</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Farmly is the trusted digital marketplace for agricultural trade in Zambia. 
                Buy and sell produce, livestock, and grains with secure payments and transparent pricing.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full px-8" asChild data-testid="button-create-account-hero">
                  <Link href="/auth">
                    Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8" asChild data-testid="button-explore-marketplace">
                  <Link href="/marketplace">
                    Explore Marketplace
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Free to join</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Verified users</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Secure payments</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary opacity-20 blur-3xl rounded-full"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border">
                <img 
                  src={heroImage} 
                  alt="Zambian producer using Farmly" 
                  className="object-cover w-full h-full aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div data-testid="stat-farmers">
              <div className="font-heading font-bold text-4xl mb-2">2,000+</div>
              <div className="text-primary-foreground/80">Verified Producers</div>
            </div>
            <div data-testid="stat-buyers">
              <div className="font-heading font-bold text-4xl mb-2">500+</div>
              <div className="text-primary-foreground/80">Bulk Buyers</div>
            </div>
            <div data-testid="stat-transactions">
              <div className="font-heading font-bold text-4xl mb-2">K5M+</div>
              <div className="text-primary-foreground/80">Transactions</div>
            </div>
            <div data-testid="stat-provinces">
              <div className="font-heading font-bold text-4xl mb-2">9</div>
              <div className="text-primary-foreground/80">Provinces Covered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Why Choose Farmly?
            </h2>
            <p className="text-muted-foreground text-lg">
              We provide everything you need to trade agricultural products safely and efficiently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 hover:shadow-lg transition-shadow" data-testid={`card-feature-${index}`}>
                <CardContent className="pt-6">
                  <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              How Farmly Works
            </h2>
            <p className="text-muted-foreground text-lg">
              Get started in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Trusted by Producers & Buyers
            </h2>
            <p className="text-muted-foreground text-lg">
              Hear from our community across Zambia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Agricultural Trade?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of producers and buyers already using Farmly. Create your free account today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" className="rounded-full px-8" asChild data-testid="button-cta-signup">
              <Link href="/auth">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild data-testid="button-cta-marketplace">
              <Link href="/marketplace">
                Browse Marketplace
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-primary" />
              <span className="font-bold text-primary">Farmly</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Farmly. Empowering Zambian agriculture.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">About</a>
              <a href="#" className="hover:text-primary">Contact</a>
              <a href="#" className="hover:text-primary">Terms</a>
              <a href="#" className="hover:text-primary">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
