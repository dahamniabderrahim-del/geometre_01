import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

const Index = lazy(() => import("./pages/Index"));
const APropos = lazy(() => import("./pages/APropos"));
const Services = lazy(() => import("./pages/Services"));
const Contact = lazy(() => import("./pages/Contact"));
const Realisations = lazy(() => import("./pages/Realisations"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Connexion = lazy(() => import("./pages/Connexion"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const EquipeAdmin = lazy(() => import("./pages/EquipeAdmin"));
const Equipe = lazy(() => import("./pages/Equipe"));
const AdminMessages = lazy(() => import("./pages/AdminMessages"));
const ParametresCompte = lazy(() => import("./pages/ParametresCompte"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/a-propos" element={<APropos />} />
            <Route path="/services" element={<Services />} />
            <Route path="/realisations" element={<Realisations />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admin/equipe" element={<EquipeAdmin />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/parametres" element={<ParametresCompte />} />
            <Route path="/equipe" element={<Equipe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
