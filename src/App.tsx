import { useEffect, useState } from 'react'
import { CaseStudy } from './ui/CaseStudy'
import { Footer } from './ui/Footer'
import { Header } from './ui/Header'
import { Hero } from './ui/Hero'
import { HowItWorks } from './ui/HowItWorks'
import { PrivacySection } from './ui/PrivacySection'
import { ResultPanel } from './ui/ResultPanel'
import { SkipLink } from './ui/SkipLink'
import { Workbench } from './ui/Workbench'
import { DEFAULT_SCENARIO_ID, SCENARIOS, findScenario } from './fixtures/catalog'
import { useRun, type RunPhase } from './hooks/useRun'
import {
  buildExportPayload,
  exportPayloadToJson,
  exportPayloadToMarkdown,
} from './lib/exportReport'
import { downloadBlob } from './lib/download'
import { clearLocalData, isHistoryConsentGiven, setHistoryConsent } from './storage/localHistory'

const CUSTOM_SCENARIO_ID = 'custom-token'

export default function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(DEFAULT_SCENARIO_ID)
  const [token, setToken] = useState(() => findScenario(DEFAULT_SCENARIO_ID)?.token ?? '')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customConsentGiven, setCustomConsentGiven] = useState(false)
  const [expectedIssuer, setExpectedIssuer] = useState('')
  const [expectedAudience, setExpectedAudience] = useState('')
  const [historyConsent, setHistoryConsentState] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'done'>('idle')

  const run = useRun()

  useEffect(() => {
    setHistoryConsentState(isHistoryConsentGiven())
  }, [])

  function handleSelectScenario(id: string): void {
    setSelectedScenarioId(id)
    setToken(findScenario(id)?.token ?? '')
  }

  function handleToggleCustomMode(enabled: boolean): void {
    setIsCustomMode(enabled)
    if (enabled) {
      setToken('')
      setCustomConsentGiven(false)
      setExpectedIssuer('')
      setExpectedAudience('')
    } else {
      setToken(findScenario(selectedScenarioId)?.token ?? '')
    }
  }

  function handleExecute(): void {
    if (isCustomMode) {
      const policyOverrides: { expectedIssuer?: string; expectedAudience?: string } = {}
      if (expectedIssuer.trim().length > 0) policyOverrides.expectedIssuer = expectedIssuer.trim()
      if (expectedAudience.trim().length > 0)
        policyOverrides.expectedAudience = expectedAudience.trim()
      void run.execute({
        scenarioId: CUSTOM_SCENARIO_ID,
        token,
        ...(Object.keys(policyOverrides).length > 0 ? { policyOverrides } : {}),
      })
      return
    }
    void run.execute({ scenarioId: selectedScenarioId, token })
  }

  function handleExportJson(): void {
    if (!run.state.output) return
    const payload = buildExportPayload(run.state.output)
    downloadBlob(`jwt-lab-${payload.runId}.json`, exportPayloadToJson(payload), 'application/json')
  }

  function handleExportMarkdown(): void {
    if (!run.state.output) return
    const payload = buildExportPayload(run.state.output)
    downloadBlob(`jwt-lab-${payload.runId}.md`, exportPayloadToMarkdown(payload), 'text/markdown')
  }

  function handleHistoryConsentChange(consent: boolean): void {
    setHistoryConsent(consent)
    setHistoryConsentState(consent)
    setDeleteStatus('idle')
  }

  function handleDeleteLocalData(): void {
    void clearLocalData().then(() => {
      setHistoryConsentState(false)
      setDeleteStatus('done')
    })
  }

  function scrollToWorkbench(): void {
    document
      .getElementById('workbench-heading')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="app-shell">
      <SkipLink />
      <Header />
      <main id="main-content">
        <Hero onPrimaryAction={scrollToWorkbench} />

        <div className="container">
          <div className="workbench">
            <Workbench
              scenarios={SCENARIOS}
              selectedScenarioId={selectedScenarioId}
              onSelectScenario={handleSelectScenario}
              token={token}
              onTokenChange={setToken}
              isCustomMode={isCustomMode}
              onToggleCustomMode={handleToggleCustomMode}
              customConsentGiven={customConsentGiven}
              onCustomConsentChange={setCustomConsentGiven}
              expectedIssuer={expectedIssuer}
              onExpectedIssuerChange={setExpectedIssuer}
              expectedAudience={expectedAudience}
              onExpectedAudienceChange={setExpectedAudience}
              phase={run.state.phase}
              onExecute={handleExecute}
              onCancel={run.cancel}
            />
            <ResultPanel
              phase={run.state.phase}
              output={run.state.output}
              errorMessage={run.state.errorMessage}
              onExportJson={handleExportJson}
              onExportMarkdown={handleExportMarkdown}
            />
          </div>
        </div>

        <div aria-live="polite" className="visually-hidden">
          {runAnnouncement(run.state.phase)}
        </div>

        <HowItWorks />
        <PrivacySection
          historyConsent={historyConsent}
          onHistoryConsentChange={handleHistoryConsentChange}
          onDeleteLocalData={handleDeleteLocalData}
          deleteStatus={deleteStatus}
        />
        <CaseStudy />
      </main>
      <Footer />
    </div>
  )
}

function runAnnouncement(phase: RunPhase): string {
  switch (phase) {
    case 'processing':
      return 'Procesando la ejecución.'
    case 'completed':
      return 'Ejecución completada. Revisa el resultado.'
    case 'cancelled':
      return 'Ejecución cancelada.'
    case 'error':
      return 'Ocurrió un error al procesar la entrada.'
    case 'idle':
    default:
      return ''
  }
}
