import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TablePagination } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { GetApp as GetAppIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import proj4 from 'proj4';
import { styled } from '@mui/system';

// 
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

const categoriesJuridiques = {
  '0000': 'Organisme de placement collectif en valeurs mobilières sans personnalité morale',
  '1000': 'Entrepreneur individuel',
  '2110': 'Indivision entre personnes physiques',
  '2120': 'Indivision avec personne morale',
  '2210': 'Société créée de fait entre personnes physiques',
  '2220': 'Société créée de fait avec personne morale',
  '2310': 'Société en participation entre personnes physiques',
  '2320': 'Société en participation avec personne morale',
  '2385': 'Société en participation de professions libérales',
  '2400': 'Fiducie',
  '2700': 'Paroisse hors zone concordataire',
  '2800': 'Assujetti unique à la TVA',
  '2900': 'Autre groupement de droit privé non doté de la personnalité morale',
  '3110': 'Représentation ou agence commerciale d\'état ou organisme public étranger immatriculé au RCS',
  '3120': 'Société commerciale étrangère immatriculée au RCS',
  '3205': 'Organisation internationale',
  '3210': 'État, collectivité ou établissement public étranger',
  '3220': 'Société étrangère non immatriculée au RCS',
  '3290': 'Autre personne morale de droit étranger',
  '4110': 'Établissement public national à caractère industriel ou commercial doté d\'un comptable public',
  '4120': 'Établissement public national à caractère industriel ou commercial non doté d\'un comptable public',
  '4130': 'Exploitant public',
  '4140': 'Établissement public local à caractère industriel ou commercial',
  '4150': 'Régie d\'une collectivité locale à caractère industriel ou commercial',
  '4160': 'Institution Banque de France',
  '5191': 'Société de caution mutuelle',
  '5192': 'Société coopérative de banque populaire',
  '5193': 'Caisse de crédit maritime mutuel',
  '5194': 'Caisse (fédérale) de crédit mutuel',
  '5195': 'Association coopérative inscrite (droit local Alsace Moselle)',
  '5196': 'Caisse d\'épargne et de prévoyance à forme coopérative',
  '5202': 'Société en nom collectif',
  '5203': 'Société en nom collectif coopérative',
  '5306': 'Société en commandite simple',
  '5307': 'Société en commandite simple coopérative',
  '5308': 'Société en commandite par actions',
  '5309': 'Société en commandite par actions coopérative',
  '5310': 'Société en libre partenariat (SLP)',
  '5370': 'Société de Participations Financières de Profession Libérale Société en commandite par actions (SPFPL SCA)',
  '5385': 'Société d\'exercice libéral en commandite par actions',
  '5410': 'SARL nationale',
  '5415': 'SARL d\'économie mixte',
  '5422': 'SARL immobilière pour le commerce et l\'industrie (SICOMI)',
  '5426': 'SARL immobilière de gestion',
  '5430': 'SARL d\'aménagement foncier et d\'équipement rural (SAFER)',
  '5431': 'SARL mixte d\'intérêt agricole (SMIA)',
  '5432': 'SARL d\'intérêt collectif agricole (SICA)',
  '5442': 'SARL d\'attribution',
  '5443': 'SARL coopérative de construction',
  '5451': 'SARL coopérative de consommation',
  '5453': 'SARL coopérative artisanale',
  '5454': 'SARL coopérative d\'intérêt maritime',
  '5455': 'SARL coopérative de transport',
  '5458': 'SARL coopérative de production (SCOP)',
  '5459': 'SARL union de sociétés coopératives',
  '5460': 'Autre SARL coopérative',
  '5470': 'Société de Participations Financières de Profession Libérale Société à responsabilité limitée (SPFPL SARL)',
  '5485': 'Société d\'exercice libéral à responsabilité limitée',
  '5499': 'Société à responsabilité limitée (sans autre indication)',
  '5505': 'SA à participation ouvrière à conseil d\'administration',
  '5510': 'SA nationale à conseil d\'administration',
  '5515': 'SA d\'économie mixte à conseil d\'administration',
  '5520': 'Fonds à forme sociétale à conseil d\'administration',
  '5522': 'SA immobilière pour le commerce et l\'industrie (SICOMI) à conseil d\'administration',
  '5525': 'SA immobilière d\'investissement à conseil d\'administration',
  '5530': 'SA d\'aménagement foncier et d\'équipement rural (SAFER) à conseil d\'administration',
  '5531': 'Société anonyme mixte d\'intérêt agricole (SMIA) à conseil d\'administration',
  '5532': 'SA d\'intérêt collectif agricole (SICA) à conseil d\'administration',
  '5542': 'SA d\'attribution à conseil d\'administration',
  '5543': 'SA coopérative de construction à conseil d\'administration',
  '5546': 'SA de HLM à conseil d\'administration',
  '5547': 'SA coopérative de production de HLM à conseil d\'administration',
  '5548': 'SA de crédit immobilier à conseil d\'administration',
  '5551': 'SA coopérative de consommation à conseil d\'administration',
  '5552': 'SA coopérative de commerçants-détaillants à conseil d\'administration',
  '5553': 'SA coopérative artisanale à conseil d\'administration',
  '5554': 'SA coopérative (d\'intérêt) maritime à conseil d\'administration',
  '5555': 'SA coopérative de transport à conseil d\'administration',
  '5558': 'SA coopérative de production (SCOP) à conseil d\'administration',
  '5559': 'SA union de sociétés coopératives à conseil d\'administration',
  '5560': 'Autre SA coopérative à conseil d\'administration',
  '5570': 'Société de Participations Financières de Profession Libérale Société anonyme à conseil d\'administration (SPFPL SA à conseil d\'administration)',
  '5585': 'Société d\'exercice libéral à forme anonyme à conseil d\'administration',
  '5599': 'SA à conseil d\'administration (s.a.i.)',
  '5605': 'SA à participation ouvrière à directoire',
  '5610': 'SA nationale à directoire',
  '5615': 'SA d\'économie mixte à directoire',
  '5620': 'Fonds à forme sociétale à directoire',
  '5622': 'SA immobilière pour le commerce et l\'industrie (SICOMI) à directoire',
  '5625': 'SA immobilière d\'investissement à directoire',
  '5630': 'Safer anonyme à directoire',
  '5631': 'SA mixte d\'intérêt agricole (SMIA)',
  '5632': 'SA d\'intérêt collectif agricole (SICA)',
  '5642': 'SA d\'attribution à directoire',
  '5643': 'SA coopérative de construction à directoire',
  '5646': 'SA de HLM à directoire',
  '5647': 'Société coopérative de production de HLM anonyme à directoire',
  '5648': 'SA de crédit immobilier à directoire',
  '5651': 'SA coopérative de consommation à directoire',
  '5652': 'SA coopérative de commerçants-détaillants à directoire',
  '5653': 'SA coopérative artisanale à directoire',
  '5654': 'SA coopérative d\'intérêt maritime à directoire',
  '5655': 'SA coopérative de transport à directoire',
  '5658': 'SA coopérative de production (SCOP) à directoire',
  '5659': 'SA union de sociétés coopératives à directoire',
  '5660': 'Autre SA coopérative à directoire',
  '5670': 'Société de Participations Financières de Profession Libérale Société anonyme à Directoire (SPFPL SA à directoire)',
  '5685': 'Société d\'exercice libéral à forme anonyme à directoire',
  '5699': 'SA à directoire (s.a.i.)',
  '5710': 'SAS, société par actions simplifiée',
  '5720': 'Société par actions simplifiée d\'un seul associé',
  '5730': 'Société par actions simplifiée de HLM',
  '5770': 'Société de Participations Financières de Profession Libérale Société par actions simplifiée (SPFPL SAS)',
  '5785': 'Société d\'exercice libéral par actions simplifiée',
  '5800': 'Société Européenne',
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
      console.log('Converted coordinates:', { x, y, lat, lng });
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
        Liste des Entreprises
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
          {etablissements
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
                <Marker key={index} position={transformedData.coords}>
                  <Popup>
                    <strong style={{ color: 'blue' }}>Siret: </strong> {transformedData.siret}<br />
                    <strong style={{ color: 'blue' }}>Dénomination: </strong> {transformedData.denomination}<br />
                    <strong style={{ color: 'blue' }}>Adresse: </strong> {transformedData.adresse}<br />
                    <strong style={{ color: 'blue' }}>Commune (Code Insee, Libellé): </strong> {transformedData.commune}<br />
                    <strong style={{ color: 'blue' }}>Effectif d'entreprise: </strong> {transformedData.trancheEffectifsUniteLegale}<br />
                    <strong style={{ color: 'blue' }}>Effectif Etablissement: </strong> {transformedData.tranchEffectifEtablissement}<br />
                    <strong style={{ color: 'blue' }}>Date de création Entreprise: </strong> {transformedData.dateCreationUniteLegale}<br />
                    <strong style={{ color: 'blue' }}>Date de création Etablissement: </strong> {transformedData.tranchEffectifEtablissement}<br />
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
      <TableContainer component={Paper} style={{ marginTop: '20px', maxWidth: '1200px' }}>
        <Table aria-label="simple table" style={{width: '100%'}}>
          <TableHead style={{ backgroundColor: 'grey' }}>
            <TableRow>
              <TableCell style={{ color: 'white' }}>Siret</TableCell>
              <TableCell style={{ color: 'white' }}>Dénomination</TableCell>
              <TableCell style={{ color: 'white' }}>Adresse</TableCell>
              <TableCell style={{ color: 'white' }}>Commune (Code Insee, Libellé) </TableCell>
              <TableCell style={{ color: 'white' }}>Tranche effectif d'entreprise</TableCell>
              <TableCell style={{ color: 'white' }}>Tranche effectif Etablissement</TableCell>
              <TableCell style={{ color: 'white' }}>Date de création Entreprise</TableCell>
              <TableCell style={{ color: 'white' }}>Date de création Etablissement</TableCell>
              <TableCell style={{ color: 'white' }}>Catégorie d'entreprise</TableCell>
              <TableCell style={{ color: 'white' }}>Catégorie Juridique</TableCell>
              <TableCell style={{ color: 'white' }}>APE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {etablissements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((etablissement, index) => {
              const transformedData = transformData(etablissement);
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
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={etablissements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
        />
      </TableContainer>
    </Box>
  );
});

export default EntreprisesTab;
