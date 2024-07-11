import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, FormControl, Skeleton, Snackbar, Button, IconButton, Alert, AlertTitle, Paper } from '@mui/material';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

const animatedComponents = makeAnimated();

//
const SelectionActivite = () => {
  const [data, setData] = useState(null);
  const [selectedSubclasses, setSelectedSubclasses] = useState(localStorage.getItem('selectedSubclasses') ? JSON.parse(localStorage.getItem('selectedSubclasses')) : []);
  const [inputValue, setInputValue] = useState('');
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

//
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
        <Paper elevation={3} style={{ padding: '10px 16px', marginBottom: '16px', borderRadius: '8px', borderLeft: '5px solid #286AC7', maxHeight: '300px', overflowY: 'auto' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body1" style={{ fontWeight: 500 }}>
              <span style={{ color: '#286AC7' }}>Vous avez choisi l'activité :</span> {selectedSubclasses.map(subclass => subclass.label).join(', ')}
            </Typography>
            <IconButton onClick={handleDeleteActivity} size="small" style={{ color: 'grey' }}>
              <CloseIcon fontSize="small" />
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
      <Alert variant="outlined" severity="info" style={{ borderRadius: '8px' }}>
        <AlertTitle>Nomenclature d'activités française (NAF)</AlertTitle>
        <Typography variant="body2" gutterBottom>
          <span style={{ color: '#286AC7' }}>La NAF, nomenclature d'activités française,</span> est une nomenclature des activités économiques productives, principalement élaborée pour faciliter l'organisation de l'information économique et sociale.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Principalement utilisée à des fins statistiques, elle permet d'organiser et d'analyser l'information économique et sociale.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Elle est essentielle pour l'élaboration de statistiques nationales et européennes. Pour une compréhension approfondie <a href="https://www.insee.fr/fr/metadonnees/nafr2" target="_blank" rel="noopener noreferrer" style={{ color: '#286AC7' }}>de cette nomenclature et de ses applications.
           </a>
        </Typography>
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
                components={animatedComponents}
                closeMenuOnSelect={false}
                placeholder="code ou libellé"
                isSearchable
                isMulti
                inputValue={inputValue}
                onInputChange={(newValue, actionMeta) => {
                  if (actionMeta.action !== 'set-value') {
                    setInputValue(newValue);
                  }
                }}
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
            endIcon={<NavigateNextIcon />}
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
