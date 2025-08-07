'use client';

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/src/firebaseConfig";
import { Button } from "../ui/button";
import { SimpleSelect } from "../ui/select";
import { useUser } from "@/src/context/AuthContext";
import { useTranslation } from "react-i18next";

interface Props {
  companyId?: string; // 👈 optional
  onAssign: (userId: string) => void;
}

interface Technician {
  userId: string;
  displayName: string;
}

export default function AssignTechnicianForm({ companyId, onAssign }: Props) {
  const { t } = useTranslation('common');
  const { role } = useUser();
  const isGlobalRole = role === 'admin' || role === 'technician_assistant';

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    const fetchTechnicians = async () => {
      let q;

      if (isGlobalRole) {
        q = query(
          collection(db, "staffs"),
          where("role", "in", ["technician", "Technician"])
        );
      } else if (companyId) {
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
        displayName: doc.data().name || t('assign_technician_form.unnamed'),
      }));

      setTechnicians(techs);
    };

    fetchTechnicians();
  }, [companyId, isGlobalRole, t]);

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
        placeholder={t('assign_technician_form.placeholder')}
        value={selectedUserId}
        onChange={setSelectedUserId}
      />

      <Button
        disabled={!selectedUserId}
        onClick={() => onAssign(selectedUserId)}
        className="w-full"
      >
        {t('assign_technician_form.assign_button')}
      </Button>
    </div>
  );
}
