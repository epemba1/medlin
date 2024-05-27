import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Container, Box, Grid, Card, CardContent, Typography, Button, Paper } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SummarizeIcon from '@mui/icons-material/Summarize';

const steps = [
  { id: 1, title: "Sélection d'une ou plusieurs activités associées: utilisez le menu ", strongText: "Sélection de l'activité", icon: <BusinessCenterIcon fontSize="large" /> },
  { id: 2, title: "Sélection géographique autour de votre zone d'implantation: utilisez le menu ", strongText: "Localisation d'implantation", icon: <LocationOnIcon fontSize="large" /> },
  { id: 3, title: "Édition d'un dossier statistique: utilisez le menu ", strongText: "Synthèse de la recherche", icon: <SummarizeIcon fontSize="large" /> }
];

const Home = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleStartStudy = () => {
    navigate('/selection-activite'); // Redirect to the activity selection page
  };

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', color:'#e4003a' }}>
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
