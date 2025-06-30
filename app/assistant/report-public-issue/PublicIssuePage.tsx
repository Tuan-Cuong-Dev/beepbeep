// 📁 assistant/report-public-issue/PublicIssuePage.tsx
import PublicIssueForm from '@/src/components/report-public-issue/PublicIssueForm';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function PublicIssuePage() {
  return (
    <>
      <Header />
      <main className="py-10 px-4">
        <PublicIssueForm />
      </main>
      <Footer />
    </>
  );
}