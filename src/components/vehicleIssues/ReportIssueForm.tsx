'use client';

import { useState, useMemo } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/firebaseConfig";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { useEbikeData } from "@/src/hooks/useEbikeData";
import { useUser } from "@/src/context/AuthContext";

interface ReportIssueFormProps {
  companyId: string;
  companyName: string;
  stationId: string;
  stationName: string;
  onReported?: () => void;
}

const issueOptions = [
  { value: "Flat Tire", label: "🚲 Flat Tire" },
  { value: "Battery Problem", label: "🔋 Battery Problem" },
  { value: "Brake Issue", label: "🛑 Brake Issue" },
  { value: "Motor Problem", label: "⚡ Motor Problem" },
  { value: "Other", label: "❓ Other" },
];

export default function ReportIssueForm({
  companyId,
  companyName,
  stationId,
  stationName,
  onReported,
}: ReportIssueFormProps) {
  const { user } = useUser();
  const { ebikes } = useEbikeData({ companyId });

  const [selectedEbike, setSelectedEbike] = useState<{ id: string; vin: string; plateNumber?: string } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [ebikeDropdownOpen, setEbikeDropdownOpen] = useState(false);

  const [issueType, setIssueType] = useState("");
  const [issueDropdownOpen, setIssueDropdownOpen] = useState(false);

  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const filteredEbikes = useMemo(() => {
    return ebikes.filter((bike) =>
      (bike.vehicleID || "").toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, ebikes]);

  const handleSubmit = async () => {
    if (!companyId || !companyName) {
      alert("Company information is missing. Please check your account setup.");
      return;
    }

    if (!selectedEbike) {
      alert("Please select an ebike.");
      return;
    }

    if (!issueType) {
      alert("Please select issue type.");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "vehicleIssues"), {
        companyId,
        companyName,
        stationId: stationId || "",
        stationName: stationName || "",
        ebikeId: selectedEbike.id,
        vin: selectedEbike.vin,
        plateNumber: selectedEbike.plateNumber || '',
        issueType,
        description,
        photos: [],
        status: "pending",
        reportedBy: user?.displayName || user?.uid || "unknown",
        reportedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setSelectedEbike(null);
      setIssueType("");
      setDescription("");
      onReported?.();
    } catch (error) {
      console.error("❌ Error reporting issue:", error);
      alert("Failed to submit issue. Please try again later.");
    }

    setSubmitting(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-lg mx-auto">

      {/* Ebike VIN Select */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Select Ebike (VIN)</label>
        <div className="relative">
          <button
            onClick={() => setEbikeDropdownOpen(!ebikeDropdownOpen)}
            className="w-full h-12 text-base border rounded-lg px-4 flex items-center justify-between bg-white"
          >
            {selectedEbike ? `🚲 ${selectedEbike.vin} (Plate: ${selectedEbike.plateNumber || '-'})` : "Select Ebike"}
            <span>▼</span>
          </button>
          {ebikeDropdownOpen && (
            <div className="absolute z-10 bg-white border rounded-lg shadow mt-2 w-full max-h-72 overflow-y-auto p-2">
              <Input
                placeholder="Search Ebike..."
                className="w-full h-10 mb-2"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {filteredEbikes.length === 0 && <div className="p-2 text-gray-500">No Ebikes found</div>}
              {filteredEbikes.map((ebike) => (
                <div
                  key={ebike.id}
                  className={cn("px-4 py-2 hover:bg-gray-100 cursor-pointer", selectedEbike?.id === ebike.id && "bg-gray-100 font-semibold")}
                  onClick={() => {
                    setSelectedEbike({
                      id: ebike.id,
                      vin: ebike.vehicleID,
                      plateNumber: ebike.plateNumber,
                    });
                    setEbikeDropdownOpen(false);
                  }}
                >
                  🚲 {ebike.vehicleID} <span className="text-xs text-gray-400 ml-2">Plate: {ebike.plateNumber || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Select Issue Type</label>
        <div className="relative">
          <button
            onClick={() => setIssueDropdownOpen(!issueDropdownOpen)}
            className="w-full h-12 text-base border rounded-lg px-4 flex items-center justify-between bg-white"
          >
            {issueType || "Select Issue Type"}
            <span>▼</span>
          </button>
          {issueDropdownOpen && (
            <div className="absolute z-10 bg-white border rounded-lg shadow mt-2 w-full">
              {issueOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={cn("px-4 py-2 hover:bg-gray-100 cursor-pointer", issueType === opt.value && "bg-gray-100 font-semibold")}
                  onClick={() => {
                    setIssueType(opt.value);
                    setIssueDropdownOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <Textarea
          placeholder="Optional description..."
          className="w-full text-base"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Submit Button */}
      <Button
        className="w-full h-12 text-lg"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Issue"}
      </Button>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-300 text-green-700 p-4 rounded text-center font-medium mt-4">
          ✅ Issue reported successfully!
        </div>
      )}
    </div>
  );
}
