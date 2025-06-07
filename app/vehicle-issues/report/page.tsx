'use client';

import { useState } from "react";
import Header from "@/src/components/landingpage/Header";
import Footer from "@/src/components/landingpage/Footer";
import ReportIssueForm from "@/src/components/vehicleIssues/ReportIssueForm";
import { useCompanyAndStation } from "@/src/hooks/useCompanyAndStation";
import NotificationDialog from "@/src/components/ui/NotificationDialog";

export default function ReportVehicleIssuePage() {
  const { companyId, companyName, stationId, stationName, loading } = useCompanyAndStation();
  const [notification, setNotification] = useState<string | null>(null);

  if (loading) return <div className="text-center py-10">Loading company information...</div>;

  if (!companyId) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 p- max-w-3xl mx-auto flex flex-col justify-center items-center text-gray-500 space-y-4">
          <h1 className="text-2xl font-semibold">🚫 Cannot Report Issue</h1>
          <p>Missing company information. Please make sure you are assigned to a company or select a company first.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-3 sm:p-6 space-y-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800">🚨 Report Vehicle Issue</h1>

        <div className="text-sm text-gray-500 text-right space-y-1">
          <div><strong>Company:</strong> {companyName}</div>
          {stationId && <div><strong>Station:</strong> {stationName}</div>}
        </div>

        <div className="bg-white rounded-2xl border p-4 sm:p-6 md:p-10 space-y-8 shadow w-full max-w-4xl mx-auto">
          <ReportIssueForm
            companyId={companyId}
            companyName={companyName}
            stationId={stationId || ''}
            stationName={stationName}
            onReported={() => setNotification("Reported issue successfully.")}
          />
        </div>
      </main>

      <Footer />

      <NotificationDialog
        open={!!notification}
        type="success"
        title="Success"
        description={notification || undefined}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
