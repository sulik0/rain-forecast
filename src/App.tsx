import { useState } from 'react'
import { ToastProvider } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { Sidebar } from '@/components/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import { CitiesPage } from '@/pages/CitiesPage'
import { DataSourcesPage } from '@/pages/DataSourcesPage'
import { NotificationPage } from '@/pages/NotificationPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { LoginPage } from '@/pages/LoginPage'
import { useScheduler } from '@/hooks/useScheduler'
import { useAuth, type UserAccount } from '@/hooks/useAuth'
import {
  useCities,
  useDataSources,
  useNotification,
  useAlertHistory,
  useWeatherData
} from '@/hooks/useStore'

function AuthenticatedApp({
  currentUser,
  onLogout,
}: {
  currentUser: UserAccount
  onLogout: () => void
}) {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const { cities, addCity, removeCity } = useCities(currentUser.id)
  const { dataSources, updateSource, normalizeWeights } = useDataSources(currentUser.id)
  const { config, updateConfig, updateSchedule } = useNotification(currentUser.id)
  const { alerts, clearAlerts } = useAlertHistory(currentUser.id)
  const {
    weatherData,
    loading,
    fetchWeatherData,
    calculateWeightedProbability
  } = useWeatherData(cities, dataSources)

  // 定时通知调度器
  const {
    nextNotificationTime,
    timeRemaining,
    lastCheckTime,
  } = useScheduler({
    userId: currentUser.id,
    cities,
    weatherDataMap: weatherData,
    config,
    calculateWeightedProbability,
  })

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            cities={cities}
            dataSources={dataSources}
            weatherData={weatherData}
            threshold={config.threshold}
            loading={loading}
            notificationConfig={config}
            onRefresh={fetchWeatherData}
            calculateWeightedProbability={calculateWeightedProbability}
          />
        )
      case 'cities':
        return (
          <CitiesPage
            cities={cities}
            onAddCity={addCity}
            onRemoveCity={removeCity}
          />
        )
      case 'sources':
        return (
          <DataSourcesPage
            dataSources={dataSources}
            onUpdateSource={updateSource}
            onNormalizeWeights={normalizeWeights}
          />
        )
      case 'notification':
        return (
          <NotificationPage
            config={config}
            onUpdateConfig={updateConfig}
            onUpdateSchedule={updateSchedule}
            nextNotificationTime={nextNotificationTime}
            timeRemaining={timeRemaining}
            lastCheckTime={lastCheckTime}
          />
        )
      case 'history':
        return (
          <HistoryPage
            alerts={alerts}
            onClearAlerts={clearAlerts}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        currentUserName={currentUser.name}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
      <ToastContainer />
    </div>
  )
}

function AppContent() {
  const { users, currentUser, loginUser, registerUser, logout } = useAuth()

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <LoginPage
          users={users}
          onLogin={loginUser}
          onRegister={registerUser}
        />
        <ToastContainer />
      </div>
    )
  }

  return <AuthenticatedApp currentUser={currentUser} onLogout={logout} />
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App
