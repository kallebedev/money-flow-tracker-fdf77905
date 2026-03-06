import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, Menu, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinance } from "@/contexts/FinanceContext";
import { AIBudgetPlanner } from "./AIBudgetPlanner";
import { useState } from "react";

export default function TopNav() {
    const { user, logout } = useAuth();
    const { transactions, categories, balance } = useFinance();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isFinance = location.pathname.includes("/dashboard") ||
        location.pathname.includes("/transactions") ||
        location.pathname.includes("/categories") ||
        location.pathname.includes("/analysis") ||
        location.pathname.includes("/goals");

    const isProductivity = location.pathname.includes("/productivity");

    const financeItems = [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Transações", path: "/transactions" },
        { name: "Categorias", path: "/categories" },
        { name: "Metas", path: "/goals" }
    ];

    return (
        <nav className="sticky top-0 z-50 w-full h-[72px] bg-[#0a0a0a]/80 backdrop-blur-[20px] border-b border-white/[0.03]">
            <div className="max-w-[1400px] mx-auto h-full px-4 md:px-10 lg:px-12 flex items-center justify-between">
                {/* Left Section: Logo + Switcher */}
                <div className="flex items-center gap-4 lg:gap-6">
                    <Link to="/" className="flex items-center gap-3 group shrink-0">
                        <div className="w-[32px] h-[32px] md:w-[36px] md:h-[36px] bg-[#22c55e] rounded-[10px] flex items-center justify-center transition-transform group-hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                            <span className="text-[16px] md:text-[18px] font-black text-[#0a0a0a]">$</span>
                        </div>
                        <span className="text-[18px] font-bold tracking-tight text-[#f0f0f0] hidden sm:block">MoneyFlow</span>
                    </Link>

                    <div className="h-6 w-px bg-white/[0.06] hidden lg:block" />

                    <div className="bg-[#111]/50 p-[3px] rounded-[12px] flex items-center border border-white/[0.03] scale-90 md:scale-100 origin-left shrink-0">
                        <Link
                            to="/dashboard"
                            className={cn(
                                "px-3 md:px-4 py-[6px] text-xs md:text-[13px] font-medium rounded-[9px] transition-all",
                                isFinance
                                    ? "bg-[#161616] text-[#f0f0f0] border border-white/[0.06] shadow-md"
                                    : "text-[#555] hover:text-[#888]"
                            )}
                        >
                            Finanças
                        </Link>
                        <Link
                            to="/productivity"
                            className={cn(
                                "px-3 md:px-4 py-[6px] text-xs md:text-[13px] font-medium rounded-[9px] transition-all",
                                isProductivity
                                    ? "bg-[#161616] text-[#f0f0f0] border border-white/[0.06] shadow-md"
                                    : "text-[#555] hover:text-[#888]"
                            )}
                        >
                            <span className="hidden xs:inline">Produtividade</span>
                            <span className="xs:hidden">Produção</span>
                        </Link>
                    </div>
                </div>

                {/* Center Section: Contextual Nav (Hidden on Mobile) */}
                <div className="absolute left-1/2 -translate-x-1/2 hidden lg:block text-nowrap">
                    {isFinance && (
                        <div className="flex items-center gap-8">
                            {financeItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "text-[11px] font-bold uppercase tracking-[0.12em] transition-colors",
                                        location.pathname === item.path
                                            ? "text-[#22c55e]"
                                            : "text-[#555] hover:text-[#f0f0f0]"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="hidden lg:flex items-center gap-3">
                        <AIBudgetPlanner />
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-[#555] hover:text-[#f0f0f0] transition-colors"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative h-8 w-8 md:h-9 md:w-9 rounded-full border border-white/[0.06] hover:border-white/[0.12] transition-colors overflow-hidden outline-none">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ""} className="object-cover" />
                                    <AvatarFallback className="bg-[#111] text-[#555] text-[10px] md:text-[11px] font-black uppercase">
                                        {user?.email?.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-[#111] border-white/[0.06] text-[#f0f0f0] rounded-xl" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal text-[#f0f0f0]">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.email}</p>
                                    <p className="text-xs leading-none text-[#555]">Membro Premium</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/[0.04]" />
                            <Link to="/profile">
                                <DropdownMenuItem className="focus:bg-white/[0.04] cursor-pointer text-[#f0f0f0]">
                                    <User className="mr-2 h-5 w-5 text-[#555]" />
                                    <span>Perfil</span>
                                </DropdownMenuItem>
                            </Link>
                            <Link to="/settings">
                                <DropdownMenuItem className="focus:bg-white/[0.04] cursor-pointer text-[#f0f0f0]">
                                    <Settings className="mr-2 h-5 w-5 text-[#555]" />
                                    <span>Configurações</span>
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator className="bg-white/[0.03]" />
                            <DropdownMenuItem onClick={() => logout()} className="focus:bg-red-500/10 text-red-500 cursor-pointer">
                                <LogOut className="mr-2 h-5 w-5" />
                                <span>Sair</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Mobile Menu Backdrop & Content */}
            {isMenuOpen && (
                <div className="lg:hidden absolute top-[72px] left-0 w-full h-screen bg-[#0a0a0a]/95 backdrop-blur-xl z-[60] animate-in fade-in slide-in-from-right-4 duration-300 border-t border-white/[0.03]">
                    <div className="p-6 space-y-8">
                        {isFinance && (
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333]">Navegação Financeira</p>
                                <div className="grid gap-2">
                                    {financeItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border transition-all",
                                                location.pathname === item.path
                                                    ? "bg-[#22c55e]/10 border-[#22c55e]/20 text-[#22c55e]"
                                                    : "bg-white/[0.02] border-white/[0.03] text-[#f0f0f0]"
                                            )}
                                        >
                                            <span className="text-sm font-bold">{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-white/[0.03]">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#333]">IA & Ferramentas</p>
                            <AIBudgetPlanner />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
