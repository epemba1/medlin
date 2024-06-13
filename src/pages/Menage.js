import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Skeleton } from '@mui/material';

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const retryRequest = async (fn, retriesLeft = 5, interval = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retriesLeft === 1 || error.response.status !== 429) throw error;
    await new Promise(res => setTimeout(res, interval));
    return retryRequest(fn, retriesLeft - 1, interval * 2);
  }
};

const Menage = forwardRef(({ communeCodes }, ref) => {
  const [data, setData] = useState(null);
  const tableRef = useRef();
  const chartsRef = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allData = await Promise.all(communeCodes.map(async (communeCode) => {
          const response = await retryRequest(() =>
            axios.get(`https://api.insee.fr/donnees-locales/V0.1/donnees/geo-NBENFFR-TF4@GEO2023RP2020/COM-${communeCode}.all.all`, {
              headers: {
                Authorization: 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
              }
            })
          );
          return response.data;
        }));

        // Merge and aggregate data
        const mergedData = allData.reduce((acc, curr) => {
          if (!acc.Variable) {
            acc.Variable = curr.Variable;
          }
          curr.Cellule.forEach(cell => {
            const found = acc.Cellule.find(c => 
              c.Modalite.every((mod, index) => mod['@code'] === cell.Modalite[index]['@code'])
            );
            if (found) {
              found.Valeur = (parseFloat(found.Valeur) + parseFloat(cell.Valeur)).toString();
            } else {
              acc.Cellule.push({...cell});
            }
          });
          return acc;
        }, { Cellule: [] });

        setData(mergedData);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (communeCodes.length > 0) {
      fetchData();
    }
  }, [communeCodes]);

  useImperativeHandle(ref, () => ({
    getMenageData: () => {
      if (!data) return [];
      return data.Cellule.map(cell => ({
        type: cell.Modalite.find(mod => mod['@variable'] === 'TF4')['@code'],
        children: cell.Modalite.find(mod => mod['@variable'] === 'NBENFFR')['@code'],
        valeur: Math.round(parseFloat(cell.Valeur))
      }));
    },
    getTableElement: () => tableRef.current,
    getChartElements: () => chartsRef.current
  }));

  if (!data) {
    return (
      <Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box style={{ height: 400 }}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" width="100%" height={40} />
            <Skeleton variant="rectangular" width="100%" height={40} />
          </Grid>
        </Grid>
        <Grid container spacing={2} mt={4}>
          <Grid item xs={12} md={6}>
            <Box style={{ height: 400 }}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" width="100%" height={40} />
            <Skeleton variant="rectangular" width="100%" height={40} />
            <Skeleton variant="rectangular" width="100%" height={40} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const menageData = data.Cellule.map(cell => ({
    type: cell.Modalite.find(mod => mod['@variable'] === 'TF4')['@code'],
    children: cell.Modalite.find(mod => mod['@variable'] === 'NBENFFR')['@code'],
    valeur: Math.round(parseFloat(cell.Valeur))
  }));

  const familleLabels = {
    '1': 'Couple sans enfant',
    '2': 'Couple avec enfant(s)',
    '3': 'Famille monoparentale (homme)',
    '4': 'Famille monoparentale (femme)',
  };

  const enfantsLabels = {
    '0': '0 enfant',
    '1': '1 enfant',
    '2': '2 enfants',
    '3': '3 enfants',
    '4': '4 enfants ou plus',
  };

  const structureMenagesFamille = Object.keys(familleLabels).map(code => ({
    label: familleLabels[code],
    value: menageData.filter(d => d.type === code).reduce((acc, curr) => acc + curr.valeur, 0),
  }));

  const famillesEnfants = Object.keys(enfantsLabels).map(code => ({
    label: enfantsLabels[code],
    value: menageData.filter(d => d.children === code).reduce((acc, curr) => acc + curr.valeur, 0),
  }));

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
        <Box style={{ height: 500 }}>
        <Plot
          data={[
            {
              labels: structureMenagesFamille.map(item => item.label),
              values: structureMenagesFamille.map(item => item.value),
              type: 'pie', 
            }
          ]}
          layout={{ title: 'Structure des ménages avec famille', autosize: true,
            legend: {
              orientation: 'h', // Make the legend horizontal
              y: -0.3 // Position the legend below the chart
            }
           }}
          style={{ width: '100%', height: '100%' }}
          ref={el => chartsRef.current[0] = el}
        />
      </Box>
        </Grid>
        <Grid item xs={12} md={6} mt={12}>
          <TableContainer component={Paper}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey'}}>
                <TableRow>
                  <TableCell style={{ color: 'white'}}>Type de ménage</TableCell>
                  <TableCell style={{ color: 'white'}}>Nombre de familles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {structureMenagesFamille.map((item, index) => (
                  <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>{formatNumber(item.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
      <Grid container spacing={2} mt={4}>
        <Grid item xs={12} md={6}>
          <Box style={{ height: 400 }}>
            <Plot
              data={[
                {
                  x: famillesEnfants.map(item => item.label),
                  y: famillesEnfants.map(item => item.value),
                  type: 'bar',
                }
              ]}
              layout={{ title: 'Nombre de familles avec enfants de moins de 25 ans', autosize: true }}
              style={{ width: '100%', height: '100%' }}
              ref={el => chartsRef.current[1] = el}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6} mt={11}>
          <TableContainer component={Paper}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey'}}>
                <TableRow>
                  <TableCell style={{ color: 'white'}}>Nombre d'enfants de moins de 25 ans</TableCell>
                  <TableCell style={{ color: 'white'}}>Nombre de familles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {famillesEnfants.map((item, index) => (
                  <TableRow key={index} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>{formatNumber(item.value)}</TableCell>
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
