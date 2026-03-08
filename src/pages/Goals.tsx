import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Target, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const emptyForm = { name: "", targetAmount: "", currentAmount: "", deadline: "", hasDeadline: false };

export default function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(g: typeof goals[0]) {
    setEditId(g.id);
    const hasDeadline = !!g.deadline;
    setForm({
      name: g.name,
      targetAmount: String(g.targetAmount),
      currentAmount: String(g.currentAmount),
      deadline: hasDeadline && g.deadline ? g.deadline.slice(0, 10) : "",
      hasDeadline
    });
    setOpen(true);
  }

  function handleSave() {
    const target = parseFloat(form.targetAmount);
    const current = parseFloat(form.currentAmount) || 0;
    if (!form.name || !target) { toast.error("Preencha nome e valor alvo"); return; }
    if (form.hasDeadline && !form.deadline) { toast.error("Informe a data do prazo"); return; }
    const deadline = form.hasDeadline && form.deadline ? form.deadline : null;
    if (editId) {
      updateGoal(editId, { name: form.name, targetAmount: target, currentAmount: current, deadline: deadline ?? undefined });
      toast.success("Meta atualizada!");
    } else {
      addGoal({ name: form.name, targetAmount: target, currentAmount: current, deadline: deadline ?? undefined });
      toast.success("Meta criada!");
    }
    setOpen(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Metas Financeiras</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-5 w-5" />Nova Meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Meta</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Comprar notebook" /></div>
              <div><Label>Valor Alvo (R$)</Label><Input type="number" min="0" step="0.01" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></div>
              <div><Label>Valor Atual (R$)</Label><Input type="number" min="0" step="0.01" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} /></div>
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="space-y-1">
                  <Label>Tenho prazo para conquistar</Label>
                  <p className="text-xs text-muted-foreground">Defina uma data limite ou deixe sem prazo</p>
                </div>
                <Switch checked={form.hasDeadline} onCheckedChange={(v) => setForm({ ...form, hasDeadline: v, deadline: v ? form.deadline : "" })} />
              </div>
              {form.hasDeadline && (
                <div><Label>Prazo</Label><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="finance-card">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhuma meta criada ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            return (
              <Card key={g.id} className="finance-card">
                <CardContent className="pt-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                        <Target className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{g.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {g.deadline ? (
                            <><Calendar className="w-3 h-3" /> Prazo: {format(parseISO(g.deadline), "dd/MM/yyyy")}</>
                          ) : (
                            <>Sem prazo definido</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(g)}><Pencil className="h-5 w-5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { deleteGoal(g.id); toast.success("Meta excluída!"); }}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                    </div>
                  </div>
                  <Progress value={pct} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{formatCurrency(g.currentAmount)} de {formatCurrency(g.targetAmount)}</span>
                    <span className="font-semibold text-primary">{pct}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Faltam {formatCurrency(remaining)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
