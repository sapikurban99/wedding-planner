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
  party: "pria" | "wanita" | "joint";
  vendor?: string;
  notes?: string;
  dueDate?: string;
  desc?: string;
}

export interface ChecklistCategory {
  id: string;
  name: string;
  sort_order: number;
}

export interface ChecklistItem {
  id: string;
  category_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date?: string | null;
  assigned_to: "pria" | "wanita" | "joint";
  sort_order: number;
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

export interface EngagementItem {
  id: string;
  item: string;
  category: string;
  budget_amount: number;
  actual_amount: number;
  party: "pria" | "wanita" | "joint";
  status: "planned" | "ordered" | "done" | "cancelled";
  notes?: string;
}

export interface SeserahanItem {
  id: string;
  item: string;
  category: string;
  budget_amount: number;
  actual_amount: number;
  party: "pria" | "wanita" | "joint";
  status: "planned" | "ordered" | "done" | "cancelled";
  notes?: string;
}

export interface SavingsDeposit {
  id: string;
  amount: number;
  deposited_by: "pria" | "wanita" | "joint";
  notes?: string;
  date: string;
}

export interface Invitation {
  id: string;
  name: string;
  pax: number;
  party: "pria" | "wanita";
  category?: string;
  notes?: string;
  invited: boolean;
  type?: "wedding" | "engagement";
  guest_names?: string[];
}

export interface AppSettings {
  id: number;
  target_amount: number;
  wedding_date: string | null;
  couple_name: string;
  groom_quota: number;
  bride_quota: number;
  lamaran_groom_quota?: number;
  lamaran_bride_quota?: number;
}

export type PartyFilter = "pria" | "wanita" | "joint";
export type StatusLabel = "planned" | "ordered" | "done" | "cancelled";

export interface AppData {
  settings: AppSettings;
  transactions: Transaction[];
  budgets: BudgetItem[];
  timeline: TimelineEvent[];
  checklistCategories: ChecklistCategory[];
  checklistItems: ChecklistItem[];
  engagementItems: EngagementItem[];
  seserahanItems: SeserahanItem[];
  savingsDeposits: SavingsDeposit[];
  invitations: Invitation[];
}
