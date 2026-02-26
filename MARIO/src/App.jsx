import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard.jsx"

function App() {
  return (
    <>
     <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route index element={<Dashboard />} />

        <Route path="dashboard" element={<Dashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </>
  )
}

export default App;
