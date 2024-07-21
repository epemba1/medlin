import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TablePagination, TextField } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GetApp as GetAppIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import proj4 from 'proj4';

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
  const [filters, setFilters] = useState({
    siret: '',
    denomination: '',
    adresse: '',
    activite: '',
    date_creation: '',
    effectif: '',
  });
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
        
      // Set selectedCommune to all selected communes
      setSelectedCommune(selectedCommunes.map(commune => commune.value));
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
        denomination = `${prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase()} ${nom.toUpperCase()}`;
    } else if (sigleLegale) {
        denomination = sigleLegale;
    }

    function formattedDate(dateString) {
      const [year, month, day] = dateString.split("-");
      return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
    }

    return {
        siret: etablissement.siret,
        denomination: denomination,
        adresse: `${replaceNDWithUndefined(adresseEtablissement.numeroVoieEtablissement) || ''} ${replaceNDWithUndefined(adresseEtablissement.typeVoieEtablissement) || ''} 
 ${replaceNDWithUndefined(adresseEtablissement.libelleVoieEtablissement) || ''}, ${replaceNDWithUndefined(adresseEtablissement.codePostalEtablissement) || ''} ${replaceNDWithUndefined(adresseEtablissement.libelleCommuneEtablissement) || ''}`,
        activite: replaceNDWithUndefined(periodesEtablissement[0]?.activitePrincipaleEtablissement),
        date_creation: formattedDate(periodesEtablissement[0]?.dateDebut),
        effectif: replaceNDWithUndefined(tranchEffectifsEtablissement[periodesEtablissement[0]?.trancheEffectifsEtablissement])
    };
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(etablissements.map(etablissement => transformData(etablissement)));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entreprises');
    XLSX.writeFile(workbook, 'entreprises.xlsx');
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const filteredEtablissements = etablissements.filter(etablissement => {
    const transformedData = transformData(etablissement);
    return Object.keys(filters).every(key => {
      const filterValue = filters[key].toLowerCase();
      const columnValue = transformedData[key]?.toLowerCase() || '';
      return columnValue.includes(filterValue);
    });
  });

  const sortedEtablissements = filteredEtablissements.sort((a, b) => {
    const denomA = a.denominationUniteLegale || '';
    const denomB = b.denominationUniteLegale || '';
    return denomA.localeCompare(denomB);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1 }}>
        {selectedCommunes.length > 0 ? (
          <MapContainer ref={mapRef} center={[46.5, 3]} zoom={6} style={{ height: '400px' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {communeBoundaries && <GeoJSON data={communeBoundaries} />}
            {sortedEtablissements.map(etablissement => {
              const x = parseFloat(replaceNDWithUndefined(etablissement.adresseEtablissement.coordonneeLambertAbscisseEtablissement));
              const y = parseFloat(replaceNDWithUndefined(etablissement.adresseEtablissement.coordonneeLambertOrdonneeEtablissement));
              const coords = convertLambertToLatLng(x, y);

              if (coords) {
                return (
                  <Marker key={etablissement.siret} position={coords}>
                    <Popup>
                      <div>
                        <Typography variant="h6">{etablissement.uniteLegale.denominationUniteLegale}</Typography>
                        <Typography>Adresse: {etablissement.adresseEtablissement.numeroVoieEtablissement} {etablissement.adresseEtablissement.typeVoieEtablissement} {etablissement.adresseEtablissement.libelleVoieEtablissement}</Typography>
                        <Typography>Commune: {etablissement.adresseEtablissement.libelleCommuneEtablissement}</Typography>
                        <Typography>Activité: {etablissement.periodesEtablissement[0].activitePrincipaleEtablissement}</Typography>
                        <Typography>Date de création: {etablissement.periodesEtablissement[0].dateDebut}</Typography>
                        <Typography>Effectif: {tranchEffectifsEtablissement[etablissement.periodesEtablissement[0].trancheEffectifsEtablissement]}</Typography>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
        ) : (
          <Typography variant="h6" align="center" sx={{ mt: 2 }}>
            Veuillez sélectionner une commune pour afficher les établissements.
          </Typography>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', mt: 2 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={{ width: '20%' }}>SIRET</TableCell>
                <TableCell style={{ width: '25%' }}>Dénomination</TableCell>
                <TableCell style={{ width: '25%' }}>Adresse</TableCell>
                <TableCell style={{ width: '15%' }}>Activité</TableCell>
                <TableCell style={{ width: '80%' }}>Date de création</TableCell>
                <TableCell style={{ width: '5%' }}>Effectif</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <TextField
                    name="siret"
                    value={filters.siret}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name="denomination"
                    value={filters.denomination}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name="adresse"
                    value={filters.adresse}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name="activite"
                    value={filters.activite}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name="date_creation"
                    value={filters.date_creation}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    name="effectif"
                    value={filters.effectif}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedEtablissements
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map(etablissement => {
                  const transformedData = transformData(etablissement);
                  return (
                    <TableRow key={etablissement.siret}>
                      <TableCell>{transformedData.siret}</TableCell>
                      <TableCell>{transformedData.denomination}</TableCell>
                      <TableCell>{transformedData.adresse}</TableCell>
                      <TableCell>{transformedData.activite}</TableCell>
                      <TableCell>{transformedData.date_creation}</TableCell>
                      <TableCell>{transformedData.effectif}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={etablissements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
      <Box sx={{ textAlign: 'right', mt: 2 }}>
        <IconButton onClick={handleDownload}>
          <GetAppIcon />
        </IconButton>
      </Box>
    </Box>
  );
});

export default EntreprisesTab;
