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

export type NotificationType = 'success' | 'error' | 'info' | 'confirm';

export interface NotificationDialogProps {
  open: boolean;
  type: NotificationType;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm?: () => void;
}

export default function NotificationDialog({
  open,
  type,
  title,
  description,
  onClose,
  onConfirm,
}: NotificationDialogProps) {
  const { t } = useTranslation();

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
          'w-full max-w-md p-6 rounded-2xl space-y-5 pb-8',
          'transition-none duration-0 animate-none data-[state=open]:animate-none'
        )}
      >
        <DialogHeader className="flex items-center gap-3">
          {renderIcon()}
          <DialogTitle className="text-lg sm:text-xl">
            {title}
          </DialogTitle>
        </DialogHeader>

        {description && (
          <DialogDescription>
            {description}
          </DialogDescription>
        )}

        <DialogFooter className="flex justify-end gap-3 mt-6">
          {type === 'confirm' ? (
            <>
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={onClose}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={onConfirm}
              >
                {t('confirm')}
              </Button>
            </>
          ) : (
            <Button
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              {t('ok')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
