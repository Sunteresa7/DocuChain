import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route} from "react-router-dom";
import Index from "./pages/Index";
import Verifier from './pages/verifier';
import AddVerifier from './pages/addVerifier';
import NotFound from "./pages/NotFound";
import { useBlockchain } from "./contexts/blockchainContext";
import { useEffect } from "react";
import SharedDocument from "./pages/SharedDocument";
import TrustedCID from "./pages/TrustedCID";

const queryClient = new QueryClient();

const App = () => {
  const { connectWallet } = useBlockchain();
  useEffect(()=>{
    initialize();
  },[])
  const initialize = async()=>{
    await connectWallet();
  }
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/verifier" element={<Verifier />} />
            <Route path="/addVerifier" element={<AddVerifier />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/share/:token" element={<SharedDocument />} />
            <Route path="/trustedCID" element={<TrustedCID />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
