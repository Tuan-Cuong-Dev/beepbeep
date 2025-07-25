'use client';

import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { VisibleTab } from './types';

interface SortableItemProps {
  id: string;
  visible: boolean;
  onToggle: (id: string) => void;
}

function SortableItem({ id, visible, onToggle }: SortableItemProps) {
  const { t } = useTranslation('common');
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between border px-3 py-2 rounded mb-2 bg-white shadow-sm"
    >
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={visible} onChange={() => onToggle(id)} />
        <span {...attributes} {...listeners} className="cursor-move">
          {t(`tab_labels.${id}`)}
        </span>
      </div>
    </div>
  );
}

interface TabSettingsModalProps {
  visibleTabs: VisibleTab[];
  setVisibleTabs: (tabs: VisibleTab[]) => void;
  storageKey: string;
  onClose: () => void;
}

export function TabSettingsModal({
  visibleTabs,
  setVisibleTabs,
  storageKey,
  onClose,
}: TabSettingsModalProps) {
  const { t } = useTranslation('common');
  const [tabs, setTabs] = useState<VisibleTab[]>(visibleTabs);

  const toggleTabVisibility = (id: string) => {
    setTabs(prev =>
      prev.map(tab =>
        tab.key === id ? { ...tab, visible: !tab.visible } : tab
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tabs.findIndex(tab => tab.key === active.id);
    const newIndex = tabs.findIndex(tab => tab.key === over.id);
    setTabs(arrayMove(tabs, oldIndex, newIndex));
  };

  const handleSave = () => {
    setVisibleTabs(tabs);
    localStorage.setItem(storageKey, JSON.stringify(tabs));
    onClose();
  };

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <Dialog.Panel className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <Dialog.Title className="text-lg font-semibold mb-4">
          {t('tab_settings_modal.title')}
        </Dialog.Title>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tabs.map(tab => tab.key)}>
            {tabs.map(tab => (
              <SortableItem
                key={tab.key}
                id={tab.key}
                visible={tab.visible}
                onToggle={toggleTabVisibility}
              />
            ))}
          </SortableContext>
        </DndContext>

        <div className="flex justify-end mt-4 gap-2">
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            {t('tab_settings_modal.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="bg-[#00d289] text-white px-4 py-1 rounded"
          >
            {t('tab_settings_modal.save')}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
