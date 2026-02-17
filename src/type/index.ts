export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: "confirmed" | "pending" | "declined";
  category: "family" | "friend" | "colleague" | "other";
  plusOne?: boolean;
  dietaryRestrictions?: string;
  specialRequests?: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  item: string;
  plan: number;
  paid: number;
  status: "planned" | "paid" | "cancelled";
  vendor?: string;
  notes?: string;
  dueDate?: string;
  desc?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  category: string;
  assignedTo?: string;
}

export interface TimelineEvent {
  id: string;
  task: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  category: string;
  attendees?: string[];
  status: "planned" | "confirmed" | "completed" | "cancelled" | "Done" | "Pending";
  deadline?: string;
}

export interface Transaction {
  id: string;
  date: string;
  desc: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

export interface AppData {
  target: number;
  weddingDate: string;
  transactions: Transaction[];
  budgets: BudgetItem[];
  timeline: TimelineEvent[];
}

export interface AppData {
  target: number;
  weddingDate: string;
  transactions: Transaction[];
  budgets: BudgetItem[];
  timeline: TimelineEvent[];
}

