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
  estimatedCost: number;
  actualCost?: number;
  status: "planned" | "paid" | "cancelled";
  vendor?: string;
  notes?: string;
  dueDate?: string;
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
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  category: string;
  attendees?: string[];
  status: "planned" | "confirmed" | "completed" | "cancelled";
}

export interface AppData {
  guests: Guest[];
  budget: BudgetItem[];
  checklist: ChecklistItem[];
  timeline: TimelineEvent[];
}

export type { AppData };