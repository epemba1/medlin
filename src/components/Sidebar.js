import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, ListItem, ListItemIcon, ListItemText, styled } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HomeIcon from '@mui/icons-material/Home';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined'; 
import WorkIcon from '@mui/icons-material/Work';
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import SummaryOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import SummaryIcon from '@mui/icons-material/Summarize';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import HelpIcon from '@mui/icons-material/Help';

const menuItems = [
  { text: 'Accueil', icon: <HomeOutlinedIcon />, activeIcon: <HomeIcon />, path: '/' },
  { text: "Sélection de l'activité", icon: <WorkOutlineOutlinedIcon />, activeIcon: <WorkIcon />, path: '/selection-activite' },
  { text: "Localisation d'implantation", icon: <FmdGoodOutlinedIcon />, activeIcon: <FmdGoodIcon />, path: '/localisation-implantation' },
  { text: 'Synthèse de la recherche', icon: <SummaryOutlinedIcon />, activeIcon: <SummaryIcon />, path: '/synthese-recherche' },
  { text: 'Aide', icon: <HelpOutlineOutlinedIcon />, activeIcon: <HelpIcon />, path: '/aide' },
];

//Customise
const SidebarContainer = styled('div')(({ theme, sidebarOpen }) => ({
  width: sidebarOpen ? 280 : 64,
  transition: 'width 0.3s',
  marginTop: theme.spacing(8),
  position: 'fixed',
  top: 0,
  height: '100vh',
  zIndex: 1200,
  backgroundColor: 'white',
  overflowX: 'hidden',
}));

//Theme material ui
const StyledListItemIcon = styled(ListItemIcon)({
  minWidth: 36,
});

const Sidebar = ({ sidebarOpen }) => {
  const location = useLocation();

  return (
    <SidebarContainer sidebarOpen={sidebarOpen}>
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              button
              component={Link}
              to={item.path}
              key={item.text}
              style={{ 
                justifyContent: sidebarOpen ? 'initial' : 'center',
                backgroundColor: isActive ? '#f5f5f5' : 'transparent'
              }}
            >
              <StyledListItemIcon style={{ color: isActive ? '#286AC7' : '#000' }}>
                {isActive ? item.activeIcon : item.icon}
              </StyledListItemIcon>
              {sidebarOpen && (
                <ListItemText
                  primary={item.text}
                  style={{ 
                    color: isActive ? '#286AC7' : '#000', 
                    fontWeight: isActive ? 'bold' : 'normal' 
                  }}
                />
              )}
            </ListItem>
          );
        })}
      </List>
    </SidebarContainer>
  );
};

export default Sidebar;
