import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Tabs, Tab } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import proj4 from 'proj4';

// Fix for missing marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define Lambert II etendu projection
const lambertIIExtended = '+proj=lcc +lat_1=45.898918 +lat_2=47.696014 +lat_0=46.8 +lon_0=2.337229167 +x_0=600000 +y_0=2200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

const SyntheseRecherche = () => {
  const [selectedNAF, setSelectedNAF] = useState('');
  const [selectedCommunes, setSelectedCommunes] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [etablissements, setEtablissements] = useState([]);

  useEffect(() => {
    const naf = localStorage.getItem('selectedNAF');
    const communes = JSON.parse(localStorage.getItem('selectedCommunes')) || [];
    setSelectedNAF(naf || '');
    setSelectedCommunes(communes || []);
  }, []);

  useEffect(() => {
    if (selectedNAF && selectedCommunes.length > 0) {
      const codeCommune = selectedCommunes[0].value; // Assuming single commune for simplicity
      fetch(`https://api.insee.fr/entreprises/sirene/V3.11/siret?q=periode(activitePrincipaleEtablissement%3A${selectedNAF}%20AND%20etatAdministratifEtablissement%3AA)%20AND%20codeCommuneEtablissement%3A${codeCommune}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
        }
      })
        .then(response => response.json())
        .then(data => {
          console.log('Fetched Data:', data);
          setEtablissements(data.etablissements || []);
        })
        .catch(error => console.error('Error fetching data:', error));
    }
  }, [selectedNAF, selectedCommunes]);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const convertLambertToLatLng = (x, y) => {
    if (x === null || y === null || isNaN(x) || isNaN(y)) {
      return null;
    }
    try {
      const [lng, lat] = proj4(lambertIIExtended, wgs84, [x, y]);
      console.log('Converted coordinates:', { x, y, lat, lng });
      return [lat, lng];
    } catch (error) {
      console.error('Error converting coordinates:', error);
      return null;
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Synthèse de la recherche</Typography>
      <Typography variant="body1" paragraph>
        Veuillez trouver ci-dessous les résultats issus de votre étude.
      </Typography>
      <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }}>
        <Typography variant="h6" gutterBottom>Activité choisie :</Typography>
        <Typography variant="body1">{selectedNAF}</Typography>
      </Paper>
      <Paper elevation={3} style={{ padding: '16px', marginBottom: '16px' }}>
        <Typography variant="h6" gutterBottom>Communes choisies :</Typography>
        <Typography variant="body1">
          {selectedCommunes.map(commune => commune.value).join(', ')}
        </Typography>
      </Paper>

      <Box marginTop={5}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange} 
          variant="standard"
          textColor="primary"
          TabIndicatorProps={{ style: { display: 'none' } }}
        >
          <Tab 
            label="Population" 
            style={{ 
              backgroundColor: tabIndex === 0 ? 'transparent' : '#f5f5f5', 
              textTransform: 'none', 
              borderBottom: '2px solid', 
              borderColor: tabIndex === 0 ? '#286AC7' : 'transparent',
              alignSelf: 'flex-start',
              fontSize: '20px' 
            }} 
          />
          <Tab 
            label="Entreprises" 
            style={{ 
              backgroundColor: tabIndex === 1 ? 'transparent' : '#f5f5f5', 
              textTransform: 'none', 
              borderBottom: '2px solid', 
              borderColor: tabIndex === 1 ? '#286AC7' : 'transparent',
              alignSelf: 'flex-start',
              fontSize: '20px'  
            }} 
          />
        </Tabs>
        <Box padding={2} border={1} borderColor="divider" borderRadius={2} marginTop={1} backgroundColor="white" height={600}>
          {tabIndex === 0 && (
            <Typography variant="h5">Données Statistiques Population</Typography>
          )}
          {tabIndex === 1 && (
            <Box height="100%">
              <Typography variant="h5">Données Statistiques Entreprises</Typography>
              <MapContainer center={[45.75, 4.85]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {etablissements
                  .filter(etablissement => 
                    etablissement.adresseEtablissement.coordonneeLambertAbscisseEtablissement !== "[ND]" &&
                    etablissement.adresseEtablissement.coordonneeLambertOrdonneeEtablissement !== "[ND]" &&
                    !isNaN(parseFloat(etablissement.adresseEtablissement.coordonneeLambertAbscisseEtablissement)) &&
                    !isNaN(parseFloat(etablissement.adresseEtablissement.coordonneeLambertOrdonneeEtablissement))
                  )
                  .map((etablissement, index) => {
                    const { adresseEtablissement } = etablissement;
                    const x = parseFloat(adresseEtablissement.coordonneeLambertAbscisseEtablissement);
                    const y = parseFloat(adresseEtablissement.coordonneeLambertOrdonneeEtablissement);

                    const coords = convertLambertToLatLng(x, y);
                    if (!coords) {
                      console.warn(`Invalid coordinates for establishment ${index}: (${x}, ${y})`, etablissement);
                      return null;
                    }

                    console.log(`Rendering marker for establishment ${index}:`, coords);
                    return (
                      <Marker key={index} position={coords}>
                        <Popup>
                          {etablissement.uniteLegale.denominationUniteLegale || 'Nom indisponible'}<br />
                          {adresseEtablissement.numeroVoieEtablissement} {adresseEtablissement.libelleVoieEtablissement}<br />
                          {adresseEtablissement.codePostalEtablissement} {adresseEtablissement.libelleCommuneEtablissement}
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default SyntheseRecherche;
