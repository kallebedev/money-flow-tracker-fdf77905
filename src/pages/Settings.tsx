import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bell, CreditCard, Shield, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotificationPrefs = {
    emailAlerts: boolean;
    goalAlerts: boolean;
    weeklySummary: boolean;
};

type LocalePrefs = {
    dateFormat: string;
    currency: string;
    language: string;
};

type PrivacyPrefs = {
    profileVisibility: string;
};

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
    emailAlerts: false,
    goalAlerts: true,
    weeklySummary: false,
};

const DEFAULT_LOCALE: LocalePrefs = {
    dateFormat: "dd/MM/yyyy",
    currency: "BRL",
    language: "pt-BR",
};

const DEFAULT_PRIVACY: PrivacyPrefs = {
    profileVisibility: "private",
};

export default function Settings() {
    const { user, updateUserMetadata } = useAuth();
    const [notifOpen, setNotifOpen] = useState(false);
    const [localeOpen, setLocaleOpen] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [subscriptionOpen, setSubscriptionOpen] = useState(false);

    const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATIONS);
    const [locale, setLocale] = useState<LocalePrefs>(DEFAULT_LOCALE);
    const [privacy, setPrivacy] = useState<PrivacyPrefs>(DEFAULT_PRIVACY);

    useEffect(() => {
        const meta = user?.user_metadata;
        if (meta?.notifications) setNotifications({ ...DEFAULT_NOTIFICATIONS, ...meta.notifications });
        if (meta?.locale) setLocale({ ...DEFAULT_LOCALE, ...meta.locale });
        if (meta?.privacy) setPrivacy({ ...DEFAULT_PRIVACY, ...meta.privacy });
    }, [user?.user_metadata]);

    const saveNotifications = async () => {
        const { error } = await updateUserMetadata({ notifications });
        if (error) toast.error("Erro ao salvar notificações");
        else {
            toast.success("Notificações atualizadas!");
            setNotifOpen(false);
        }
    };

    const saveLocale = async () => {
        const { error } = await updateUserMetadata({ locale });
        if (error) toast.error("Erro ao salvar preferências");
        else {
            toast.success("Idioma e região atualizados!");
            setLocaleOpen(false);
        }
    };

    const savePrivacy = async () => {
        const { error } = await updateUserMetadata({ privacy });
        if (error) toast.error("Erro ao salvar privacidade");
        else {
            toast.success("Privacidade atualizada!");
            setPrivacyOpen(false);
        }
    };

    const handleExportData = () => {
        const data = {
            user_metadata: user?.user_metadata,
            exported_at: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `moneyflow-dados-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Dados exportados!");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in px-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#f0f0f0]">Configurações</h1>
                <p className="text-muted-foreground">Personalize sua experiência no MoneyFlow.</p>
            </div>

            <div className="grid gap-6">
                <Card className="bg-[#111]/50 border-white/[0.06] overflow-hidden">
                    <CardHeader className="border-b border-white/[0.03]">
                        <CardTitle className="text-lg">Aparência</CardTitle>
                        <CardDescription>Escolha como o sistema deve aparecer para você.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-[#f0f0f0]">Tema do Sistema</Label>
                            <p className="text-xs text-[#555]">Alternar entre modo claro e escuro.</p>
                        </div>
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#161616] border border-white/[0.06]">
                            <ThemeToggle />
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Notificações */}
                    <Card
                        className={cn(
                            "bg-[#111]/50 border-white/[0.06] transition-all cursor-pointer hover:bg-[#161616]/80 hover:border-white/[0.1]",
                            !notifOpen && "opacity-90"
                        )}
                        onClick={() => setNotifOpen(true)}
                    >
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                                <Bell className="w-5 h-5 text-blue-500" />
                            </div>
                            <CardTitle className="text-base text-[#f0f0f0]">Notificações</CardTitle>
                            <CardDescription>Gerencie seus alertas financeiros.</CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Idioma e Região */}
                    <Card
                        className={cn(
                            "bg-[#111]/50 border-white/[0.06] transition-all cursor-pointer hover:bg-[#161616]/80 hover:border-white/[0.1]",
                            !localeOpen && "opacity-90"
                        )}
                        onClick={() => setLocaleOpen(true)}
                    >
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                                <Globe className="w-5 h-5 text-emerald-500" />
                            </div>
                            <CardTitle className="text-base text-[#f0f0f0]">Idioma e Região</CardTitle>
                            <CardDescription>Formato de data, moeda e idioma.</CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Privacidade */}
                    <Card
                        className={cn(
                            "bg-[#111]/50 border-white/[0.06] transition-all cursor-pointer hover:bg-[#161616]/80 hover:border-white/[0.1]",
                            !privacyOpen && "opacity-90"
                        )}
                        onClick={() => setPrivacyOpen(true)}
                    >
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                                <Shield className="w-5 h-5 text-purple-500" />
                            </div>
                            <CardTitle className="text-base text-[#f0f0f0]">Privacidade</CardTitle>
                            <CardDescription>Segurança e exportação de dados.</CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Assinatura */}
                    <Card
                        className={cn(
                            "bg-[#111]/50 border-white/[0.06] transition-all cursor-pointer hover:bg-[#161616]/80 hover:border-white/[0.1]",
                            !subscriptionOpen && "opacity-90"
                        )}
                        onClick={() => setSubscriptionOpen(true)}
                    >
                        <CardHeader>
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                                <CreditCard className="w-5 h-5 text-orange-500" />
                            </div>
                            <CardTitle className="text-base text-[#f0f0f0]">Assinatura</CardTitle>
                            <CardDescription>Plano atual e upgrade.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>

            {/* Dialog Notificações */}
            <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
                <DialogContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-500" /> Notificações
                        </DialogTitle>
                        <DialogDescription>Configure como deseja receber alertas.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Alertas por e-mail</Label>
                                <p className="text-xs text-muted-foreground">Receber resumos e avisos por e-mail</p>
                            </div>
                            <Switch
                                checked={notifications.emailAlerts}
                                onCheckedChange={(v) => setNotifications((p) => ({ ...p, emailAlerts: v }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Alertas de metas</Label>
                                <p className="text-xs text-muted-foreground">Avisos quando metas estão próximas do prazo</p>
                            </div>
                            <Switch
                                checked={notifications.goalAlerts}
                                onCheckedChange={(v) => setNotifications((p) => ({ ...p, goalAlerts: v }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Resumo semanal</Label>
                                <p className="text-xs text-muted-foreground">Relatório semanal de gastos e progresso</p>
                            </div>
                            <Switch
                                checked={notifications.weeklySummary}
                                onCheckedChange={(v) => setNotifications((p) => ({ ...p, weeklySummary: v }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setNotifOpen(false)}>Cancelar</Button>
                        <Button onClick={saveNotifications}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Idioma e Região */}
            <Dialog open={localeOpen} onOpenChange={setLocaleOpen}>
                <DialogContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-emerald-500" /> Idioma e Região
                        </DialogTitle>
                        <DialogDescription>Formato de exibição de datas e valores.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Formato de data</Label>
                            <Select value={locale.dateFormat} onValueChange={(v) => setLocale((p) => ({ ...p, dateFormat: v }))}>
                                <SelectTrigger className="bg-[#0a0a0a] border-white/[0.06]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dd/MM/yyyy">DD/MM/AAAA (Brasil)</SelectItem>
                                    <SelectItem value="MM/dd/yyyy">MM/DD/AAAA (EUA)</SelectItem>
                                    <SelectItem value="yyyy-MM-dd">AAAA-MM-DD (ISO)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Moeda</Label>
                            <Select value={locale.currency} onValueChange={(v) => setLocale((p) => ({ ...p, currency: v }))}>
                                <SelectTrigger className="bg-[#0a0a0a] border-white/[0.06]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Idioma</Label>
                            <Select value={locale.language} onValueChange={(v) => setLocale((p) => ({ ...p, language: v }))}>
                                <SelectTrigger className="bg-[#0a0a0a] border-white/[0.06]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Español</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setLocaleOpen(false)}>Cancelar</Button>
                        <Button onClick={saveLocale}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Privacidade */}
            <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
                <DialogContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-500" /> Privacidade
                        </DialogTitle>
                        <DialogDescription>Configurações de segurança e dados.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Visibilidade do perfil</Label>
                            <Select value={privacy.profileVisibility} onValueChange={(v) => setPrivacy((p) => ({ ...p, profileVisibility: v }))}>
                                <SelectTrigger className="bg-[#0a0a0a] border-white/[0.06]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="private">Privado (apenas você)</SelectItem>
                                    <SelectItem value="public">Público</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="pt-4 border-t border-white/[0.06]">
                            <Label className="block mb-2">Exportar meus dados</Label>
                            <p className="text-xs text-muted-foreground mb-3">Baixe uma cópia dos seus dados em JSON.</p>
                            <Button variant="outline" size="sm" onClick={handleExportData}>
                                Exportar dados
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPrivacyOpen(false)}>Fechar</Button>
                        <Button onClick={savePrivacy}>Salvar preferências</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Assinatura */}
            <Dialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen}>
                <DialogContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-orange-500" /> Assinatura
                        </DialogTitle>
                        <DialogDescription>Seu plano atual no MoneyFlow.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                            <p className="text-sm font-bold text-[#f0f0f0]">Plano Gratuito</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Acesso completo às funcionalidades de controle financeiro, metas e produtividade.
                            </p>
                        </div>
                        <div className="pt-2">
                            <p className="text-xs text-muted-foreground">
                                O plano Premium com recursos exclusivos estará disponível em breve.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSubscriptionOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
