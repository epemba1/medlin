import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, ListItem, ListItemIcon, ListItemText, styled } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined'; 
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined';
import SummaryOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

const menuItems = [
  { text: 'Accueil', icon: <HomeOutlinedIcon />, path: '/' },
  { text: "Sélection de l'activité", icon: <WorkOutlineOutlinedIcon />, path: '/selection-activite' },
  { text: "Localisation d'implantation", icon: <FmdGoodOutlinedIcon />, path: '/localisation-implantation' },
  { text: 'Synthèse de la recherche', icon: <SummaryOutlinedIcon />, path: '/synthese-recherche' },
  { text: 'Aide', icon: <HelpOutlineOutlinedIcon />, path: '/aide' },
];

const SidebarContainer = styled('div')(({ theme, sidebarOpen }) => ({
  width: sidebarOpen ? 280 : 64, // Increase width to accommodate longer text
  transition: 'width 0.3s',
  marginTop: theme.spacing(8),
  position: 'fixed',
  top: 0,
  height: '100vh',
  zIndex: 1200,
  backgroundColor: 'white',
  overflowX: 'hidden',
}));

const StyledListItemIcon = styled(ListItemIcon)({
  minWidth: 36, // Adjust the minimum width to create appropriate space between icon and label
});

const Sidebar = ({ sidebarOpen }) => {
  const location = useLocation();

  return (
    <SidebarContainer sidebarOpen={sidebarOpen}>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            component={Link}
            to={item.path}
            key={item.text}
            style={{ justifyContent: sidebarOpen ? 'initial' : 'center' }}
          >
            <StyledListItemIcon style={{ color: location.pathname === item.path ? '#286AC7' : '#000' }}>
              {item.icon}
            </StyledListItemIcon>
            {sidebarOpen && (
              <ListItemText
                primary={item.text}
                style={{ color: location.pathname === item.path ? '#286AC7' : '#000'}}
              />
            )}
          </ListItem>
        ))}
      </List>
    </SidebarContainer>
  );
};

export default Sidebar;
