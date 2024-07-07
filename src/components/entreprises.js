import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TablePagination, TextField } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GetApp as GetAppIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import proj4 from 'proj4';
import { styled } from '@mui/system';
import tranchEffectifsEtablissement from '../effectifData';
import categoriesJuridiques from '../categorieJuridiques';


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


const EntreprisesTab = forwardRef(({ selectedNAF, selectedCommunes }, ref) => {
  const [etablissements, setEtablissements] = useState([]);
  const [communeBoundaries, setCommuneBoundaries] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [filters, setFilters] = useState({
    denomination: '',
    commune: '',
    trancheEffectifsUniteLegale: '',
    tranchEffectifEtablissement: '',
    dateCreationUniteLegale: '',
    dateCreationEtablissement: '',
    categorieEntreprise: '',
    categoriesJuridiquesUnitéLegale: '',
    activitePrincipale: ''
  });
  const mapRef = useRef(null);


  useEffect(() => {
    if (selectedNAF && selectedCommunes.length > 0) {
      const fetchEtablissements = selectedCommunes.map(commune => {
        const codeCommune = commune.value;
        return fetch(`https://api.insee.fr/entreprises/sirene/V3.11/siret?q=periode(activitePrincipaleEtablissement%3A${selectedNAF}%20AND%20etatAdministratifEtablissement%3AA%20AND%20-dateFin%3A*)%20AND%20codeCommuneEtablissement%3A${codeCommune}&tri=categorieEntreprise%20asc&nombre=1000`, {
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
        adresse: `${replaceNDWithUndefined(adresseEtablissement.numeroVoieEtablissement) || ''} ${replaceNDWithUndefined(adresseEtablissement.typeVoieEtablissement) || ''} ${replaceNDWithUndefined(adresseEtablissement.libelleVoieEtablissement) || ''} `,
        commune: `${replaceNDWithUndefined(adresseEtablissement.codeCommuneEtablissement)}, ${replaceNDWithUndefined(adresseEtablissement.libelleCommuneEtablissement)}`,
        trancheEffectifsUniteLegale: tranchEffectifsEtablissement[replaceNDWithUndefined(uniteLegale?.trancheEffectifsUniteLegale)] || 'Non renseigné',
        tranchEffectifEtablissement: tranchEffectifsEtablissement[replaceNDWithUndefined(etablissement.trancheEffectifsEtablissement)] || 'Non renseigné',
        dateCreationUniteLegale: formattedDate(uniteLegale?.dateCreationUniteLegale),
        dateCreationEtablissement: formattedDate(etablissement.dateCreationEtablissement),
        categorieEntreprise: replaceNDWithUndefined(uniteLegale?.categorieEntreprise) || 'Non défini',
        categoriesJuridiquesUnitéLegale: categoriesJuridiques[replaceNDWithUndefined(uniteLegale?.categorieJuridiqueUniteLegale)] || 'Non renseigné',
        activitePrincipale: replaceNDWithUndefined(periodesEtablissement[0]?.activitePrincipaleEtablissement),
        coords: coords
    };
};

const handleDownload = () => {
  const data = etablissements.map(transformData).map(({ coords, ...rest }) => rest);
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Entreprises');

  // Define styles
  const headerStyle = { 
    font: { bold: true, sz: 14, color: { rgb: "000000" } },
    alignment: { horizontal: 'center', vertical: 'center' },
    fill: { fgColor: { rgb: "FFFFF0" } }, // Light yellow background
    padding: { top: 10 } // Add padding on top
  };
  const rowStyle = { alignment: { vertical: 'center' } };

  // Apply styles to the header and capitalize first letter
  const range = XLSX.utils.decode_range(worksheet['!ref']);

  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!worksheet[address]) continue;
    
    // Capitalize first letter of the header
    const headerText = worksheet[address].v;
    worksheet[address].v = headerText.charAt(0).toUpperCase() + headerText.slice(1);

    if (!worksheet[address].s) worksheet[address].s = {};
    worksheet[address].s = { ...worksheet[address].s, ...headerStyle };
  }

  // Apply styles to the rows and set row heights
  for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Start from second row
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
      if (!worksheet[cell_address]) continue;
      if (!worksheet[cell_address].s) worksheet[cell_address].s = {};
      worksheet[cell_address].s = { ...worksheet[cell_address].s, ...rowStyle };
    }
    if (!worksheet['!rows']) worksheet['!rows'] = [];
    worksheet['!rows'][R] = { hpx: 20 }; // Set row height to 20 pixels
  }

  // Set header row height
  if (!worksheet['!rows']) worksheet['!rows'] = [];
  worksheet['!rows'][0] = { hpx: 30 }; // Set header row height to 40 pixels

  // Adjust column widths
  const colWidths = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    colWidths.push({ wpx: 150 }); // Set column width to 150 pixels
  }
  worksheet['!cols'] = colWidths;

  // Write the workbook
  XLSX.writeFile(workbook, 'Entreprises.xlsx');
};

const handleFilterChange = (event) => {
  const { name, value } = event.target;
  setFilters({
    ...filters,
    [name]: value,
  });
  setPage(0);
};

const filteredEtablissements = etablissements.filter(etablissement => {
  const transformedData = transformData(etablissement);
  return Object.keys(filters).every(key => {
    const filterValue = filters[key]?.toLowerCase();
    const columnValue = transformedData[key]?.toLowerCase() || '';
    return columnValue.includes(filterValue);
  });
});

const paginatedEtablissements = filteredEtablissements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const zoomToCommune = useCallback((communeCodes) => {
    if (communeBoundaries) {
      const features = communeCodes.map(code =>
        communeBoundaries.features.find(feature => feature.properties.code === code)
      ).filter(feature => feature);
      
      if (features.length > 0) {
        const bounds = L.geoJSON({ type: "FeatureCollection", features }).getBounds();
        if (mapRef.current) {
          mapRef.current.fitBounds(bounds);
        }
      }
    }
  }, [communeBoundaries]);
  
  useEffect(() => {
    if (selectedCommune) {
      zoomToCommune(selectedCommune);
    }
  }, [selectedCommune, zoomToCommune]);

  const HeaderContainer = styled(Box)(({ theme }) => ({
    backgroundColor: '#286AC7', // Desired background color
    paddingTop: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: theme.spacing(2),
    color: 'white',
    marginBottom: '20px'
  }));

  return (
    <Box height="100%" style={{ overflowY: 'auto' }}>
      <HeaderContainer>
        <Typography variant="h5" style={{ marginBottom: '40px', marginLeft: '40px' }}>
        Liste des établissements actifs
        </Typography>
        <IconButton 
          onClick={handleDownload} 
          style={{ 
            color: 'white', 
            marginBottom: '40px',
            display: 'flex', 
            alignItems: 'center',
            transition: 'background-color 0.3s, color 0.3s',
            padding: '5px 10px',
            borderRadius: '5px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '';
            e.currentTarget.style.color = 'white';
          }}
        >
          <GetAppIcon style={{ color: 'white', fontSize: '20px' }} />
          <span style={{ color: 'white', fontSize: '17px', marginLeft: '9px' }}>Télécharger</span>
        </IconButton>
      </HeaderContainer>
      <Box style={{ height: '600px', width: '100%' }}>
        <MapContainer 
          center={[46.603354, 1.888334]} 
          zoom={6} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {communeBoundaries && (
            <GeoJSON 
              data={communeBoundaries} 
              style={{ color: 'blue', weight: 2 }} 
            />
          )}
          {filteredEtablissements
            .filter(etablissement =>
              replaceNDWithUndefined(etablissement.adresseEtablissement.coordonneeLambertAbscisseEtablissement) !== "Non défini" &&
              replaceNDWithUndefined(etablissement.adresseEtablissement.coordonneeLambertOrdonneeEtablissement) !== "Non défini" &&
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
                transformedData.coords && (
                <Marker key={etablissement.index} position={transformedData.coords}>
                  <Popup>
                    <strong style={{ color: 'blue' }}>Siret: </strong> {transformedData.siret}<br />
                    <strong style={{ color: 'blue' }}>Dénomination: </strong> {transformedData.denomination}<br />
                    <strong style={{ color: 'blue' }}>Adresse: </strong> {transformedData.adresse}<br />
                    <strong style={{ color: 'blue' }}>Commune (Code Insee, Libellé): </strong> {transformedData.commune}<br />
                    <strong style={{ color: 'blue' }}>Effectif d'entreprise: </strong> {transformedData.trancheEffectifsUniteLegale}<br />
                    <strong style={{ color: 'blue' }}>Effectif établissement: </strong> {transformedData.tranchEffectifEtablissement}<br />
                    <strong style={{ color: 'blue' }}>Date de création entreprise: </strong> {transformedData.dateCreationUniteLegale}<br />
                    <strong style={{ color: 'blue' }}>Date de création établissement: </strong> {transformedData.dateCreationEtablissement}<br />
                    <strong style={{ color: 'blue' }}>Catégorie d'entreprise: </strong> {transformedData.categorieEntreprise}<br />
                    <strong style={{ color: 'blue' }}>Catégorie Juridique: </strong> {transformedData.categoriesJuridiquesUnitéLegale}<br />
                    <strong style={{ color: 'blue' }}>APE: </strong> {transformedData.activitePrincipale}<br />
                  </Popup>
                </Marker>
                )
              );
            })}
        </MapContainer>
      </Box>
      <TableContainer component={Paper} style={{ marginTop: '20px', maxWidth: '100%', overflowX: 'auto' }}>
        <Table aria-label="simple table" style={{width: '650px'}}>
          <TableHead style={{ backgroundColor: 'grey' }}>
            <TableRow>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Siret</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Dénomination</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Adresse</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Commune (Code Insee, Libellé) </TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Tranche effectif d'entreprise</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Tranche effectif établissement</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Date de création entreprise</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Date de création établissement</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Catégorie d'entreprise</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>Catégorie Juridique</TableCell>
              <TableCell style={{ color: 'white', fontWeight: 'bold' }}>APE</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="siret"
                    value={filters.siret}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="denomination"
                    value={filters.denomination}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="addresse"
                    value={filters.addresse}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="commune"
                    value={filters.commune}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="trancheEffectifsUniteLegale"
                    value={filters.trancheEffectifsUniteLegale}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="tranchEffectifEtablissement"
                    value={filters.tranchEffectifEtablissement}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="dateCreationUniteLegale"
                    value={filters.dateCreationUniteLegale}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="dateCreationEtablissement"
                    value={filters.dateCreationEtablissement}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="categorieEntreprise"
                    value={filters.categorieEntreprise}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="categoriesJuridiquesUnitéLegale"
                    value={filters.categoriesJuridiquesUnitéLegale}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
                <TableCell style={{ backgroundColor: 'white' }}>
                  <TextField
                    name="activitePrincipale"
                    value={filters.activitePrincipale}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                </TableCell>
              </TableRow>
          </TableHead >
          <TableBody>
          {paginatedEtablissements.map((etablissement, index) => {
              const transformedData = transformData(etablissement);
    console.log('Etablissement:', etablissement);
    console.log('Index:', index);
    console.log('Background Color:', index % 2 === 0 ? '#f5f5f5' : 'white');
    
    return (
      <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
        <TableCell>{transformedData.siret}</TableCell>
        <TableCell>{transformedData.denomination}</TableCell>
        <TableCell>{transformedData.adresse}</TableCell>
        <TableCell>{transformedData.commune}</TableCell>
        <TableCell>{transformedData.trancheEffectifsUniteLegale}</TableCell>
        <TableCell>{transformedData.tranchEffectifEtablissement}</TableCell>
        <TableCell>{transformedData.dateCreationUniteLegale}</TableCell>
        <TableCell>{transformedData.dateCreationEtablissement}</TableCell>
        <TableCell>{transformedData.categorieEntreprise}</TableCell>
        <TableCell>{transformedData.categoriesJuridiquesUnitéLegale}</TableCell>
        <TableCell>{transformedData.activitePrincipale}</TableCell>
      </TableRow>
    ); 
  })}

          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEtablissements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />

      </TableContainer>
    </Box>
  );
});

export default EntreprisesTab;
