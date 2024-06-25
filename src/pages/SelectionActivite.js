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
  const [selectedSubclasses, setSelectedSubclasses] = useState(localStorage.getItem('selectedSubclasses') ? JSON.parse(localStorage.getItem('selectedSubclasses')) : []);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/nafData.json')
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(error => {
        setLoading(false);
        setAlertMessage('Erreur de chargement des données');
        setOpenSnackbar(true);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedSubclasses', JSON.stringify(selectedSubclasses));
  }, [selectedSubclasses]);

  const handleSubclassChange = (selectedOptions) => {
    setSelectedSubclasses(selectedOptions);
  };

  const handleDeleteActivity = () => {
    setSelectedSubclasses([]);
  };

  //Transfer the selected NAF and navigate next
  const handleNext = () => {
    if (selectedSubclasses.length === 0) {
      setAlertMessage('Veuillez sélectionner au moins une sous-classe avant de continuer.');
      setOpenSnackbar(true);
    } else {
      setAlertMessage('');
      const selectedNAFValues = selectedSubclasses.map(subclass => subclass.value).join(',');
      const selectedNAFLabels = selectedSubclasses.map(subclass => subclass.label).join(',');
      localStorage.setItem('selectedNAF', selectedNAFValues);
      localStorage.setItem('selectedNAF1', selectedNAFLabels);
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

  const subclassesOptions = Object.values(data?.subclasses || {}).flat();

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
        <Typography variant="h4" gutterBottom>
          Sélection de l'activité
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

      {selectedSubclasses.length > 0 && (
        <Paper elevation={0} style={{ padding: '4px 8px', marginBottom: '16px', width: 'fit-content', border: '1px solid #ccc', borderLeft: '5px solid blue' }}>
          <Box display="flex" alignItems="center">
            <Typography variant="caption" style={{ marginRight: '8px' }}>
              <span style={{ color: '#286AC7', fontSize: '14px'}}>Vous avez choisi l'activité</span> : {selectedSubclasses.map(subclass => subclass.label).join(', ')}
            </Typography>
            <IconButton onClick={handleDeleteActivity} size="small" style={{ color: 'grey' }}>
              <CloseIcon fontSize="small" style={{ fontSize: '16px' }} />
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
      <Alert variant="outlined" severity="info">
        <AlertTitle>Veuillez choisir ci-dessous l'activité souhaitée.</AlertTitle>
        La <span style={{ color: '#286AC7' }}>Nomenclature d'Activités Française (NAF)</span> est une classification officielle utilisée pour répertorier les activités économiques en France. 
        Principalement utilisée à des fins statistiques, elle permet d'organiser et d'analyser l'information économique et sociale. 
        La NAF est essentielle pour l'élaboration de statistiques nationales et européennes. 
        Pour une compréhension approfondie de cette nomenclature et de ses applications, veuillez consulter ce 
        <a href="https://www.insee.fr/fr/metadonnees/nafr2" target="_blank" rel="noopener noreferrer" style={{ color: '#286AC7' }}> lien</a>.
      </Alert>

      <Box component="form" marginTop={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
              Secteurs d'activité
            </Typography>
            <FormControl fullWidth>
              <Select
                value={selectedSubclasses}
                onChange={handleSubclassChange}
                options={subclassesOptions}
                placeholder="code ou libellé"
                isSearchable
                isMulti
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                  }),
                }}
              />
            </FormControl>
          </Grid>
        </Grid>
        <Box display="flex" justifyContent="flex-end" marginTop={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            
            style={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Valider
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SelectionActivite;
