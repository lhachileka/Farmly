import { Link } from "wouter";
import { ArrowRight, Star, MapPin, TrendingUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { CATEGORIES, LISTINGS } from "@/lib/mockData";
import heroImage from "@assets/generated_images/african_farmer_with_smartphone_in_lush_field.png";

export default function Home() {
  const featuredListings = LISTINGS.filter(l => l.featured).slice(0, 3);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live Market Prices Updated
              </div>
              
              <h1 className="font-heading text-5xl lg:text-7xl font-bold tracking-tight text-foreground text-balance leading-[1.1]">
                Farm to Market, <br />
                <span className="text-primary relative inline-block">
                  Directly.
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-secondary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg text-balance">
                The secure marketplace connecting verified producers with bulk buyers. Fair trade, transparent pricing, and guaranteed payments.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="rounded-full px-8 text-base h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" asChild>
                  <Link href="/marketplace">
                    Browse Marketplace
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8 text-base h-12 hover:bg-muted/50" asChild>
                  <Link href="/auth">
                    Sell Your Produce
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="font-heading font-bold text-2xl text-foreground">2k+</div>
                  <div className="text-sm text-muted-foreground">Verified Producers</div>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div>
                  <div className="font-heading font-bold text-2xl text-foreground">500+</div>
                  <div className="text-sm text-muted-foreground">Bulk Buyers</div>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div>
                  <div className="font-heading font-bold text-2xl text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground">Secure Payouts</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary opacity-10 blur-3xl rounded-full"></div>
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/50 dark:border-white/10 aspect-[4/3] group">
                <img 
                  src={heroImage} 
                  alt="Producer using technology" 
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="h-5 w-5 text-green-400" />
                      <span className="font-medium">Verified Partner</span>
                    </div>
                    <p className="text-lg font-heading font-bold">Empowering 2,000+ local producers across Zambia.</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-xl border border-border/50 max-w-[200px] hidden md:block animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-muted-foreground">Price Alert</span>
                </div>
                <div className="font-bold text-lg mb-1">Maize ↑ 12%</div>
                <div className="text-xs text-muted-foreground">High demand in Lusaka region this week.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
            <p className="text-muted-foreground">Find exactly what you need from our diverse range of agricultural products.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/marketplace?category=${cat.id}`}>
                <div className="group cursor-pointer relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-48 md:h-64 flex flex-col items-center justify-center p-6 text-center">
                   {cat.image && (
                     <div className="absolute inset-0 z-0">
                       <img src={cat.image} alt={cat.name} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                       <div className="absolute inset-0 bg-gradient-to-b from-card/80 to-card/90"></div>
                     </div>
                   )}
                   <div className="relative z-10 bg-primary/10 p-4 rounded-full mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                     <cat.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                   </div>
                   <h3 className="relative z-10 font-heading font-semibold text-lg">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-2">Fresh on the Market</h2>
              <p className="text-muted-foreground">Premium quality listings from top-rated producers.</p>
            </div>
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary/80" asChild>
              <Link href="/marketplace">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredListings.map((item) => (
              <Link key={item.id} href={`/product/${item.id}`}>
                <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 border-border/60">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={item.images[0]} 
                      alt={item.title} 
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                       {item.organic && <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm">Organic</Badge>}
                       <Badge variant="secondary" className="bg-white/90 text-foreground backdrop-blur-sm shadow-sm">{item.category}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-heading font-semibold text-xl mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary">K{item.price}</div>
                        <div className="text-xs text-muted-foreground">per {item.unit}</div>
                      </div>
                    </div>
                    
                    <div className="my-4 h-px bg-border/50"></div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {item.seller.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-muted-foreground">Seller</span>
                          <span className="font-semibold text-xs leading-none">{item.seller.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-medium">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {item.seller.rating}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-900/80"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">Ready to scale your business?</h2>
          <p className="text-lg text-primary-foreground/80 mb-10 text-balance">
            Join thousands of producers and buyers transforming the agricultural supply chain. Secure payments, verified partners, and fair prices.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full font-bold shadow-xl">
              Start Selling
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full font-bold border-white/30 hover:bg-white/10 text-white">
              Start Buying
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
