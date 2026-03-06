import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Wallet, UserPlus } from "lucide-react";

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login, signUp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/dashboard";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password || (!isLogin && !name)) {
            toast.error("Por favor, preencha todos os campos");
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                const { error } = await login(email, password);
                if (error) {
                    toast.error(error.message);
                } else {
                    toast.success("Login realizado com sucesso!");
                    navigate(from, { replace: true });
                }
            } else {
                const { error } = await signUp(email, password, name);
                if (error) {
                    toast.error(error.message);
                } else {
                    toast.success("Conta criada! Verifique seu e-mail para confirmar.");
                    setIsLogin(true);
                }
            }
        } catch (error: any) {
            toast.error("Erro inesperado ao realizar operação.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-6 selection:bg-[#22c55e]/30">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 -mr-40 -mt-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center h-[72px] w-[72px] rounded-[18px] bg-[#22c55e] shadow-[0_0_40px_rgba(34,197,94,0.15)] mb-8 transition-transform hover:scale-105">
                        <Wallet className="w-9 h-9 text-[#0a0a0a]" />
                    </div>
                    <h1 className="text-[28px] font-normal font-mono tracking-[-0.04em] text-[#f0f0f0] mb-3">MONEYFLOW</h1>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#555] opacity-80">
                        {isLogin ? "SISTEMA DE GESTÃO FINANCEIRA" : "CRIAÇÃO DE ACESSO AO SISTEMA"}
                    </p>
                </div>

                <div className="bg-[#111] border border-white/[0.03] rounded-[24px] p-10 shadow-2xl relative overflow-hidden">
                    {/* Industrial Detail */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {!isLogin && (
                            <div className="space-y-1.5 group">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Nome</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="SEU NOME"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 bg-white/[0.02] border-white/[0.03] focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all font-bold text-sm text-white rounded-xl placeholder:text-white/20"
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-1.5 group">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="EXEMPLO@EMAIL.COM"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 bg-white/5 border-white/5 focus-visible:ring-primary focus-visible:border-primary/50 transition-all font-bold text-sm text-white rounded-xl placeholder:text-white/20"
                                required
                            />
                        </div>
                        <div className="space-y-1.5 group">
                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 bg-white/5 border-white/5 focus-visible:ring-primary focus-visible:border-primary/50 transition-all font-bold text-sm text-white rounded-xl placeholder:text-white/20"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-[54px] bg-[#22c55e] hover:bg-[#22c55e]/90 text-[#0a0a0a] font-black text-[12px] uppercase tracking-[0.15em] rounded-[14px] shadow-xl shadow-green-500/10 transition-all active:scale-[0.98] group mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-[#050505] border-t-transparent rounded-full animate-spin"></div>
                                    {isLogin ? "ACESSANDO..." : "CRIANDO..."}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {isLogin ? "Acessar conta" : "Criar minha conta"}
                                    <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 text-center relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#555]">
                            {isLogin ? "NÃO POSSUI ACESSO?" : "JÁ POSSUI ACESSO?"}{" "}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-[#22c55e] hover:text-[#22c55e]/80 cursor-pointer transition-colors ml-2"
                            >
                                {isLogin ? "SOLICITAR CADASTRO" : "REALIZAR LOGIN"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
