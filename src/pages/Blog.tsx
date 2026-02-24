import { Layout } from "@/components/layout/Layout";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight, Search, Share2, Bookmark, TrendingUp, Eye, ChevronLeft, ChevronRight, Facebook, Twitter, Linkedin, Link2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const articles = [
  {
    id: 1,
    slug: "bornage-terrain-guide-complet-2024",
    title: "Tout savoir sur le bornage de terrain : Guide complet 2024",
    excerpt: "Le bornage est une opération fondamentale qui permet de fixer définitivement les limites d'une propriété. Découvrez les étapes, le cadre légal et vos droits.",
    category: "Bornage",
    date: "15 Janvier 2024",
    readTime: "8 min",
    views: 1245,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=400&fit=crop",
    featured: true,
    tags: ["bornage", "terrain", "propriété", "limites"],
  },
  {
    id: 2,
    slug: "division-parcellaire-erreurs-eviter",
    title: "Division parcellaire : les 5 erreurs à éviter",
    excerpt: "Diviser un terrain peut s'avérer complexe. Voici les pièges courants et comment les éviter pour mener à bien votre projet de division.",
    category: "Division",
    date: "8 Janvier 2024",
    readTime: "6 min",
    views: 892,
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop",
    tags: ["division", "parcelle", "urbanisme"],
  },
  {
    id: 3,
    slug: "copropriete-etat-descriptif-division",
    title: "Copropriété : comprendre l'état descriptif de division",
    excerpt: "L'EDD est un document essentiel pour toute copropriété. Décryptage de ce document juridique et technique.",
    category: "Copropriété",
    date: "2 Janvier 2024",
    readTime: "5 min",
    views: 654,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop",
    tags: ["copropriété", "EDD", "juridique"],
  },
  {
    id: 4,
    slug: "regles-urbanisme-2024-ile-de-france",
    title: "Nouvelles règles d'urbanisme 2024 en Île-de-France",
    excerpt: "Les modifications du PLU et leurs impacts sur vos projets immobiliers. Ce qui change cette année.",
    category: "Urbanisme",
    date: "28 Décembre 2023",
    readTime: "7 min",
    views: 1102,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=400&fit=crop",
    tags: ["urbanisme", "PLU", "réglementation"],
  },
  {
    id: 5,
    slug: "choisir-geometre-expert",
    title: "Comment choisir son géomètre-expert ?",
    excerpt: "Les critères essentiels pour sélectionner le professionnel adapté à votre projet : qualifications, assurances, tarifs.",
    category: "Conseils",
    date: "20 Décembre 2023",
    readTime: "4 min",
    views: 756,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=400&fit=crop",
    tags: ["conseils", "géomètre", "professionnel"],
  },
  {
    id: 6,
    slug: "drones-geometres-revolution",
    title: "Drones et géomètres : la révolution technologique",
    excerpt: "Comment les nouvelles technologies transforment le métier de géomètre et améliorent la précision des relevés.",
    category: "Innovation",
    date: "15 Décembre 2023",
    readTime: "5 min",
    views: 543,
    image: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=400&fit=crop",
    tags: ["drone", "technologie", "innovation"],
  },
  {
    id: 7,
    slug: "servitudes-terrain-guide",
    title: "Les servitudes de terrain : guide pratique",
    excerpt: "Comprendre les différents types de servitudes et leur impact sur votre propriété.",
    category: "Conseils",
    date: "10 Décembre 2023",
    readTime: "6 min",
    views: 421,
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=400&fit=crop",
    tags: ["servitude", "droit", "propriété"],
  },
  {
    id: 8,
    slug: "renovation-energetique-2024",
    title: "Rénovation énergétique : le rôle du géomètre",
    excerpt: "Comment le géomètre-expert intervient dans vos projets de rénovation énergétique.",
    category: "Innovation",
    date: "5 Décembre 2023",
    readTime: "5 min",
    views: 389,
    image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=400&fit=crop",
    tags: ["rénovation", "énergie", "bâtiment"],
  },
];

