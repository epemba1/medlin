import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Tabs, Tab, Button, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PopulationTab from './PopulationTab';
import EntreprisesTab from './EntreprisesTab';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

//Hook
const SyntheseRecherche = () => {
  const [selectedNAF, setSelectedNAF] = useState('');
  const [selectedNAF1, setSelectedNAF1] = useState('');
  const [selectedCommunes, setSelectedCommunes] = useState([]);
  const [selectedCommuneNames, setSelectedCommuneNames] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedDepartementNames, setSelectedDepartementNames] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  const navigate = useNavigate();

  //Fetch and save the data
  useEffect(() => {
    const naf = localStorage.getItem('selectedNAF');
    const naf1 = localStorage.getItem('selectedNAF1');
    const communes = JSON.parse(localStorage.getItem('selectedCommunes')) || [];
    const communeNames = JSON.parse(localStorage.getItem('selectedCommuneNames')) || [];
    const departments = JSON.parse(localStorage.getItem('selectedDepartments')) || [];
    const departmentNames = JSON.parse(localStorage.getItem('selectedDepartementNames')) || [];
    console.log('Loaded communes from localStorage:', communes);
    console.log('Loaded commune names from localStorage:', communeNames);
    console.log('Loaded departments from localStorage:', departments);
    console.log('Loaded department names from localStorage:', departmentNames);
    setSelectedNAF(naf ? naf.split(',') : []);
    setSelectedNAF1(naf1 ? naf1.split(',') : []);
    setSelectedCommunes(communes);
    setSelectedCommuneNames(communeNames);
    setSelectedDepartments(departments);
    setSelectedDepartementNames(departmentNames);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleBack = () => {
    navigate('/localisation-implantation'); 
  };

  const handleNext = () => {
    navigate('/Aide');
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
        <Typography variant="h4" gutterBottom>Synthèse de la recherche</Typography>
        <Box display="flex" alignItems="center">
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<NavigateBeforeIcon />}
            style={{ marginRight: 10, borderRadius: '8px', textTransform: 'none' }}
          >
            Retour
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            endIcon={<NavigateNextIcon />}
            style={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Suivant
          </Button>
        </Box>
      </Box>
      <Typography variant="body1" paragraph style={{ marginTop: '20px' }}>
        Veuillez trouver ci-dessous les résultats issus de votre étude.
      </Typography>
      <Paper elevation={1} style={{ padding: '16px', marginBottom: '16px' }}>
        <Typography variant="h6" gutterBottom>Activité choisie :</Typography>
        <Typography variant="body1">{selectedNAF1.length > 0 ? selectedNAF1.join(', ') : 'Aucune activité choisie'}</Typography>
      </Paper>
      <Paper elevation={1} style={{ padding: '16px', marginBottom: '16px' }}>
        <Typography variant="h6" gutterBottom>Département(s) choisi(s) :</Typography>
        {selectedDepartments.length > 0 && (
          <>
            <Typography variant="body1">
          {selectedDepartementNames.length > 0 ? selectedDepartementNames.join(' - ') : 'Aucun département choisi'}
        </Typography>
          </>
        )}
        {selectedCommunes.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>Commune(s) choisie(s) :</Typography>
            <Typography variant="body1">
              {selectedCommuneNames.length > 0 ? selectedCommuneNames.join(' - ') : 'Aucune commune choisie'}
            </Typography>
          </>
        )}
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
        <Divider style={{ marginTop: '16px' }} />
      </Box>
      {tabIndex === 0 && (
        <div style={{ backgroundColor: 'white', marginTop: '16px', padding: '16px' }}>
          <PopulationTab />
        </div>
      )}
      {tabIndex === 1 && (
        <div style={{ backgroundColor: 'white', marginTop: '16px', padding: '16px' }}>
          <EntreprisesTab selectedNAF={selectedNAF} selectedCommunes={selectedCommunes} />
        </div>
      )}
    </Container>
  );
};

export default SyntheseRecherche;
