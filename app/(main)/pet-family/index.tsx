import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useFamilyStore } from '@/stores/familyStore';
import { petService } from '@/services/petService';
import { userService } from '@/services/userService';
import { familyService, formatInviteCode } from '@/services/familyService';
import { Colors } from '@/constants/colors';
import { formatDistanceToNow } from '@/utils/dates';
import { Pet, FamilyInvite } from '@/types';

export default function PetFamilyScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const [activePets, setActivePets] = useState<Pet[]>([]);
  const [archivedPets, setArchivedPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Display name (used to render member list correctly when row is "me")
  const [displayName, setDisplayName] = useState('');

  // Family state
  const family = useFamilyStore((s) => s.family);
  const members = useFamilyStore((s) => s.members);
  const myRole = useFamilyStore((s) => s.myRole);
  const familyLoading = useFamilyStore((s) => s.loading);
  const loadFamily = useFamilyStore((s) => s.loadFamily);
  const [activeInvite, setActiveInvite] = useState<FamilyInvite | null>(null);
  const [editingFamilyName, setEditingFamilyName] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [savingFamilyName, setSavingFamilyName] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [leavingFamily, setLeavingFamily] = useState(false);
  const [revokingInvite, setRevokingInvite] = useState(false);

  // Confirmation modal state — one bag of state covering remove, leave, revoke.
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showLeaveFamily, setShowLeaveFamily] = useState(false);
  const [showRevokeInvite, setShowRevokeInvite] = useState(false);

  const { show: showToast } = useToast();

  const userId = session?.user.id;
  const email = session?.user.email ?? '';
  const isAdmin = myRole === 'admin';

  const loadPets = useCallback(async () => {
    try {
      setLoadingPets(true);
      const [active, archived] = await Promise.all([
        petService.getAll(),
        petService.getArchived(),
      ]);
      setActivePets(active);
      setArchivedPets(archived);
    } catch {
      // Silently handle — pets will show empty
    } finally {
      setLoadingPets(false);
    }
  }, []);

  const loadActiveInvite = useCallback(async () => {
    if (!family || myRole !== 'admin') return;
    try {
      const invite = await familyService.getActiveInvite(family.id);
      setActiveInvite(invite);
    } catch {
      // Silently handle
    }
  }, [family, myRole]);

  const loadDisplayName = useCallback(async () => {
    if (!userId) return;
    try {
      const profile = await userService.getProfile(userId);
      setDisplayName(profile.display_name ?? '');
    } catch {
      // Silently handle
    }
  }, [userId]);

  useEffect(() => {
    loadPets();
    loadFamily();
    loadDisplayName();
  }, [loadPets, loadFamily, loadDisplayName]);

  useEffect(() => {
    loadActiveInvite();
  }, [loadActiveInvite]);

  const handleSaveFamilyName = async () => {
    if (!family || !familyNameInput.trim()) return;
    setSavingFamilyName(true);
    try {
      await familyService.updateFamilyName(family.id, familyNameInput.trim());
      await loadFamily();
      setEditingFamilyName(false);
    } catch {
      Alert.alert('Error', 'Failed to update family name.');
    } finally {
      setSavingFamilyName(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setRemoveMemberTarget({ id: memberId, name: memberName });
  };

  const handleConfirmRemoveMember = async () => {
    if (!removeMemberTarget) return;
    const { id: memberId } = removeMemberTarget;
    try {
      setRemovingMemberId(memberId);
      await familyService.removeMember(memberId);
      await loadFamily();
      await loadActiveInvite();
    } catch {
      Alert.alert('Error', 'Failed to remove member.');
    } finally {
      setRemovingMemberId(null);
      setRemoveMemberTarget(null);
    }
  };

  const handleLeaveFamily = () => {
    setShowLeaveFamily(true);
  };

  const handleConfirmLeaveFamily = async () => {
    try {
      setLeavingFamily(true);
      await familyService.leaveFamily();
      await loadFamily();
      await loadPets();
      setShowLeaveFamily(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to leave family';
      Alert.alert('Error', message);
    } finally {
      setLeavingFamily(false);
    }
  };

  const handleRevokeInvite = () => {
    if (!activeInvite) return;
    setShowRevokeInvite(true);
  };

  const handleConfirmRevokeInvite = async () => {
    if (!activeInvite) return;
    try {
      setRevokingInvite(true);
      await familyService.revokeInvite(activeInvite.id);
      setActiveInvite(null);
      setShowRevokeInvite(false);
    } catch {
      Alert.alert('Error', 'Failed to revoke invite.');
    } finally {
      setRevokingInvite(false);
    }
  };

  // Restore is not destructive — instant action with a toast on success.
  // No confirmation modal.
  const handleRestore = async (pet: Pet) => {
    try {
      setRestoringId(pet.id);
      await petService.restore(pet.id);
      await loadPets();
      showToast(`${pet.name} restored`);
    } catch {
      Alert.alert('Error', 'Failed to restore pet. Please try again.');
    } finally {
      setRestoringId(null);
    }
  };

  const renderSection = (title: string) => (
    <Text className="text-text-secondary text-eyebrow uppercase mb-2 ml-1 mt-6">
      {title}
    </Text>
  );

  return (
    <Screen scroll>
      <View className="px-6 pt-4 pb-8">
        {/* Header */}
        <View className="flex-row items-center mb-2">
          <Pressable onPress={() => router.back()} hitSlop={8} className="mr-3" testID="back-button">
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text className="text-largeTitle text-text-primary">
            Pet Family
          </Text>
        </View>

        {/* Family Section */}
        {renderSection('Family')}
        {familyLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : family ? (
          <Card className="p-4">
            {/* Family Name */}
            {editingFamilyName ? (
              <View className="mb-3">
                <TextInput
                  label="Family Name"
                  value={familyNameInput}
                  onChangeText={setFamilyNameInput}
                  autoFocus
                />
                <View className="flex-row gap-3 mt-2">
                  <View className="flex-1">
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={() => setEditingFamilyName(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <Button
                      title="Save"
                      onPress={handleSaveFamilyName}
                      loading={savingFamilyName}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-text-primary text-headline">
                  {family.name}
                </Text>
                {isAdmin && (
                  <Pressable
                    onPress={() => {
                      setFamilyNameInput(family.name);
                      setEditingFamilyName(true);
                    }}
                    hitSlop={8}
                    testID="edit-family-name-button"
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </Pressable>
                )}
              </View>
            )}

            {/* Member List */}
            {members.map((member) => {
              const isMe = member.user_id === userId;
              const memberDisplayName = isMe
                ? displayName || email
                : member.display_name || 'No name set';
              const nameWithYou = isMe
                ? `${memberDisplayName} (You)`
                : memberDisplayName;
              const roleLabel =
                member.role === 'admin' ? 'Admin' : 'Member';
              const joinedLabel = member.joined_at
                ? `Joined ${formatDistanceToNow(member.joined_at)}`
                : '';

              return (
                <View
                  key={member.id}
                  className="flex-row items-center py-3 border-t border-border"
                >
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <View className="ml-2 flex-1">
                    <Text
                      className="text-text-primary text-body font-medium"
                      numberOfLines={1}
                    >
                      {nameWithYou}
                    </Text>
                    <Text className="text-text-secondary text-footnote">
                      {roleLabel}{joinedLabel ? ` · ${joinedLabel}` : ''}
                    </Text>
                  </View>
                  {isAdmin && !isMe && (
                    <Pressable
                      onPress={() =>
                        handleRemoveMember(
                          member.id,
                          member.display_name || 'this member',
                        )
                      }
                      disabled={removingMemberId === member.id}
                      hitSlop={8}
                      testID={`remove-member-${member.id}`}
                    >
                      {removingMemberId === member.id ? (
                        <ActivityIndicator size="small" color={Colors.statusOverdue} />
                      ) : (
                        <Ionicons
                          name="close-circle-outline"
                          size={20}
                          color={Colors.statusOverdue}
                        />
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })}

            {/* Active Invite Display */}
            {isAdmin && activeInvite && (
              <View className="flex-row items-center justify-between mt-3 bg-input-fill rounded-xl px-3 py-2">
                <View className="flex-1">
                  <Text className="text-text-secondary text-caption">Active invite</Text>
                  <Text className="text-text-primary text-headline">
                    {formatInviteCode(activeInvite.invite_code)}
                  </Text>
                  <Text className="text-text-secondary text-caption">
                    Expires {new Date(activeInvite.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Pressable
                  onPress={handleRevokeInvite}
                  disabled={revokingInvite}
                  hitSlop={8}
                  testID="revoke-invite-button"
                >
                  {revokingInvite ? (
                    <ActivityIndicator size="small" color={Colors.statusOverdue} />
                  ) : (
                    <Ionicons
                      name="close-circle-outline"
                      size={20}
                      color={Colors.statusOverdue}
                    />
                  )}
                </Pressable>
              </View>
            )}

            {/* Contextual action buttons */}
            {isAdmin && members.length === 1 && (
              /* Solo admin: show Invite + Join side by side */
              <View className="flex-row gap-3 mt-3">
                <View className="flex-1">
                  <Button
                    title="Invite Member"
                    onPress={() => router.push('/(main)/pet-family/invite-member')}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Join a Family"
                    variant="secondary"
                    onPress={() => router.push('/(main)/pet-family/join-family')}
                  />
                </View>
              </View>
            )}

            {isAdmin && members.length > 1 && (
              /* Admin with members: Invite only */
              <View className="mt-3">
                <Button
                  title="Invite Member"
                  variant="secondary"
                  onPress={() => router.push('/(main)/pet-family/invite-member')}
                  disabled={members.length >= 4}
                />
              </View>
            )}

            {!isAdmin && (
              /* Member: Leave Family */
              <View className="mt-3">
                <Button
                  title="Leave Family"
                  variant="secondary"
                  onPress={handleLeaveFamily}
                  loading={leavingFamily}
                />
              </View>
            )}
          </Card>
        ) : null}

        {/* Pets Section */}
        {renderSection('Pets')}
        {loadingPets ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          <>
            {activePets.length === 0 ? (
              <Card className="p-4 items-center">
                <Text className="text-text-secondary text-body">
                  No active pets yet
                </Text>
              </Card>
            ) : (
              activePets.map((pet) => (
                <Card
                  key={pet.id}
                  onPress={() =>
                    router.push(`/(main)/pets/${pet.id}/edit`)
                  }
                  className="p-4 mb-2"
                >
                  <View className="flex-row items-center">
                    <Avatar
                      uri={pet.profile_photo_url}
                      name={pet.name}
                      size="sm"
                      petType={pet.pet_type}
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-text-primary text-headline">
                        {pet.name}
                      </Text>
                      <Text className="text-text-secondary text-footnote">
                        {pet.breed ?? 'Mixed / Unknown'}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </View>
                </Card>
              ))
            )}

            {/* Archived Pets */}
            {archivedPets.length > 0 && (
              <>
                {renderSection('Archived Pets')}
                {archivedPets.map((pet) => (
                  <Card key={pet.id} className="p-4 mb-2">
                    <View className="flex-row items-center">
                      <Avatar
                        uri={pet.profile_photo_url}
                        name={pet.name}
                        size="sm"
                        petType={pet.pet_type}
                      />
                      <View className="ml-3 flex-1">
                        <Text className="text-text-primary text-headline opacity-60">
                          {pet.name}
                        </Text>
                        <Text className="text-text-secondary text-footnote opacity-60">
                          {pet.breed ?? 'Mixed / Unknown'}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleRestore(pet)}
                        disabled={restoringId === pet.id}
                        hitSlop={8}
                        testID={`restore-${pet.id}`}
                      >
                        {restoringId === pet.id ? (
                          <ActivityIndicator
                            size="small"
                            color={Colors.primary}
                          />
                        ) : (
                          <Text className="text-primary text-button-sm">
                            Restore
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* Add pet CTA */}
            <Pressable
              onPress={() => router.push('/(main)/pets/add')}
              testID="add-pet-button"
              className="mt-3"
            >
              <Card className="p-4 items-center border border-dashed border-border">
                <Ionicons name="add" size={24} color={Colors.textSecondary} />
                <Text className="text-text-secondary text-button-sm mt-1">
                  Add a pet
                </Text>
              </Card>
            </Pressable>
          </>
        )}
      </View>

      <ConfirmationModal
        visible={removeMemberTarget !== null}
        title="Remove member?"
        message={
          removeMemberTarget
            ? `${removeMemberTarget.name} will lose access to this family's pets and records.`
            : ''
        }
        confirmLabel="Remove"
        severity="destructive"
        onConfirm={handleConfirmRemoveMember}
        onCancel={() => setRemoveMemberTarget(null)}
        loading={removingMemberId !== null}
      />

      <ConfirmationModal
        visible={showLeaveFamily}
        title="Leave family?"
        message="You'll lose access to this family's pets and records. Your pets will stay with the family."
        confirmLabel="Leave family"
        severity="destructive"
        onConfirm={handleConfirmLeaveFamily}
        onCancel={() => setShowLeaveFamily(false)}
        loading={leavingFamily}
      />

      <ConfirmationModal
        visible={showRevokeInvite}
        title="Revoke invite?"
        message="The current invite code will stop working. You can generate a new one anytime."
        confirmLabel="Revoke"
        severity="standard"
        onConfirm={handleConfirmRevokeInvite}
        onCancel={() => setShowRevokeInvite(false)}
        loading={revokingInvite}
      />
    </Screen>
  );
}
