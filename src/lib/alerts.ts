import { Alert } from 'react-native';

import { errorMessage } from '@/lib/errors';

type ConfirmDestructiveOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  failureTitle?: string;
  failureMessage?: string;
};

// Wraps the confirm-then-act pattern so a failed action always surfaces
// rather than rejecting into an unhandled promise inside Alert's callback.
export function confirmDestructive({
  title,
  message = "This can't be undone.",
  confirmLabel = 'Delete',
  onConfirm,
  failureTitle = 'Something went wrong',
  failureMessage,
}: ConfirmDestructiveOptions) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: () => {
        Promise.resolve()
          .then(onConfirm)
          .catch((err) => {
            Alert.alert(failureTitle, failureMessage ?? errorMessage(err, 'Please try again.'));
          });
      },
    },
  ]);
}
