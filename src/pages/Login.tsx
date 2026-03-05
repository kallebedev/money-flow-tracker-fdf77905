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
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 selection:bg-primary/30">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 -mr-40 -mt-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-6 animate-pulse">
                        <Wallet className="w-8 h-8 text-[#050505]" />
                    </div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">MONEYFLOW</h1>
                    <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase opacity-60">
                        {isLogin ? "Sua jornada financeira começa aqui" : "Crie sua conta e comece a economizar"}
                    </p>
                </div>

                <div className="bg-white/[0.02] border border-white/10 backdrop-blur-3xl rounded-[32px] p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-1.5 group">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Nome</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="SEU NOME"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 bg-white/5 border-white/5 focus-visible:ring-primary focus-visible:border-primary/50 transition-all font-bold text-sm text-white rounded-xl placeholder:text-white/20"
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
                            className="w-full h-14 bg-primary hover:bg-primary/90 text-[#050505] font-black text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group mt-4"
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

                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-primary hover:text-primary/80 cursor-pointer transition-colors ml-1"
                            >
                                {isLogin ? "CADASTRE-SE" : "FAÇA LOGIN"}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
