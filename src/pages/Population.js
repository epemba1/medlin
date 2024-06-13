import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Skeleton } from '@mui/material';

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const Population = forwardRef(({ communeCodes }, ref) => {
  const [data, setData] = useState(null);
  const [ageGroupLabels, setAgeGroupLabels] = useState({});
  const [sexeLabels, setSexeLabels] = useState({});
  const tableRef = useRef();
  const chartsRef = useRef([]);

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

        const ageGroups = mergedData.Variable.find(v => v['@code'] === 'AGE15_15_90').Modalite;
        const ageGroupLabels = {};
        ageGroups.forEach(group => {
          ageGroupLabels[group['@code']] = group.Libelle;
        });
        setAgeGroupLabels(ageGroupLabels);

        const sexes = mergedData.Variable.find(v => v['@code'] === 'SEXE').Modalite;
        const sexeLabels = {};
        sexes.forEach(sexe => {
          sexeLabels[sexe['@code']] = sexe.Libelle;
        });
        setSexeLabels(sexeLabels);

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
      if (!data) return [];
      return data.Cellule.map(cell => ({
        sexe: cell.Modalite.find(mod => mod['@variable'] === 'SEXE')['@code'],
        ageGroup: cell.Modalite.find(mod => mod['@variable'] === 'AGE15_15_90')['@code'],
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

  const populationData = data.Cellule.map(cell => ({
    sexe: cell.Modalite.find(mod => mod['@variable'] === 'SEXE')['@code'],
    ageGroup: cell.Modalite.find(mod => mod['@variable'] === 'AGE15_15_90')['@code'],
    valeur: Math.round(parseFloat(cell.Valeur))
  }));

  const ageGroups = [...new Set(populationData.map(d => d.ageGroup))]
    .sort((a, b) => a.localeCompare(b));

  const sexes = [...new Set(populationData.map(d => d.sexe))]
    .sort((a, b) => a.localeCompare(b));

  const getPopulationValue = (sexe, ageGroup) => {
    return populationData
      .filter(d => d.sexe === sexe && d.ageGroup === ageGroup)
      .reduce((acc, curr) => acc + curr.valeur, 0);
  };

  const malePopulation = sexes.includes('1') ? getPopulationValue('1', 'ENS') : 0;
  const femalePopulation = sexes.includes('2') ? getPopulationValue('2', 'ENS') : 0;

  const totalAgeDistribution = ageGroups.map(code => 
    sexes.reduce((acc, sexe) => acc + getPopulationValue(sexe, code), 0)
  );
  const maleAgeDistribution = ageGroups.map(code => getPopulationValue('1', code));
  const femaleAgeDistribution = ageGroups.map(code => getPopulationValue('2', code));

  return (
    <Box>
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
              ref={el => chartsRef.current[0] = el}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6} mt={12}>
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
              ref={el => chartsRef.current[1] = el}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table ref={tableRef}>
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
                    <TableCell>{formatNumber(totalAgeDistribution[ageGroups.indexOf(code)])}</TableCell>
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
                  name: sexeLabels['1'],
                  marker: { color: 'blue' }
                },
                {
                  type: 'bar',
                  x: ageGroups.map(code => ageGroupLabels[code]),
                  y: femaleAgeDistribution,
                  name: sexeLabels['2'],
                  marker: { color: '' }
                }
              ]}
              layout={{ title: 'Distribution par Âge et Sexe', autosize: true, barmode: 'stack' }}
              style={{ width: '100%', height: '100%' }}
              ref={el => chartsRef.current[2] = el}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper} >
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white'}}>Tranche d'âge</TableCell>
                  <TableCell style={{ color: 'white'}}>{sexeLabels['1']}</TableCell>
                  <TableCell style={{ color: 'white'}}>{sexeLabels['2']}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ageGroups.map(code => (
                  <TableRow key={code} style={{backgroundColor: code % 2 === 0 ? '#f5f5f5' : 'white'}}>
                    <TableCell>{ageGroupLabels[code]}</TableCell>
                    <TableCell>{formatNumber(maleAgeDistribution[ageGroups.indexOf(code)])}</TableCell>
                    <TableCell>{formatNumber(femaleAgeDistribution[ageGroups.indexOf(code)])}</TableCell>
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

export default Population;
