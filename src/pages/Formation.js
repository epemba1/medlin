import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Typography, CircularProgress } from '@mui/material';

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
  return responses.reduce((acc, curr) => {
    if (curr) {
      if (!acc.Variable && curr.Variable) {
        acc.Variable = curr.Variable;
      }
      if (curr.Cellule && Array.isArray(curr.Cellule)) {
        curr.Cellule.forEach(cell => {
          const found = acc.Cellule.find(c =>
            c.Modalite.some(m => m['@code'] === cell.Modalite.find(cm => cm['@variable'] === 'DIPL_19')['@code']) &&
            c.Modalite.some(m => m['@code'] === cell.Modalite.find(cm => cm['@variable'] === 'SEXE')['@code'])
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

const Formation = forwardRef(({ communeCodes }, ref) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();
  const chartsRef = useRef([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const formationUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-SEXE-DIPL_19@GEO2023RP2020/COM-{communeCode}.all.all';
        const mergedData = await fetchData(communeCodes, formationUrl);
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
    getFormationData: () => {
      if (!data) return [];
      return data.Cellule.map(cell => ({
        diplomeCode: cell.Modalite.find(m => m['@variable'] === 'DIPL_19')['@code'],
        sexeCode: cell.Modalite.find(m => m['@variable'] === 'SEXE')['@code'],
        valeur: Math.round(parseFloat(cell.Valeur))
      }));
    },
    getTableElement: () => tableRef.current,
    getChartElements: () => chartsRef.current
  }));

  if (loading) {
    return <CircularProgress />;
  }

  const getCategories = (variables) => {
    const diplomeVariable = variables.find(variable => variable["@code"] === "DIPL_19");
    return diplomeVariable.Modalite.map(mod => ({
      code: mod["@code"],
      libelle: mod.Libelle
    }));
  };

  const transformData = (cellules, categories) => {
    const data = categories.map(category => ({
      category: category.libelle,
      ensemble: 0,
      hommes: 0,
      femmes: 0
    }));

    cellules.forEach(cellule => {
      const sexe = cellule.Modalite.find(mod => mod["@variable"] === "SEXE")["@code"];
      const diplome = cellule.Modalite.find(mod => mod["@variable"] === "DIPL_19")["@code"];
      const valeur = Math.round(parseFloat(cellule.Valeur));

      const categoryIndex = categories.findIndex(cat => cat.code === diplome);

      if (sexe === "ENS") data[categoryIndex].ensemble = valeur;
      else if (sexe === "1") data[categoryIndex].hommes = valeur;
      else if (sexe === "2") data[categoryIndex].femmes = valeur;
    });

    return data;
  };

  const categories = getCategories(data.Variable);
  const transformedData = transformData(data.Cellule, categories);

  if (transformedData.length === 0) {
    return (
      <Box style={{ textAlign: 'center', marginTop: '20px' }}>
        <img src='/no-results.png' alt="No results" style={{ width: '200px', height: '200px', marginTop: '20px', marginBottom: '10px' }} />
        <Typography variant='h5'>Ups... résultats non trouvés</Typography>
        <Typography variant='h6'>Veuillez sélectionner une autre commune</Typography>
      </Box>
    );
  }

  const chartData = transformedData.filter(row => row.category !== 'Ensemble');

  return (
    <Box>
      <Typography variant="h6" mt={6} mb={6} style={{ textAlign: 'center' }}>Formation selon le niveau de diplôme</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box style={{ height: 600 }}>
            <Plot
              data={[
                {
                  x: chartData.map(row => row.category),
                  y: chartData.map(row => row.ensemble),
                  type: 'bar',
                  name: 'Ensemble',
                  marker: { color: 'blue' },
                  hovertemplate: '%{x}<br>Ensemble: %{y:,}<extra></extra>'
                },
                {
                  x: chartData.map(row => row.category),
                  y: chartData.map(row => row.hommes),
                  type: 'bar',
                  name: 'Hommes',
                  marker: { color: 'green' },
                  hovertemplate: '%{x}<br>Hommes: %{y:,}<extra></extra>'
                },
                {
                  x: chartData.map(row => row.category),
                  y: chartData.map(row => row.femmes),
                  type: 'bar',
                  name: 'Femmes',
                  marker: { color: 'red' },
                  hovertemplate: '%{x}<br>Femmes: %{y:,}<extra></extra>'
                },
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
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Niveau de diplôme</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Ensemble</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Hommes</TableCell>
                  <TableCell style={{ color: 'white', textAlign: 'center' }}>Femmes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transformedData.map((row, index) => (
                  <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
                    <TableCell style={{ textAlign: 'center' }}>{row.category}</TableCell>
                    <TableCell style={{ textAlign: 'center' }}>{formatNumber(row.ensemble)}</TableCell>
                    <TableCell style={{ textAlign: 'center' }}>{formatNumber(row.hommes)}</TableCell>
                    <TableCell style={{ textAlign: 'center' }}>{formatNumber(row.femmes)}</TableCell>
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

export default Formation;
