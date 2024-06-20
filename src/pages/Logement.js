import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Typography, CircularProgress } from '@mui/material';
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
        console.error(`Failed to fetch data for commune code: ${communeCode}`, error);
        return null;
      }
    }
  };

  const responses = await Promise.all(communeCodes.map(communeCode => fetchWithRetry(communeCode)));
  return responses.filter(response => response !== null);
};

const parseData = (data) => {
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

  console.log('Parsed data:', parsedData); // Log the parsed data
  return parsedData;
};

const logementLabels = {
  ENS: 'Ensemble',
  1: 'Maisons',
  2: 'Appartements',
  3: 'Autres'
};

const Logement = forwardRef((props, ref) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const logementUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-TYPLR-CATL@GEO2023RP2020/COM-{communeCode}.all.all';
        const mergedData = await fetchData(props.communeCodes, logementUrl);
        console.log('Fetched data:', mergedData); // Log fetched data for debugging
        setData(parseData(mergedData));
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
      if (!data) return [];
      return data;
    },
    getTableElement: () => tableRef.current
  }));

  const renderTableData = (dataset) => {
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

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h6" style={{ textAlign: 'center' }}>Nombre de Pièces</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TableContainer component={Paper} style={{ maxWidth: '100%', margin: '0 auto' }}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Type de Logement</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Ensemble</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Résidences principales</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Logements occasionnels</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Résidences secondaires</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Logements vacants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data && renderTableData(data.pieces)}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Typography variant="h6" style={{ textAlign: 'center', marginTop: '50px' }}>Nombre de Logements</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TableContainer component={Paper} style={{ maxWidth: '100%', margin: '0 auto' }}>
            <Table>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Type de Logement</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Ensemble</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Résidences principales</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Logements occasionnels</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Résidences secondaires</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Logements vacants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data && renderTableData(data.logements)}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
});

export default Logement;
