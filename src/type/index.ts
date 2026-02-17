export type Transaction = {
  id: number;
  date: string;
  type: 'income' | 'expense';
  desc: string;
  amount: number;
  category: string;
};

export type Budget = {
  item: string;
  plan: number;
  paid: number;
};

export type TimelineItem = {
  task: string;
  deadline: string;
  status: 'Done' | 'Pending';
  category: string;
};

export type AppData = {
  target: number;
  weddingDate: string;
  transactions: Transaction[];
  budgets: Budget[];
  timeline: TimelineItem[];
};