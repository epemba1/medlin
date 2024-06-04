import React, { memo } from 'react';
import { Container, Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import the icon you want to use

const Aide = memo(() => {
  const faqs = [
    { question: "Comment utiliser l'application Medl'In ?", answer: "Pour utiliser l'application, commencez par sélectionner une activité, puis choisissez une localisation et enfin consultez la synthèse de la recherche." },
    { question: "Comment connaître mon Naf ?", answer: "Vous le trouvez dans votre espace personnel du Guichet des formalités des entreprises dès que votre demande d'immatriculation est acceptée." },
    { question: "Quel sont les code NAF pour mon activité ?", answer: "Il vous suffit de consulter la nomenclature NAF sur le site de l'INSEE. La recherche par mots-clés vous aidera à déterminer quel code NAF est le plus approprié à l'activité de votre entreprise." },
    { question: "Comment obtenir un rapport ?", answer: "Une fois les étapes complétées, vous pouvez télécharger un rapport depuis le menu 'Synthèse de la recherche'." }
  ];

  return (
    <Container sx={{ mt: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Aide
      </Typography>
      <br />
      <Typography variant="h6" component="h1" gutterBottom>
          - Questions les plus fréquentes :
      </Typography>
      <Box sx={{ mt: 4, mb: 2 }}>
        {faqs.map((faq, index) => (
          <Accordion key={index} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}> {/* Add the icon here */}
              <Typography variant="h6" component="h2">
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" component="p">
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
