export interface Investor {
  id: string;
  userId: string;

  name: string;
  phone: string;
  investedAmount: number;
  investedCompanies: string[];

  contractDocs?: string[]; // URL hoặc Google Drive IDs

  createdAt: Date;
  updatedAt: Date;
}
