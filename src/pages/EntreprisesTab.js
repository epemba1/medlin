import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import proj4 from 'proj4';

// Fix for missing marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  iconColor: 'red',
});

// Define Lambert 93 projection
const lambert93 = '+proj=lcc +lat_1=44.0 +lat_2=49.0 +lat_0=46.5 +lon_0=3.0 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

const trancheEffectifs = {
  '00': '0 salarié',
  '01': '1 ou 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1 000 à 1 999 salariés',
  '51': '2 000 à 4 999 salariés',
  '52': '5 000 à 9 999 salariés',
  '53': '10 000 salariés et plus',
};

const EntreprisesTab = forwardRef(({ selectedNAF, selectedCommunes }, ref) => {
  const [etablissements, setEtablissements] = useState([]);
  const [communeBoundaries, setCommuneBoundaries] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (selectedNAF && selectedCommunes.length > 0) {
      const codeCommune = selectedCommunes[0].value;

      // Fetch enterprise data
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

      // Fetch commune boundaries
      fetch(`https://geo.api.gouv.fr/communes/${codeCommune}?geometry=contour&format=geojson`)
        .then(response => response.json())
        .then(data => {
          console.log('Fetched Commune Boundaries:', data);
          setCommuneBoundaries(data);

          // Center the map on the commune boundaries
          if (mapRef.current) {
            const map = mapRef.current;
            const bounds = L.geoJSON(data).getBounds();
            map.fitBounds(bounds);
          }
        })
        .catch(error => console.error('Error fetching commune boundaries:', error));
    }
  }, [selectedNAF, selectedCommunes]);

  useImperativeHandle(ref, () => ({
    getEntreprisesData: () => {
      return etablissements.map(etablissement => transformData(etablissement));
    },
  }));

  const convertLambertToLatLng = (x, y) => {
    if (x === null || y === null || isNaN(x) || isNaN(y)) {
      return null;
    }
    try {
      const [lng, lat] = proj4(lambert93, wgs84, [x, y]);
      console.log('Converted coordinates:', { x, y, lat, lng });
      return [lat, lng];
    } catch (error) {
      console.error('Error converting coordinates:', error);
      return null;
    }
  };

  const transformData = (etablissement) => {
    const { adresseEtablissement, uniteLegale } = etablissement;
    const x = parseFloat(adresseEtablissement.coordonneeLambertAbscisseEtablissement);
    const y = parseFloat(adresseEtablissement.coordonneeLambertOrdonneeEtablissement);
    const coords = convertLambertToLatLng(x, y);

    return {
      siren: etablissement.siren,
      denominationUniteLegale: uniteLegale.denominationUniteLegale || 'Indisponible',
      adresse: `${adresseEtablissement.numeroVoieEtablissement} ${adresseEtablissement.typeVoieEtablissement} ${adresseEtablissement.libelleVoieEtablissement}`,
      commune: `${adresseEtablissement.codeCommuneEtablissement} ${adresseEtablissement.libelleCommuneEtablissement}`,
      trancheEffectifs: trancheEffectifs[uniteLegale.trancheEffectifsUniteLegale] || 'Non renseigné',
      categorieEntreprise: uniteLegale.categorieEntreprise || 'Non défini',
      coords: coords
    };
  };

  return (
    <Box height="100%" style={{ overflowY: 'auto' }}>
      <Typography variant="h5">Données Statistiques Entreprises</Typography>
      <Box style={{ height: '600px', width: '100%' }}>
        <MapContainer 
          center={[46.603354, 1.888334]} 
          zoom={6} 
          style={{ height: '100%', width: '95%' }}
          whenCreated={map => { mapRef.current = map; }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {communeBoundaries && (
            <GeoJSON 
              data={communeBoundaries} 
              style={{ color: 'blue', weight: 2, opacity: 0.5, fillOpacity: 0.2 }} 
            />
          )}
          {etablissements
            .filter(etablissement => 
              etablissement.adresseEtablissement.coordonneeLambertAbscisseEtablissement !== "[ND]" &&
              etablissement.adresseEtablissement.coordonneeLambertOrdonneeEtablissement !== "[ND]" &&
              !isNaN(parseFloat(etablissement.adresseEtablissement.coordonneeLambertAbscisseEtablissement)) &&
              !isNaN(parseFloat(etablissement.adresseEtablissement.coordonneeLambertOrdonneeEtablissement))
            )
            .map((etablissement, index) => {
              const transformedData = transformData(etablissement);
              if (!transformedData.coords) {
                console.warn(`Invalid coordinates for establishment ${index}: (${transformedData.coords})`, etablissement);
                return null;
              }

              return (
                <Marker key={index} position={transformedData.coords} icon={redIcon}>
                  <Popup>
                    <strong style={{ color: 'blue' }}>Siren: </strong> {transformedData.siren}<br />
                    <strong style={{ color: 'blue' }}>Nom Etablissement: </strong> {transformedData.denominationUniteLegale ? transformedData.denominationUniteLegale : 'Non disponible'}<br />
                    <strong style={{ color: 'blue' }}>Adresse: </strong> {transformedData.adresse}<br />
                    <strong style={{ color: 'blue' }}>Commune: </strong> {transformedData.commune}<br />
                    <strong style={{ color: 'blue' }}>Effectif: </strong> {transformedData.trancheEffectifs}<br />
                    <strong style={{ color: 'blue' }}>Catégorie: </strong> {transformedData.categorieEntreprise}<br />
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </Box>
      <TableContainer component={Paper} style={{marginTop: '20px'}}>
        <Table aria-label="simple table">
          <TableHead style={{ backgroundColor: 'grey'}}>
            <TableRow>
              <TableCell style={{ color: 'white'}}>Siren</TableCell>
              <TableCell style={{ color: 'white'}}>Nom</TableCell>
              <TableCell style={{ color: 'white'}}>Adresse</TableCell>
              <TableCell style={{ color: 'white'}}>Commune</TableCell>
              <TableCell style={{ color: 'white'}}>Tranche Effectifs</TableCell>
              <TableCell style={{ color: 'white'}}>Catégorie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {etablissements.map((etablissement, index) => {
              const transformedData = transformData(etablissement);
              return (
                <TableRow key={index} style={{backgroundColor: index % 2 === 0 ? 'lightgrey' : 'white'}}>
                  <TableCell>{transformedData.siren}</TableCell>
                  <TableCell>{transformedData.denominationUniteLegale}</TableCell>
                  <TableCell>{transformedData.adresse}</TableCell>
                  <TableCell>{transformedData.commune}</TableCell>
                  <TableCell>{transformedData.trancheEffectifs}</TableCell>
                  <TableCell>{transformedData.categorieEntreprise}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

export default EntreprisesTab;
