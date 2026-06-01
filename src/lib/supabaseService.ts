import { supabase } from './supabaseClient';
import type {
  AppData, AppSettings, Transaction, BudgetItem,
  ChecklistCategory, ChecklistItem, EngagementItem,
  SeserahanItem, SavingsDeposit, TimelineEvent, Invitation
} from '../type';

// ===================== SETTINGS =====================
export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('wedding_plan_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSettings(updates: Partial<AppSettings>) {
  const { error } = await supabase
    .from('wedding_plan_settings')
    .update(updates)
    .eq('id', 1);
  if (error) throw error;
}

// ===================== TRANSACTIONS =====================
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('wedding_plan_transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addTransaction(trx: Omit<Transaction, 'id'>) {
  const { error } = await supabase
    .from('wedding_plan_transactions')
    .insert([{ ...trx }]);
  if (error) throw error;
}

// ===================== BUDGETS =====================
export async function getBudgets(): Promise<BudgetItem[]> {
  const { data, error } = await supabase
    .from('wedding_plan_budgets')
    .select('*')
    .order('category');
  if (error) throw error;
  return data;
}

export async function addBudget(item: Omit<BudgetItem, 'id'>) {
  const { error } = await supabase
    .from('wedding_plan_budgets')
    .insert([{ ...item }]);
  if (error) throw error;
}

export async function updateBudget(id: string, updates: Partial<BudgetItem>) {
  const { error } = await supabase
    .from('wedding_plan_budgets')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteBudget(id: string) {
  const { error } = await supabase
    .from('wedding_plan_budgets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===================== TIMELINE =====================
export async function getTimeline(): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('wedding_plan_timeline')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function addTimelineEvent(event: Omit<TimelineEvent, 'id'>) {
  const { error } = await supabase
    .from('wedding_plan_timeline')
    .insert([{ ...event }]);
  if (error) throw error;
}

export async function updateTimelineEvent(id: string, updates: Partial<TimelineEvent>) {
  const { error } = await supabase
    .from('wedding_plan_timeline')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTimelineEvent(id: string) {
  const { error } = await supabase
    .from('wedding_plan_timeline')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===================== CHECKLIST =====================
export async function getChecklistCategories(): Promise<ChecklistCategory[]> {
  const { data, error } = await supabase
    .from('wedding_plan_checklist_categories')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function addChecklistCategory(name: string) {
  const { data, error } = await supabase
    .from('wedding_plan_checklist_categories')
    .insert([{ name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChecklistCategory(id: string) {
  const { error } = await supabase
    .from('wedding_plan_checklist_categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getChecklistItems(): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('wedding_plan_checklist_items')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return data;
}

export async function addChecklistItem(item: Omit<ChecklistItem, 'id'>) {
  const { data, error } = await supabase
    .from('wedding_plan_checklist_items')
    .insert([{ ...item }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChecklistItem(id: string, updates: Partial<ChecklistItem>) {
  const { error } = await supabase
    .from('wedding_plan_checklist_items')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteChecklistItem(id: string) {
  const { error } = await supabase
    .from('wedding_plan_checklist_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function toggleChecklistItem(id: string, completed: boolean) {
  const { error } = await supabase
    .from('wedding_plan_checklist_items')
    .update({ completed })
    .eq('id', id);
  if (error) throw error;
}

// ===================== ENGAGEMENT =====================
export async function getEngagementItems(): Promise<EngagementItem[]> {
  const { data, error } = await supabase
    .from('wedding_plan_engagement_items')
    .select('*')
    .order('category');
  if (error) throw error;
  return data;
}

export async function addEngagementItem(item: Omit<EngagementItem, 'id'>) {
  const { data, error } = await supabase
    .from('wedding_plan_engagement_items')
    .insert([{ ...item }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEngagementItem(id: string, updates: Partial<EngagementItem>) {
  const { error } = await supabase
    .from('wedding_plan_engagement_items')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteEngagementItem(id: string) {
  const { error } = await supabase
    .from('wedding_plan_engagement_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===================== SESERAHAN =====================
export async function getSeserahanItems(): Promise<SeserahanItem[]> {
  const { data, error } = await supabase
    .from('wedding_plan_seserahan_items')
    .select('*')
    .order('category');
  if (error) throw error;
  return data;
}

export async function addSeserahanItem(item: Omit<SeserahanItem, 'id'>) {
  const { data, error } = await supabase
    .from('wedding_plan_seserahan_items')
    .insert([{ ...item }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSeserahanItem(id: string, updates: Partial<SeserahanItem>) {
  const { error } = await supabase
    .from('wedding_plan_seserahan_items')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSeserahanItem(id: string) {
  const { error } = await supabase
    .from('wedding_plan_seserahan_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===================== SAVINGS =====================
export async function getSavingsDeposits(): Promise<SavingsDeposit[]> {
  const { data, error } = await supabase
    .from('wedding_plan_savings_deposits')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addSavingsDeposit(deposit: Omit<SavingsDeposit, 'id'>) {
  const { error } = await supabase
    .from('wedding_plan_savings_deposits')
    .insert([{ ...deposit }]);
  if (error) throw error;
}

// ===================== INVITATIONS =====================
export async function getInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('wedding_plan_invitations')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function addInvitation(item: Omit<Invitation, 'id'>) {
  const { data, error } = await supabase
    .from('wedding_plan_invitations')
    .insert([{ ...item }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInvitation(id: string, updates: Partial<Invitation>) {
  const { error } = await supabase
    .from('wedding_plan_invitations')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteInvitation(id: string) {
  const { error } = await supabase
    .from('wedding_plan_invitations')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ===================== FETCH ALL =====================
export async function fetchAllData(): Promise<AppData> {
  const [settings, transactions, budgets, timeline, checklistCategories, checklistItems, engagementItems, seserahanItems, savingsDeposits, invitations] = await Promise.all([
    getSettings(),
    getTransactions(),
    getBudgets(),
    getTimeline(),
    getChecklistCategories(),
    getChecklistItems(),
    getEngagementItems(),
    getSeserahanItems(),
    getSavingsDeposits(),
    getInvitations(),
  ]);
  return { settings, transactions, budgets, timeline, checklistCategories, checklistItems, engagementItems, seserahanItems, savingsDeposits, invitations };
}
