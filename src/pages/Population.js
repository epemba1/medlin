import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Grid, Typography } from '@mui/material';

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const fetchData = async (communeCodes, urlTemplate) => {
  const responses = [];
  for (let i = 0; i < communeCodes.length; i++) {
    try {
      const response = await axios.get(urlTemplate.replace('{communeCode}', communeCodes[i]), {
        headers: {
          Authorization: 'Bearer c1962a62-85fd-3e69-94a8-9a23ea7306a6'
        }
      });
      responses.push(response.data);
      // Ajouter un délai de 100ms entre chaque requête
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching data for commune ${communeCodes[i]}:`, error);
    }
  }

  return responses.reduce((acc, curr) => {
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
        acc.Cellule.push({ ...cell });
      }
    });
    return acc;
  }, { Cellule: [] });
};
const getLabels = (variables, code) => {
  const variable = variables.find(v => v['@code'] === code);
  const labels = {};
  variable.Modalite.forEach(mod => {
    labels[mod['@code']] = mod.Libelle;
  });
  return labels;
};

const Population = forwardRef(({ communeCodes }, ref) => {
  const [ageSexData, setAgeSexData] = useState(null);
  const [csSexData, setCsSexData] = useState(null);
  const [ageGroupLabels, setAgeGroupLabels] = useState({});
  const [sexeLabels, setSexeLabels] = useState({});
  const tableRef = useRef();
  const chartsRef = useRef([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const ageSexUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-SEXE-AGE15_15_90@GEO2023RP2020/COM-{communeCode}.all.all';
        const csSexUrl = 'https://api.insee.fr/donnees-locales/V0.1/donnees/geo-CS1_8-SEXE@GEO2023RP2020/COM-{communeCode}.all.all';

        const [mergedAgeSexData, mergedCsSexData] = await Promise.all([
          fetchData(communeCodes, ageSexUrl),
          fetchData(communeCodes, csSexUrl)
        ]);

        setAgeSexData(mergedAgeSexData);
        setCsSexData(mergedCsSexData);
        setAgeGroupLabels(getLabels(mergedAgeSexData.Variable, 'AGE15_15_90'));
        setSexeLabels(getLabels(mergedAgeSexData.Variable, 'SEXE'));

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (communeCodes.length > 0) {
      fetchAllData();
    }
  }, [communeCodes]);

  useImperativeHandle(ref, () => ({
    getPopulationData: () => {
      if (!ageSexData) return [];
      return ageSexData.Cellule.map(cell => ({
        sexe: cell.Modalite.find(mod => mod['@variable'] === 'SEXE')['@code'],
        ageGroup: cell.Modalite.find(mod => mod['@variable'] === 'AGE15_15_90')['@code'],
        valeur: Math.round(parseFloat(cell.Valeur))
      }));
    },
    getTableElement: () => tableRef.current,
    getChartElements: () => chartsRef.current
  }));

  if (!ageSexData || !csSexData) {
    return <h1>Loading...</h1>;
  }

  const transformDataForChart = (data) => {
    const csVariable = data.Variable.find(v => v["@code"] === "CS1_8");
    const categories = csVariable?.Modalite.map(m => m.Libelle) || [];
    const maleData = csVariable?.Modalite.map(modalite => {
      const cell = data.Cellule.find(c => 
        c.Modalite.some(mod => mod["@code"] === modalite["@code"] && c.Modalite.some(mod2 => mod2["@code"] === "1"))
      );
      return cell ? Math.round(parseFloat(cell.Valeur)) : 0;
    }) || [];
    const femaleData = csVariable?.Modalite.map(modalite => {
      const cell = data.Cellule.find(c => 
        c.Modalite.some(mod => mod["@code"] === modalite["@code"] && c.Modalite.some(mod2 => mod2["@code"] === "2"))
      );
      return cell ? Math.round(parseFloat(cell.Valeur)) : 0;
    }) || [];
    const totalData = categories.map((category, index) => maleData[index] + femaleData[index]);

    const filteredCategories = categories.filter(cat => cat !== 'Ensemble');
    const filteredMaleData = maleData.filter((_, index) => categories[index] !== 'Ensemble');
    const filteredFemaleData = femaleData.filter((_, index) => categories[index] !== 'Ensemble');
    const filteredTotalData = totalData.filter((_, index) => categories[index] !== 'Ensemble');

    return {
      categories: filteredCategories,
      maleData: filteredMaleData,
      femaleData: filteredFemaleData,
      totalData: filteredTotalData
    };
  };

  const transformDataForTable = (data) => {
    if (!data || !data.Cellule || !data.Variable) return [];

    const csVariable = data.Variable.find(v => v["@code"] === "CS1_8");
    const sexVariable = data.Variable.find(v => v["@code"] === "SEXE");

    const categoryLabels = {};
    csVariable.Modalite.forEach(mod => {
      categoryLabels[mod["@code"]] = mod.Libelle;
    });

    const sexLabels = {};
    sexVariable.Modalite.forEach(mod => {
      sexLabels[mod["@code"]] = mod.Libelle;
    });

    const categoryData = {};

    data.Cellule.forEach(cell => {
      const csCode = cell.Modalite.find(m => m["@variable"] === "CS1_8")["@code"];
      const sexCode = cell.Modalite.find(m => m["@variable"] === "SEXE")["@code"];
      const population = Math.round(parseFloat(cell.Valeur));

      if (!categoryData[csCode]) {
        categoryData[csCode] = { Homme: 0, Femme: 0, Ensemble: 0 };
      }

      if (sexCode === "1") {
        categoryData[csCode].Homme += population;
      } else if (sexCode === "2") {
        categoryData[csCode].Femme += population;
      } else if (sexCode === "ENS") {
        categoryData[csCode].Ensemble += population;
      }
    });

    return Object.entries(categoryData)
      .map(([csCode, values]) => ({
        category: categoryLabels[csCode],
        Homme: values.Homme,
        Femme: values.Femme,
        Ensemble: values.Ensemble
      }));
  };

  const chartData = transformDataForChart(csSexData);
  const tableData = transformDataForTable(csSexData);

  const populationData = ageSexData.Cellule.map(cell => ({
    sexe: cell.Modalite.find(mod => mod['@variable'] === 'SEXE')['@code'],
    ageGroup: cell.Modalite.find(mod => mod['@variable'] === 'AGE15_15_90')['@code'],
    valeur: Math.round(parseFloat(cell.Valeur))
  }));

  const ageGroups = [...new Set(populationData.map(d => d.ageGroup))];
  const sexes = [...new Set(populationData.map(d => d.sexe))];

  const getPopulationValue = (sexe, ageGroup) => {
    return populationData
      .filter(d => d.sexe === sexe && d.ageGroup === ageGroup)
      .reduce((acc, curr) => acc + curr.valeur, 0);
  };

  const malePopulation = sexes.includes('1') ? getPopulationValue('1', 'ENS') : 0;
  const femalePopulation = sexes.includes('2') ? getPopulationValue('2', 'ENS') : 0;

  const maleAgeDistribution = ageGroups.map(code => getPopulationValue('1', code));
  const femaleAgeDistribution = ageGroups.map(code => getPopulationValue('2', code));
  const totalAgeDistribution = ageGroups.map(code => getPopulationValue('ENS', code));

  return (
    <Box>
      <Typography variant="h6" style={{ textAlign: 'center' }}>Répartition de la population selon l'âge</Typography>
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
                  insidetextorientation: 'radial',
                  hoverinfo: 'label+value+percent',
                  hovertemplate: '<b>%{label}</b><br>Population: %{value}<br>Pourcentage: %{percent:.1%}'
                }
              ]}
              layout={{
                legend: {
                  orientation: 'h',
                  y: -0.3,
                  x: 0.2
                }
              }}
              style={{ width: '100%', height: '100%' }}
              ref={el => chartsRef.current[0] = el}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper} style={{ marginTop: '100px' }}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white' }}>Sexe</TableCell>
                  <TableCell style={{ color: 'white' }}>Population</TableCell>
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
      <Typography variant="h6" style={{ textAlign: 'center' }}>Population selon le sexe et la tranche d'âge</Typography>
      <Grid container spacing={2} mt={4}>
        <Grid item xs={12} md={6}>
          <Box style={{ height: 500 }}>
            <Plot
              data={[
                {
                  type: 'bar',
                  x: ageGroups.filter(code => code !== 'ENS').map(code => ageGroupLabels[code]),
                  y: maleAgeDistribution.filter((_, index) => ageGroups[index] !== 'ENS'),
                  name: sexeLabels['1'],
                  marker: { color: 'blue' },
                  hoverinfo: 'x+y',
                  hovertemplate: '<b>%{x}</b><br>Hommes: %{y}'
                },
                {
                  type: 'bar',
                  x: ageGroups.filter(code => code !== 'ENS').map(code => ageGroupLabels[code]),
                  y: femaleAgeDistribution.filter((_, index) => ageGroups[index] !== 'ENS'),
                  name: sexeLabels['2'],
                  marker: { color: 'orange' },
                  hoverinfo: 'x+y',
                  hovertemplate: '<b>%{x}</b><br>Femmes: %{y}'
                },
                {
                  type: 'bar',
                  x: ageGroups.filter(code => code !== 'ENS').map(code => ageGroupLabels[code]),
                  y: totalAgeDistribution.filter((_, index) => ageGroups[index] !== 'ENS'),
                  name: 'Total',
                  marker: { color: 'green' },
                  hoverinfo: 'x+y',
                  hovertemplate: '<b>%{x}</b><br>Total: %{y}'
                }
              ]}
              layout={{
                title: '',
                yaxis: {
                  title: 'Nombre de personnes',
                  titlefont: {
                    size: 13,
                    
                  },
                },
                autosize: true,
                barmode: 'group',
                margin: { l: 70, r: 50, b: 50, t: 50, pad: 10 },
                legend: {
                  orientation: 'h',
                  y: -0.3,
                  x: 0.2
                }
              }}
              style={{ width: '100%', height: '100%' }}
              ref={el => chartsRef.current[1] = el}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white' }}>Tranche d'âge</TableCell>
                  <TableCell style={{ color: 'white' }}>{sexeLabels['1']}</TableCell>
                  <TableCell style={{ color: 'white' }}>{sexeLabels['2']}</TableCell>
                  <TableCell style={{ color: 'white' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ageGroups.map((code, index) => (
                  <TableRow key={code} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
                    <TableCell>{ageGroupLabels[code]}</TableCell>
                    <TableCell>{formatNumber(maleAgeDistribution[ageGroups.indexOf(code)])}</TableCell>
                    <TableCell>{formatNumber(femaleAgeDistribution[ageGroups.indexOf(code)])}</TableCell>
                    <TableCell>{formatNumber(totalAgeDistribution[ageGroups.indexOf(code)])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Typography variant="h6" style={{ textAlign: 'center', marginTop: '50px' }}>Population de 15 ans ou plus par sexe et catégorie socioprofessionnelle en 2020</Typography>
      <Grid container spacing={2} mt={4}>
        <Grid item xs={12} md={6}>
          <Box style={{ height: 600 }}>
            <Plot
              data={[
                {
                  type: 'bar',
                  x: chartData.categories,
                  y: chartData.maleData,
                  name: 'Hommes',
                  marker: { color: 'blue' },
                  hoverinfo: 'x+y',
                  hovertemplate: '<b>%{x}</b><br>Hommes: %{y}'
                },
                {
                  type: 'bar',
                  x: chartData.categories,
                  y: chartData.femaleData,
                  name: 'Femmes',
                  marker: { color: 'orange' },
                  hoverinfo: 'x+y',
                  hovertemplate: '<b>%{x}</b><br>Femmes: %{y}'
                },
                {
                  type: 'bar',
                  x: chartData.categories,
                  y: chartData.totalData,
                  name: 'Total',
                  marker: { color: 'green' },
                  hoverinfo: 'x+y',
                  hovertemplate: '<b>%{x}</b><br>Total: %{y}'
                }
              ]}
              layout={{
                title: '',
                yaxis: {
                  title: 'Nombre de personnes',
                  titlefont: {
                    size: 13,
                    
                  },
                  tickfont: {
                    
                    color: ''
                  }
                },
                autosize: true,
                barmode: 'group',
                legend: {
                  orientation: 'h',
                  y: -0.6,
                  x: 0.1
                }
              }}
              style={{ width: '100%', height: '100%' }}
              ref={el => chartsRef.current[2] = el}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table ref={tableRef}>
              <TableHead style={{ backgroundColor: 'grey' }}>
                <TableRow>
                  <TableCell style={{ color: 'white' }}>Catégorie</TableCell>
                  <TableCell style={{ color: 'white' }}>Hommes</TableCell>
                  <TableCell style={{ color: 'white' }}>Femmes</TableCell>
                  <TableCell style={{ color: 'white' }}>Ensemble</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row, index) => (
                  <TableRow key={row.category} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{formatNumber(row.Homme)}</TableCell>
                    <TableCell>{formatNumber(row.Femme)}</TableCell>
                    <TableCell>{formatNumber(row.Ensemble)}</TableCell>
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
