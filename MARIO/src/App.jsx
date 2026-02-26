import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Landing from "./pages/landing.jsx"

function App() {
  return (
    <>
     <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route index element={<Landing />} />

        <Route path="landing" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </>
  )
}

export default App;
