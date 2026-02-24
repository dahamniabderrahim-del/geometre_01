import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAdminProfile } from "@/hooks/use-admin";
import { Link } from "react-router-dom";
import EquipeAdmin from "./EquipeAdmin";

const Equipe = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminProfile(user?.email);

  if (authLoading || adminLoading) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </section>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-muted-foreground mb-4">Vous devez etre connecte en tant qu'admin.</p>
            <Link to="/connexion?redirect=/equipe">
              <Button>Se connecter</Button>
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <p className="text-destructive">Acces reserve aux administrateurs.</p>
          </div>
        </section>
      </Layout>
    );
  }

  return <EquipeAdmin />;
};

export default Equipe;
