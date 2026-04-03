import React, { useState } from "react";
import { UserProvider, useUser } from "./hooks/useUser";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import TestPage from "./pages/TestPage";
import HistoryPage from "./pages/HistoryPage";
import WeakTopicsPage from "./pages/WeakTopicsPage";
import GamificationPage from "./pages/GamificationPage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import ParentDashboard from "./pages/ParentDashboard";
import ReportPage from "./pages/ReportPage";
import AdminPanel from "./pages/AdminPanel";
import WeaknessHeatmap from "./pages/WeaknessHeatmap";
import ExamPrediction from "./pages/ExamPrediction";
import ExamSimulation from "./pages/ExamSimulation";
import QuickRevision from "./pages/QuickRevision";
import Leaderboard from "./pages/Leaderboard";
import ScorePredictor from "./pages/ScorePredictor";
import PeerChallenge from "./pages/PeerChallenge";
import DoubtShare from "./pages/DoubtShare";
import StudyStreak from "./pages/StudyStreak";
import ExamCountdown from "./pages/ExamCountdown";
import ProgressReport from "./pages/ProgressReport";
import GroupStudy from "./pages/GroupStudy";
import NCERTPractice from "./pages/NCERTPractice";
import PricingPage from "./pages/PricingPage";
import ContentUpload from "./pages/ContentUpload";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import PWAInstall from "./components/PWAInstall";
import PremiumGate from "./components/PremiumGate";
import { AppDataProvider } from "./hooks/useAppData";
import { usePremium } from "./hooks/usePremium";
import "./styles/global.css";

function AppContent() {
  const { user, refreshUser } = useUser();
  const { canAccess }         = usePremium();
  const [activePage, setActivePage] = useState("dashboard");

  const refreshedRef = React.useRef(false);
  React.useEffect(() => {
    if (user?.id && !refreshedRef.current) {
      refreshedRef.current = true;
      refreshUser(user.id);
    }
  }, []); // eslint-disable-line

  if (!user) return <LoginPage />;

  const gate = (feature, label, key) =>
    canAccess(feature) ? null :
    <PremiumGate feature={label} featureKey={key} onUpgrade={() => setActivePage("pricing")} />;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":    return <DashboardPage onNavigate={setActivePage} />;
      case "chat":         return <ChatPage />;
      case "test":         return <TestPage />;
      case "ncert":        return <NCERTPractice />;
      case "history":      return <HistoryPage />;
      case "weak":         return <WeakTopicsPage onNavigate={setActivePage} />;
      case "gamification": return <GamificationPage />;
      case "planner":      return <StudyPlannerPage />;
      case "parent":       return <ParentDashboard />;
      case "report":       return <ReportPage />;
      case "admin":        return <AdminPanel />;
      case "heatmap":      return <WeaknessHeatmap />;
      case "prediction":   return <ExamPrediction />;
      case "simulation":   return <ExamSimulation />;
      case "revision":     return <QuickRevision />;
      case "leaderboard":  return <Leaderboard />;
      case "predictor":    return <ScorePredictor />;
      case "challenge":    return <PeerChallenge />;
      case "doubts":       return <DoubtShare />;
      case "streak":       return <StudyStreak />;
      case "countdown":    return <ExamCountdown />;
      case "progress":     return gate("progress_report","AI Progress Report","progress_report") || <ProgressReport />;
      case "group":        return gate("group_study","Group Study","group_study") || <GroupStudy />;
      case "pricing":      return <PricingPage onNavigate={setActivePage} />;
      case "content":      return <ContentUpload />;
      default:             return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <AppDataProvider userId={user?.id}>
      <div style={{ display:"flex", minHeight:"100vh" }}>
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
        <main className="main-content"
          style={{ marginLeft:"220px", flex:1, minHeight:"100vh", overflowY:"auto" }}>
          {renderPage()}
        </main>
        <MobileNav activePage={activePage} onPageChange={setActivePage} />
        <PWAInstall />
      </div>
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}
