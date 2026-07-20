import { useEffect, useState } from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../features/auth/authService";
import { Activity, LayoutDashboard, Store, Users, LogOut, Settings, Package, Tag, ClipboardList, WalletCards, ShieldCheck, FileText, Images, MessageSquare, Printer, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import logoName from "../../assets/brand/nome-entregai.svg";
import logoSymbol from "../../assets/brand/logo-entregai.svg";

export default function AdminLayout() {
  const { isAuthenticated, user, setUser, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !user) {
      authService.me().then(setUser).catch(() => logout());
    }
  }, [isAuthenticated, logout, setUser, user]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const canView = (slug: string) => {
    if (user?.permissions?.includes("*")) return true;
    if (slug === "users") return false;
    return user?.permissions?.includes(slug);
  };

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, slug: "dashboard" },
    { name: "Lojas", path: "/stores", icon: Store, slug: "stores" },
    { name: "Categorias", path: "/products/categories", icon: Tag, slug: "categories" },
    { name: "Produtos", path: "/products", icon: Package, slug: "products" },
    { name: "Banners globais", path: "/platform-banners", icon: Images, slug: "dashboard" },
    { name: "Caixa", path: "/caixa", icon: WalletCards, slug: "caixa" },
    { name: "Acessos", path: "/access-users", icon: Users, slug: "users" },
    { name: "Regras de cobrança", path: "/settings/split-rules", icon: Settings, slug: "split_rules" },
    { name: "Stone/Pagar.me", path: "/settings/pagarme-marketplace", icon: WalletCards, slug: "pagarme_marketplace" },
    { name: "Teste do Mercado Pago", path: "/settings/mercadopago-test", icon: WalletCards, slug: "mercadopago_test" },
    { name: "Auditoria", path: "/audit-logs", icon: ClipboardList, slug: "audit_logs" },
    { name: "Feedbacks", path: "/feedbacks", icon: MessageSquare, slug: "dashboard" },
    { name: "Segurança", path: "/security", icon: ShieldCheck, slug: "dashboard" },
    { name: "Documentos legais", path: "/legal-documents", icon: FileText, slug: "legal_documents" },
    { name: "Impressão", path: "/printing", icon: Printer, slug: "observability" },
    { name: "Saúde do Sistema", path: "/system-health", icon: Activity, slug: "observability" },
  ];

  const visibleMenuItems = menuItems.filter((item) => canView(item.slug));
  const activeMenuItem = visibleMenuItems
    .filter((item) => location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path)))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-900">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(19rem,88vw)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-950 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logoSymbol} alt="" className="h-9 w-9 shrink-0 object-contain" />
            <div className="min-w-0">
              <img src={logoName} alt="Entregaí" className="h-8 w-auto object-contain" />
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                SuperAdmin
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const isActive = activeMenuItem?.path === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? "" : "opacity-70"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.nome?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {user?.nome || "Admin User"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair do sistema
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950 sm:h-16 sm:px-4 lg:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-ml-1 shrink-0 lg:hidden"
            aria-label="Abrir menu de navegação"
            aria-controls="admin-navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 lg:hidden" />
          <h1 className="min-w-0 truncate text-base font-semibold text-slate-800 dark:text-slate-100 sm:text-lg">
            {menuItems.find(i => location.pathname === i.path || (i.path !== "/" && location.pathname.startsWith(i.path)))?.name || "Painel"}
          </h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
