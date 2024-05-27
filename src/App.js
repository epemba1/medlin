import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CssBaseline, Drawer } from '@mui/material';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import SelectionActivite from './pages/SelectionActivite';
import LocalisationImplantation from './pages/LocalisationImplantation';
import SyntheseRecherche from './pages/SyntheseRecherche';
import Aide from './pages/Aide';
import './styles.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <CssBaseline />
      <Header toggleSidebar={toggleSidebar} />
      <div style={{ display: 'flex', marginTop: 64, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Drawer variant="persistent" open={sidebarOpen}>
          <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        </Drawer>
        <div style={{ flex: 1, padding: '20px', marginLeft: sidebarOpen ? 280 : 64, transition: 'margin-left 0.3s' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/selection-activite" element={<SelectionActivite />} />
            <Route path="/localisation-implantation" element={<LocalisationImplantation />} />
            <Route path="/synthese-recherche" element={<SyntheseRecherche />} />
            <Route path="/aide" element={<Aide />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
