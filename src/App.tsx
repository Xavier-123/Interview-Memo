import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { JobDetailPage } from '@/pages/JobDetailPage'
import { JobsPage } from '@/pages/JobsPage'
import { InterviewsPage } from '@/pages/InterviewsPage'
import { InterviewDetailPage } from '@/pages/InterviewDetailPage'
import { ReviewPage, ReviewListPage } from '@/pages/ReviewPage'
import { InsightsPage } from '@/pages/InsightsPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { KnowledgePage } from '@/pages/KnowledgePage'
import { CompaniesPage } from '@/pages/CompaniesPage'
import { CompanyDetailPage } from '@/pages/CompanyDetailPage'
import { MockInterviewPage } from '@/pages/MockInterviewPage'
import { MockSessionPage } from '@/pages/MockSessionPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ResumesPage } from '@/pages/ResumesPage'
import { ResumeDetailPage } from '@/pages/ResumeDetailPage'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="resumes" element={<ResumesPage />} />
            <Route path="resumes/:id" element={<ResumeDetailPage />} />
            <Route path="interviews" element={<InterviewsPage />} />
            <Route path="interviews/:id" element={<InterviewDetailPage />} />
            <Route path="interviews/:id/review" element={<ReviewPage />} />
            <Route path="review" element={<ReviewListPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="companies/:id" element={<CompanyDetailPage />} />
            <Route path="mock" element={<MockInterviewPage />} />
            <Route path="mock/:id" element={<MockSessionPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
