
export interface FinancialData {
  currentBalance: number;
  avgDailyRevenue: number;
  fixedExpenses: number;
  outstandingDebt: number;
  receivables: number;
  forecastDays: number;
}

export interface ForecastPoint {
  day: number;
  date: string;
  balance: number;
}

export enum RiskLevel {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export interface AnalysisResult {
  riskLevel: RiskLevel;
  riskSummary: string;
  timeToShortage: string;
  recommendations: string[];
  confidence: number;
}

export interface LiquidityOffer {
  id: string;
  businessType: string;
  amount: number;
  duration: number; // in days
  rate?: number;
  type: 'EXCESS' | 'NEED';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
