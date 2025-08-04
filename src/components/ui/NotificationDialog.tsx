'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useTranslation } from 'react-i18next';

export type NotificationType = 'success' | 'error' | 'info' | 'confirm' | 'custom';

export interface NotificationDialogProps {
  open: boolean;
  type: NotificationType;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm?: () => void;
  children?: React.ReactNode;
}

export default function NotificationDialog({
  open,
  type,
  title,
  description,
  onClose,
  onConfirm,
  children,
}: NotificationDialogProps) {
  const { t } = useTranslation('common');

  const renderIcon = () => {
    const baseClass = 'w-8 h-8 animate-pop shrink-0';
    switch (type) {
      case 'success':
        return <CheckCircle className={cn(baseClass, 'text-green-500')} />;
      case 'error':
        return <AlertCircle className={cn(baseClass, 'text-red-500')} />;
      case 'info':
        return <Info className={cn(baseClass, 'text-blue-500')} />;
      case 'confirm':
        return <Trash2 className={cn(baseClass, 'text-orange-500')} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'w-full max-w-md rounded-2xl px-6 py-8',
          'space-y-6 transition-none duration-0 data-[state=open]:animate-none'
        )}
      >
        <DialogHeader className="flex flex-col items-center text-center gap-3 mb-2">
          {type !== 'custom' && renderIcon()}
          <DialogTitle className="text-lg sm:text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {type === 'custom' ? (
          <div className="space-y-4 text-sm text-gray-700">{children}</div>
        ) : (
          <>
            {description && (
              <DialogDescription className="text-gray-600">
                {description}
              </DialogDescription>
            )}

            <DialogFooter className="flex justify-end gap-3 mt-6">
              {type === 'confirm' ? (
                <>
                  <Button variant="ghost" onClick={onClose}>
                    {t('notification_dialog.cancel')}
                  </Button>
                  <Button variant="destructive" onClick={onConfirm}>
                    {t('notification_dialog.confirm')}
                  </Button>
                </>
              ) : (
                <Button onClick={onClose}>{t('notification_dialog.ok')}</Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}