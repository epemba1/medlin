import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Tab, Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import DownloadIcon from '@mui/icons-material/Download';
import Population from './Population';
import Menage from './Menage';
import Activité from './Activité';
import Logement from './Logement';
import Formation from './Formation';

const HeaderContainer = styled(Box)(({ theme }) => ({
  backgroundColor: '#286AC7',
  paddingTop: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingRight: theme.spacing(2),
  color: 'white',
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  width: '100%',
  justifyContent: 'space-between',
  display: 'flex',
  backgroundColor: '#f5f5f5',
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '1rem',
  flexGrow: 1,
  maxWidth: 'none',
  color: '#000080',
  '&:hover': {
    backgroundColor: '#d3d3d3',
  },
  '&.Mui-selected': {
    color: 'blue',
  },
}));

const PopulationTab = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCommunes, setSelectedCommunes] = useState([]);
  const populationRef = useRef();
  const menageRef = useRef();

  useEffect(() => {
    const communes = JSON.parse(localStorage.getItem('selectedCommunes')) || [];
    setSelectedCommunes(communes.map(commune => commune.value));
  }, []);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleDownload = () => {
    // Implement your download functionality here
  };

  return (
    <Box>
      <HeaderContainer>
        <Typography variant="h5" gutterBottom style={{ marginBottom: '40px', marginLeft: '40px' }}>
          Données Statistiques Population
        </Typography>
        <IconButton 
          onClick={handleDownload}
          style={{
            color: 'white',
            marginBottom: '40px',
            display: 'flex',
            alignItems: 'center',
            transition: 'background-color 0.3s, color 0.3s',
            padding: '5px 10px',
            borderRadius: '5px',
            
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.color = 'white';
          }}
        >
          <DownloadIcon style={{fontSize: '20px'}}/>
          <span style={{ fontSize: '17px', marginLeft: '9px' }}>Télécharger</span>
        </IconButton>
      </HeaderContainer>
      <StyledTabs value={selectedTab} onChange={handleChange}>
        <StyledTab label="Population" />
        <StyledTab label="Ménage" />
        <StyledTab label="Activité/Emploi" />
        <StyledTab label="Logement" />
        <StyledTab label="Diplômes/Formation" />
      </StyledTabs>
      <Box style={{ paddingTop: '20px', paddingBottom: '20px', paddingRight: '20px', borderRight: '1px solid #f5f5f5', borderLeft: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
        {selectedTab === 0 && <Population communeCodes={selectedCommunes} ref={populationRef} />}
        {selectedTab === 1 && <Menage communeCodes={selectedCommunes} ref={menageRef} />}
        {selectedTab === 2 && <Activité communeCodes={selectedCommunes} ref={menageRef} />}
        {selectedTab === 3 && <Logement communeCodes={selectedCommunes} ref={menageRef} />}
        {selectedTab === 4  && <Formation communeCodes={selectedCommunes}  />}
      </Box>
    </Box>
  );
};

export default PopulationTab;
