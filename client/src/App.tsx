import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AISupportChat } from "@/components/ai-support-chat";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Marketplace from "@/pages/marketplace";
import ProductDetails from "@/pages/product";
import Dashboard from "@/pages/dashboard";
import Logistics from "@/pages/logistics";
import Insights from "@/pages/insights";
import AuthPage from "@/pages/auth";
import Admin from "@/pages/admin";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Favorites from "@/pages/favorites";
import Contracts from "@/pages/contracts";
import ContractDetail from "@/pages/contract-detail";
import Subscribe from "@/pages/subscribe";
import Coops from "@/pages/coops";
import CoopDetail from "@/pages/coop-detail";
import CreateCoop from "@/pages/create-coop";
import Messages from "@/pages/messages";
import GradeStandards from "@/pages/grade-standards";
import Settings from "@/pages/settings";
import AdminFees from "@/pages/admin-fees";
import PaymentCallback from "@/pages/payment-callback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/home" component={Home} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/product/:id" component={ProductDetails} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/logistics" component={Logistics} />
      <Route path="/insights" component={Insights} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/fees" component={AdminFees} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/contracts/:id" component={ContractDetail} />
      <Route path="/subscribe/:sellerId" component={Subscribe} />
      <Route path="/coops" component={Coops} />
      <Route path="/coops/create" component={CreateCoop} />
      <Route path="/coops/:id" component={CoopDetail} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:chatId" component={Messages} />
      <Route path="/grade-standards" component={GradeStandards} />
      <Route path="/settings" component={Settings} />
      <Route path="/payment-callback" component={PaymentCallback} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Router />
          <AISupportChat />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
