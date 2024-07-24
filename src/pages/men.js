import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import Plot from 'react-plotly.js';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Typography, CircularProgress } from '@mui/material';

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const fetchData = async (codes, urlTemplate) => {
  const fetchWithRetry = async (code, retries = 5, delay = 1000) => {
    try {
      const response = await axios.get(urlTemplate.replace('{code}', code), {
        headers: {
          Authorization: ''
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429 && retries > 0) {
        console.warn(`Rate limited, retrying code: ${code}, retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(code, retries - 1, delay * 2); // Exponential backoff
      } else {
        console.error(`Failed to fetch data for code: ${code}`, error);
        return null;
      }
    }
  };

  const responses = await Promise.all(codes.map(code => fetchWithRetry(code)));
  return responses.reduce((acc, curr) => {
    if (curr) {
      if (!acc.Variable && curr.Variable) {
        acc.Variable = curr.Variable;
      }
      if (curr.Cellule && Array.isArray(curr.Cellule)) {
        curr.Cellule.forEach(cell => {
          const found = acc.Cellule.find(c =>
            c.Modalite['@code'] === cell.Modalite['@code'] &&
            c.Modalite['@variable'] === cell.Modalite['@variable'] &&
            c.Mesure['@code'] === cell.Mesure['@code']
          );
          if (found) {
            found.Valeur = (parseFloat(found.Valeur) + parseFloat(cell.Valeur)).toString();
          } else {
            acc.Cellule.push({ ...cell });
          }
        });
      }
    }
    return acc;
  }, { Cellule: [] });
};

const Menage = forwardRef(({ communeCodes = [], departmentCodes = [] }, ref) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();
  const chartsRef = useRef([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        let codes = communeCodes.length > 0 ? communeCodes : departmentCodes;
        let urlTemplate = communeCodes.length > 0 
          ? 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-CS1_8@GEO2023RP2020/COM-{code}.all'
          : 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-CS1_8@GEO2023RP2020/DEP-{code}.all';

        console.log('Fetching data with codes:', codes); // Debugging fetch codes
        console.log('Using URL template:', urlTemplate); // Debugging URL template

        const mergedData = await fetchData(codes, urlTemplate);
        console.log('Fetched data:', JSON.stringify(mergedData, null, 2)); // Debugging fetched data

        setData(mergedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if ((communeCodes && communeCodes.length > 0) || (departmentCodes && departmentCodes.length > 0)) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [communeCodes, departmentCodes]);

  useImperativeHandle(ref, () => ({
    getMenageData: () => {
      if (!data) return [];
      return data.Cellule.map(cell => ({
        csCode: cell.Modalite['@code'],
        valeur: Math.round(parseFloat(cell.Valeur))
      }));
    },
    getTableElement: () => tableRef.current,
    getChartElements: () => chartsRef.current
  }));

  if (loading) {
    return <CircularProgress />;
  }

  if (!data || !data.Cellule || data.Cellule.length === 0) {
    return (
      <Box style={{ textAlign: 'center', marginTop: '20px' }}>
        <img src='/no-results.png' alt="No results" style={{ width: '200px', height: '200px', marginTop: '20px', marginBottom: '10px' }} />
        <Typography variant='h5'>Ups... résultats non trouvés</Typography>
        <Typography variant='h6'>Veuillez sélectionner une autre commune ou département</Typography>
      </Box>
    );
  }

  const transformDataForTable = (data) => {
    if (!data || !data.Cellule || !data.Variable) return [];

    const csVariable = data.Variable;

    const categoryLabels = {};
    csVariable.Modalite.forEach(mod => {
      categoryLabels[mod['@code']] = mod.Libelle;
    });

    const categoryData = {};

    data.Cellule.forEach(cell => {
      const csCode = cell.Modalite['@code'];
      const value = Math.round(parseFloat(cell.Valeur));
      const measureCode = cell.Mesure['@code'];

      if (!categoryData[csCode]) {
        categoryData[csCode] = { Population: 0, NombreDeLogements: 0 };
      }

      if (measureCode === 'POP') {
        categoryData[csCode].Population += value;
      } else if (measureCode === 'NBLOG') {
        categoryData[csCode].NombreDeLogements += value;
      }
    });

    console.log('Transformed data for table:', categoryData); // Debugging transformed data

    return Object.entries(categoryData).map(([csCode, values]) => ({
      category: categoryLabels[csCode],
      Population: values.Population,
      NombreDeLogements: values.NombreDeLogements
    }));
  };

  const tableData = transformDataForTable(data);

  // Move the last row to the second index
  if (tableData.length > 1) {
    const lastRow = tableData.pop();
    tableData.splice(0, 0, lastRow);
  }

  const chartData = tableData.filter(row => row.category !== 'Ensemble');

  console.log('Chart data:', chartData); // Debugging chart data

  if (chartData.length === 0 && tableData.length === 0) {
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
      <Typography variant="h6" mt={6} mb={6} style={{ textAlign: 'center' }}>Ménages selon la catégorie socioprofessionnelle de la personne de référence </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box style={{ height: 600 }}>
            <Plot
              data={[
                {
                  x: chartData.map(row => row.category),
                  y: chartData.map(row => row.NombreDeLogements),
                  type: 'bar',
                  name: 'Nombre de ménages',
                  marker: { color: 'orange' },
                  hovertemplate: '%{x}<br>Nombre de ménages: %{y:,}<extra></extra>'
                },
                {
                  x: chartData.map(row => row.category),
                  y: chartData.map(row => row.Population),
                  type: 'bar',
                  name: 'Population',
                  marker: { color: 'blue' },
                  hovertemplate: '%{x}<br>Population: %{y:,}<extra></extra>'
                }
              ]}
              layout={{
                title: '',
                autosize: true,
                barmode: 'group',
                margin: { l: 70, r: 50, b: 50, t: 50, pad: 10 },
                legend: {
                  orientation: 'h',
                  y: -0.6,
                  x: 0.2
                }
              }}
              style={{ width: '100%', height: '100%' }}
              ref={el => chartsRef.current[0] = el}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white', textAlign: 'center', }}>Catégorie Socioprofessionnelle</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center', }}>Population</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center', }}>Nombre de ménages</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell style={{ textAlign: 'center', }}>{row.category}</TableCell>
                    <TableCell style={{ textAlign: 'center', }}>{formatNumber(row.Population)}</TableCell>
                    <TableCell style={{ textAlign: 'center', }}>{formatNumber(row.NombreDeLogements)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
});

Menage.propTypes = {
  communeCode: PropTypes.array,
  departmentCode: PropTypes.array
};

export default Menage;
