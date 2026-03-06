import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Transaction, TransactionType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const emptyForm = {
  type: "expense" as TransactionType,
  amount: "",
  category: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  paymentMethod: "pix" as "pix" | "cartao"
};

export default function Transactions() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) => {
    if (filterMonth && filterMonth !== "all" && !t.date.startsWith(filterMonth)) return false;
    if (filterCategory && filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterType && filterType !== "all" && t.type !== filterType) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditId(t.id);
    setForm({
      type: t.type,
      amount: String(t.amount),
      category: t.category,
      date: t.date.slice(0, 10),
      description: t.description,
      paymentMethod: t.paymentMethod || "pix"
    });
    setOpen(true);
  }

  function handleSave() {
    const amount = parseFloat(form.amount);
    if (!amount || !form.description) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (form.type === "expense" && !form.category) {
      toast.error("Por favor, selecione uma categoria para a despesa");
      return;
    }
    if (editId) {
      updateTransaction(editId, {
        type: form.type,
        amount,
        category: form.type === "expense" ? form.category : null,
        date: form.date,
        description: form.description,
        paymentMethod: form.type === "expense" ? form.paymentMethod : "pix"
      });
      toast.success("Transação atualizada!");
    } else {
      addTransaction({
        type: form.type,
        amount,
        category: form.type === "expense" ? form.category : null,
        date: form.date,
        description: form.description,
        paymentMethod: form.type === "expense" ? form.paymentMethod : "pix"
      });
      toast.success("Transação adicionada!");
    }
    setOpen(false);
  }

  function handleDelete(id: string) {
    deleteTransaction(id);
    toast.success("Transação excluída!");
  }

  // unique months
  const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort().reverse();

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Transações</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu histórico financeiro aqui.</p>
        </div>
      </div>

      <Card className="bg-card border-none rounded-3xl mb-8 p-1 shadow-sm overflow-hidden">
        <CardContent className="pt-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Busca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 bg-[#0c0c0c] border border-white/[0.03] h-10 rounded-xl text-sm focus:border-primary/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-[#0c0c0c] border-white/[0.03] h-10 text-sm rounded-xl">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/[0.08] text-foreground">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-[#0c0c0c] border-white/[0.03] h-10 text-sm rounded-xl">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/[0.08] text-foreground">
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Período</Label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-4 bg-[#0c0c0c] border border-white/[0.03] h-10 rounded-xl text-sm focus:border-primary/50 outline-none transition-all color-scheme-dark"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-none rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {(() => {
            const grouped = filtered.reduce((acc, t) => {
              const date = (t.date || new Date().toISOString()).slice(0, 10);
              if (!acc[date]) acc[date] = [];
              acc[date].push(t);
              return acc;
            }, {} as Record<string, Transaction[]>);

            const sortedDates = Object.keys(grouped).sort().reverse();

            if (sortedDates.length === 0) {
              return (
                <div className="py-20 text-center text-muted-foreground">
                  <p>Nenhuma transação encontrada para este filtro.</p>
                </div>
              );
            }

            return sortedDates.map((date) => {
              const dayTransactions = grouped[date];
              const dayIncome = dayTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
              const dayExpense = dayTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

              let dateLabel = "Data inválida";
              let dayLabel = "---";

              try {
                const parsed = parseISO(date);
                dateLabel = format(parsed, "dd 'de' MMMM", { locale: ptBR });
                dayLabel = format(parsed, "EEEE", { locale: ptBR });
              } catch (e) {
                dateLabel = date;
              }

              return (
                <div key={date} className="relative">
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-6 py-3 border-b border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black uppercase tracking-widest text-foreground/50">
                        {dateLabel}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {dayLabel}
                      </span>
                    </div>
                    <div className="flex gap-4 text-[11px] font-black uppercase tracking-tighter">
                      {dayIncome > 0 && <span className="text-primary">+{formatCurrency(dayIncome)}</span>}
                      {dayExpense > 0 && <span className="text-destructive">-{formatCurrency(dayExpense)}</span>}
                    </div>
                  </div>
                  <div className="divide-y divide-border/20">
                    {dayTransactions.map((t) => {
                      const cat = categories.find((c) => c.id === t.category);
                      const isIncome = t.type === "income";
                      const amount = Number(t.amount) || 0;
                      return (
                        <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-accent/30 transition-colors group">
                          <div className="flex items-center gap-5 flex-1">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${isIncome ? "bg-primary/10" : "bg-destructive/10"}`}>
                              {isIncome ? <ArrowUpRight className="h-6 w-6 text-primary" /> : <ArrowDownRight className="h-6 w-6 text-destructive" />}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-base">{t.description}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">{cat?.name || t.category || "Outros"}</span>
                                {t.paymentMethod && <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-muted/30 px-2 py-0.5 rounded-md">{t.paymentMethod}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 mt-4 sm:mt-0">
                            <div className="text-right">
                              <p className={`font-black text-lg ${isIncome ? "text-primary" : "text-destructive"}`}>
                                {isIncome ? "+" : "-"}{formatCurrency(amount)}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={openNew}
            className="fixed bottom-8 right-8 h-14 rounded-full px-6 transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground font-bold shadow-2xl shadow-primary/20 z-50 animate-in slide-in-from-bottom-4 duration-500"
          >
            <Plus className="mr-2 h-6 w-6" />Nova Transação
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader><DialogTitle className="text-foreground">{editId ? "Editar" : "Nova"} Transação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                <SelectTrigger className="bg-background border-border text-foreground h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground font-medium">Valor (R$)</Label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className="bg-background border-border text-foreground h-11" />
            </div>
            <div className={cn("grid gap-4", form.type === "expense" ? "grid-cols-2" : "grid-cols-1")}>
              {form.type === "expense" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Método de Pagamento</Label>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(v: "pix" | "cartao") => {
                        setForm({ ...form, paymentMethod: v });
                      }}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Categoria</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground h-11">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground font-medium">Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-background border-border text-foreground h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground font-medium">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Mercado" className="bg-background border-border text-foreground h-11" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-accent text-foreground">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-bold">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
