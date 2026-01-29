import { useState } from 'react'
import { ToastProvider } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { Sidebar } from '@/components/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import { CitiesPage } from '@/pages/CitiesPage'
import { DataSourcesPage } from '@/pages/DataSourcesPage'
import { NotificationPage } from '@/pages/NotificationPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { useScheduler } from '@/hooks/useScheduler'
import {
  useCities,
  useDataSources,
  useNotification,
  useAlertHistory,
  useWeatherData
} from '@/hooks/useStore'

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const { cities, addCity, removeCity } = useCities()
  const { dataSources, updateSource, normalizeWeights } = useDataSources()
  const { config, updateConfig, updateSchedule } = useNotification()
  const { alerts, clearAlerts } = useAlertHistory()
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
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
      <ToastContainer />
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App
