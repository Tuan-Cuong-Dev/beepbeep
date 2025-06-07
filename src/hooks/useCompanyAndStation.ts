'use client';

import { useEffect, useState } from "react";
import { useUser } from "@/src/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/src/firebaseConfig";

interface CompanyAndStation {
  companyId: string | null;
  companyName: string;
  stationId: string | null;
  stationName: string;
  loading: boolean;
}

export function useCompanyAndStation(): CompanyAndStation {
  const { user, role, companyId: companyIdFromAuth } = useUser();
  const searchParams = useSearchParams();

  const companyIdFromURL = searchParams?.get("companyId") ?? null;
  const companyNameFromURL = searchParams?.get("companyName") ?? null;

  const stationIdFromURL = searchParams?.get("stationId") ?? null;
  const stationNameFromURL = searchParams?.get("stationName") ?? null;

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [stationId, setStationId] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      setLoading(true);

      // --- Ưu tiên URL ---
      if (companyIdFromURL) setCompanyId(companyIdFromURL);
      if (companyNameFromURL) setCompanyName(companyNameFromURL);
      if (stationIdFromURL) setStationId(stationIdFromURL);
      if (stationNameFromURL) setStationName(stationNameFromURL);

      // Nếu là URL → ngừng luôn (đủ dữ liệu rồi)
      if (companyIdFromURL) {
        setLoading(false);
        return;
      }

      // --- Nếu là Admin ---
      if (role === "Admin") {
        setCompanyId("admin");
        setCompanyName("Administrator");
        setLoading(false);
        return;
      }

      // --- Nếu là company_owner hoặc private_provider ---
      if (companyIdFromAuth && ["company_owner", "private_provider"].includes(role || "")) {
        setCompanyId(companyIdFromAuth);
        setLoading(false);
        return;
      }

      // --- Nếu là staff hoặc technician ---
      if (user?.uid && ["staff", "technician"].includes(role || "")) {
        const staffSnap = await getDocs(query(collection(db, "staffs"), where("userId", "==", user.uid)));
        if (!staffSnap.empty) {
          const staffData = staffSnap.docs[0].data();
          setCompanyId(staffData.companyId || null);
          setStationId(staffData.stationId || null);
        }
      }

      setLoading(false);
    };

    detect();
  }, [user?.uid, companyIdFromURL, companyNameFromURL, companyIdFromAuth, stationIdFromURL, stationNameFromURL, role]);

  // --- Lấy CompanyName nếu chưa có ---
  useEffect(() => {
    if (!companyId || companyNameFromURL || companyId === "admin") return;

    const fetchCompanyName = async () => {
      const snap = await getDoc(doc(db, "rentalCompanies", companyId));
      if (snap.exists()) {
        setCompanyName(snap.data().name || "");
      }
    };

    fetchCompanyName();
  }, [companyId, companyNameFromURL]);

  // --- Lấy StationName nếu chưa có ---
  useEffect(() => {
    if (!stationId || stationNameFromURL) return;

    const fetchStationName = async () => {
      const snap = await getDoc(doc(db, "rentalStations", stationId));
      if (snap.exists()) {
        setStationName(snap.data().name || "");
      }
    };

    fetchStationName();
  }, [stationId, stationNameFromURL]);

  return {
    companyId,
    companyName,
    stationId,
    stationName,
    loading,
  };
}
