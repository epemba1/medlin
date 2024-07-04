import React, { useState, useEffect, useRef } from 'react';
import { Tabs, Tab, Box, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import DownloadIcon from '@mui/icons-material/Download';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const contentRef = useRef(null);

  useEffect(() => {
    const communes = JSON.parse(localStorage.getItem('selectedCommunes')) || [];
    setSelectedCommunes(communes.map(commune => commune.value));
  }, []);
  useEffect(() => {
    const departments = JSON.parse(localStorage.getItem('selectedDepartments')) || [];
    setSelectedDepartments(departments.map(department => department.value));
  }, []);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleDownload = async () => {
    const content = contentRef.current;
    const downloadButton = document.getElementById('download-button');
  
    if (content) {
      // Hide the download button before capturing
      if (downloadButton) {
        downloadButton.style.display = 'none';
      }
  
      // Capture the content
      const canvas = await html2canvas(content, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;
  
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
  
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
  
      // Restore the download button after capturing
      if (downloadButton) {
        downloadButton.style.display = 'flex';
      }
  
       // Determine the filename based on the selected tab
       const tabNames = ["Population", "Ménage", "Activité", "Logement", "Formation"];
       const fileName = `${tabNames[selectedTab]}_RP 2020.pdf`;

       pdf.save(fileName);
    }
  };
  

  return (
    <Box ref={contentRef}>
      <HeaderContainer>
        <Typography variant="h5" gutterBottom style={{ marginBottom: '40px', marginLeft: '40px' }}>
          Données Statistiques Population
        </Typography>
        <IconButton 
  id="download-button"
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
        {selectedTab === 0 && <Population communeCodes={selectedCommunes} departmentCodes={selectedDepartments}  />}
        {selectedTab === 1 && <Menage communeCodes={selectedCommunes} departmentCodes={selectedDepartments}  />}
        {selectedTab === 2 && <Activité communeCodes={selectedCommunes} departmentCodes={selectedDepartments}  />}
        {selectedTab === 3 && <Logement communeCodes={selectedCommunes} departmentCodes={selectedDepartments} />}
        {selectedTab === 4  && <Formation communeCodes={selectedCommunes} departmentCodes={selectedDepartments}  />}
      </Box>
    </Box>
  );
};

export default PopulationTab;
