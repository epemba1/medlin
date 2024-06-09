import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Typography, Box } from '@mui/material';

const PopulationTab = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://api.insee.fr/donnees-locales/V0.1/donnees/geo-SEXE-AGE15_15_90@GEO2023RP2020/COM-69006.all.all', {
          headers: {
            Authorization: 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
          }
        });
        setData(response.data);
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

  // Labels for age groups and sexes
  const ageGroupLabels = {
    "00": "0 à 14 ans",
    "15": "15 à 29 ans",
    "30": "30 à 44 ans",
    "45": "45 à 59 ans",
    "60": "60 à 74 ans",
    "75": "75 à 89 ans",
    "90": "90 ans ou plus",
    "ENS": "Ensemble"
  };

  const sexeLabels = {
    "1": "Hommes",
    "2": "Femmes",
    "ENS": "Ensemble"
  };

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

      <Plot
        data={[
          {
            type: 'pie',
            values: [malePopulation, femalePopulation],
            labels: ['Hommes', 'Femmes'],
            textinfo: 'label+percent',
            insidetextorientation: 'radial'
          }
        ]}
        layout={{ title: 'Répartition Hommes/Femmes' }}
      />

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

      <Plot
        data={[
          {
            type: 'bar',
            x: ageGroups.map(code => ageGroupLabels[code]),
            y: maleAgeDistribution,
            name: 'Hommes',
            marker: { color: 'blue' }
          },
          {
            type: 'bar',
            x: ageGroups.map(code => ageGroupLabels[code]),
            y: femaleAgeDistribution,
            name: 'Femmes',
            marker: { color: 'red' }
          }
        ]}
        layout={{ title: 'Âge de la Population par Sexe', barmode: 'group' }}
      />
    </Box>
  );
};

export default PopulationTab;
