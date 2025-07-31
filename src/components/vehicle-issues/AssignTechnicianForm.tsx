'use client';

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/src/firebaseConfig";
import { Button } from "../ui/button";
import { SimpleSelect } from "../ui/select";
import { useUser } from "@/src/context/AuthContext";

interface Props {
  companyId?: string; // 👈 optional
  onAssign: (userId: string) => void;
}

interface Technician {
  userId: string;
  displayName: string;
}

export default function AssignTechnicianForm({ companyId, onAssign }: Props) {
  const { role } = useUser();
  const isGlobalRole = role === 'admin' || role === 'technician_assistant';

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    const fetchTechnicians = async () => {
      let q;

      if (isGlobalRole) {
        // ✅ Lấy tất cả kỹ thuật viên trên hệ thống
        q = query(
          collection(db, "staffs"),
          where("role", "in", ["technician", "Technician"])
        );
      } else if (companyId) {
        // ✅ Lấy kỹ thuật viên trong công ty
        q = query(
          collection(db, "staffs"),
          where("companyId", "==", companyId),
          where("role", "in", ["technician", "Technician"])
        );
      } else {
        setTechnicians([]);
        return;
      }

      const snap = await getDocs(q);
      const techs: Technician[] = snap.docs.map(doc => ({
        userId: doc.data().userId,
        displayName: doc.data().name || "(Unnamed Technician)",
      }));

      setTechnicians(techs);
    };

    fetchTechnicians();
  }, [companyId, isGlobalRole]);

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
