// file: formConfigurations/formConfigurationTypes.ts

export type FormFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'textarea'
  | 'upload'; // 👈 Thêm 'upload' cho Upload ID

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  visible: boolean;
  options?: string[]; // Với các field select thì có options
  conditional?: {
    dependsOn: string; // Nếu field này phụ thuộc field khác
    valueEquals: string | number | boolean;
  };
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

export interface FormConfiguration {
  id?: string; // Khi tạo mới thì id chưa có
  companyId: string;
  createdBy: string;
  sections: FormSection[];
  createdAt?: any;
  updatedAt?: any;
}

// ✨ Các mẫu Section và Field cố định để chọn

export interface PredefinedField {
  key: string;
  label: string;
  type: FormFieldType;
  options?: string[];
}

export interface PredefinedSection {
  id: string;
  title: string;
  fields: PredefinedField[];
}
