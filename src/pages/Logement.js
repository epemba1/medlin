import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Typography, CircularProgress, Box } from '@mui/material';
import axios from 'axios';

const formatNumber = (num) => Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const fetchData = async (communeCodes, urlTemplate) => {
  const fetchWithRetry = async (communeCode, retries = 5, delay = 1000) => {
    try {
      const response = await axios.get(urlTemplate.replace('{communeCode}', communeCode), {
        headers: {
          Authorization: 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429 && retries > 0) {
        console.warn(`Rate limited, retrying commune code: ${communeCode}, retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(communeCode, retries - 1, delay * 2); // Exponential backoff
      } else {
        console.error(`Failed to fetch data for commune code: ${communeCode}, error: ${error}`);
        return null;
      }
    }
  };

  const responses = await Promise.all(communeCodes.map(communeCode => fetchWithRetry(communeCode)));
  return responses.filter(response => response !== null);
};

const parseLogementData = (data) => {
  const parsedData = {
    pieces: {},
    logements: {},
  };

  data.forEach(item => {
    item.Cellule.forEach(cell => {
      const { Mesure, Modalite, Valeur } = cell;
      const category = Modalite.find(mod => mod['@variable'] === 'TYPLR')?.['@code'];
      const subcategory = Modalite.find(mod => mod['@variable'] === 'CATL')?.['@code'];

      if (category && subcategory) {
        if (Mesure['@code'] === 'NBPIECES') {
          if (!parsedData.pieces[category]) {
            parsedData.pieces[category] = {};
          }
          parsedData.pieces[category][subcategory] = (parsedData.pieces[category][subcategory] || 0) + parseFloat(Valeur);
        } else if (Mesure['@code'] === 'NBLOG') {
          if (!parsedData.logements[category]) {
            parsedData.logements[category] = {};
          }
          parsedData.logements[category][subcategory] = (parsedData.logements[category][subcategory] || 0) + parseFloat(Valeur);
        }
      }
    });
  });

  return parsedData;
};

const parsePiecesData = (data) => {
  const parsedData = {};

  data.forEach(item => {
    item.Cellule.forEach(cell => {
      const { Modalite, Valeur } = cell;
      const category = Modalite['@code']; // Directly access the '@code' property

      if (category) {
        parsedData[category] = (parsedData[category] || 0) + parseFloat(Valeur);
      }
    });
  });

  return parsedData;
};

const parseStatutOccupationData = (data) => {
  const parsedData = {
    logements: {},
  };

  data.forEach(item => {
    item.Cellule.forEach(cell => {
      const { Mesure, Modalite, Valeur } = cell;
      const subcategory = Modalite['@code'];

      if (subcategory) {
        if (!parsedData.logements[subcategory]) {
          parsedData.logements[subcategory] = {
            NBLOG: 0,
            POP: 0,
            DUREE: 0
          };
        }
        parsedData.logements[subcategory][Mesure['@code']] += parseFloat(Valeur);
      }
    });
  });

  return parsedData;
};

const logementLabels = {
  ENS: 'Ensemble',
  1: 'Maisons',
  2: 'Appartements',
  3: 'Autres'
};

const pieceLabels = {
  ENS: 'Ensemble',
  1: '1 pièce',
  2: '2 pièces',
  3: '3 pièces',
  4: '4 pièces',
  5: '5 pièces ou plus'
};

const statutOccupationLabels = {
  ENS: 'Ensemble',
  10: 'Propriétaire',
  21: "Locataire ou sous-locataire d'un logement loué vide non HLM",
  22: "Locataire ou sous-locataire d'un logement loué vide HLM",
  23: "Locataire ou sous-locataire d'un logement loué meublé ou d'une chambre d'hôtel",
  30: 'Logé gratuitement'
};

const Logement = forwardRef((props, ref) => {
  const [logementData, setLogementData] = useState(null);
  const [piecesData, setPiecesData] = useState(null);
  const [statutOccupationData, setStatutOccupationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const logementUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-TYPLR-CATL@GEO2023RP2020/COM-{communeCode}.all.all';
        const piecesUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-NBPIR5P@GEO2023RP2020/COM-{communeCode}.all';
        const statutOccupationUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-STOCD@GEO2023RP2020/COM-{communeCode}.all';
        
        const logementData = await fetchData(props.communeCodes, logementUrl);
        const piecesData = await fetchData(props.communeCodes, piecesUrl);
        const statutOccupationData = await fetchData(props.communeCodes, statutOccupationUrl);
        
        setLogementData(parseLogementData(logementData));
        setPiecesData(parsePiecesData(piecesData));
        setStatutOccupationData(parseStatutOccupationData(statutOccupationData));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (props.communeCodes.length > 0) {
      fetchAllData();
    }
  }, [props.communeCodes]);

  useImperativeHandle(ref, () => ({
    getLogementData: () => {
      if (!logementData) return [];
      return logementData;
    },
    getPiecesData: () => {
      if (!piecesData) return [];
      return piecesData;
    },
    getStatutOccupationData: () => {
      if (!statutOccupationData) return [];
      return statutOccupationData;
    },
    getTableElement: () => tableRef.current
  }));

  const renderLogementTableData = (dataset) => {
    const categories = ['ENS', '1', '2', '3']; // Ensure these codes match your API's response
    const subcategories = ['ENS', '1', '2', '3', '4']; // Ensure these codes match your API's response

    return categories.map((category, index) => {
      const categoryData = dataset[category] || {}; // Ensure categoryData is an object
      const categoryLabel = logementLabels[category] || category; // Get the label for the category

      return (
        <TableRow key={category} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
          <TableCell style={{textAlign: 'center'}}>{categoryLabel}</TableCell>
          {subcategories.map((subcategory) => (
            <TableCell style={{textAlign: 'center'}} key={subcategory}>{formatNumber(categoryData[subcategory] || 0)}</TableCell>
          ))}
        </TableRow>
      );
    });
  };

  const renderPiecesTableData = (data) => {
    return Object.keys(data).map((category, index) => (
      <TableRow key={category} style={{ backgroundColor: index % 2 === 0 ? 'lightgrey' : 'white' }}>
        <TableCell style={{ textAlign: 'center' }}>{pieceLabels[category] || category}</TableCell>
        <TableCell style={{ textAlign: 'center' }}>{formatNumber(data[category])}</TableCell>
      </TableRow>
    ));
  };

  const renderStatutOccupationTableData = (dataset) => {
    const subcategories = Object.keys(dataset);

    return subcategories.map((subcategory, index) => {
      const categoryData = dataset[subcategory];
      const categoryLabel = statutOccupationLabels[subcategory] || subcategory;

      return (
        <TableRow key={subcategory} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
          <TableCell style={{ textAlign: 'center' }}>{categoryLabel}</TableCell>
          <TableCell style={{ textAlign: 'center' }}>{formatNumber(categoryData.NBLOG)}</TableCell>
          <TableCell style={{ textAlign: 'center' }}>{formatNumber(categoryData.POP)}</TableCell>
          <TableCell style={{ textAlign: 'center' }}>{formatNumber(categoryData.DUREE)}</TableCell>
        </TableRow>
      );
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box style={{paddingLeft: '20px'}}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Nombre de logements par catégorie
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Type de logement</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Ensemble</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Résidences principales</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Logements occasionnels</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Résidences secondaires</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Logements vacants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderLogementTableData(logementData.logements)}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Résidences principales selon le nombre de pièces
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Nombre de pièces regroupé</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Nombre de logements</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderPiecesTableData(piecesData)}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Résidences principales selon le statut d'occupation
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Statut d'occupation du logement</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Nombre de logements</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Population</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Nombre d'heures annuelles travaillées</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderStatutOccupationTableData(statutOccupationData.logements)}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
      <Typography variant="caption" style={{display: 'flex', justifyContent: 'flex-end', marginTop: '40px'}}> Source : Insee, RP2020 exploitation principale, géographie au 01/01/2023.</Typography>
    </Box>
  );
});

export default Logement;
