import { useMemo } from "react";
import { useFinance } from "../contexts/FinanceContext";

export interface BudgetProfileData {
    goal: "debt" | "savings" | "moderate";
    lifestyle: "frugal" | "comfortable" | "custom";
    priority: "essentials" | "future" | "lifestyle";
}

export function useAIBudgetAdvisor(profileData?: BudgetProfileData) {
    // Use useFinance context instead of useFinanceData hook directly to share state
    const { monthlySalary, categories } = useFinance();

    const advisor = useMemo(() => {
        if (!monthlySalary || monthlySalary <= 0) return null;

        // Default base percentages
        let needsPerc = 0.5;
        let wantsPerc = 0.3;
        let savingsPerc = 0.2;

        // Adjust based on goal
        if (profileData?.goal === "debt") {
            needsPerc += 0.1;
            wantsPerc -= 0.1;
        } else if (profileData?.goal === "savings") {
            savingsPerc += 0.1;
            wantsPerc -= 0.1;
        }

        // Adjust based on lifestyle
        if (profileData?.lifestyle === "frugal") {
            wantsPerc -= 0.1;
            savingsPerc += 0.1;
        } else if (profileData?.lifestyle === "comfortable") {
            wantsPerc += 0.05;
            needsPerc -= 0.05;
        }

        // Adjust based on priority
        if (profileData?.priority === "essentials") {
            needsPerc += 0.05;
            wantsPerc -= 0.05;
        } else if (profileData?.priority === "future") {
            savingsPerc += 0.05;
            wantsPerc -= 0.05;
        } else if (profileData?.priority === "lifestyle") {
            wantsPerc += 0.05;
            needsPerc -= 0.05;
        }

        // Normalize to ensure they sum to 1
        const total = needsPerc + wantsPerc + savingsPerc;
        needsPerc /= total;
        wantsPerc /= total;
        savingsPerc /= total;

        const needsLimit = monthlySalary * needsPerc;
        const wantsLimit = monthlySalary * wantsPerc;
        const savingsLimit = monthlySalary * savingsPerc;

        const buckets = [
            { id: "needs", name: "Essencial", limit: needsLimit, percentage: Math.round(needsPerc * 100), reason: "Alimentação, Moradia, Transporte e Saúde." },
            { id: "wants", name: "Estilo de Vida", limit: wantsLimit, percentage: Math.round(wantsPerc * 100), reason: "Lazer, compras e gastos não essenciais." },
            { id: "savings", name: "Futuro", limit: savingsLimit, percentage: Math.round(savingsPerc * 100), reason: "Reserva de emergência e investimentos." }
        ];

        // Keywords for classification
        const keywords = {
            needs: ["alimentação", "mercado", "aluguel", "moradia", "transporte", "combustível", "saúde", "farmácia", "Educação", "contas", "luz", "água", "internet"],
            savings: ["investimento", "poupança", "reserva", "ações", "cripto", "tesouro"]
        };

        // Classify all categories
        const classifiedCategories = categories.map(cat => {
            const lowerName = cat.name.toLowerCase();
            let bucketId = "wants"; // Default

            if (keywords.needs.some(k => lowerName.includes(k.toLowerCase()))) {
                bucketId = "needs";
            } else if (keywords.savings.some(k => lowerName.includes(k.toLowerCase()))) {
                bucketId = "savings";
            }

            return { ...cat, bucketId };
        });

        // Count categories per bucket to distribute equally within the bucket
        const bucketCounts = {
            needs: classifiedCategories.filter(c => c.bucketId === "needs").length,
            wants: classifiedCategories.filter(c => c.bucketId === "wants").length,
            savings: classifiedCategories.filter(c => c.bucketId === "savings").length
        };

        // Calculate specific advice for ALL categories
        const categoryAdvice = classifiedCategories.map(cat => {
            const count = bucketCounts[cat.bucketId as keyof typeof bucketCounts];
            const bucketLimit = buckets.find(b => b.id === cat.bucketId)?.limit || 0;

            // Distribute bucket limit equally among its categories
            const suggestedAmount = count > 0 ? bucketLimit / count : 0;

            return {
                categoryId: cat.id,
                categoryName: cat.name,
                bucketName: buckets.find(b => b.id === cat.bucketId)?.name,
                suggestedAmount,
                advice: `Esta categoria foi classificada como ${buckets.find(b => b.id === cat.bucketId)?.name.toLowerCase()}.`
            };
        });

        return {
            buckets: buckets.map(b => ({
                category: b.name,
                percentage: b.percentage,
                suggestedAmount: b.limit,
                reason: b.reason
            })),
            categoryAdvice,
            overview: `Com base nas suas respostas, sua distribuição ideal é: R$ ${needsLimit.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} para o essencial, R$ ${wantsLimit.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} para estilo de vida e R$ ${savingsLimit.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} para o futuro.`
        };
    }, [monthlySalary, categories, profileData]);

    return advisor;
}
