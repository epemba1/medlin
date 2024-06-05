import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, FormControl, Skeleton, Snackbar, Button, IconButton, Alert, AlertTitle, Paper } from '@mui/material';
import Select from 'react-select';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const SelectionActivite = () => {
  const [data, setData] = useState(null);
  const [selectedSection, setSelectedSection] = useState(localStorage.getItem('selectedSection') ? JSON.parse(localStorage.getItem('selectedSection')) : null);
  const [selectedDivision, setSelectedDivision] = useState(localStorage.getItem('selectedDivision') ? JSON.parse(localStorage.getItem('selectedDivision')) : null);
  const [selectedGroup, setSelectedGroup] = useState(localStorage.getItem('selectedGroup') ? JSON.parse(localStorage.getItem('selectedGroup')) : null);
  const [selectedClass, setSelectedClass] = useState(localStorage.getItem('selectedClass') ? JSON.parse(localStorage.getItem('selectedClass')) : null);
  const [selectedSubclass, setSelectedSubclass] = useState(localStorage.getItem('selectedSubclass') ? JSON.parse(localStorage.getItem('selectedSubclass')) : null);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [firstVisit, setFirstVisit] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      axios.get('/nafData.json')
        .then(response => {
          setData(response.data);
          setLoading(false);
          setFirstVisit(false);
        })
        .catch(error => {
          setLoading(false);
          setAlertMessage('Erreur de chargement des données');
          setOpenSnackbar(true);
        });
    }, 200);
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedSection', JSON.stringify(selectedSection));
    localStorage.setItem('selectedDivision', JSON.stringify(selectedDivision));
    localStorage.setItem('selectedGroup', JSON.stringify(selectedGroup));
    localStorage.setItem('selectedClass', JSON.stringify(selectedClass));
    localStorage.setItem('selectedSubclass', JSON.stringify(selectedSubclass));
  }, [selectedSection, selectedDivision, selectedGroup, selectedClass, selectedSubclass]);

  const handleSectionChange = (selectedOption) => {
    setSelectedSection(selectedOption);
    setSelectedDivision(null);
    setSelectedGroup(null);
    setSelectedClass(null);
    setSelectedSubclass(null);
  };

  const handleDivisionChange = (selectedOption) => {
    setSelectedDivision(selectedOption);
    setSelectedGroup(null);
    setSelectedClass(null);
    setSelectedSubclass(null);
  };

  const handleGroupChange = (selectedOption) => {
    setSelectedGroup(selectedOption);
    setSelectedClass(null);
    setSelectedSubclass(null);
  };

  const handleClassChange = (selectedOption) => {
    setSelectedClass(selectedOption);
    setSelectedSubclass(null);
  };

  const handleSubclassChange = (selectedOption) => {
    setSelectedSubclass(selectedOption);
    console.log('Sous-classe sélectionnée:', selectedOption); // Ajouter un log ici pour vérifier
  };

  const handleDeleteActivity = () => {
    setSelectedSection(null);
    setSelectedDivision(null);
    setSelectedGroup(null);
    setSelectedClass(null);
    setSelectedSubclass(null);
  };

  const handleNext = () => {
    if (!selectedSection || !selectedDivision || !selectedGroup || !selectedClass || !selectedSubclass) {
      setAlertMessage('Veuillez sélectionner toutes les options avant de continuer.');
      setOpenSnackbar(true);
    } else {
      setAlertMessage('');
      localStorage.setItem('selectedNAF', selectedSubclass.value || '');
      navigate('/localisation-implantation');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (loading && firstVisit) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom style={{ color: '#286AC7' }}>
          <Skeleton width="60%" />
        </Typography>
        <Box component="form" marginTop={2}>
          <Grid container spacing={3}>
            {[...Array(5)].map((_, index) => (
              <Grid item xs={12} key={index}>
                <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                  <Skeleton width="40%" />
                </Typography>
                <FormControl fullWidth>
                  <Skeleton variant="rectangular" height={56} />
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  const subclassesOptions = data?.subclasses?.[selectedClass?.value] || [];

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
        <Typography variant="h4" gutterBottom>
          Sélection de l'Activité
        </Typography>
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

      {selectedSubclass && (
        <Paper elevation={0} style={{ padding: '4px 8px', marginBottom: '16px', width: 'fit-content', border: '1px solid #ccc',  
          borderLeft: '5px solid blue' }}>
          <Box display="flex" alignItems="center">
            <Typography variant="caption" style={{ marginRight: '8px' }}>
              <span style={{ color: '#286AC7' }}>Vous avez choisi l'activité</span> : {selectedSubclass.label}
            </Typography>
            <IconButton onClick={handleDeleteActivity} size="small" style={{ color: 'grey' }}>
              <CloseIcon fontSize="small" style={{ fontSize: '16px',  }} />
            </IconButton>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={alertMessage}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      <br />
      <Alert variant="outlined" severity="info" >
        <AlertTitle>Veuillez choisir ci-dessous l'activité souhaitée.</AlertTitle>
        Les menus se mettront à jour en fonction de votre choix précédent.
      </Alert>
      <Box component="form" marginTop={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
              Section
            </Typography>
            <FormControl fullWidth>
              <Select
                value={selectedSection}
                onChange={handleSectionChange}
                options={data.sections}
                placeholder="Sélectionnez une section"
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                  }),
                }}
              />
            </FormControl>
          </Grid>

          {selectedSection && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Division
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedDivision}
                  onChange={handleDivisionChange}
                  options={data.divisions[selectedSection.value] || []}
                  placeholder="Sélectionnez une division"
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                    }),
                  }}
                />
              </FormControl>
            </Grid>
          )}

          {selectedDivision && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Groupe
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  options={data.groups[selectedDivision.value] || []}
                  placeholder="Sélectionnez un groupe"
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                    }),
                  }}
                />
              </FormControl>
            </Grid>
          )}

          {selectedGroup && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Classe
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedClass}
                  onChange={handleClassChange}
                  options={data.classes[selectedGroup.value] || []}
                  placeholder="Sélectionnez une classe"
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                    }),
                  }}
                />
              </FormControl>
            </Grid>
          )}

          {selectedClass && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Sous-classe
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedSubclass}
                  onChange={handleSubclassChange}
                  options={subclassesOptions}
                  placeholder="Sélectionnez une sous-classe"
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                    }),
                  }}
                />
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default SelectionActivite;
