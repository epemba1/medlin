import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Typography, CircularProgress } from '@mui/material';

//Number format
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const fetchData = async (communeCodes, urlTemplate) => {
  const responses = await Promise.all(communeCodes.map(async (communeCode) => {
    let response;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 1000; // 1 second

    while (retryCount < maxRetries) {
      try {
        response = await axios.get(urlTemplate.replace('{communeCode}', communeCode), {
          headers: {
            Authorization: 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
          }
        });
        break; // Break out of the loop if request is successful
      } catch (error) {
        if (error.response && error.response.status === 429) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          throw error;
        }
      }
    }

    if (response) {
      return response.data;
    } else {
      throw new Error(`Failed to fetch data for commune code: ${communeCode}`);
    }
  }));

  return responses.reduce((acc, curr) => {
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
    return acc;
  }, { Cellule: [] });
};

const Menage = forwardRef(({ communeCodes }, ref) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();
  const chartsRef = useRef([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const menageUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-CS1_8@GEO2023RP2020/COM-{communeCode}.all';
        const mergedData = await fetchData(communeCodes, menageUrl);
        console.log('Fetched data:', mergedData); // Debugging fetched data
        setData(mergedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    if (communeCodes.length > 0) {
      fetchAllData();
    }
  }, [communeCodes]);

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

  const transformDataForTable = (data) => {
    if (!data || !data.Cellule || !data.Variable) return [];

    console.log('Transforming data:', data); // Debugging raw data

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

    console.log('Category data:', categoryData); // Debugging transformed data

    return Object.entries(categoryData).map(([csCode, values]) => ({
      category: categoryLabels[csCode],
      Population: values.Population,
      NombreDeLogements: values.NombreDeLogements
    }));
  };

  const tableData = transformDataForTable(data);
  console.log('Table data:', tableData); // Debugging table data

  const chartData = tableData.filter(row => row.category && row.category !== 'Ensemble');
  console.log('Chart data:', chartData); // Debugging chart data

  const chartCategories = chartData.map(row => row.category);
  const chartPopulation = chartData.map(row => row.Population);
  const chartLogements = chartData.map(row => row.NombreDeLogements);

  // Check for empty or undefined values in chart data
  if (chartCategories.includes(undefined) || chartPopulation.includes(undefined) || chartLogements.includes(undefined)) {
    console.error('Undefined values found in chart data', { chartCategories, chartPopulation, chartLogements });
  }

  console.log('Chart categories:', chartCategories);
  console.log('Chart population:', chartPopulation);
  console.log('Chart logements:', chartLogements);

  return (
    <Box>
      <Typography variant="h6" style={{ textAlign: 'center' }}>Données des ménages</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box style={{ height: 600 }}>
            <Plot
              data={[
                {
                  x: chartCategories,
                  y: chartLogements,
                  type: 'bar',
                  name: 'Nombre de Logements',
                  marker: { color: 'orange' },
                  hovertemplate: '%{x}<br>Nombre de Logements: %{y:,}<extra></extra>'
                },
                {
                  x: chartCategories,
                  y: chartPopulation,
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
                  <TableCell style={{ color: 'white' }}>Catégorie Socioprofessionnelle</TableCell>
                  <TableCell style={{ color: 'white' }}>Nombre de Logements</TableCell>
                  <TableCell style={{ color: 'white' }}>Population</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row, index) => (
                  <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{formatNumber(row.NombreDeLogements)}</TableCell>
                    <TableCell>{formatNumber(row.Population)}</TableCell>
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

export default Menage;
