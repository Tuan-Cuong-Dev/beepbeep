'use client';

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/src/firebaseConfig";
import { Button } from "../ui/button";
import { SimpleSelect } from "../ui/select";

interface Props {
  companyId: string;
  onAssign: (userId: string) => void;
}

interface Technician {
  userId: string;
  displayName: string;
}

export default function AssignTechnicianForm({ companyId, onAssign }: Props) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Fetch technicians of the company
  useEffect(() => {
    const fetchTechnicians = async () => {
      if (!companyId) return;

      const q = query(
        collection(db, "staffs"),
        where("companyId", "==", companyId),
        where("role", "in", ["technician", "Technician"])
      );

      const snap = await getDocs(q);
      const techs: Technician[] = snap.docs.map(doc => ({
        userId: doc.data().userId,
        displayName: doc.data().name || "(Unnamed Technician)", // <-- Đây mới đúng
      }));      

      setTechnicians(techs);
    };

    fetchTechnicians();
  }, [companyId]);

  // Auto select first technician if available
  useEffect(() => {
    if (technicians.length > 0 && !selectedUserId) {
      setSelectedUserId(technicians[0].userId);
    }
  }, [technicians]);

  const options = technicians.map(tech => ({
    value: tech.userId,
    label: tech.displayName,
  }));

  return (
    <div className="space-y-4">
      <SimpleSelect
        options={options}
        placeholder="Select Technician"
        value={selectedUserId}
        onChange={setSelectedUserId}
      />

      <Button
        disabled={!selectedUserId}
        onClick={() => onAssign(selectedUserId)}
        className="w-full"
      >
        Assign Technician
      </Button>
    </div>
  );
}
