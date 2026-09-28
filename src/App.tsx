/**
 * ResolveIQ - AI Incident Resolution Agent
 * Tagline: Remember. Reflect. Resolve Better.
 */
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { NewIncidentPage } from './pages/NewIncidentPage';
import { AISolveProblemPage } from './pages/AISolveProblemPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MemoryPage } from './pages/MemoryPage';
import { LessonsPage } from './pages/LessonsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { api } from './services/api';
import { IncidentModel, DashboardStats, RetainedMemory, LessonModel, SeverityType } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  // Application Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [incidents, setIncidents] = useState<IncidentModel[]>([]);
  const [memories, setMemories] = useState<RetainedMemory[]>([]);
  const [lessons, setLessons] = useState<LessonModel[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // New incident preset for demo flow
  const [presetData, setPresetData] = useState<{
    title: string;
    service: string;
    environment: string;
    severity: SeverityType;
    error_message: string;
    description: string;
    logs?: string;
  } | null>(null);

  const refreshAllData = async () => {
    try {
      const [statsData, incidentsData, memoriesData, lessonsData] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getIncidents().catch(() => []),
        api.getMemories().catch(() => []),
        api.getLessons().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setIncidents(incidentsData);
      setMemories(memoriesData);
      setLessons(lessonsData);
    } catch (err) {
      console.error('Error refreshing ResolveIQ data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Navigation handlers
  const handleOpenIncident = (incidentId: string) => {
    setActiveIncidentId(incidentId);
    setCurrentTab('investigation');
  };

  const handleIncidentCreated = (incidentId: string) => {
    setActiveIncidentId(incidentId);
    setCurrentTab('investigation');
    refreshAllData();
  };

  const handleSelectDemoIncident2 = () => {
    setPresetData({
      title: 'Payment API 502 recurring error',
      service: 'payment-api',
      environment: 'Production',
      severity: 'High',
      error_message: '502 Bad Gateway: Connection timeout',
      description:
        'Payment authorization endpoint dropped to 15% success rate. Repeated symptoms observed on payment-api.',
      logs: `[error] POST /v1/checkout -> 502 Bad Gateway\n[crit] database pool queue depth > 40`,
    });
    setCurrentTab('add-incident');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'add-incident') {
            setPresetData(null);
          }
        }}
        memoriesCount={memories.length}
        lessonsCount={lessons.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          onRefreshData={refreshAllData}
          memoriesCount={memories.length}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#090D16]">
          {loadingInitial ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-semibold text-slate-300">
                Initializing ResolveIQ &amp; Hindsight Engine...
              </div>
            </div>
          ) : currentTab === 'dashboard' ? (
            <DashboardPage
              stats={stats}
              recentIncidents={incidents}
              recentLessons={lessons}
              memories={memories}
              onNavigateToNewIncident={() => {
                setPresetData(null);
                setCurrentTab('add-incident');
              }}
              onNavigateToIncident={handleOpenIncident}
              onNavigateToMemory={() => setCurrentTab('memory')}
            />
          ) : currentTab === 'add-incident' || currentTab === 'new-incident' ? (
            <NewIncidentPage
              onIncidentCreated={handleIncidentCreated}
              presetData={presetData}
            />
          ) : currentTab === 'ai-solve' ? (
            <AISolveProblemPage
              onNavigateToIncident={handleOpenIncident}
              onNavigateToMemory={() => setCurrentTab('memory')}
              onRefreshData={refreshAllData}
            />
          ) : currentTab === 'investigation' && activeIncidentId ? (
            <InvestigationPage
              incidentId={activeIncidentId}
              onBackToIncidents={() => setCurrentTab('incidents')}
              onRefreshData={refreshAllData}
              onLaunchSimilarIncident={handleSelectDemoIncident2}
            />
          ) : currentTab === 'incidents' ? (
            <IncidentsPage
              incidents={incidents}
              onSelectIncident={handleOpenIncident}
              onNavigateToNewIncident={() => {
                setPresetData(null);
                setCurrentTab('add-incident');
              }}
            />
          ) : currentTab === 'memory' ? (
            <MemoryPage
              memories={memories}
              lessons={lessons}
              onRefreshData={refreshAllData}
            />
          ) : currentTab === 'lessons' ? (
            <LessonsPage lessons={lessons} />
          ) : currentTab === 'analytics' ? (
            <AnalyticsPage
              stats={stats}
              incidents={incidents}
              memories={memories}
            />
          ) : (
            <DashboardPage
              stats={stats}
              recentIncidents={incidents}
              recentLessons={lessons}
              memories={memories}
              onNavigateToNewIncident={() => {
                setPresetData(null);
                setCurrentTab('add-incident');
              }}
              onNavigateToIncident={handleOpenIncident}
              onNavigateToMemory={() => setCurrentTab('memory')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
