import React, { useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';

const PopulationTab = forwardRef(({ selectedNAF, selectedCommunes }, ref) => {
  const [populationData, setPopulationData] = useState([]);

  useEffect(() => {
    // Assuming we fetch some data here
    setPopulationData([
      { Commune: 'Commune 1', Population: 1000 },
      { Commune: 'Commune 2', Population: 2000 }
    ]);
  }, [selectedNAF, selectedCommunes]);

  useImperativeHandle(ref, () => ({
    getPopulationData: () => populationData,
  }));

  return (
    <Box>
      <Typography variant="h5">Données Statistiques Population</Typography>
      {/* Display population data here */}
    </Box>
  );
});

export default PopulationTab;
