'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { SimpleSelect } from '@/src/components/ui/select';
import { Checkbox } from '@/src/components/ui/checkbox';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import {
  FormConfiguration,
  FormField,
  FormFieldType,
  FormSection,
} from '@/src/lib/formConfigurations/formConfigurationTypes';
import {
  getFormConfigurationByEntity,
  saveFormConfigurationByEntity,
  EntityType,
} from '@/src/lib/services/Configirations/formConfigurationService';
import { DEFAULT_FORM_CONFIG } from '@/src/lib/formConfigurations/defaultFormConfiguration';

const fieldTypes: FormFieldType[] = ['text', 'number', 'date', 'textarea', 'checkbox', 'select', 'upload'];

interface Props {
  /** id công ty (rentalCompany) hoặc id private provider */
  ownerId: string;
  /** 'rentalCompany' | 'privateProvider' */
  entityType: EntityType;
  userId: string;
}

export default function FormBuilder({ ownerId, entityType, userId }: Props) {
  const { t, i18n } = useTranslation('common');
  const [config, setConfig] = useState<FormConfiguration | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load cấu hình theo entity
  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await getFormConfigurationByEntity(ownerId, entityType);
      if (!mounted) return;
      // Đảm bảo có target info để save
      const withTarget: FormConfiguration = {
        ...result,
        targetId: ownerId,
        targetType: entityType,
        ...(entityType === 'rentalCompany' ? { companyId: ownerId } : {}),
      } as FormConfiguration;
      setConfig(withTarget);
    })();
    return () => {
      mounted = false;
    };
  }, [ownerId, entityType]);

  // Áp bản dịch (không sửa i18n keys trong DB)
  useEffect(() => {
    if (!config) return;
    const translatedSections = config.sections.map((section) => ({
      ...section,
      title: t(`form_configuration.section_titles.${section.id}`, { defaultValue: section.title }),
      fields: section.fields.map((field) => ({
        ...field,
        label: t(`form_configuration.fields.${field.key}`, { defaultValue: field.label }),
        // Gợi ý key options có dạng: form_configuration.options.<fieldKey>.<value>
        options: field.options?.map((opt) =>
          t(`form_configuration.options.${field.key}.${String(opt)}`, { defaultValue: String(opt) })
        ),
      })),
    }));
    setConfig((prev) => (prev ? { ...prev, sections: translatedSections } : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const updateSection = (sectionId: string, updater: (section: FormSection) => FormSection) => {
    setConfig((prev) =>
      prev && {
        ...prev,
        sections: prev.sections.map((section) => (section.id === sectionId ? updater(section) : section)),
      }
    );
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: uuidv4(),
      title: t('form_builder.new_section', { defaultValue: 'New Section' }),
      fields: [],
    };
    setConfig((prev) => prev && { ...prev, sections: [...prev.sections, newSection] });
  };

  const addField = (sectionId: string) => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      label: t('form_builder.new_field', { defaultValue: 'New Field' }),
      type: 'text',
      required: false,
      visible: true,
    };
    updateSection(sectionId, (s) => ({ ...s, fields: [...s.fields, newField] }));
  };

  const updateField = (sectionId: string, fieldIndex: number, updates: Partial<FormField>) => {
    updateSection(sectionId, (s) => ({
      ...s,
      fields: s.fields.map((f, i) => (i === fieldIndex ? { ...f, ...updates } : f)),
    }));
  };

  const removeField = (sectionId: string, fieldIndex: number) => {
    updateSection(sectionId, (s) => ({
      ...s,
      fields: s.fields.filter((_, i) => i !== fieldIndex),
    }));
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    updateSection(sectionId, (s) => ({ ...s, title: newTitle }));
  };

  const resetToDefault = () => {
    const translated: FormConfiguration = {
      ...DEFAULT_FORM_CONFIG,
      targetId: ownerId,
      targetType: entityType,
      ...(entityType === 'rentalCompany' ? { companyId: ownerId } : {}),
      sections: DEFAULT_FORM_CONFIG.sections.map((section) => ({
        ...section,
        title: t(`form_configuration.section_titles.${section.id}`, { defaultValue: section.title }),
        fields: section.fields.map((field) => ({
          ...field,
          label: t(`form_configuration.fields.${field.key}`, { defaultValue: field.label }),
          options: field.options?.map((opt) =>
            t(`form_configuration.options.${field.key}.${String(opt)}`, { defaultValue: String(opt) })
          ),
        })),
      })),
    } as FormConfiguration;
    setConfig(translated);
  };

  const removeUndefined = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(removeUndefined);
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, removeUndefined(v)])
      );
    }
    return obj;
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    const cleaned = removeUndefined({
      ...config,
      createdBy: userId,
      targetId: ownerId,
      targetType: entityType,
      // giữ companyId để tương thích ngược với luồng cũ
      ...(entityType === 'rentalCompany' ? { companyId: ownerId } : {}),
    });
    await saveFormConfigurationByEntity(
      cleaned as FormConfiguration & { targetId: string; targetType: EntityType },
      { alsoWriteLegacyForCompany: true } // ghi kèm doc legacy nếu là company
    );
    setSaving(false);
    setShowSuccess(true);
  };

  if (!config) return <div>{t('form_builder.loading', { defaultValue: 'Loading...' })}</div>;

  return (
    <div className="space-y-6 p-4">
      {config.sections.map((section) => (
        <div key={section.id} className="border p-4 rounded bg-white space-y-4">
          <Input
            value={section.title}
            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
            className="text-lg font-semibold"
          />
          {section.fields.map((field, index) => (
            <div key={field.key} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <Input
                value={field.label || ''}
                onChange={(e) => updateField(section.id, index, { label: e.target.value })}
                placeholder={t('form_builder.field_label', { defaultValue: 'Field Label' })}
              />
              <SimpleSelect
                options={fieldTypes.map((type) => ({ label: type, value: type }))}
                value={field.type}
                onChange={(val) => updateField(section.id, index, { type: val as FormFieldType })}
              />
              <CheckboxWithLabel
                label={t('form_builder.required', { defaultValue: 'Required' })}
                checked={!!field.required}
                onChange={(val) => updateField(section.id, index, { required: val })}
              />
              <CheckboxWithLabel
                label={t('form_builder.visible', { defaultValue: 'Visible' })}
                checked={!!field.visible}
                onChange={(val) => updateField(section.id, index, { visible: val })}
              />
              <Button variant="destructive" onClick={() => removeField(section.id, index)}>
                {t('form_builder.delete', { defaultValue: 'Delete' })}
              </Button>
            </div>
          ))}
          <Button className="mt-3" onClick={() => addField(section.id)}>
            ➕ {t('form_builder.add_field', { defaultValue: 'Add Field' })}
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap gap-4 mt-6">
        <Button onClick={addSection}>➕ {t('form_builder.add_section', { defaultValue: 'Add Section' })}</Button>
        <Button onClick={save} disabled={saving}>
          📎 {saving ? t('form_builder.saving', { defaultValue: 'Saving...' }) : t('form_builder.save', { defaultValue: 'Save' })}
        </Button>
        <Button variant="outline" onClick={resetToDefault}>
          🔄 {t('form_builder.reset', { defaultValue: 'Reset to Default' })}
        </Button>
      </div>

      <NotificationDialog
        open={showSuccess}
        type="success"
        title={t('form_builder.saved_title', { defaultValue: 'Saved!' })}
        description={t('form_builder.saved_description', { defaultValue: 'Your configuration has been saved.' })}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}

function CheckboxWithLabel({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
