import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, FormControl, Skeleton, Snackbar, Chip, Button, IconButton, Alert, AlertTitle } from '@mui/material';
import Select from 'react-select';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SelectionActivite = () => {
  const [data, setData] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSubclass, setSelectedSubclass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      axios.get('/nafData.json')
        .then(response => {
          setData(response.data);
          setLoading(false);
        })
        .catch(error => console.error('Error loading data:', error));
    }, 2000);

    const savedSelectedSection = localStorage.getItem('selectedSection');
    const savedSelectedDivision = localStorage.getItem('selectedDivision');
    const savedSelectedGroup = localStorage.getItem('selectedGroup');
    const savedSelectedClasses = localStorage.getItem('selectedClasses');
    const savedSelectedSubclass = localStorage.getItem('selectedSubclass');
    const savedSelectedActivities = localStorage.getItem('selectedActivities');

    if (savedSelectedSection) setSelectedSection(JSON.parse(savedSelectedSection));
    if (savedSelectedDivision) setSelectedDivision(JSON.parse(savedSelectedDivision));
    if (savedSelectedGroup) setSelectedGroup(JSON.parse(savedSelectedGroup));
    if (savedSelectedClasses) setSelectedClasses(JSON.parse(savedSelectedClasses));
    if (savedSelectedSubclass) setSelectedSubclass(JSON.parse(savedSelectedSubclass));
    if (savedSelectedActivities) setSelectedActivities(JSON.parse(savedSelectedActivities));
  }, []);

  const saveToLocalStorage = () => {
    localStorage.setItem('selectedSection', JSON.stringify(selectedSection));
    localStorage.setItem('selectedDivision', JSON.stringify(selectedDivision));
    localStorage.setItem('selectedGroup', JSON.stringify(selectedGroup));
    localStorage.setItem('selectedClasses', JSON.stringify(selectedClasses));
    localStorage.setItem('selectedSubclass', JSON.stringify(selectedSubclass));
    localStorage.setItem('selectedActivities', JSON.stringify(selectedActivities));
  };

  const handleSectionChange = (selectedOption) => {
    setSelectedSection(selectedOption);
    setSelectedDivision(null);
    setSelectedGroup(null);
    setSelectedClasses([]);
    setSelectedSubclass(null);
    updateSelectedActivities(selectedOption);
    saveToLocalStorage();
  };

  const handleDivisionChange = (selectedOption) => {
    setSelectedDivision(selectedOption);
    setSelectedGroup(null);
    setSelectedClasses([]);
    setSelectedSubclass(null);
    updateSelectedActivities(selectedOption);
    saveToLocalStorage();
  };

  const handleGroupChange = (selectedOption) => {
    setSelectedGroup(selectedOption);
    setSelectedClasses([]);
    setSelectedSubclass(null);
    updateSelectedActivities(selectedOption);
    saveToLocalStorage();
  };

  const handleClassChange = (selectedOptions) => {
    setSelectedClasses(selectedOptions);
    setSelectedSubclass(null);
    updateSelectedActivities(selectedOptions);
    saveToLocalStorage();
  };

  const handleSubclassChange = (selectedOption) => {
    setSelectedSubclass(selectedOption);
    updateSelectedActivities(selectedOption);
    saveToLocalStorage();
  };

  const updateSelectedActivities = (option) => {
    if (Array.isArray(option)) {
      const uniqueOptions = option.filter(
        (opt) => !selectedActivities.some(activity => activity.value === opt.value)
      );
      setSelectedActivities([...selectedActivities, ...uniqueOptions]);
    } else {
      const alreadySelected = selectedActivities.some(activity => activity.value === option.value);
      if (!alreadySelected) {
        setSelectedActivities([...selectedActivities, option]);
      }
    }
    saveToLocalStorage();
  };

  const handleDeleteActivity = (activityToDelete) => {
    setSelectedActivities(selectedActivities.filter(activity => activity.value !== activityToDelete.value));
    saveToLocalStorage();
  };

  const handleNext = () => {
    if (!selectedSection || !selectedDivision || !selectedGroup || selectedClasses.length === 0 || !selectedSubclass) {
      setAlertMessage('Veuillez sélectionner toutes les options avant de continuer.');
      setOpenSnackbar(true);
    } else {
      setAlertMessage('');
      navigate('/localisation-implantation');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  if (loading) {
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
            startIcon={<ArrowBackIcon />}
            style={{ marginRight: 10 }}
          >
            Retour
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            endIcon={<NavigateNextIcon />}
          >
            Suivant
          </Button>
        </Box>
      </Box>
      {selectedActivities.length > 0 && (
        <Box marginTop={2}>
          <Typography variant="h6">
            Vous avez choisi les activités:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedActivities.map(activity => (
              <Chip
                key={activity.value}
                label={activity.label}
                style={{ backgroundColor: 'white', color: 'blue', borderColor: 'blue' }}
                onDelete={() => handleDeleteActivity(activity)}
                deleteIcon={<span style={{ color: 'grey' }}>×</span>}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
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
      <Alert variant="outlined" severity="info">
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
                  value={selectedClasses}
                  onChange={handleClassChange}
                  options={data.classes[selectedGroup.value] || []}
                  placeholder="Sélectionnez une classe"
                  isMulti
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

          {selectedClasses.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Sous-classe
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedSubclass}
                  onChange={handleSubclassChange}
                  options={data.subclasses[selectedClasses.map(cls => cls.value)] || []}
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
