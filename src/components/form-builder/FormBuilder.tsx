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
  getFormConfigurationByCompanyId,
  saveFormConfiguration,
} from '@/src/lib/services/Configirations/formConfigurationService';
import { DEFAULT_FORM_CONFIG } from '@/src/lib/formConfigurations/defaultFormConfiguration';

interface Props {
  companyId: string;
  userId: string;
}

const fieldTypes: FormFieldType[] = [
  'text',
  'number',
  'date',
  'textarea',
  'checkbox',
  'select',
  'upload',
];

export default function FormBuilder({ companyId, userId }: Props) {
  const { t } = useTranslation('common');
  const [config, setConfig] = useState<FormConfiguration | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    getFormConfigurationByCompanyId(companyId).then(setConfig);
  }, [companyId]);

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    if (!config) return;
    setConfig({
      ...config,
      sections: config.sections.map(section =>
        section.id === sectionId ? { ...section, title: newTitle } : section
      ),
    });
  };

  const addSection = () => {
    const newSection: FormSection = {
      id: uuidv4(),
      title: t('form_builder.new_section'),
      fields: [],
    };
    setConfig(prev =>
      prev ? { ...prev, sections: [...prev.sections, newSection] } : prev
    );
  };

  const addField = (sectionId: string) => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      label: t('form_builder.new_field'),
      type: 'text',
      required: false,
      visible: true,
    };
    updateSection(sectionId, section =>
      ({ ...section, fields: [...section.fields, newField] })
    );
  };

  const updateField = (
    sectionId: string,
    fieldIndex: number,
    updated: Partial<FormField>
  ) => {
    updateSection(sectionId, section => ({
      ...section,
      fields: section.fields.map((field, idx) =>
        idx === fieldIndex ? { ...field, ...updated } : field
      ),
    }));
  };

  const removeField = (sectionId: string, fieldIndex: number) => {
    updateSection(sectionId, section => ({
      ...section,
      fields: section.fields.filter((_, idx) => idx !== fieldIndex),
    }));
  };

  const updateSection = (
    sectionId: string,
    updater: (section: FormSection) => FormSection
  ) => {
    if (!config) return;
    setConfig({
      ...config,
      sections: config.sections.map(section =>
        section.id === sectionId ? updater(section) : section
      ),
    });
  };

  const resetToDefault = () => {
    const translatedConfig: FormConfiguration = {
      ...DEFAULT_FORM_CONFIG,
      sections: DEFAULT_FORM_CONFIG.sections.map(section => ({
        ...section,
        title: t(`form_configuration.section_titles.${section.id}`, {
          defaultValue: section.title,
        }),
        fields: section.fields.map(field => ({
          ...field,
          label: t(`form_configuration.fields.${field.key}`, {
            defaultValue: field.label,
          }),
          options: field.options?.map(opt =>
            t(`form_configuration.options.${opt}`, { defaultValue: opt })
          ),
        })),
      })),
    };
    setConfig(translatedConfig);
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    await saveFormConfiguration({ ...config, createdBy: userId, companyId });
    setSaving(false);
    setShowSuccess(true);
  };

  if (!config) return <div>{t('form_builder.loading')}</div>;

  return (
    <div className="space-y-6 p-4">
      {config.sections.map(section => (
        <div key={section.id} className="border p-4 rounded bg-white space-y-4">
          <Input
            value={section.title}
            onChange={e => updateSectionTitle(section.id, e.target.value)}
            className="text-lg font-semibold"
          />

          {section.fields.map((field, index) => (
            <div key={field.key} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <Input
                value={field.label}
                onChange={e => updateField(section.id, index, { label: e.target.value })}
                placeholder={t('form_builder.field_label')}
              />

              <SimpleSelect
                options={fieldTypes.map(type => ({ label: type, value: type }))}
                value={field.type}
                onChange={val => updateField(section.id, index, { type: val as FormFieldType })}
              />

              <CheckboxWithLabel
                label={t('form_builder.required')}
                checked={field.required}
                onChange={val => updateField(section.id, index, { required: Boolean(val) })}
              />

              <CheckboxWithLabel
                label={t('form_builder.visible')}
                checked={field.visible}
                onChange={val => updateField(section.id, index, { visible: Boolean(val) })}
              />

              <Button variant="destructive" onClick={() => removeField(section.id, index)}>
                {t('form_builder.delete')}
              </Button>
            </div>
          ))}

          <Button className="mt-3" onClick={() => addField(section.id)}>
            ➕ {t('form_builder.add_field')}
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap gap-4 mt-6">
        <Button onClick={addSection}>➕ {t('form_builder.add_section')}</Button>
        <Button onClick={save} disabled={saving}>
          📎 {saving ? t('form_builder.saving') : t('form_builder.save')}
        </Button>
        <Button variant="outline" onClick={resetToDefault}>
          🔄 {t('form_builder.reset')}
        </Button>
      </div>

      <NotificationDialog
        open={showSuccess}
        type="success"
        title={t('form_builder.saved_title')}
        description={t('form_builder.saved_description')}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}

// ✅ Helper Component
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
