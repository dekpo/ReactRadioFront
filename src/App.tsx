import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './features/home/HomePage'
import { SchedulePage } from './features/schedule/SchedulePage'
import { LibraryPage } from './features/library/LibraryPage'
import { PrivacyPolicyPage } from './features/legal/PrivacyPolicyPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/planning" element={<SchedulePage />} />
        <Route path="/bibliotheque" element={<LibraryPage />} />
        <Route path="/confidentialite" element={<PrivacyPolicyPage />} />
      </Route>
    </Routes>
  )
}

export default App
