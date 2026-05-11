// import { useState, type JSX } from "react";
// import "./style/global.css";

// import { Sidebar, NAV_GROUPS } from "./components/Slidebar.tsx";
// import { LoginPanel, LogoutPanel } from "./panels/AuthPanels.tsx";
// import { UsuariosPanel, EstudiantesPanel } from "./panels/AdminPanels.tsx";
// import {
//   MisMateriasPanel,
//   EstudiantesMateriaPanel,
//   VerParcialesPanel,
//   CrearParcialPanel,
//   EditarParcialPanel,
//   EliminarParcialPanel,
//   BulkInscritosPanel,
//   BulkNotasPanel,
// } from "./panels/DocentePanels.tsx";
// import { ConsultaNotasPanel } from "./panels/EstudiantePanels.tsx";
// import { API } from "../api/client.tsx";

// const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

// export function Home() {
//   const [token, setToken]     = useState("");
//   const [section, setSection] = useState("login");

//   const activeLabel = ALL_ITEMS.find((i) => i.key === section)?.label ?? "";

//   const panels: Record<string, JSX.Element> = {
//     login:           <LoginPanel onToken={setToken} hasToken={!!token} />,
//     logout:          <LogoutPanel onLogout={() => setToken("")} />,
//     usuarios:        <UsuariosPanel />,
//     estudiantes:     <EstudiantesPanel />,
//     misMaterias:     <MisMateriasPanel token={token} />,
//     estMateria:      <EstudiantesMateriaPanel token={token} />,
//     parciales:       <VerParcialesPanel token={token} />,
//     crearParcial:    <CrearParcialPanel token={token} />,
//     editarParcial:   <EditarParcialPanel token={token} />,
//     eliminarParcial: <EliminarParcialPanel token={token} />,
//     bulkInscritos:   <BulkInscritosPanel token={token} />,
//     bulkNotas:       <BulkNotasPanel token={token} />,
//     consultaNotas:   <ConsultaNotasPanel />,
//   };

//   return (
//     <div className="app">
//       <Sidebar section={section} onSelect={setSection} hasToken={!!token} />

//       <main className="main">
//         <div className="topbar">
//           <div className="topbar-title">{activeLabel}</div>
//           <div className="topbar-hint">API: {API}</div>
//         </div>
//         <div className="content">
//           {panels[section]}
//         </div>
//       </main>
//     </div>
//   );
// }