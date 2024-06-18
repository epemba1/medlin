import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Paper } from '@mui/material';

// Steps data
const steps = [
  {
    id: 1,
    title: "Sélection d'une ou plusieurs activités associées: utilisez le menu ",
    strongText: "Sélection de l'activité",
    icon: <img src='/machine-vision-svgrepo-com.svg' alt="Business Center Icon" style={{ width: '60px', height: '60px' }} />,
  },
  {
    id: 2,
    title: "Sélection géographique autour de votre zone d'implantation: utilisez le menu ",
    strongText: "Localisation d'implantation",
    icon: <img src='/intelligent-positioning-svgrepo-com.svg' alt="Location On Icon" style={{ width: '60px', height: '60px' }} />,
  },
  {
    id: 3,
    title: "Édition d'un dossier statistique: utilisez le menu ",
    strongText: "Synthèse de la recherche",
    icon: <img src='/data-analysis-svgrepo-com.svg' alt="Summarize Icon" style={{ width: '60px', height: '60px' }} />,
  },
];

const StepsSection = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#f5f5f5',
        paddingLeft: 2,
        paddingRight: 2,
        paddingTop: 6,
        paddingBottom: 6,
      }}
    >
      <Box sx={{ textAlign: 'center', mt: 6, width: '100%' }}>
        <Typography variant="h5" component="p" sx={{textDecoration: ''}}>
          Votre étude d'implantation se déroule en 3 étapes :
        </Typography>
      </Box>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {steps.map((step) => (
          <Grid item xs={12} md={4} key={step.id}>
            <Box display="flex" justifyContent="center" mb={1}>
              <Paper
                elevation={3}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#3f51b5',
                  color: '#fff',
                }}
              >
                {step.id}
              </Paper>
            </Box>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'white',
                padding: 2,
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {step.icon}
                <Typography variant="body1" component="h2" sx={{ mt: 2, textAlign: 'center' }}>
                  {step.title}
                  <strong className="border-b-4 border-pink-600">{step.strongText}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StepsSection;
