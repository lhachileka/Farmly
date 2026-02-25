import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, User, Bell, Sprout, Sun, Moon, Check, Heart, Store, Users, FileText, TrendingUp, LayoutDashboard, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, cartApi, authApi } from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { setTheme, theme } = useTheme();
  const queryClient = useQueryClient();

  const isActive = (path: string) => location === path;

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: notificationsApi.getAll,
    enabled: !!currentUser,
  });

  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    queryFn: cartApi.getItems,
    enabled: !!currentUser,
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const cartCount = cartItems.length;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Sprout className="h-6 w-6 text-primary" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-primary">Farmly</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/marketplace" className={`transition-colors hover:text-primary ${isActive("/marketplace") ? "text-primary" : "text-muted-foreground"}`}>
              Marketplace
            </Link>
            <Link href="/coops" className={`transition-colors hover:text-primary ${isActive("/coops") ? "text-primary" : "text-muted-foreground"}`}>
              Co-Ops
            </Link>
            <Link href="/contracts" className={`transition-colors hover:text-primary ${isActive("/contracts") ? "text-primary" : "text-muted-foreground"}`}>
              Contracts
            </Link>
            <Link href="/logistics" className={`transition-colors hover:text-primary ${isActive("/logistics") ? "text-primary" : "text-muted-foreground"}`}>
              Logistics
            </Link>
            <Link href="/insights" className={`transition-colors hover:text-primary ${isActive("/insights") ? "text-primary" : "text-muted-foreground"}`}>
              Insights
            </Link>
            <Link href="/dashboard" className={`transition-colors hover:text-primary ${isActive("/dashboard") ? "text-primary" : "text-muted-foreground"}`}>
              Dashboard
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search produce, livestock..."
              className="pl-9 bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all rounded-full"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative text-muted-foreground hover:text-primary hover:bg-primary/5"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/5" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-secondary rounded-full border-2 border-background"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => markAllReadMutation.mutate()}>
                      <Check className="h-4 w-4 mr-1" /> Mark all read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notifications yet</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.slice(0, 10).map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 rounded-lg ${n.read ? "bg-muted/30" : "bg-primary/5"}`}
                        >
                          <div className="font-medium text-sm">{n.title}</div>
                          <div className="text-xs text-muted-foreground">{n.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/5 hidden sm:flex" data-testid="button-favorites" asChild>
              <Link href="/favorites">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/5 hidden sm:flex" data-testid="button-messages" asChild>
              <Link href="/messages">
                <MessageCircle className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary hover:bg-primary/5 hidden sm:flex" data-testid="button-cart" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-[10px]">{cartCount}</Badge>
                )}
              </Link>
            </Button>

            {currentUser ? (
              <>
                <Button size="sm" className="hidden sm:flex rounded-full px-6 font-semibold shadow-none hover:shadow-md transition-all" data-testid="button-dashboard" asChild>
                  <Link href="/dashboard">
                    Dashboard
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" className="hidden sm:flex" data-testid="button-settings" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button size="sm" className="hidden sm:flex rounded-full px-6 font-semibold shadow-none hover:shadow-md transition-all" data-testid="button-signin" asChild>
                <Link href="/auth">
                  Sign In
                </Link>
              </Button>
            )}

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t py-12 mt-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <Sprout className="h-6 w-6 text-primary" />
                <span className="font-heading font-bold text-xl text-primary">Farmly</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Connecting farmers directly to buyers. Fair prices, secure payments, and reliable logistics for a better agricultural future.
              </p>
          </div>
          
          <div>
            <h4 className="font-heading font-semibold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Marketplace</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Logistics</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing Intelligence</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Verify User</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-foreground">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">Subscribe for market updates.</p>
            <div className="flex gap-2">
              <Input placeholder="Email address" className="bg-background" />
              <Button size="icon" className="shrink-0">
                <Sprout className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          © 2026 Farmly Inc. All rights reserved.
        </div>
      </footer>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <Link href="/dashboard" className="flex-1" data-testid="nav-dashboard">
            <div className={`flex flex-col items-center gap-1 py-2 ${isActive("/dashboard") ? "text-primary" : "text-muted-foreground"}`}>
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] font-medium">Dashboard</span>
            </div>
          </Link>
          <Link href="/marketplace" className="flex-1" data-testid="nav-marketplace">
            <div className={`flex flex-col items-center gap-1 py-2 ${isActive("/marketplace") ? "text-primary" : "text-muted-foreground"}`}>
              <Store className="h-5 w-5" />
              <span className="text-[10px] font-medium">Market</span>
            </div>
          </Link>
          <Link href="/messages" className="flex-1" data-testid="nav-messages">
            <div className={`flex flex-col items-center gap-1 py-2 ${isActive("/messages") ? "text-primary" : "text-muted-foreground"}`}>
              <MessageCircle className="h-5 w-5" />
              <span className="text-[10px] font-medium">Messages</span>
            </div>
          </Link>
          <Link href="/cart" className="flex-1" data-testid="nav-cart">
            <div className={`flex flex-col items-center gap-1 py-2 relative ${isActive("/cart") ? "text-primary" : "text-muted-foreground"}`}>
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 h-4 w-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">{cartCount}</span>
                )}
              </div>
              <span className="text-[10px] font-medium">Cart</span>
            </div>
          </Link>
          <Link href="/settings" className="flex-1" data-testid="nav-settings">
            <div className={`flex flex-col items-center gap-1 py-2 ${isActive("/settings") ? "text-primary" : "text-muted-foreground"}`}>
              <Settings className="h-5 w-5" />
              <span className="text-[10px] font-medium">Settings</span>
            </div>
          </Link>
        </div>
      </nav>
      
      {/* Spacer for bottom nav on mobile */}
      <div className="md:hidden h-16" />
    </div>
  );
}
