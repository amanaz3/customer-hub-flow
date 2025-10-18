import { supabase } from '@/lib/supabase';
import { Comment } from '@/types/customer';

export class CommentService {
  /**
   * Parse comment content to detect status change requests
   * Format: [STATUS REQUEST: {status}] {user's reason}
   */
  private static parseStatusRequest(content: string): { isRequest: boolean; status?: string; message?: string } {
    const statusRequestPattern = /^\[STATUS REQUEST: (.+?)\]\s*(.*)$/;
    const match = content.match(statusRequestPattern);
    
    if (match) {
      return {
        isRequest: true,
        status: match[1].trim(),
        message: match[2].trim()
      };
    }
    
    return { isRequest: false };
  }

  /**
   * Format a status request comment
   */
  static formatStatusRequestComment(status: string, reason: string): string {
    return `[STATUS REQUEST: ${status}] ${reason}`;
  }

  /**
   * Add a new comment to a customer
   */
  static async addComment(
    customerId: string,
    content: string,
    createdBy: string,
    requestedStatus?: string
  ): Promise<void> {
    console.log('Adding comment:', { customerId, content, createdBy, requestedStatus });

    // If this is a status request, format the comment
    const commentContent = requestedStatus 
      ? this.formatStatusRequestComment(requestedStatus, content)
      : content;

    const { error } = await supabase
      .from('comments')
      .insert({
        customer_id: customerId,
        comment: commentContent,
        created_by: createdBy,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    console.log('Comment added successfully');
  }

  /**
   * Get all comments for a customer with proper field mapping
   */
  static async getCommentsByCustomerId(customerId: string): Promise<Comment[]> {
    console.log('Fetching comments for customer:', customerId);

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        customer_id,
        comment,
        created_by,
        created_at,
        profiles:created_by (
          name
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }

    // Map database fields to Comment interface and detect status requests
    return (comments || []).map(comment => {
      const parsed = this.parseStatusRequest(comment.comment);
      const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
      
      return {
        id: comment.id,
        customer_id: comment.customer_id,
        content: comment.comment,
        author: profile?.name || 'Unknown User',
        timestamp: comment.created_at,
        created_by_id: comment.created_by,
        is_status_request: parsed.isRequest,
        requested_status: parsed.status
      };
    });
  }

  /**
   * Check if a comment is a status request
   */
  static isStatusRequest(content: string): boolean {
    return this.parseStatusRequest(content).isRequest;
  }

  /**
   * Extract requested status from a status request comment
   */
  static extractRequestedStatus(content: string): string | null {
    const parsed = this.parseStatusRequest(content);
    return parsed.status || null;
  }
}
