import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout } from "lucide-react";
import { authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<"farmer" | "buyer" | "transporter">("farmer");

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      // Route based on role - admin goes to /admin, others go to /dashboard
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: {
      username: string;
      password: string;
      name: string;
      role: "farmer" | "buyer" | "transporter";
      location: string;
      phone?: string;
      email?: string;
    }) => authApi.register(data),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Account created!",
        description: `Welcome to Farmly, ${user.name}`,
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    loginMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    registerMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
      role,
      location: formData.get("location") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
    });
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-20 px-4">
        <div className="text-center mb-8">
           <div className="bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
             <Sprout className="h-8 w-8 text-primary" />
           </div>
           <h1 className="font-heading text-3xl font-bold mb-2">Welcome to Farmly</h1>
           <p className="text-muted-foreground">The future of agricultural trading.</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      name="username" 
                      placeholder="farmer_john" 
                      required 
                      data-testid="input-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      required 
                      data-testid="input-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base" 
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Demo: Use "producer_john" / "password123"
                  </p>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="John Mwamba" 
                      required 
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <Input 
                      id="reg-username" 
                      name="username" 
                      placeholder="john_farmer" 
                      required 
                      data-testid="input-reg-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select name="location" required>
                      <SelectTrigger data-testid="select-location">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lusaka">Lusaka</SelectItem>
                        <SelectItem value="Ndola">Ndola</SelectItem>
                        <SelectItem value="Kitwe">Kitwe</SelectItem>
                        <SelectItem value="Livingstone">Livingstone</SelectItem>
                        <SelectItem value="Kabwe">Kabwe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>I am a:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        type="button" 
                        variant={role === "farmer" ? "default" : "outline"}
                        onClick={() => setRole("farmer")}
                        className="flex flex-col h-auto py-3"
                        data-testid="button-role-farmer"
                      >
                        <span className="font-semibold">Producer</span>
                        <span className="text-xs opacity-80">Sell produce</span>
                      </Button>
                      <Button 
                        type="button" 
                        variant={role === "buyer" ? "default" : "outline"}
                        onClick={() => setRole("buyer")}
                        className="flex flex-col h-auto py-3"
                        data-testid="button-role-buyer"
                      >
                        <span className="font-semibold">Buyer</span>
                        <span className="text-xs opacity-80">Purchase goods</span>
                      </Button>
                      <Button 
                        type="button" 
                        variant={role === "transporter" ? "default" : "outline"}
                        onClick={() => setRole("transporter")}
                        className="flex flex-col h-auto py-3"
                        data-testid="button-role-transporter"
                      >
                        <span className="font-semibold">Logistics</span>
                        <span className="text-xs opacity-80">Transport goods</span>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email (optional)</Label>
                    <Input 
                      id="reg-email" 
                      name="email" 
                      type="email" 
                      placeholder="john@farmly.zm" 
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-phone">Phone (optional)</Label>
                    <Input 
                      id="reg-phone" 
                      name="phone" 
                      placeholder="+260 977 123 456" 
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input 
                      id="reg-password" 
                      name="password" 
                      type="password" 
                      required 
                      data-testid="input-reg-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base" 
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "Creating..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
