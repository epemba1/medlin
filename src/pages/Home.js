import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Grid, Card, CardContent, Typography, Button, Paper } from '@mui/material';

// Chemins des icônes dans le dossier public
const BusinessCenterIcon = '/machine-vision-svgrepo-com.svg';
const LocationOnIcon = '/intelligent-positioning-svgrepo-com.svg';
const SummarizeIcon = '/data-analysis-svgrepo-com.svg';

const steps = [
  { id: 1, title: "Sélection d'une ou plusieurs activités associées: utilisez le menu ", strongText: "Sélection de l'activité", icon: <img src={BusinessCenterIcon} alt="Business Center Icon" style={{ width: '60px', height: '60px' }} /> },
  { id: 2, title: "Sélection géographique autour de votre zone d'implantation: utilisez le menu ", strongText: "Localisation d'implantation", icon: <img src={LocationOnIcon} alt="Location On Icon" style={{ width: '60px', height: '60px' }} /> },
  { id: 3, title: "Édition d'un dossier statistique: utilisez le menu ", strongText: "Synthèse de la recherche", icon: <img src={SummarizeIcon} alt="Summarize Icon" style={{ width: '60px', height: '60px' }} /> }
];

const Home = () => {
  const navigate = useNavigate();

  const handleStartStudy = () => {
    navigate('/selection-activite');
  };

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', color: '#e4003a' }}>
        Mon entreprise avec les données de l'Insee
      </Typography>
      <br />
      <br />
      <Typography variant="h6" component="p">
        Votre étude d'implantation se déroule en 3 étapes :
      </Typography>
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
                  color: '#fff'
                }}
              >
                {step.id}
              </Paper>
            </Box>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'white' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {step.icon}
                <Typography variant="h6" component="h2" sx={{ mt: 2, textAlign: 'center' }}>
                  {step.title}<strong>{step.strongText}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <br />
      <br />
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button variant="contained" size="large" onClick={handleStartStudy}>
          Commencer l'étude
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
