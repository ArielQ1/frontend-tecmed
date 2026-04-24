import { Route, Routes } from "react-router"
import { Home } from "./pages/Home"
import { LoginDocente } from "./pages/Docente_login"
import { PortalDocente } from "./pages/Docente_index"
import { PortalEstudiante } from "./pages/Estudiante_index"
import { DashboardDocente } from "./pages/Docente_dashboard"

function App() {

  return (
    <Routes>
      <Route path="/" element={<Home />}></Route>
      {/* docente */}
      <Route path="/logindocente" element={<LoginDocente />}></Route>
      <Route path="/indexdocente" element={<PortalDocente />}></Route>
      <Route path="/dashdocente" element={<DashboardDocente />}></Route>
      {/* estudiante */}
      <Route path="/indexestudiante" element={<PortalEstudiante />}></Route>
      
    </Routes>
  )
}

export default App
