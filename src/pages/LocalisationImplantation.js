import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import Select from 'react-select';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Typography, Button, Container, Box, Paper, Snackbar, IconButton, Skeleton } from '@mui/material';
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
  const [hoveredCommune, setHoveredCommune] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loadingGeoJson, setLoadingGeoJson] = useState(true);
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
        setLoadingGeoJson(false);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
        setLoadingGeoJson(false);
      });
  }, []);

  useEffect(() => {
    const savedDepartment = localStorage.getItem('selectedDepartment');
    const savedCommunes = localStorage.getItem('selectedCommunes');

    if (savedDepartment) {
      try {
        const department = JSON.parse(savedDepartment);
        setSelectedDepartment(department);
      } catch (e) {
        console.error('Failed to parse savedDepartment:', e);
      }
    }

    if (savedCommunes) {
      try {
        const communes = JSON.parse(savedCommunes);
        setSelectedCommunes(communes);
      } catch (e) {
        console.error('Failed to parse savedCommunes:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      setCommunesGeoJsonData(null);
      setCommunes([]);
      setLoadingCommunes(true);
      axios.get(`https://geo.api.gouv.fr/departements/${selectedDepartment.value}/communes?format=geojson&geometry=contour`)
        .then(response => {
          const data = response.data;
          if (data && data.features) {
            setCommunesGeoJsonData(data);
            const communesList = data.features.map(commune => ({
              value: commune.properties.code,
              label: `${commune.properties.code} - ${commune.properties.nom}`
            }));
            setCommunes(communesList);
          }
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
    localStorage.setItem('selectedDepartment', JSON.stringify(selectedOption));
    localStorage.removeItem('selectedCommunes');
  };

  const handleCommuneChange = (selectedOptions) => {
    setSelectedCommunes(selectedOptions || []);
    setErrorMessage('');
    localStorage.setItem('selectedCommunes', JSON.stringify(selectedOptions || []));
    if (selectedOptions && selectedOptions.length > 0) {
      centerMapOnCommune(selectedOptions[selectedOptions.length - 1].value);
    }
  };

  const handleBack = () => {
    navigate('/selection-activite');
  };

  const handleNext = () => {
    if (!selectedDepartment) {
      setSnackbarMessage('Veuillez sélectionner un département.');
      setOpenSnackbar(true);
    } else {
      navigate('/synthese-recherche');
    }
  };

  const handleValidate = () => {
    if (!selectedDepartment) {
      setSnackbarMessage('Veuillez sélectionner un département.');
      setOpenSnackbar(true);
    } else if (selectedCommunes.length === 0) {
      setSnackbarMessage('Veuillez sélectionner au moins une commune.');
      setOpenSnackbar(true);
    } else {
      navigate('/synthese-recherche');
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleReset = () => {
    setSelectedDepartment(null);
    setSelectedCommunes([]);
    setCommunes([]);
    setCommunesGeoJsonData(null);
    localStorage.removeItem('selectedDepartment');
    localStorage.removeItem('selectedCommunes');
  };

  const centerMapOnCommune = useCallback((communeCode) => {
    if (communesGeoJsonData && mapRef.current) {
      const selectedCommuneFeature = communesGeoJsonData.features.find(
        (feature) => feature.properties.code === communeCode
      );
      if (selectedCommuneFeature) {
        const { coordinates } = selectedCommuneFeature.geometry;
        const [lng, lat] = coordinates[0][0]; // Assuming the geometry is a polygon
        mapRef.current.setView([lat, lng], 8); // Center the map on the selected commune
      }
    }
  }, [communesGeoJsonData]);

  const defaultStyle = {
    color: 'black',
    weight: 1,
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
    color: 'blue',
    weight: 1,
    fillOpacity: 0.5,
    transition: 'all 0.3s ease',
    interactive: true
  };

  const hoverStyle = {
    color: '#023047',
    weight: 2,
    fillOpacity: 0.7,
    transition: 'all 0.3s ease',
    interactive: true
  };

  const getCommuneStyle = (feature) => {
    return selectedCommunes.some(c => c?.value === feature.properties.code) ? selectedCommuneStyle :
      (hoveredCommune === feature.properties.code ? hoverStyle : communeStyle);
  };

  const onEachFeature = useCallback((feature, layer) => {
    layer.on({
      mouseover: () => {
        setHoveredCommune(feature.properties.code);
      },
      mouseout: () => {
        setHoveredCommune(null);
      },
      click: () => {
        const communeCode = feature.properties.code;
        const alreadySelected = selectedCommunes.some(commune => commune?.value === communeCode);
        if (alreadySelected) {
          const newSelection = selectedCommunes.filter(commune => commune?.value !== communeCode);
          setSelectedCommunes(newSelection);
          localStorage.setItem('selectedCommunes', JSON.stringify(newSelection));
        } else {
          const newCommune = { value: communeCode, label: `${communeCode} - ${feature.properties.nom}` };
          const newSelection = [...selectedCommunes, newCommune];
          setSelectedCommunes(newSelection);
          localStorage.setItem('selectedCommunes', JSON.stringify(newSelection));
          centerMapOnCommune(communeCode); // Center the map on the newly selected commune
        }
      }
    });
  }, [selectedCommunes, centerMapOnCommune]);

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
      <MuiAlert severity="info" variant="outlined" style={{ marginBottom: '20px' }}>
        Veuillez choisir votre zone d'implantation en sélectionnant dans la liste de département ou directement sur la carte.
      </MuiAlert>
      {errorMessage && (
        <MuiAlert severity="error" variant="outlined" style={{ marginBottom: '20px' }}>
          {errorMessage}
        </MuiAlert>
      )}
      <Box display="flex">
        <MapContainer 
          center={[46.603354, 1.888334]} 
          zoom={6} 
          style={{ height: '70vh', width: '60%', flex: 1 }}
          scrollWheelZoom={false}
          ref={mapRef}
          whenCreated={map => { mapRef.current = map; }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {loadingGeoJson ? (
            <Skeleton variant="rectangular" width="100%" height="100%" />
          ) : (
            geoJsonData && (
              <GeoJSON
                data={geoJsonData}
                style={defaultStyle}
              />
            )
          )}
          {loadingCommunes ? (
            <Skeleton variant="rectangular" width="100%" height="100%" />
          ) : (
            communesGeoJsonData && (
              <GeoJSON
                data={communesGeoJsonData}
                style={getCommuneStyle}
                onEachFeature={onEachFeature}
              />
            )
          )}
        </MapContainer>
        <Box style={{ width: '40%', marginLeft: '20px' }}>
          <Paper elevation={3} style={{ padding: '20px', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Département
            </Typography>
            {loadingGeoJson ? (
              <Skeleton variant="rectangular" height={56} />
            ) : (
              <Select
                options={departments}
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                isSearchable
                placeholder="Sélectionner un département"
              />
            )}
            {selectedDepartment && (
              <>
                <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>
                  Commune(s)
                </Typography>
                {loadingCommunes ? (
                  <Skeleton variant="rectangular" height={56} />
                ) : (
                  <Select
                    options={communes}
                    value={selectedCommunes}
                    onChange={handleCommuneChange}
                    isMulti
                    isSearchable
                    placeholder="Sélectionner des communes"
                  />
                )}
              </>
            )}
            <Box display="flex" justifyContent="flex-end" marginTop={5}>
              <Button
                variant="text"
                onClick={handleReset}
                style={{ marginRight: 10, borderRadius: '8px', textTransform: 'none' }}
              >
                Réinitialiser
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleValidate}
                style={{ borderRadius: '8px', textTransform: 'none' }}
              >
                Valider
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
};

export default LocalisationImplantation;
