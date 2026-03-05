import { LayoutDashboard, ArrowLeftRight, Tag, Target, DollarSign, LogOut, User, Settings, ChevronDown, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Transações", url: "/transactions", icon: ArrowLeftRight },
    { title: "Categorias", url: "/categories", icon: Tag },
    { title: "Metas", url: "/goals", icon: Target },
];

export function TopNav() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const activeItem = navItems.find(item =>
        item.url === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.url)
    ) || navItems[0];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-card/60 backdrop-blur-xl shadow-lg shadow-black/5">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo & Platform Name */}
                <Link to="/dashboard" className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        MoneyFlow
                    </span>
                </Link>

                {/* Navigation Dropdown */}
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-11 gap-3 rounded-2xl bg-white/5 px-5 hover:bg-white/10 transition-all border border-white/5 active:scale-95 group">
                                <activeItem.icon className="h-5 w-5 text-primary group-hover:animate-pulse" />
                                <span className="hidden sm:inline-block font-bold text-sm uppercase tracking-widest">{activeItem.title}</span>
                                <ChevronDown className="h-4 w-4 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-[240px] p-2 bg-popover/90 backdrop-blur-2xl border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                            {navItems.map((item) => {
                                const isActive = item.url === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(item.url);
                                return (
                                    <DropdownMenuItem key={item.title} asChild>
                                        <Link
                                            to={item.url}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 last:mb-0 cursor-pointer",
                                                isActive
                                                    ? "bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20"
                                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-primary/70")} />
                                            <span className="text-sm font-bold tracking-tight">{item.title}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="h-8 w-[1px] bg-white/10 mx-2 hidden sm:block" />

                    {/* User Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-0 active:scale-90 transition-transform">
                                <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-md transition-all hover:border-primary">
                                    <AvatarImage
                                        src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">
                                        {user?.user_metadata?.name?.substring(0, 2) || user?.email?.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[260px] p-2 bg-popover/90 backdrop-blur-2xl border-white/10 rounded-3xl shadow-2xl animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-3 px-4 py-4 mb-2">
                                <Avatar className="h-12 w-12 border-2 border-primary/30">
                                    <AvatarImage src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} />
                                    <AvatarFallback className="bg-primary/20 text-primary uppercase font-bold">
                                        {user?.user_metadata?.name?.substring(0, 2) || user?.email?.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[15px] font-black text-foreground truncate leading-tight">
                                        {user?.user_metadata?.name || "Usuário"}
                                    </span>
                                    <span className="text-[12px] text-muted-foreground truncate leading-tight opacity-70 italic">{user?.email}</span>
                                </div>
                            </div>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <div className="p-1 space-y-1">
                                <DropdownMenuItem asChild>
                                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
                                        <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight">Meu Perfil</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors">
                                        <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                            <Settings className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight">Configurações</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                    onClick={logout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                                        <LogOut className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight">Sair da conta</span>
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
