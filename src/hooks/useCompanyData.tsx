// useRentalData.ts

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export interface RentalCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  displayAddress: string;
  mapAddress: string;
  location: string;
}

export interface RentalStation {
  id: string;
  name: string;
  displayAddress: string;
  mapAddress: string;
  location: string;
  totalEbikes: number;
  companyId: string;
}

export function useRentalData() {
  const [rentalCompanies, setRentalCompanies] = useState<RentalCompany[]>([]);
  const [rentalStations, setRentalStations] = useState<RentalStation[]>([]);

  const fetchCompanies = async () => {
    const snapshot = await getDocs(collection(db, 'rentalCompanies'));
    const companies: RentalCompany[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        displayAddress: data.displayAddress || '',
        mapAddress: data.mapAddress || '',
        location: typeof data.location === 'string' ? data.location : '',
      };
    });
    setRentalCompanies(companies);
  };

  const fetchStations = async () => {
    const snapshot = await getDocs(collection(db, 'rentalStations'));
    const stations: RentalStation[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        displayAddress: data.displayAddress || '',
        mapAddress: data.mapAddress || '',
        location: typeof data.location === 'string' ? data.location : '',
        totalEbikes: data.totalEbikes || 0,
        companyId: data.companyId || '',
      };
    });
    setRentalStations(stations);
  };

  useEffect(() => {
    fetchCompanies();
    fetchStations();
  }, []);

  return {
    rentalCompanies,
    rentalStations,
    fetchCompanies,
    fetchStations,
  };
}