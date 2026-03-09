import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithAI, ChatMessage, FinancialContext } from "@/lib/openaiService";
import { useFinance } from "@/contexts/FinanceContext";
import ReactMarkdown from "react-markdown";

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { balance, totalIncome, totalExpense, savings, monthlySalary, categories, transactions, goals } = useFinance();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getFinancialContext = (): FinancialContext => ({
    balance,
    totalIncome,
    totalExpense,
    savings,
    monthlySalary,
    categories: categories.map(c => ({ name: c.name, monthlyBudget: c.monthlyBudget })),
    recentTransactions: transactions.slice(0, 15).map(t => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: categories.find(c => c.id === t.category)?.name || t.category,
      date: t.date,
    })),
    goals: goals.map(g => ({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount })),
  });

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithAI(newMessages, getFinancialContext());
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Erro ao processar sua mensagem. Verifique sua conexão e tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickAction = async (prompt: string) => {
    const userMessage: ChatMessage = { role: "user", content: prompt };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    try {
      const response = await chatWithAI(newMessages, getFinancialContext());
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Erro ao processar sua mensagem." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "📊 Analisar gastos", prompt: "Analise meus gastos do mês e me dê insights sobre onde posso economizar." },
    { label: "💰 Dicas de economia", prompt: "Me dê 5 dicas práticas para economizar baseado no meu perfil financeiro." },
    { label: "📈 Previsão", prompt: "Faça uma previsão dos meus gastos para o próximo mês." },
    { label: "🎯 Revisar metas", prompt: "Analise minhas metas financeiras e me dê sugestões para alcançá-las mais rápido." },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
          isOpen
            ? "bg-destructive hover:bg-destructive/90 rotate-0"
            : "bg-primary hover:bg-primary/90 shadow-primary/30 hover:shadow-primary/50 hover:scale-110"
        )}
      >
        {isOpen ? <X className="h-6 w-6 text-destructive-foreground" /> : <Bot className="h-6 w-6 text-primary-foreground" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[600px] bg-[#0a0a0a] border border-white/[0.06] rounded-3xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.06] bg-[#111]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">MoneyFlow AI</h3>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Assistente Financeiro</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[380px]">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <Bot className="h-12 w-12 mx-auto text-primary/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Olá! Como posso ajudar com suas finanças hoje?</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(action.prompt);
                        setTimeout(() => sendMessage(), 100);
                        setInput(action.prompt);
                      }}
                      className="p-3 text-left text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] rounded-xl transition-all text-muted-foreground hover:text-foreground"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-white/[0.04] text-foreground border border-white/[0.04] rounded-bl-md"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-0.5 [&_strong]:text-primary">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] border border-white/[0.04] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Analisando...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/[0.06] bg-[#111]">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre suas finanças..."
                className="flex-1 bg-white/[0.03] border-white/[0.06] rounded-xl text-sm h-10 placeholder:text-muted-foreground/50"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
