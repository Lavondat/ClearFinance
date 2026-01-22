
import { GoogleGenAI, Type } from "@google/genai";
import { FinancialData, AnalysisResult, ChatMessage } from "../types";
import { SYSTEM_PROMPT } from "../constants";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeLiquidity = async (data: FinancialData): Promise<AnalysisResult> => {
  const ai = getAIClient();
  
  const prompt = `
    Analyze the following SME financial situation:
    - Current Balance: ${data.currentBalance}
    - Avg Daily Revenue: ${data.avgDailyRevenue}
    - Fixed Monthly Expenses: ${data.fixedExpenses}
    - Outstanding Debt: ${data.outstandingDebt}
    - Receivables: ${data.receivables}
    - Forecast Horizon: ${data.forecastDays} days
    
    Predict liquidity risk and provide actionable recommendations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["GREEN", "YELLOW", "RED"] },
            riskSummary: { type: Type.STRING },
            timeToShortage: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.NUMBER }
          },
          required: ["riskLevel", "riskSummary", "timeToShortage", "recommendations", "confidence"]
        }
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as AnalysisResult;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      riskLevel: data.currentBalance < 0 ? "RED" : "YELLOW" as any,
      riskSummary: "Unable to process AI analysis. Showing simplified forecast.",
      timeToShortage: "Analysis Error",
      recommendations: ["Manually check daily ledger", "Verify large upcoming payments"],
      confidence: 0
    };
  }
};

export const getAdvisorResponse = async (
  history: ChatMessage[], 
  financialContext: FinancialData,
  analysisResult: AnalysisResult | null
): Promise<string> => {
  const ai = getAIClient();
  
  const contextText = `
    Current context for the advisor:
    - Balance: $${financialContext.currentBalance}
    - Daily Revenue: $${financialContext.avgDailyRevenue}
    - Monthly Expenses: $${financialContext.fixedExpenses}
    - Risk Level: ${analysisResult?.riskLevel || 'Unknown'}
    - Risk Summary: ${analysisResult?.riskSummary || 'N/A'}
  `;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are the Clear Finance AI Advisor. You are talking to an SME owner. Use the provided financial context to give helpful, professional, and encouraging advice. Be concise. ${contextText}`,
    },
  });

  try {
    const lastMessage = history[history.length - 1].content;
    const response = await chat.sendMessage({ message: lastMessage });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Advisor failed:", error);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
};
