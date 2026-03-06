import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.user_metadata?.name || "");
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("O nome não pode estar vazio");
            return;
        }

        setIsUpdatingName(true);
        const { error } = await updateProfile({ name });
        setIsUpdatingName(false);

        if (error) {
            toast.error("Erro ao atualizar nome: " + error.message);
        } else {
            toast.success("Nome atualizado com sucesso!");
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    const handleAvatarUpload = async (blob: Blob) => {
        if (!user) return;

        setIsUpdatingAvatar(true);
        try {
            const fileExt = "jpg";
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, blob, {
                    contentType: "image/jpeg",
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            // Update auth metadata
            const { error: updateError } = await updateProfile({ avatar_url: publicUrl });

            if (updateError) throw updateError;

            // Also update the profiles table if it exists
            await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    avatar_url: publicUrl,
                    updated_at: new Date().toISOString()
                });

            toast.success("Foto de perfil atualizada!");
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ["#22c55e", "#10b981", "#3b82f6"]
            });
        } catch (error: any) {
            toast.error("Erro ao enviar foto: " + error.message);
        } finally {
            setIsUpdatingAvatar(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in px-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#f0f0f0]">Informações de Perfil</h1>
                <p className="text-muted-foreground">Gerencie seus dados pessoais e identidade visual.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                <Card className="finance-card flex flex-col items-center justify-center p-6 space-y-4 h-fit border-primary/10">
                    <ImageUpload
                        onUpload={handleAvatarUpload}
                        currentImageUrl={user?.user_metadata?.avatar_url}
                        loading={isUpdatingAvatar}
                    />
                    <div className="text-center">
                        <h3 className="font-bold text-lg">{user?.user_metadata?.name || "Usuário"}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                </Card>

                <Card className="finance-card border-primary/5">
                    <CardHeader>
                        <CardTitle>Informações Básicas</CardTitle>
                        <CardDescription>Atualize seu nome e outras informações da conta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateName} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 opacity-60">
                                <Label htmlFor="email">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        value={user?.email || ""}
                                        disabled
                                        className="pl-10 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">O e-mail não pode ser alterado diretamente.</p>
                            </div>

                            <Button type="submit" className="w-full md:w-auto" disabled={isUpdatingName}>
                                {isUpdatingName ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-destructive/20 bg-destructive/5 finance-card">
                <CardHeader>
                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription>Ações irreversíveis relacionadas à sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" className="w-full md:w-auto opacity-50 cursor-not-allowed">
                        Excluir Minha Conta
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
