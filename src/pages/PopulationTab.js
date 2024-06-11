import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Skeleton } from '@mui/material';

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const PopulationTab = forwardRef(({ communeCodes }, ref) => {
  const [data, setData] = useState([]);
  const [ageGroupLabels, setAgeGroupLabels] = useState({});
  const [sexeLabels, setSexeLabels] = useState({});
  const tableRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allData = await Promise.all(communeCodes.map(async (communeCode) => {
          const response = await axios.get(`https://api.insee.fr/donnees-locales/V0.1/donnees/geo-SEXE-AGE15_15_90@GEO2023RP2020/COM-${communeCode}.all.all`, {
            headers: {
              Authorization: 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
            }
          });
          return response.data;
        }));
        setData(allData.flat());

        if (allData.length > 0) {
          const ageGroups = allData[0].Variable.find(v => v['@code'] === 'AGE15_15_90').Modalite;
          const ageGroupLabels = {};
          ageGroups.forEach(group => {
            ageGroupLabels[group['@code']] = group.Libelle;
          });
          setAgeGroupLabels(ageGroupLabels);

          const sexeLabels = {};
          allData[0].Variable.find(v => v['@code'] === 'SEXE').Modalite.forEach(sexe => {
            sexeLabels[sexe['@code']] = sexe.Libelle;
          });
          setSexeLabels(sexeLabels);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (communeCodes.length > 0) {
      fetchData();
    }
  }, [communeCodes]);

  useImperativeHandle(ref, () => ({
    getPopulationData: () => {
      if (data.length === 0) return [];
      return data.flatMap(d => d.Cellule.map(cell => ({
        sexe: cell.Modalite.find(mod => mod['@variable'] === 'SEXE')['@code'],
        ageGroup: cell.Modalite.find(mod => mod['@variable'] === 'AGE15_15_90')['@code'],
        valeur: Math.round(parseFloat(cell.Valeur))
      })));
    },
    getTableElement: () => tableRef.current
  }));

  if (data.length === 0) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom >Données Statistiques Population</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box style={{ height: 400 }}>
              <Skeleton variant="rectangular" width="100%" height="100%" />
            </Box>
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
            <Skeleton variant="rectangular" width="100%" height={40} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  const populationData = data.flatMap(d => d.Cellule.map(cell => ({
    sexe: cell.Modalite.find(mod => mod['@variable'] === 'SEXE')['@code'],
    ageGroup: cell.Modalite.find(mod => mod['@variable'] === 'AGE15_15_90')['@code'],
    valeur: Math.round(parseFloat(cell.Valeur))
  })));

  const ageGroups = [...new Set(populationData.map(d => d.ageGroup))]
    .sort((a, b) => a.localeCompare(b));

  const getPopulationValue = (sexe, ageGroup) => {
    return populationData
      .filter(d => d.sexe === sexe && d.ageGroup === ageGroup)
      .reduce((sum, d) => sum + d.valeur, 0);
  };

  const malePopulation = getPopulationValue('1', 'ENS');
  const femalePopulation = getPopulationValue('2', 'ENS');

  const totalAgeDistribution = ageGroups.map(code => getPopulationValue('ENS', code));
  const maleAgeDistribution = ageGroups.map(code => getPopulationValue('1', code));
  const femaleAgeDistribution = ageGroups.map(code => getPopulationValue('2', code));

  return (
    <Box>
      <Typography variant="h5" gutterBottom style={{marginBottom: '70px'}}>Données Statistiques Population</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box style={{ height: 400 }}>
            <Plot
              data={[
                {
                  type: 'pie',
                  values: [malePopulation, femalePopulation],
                  labels: [sexeLabels['1'], sexeLabels['2']],
                  textinfo: 'label+percent',
                  insidetextorientation: 'radial'
                }
              ]}
              layout={{ title: 'Répartition Hommes/Femmes', autosize: true }}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey'}}>
                <TableRow>
                  <TableCell style={{ color: 'white'}}>Sexe</TableCell>
                  <TableCell style={{ color: 'white'}}>Population</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {['1', '2'].map((sexe, index) => (
                  <TableRow key={sexe} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
                    <TableCell>{sexeLabels[sexe]}</TableCell>
                    <TableCell>{formatNumber(getPopulationValue(sexe, 'ENS'))}</TableCell>
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
                  type: 'bar',
                  x: ageGroups.map(code => ageGroupLabels[code]),
                  y: totalAgeDistribution,
                }
              ]}
              layout={{ title: 'Âge de la Population', autosize: true }}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead style={{ backgroundColor: 'grey'}}>
                <TableRow>
                  <TableCell style={{ color: 'white'}}>Tranche d'âge</TableCell>
                  <TableCell style={{ color: 'white'}}>Population</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ageGroups.map(code => (
                  <TableRow key={code} style={{backgroundColor: code % 2 === 0 ? '#f5f5f5' : 'white'}}>
                    <TableCell>{ageGroupLabels[code]}</TableCell>
                    <TableCell>{formatNumber(getPopulationValue('ENS', code))}</TableCell>
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
                  type: 'bar',
                  x: ageGroups.map(code => ageGroupLabels[code]),
                  y: maleAgeDistribution,
                  name: 'Hommes'
                },
                {
                  type: 'bar',
                  x: ageGroups.map(code => ageGroupLabels[code]),
                  y: femaleAgeDistribution,
                  name: 'Femmes'
                }
              ]}
              layout={{ title: 'Répartition par âge et sexe', autosize: true, barmode: 'group' }}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead style={{ backgroundColor: 'grey'}}>
                <TableRow>
                  <TableCell style={{ color: 'white'}}>Tranche d'âge</TableCell>
                  <TableCell style={{ color: 'white'}}>Hommes</TableCell>
                  <TableCell style={{ color: 'white'}}>Femmes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ageGroups.map(code => (
                  <TableRow key={code} style={{backgroundColor: code % 2 === 0 ? '#f5f5f5' : 'white'}}>
                    <TableCell>{ageGroupLabels[code]}</TableCell>
                    <TableCell>{formatNumber(getPopulationValue('1', code))}</TableCell>
                    <TableCell>{formatNumber(getPopulationValue('2', code))}</TableCell>
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

export default PopulationTab;
