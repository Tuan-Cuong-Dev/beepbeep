// 📁 assistant/report-public-issue/PublicIssuePage.tsx
import ReportPublicIssueForm from '@/src/components/public-vehicle-issues/ReportPublicIssueForm';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function PublicIssuePage() {
  return (
    <>
      <Header />
      <main className="py-10 px-4">
        <ReportPublicIssueForm />
      </main>
      <Footer />
    </>
  );
}

