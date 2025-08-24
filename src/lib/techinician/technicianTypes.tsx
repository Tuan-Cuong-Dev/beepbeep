// Đây là những kỹ thuật làm việc trong công ty. Tôi sẽ tập trung viết sau.
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

