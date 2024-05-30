import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import Select from 'react-select';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const LocalisationImplantation = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

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

  const handleDepartmentChange = (selectedOption) => {
    setSelectedDepartment(selectedOption);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
      <div style={{ width: '300px', marginLeft: '10px' }}>
        <label htmlFor="departments" style={{ marginBottom: '5px', display: 'block' }}>Départements:</label>
        <Select
          id="departments"
          value={selectedDepartment}
          onChange={handleDepartmentChange}
          options={departments}
          placeholder="Sélectionnez un département"
          isSearchable
        />
      </div>
      <MapContainer center={[46.603354, 1.888334]} zoom={6} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={{ color: 'black', weight: 1 }}
          />
        )}
        {selectedDepartment && geoJsonData && (
          <GeoJSON
            data={geoJsonData.features.filter(dept => dept.properties.code === selectedDepartment.value)}
            style={{ color: 'blue', weight: 2 }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default LocalisationImplantation;
