import React, { useEffect, useState, useRef } from 'react';
import { Container, Paper, Typography, Box, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import PopulationTab from './PopulationTab';
import EntreprisesTab from './EntreprisesTab';
import GetAppIcon from '@mui/icons-material/GetApp';
import * as XLSX from 'xlsx';

const SyntheseRecherche = () => {
  const [selectedNAF, setSelectedNAF] = useState('');
  const [selectedCommunes, setSelectedCommunes] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const populationRef = useRef();
  const entreprisesRef = useRef();

  useEffect(() => {
    const naf = localStorage.getItem('selectedNAF');
    const communes = JSON.parse(localStorage.getItem('selectedCommunes')) || [];
    setSelectedNAF(naf || '');
    setSelectedCommunes(communes || []);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleDownload = () => {
    const populationData = populationRef.current ? populationRef.current.getPopulationData() : [];
    const entreprisesData = entreprisesRef.current ? entreprisesRef.current.getEntreprisesData() : [];

    console.log("Population Data for export:", populationData);
    console.log("Entreprises Data for export:", entreprisesData);

    const workbook = XLSX.utils.book_new();
    const populationSheet = XLSX.utils.json_to_sheet(populationData);
    XLSX.utils.book_append_sheet(workbook, populationSheet, "Population");
    const entreprisesSheet = XLSX.utils.json_to_sheet(entreprisesData);
    XLSX.utils.book_append_sheet(workbook, entreprisesSheet, "Entreprises");

    XLSX.writeFile(workbook, "Medl'In.xlsx");
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Synthèse de la recherche</Typography>
      <Typography variant="body1" paragraph style={{ marginTop: '20px' }}>
        Veuillez trouver ci-dessous les résultats issus de votre étude.
      </Typography>
      <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }}>
        <Typography variant="h6" gutterBottom>Activité choisie :</Typography>
        <Typography variant="body1">{selectedNAF || 'Aucune activité choisie'}</Typography>
      </Paper>
      <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }}>
        <Typography variant="h6" gutterBottom>Communes choisies :</Typography>
        <Typography variant="body1">
          {selectedCommunes.length > 0 ? selectedCommunes.map(commune => commune.value).join(', ') : 'Aucune commune choisie'}
        </Typography>
      </Paper>

      <Box marginTop={10} position="relative">
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange} 
          variant="standard"
          textColor="primary"
          TabIndicatorProps={{ style: { display: 'none' } }}
        >
          <Tab 
            label="Population" 
            style={{ 
              backgroundColor: tabIndex === 0 ? 'transparent' : '#f5f5f5', 
              textTransform: 'none', 
              borderBottom: '2px solid', 
              borderColor: tabIndex === 0 ? '#286AC7' : 'transparent',
              alignSelf: 'flex-start',
              fontSize: '20px' 
            }} 
          />
          <Tab 
            label="Entreprises" 
            style={{ 
              backgroundColor: tabIndex === 1 ? 'transparent' : '#f5f5f5', 
              textTransform: 'none', 
              borderBottom: '2px solid', 
              borderColor: tabIndex === 1 ? '#286AC7' : 'transparent',
              alignSelf: 'flex-start',
              fontSize: '20px'  
            }} 
          />
        </Tabs>
        <Tooltip title="Exporter les données">
          <IconButton
            style={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              border: '1px solid lightgrey',  // Ajoute la bordure ici
            }}
            onClick={handleDownload}
          >
            <GetAppIcon />
          </IconButton>
        </Tooltip>
        <Box padding={2} border={1} borderColor="divider" borderRadius={2} marginTop={1} backgroundColor="white" height={600} overflow="auto">
          {tabIndex === 0 && <PopulationTab ref={populationRef} />}
          {tabIndex === 1 && <EntreprisesTab ref={entreprisesRef} selectedNAF={selectedNAF} selectedCommunes={selectedCommunes} />}
        </Box>
      </Box>
    </Container>
  );
};

export default SyntheseRecherche;
