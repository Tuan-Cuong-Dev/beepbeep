// 📁 lib/validation/accountFormData.ts

import { z } from 'zod';
import { accountFormSchema } from './accountFormSchema'; // đảm bảo đường dẫn đúng

// Define the TypeScript type from the Zod schema
export type AccountFormData = z.infer<typeof accountFormSchema>;
