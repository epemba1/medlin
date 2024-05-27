import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, styled } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const StyledImage = styled('img')({
  width: 50,
  height: 50,
  backgroundColor: 'white',
  marginRight: 10,
});

const Header = ({ toggleSidebar }) => {
  return (
    <AppBar position="fixed" sx={{ backgroundColor: 'white', zIndex: 1300, boxShadow: 'none' }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={toggleSidebar}
          sx={{ color: '#000', mr: 0.5 }} 
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h5" sx={{ color: '#e4003a', fontWeight: 'bold', flexGrow: 1 }}>
          Medl'In
        </Typography>
        <StyledImage src="/INSEE_1.1.jpg" alt="Votre image" />
      </Toolbar>
    </AppBar>
  );
};

export default Header;
