import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { Family, FamilyMember, FamilyInvite, InvitePreview } from '@/types';

const INVITE_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const INVITE_EXPIRY_DAYS = 7;
const MAX_FAMILY_MEMBERS = 4;

function generateInviteCode(): string {
  const bytes = Crypto.getRandomBytes(INVITE_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += INVITE_CODE_CHARS.charAt(bytes[i] % INVITE_CODE_CHARS.length);
  }
  return code;
}

export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function normalizeInviteCode(input: string): string {
  return input.replace(/[-\s]/g, '').toUpperCase();
}

export const familyService = {
  async getFamily(): Promise<(Family & { members: FamilyMember[] }) | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the user's family membership
    const { data: membership, error: memberError } = await supabase
      .from('family_members')
      .select('family_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (memberError) throw memberError;
    if (!membership) return null;

    // Get the family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('id', membership.family_id)
      .single();
    if (familyError) throw familyError;

    // Get members with email and display_name from users table
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*, users(email, display_name)')
      .eq('family_id', membership.family_id)
      .order('joined_at', { ascending: true });
    if (membersError) throw membersError;

    const enrichedMembers: FamilyMember[] = (members ?? []).map((m: any) => ({
      id: m.id,
      family_id: m.family_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      email: m.users?.email,
      display_name: m.users?.display_name,
    }));

    return { ...family, members: enrichedMembers };
  },

  async updateFamilyName(familyId: string, name: string): Promise<void> {
    const { error } = await supabase
      .from('families')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', familyId);
    if (error) throw error;
  },

  async createInvite(familyId: string): Promise<FamilyInvite> {
    // Check family member count
    const { data: members, error: countError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId);
    if (countError) throw countError;
    if ((members?.length ?? 0) >= MAX_FAMILY_MEMBERS) {
      throw new Error('Family already has the maximum number of members');
    }

    // Revoke any existing active invite
    const existing = await familyService.getActiveInvite(familyId);
    if (existing) {
      await familyService.revokeInvite(existing.id);
    }

    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('family_invites')
      .insert({
        family_id: familyId,
        invite_code: inviteCode,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async revokeInvite(inviteId: string): Promise<void> {
    const { error } = await supabase
      .from('family_invites')
      .delete()
      .eq('id', inviteId);
    if (error) throw error;
  },

  async getActiveInvite(familyId: string): Promise<FamilyInvite | null> {
    const { data, error } = await supabase
      .from('family_invites')
      .select('*')
      .eq('family_id', familyId)
      .is('accepted_by', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async previewInvite(code: string): Promise<InvitePreview> {
    const normalizedCode = normalizeInviteCode(code);

    const { data, error } = await supabase.rpc('preview_invite', {
      code: normalizedCode,
    });
    if (error) throw new Error('Invalid or expired invite code');

    return {
      family_name: data.family_name,
      expires_at: data.expires_at,
    };
  },

  async acceptInvite(code: string): Promise<void> {
    const normalizedCode = normalizeInviteCode(code);
    const { error } = await supabase.rpc('accept_invite', {
      invite_code: normalizedCode,
    });
    if (error) throw error;
  },

  async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);
    if (error) throw error;
  },

  async leaveFamily(): Promise<void> {
    const { error } = await supabase.rpc('leave_family');
    if (error) throw error;
  },

  async getMyRole(): Promise<'admin' | 'member'> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('family_members')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (error) throw error;
    return data.role;
  },
};
