'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
import { getFormConfigurationByCompanyId, saveFormConfiguration } from '@/src/lib/services/Configirations/formConfigurationService';
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
  const [config, setConfig] = useState<FormConfiguration | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const result = await getFormConfigurationByCompanyId(companyId);
      setConfig(result);
    };
    fetchConfig();
  }, [companyId]);

  const addSection = () => {
    const newSection: FormSection = {
      id: uuidv4(),
      title: 'New Section',
      fields: [],
    };
    setConfig((prev) =>
      prev ? { ...prev, sections: [...prev.sections, newSection] } : prev
    );
  };

  const addField = (sectionId: string) => {
    const newField: FormField = {
      key: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      visible: true,
    };
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((section) =>
              section.id === sectionId
                ? { ...section, fields: [...section.fields, newField] }
                : section
            ),
          }
        : prev
    );
  };

  const updateField = (sectionId: string, fieldIndex: number, updated: Partial<FormField>) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    fields: section.fields.map((field, idx) =>
                      idx === fieldIndex ? { ...field, ...updated } : field
                    ),
                  }
                : section
            ),
          }
        : prev
    );
  };

  const removeField = (sectionId: string, fieldIndex: number) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((section) =>
              section.id === sectionId
                ? {
                    ...section,
                    fields: section.fields.filter((_, idx) => idx !== fieldIndex),
                  }
                : section
            ),
          }
        : prev
    );
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    await saveFormConfiguration({
      ...config,
      createdBy: userId,
      companyId,
    });
    setSaving(false);
    setShowSuccess(true);
  };

  const resetToDefault = () => {
    setConfig({
      ...DEFAULT_FORM_CONFIG,
      createdBy: userId,
      companyId,
    });
  };

  if (!config) return <div>Loading form configuration...</div>;

  return (
    <div className="space-y-6 p-4">
      {config.sections.map((section) => (
        <div key={section.id} className="border p-4 rounded bg-white space-y-4">
          <Input
            value={section.title}
            onChange={(e) =>
              setConfig((prev) =>
                prev
                  ? {
                      ...prev,
                      sections: prev.sections.map((s) =>
                        s.id === section.id ? { ...s, title: e.target.value } : s
                      ),
                    }
                  : prev
              )
            }
            className="text-lg font-semibold"
          />

          {section.fields.map((field, index) => (
            <div key={field.key} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <Input
                value={field.label}
                onChange={(e) =>
                  updateField(section.id, index, { label: e.target.value })
                }
                placeholder="Field Label"
              />

              <SimpleSelect
                options={fieldTypes.map((type) => ({ label: type, value: type }))}
                value={field.type}
                onChange={(val) =>
                  updateField(section.id, index, { type: val as FormFieldType })
                }
              />

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={field.required}
                  onCheckedChange={(val) =>
                    updateField(section.id, index, { required: Boolean(val) })
                  }
                />
                <span>Required</span>
              </label>

              <label className="flex items-center gap-2">
                <Checkbox
                  checked={field.visible}
                  onCheckedChange={(val) =>
                    updateField(section.id, index, { visible: Boolean(val) })
                  }
                />
                <span>Visible</span>
              </label>

              <Button variant="destructive" onClick={() => removeField(section.id, index)}>
                Delete
              </Button>
            </div>
          ))}

          <Button className="mt-3" onClick={() => addField(section.id)}>
            ➕ Add Field
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap gap-4 mt-6">
        <Button onClick={addSection}>➕ Add Section</Button>
        <Button onClick={save} disabled={saving}>
          💾 {saving ? 'Saving...' : 'Save Form'}
        </Button>
        <Button variant="outline" onClick={resetToDefault}>
          🔄 Reset to Default
        </Button>
      </div>

      <NotificationDialog
        open={showSuccess}
        type="success"
        title="Form Saved"
        description="Your form configuration has been saved successfully."
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
