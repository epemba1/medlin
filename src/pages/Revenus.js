import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

const formatNumber = (num) => {
  if (num === null || num === undefined || num === "") return "0";
  const roundedNum = Math.round(num * 100) / 100; // Round to two decimal places
  const [integerPart, decimalPart] = roundedNum.toString().split('.');
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (decimalPart) {
    const trimmedDecimalPart = decimalPart.replace(/0+$/, ''); // Remove trailing zeroes
    return `${formattedIntegerPart},${trimmedDecimalPart}`;
  } else {
    return formattedIntegerPart; // No decimal part needed if it's 0
  }
};


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
    D1: [],
    D9: [],
    RD: [],
    TP60: [],
    PACT: [],
    PTSA: [],
    PCHO: [],
    PBEN: [],
    PPEN: [],
    PPAT: [],
    PPSOC: [],
    PPFAM: [],
    PPMINI: [],
    PPLOGT: [],
    PIMPOT: []
  };

  data.forEach(item => {
    if (item && item.Cellule) {
      item.Cellule.forEach(cell => {
        const { Mesure, Valeur } = cell;
        if (Valeur !== undefined) {
          const valeurNumerique = parseFloat(Valeur) || 0;

          if (aggregatedData.hasOwnProperty(Mesure['@code'])) {
            aggregatedData[Mesure['@code']].push(valeurNumerique);
          }
        }
      });
    }
  });

  // Calculate means for each measure
  for (const key in aggregatedData) {
    aggregatedData[key] = calculateMean(aggregatedData[key]);
  }

  return aggregatedData;
};

const calculateMean = (values) => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

const Revenus = forwardRef((props, ref) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const revenuUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-INDICS_FILO_DISP_DET@GEO2023FILO2020_BV/COM-{communeCode}.all';
        const mergedData = await fetchData(props.communeCodes, revenuUrl);
        if (mergedData.length > 0) {
          console.log('Fetched data:', mergedData); // Log fetched data for debugging
          setData(parseData(mergedData));
        } else {
          setData(null); // If no data is returned for all communes
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setData(null);
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

  if (!data) {
    return (
      <Box style={{ textAlign: 'center', marginTop: '20px' }}>
        <img src='/no-results.png' alt="No results" style={{ width: '200px', height: '200px', marginTop: '20px', marginBottom: '10px' }} />
        <Typography variant='h5'>Ups... résultats non trouvés</Typography>
        <Typography variant='h6'>Veuillez sélectionner une autre commune ou département</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" mt={6} mb={6} style={{ textAlign: 'center', marginTop: '50px' }}>Distribution des revenus disponibles de l'année 2020</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
        <TableContainer component={Paper} style={{ maxWidth: '100%', margin: '0 auto', width:'800px ' }}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}></TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>2020</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '#f5f5f5' }}>1er décile (en euros)</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>{formatNumber(data.D1)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '' }}>9e décile (en euros)</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>{formatNumber(data.D9)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '#f5f5f5' }}>Rapport interdécile</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>{formatNumber(data.RD)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '' }}>Taux de pauvreté</TableCell>
                  <TableCell style={{ textAlign: 'center' }}>{formatNumber(data.TP60)}</TableCell>
                </TableRow>
                </TableBody>
                </Table>
          </TableContainer>

          <Typography variant="h6" mt={6} mb={6} style={{ textAlign: 'center' }}>Décomposition des revenus disponibles sur l'année 2020</Typography>
          <TableContainer component={Paper} style={{ maxWidth: '100%', margin: '0 auto', width:'800px ' }}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}></TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>part en %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Ensemble</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>100,0</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '', fontWeight: 'bold' }}>Revenus d'activité</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '', fontWeight: 'bold' }}>{formatNumber(data.PACT)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '#f5f5f5' }}>dont salaires ou traitements hors indemnités de chômage</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>{formatNumber(data.PTSA)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '' }}>dont des indemnités de chômage</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '' }}>{formatNumber(data.PCHO)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '#f5f5f5' }}>dont revenus des activités non salariées</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>{formatNumber(data.PBEN)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '', fontWeight: 'bold' }}>Pensions, retraites, et rentes</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '', fontWeight: 'bold' }}>{formatNumber(data.PPEN)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Revenus du patrimoine</TableCell>
                  <TableCell style={{ textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>{formatNumber(data.PPAT)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '', fontWeight: 'bold' }}>Ensemble des prestations sociales</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '', fontWeight: 'bold' }}>{formatNumber(data.PPSOC)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '#f5f5f5' }}>Prestations familiales</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>{formatNumber(data.PPFAM)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '' }}>Minima sociaux</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '' }}>{formatNumber(data.PPMINI)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '#f5f5f5' }}>Prestations logements</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '#f5f5f5' }}>{formatNumber(data.PPLOGT)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ textAlign: '', backgroundColor: '', fontWeight: 'bold' }}>Impôts</TableCell>
                  <TableCell style={{ textAlign: 'center', backgroundColor: '', fontWeight: 'bold' }}>{formatNumber(data.PIMPOT)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
});

export default Revenus;
