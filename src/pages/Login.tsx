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

    const from = location.state?.from?.pathname || "/";

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors duration-500">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>

            <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <CardHeader className="space-y-2 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary rounded-2xl shadow-lg animate-bounce">
                            <Wallet className="w-8 h-8 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        MoneyFlow
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 text-lg">
                        {isLogin ? "Sua jornada financeira começa aqui" : "Crie sua conta e comece a economizar"}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pt-4">
                        {!isLogin && (
                            <div className="space-y-2 group">
                                <Label htmlFor="name" className="group-focus-within:text-primary transition-colors">Nome</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Seu nome"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-primary transition-all duration-300"
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2 group">
                            <Label htmlFor="email" className="group-focus-within:text-primary transition-colors">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="exemplo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-primary transition-all duration-300"
                                required
                            />
                        </div>
                        <div className="space-y-2 group">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-primary transition-all duration-300"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-6 pb-8">
                        <Button
                            type="submit"
                            className="w-full h-11 text-lg font-medium shadow-lg hover:shadow-primary/25 transition-all duration-300 transform hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                    {isLogin ? "Acessando..." : "Criando..."}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                    {isLogin ? "Acessar conta" : "Criar conta"}
                                </div>
                            )}
                        </Button>
                        <div className="text-sm text-center text-slate-500 dark:text-slate-400">
                            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-primary hover:underline cursor-pointer font-medium bg-transparent border-none outline-none"
                            >
                                {isLogin ? "Cadastre-se" : "Faça login"}
                            </button>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
