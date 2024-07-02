import React, { memo } from 'react';
import { Container, Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import the icon you want to use

const Aide = memo(() => {
  const faqs = [
    {
      question: "Comment utiliser l'application Medl'In ?",
      answer: "Pour utiliser l'application, commencez par sélectionner une activité, puis choisissez une localisation et enfin consultez la synthèse de la recherche."
    },
    {
      question: "Comment connaître mon Naf ?",
      answer: "Vous le trouvez dans votre espace personnel du Guichet des formalités des entreprises dès que votre demande d'immatriculation est acceptée."
    },
    {
      question: "Quel sont les code NAF pour mon activité ?",
      answer: (
        <>
          Il vous suffit de consulter la nomenclature NAF&nbsp;
          <a href="https://www.insee.fr/fr/metadonnees/nafr2" target="_blank" rel="noopener noreferrer" style={{ color: '#286AC7' }}>
            sur le site de l'INSEE
          </a>. La recherche par mots-clés vous aidera à déterminer quel code NAF est le plus approprié à l'activité de votre entreprise.
        </>
      )
    },
    {
      question: "Comment obtenir un rapport ?",
      answer: "Une fois les étapes complétées, vous pouvez télécharger un rapport depuis le menu 'Synthèse de la recherche'."
    }
  ];

  return (
    <Container sx={{ mt: 2 }}>
      <Typography variant="h3" component="h1" gutterBottom style={{textAlign: 'center', fontWeight: 'bold'}}>
          Questions fréquentes
      </Typography>
      <br />
      
      <Box sx={{ mt: 4, mb: 2 }}>
        {faqs.map((faq, index) => (
          <Accordion key={index} sx={{ mb: 2 }} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon color='primary' sx={{ fontSize: '1.5rem' }}/>}> {/* Add the icon here */}
              <Typography variant="h6" component="h2" color="primary" style={{ fontWeight: 'bold'}}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" component="p" style={{color: 'rgb(96, 96, 96)'}}>
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
});

export default Aide;

//periode(activitePrincipaleEtablissement:70.22Z AND etatAdministratifEtablissement:A) AND codeCommuneEtablissement:69005
