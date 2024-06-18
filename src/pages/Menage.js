import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Typography, CircularProgress } from '@mui/material';

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
        //alert('Fetched data: ' + JSON.stringify(mergedData)); // Debugging fetched data
        setData(mergedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        //alert('Error fetching data: ' + error); // Debugging error
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
    //alert('Transformed data for table: ' + JSON.stringify(categoryData)); // Debugging transformed data

    return Object.entries(categoryData).map(([csCode, values]) => ({
      category: categoryLabels[csCode],
      Population: values.Population,
      NombreDeLogements: values.NombreDeLogements
    }));
  };

  const tableData = transformDataForTable(data);
  const chartData = tableData.filter(row => row.category !== 'Ensemble');

  console.log('Chart data:', chartData); // Debugging chart data
  //alert('Chart data: ' + JSON.stringify(chartData)); // Debugging chart data

  if (chartData.length === 0 && tableData.length === 0) {
    return (
      <Box style={{ textAlign: 'center', marginTop: '20px' }}>
      <img src='/no-results.png' alt="No results" style={{ width: '200px', height: '200px',marginTop: '20px', marginBottom:'10px' }} />
      <Typography variant='h5'>Ups... résultats non trouvés</Typography>
      <Typography variant='h6'>Veuillez sélectionner une autre commune</Typography>
    </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" mt={6} mb={6}  style={{ textAlign: 'center' }}>Ménages selon la catégorie socioprofessionnelle de la personne de référence </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box style={{ height: 600 }}>
            <Plot
              data={[
                {
                  x: chartData.map(row => row.category),
                  y: chartData.map(row => row.Population),
                  type: 'bar',
                  name: 'Population',
                  marker: { color: 'blue' },
                  hovertemplate: '%{x}<br>Population: %{y:,}<extra></extra>'
                },
                {
                  x: chartData.map(row => row.category),
                  y: chartData.map(row => row.NombreDeLogements),
                  type: 'bar',
                  name: 'Nombre de Logements',
                  marker: { color: 'orange' },
                  hovertemplate: '%{x}<br>Nombre de Logements: %{y:,}<extra></extra>'
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
                  <TableCell style={{ color: 'white',  }}>Catégorie Socioprofessionnelle</TableCell>
                  <TableCell style={{ color: 'white' }}>Population des ménages</TableCell>
                  <TableCell style={{ color: 'white' }}>Nombre de Logements</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row, index) => (
                  <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
                    <TableCell style={{ textAlign: 'center' }}>{row.category}</TableCell>
                    <TableCell style={{ textAlign: 'center' }}>{formatNumber(row.Population)}</TableCell>
                    <TableCell style={{ textAlign: 'center' }}>{formatNumber(row.NombreDeLogements)}</TableCell>
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