const categories = ["Tous", "Bornage", "Division", "Copropriété", "Urbanisme", "Conseils", "Innovation"];
const ARTICLES_PER_PAGE = 6;

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [savedArticles, setSavedArticles] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const filteredArticles = useMemo(() => {
    let result = articles.filter((article) => {
      const matchesCategory = activeCategory === "Tous" || article.category === activeCategory;
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

    // Sorting
    if (sortBy === "popular") {
      result = [...result].sort((a, b) => b.views - a.views);
    }

    return result;
  }, [activeCategory, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const featuredArticle = articles.find(a => a.featured);
  const showFeatured = activeCategory === "Tous" && searchQuery === "" && currentPage === 1;

  const trendingArticles = useMemo(() => {
    return [...articles].sort((a, b) => b.views - a.views).slice(0, 3);
  }, []);

  const toggleSaveArticle = (id: number) => {
    setSavedArticles(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
    toast.success(savedArticles.includes(id) ? "Article retiré des favoris" : "Article sauvegardé");
  };

  const shareArticle = (article: typeof articles[0], platform: string) => {
    const url = `${window.location.origin}/blog/${article.slug}`;
    const text = article.title;
    
    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    } else {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 bg-muted geometric-pattern">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              Blog & <span className="text-gradient">Actualités</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Conseils, guides pratiques et actualités du métier de géomètre-expert.
            </p>
          </div>
        </div>
      </section>

      {/* Search, Filters & Sorting */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un article, tag..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Trier par:</span>
                  <button
                    onClick={() => setSortBy("recent")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      sortBy === "recent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Récents
                  </button>
                  <button
                    onClick={() => setSortBy("popular")}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      sortBy === "popular" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Populaires
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""} trouvé{filteredArticles.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Featured article */}
            {showFeatured && featuredArticle && (
              <article className="bg-card rounded-2xl shadow-soft overflow-hidden mb-8">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-[4/3] md:aspect-auto">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge>{featuredArticle.category}</Badge>
                      <Badge variant="outline" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        À la une
                      </Badge>
                    </div>
                    <h2 className="font-serif text-xl md:text-2xl font-bold text-foreground mb-3">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {featuredArticle.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {featuredArticle.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {featuredArticle.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {featuredArticle.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm">
                        Lire l'article
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleSaveArticle(featuredArticle.id)}
                      >
                        <Bookmark className={`w-4 h-4 ${savedArticles.includes(featuredArticle.id) ? "fill-current" : ""}`} />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="grid gap-1">
                            <button
                              onClick={() => shareArticle(featuredArticle, "facebook")}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                              <Facebook className="w-4 h-4" /> Facebook
                            </button>
                            <button
                              onClick={() => shareArticle(featuredArticle, "twitter")}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                              <Twitter className="w-4 h-4" /> Twitter
                            </button>
                            <button
                              onClick={() => shareArticle(featuredArticle, "linkedin")}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                              <Linkedin className="w-4 h-4" /> LinkedIn
                            </button>
                            <button
                              onClick={() => shareArticle(featuredArticle, "copy")}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                              <Link2 className="w-4 h-4" /> Copier le lien
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Articles grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {paginatedArticles.map((article) => (
                <article
                  key={article.id}
                  className="group bg-card rounded-xl shadow-soft overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        onClick={() => toggleSaveArticle(article.id)}
                      >
                        <Bookmark className={`w-4 h-4 ${savedArticles.includes(article.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {article.views.toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {article.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime}
                        </span>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="grid gap-1">
                            <button
                              onClick={() => shareArticle(article, "facebook")}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                              <Facebook className="w-4 h-4" /> Facebook
                            </button>
                            <button
                              onClick={() => shareArticle(article, "twitter")}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                              <Twitter className="w-4 h-4" /> Twitter
                            </button>
                            <button
                              onClick={() => shareArticle(article, "linkedin")}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                              <Linkedin className="w-4 h-4" /> LinkedIn
                            </button>
                            <button
                              onClick={() => shareArticle(article, "copy")}
                              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted"
                            >
                              <Link2 className="w-4 h-4" /> Copier le lien
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun article trouvé.</p>
                <Button variant="link" onClick={() => { setSearchQuery(""); setActiveCategory("Tous"); }}>
                  Réinitialiser les filtres
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Trending */}
            <div className="bg-card rounded-xl shadow-soft p-6">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Articles populaires
              </h3>
              <div className="space-y-4">
                {trendingArticles.map((article, index) => (
                  <div key={article.id} className="flex gap-3 group cursor-pointer">
                    <span className="text-2xl font-bold text-muted-foreground/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {article.views.toLocaleString()} vues
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Articles */}
            {savedArticles.length > 0 && (
              <div className="bg-card rounded-xl shadow-soft p-6">
                <h3 className="font-serif text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-primary" />
                  Mes favoris ({savedArticles.length})
                </h3>
                <div className="space-y-3">
                  {articles.filter(a => savedArticles.includes(a.id)).slice(0, 3).map((article) => (
                    <div key={article.id} className="flex items-start gap-2 group">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => toggleSaveArticle(article.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Stats */}
            <div className="bg-card rounded-xl shadow-soft p-6">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
                Catégories
              </h3>
              <div className="space-y-2">
                {categories.filter(c => c !== "Tous").map((cat) => {
                  const count = articles.filter(a => a.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      <span className={activeCategory === cat ? "text-primary font-medium" : "text-foreground"}>
                        {cat}
                      </span>
                      <span className="text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
              <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
                Newsletter
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Recevez nos derniers articles chaque semaine.
              </p>
              <form className="space-y-2">
                <Input
                  type="email"
                  placeholder="votre@email.fr"
                />
                <Button type="submit" className="w-full">
                  S'abonner
                </Button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
