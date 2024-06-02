import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import Select from 'react-select';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Typography, Button, Container, Box, Paper, Alert, IconButton, Snackbar, Tabs, Tab, Backdrop, CircularProgress } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import MuiAlert from '@mui/material/Alert';

const LocalisationImplantation = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [communesGeoJsonData, setCommunesGeoJsonData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [communes, setCommunes] = useState([]);
  const [selectedCommunes, setSelectedCommunes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [validatedSelection, setValidatedSelection] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [isDepartmentMenuOpen, setIsDepartmentMenuOpen] = useState(false);
  const [isCommuneMenuOpen, setIsCommuneMenuOpen] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/contour-des-departements.geojson')
      .then(response => {
        const data = response.data;
        setGeoJsonData(data);
        const departmentsList = data.features.map(dept => ({
          value: dept.properties.code,
          label: `${dept.properties.code} - ${dept.properties.nom}`
        }));
        setDepartments(departmentsList);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      setCommunesGeoJsonData(null);
      setCommunes([]);
      setLoadingCommunes(true);
      axios.get(`https://geo.api.gouv.fr/departements/${selectedDepartment.value}/communes?format=geojson&geometry=contour`)
        .then(response => {
          setCommunesGeoJsonData(response.data);
          const communesList = response.data.features.map(commune => ({
            value: commune.properties.code,
            label: `${commune.properties.code} - ${commune.properties.nom}`
          }));
          setCommunes(communesList);
          setLoadingCommunes(false);
        })
        .catch(error => {
          console.error('Error fetching communes GeoJSON data:', error);
          setLoadingCommunes(false);
        });
    }
  }, [selectedDepartment]);

  const handleDepartmentChange = (selectedOption) => {
    setSelectedDepartment(selectedOption);
    setSelectedCommunes([]);
    setErrorMessage('');
    setValidatedSelection(null);
  };

  const handleCommuneChange = (selectedOptions) => {
    setSelectedCommunes(selectedOptions || []);
    setErrorMessage('');
    setValidatedSelection(null);
  };

  const handleBack = () => {
    navigate('/selection-activite');
  };

  const handleNext = () => {
    navigate('/synthese-recherche');
  };

  const handleValidate = () => {
    if (selectedCommunes.length === 0) {
      setOpenSnackbar(true);
    } else {
      setValidatedSelection({ department: selectedDepartment, communes: selectedCommunes });
    }
  };

  const handleDeleteActivity = () => {
    setValidatedSelection(null);
    setSelectedDepartment(null);
    setSelectedCommunes([]);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const defaultStyle = {
    color: 'black',
    weight: 1,
    fillOpacity: 0,
    transition: 'all 0.3s ease',
    interactive: false
  };

  const selectedStyle = {
    color: 'blue',
    weight: 2,
    fillOpacity: 0,
    transition: 'all 0.3s ease',
    interactive: false
  };

  const selectedCommuneStyle = {
    color: '#e4003a',
    weight: 1,
    fillOpacity: 0.5,
    transition: 'all 0.3s ease',
    interactive: false
  };

  const communeStyle = {
    color: 'black',
    weight: 1,
    fillOpacity: 0,
    transition: 'all 0.3s ease',
    interactive: false
  };

  return (
    <Container>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
        <Typography variant="h4" gutterBottom>
          Localisation d'implantation
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
      <Alert severity="info" variant="outlined" style={{ marginBottom: '20px' }}>
        Veuillez choisir votre zone d'implantation en sélectionnant dans la liste de département ou directement sur la carte.
      </Alert>
      {errorMessage && (
        <Alert severity="error" variant="outlined" style={{ marginBottom: '20px' }}>
          {errorMessage}
        </Alert>
      )}
      <Box display="flex">
        <MapContainer 
          center={[46.603354, 1.888334]} 
          zoom={6} 
          style={{ height: '600px', width: 'calc(100% - 310px)', marginRight: '10px' }} 
          whenCreated={mapInstance => { 
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {geoJsonData && (
            <GeoJSON
              key={`geojson-${selectedDepartment ? selectedDepartment.value : 'default'}`}
              data={geoJsonData}
              style={defaultStyle}
            />
          )}
          {selectedDepartment && geoJsonData && (
            <GeoJSON
              key={`selected-department-${selectedDepartment.value}`}
              data={geoJsonData.features.filter(dept => dept.properties.code === selectedDepartment.value)}
              style={selectedStyle}
            />
          )}
          {communesGeoJsonData && (
            <GeoJSON
              key={`communes-${selectedDepartment ? selectedDepartment.value : 'default'}`}
              data={communesGeoJsonData}
              style={(feature) => selectedCommunes.some(c => c.value === feature.properties.code) ? selectedCommuneStyle : communeStyle}
            />
          )}
        </MapContainer>
        <Paper elevation={1} style={{ width: '300px', padding: '10px' }}>
          <Typography variant='h6' gutterBottom style={{ color: '#286AC7' }}>Département:</Typography>
          <Select
            id="departments"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            options={departments}
            placeholder={isDepartmentMenuOpen ? '' : 'code ou nom'}
            isSearchable
            onMenuOpen={() => setIsDepartmentMenuOpen(true)}
            onMenuClose={() => setIsDepartmentMenuOpen(false)}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '40px',
              }),
            }}
          />
          {selectedDepartment && (
            <>
              <Typography variant='h6' gutterBottom style={{ color: '#286AC7', marginTop: '20px' }}>Commune :</Typography>
              <Select
                id="communes"
                value={selectedCommunes}
                onChange={handleCommuneChange}
                options={communes}
                placeholder={isCommuneMenuOpen ? '' : 'Sélectionnez des communes'}
                isSearchable
                isMulti
                onMenuOpen={() => setIsCommuneMenuOpen(true)}
                onMenuClose={() => setIsCommuneMenuOpen(false)}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                  }),
                }}
              />
              <Box display="flex" justifyContent="center" marginTop={6}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleValidate} 
                  style={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Valider
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
      {validatedSelection && (
        <Box marginTop={2}>
          <Paper elevation={0} style={{ padding: '16px', marginBottom: '16px', width: 'fit-content', border: '1px solid #ccc', borderLeft: '5px solid blue', position: 'relative' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" style={{ marginRight: '8px' }}>
                <span style={{ color: '#286AC7' }}>Département choisi</span> : {validatedSelection.department.label}
              </Typography>
              <Typography variant="caption">
                <span style={{ color: '#286AC7' }}>Communes choisies</span> : {validatedSelection.communes.map(commune => commune.label).join(', ')}
              </Typography>
              <IconButton onClick={handleDeleteActivity} size="small" style={{ color: 'grey', position: 'absolute', top: '-12px', right: '-12px' }}>
                <CloseIcon fontSize="small" style={{ fontSize: '16px' }} />
              </IconButton>
            </Box>
          </Paper>
          <Box marginTop={2}>
            <Tabs 
              value={tabIndex} 
              onChange={handleTabChange} 
              variant="outlined"
              textColor="primary"
              TabIndicatorProps={{
                style: {
                  display: 'none'
                }
              }}
              start
            >
              <Tab 
                label="Population" 
                style={{ 
                  backgroundColor: tabIndex === 0 ? 'transparent' : '#f5f5f5', 
                  textTransform: 'none', 
                  borderBottom: '2px solid', 
                  borderColor: tabIndex === 0 ? 'blue' : 'transparent',
                  alignSelf: 'flex-start' 
                }} 
              />
              <Tab 
                label="Entreprises" 
                style={{ 
                  backgroundColor: tabIndex === 1 ? 'transparent' : '#f5f5f5', 
                  textTransform: 'none', 
                  borderBottom: '2px solid', 
                  borderColor: tabIndex === 1 ? 'blue' : 'transparent',
                  alignSelf: 'flex-start' 
                }} 
              />
            </Tabs>
            <Box padding={2} border={1} borderColor="divider" borderRadius={2} marginTop={1} backgroundColor="white">
              {tabIndex === 0 && (
                <Typography variant="h5">Contenu de la tab Population</Typography>
              )}
              {tabIndex === 1 && (
                <Typography variant="h5">Contenu de la tab Entreprises</Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <MuiAlert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          Veuillez sélectionner au moins une commune.
        </MuiAlert>
      </Snackbar>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loadingCommunes}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
};

export default LocalisationImplantation;
