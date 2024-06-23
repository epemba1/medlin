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
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [selectedCommunes, setSelectedCommunes] = useState([]);
  const [hoveredCommune, setHoveredCommune] = useState(null);
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
    const savedDepartments = localStorage.getItem('selectedDepartments');
    const savedCommunes = localStorage.getItem('selectedCommunes');

    if (savedDepartments) {
      try {
        const departments = JSON.parse(savedDepartments);
        setSelectedDepartments(departments || []);
      } catch (e) {
        console.error('Failed to parse savedDepartments:', e);
      }
    }

    if (savedCommunes) {
      try {
        const communes = JSON.parse(savedCommunes);
        setSelectedCommunes(communes || []);
      } catch (e) {
        console.error('Failed to parse savedCommunes:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedDepartments.length > 0) {
      const departmentCodes = selectedDepartments.map(dept => dept.value);
      setLoadingCommunes(true);
      Promise.all(departmentCodes.map(code =>
        axios.get(`https://geo.api.gouv.fr/departements/${code}/communes?format=geojson&geometry=contour`)
      ))
        .then(responses => {
          const combinedFeatures = responses.flatMap(response => response.data.features);
          const data = {
            type: "FeatureCollection",
            features: combinedFeatures
          };
          setCommunesGeoJsonData(data);
          const communesList = combinedFeatures.map(commune => ({
            value: commune.properties.code,
            label: `${commune.properties.code} - ${commune.properties.nom}`
          }));
          setCommunes(communesList);
          setLoadingCommunes(false);
        })
        .catch(error => {
          console.error('Error fetching communes GeoJSON data:', error);
          setSnackbarMessage('Failed to load communes data. Please try again.');
          setOpenSnackbar(true);
          setLoadingCommunes(false);
        });
    } else {
      setCommunes([]);
      setCommunesGeoJsonData(null);
    }
  }, [selectedDepartments]);

  const handleDepartmentChange = (selectedOptions) => {
    setSelectedDepartments(selectedOptions || []);
    setSelectedCommunes([]);
    localStorage.setItem('selectedDepartments', JSON.stringify(selectedOptions || []));
    localStorage.removeItem('selectedCommunes');
  };

  const handleCommuneChange = (selectedOptions) => {
    setSelectedCommunes(selectedOptions || []);
    const communeNames = selectedOptions ? selectedOptions.map(option => {
      const [code, name] = option.label.split(' - ');
      return `${name} (${code})`;
    }) : [];
    localStorage.setItem('selectedCommunes', JSON.stringify(selectedOptions || []));
    localStorage.setItem('selectedCommuneNames', JSON.stringify(communeNames));
  };

  const handleBack = () => {
    navigate('/selection-activite');
  };

  const handleNext = () => {
    if (selectedDepartments.length === 0) {
      setSnackbarMessage('Veuillez sélectionner au moins un département.');
      setOpenSnackbar(true);
    } else {
      navigate('/synthese-recherche');
    }
  };

  const handleValidate = () => {
    if (selectedDepartments.length === 0) {
      setSnackbarMessage('Veuillez sélectionner au moins un département.');
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
    setSelectedDepartments([]);
    setSelectedCommunes([]);
    setCommunes([]);
    setCommunesGeoJsonData(null);
    localStorage.removeItem('selectedDepartments');
    localStorage.removeItem('selectedCommunes');
  };

  const styles = {
    default: {
      color: 'black',
      weight: 1,
      fillOpacity: 0,
      transition: 'all 0.3s ease',
      interactive: true
    },
    selected: {
      color: '#e4003a',
      weight: 1,
      fillOpacity: 0.5,
      transition: 'all 0.3s ease',
      interactive: true
    },
    commune: {
      color: 'blue',
      weight: 1,
      fillOpacity: 0.5,
      transition: 'all 0.3s ease',
      interactive: true
    },
    hover: {
      color: '#023047',
      weight: 2,
      fillOpacity: 0.7,
      transition: 'all 0.3s ease',
      interactive: true
    }
  };

  const getCommuneStyle = (feature) => {
    return (Array.isArray(selectedCommunes) && selectedCommunes.some(c => c?.value === feature.properties.code) ? styles.selected :
      (hoveredCommune === feature.properties.code ? styles.hover : styles.commune));
  };

  const onEachFeature = useCallback((feature, layer) => {
    layer.bindTooltip(`Commune: ${feature.properties.nom}`);
    layer.on({
      mouseover: () => {
        setHoveredCommune(feature.properties.code);
      },
      mouseout: () => {
        setHoveredCommune(null);
      },
      click: () => {
        const communeCode = feature.properties.code;
        const communeName = feature.properties.nom;
        setSelectedCommunes((prevSelectedCommunes) => {
          const alreadySelected = prevSelectedCommunes.some(commune => commune?.value === communeCode);
          const newSelection = alreadySelected
            ? prevSelectedCommunes.filter(commune => commune?.value !== communeCode)
            : [...prevSelectedCommunes, { value: communeCode, label: `${communeCode} - ${communeName}` }];
          const communeNames = newSelection.map(option => {
            const [code, name] = option.label.split(' - ');
            return `${name}(${code})`;
          });
          localStorage.setItem('selectedCommunes', JSON.stringify(newSelection));
          localStorage.setItem('selectedCommuneNames', JSON.stringify(communeNames));
          return newSelection;
        });
      }
    });
  }, []);

  const onEachDepartmentFeature = useCallback((feature, layer) => {
    layer.bindTooltip(`Département: ${feature.properties.nom}`);
    layer.on({
      click: () => {
        const departmentCode = feature.properties.code;
        const departmentName = feature.properties.nom;
        setSelectedDepartments((prevSelectedDepartments) => {
          const alreadySelected = prevSelectedDepartments.some(dept => dept.value === departmentCode);
          const newSelection = alreadySelected
            ? prevSelectedDepartments.filter(dept => dept.value !== departmentCode)
            : [...prevSelectedDepartments, { value: departmentCode, label: `${departmentCode} - ${departmentName}` }];
          localStorage.setItem('selectedDepartments', JSON.stringify(newSelection));
          return newSelection;
        });
      }
    });
  }, []);

  const getDepartmentStyle = (feature) => {
    return selectedDepartments.some(dept => dept.value === feature.properties.code) ? styles.selected : styles.default;
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
      <MuiAlert severity="info" variant="outlined" style={{ marginBottom: '20px' }}>
        Veuillez choisir votre zone d'implantation en sélectionnant dans la liste de département ou directement sur la carte.
      </MuiAlert>
      <Box display="flex">
        <MapContainer
          center={[46.603354, 1.888334]}
          zoom={6}
          style={{ height: '80vh', width: '60%' }}
          whenCreated={(mapInstance) => { mapRef.current = mapInstance }}
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
                style={getDepartmentStyle}
                onEachFeature={onEachDepartmentFeature}
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
                value={selectedDepartments}
                onChange={handleDepartmentChange}
                isMulti
                isSearchable
                placeholder="Sélectionner des départements"
              />
            )}
            {selectedDepartments.length > 0 && (
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
