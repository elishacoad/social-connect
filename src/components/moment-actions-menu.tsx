import { HugeiconsIcon } from '@hugeicons/react-native';
import { Delete02Icon, MoreHorizontalIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/use-theme-colors';

// Own-post overflow menu, shared between the feed card and the moment
// detail screen so "edit caption" / "delete" only exist in one place.
export function MomentActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        hitSlop={10}
        onPress={() => setOpen(true)}
        className="size-8 items-center justify-center rounded-full active:bg-accent">
        <HugeiconsIcon icon={MoreHorizontalIcon} color={colors.mutedForeground} size={22} strokeWidth={2.5} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <SafeAreaView edges={['bottom']}>
            <Pressable className="mx-3 gap-1 rounded-2xl bg-card p-1.5 shadow-sm shadow-black/10">
              <Pressable
                onPress={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="flex-row items-center gap-3 rounded-xl px-4 py-3 active:bg-accent">
                <HugeiconsIcon icon={PencilEdit02Icon} color={colors.mutedForeground} size={20} />
                <Text className="text-base">Edit caption</Text>
              </Pressable>
              <View className="h-px bg-border" />
              <Pressable
                onPress={() => {
                  setOpen(false);
                  onDelete();
                }}
                className="flex-row items-center gap-3 rounded-xl px-4 py-3 active:bg-accent">
                <HugeiconsIcon icon={Delete02Icon} color={colors.destructive} size={20} />
                <Text className="text-base text-red-500">Delete moment</Text>
              </Pressable>
            </Pressable>
            <Pressable
              onPress={() => setOpen(false)}
              className="mx-3 mt-2 items-center rounded-2xl bg-card p-3.5 shadow-sm shadow-black/10 active:bg-accent">
              <Text className="text-base font-semibold">Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
}
