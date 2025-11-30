import { supabase } from '../lib/supabase';

export interface BetTicket {
  id: string;
  bet_id: string;
  user_id: string;
  reason: string;
  custom_reason?: string;
  description?: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  admin_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketData {
  bet_id: string;
  user_id: string;
  reason: string;
  custom_reason?: string;
  description?: string;
}

export class TicketService {
  
  /**
   * Submit a new ticket for a bet issue
   */
  static async submitTicket(ticketData: CreateTicketData): Promise<BetTicket | null> {
    try {
      const { data, error } = await supabase
        .from('bet_tickets')
        .insert([{
          ...ticketData,
          status: 'open'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error submitting ticket:', error);
        throw error;
      }

      return data as BetTicket;
    } catch (error) {
      console.error('Error in submitTicket:', error);
      throw error;
    }
  }

  /**
   * Get all tickets for a user
   */
  static async getUserTickets(userId: string): Promise<BetTicket[]> {
    try {
      const { data, error } = await supabase
        .from('bet_tickets')
        .select(`
          *,
          bets (
            id,
            bet_description,
            sportsbook,
            stake,
            status,
            placed_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tickets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserTickets:', error);
      throw error;
    }
  }

  /**
   * Get tickets for a specific bet
   */
  static async getBetTickets(betId: string, userId: string): Promise<BetTicket[]> {
    try {
      const { data, error } = await supabase
        .from('bet_tickets')
        .select('*')
        .eq('bet_id', betId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bet tickets:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBetTickets:', error);
      throw error;
    }
  }

  /**
   * Update ticket description (only for open tickets)
   */
  static async updateTicketDescription(
    ticketId: string, 
    description: string
  ): Promise<BetTicket | null> {
    try {
      const { data, error } = await supabase
        .from('bet_tickets')
        .update({ description })
        .eq('id', ticketId)
        .eq('status', 'open')
        .select()
        .single();

      if (error) {
        console.error('Error updating ticket:', error);
        throw error;
      }

      return data as BetTicket;
    } catch (error) {
      console.error('Error in updateTicketDescription:', error);
      throw error;
    }
  }

  /**
   * Check if a bet already has an open ticket
   */
  static async hasOpenTicket(betId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('bet_tickets')
        .select('id')
        .eq('bet_id', betId)
        .eq('user_id', userId)
        .eq('status', 'open')
        .limit(1);

      if (error) {
        console.error('Error checking for open ticket:', error);
        return false;
      }

      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Error in hasOpenTicket:', error);
      return false;
    }
  }

  /**
   * Get the formatted reason text for display
   */
  static getReasonText(ticket: BetTicket): string {
    if (ticket.reason === 'Other' && ticket.custom_reason) {
      return ticket.custom_reason;
    }
    return ticket.reason;
  }

  /**
   * Get status color for UI display
   */
  static getStatusColor(status: BetTicket['status']): string {
    switch (status) {
      case 'open':
        return '#007AFF'; // Blue
      case 'in_review':
        return '#FF9500'; // Orange
      case 'resolved':
        return '#34C759'; // Green
      case 'closed':
        return '#8E8E93'; // Gray
      default:
        return '#8E8E93';
    }
  }

  /**
   * Get status display text
   */
  static getStatusText(status: BetTicket['status']): string {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_review':
        return 'Under Review';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  }
}

// Preset reasons for ticket submission
export const TICKET_REASONS = [
  'Bet not settled within 24 hours of game completing',
  'Bet settled incorrectly', 
  'Bet information error',
  'Other'
] as const;

export type TicketReason = typeof TICKET_REASONS[number];