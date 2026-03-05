import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Wallet,
    Zap,
    ShieldCheck,
    BrainCircuit,
    PieChart as PieChartIcon,
    Star,
    ChevronDown,
    CheckCircle2,
    BarChart3,
    DollarSign,
    Menu
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LandingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = React.useState<number | null>(null);

    useEffect(() => {
        if (user) {
            navigate("/dashboard");
        }
    }, [user, navigate]);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans antialiased">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <Wallet className="h-6 w-6 text-[#050505]" />
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase italic">MoneyFlow</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Funcionalidades</a>
                        <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Sobre</a>
                        <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">FAQ</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-white hover:text-primary transition-colors hidden sm:block font-bold">Entrar</Link>
                        <Button asChild className="h-10 px-6 rounded-full bg-primary hover:bg-primary/90 text-[#050505] font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                            <Link to="/login">Começar Agora</Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/5">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 overflow-hidden">
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex -space-x-1.5">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-4 w-4 rounded-full border border-[#050505] bg-muted overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 12}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">O SEU DINHEIRO NA PALMA DA MÃO</span>
                    </div>

                    <h1 className="text-5xl md:text-[85px] font-black tracking-tighter leading-[0.9] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 uppercase italic">
                        DOMINE SEU FLUXO,<br />
                        <span className="text-primary">CONQUISTE</span> SUA LIBERDADE.
                    </h1>

                    <p className="max-w-2xl mx-auto text-sm md:text-lg text-muted-foreground font-medium mb-10 leading-relaxed opacity-60 px-4">
                        A plataforma definitiva para quem busca clareza absoluta e crescimento financeiro inteligente. Simples, moderno e impulsionado por IA.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 px-4">
                        <Button size="lg" asChild className="h-14 px-10 rounded-full bg-primary hover:bg-primary/90 text-[#050505] font-black text-sm uppercase tracking-widest group shadow-xl shadow-primary/20">
                            <Link to="/login" className="flex items-center gap-2">
                                Começar Agora
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <button
                            onClick={(e) => scrollToSection(e as any, 'features')}
                            className="h-14 px-10 rounded-full border border-white/10 bg-white/5 font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all text-white"
                        >
                            Ver Funcionalidades
                        </button>
                    </div>

                    {/* App Mockup Container - Restored previous real preview image */}
                    <div className="max-w-5xl mx-auto rounded-[32px] md:rounded-[40px] border border-white/10 bg-gradient-to-b from-white/15 to-transparent p-2 md:p-3 backdrop-blur-sm shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-500">
                        {/* Decorative Badge 1 */}
                        <div className="absolute top-10 right-10 bg-[#050505]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 hidden lg:flex items-center gap-3 z-30 shadow-2xl animate-bounce">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase text-muted-foreground leading-none mb-1">Saúde Financeira</p>
                                <p className="text-xl font-black text-emerald-500 leading-none tracking-tighter italic">EXCELENTE</p>
                            </div>
                        </div>

                        {/* Main Image Container */}
                        <div className="rounded-[24px] md:rounded-[30px] overflow-hidden border border-white/10 bg-[#020202] aspect-video relative group shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                            <img
                                src="/app-preview.png"
                                alt="MoneyFlow Dashboard Preview"
                                className="w-full h-full object-cover opacity-100 group-hover:scale-[1.02] transition-all duration-1000 [image-rendering:auto] filter contrast-[1.1] brightness-[1.1] saturate-[1.1] block"
                            />
                            {/* Premium Screen Lighting Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-white/5 pointer-events-none z-10 opacity-50" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none z-10" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80 pointer-events-none z-10" />
                        </div>

                        {/* Decorative Badge 2 */}
                        <div className="absolute bottom-12 left-12 bg-[#050505]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 hidden lg:flex items-center gap-3 z-30 shadow-2xl animate-pulse delay-700">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <PieChartIcon className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Economia Mensal</p>
                                <p className="text-xl font-black text-blue-500 leading-none tracking-tighter italic">R$ 2.450,00</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { label: "USUÁRIOS ATIVOS", val: "10k+" },
                            { label: "TRANSAÇÕES POR MÊS", val: "1M+" },
                            { label: "ECONOMIA GERADA", val: "R$ 5M+" },
                            { label: "AVALIAÇÃO APP", val: "4.9/5" }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col gap-2">
                                <span className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-none">{stat.val}</span>
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-2xl mb-20 text-left">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 italic">POTENCIALIZANDO SEU DINHEIRO</h2>
                        <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-8 uppercase italic">FERRAMENTAS CRIADAS PARA O SEU SUCESSO.</h3>
                        <p className="text-base text-muted-foreground font-medium max-w-lg leading-relaxed opacity-60">
                            Desenvolvemos cada funcionalidade com um único objetivo: transformar a complexidade financeira em clareza absoluta.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: BrainCircuit,
                                title: "IA PREDITIVA",
                                text: "Algoritmos inteligentes que analisam seus hábitos e sugerem o melhor plano orçamentário para seus objetivos."
                            },
                            {
                                icon: Zap,
                                title: "TEMPO REAL",
                                text: "Sync instantâneo e dashboards dinâmicos para que você saiba exatamente onde cada centavo está, na hora."
                            },
                            {
                                icon: ShieldCheck,
                                title: "SEGURANÇA TOTAL",
                                text: "Seus dados protegidos com criptografia de ponta e autenticação robusta. Privacidade é nossa prioridade."
                            }
                        ].map((f, i) => (
                            <div key={i} className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500">
                                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-8">
                                    <f.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="text-2xl font-black tracking-tighter mb-4 italic uppercase">{f.title}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed font-medium opacity-60">
                                    {f.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About / Preview Section */}
            <section id="about" className="py-24 bg-white/[0.01] border-y border-white/5">
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
                    <div className="bg-[#0a0a0a] rounded-[40px] p-8 border border-white/5 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none">Saldo Total</p>
                                <h4 className="text-3xl font-black italic tracking-tighter text-white">R$ 14.250,00</h4>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                <Star className="h-5 w-5 text-[#050505] fill-current" />
                            </div>
                        </div>

                        <div className="h-1 bg-white/5 rounded-full mb-10 overflow-hidden">
                            <div className="h-full w-[70%] bg-primary shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        </div>

                        <div className="flex items-end justify-between h-32 gap-3 px-1 mb-8">
                            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                <div
                                    key={i}
                                    className="w-full bg-primary rounded-t-lg transition-all duration-1000"
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            {[
                                { l: "TRANSAÇÕES", v: "1483", c: "text-white/40" },
                                { l: "ECONOMIZADO", v: "R$ 4.850,00", c: "text-primary" }
                            ].map((s, i) => (
                                <div key={i} className="flex justify-between items-center border-t border-white/5 pt-4">
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">{s.l}</span>
                                    <span className={`text-base font-black italic tracking-tighter ${s.c}`}>{s.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-6 italic">NOSSA MISSÃO</h2>
                        <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mb-8 italic uppercase text-white">POR QUE O MONEYFLOW?</h3>
                        <p className="text-base text-muted-foreground leading-relaxed mb-8 font-medium italic opacity-60">
                            Acreditamos que a liberdade financeira não é sobre quanto você ganha, mas sobre como você domina o fluxo do seu dinheiro.
                        </p>
                        <p className="text-base text-muted-foreground leading-relaxed mb-10 font-medium italic opacity-60">
                            Nascemos para acabar com as planilhas complexas e trazer a simplicidade do design premium aliada ao poder da inteligência artificial.
                        </p>
                        <ul className="space-y-5">
                            {["DESIGN INTUITIVO E MODERNO", "FERRAMENTAS IMPULSIONADAS POR IA", "FOCO TOTAL EM RESULTADOS"].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm font-black italic tracking-wider text-white">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24">
                <div className="container mx-auto px-6 max-w-2xl text-center">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4 italic">PERGUNTAS FREQUENTES</h2>
                    <h3 className="text-4xl font-black tracking-tighter mb-16 italic uppercase underline decoration-primary decoration-4 underline-offset-8">DÚVIDAS COMUNS.</h3>

                    <div className="space-y-4 text-left">
                        {[
                            { q: "O MONEYFLOW É GRATUITO?", a: "Sim! Oferecemos um plano gratuito completo para usuários individuais começarem sua jornada financeira hoje mesmo." },
                            { q: "MEUS DADOS ESTÃO SEGUROS?", a: "Absolutamente. Utilizamos criptografia de nível bancário e autenticação via Supabase para garantir que apenas você tenha acesso aos seus dados." },
                            { q: "COMO A IA AJUDA NO MEU FINANCEIRO?", a: "Nossa IA analisa seus padrões de gastos para prever despesas futuras e sugerir economias inteligentes personalizadas para você." },
                            { q: "EXISTE VERSÃO PARA DISPOSITIVOS MÓVEIS?", a: "O MoneyFlow é uma Web App totalmente responsiva, o que significa que você pode acessar todas as funcionalidades pelo navegador do seu celular com experiência nativa." },
                            { q: "POSSO IMPORTAR DADOS DE OUTROS BANCOS?", a: "Sim, você pode importar suas transações via arquivos CSV de forma simples e rápida para consolidar tudo em um só lugar." },
                            { q: "POSSO CANCELAR MINHA CONTA QUANDO QUISER?", a: "Sim, você tem total liberdade. Seus dados pertencem a você e você pode excluir sua conta e exportar seus dados a qualquer momento." }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer ${openFaq === i
                                        ? "bg-white/[0.05] border-primary/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                                    }`}
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            >
                                <h4 className={`text-base font-black italic tracking-tighter flex items-center justify-between uppercase transition-colors ${openFaq === i ? "text-primary" : "text-white"}`}>
                                    {item.q}
                                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-primary" : "text-primary"}`} />
                                </h4>
                                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 mt-4 opacity-100" : "max-h-0 opacity-0"}`}>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed italic border-t border-white/5 pt-4">
                                        {item.a}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section - NEW DESIGN */}
            <section className="py-32 px-6">
                <div className="container mx-auto">
                    <div className="bg-primary rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
                        <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9] text-[#050505] italic uppercase relative z-10 transition-transform group-hover:scale-105 duration-700">
                            PRONTO PARA MUDAR<br />
                            SUA VIDA FINANCEIRA?
                        </h2>
                        <p className="text-[#050505]/70 text-sm md:text-lg font-black uppercase tracking-widest mb-10 relative z-10">
                            Junte-se a milhares de usuários que já estão no controle total.
                        </p>
                        <Button size="lg" asChild className="h-16 px-12 rounded-full bg-[#050505] text-white hover:bg-[#050505]/90 font-black text-sm uppercase tracking-widest relative z-10 shadow-2xl transition-all hover:scale-105 active:scale-95">
                            <Link to="/login">Criar Conta Gratuita Agora</Link>
                        </Button>
                        <div className="mt-12 flex flex-wrap justify-center gap-6 opacity-60 text-[#050505] relative z-10">
                            {["SEM CARTÃO", "LIVRE DE ADS", "SYNC ILIMITADO"].map((item, i) => (
                                <p key={i} className="text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> {item}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 bg-black/20">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-primary border border-white/10">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-black tracking-tighter uppercase italic">MoneyFlow</span>
                        </div>
                        <p className="text-muted-foreground text-sm font-medium max-w-sm leading-relaxed mb-10 opacity-60">
                            A próxima geração da gestão financeira inteligente. Clareza, simplicidade e liberdade ao seu alcance.
                        </p>
                    </div>

                    <div>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 italic text-left">PLATAFORMA</h5>
                        <ul className="space-y-4">
                            {["DASHBOARD", "FUNCIONALIDADES", "SOBRE NÓS", "PERGUNTAS"].map((t, i) => (
                                <li key={i}>
                                    <a href="#" className="text-sm font-black italic tracking-wide text-muted-foreground hover:text-white transition-colors">{t}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 italic text-left">LEGAL</h5>
                        <ul className="space-y-4">
                            {["INSTAGRAM", "TWITTER"].map((t, i) => (
                                <li key={i}>
                                    <a href="#" className="text-sm font-black italic tracking-wide text-muted-foreground hover:text-white transition-colors">{t}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="container mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">© 2026 MoneyFlow. TODOS OS DIREITOS RESERVADOS.</p>
                    <div className="flex gap-8">
                        <a href="#" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">PRIVACIDADE</a>
                        <a href="#" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">TERMOS</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
