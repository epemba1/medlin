import React from 'react';
import { Box, Typography, Container, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box sx={{ backgroundColor: '#f5f5f5', py: 2, mt: 10 }}>
      <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
        <Box sx={{ mb: 1 }}>
          <Typography style={{marginLeft: '26px', fontWeight:'bold'}}>Source:</Typography>
          <Link 
            href="https://www.data.gouv.fr" 
            target="_blank" 
            rel="noopener" 
            sx={{ mx: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            data.gouv.fr
          </Link>
          |
          <Link 
            href="https://www.insee.fr" 
            target="_blank" 
            rel="noopener" 
            sx={{ mx: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            insee.fr
          </Link>
        </Box>
        <Typography variant="body2" color="textSecondary" align="center">
          &copy; {new Date().getFullYear()} Medl'In. Tous droits réservés.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
