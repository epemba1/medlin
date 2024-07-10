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
  const aggregatedData = {
    totalMenages: 0,
    totalPersonnes: 0,
    revenusDisponibles: []
  };

  data.forEach(item => {
    item.Cellule.forEach(cell => {
      const { Mesure, Valeur } = cell;
      const valeurNumerique = parseFloat(Valeur);

      switch (Mesure['@code']) {
        case 'NBMEN':
          aggregatedData.totalMenages += valeurNumerique;
          break;
        case 'NBPERS':
          aggregatedData.totalPersonnes += valeurNumerique;
          break;
        case 'MEDIANE':
          aggregatedData.revenusDisponibles.push(valeurNumerique);
          break;
        default:
          break;
      }
    });
  });

  // Calculate the median of the combined revenues
  aggregatedData.medianRevenus = calculateMedian(aggregatedData.revenusDisponibles);

  return aggregatedData;
};

const calculateMedian = (values) => {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);

  if (values.length % 2) {
    return values[half];
  } else {
    return (values[half - 1] + values[half]) / 2.0;
  }
};

const Mediane = forwardRef((props, ref) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const revenuUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-INDICS_FILO_DISP@GEO2023FILO2020_BV/COM-{communeCode}.all';
        const mergedData = await fetchData(props.communeCodes, revenuUrl);
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
    getRevenuData: () => {
      if (!data) return [];
      return data;
    },
    getTableElement: () => tableRef.current
  }));

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h6" style={{ textAlign: 'center' }}>Revenus des ménages</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TableContainer component={Paper} style={{ maxWidth: '100%', margin: '0 auto' }}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Mesure</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Valeur</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell style={{ textAlign: 'center' }}>Nombre de ménages fiscaux</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>{formatNumber(data.totalMenages)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: 'center' }}>Nombre de personnes fiscales</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>{formatNumber(data.totalPersonnes)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: 'center' }}>Médiane du revenu disponible</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>{formatNumber(data.medianRevenus)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
});

export default Mediane;
