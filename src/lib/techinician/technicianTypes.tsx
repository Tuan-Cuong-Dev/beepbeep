// Chưa sử dung vì nó đang ở trong Staff; 
// Techinician là 1 role của Staff

export interface Technician {
  id: string;
  userId: string;
  companyId: string;
  assignedStations?: string[];

  name: string;
  phone: string;
  skills?: string[];

  createdAt: Date;
  updatedAt: Date;
}

