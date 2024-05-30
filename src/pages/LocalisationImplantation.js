import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import Select from 'react-select';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { Typography, Button, Container, Box, Paper, Alert } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const LocalisationImplantation = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const mapRef = useRef();
  const geoJsonRef = useRef();

  useEffect(() => {
    // Fetch the GeoJSON data from the public folder
    axios.get('/contour-des-departements.geojson')
      .then(response => {
        const data = response.data;
        setGeoJsonData(data);

        // Extract department data from geojson
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
    if (selectedDepartment && geoJsonData) {
      const departmentFeature = geoJsonData.features.find(dept => dept.properties.code === selectedDepartment.value);
      if (departmentFeature && departmentFeature.geometry && departmentFeature.geometry.bbox) {
        const [minLng, minLat, maxLng, maxLat] = departmentFeature.geometry.bbox;
        const bounds = [
          [minLat, minLng],
          [maxLat, maxLng]
        ];
        mapRef.current.fitBounds(bounds, { animate: true });
      } else {
        console.error('Department feature or bbox is undefined');
      }
    }
  }, [selectedDepartment, geoJsonData]);

  const handleDepartmentChange = (selectedOption) => {
    setSelectedDepartment(selectedOption);
  };

  const handleBack = () => {
    // Handle the "Retour" button click
  };

  const handleNext = () => {
    // Handle the "Suivant" button click
  };

  const defaultStyle = {
    color: 'black',
    weight: 1,
    fillOpacity: 0, // Remove fill opacity
    transition: 'all 0.3s ease' // Add transition
  };

  const selectedStyle = {
    color: 'blue',
    weight: 2,
    fillOpacity: 0.5, // Slightly opaque to highlight the selection
    transition: 'all 0.3s ease' // Add transition
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
        Veuillez sélectionner votre zone d'implantation en sélectionnant dans la liste de département.
      </Alert>
      <Box display="flex">
        <MapContainer 
          center={[46.603354, 1.888334]} 
          zoom={6} 
          style={{ height: '600px', width: 'calc(100% - 310px)', marginRight: '10px' }} 
          whenCreated={mapInstance => { mapRef.current = mapInstance }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={defaultStyle}
              ref={geoJsonRef}
            />
          )}
          {selectedDepartment && geoJsonData && (
            <GeoJSON
              key={selectedDepartment.value} // Add a unique key to force re-render
              data={geoJsonData.features.filter(dept => dept.properties.code === selectedDepartment.value)}
              style={selectedStyle}
            />
          )}
        </MapContainer>
        <Paper elevation={0} style={{ width: '300px', padding: '10px' }}>
          <Typography variant="h6" style={{ marginBottom: '5px' }}>Départements:</Typography>
          <Select
            id="departments"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            options={departments}
            placeholder="Sélectionnez un département"
            isSearchable
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default LocalisationImplantation;
