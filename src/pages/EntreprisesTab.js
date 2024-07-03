import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TablePagination } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GetApp as GetAppIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import proj4 from 'proj4';
import { styled } from '@mui/system';

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

// Define Lambert 93 projection
const lambert93 = '+proj=lcc +lat_1=44.0 +lat_2=49.0 +lat_0=46.5 +lon_0=3.0 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

const tranchEffectifsEtablissement = {
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (selectedNAF && selectedCommunes.length > 0) {
      const fetchEtablissements = selectedCommunes.map(commune => {
        const codeCommune = commune.value;
        return fetch(`https://api.insee.fr/entreprises/sirene/V3.11/siret?q=periode(activitePrincipaleEtablissement%3A${selectedNAF}%20AND%20etatAdministratifEtablissement%3AA%20AND%20-dateFin%3A*)%20AND%20codeCommuneEtablissement%3A${codeCommune}&nombre=1000`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
          }
        }).then(response => response.json());
      });

      const fetchCommuneBoundaries = selectedCommunes.map(commune => {
        const codeCommune = commune.value;
        return fetch(`https://geo.api.gouv.fr/communes/${codeCommune}?geometry=contour&format=geojson`)
          .then(response => response.json());
      });

      Promise.all(fetchEtablissements)
        .then(results => {
          const allEtablissements = results.flatMap(data => data.etablissements || []);
          setEtablissements(allEtablissements);
        })
        .catch(error => console.error('Error fetching data:', error));

      Promise.all(fetchCommuneBoundaries)
        .then(results => {
          const combinedBoundaries = {
            type: "FeatureCollection",
            features: results.flatMap(data => data.features || [data])
          };
          setCommuneBoundaries(combinedBoundaries);

          if (mapRef.current) {
            const map = mapRef.current;
            const bounds = L.geoJSON(combinedBoundaries).getBounds();
            map.fitBounds(bounds);
          }
        })
        .catch(error => console.error('Error fetching commune boundaries:', error));
      
      // Automatically set selectedCommune to the first one in the list
      setSelectedCommune(selectedCommunes[0].value);
    }
  }, [selectedNAF, selectedCommunes]);

  useEffect(() => {
    if (selectedCommune) {
      zoomToCommune(selectedCommune);
    }
  }, [selectedCommune]);

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
      //console.log('Converted coordinates:', { x, y, lat, lng });
      return [lat, lng];
    } catch (error) {
      console.error('Error converting coordinates:', error);
      return null;
    }
  };

  const replaceNDWithUndefined = (value) => {
    return value === "[ND]" ? "" : value;
  };

  const transformData = (etablissement) => {
    const { adresseEtablissement, uniteLegale, periodesEtablissement } = etablissement;
    const x = parseFloat(replaceNDWithUndefined(adresseEtablissement.coordonneeLambertAbscisseEtablissement));
    const y = parseFloat(replaceNDWithUndefined(adresseEtablissement.coordonneeLambertOrdonneeEtablissement));
    const coords = convertLambertToLatLng(x, y);

    const denominationUsuelle = replaceNDWithUndefined(periodesEtablissement[0]?.denominationUsuelleEtablissement);
    const denominationLegale = replaceNDWithUndefined(uniteLegale?.denominationUniteLegale);
    const sigleLegale = replaceNDWithUndefined(uniteLegale?.sigleUniteLegale);
    const denominationUsuelle1 = replaceNDWithUndefined(uniteLegale?.denominationUsuelle1UniteLegale);
    const denominationUsuelle2 = replaceNDWithUndefined(uniteLegale?.denominationUsuelle2UniteLegale);
    const denominationUsuelle3 = replaceNDWithUndefined(uniteLegale?.denominationUsuelle3UniteLegale);
    const prenom = replaceNDWithUndefined(uniteLegale?.prenom1UniteLegale);
    const nom = replaceNDWithUndefined(uniteLegale?.nomUniteLegale);

    let denomination = '';

    if (denominationUsuelle && denominationUsuelle !== "Non défini") {
      denomination = denominationUsuelle;
    } else if (denominationLegale) {
      denomination = denominationLegale;
    } else if (denominationUsuelle1) {
      denomination = denominationUsuelle1;
    } else if (denominationUsuelle2) {
      denomination = denominationUsuelle2;
    } else if (denominationUsuelle3) {
      denomination = denominationUsuelle3;
    } else if (prenom && nom) {
      denomination = `${prenom.toLowerCase()} ${nom}`;
    } else if (sigleLegale) {
      denomination = sigleLegale;
    }

    return {
      siret: etablissement.siret,
      denomination: denomination,
      adresse: `${replaceNDWithUndefined(adresseEtablissement.numeroVoieEtablissement) || ''} ${replaceNDWithUndefined(adresseEtablissement.typeVoieEtablissement) || ''} ${replaceNDWithUndefined(adresseEtablissement.libelleVoieEtablissement) || ''} `,
      commune: `${replaceNDWithUndefined(adresseEtablissement.codePostalEtablissement) || ''} ${replaceNDWithUndefined(adresseEtablissement.libelleCommuneEtablissement) || ''}`,
      naf: replaceNDWithUndefined(periodesEtablissement[0]?.activitePrincipaleEtablissement),
      trancheEffectifs: tranchEffectifsEtablissement[replaceNDWithUndefined(periodesEtablissement[0]?.trancheEffectifsEtablissement)] || replaceNDWithUndefined(periodesEtablissement[0]?.trancheEffectifsEtablissement),
      coords: coords,
    };
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const zoomToCommune = (communeCode) => {
    if (communeBoundaries) {
      const communeFeature = communeBoundaries.features.find(
        feature => feature.properties.code === communeCode
      );
      if (communeFeature) {
        const bounds = L.geoJSON(communeFeature).getBounds();
        if (mapRef.current) {
          mapRef.current.fitBounds(bounds);
        }
      }
    }
  };

  return (
    <Box display="flex" flexDirection="row">
      <Box flex="1">
        <Typography variant="h6" gutterBottom>
          Liste des Entreprises
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dénomination</TableCell>
                <TableCell>Adresse</TableCell>
                <TableCell>Commune</TableCell>
                <TableCell>NAF</TableCell>
                <TableCell>Tranche Effectifs</TableCell>
                <TableCell>Export</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {etablissements
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((etablissement, index) => {
                  const data = transformData(etablissement);
                  return (
                    <TableRow key={etablissement.siret}>
                      <TableCell>{data.denomination}</TableCell>
                      <TableCell>{data.adresse}</TableCell>
                      <TableCell>{data.commune}</TableCell>
                      <TableCell>{data.naf}</TableCell>
                      <TableCell>{data.trancheEffectifs}</TableCell>
                      <TableCell>
                        <IconButton >
                          <GetAppIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={etablissements.length}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </TableContainer>
      </Box>
      <Box flex="1" ml={2}>
        <MapContainer center={[46.603354, 1.888334]} zoom={6} ref={mapRef} style={{ height: '500px' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {communeBoundaries && (
            <GeoJSON
              data={communeBoundaries}
              style={{ weight: 1, color: '#1E90FF' }}
            />
          )}
          {etablissements.map(etablissement => {
            const data = transformData(etablissement);
            return (
              data.coords && (
                <Marker key={etablissement.siret} position={data.coords}>
                  <Popup>
                    <Typography variant="body1">{data.denomination}</Typography>
                    <Typography variant="body2">{data.adresse}</Typography>
                    <Typography variant="body2">{data.commune}</Typography>
                  </Popup>
                </Marker>
              )
            );
          })}
        </MapContainer>
      </Box>
    </Box>
  );
});

export default EntreprisesTab;
