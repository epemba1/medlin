import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid } from '@mui/material';

const PopulationTab = () => {
  const [data, setData] = useState(null);
  const [ageGroupLabels, setAgeGroupLabels] = useState({});
  const [sexeLabels, setSexeLabels] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://api.insee.fr/donnees-locales/V0.1/donnees/geo-SEXE-AGE15_15_90@GEO2023RP2020/COM-69006.all.all', {
          headers: {
            Authorization: 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
          }
        });
        setData(response.data);

        // Extracting age group labels dynamically from the API response
        const ageGroups = response.data.Variable.find(v => v['@code'] === 'AGE15_15_90').Modalite;
        const ageGroupLabels = {};
        ageGroups.forEach(group => {
          ageGroupLabels[group['@code']] = group.Libelle;
        });
        setAgeGroupLabels(ageGroupLabels);

        // Extracting sexe labels dynamically from the API response
        const sexes = response.data.Variable.find(v => v['@code'] === 'SEXE').Modalite;
        const sexeLabels = {};
        sexes.forEach(sexe => {
          sexeLabels[sexe['@code']] = sexe.Libelle;
        });
        setSexeLabels(sexeLabels);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  if (!data) {
    return <Typography>Loading...</Typography>;
  }

  // Extracting population data dynamically from the API response
  const populationData = data.Cellule.map(cell => ({
    sexe: cell.Modalite.find(mod => mod['@variable'] === 'SEXE')['@code'],
    ageGroup: cell.Modalite.find(mod => mod['@variable'] === 'AGE15_15_90')['@code'],
    valeur: parseFloat(cell.Valeur)
  }));

  // Dynamically get all age groups and sexes
  const ageGroups = [...new Set(populationData.map(d => d.ageGroup))]
    .sort((a, b) => a.localeCompare(b)); // Sort age groups for consistent order

  const sexes = [...new Set(populationData.map(d => d.sexe))]
    .sort((a, b) => a.localeCompare(b)); // Sort sexes for consistent order

  // Helper function to get population value by sexe and age group
  const getPopulationValue = (sexe, ageGroup) => {
    const found = populationData.find(d => d.sexe === sexe && d.ageGroup === ageGroup);
    return found ? found.valeur : 0;
  };

  // Data for charts
  const totalPopulation = getPopulationValue('ENS', 'ENS');
  const malePopulation = getPopulationValue('1', 'ENS');
  const femalePopulation = getPopulationValue('2', 'ENS');

  const totalAgeDistribution = ageGroups.map(code => getPopulationValue('ENS', code));
  const maleAgeDistribution = ageGroups.map(code => getPopulationValue('1', code));
  const femaleAgeDistribution = ageGroups.map(code => getPopulationValue('2', code));

  return (
    <Box>
      <Typography variant="h5">Données Statistiques Population</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
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
            layout={{ title: 'Répartition Hommes/Femmes' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sexe</TableCell>
                  <TableCell>Population</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{sexeLabels['1']}</TableCell>
                  <TableCell>{malePopulation}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{sexeLabels['2']}</TableCell>
                  <TableCell>{femalePopulation}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Grid container spacing={2} mt={4}>
        <Grid item xs={12} md={6}>
          <Plot
            data={[
              {
                type: 'bar',
                x: ageGroups.map(code => ageGroupLabels[code]),
                y: totalAgeDistribution,
              }
            ]}
            layout={{ title: 'Âge de la Population' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tranche d'âge</TableCell>
                  <TableCell>Population</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ageGroups.map(code => (
                  <TableRow key={code}>
                    <TableCell>{ageGroupLabels[code]}</TableCell>
                    <TableCell>{getPopulationValue('ENS', code)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Grid container spacing={2} mt={4}>
        <Grid item xs={12} md={6}>
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
                marker: { color: 'red' }
              }
            ]}
            layout={{ title: 'Âge de la Population par Sexe', barmode: 'group' }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tranche d'âge</TableCell>
                  <TableCell>{sexeLabels['1']}</TableCell>
                  <TableCell>{sexeLabels['2']}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ageGroups.map(code => (
                  <TableRow key={code}>
                    <TableCell>{ageGroupLabels[code]}</TableCell>
                    <TableCell>{getPopulationValue('1', code)}</TableCell>
                    <TableCell>{getPopulationValue('2', code)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PopulationTab;
