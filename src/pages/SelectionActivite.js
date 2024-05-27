import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, FormControl, Skeleton, AlertTitle, Alert, TextField, InputAdornment, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';
import Select from 'react-select';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';

const SelectionActivite = () => {
  const [data, setData] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSubclass, setSelectedSubclass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      axios.get('/nafData.json')
        .then(response => {
          setData(response.data);
          setLoading(false);
        })
        .catch(error => console.error('Error loading data:', error));
    }, 2000);
  }, []);

  const handleSectionChange = (selectedOption) => {
    setSelectedSection(selectedOption);
    setSelectedDivision(null);
    setSelectedGroup(null);
    setSelectedClasses([]);
    setSelectedSubclass(null);
  };

  const handleDivisionChange = (selectedOption) => {
    setSelectedDivision(selectedOption);
    setSelectedGroup(null);
    setSelectedClasses([]);
    setSelectedSubclass(null);
  };

  const handleGroupChange = (selectedOption) => {
    setSelectedGroup(selectedOption);
    setSelectedClasses([]);
    setSelectedSubclass(null);
  };

  const handleClassChange = (selectedOptions) => {
    setSelectedClasses(selectedOptions);
    setSelectedSubclass(null);
  };

  const handleSubclassChange = (selectedOption) => {
    setSelectedSubclass(selectedOption);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query) {
      const allOptions = [
        ...data.sections,
        ...Object.values(data.divisions).flat(),
        ...Object.values(data.groups).flat(),
        ...Object.values(data.classes).flat(),
        ...Object.values(data.subclasses).flat()
      ];
      const filtered = allOptions.filter(option =>
        option.label.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions([]);
    }
  };

  const handleResultClick = (option) => {
    const alreadySelected = selectedActivities.some(activity => activity.value === option.value);
    if (!alreadySelected) {
      setSelectedActivities([...selectedActivities, option]);
    }
    setSearchQuery('');
    setFilteredOptions([]);
  };

  const handleDeleteActivity = (activityToDelete) => {
    setSelectedActivities(selectedActivities.filter(activity => activity.value !== activityToDelete.value));
  };

  if (loading) {
    return (
      <Container>
        <Typography variant="h4" gutterBottom style={{ color: '#286AC7' }}>
          <Skeleton width="60%" />
        </Typography>
        <Box component="form" marginTop={2}>
          <Grid container spacing={3}>
            {[...Array(5)].map((_, index) => (
              <Grid item xs={12} key={index}>
                <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                  <Skeleton width="40%" />
                </Typography>
                <FormControl fullWidth>
                  <Skeleton variant="rectangular" height={56} />
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box display="flex" alignItems="center" justifyContent="space-between" position="relative">
        <Typography variant="h4" gutterBottom>
          Sélection de l'Activité
        </Typography>
        <Box display="flex" alignItems="center" style={{ marginLeft: '20px', position: 'relative' }}>
          <TextField
            variant="outlined"
            placeholder="Rechercher une activité..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ maxWidth: '300px', marginRight: '10px', height: '40px' }}
            InputProps={{
              style: { height: '40px' },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {filteredOptions.length > 0 && (
            <Paper style={{ position: 'absolute', zIndex: 1, width: '300px', maxHeight: '200px', overflowY: 'auto', top: '45px' }}>
              <List>
                {filteredOptions.slice(0, 7).map(option => (
                  <ListItem button key={option.value} onClick={() => handleResultClick(option)}>
                    <ListItemText primary={option.label} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>
      {selectedActivities.length > 0 && (
        <Box marginTop={2}>
          <Typography variant="h6">
            Vous avez choisi les activités:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedActivities.map(activity => (
              <Chip
                key={activity.value}
                label={activity.label}
                color="primary"
                onDelete={() => handleDeleteActivity(activity)}
              />
            ))}
          </Box>
        </Box>
      )}
      <br />
      <Alert variant="outlined" severity="info">
        <AlertTitle>Veuillez choisir ci-dessous l'activité souhaitée.</AlertTitle>
        Les menus se mettront à jour en fonction de votre choix précédent.
      </Alert>
      <Box component="form" marginTop={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
              Section
            </Typography>
            <FormControl fullWidth>
              <Select
                value={selectedSection}
                onChange={handleSectionChange}
                options={data.sections}
                placeholder="Sélectionnez une section"
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                  }),
                }}
              />
            </FormControl>
          </Grid>

          {selectedSection && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Division
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedDivision}
                  onChange={handleDivisionChange}
                  options={data.divisions[selectedSection.value] || []}
                  placeholder="Sélectionnez une division"
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                    }),
                  }}
                />
              </FormControl>
            </Grid>
          )}

          {selectedDivision && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Groupe
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedGroup}
                  onChange={handleGroupChange}
                  options={data.groups[selectedDivision.value] || []}
                  placeholder="Sélectionnez un groupe"
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                    }),
                  }}
                />
              </FormControl>
            </Grid>
          )}

          {selectedGroup && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Classe
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedClasses}
                  onChange={handleClassChange}
                  options={data.classes[selectedGroup.value] || []}
                  placeholder="Sélectionnez une classe"
                  isMulti
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                    }),
                  }}
                />
              </FormControl>
            </Grid>
          )}

          {selectedClasses.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom style={{ color: '#286AC7' }}>
                Sous-classe
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={selectedSubclass}
                  onChange={handleSubclassChange}
                  options={data.subclasses[selectedClasses.map(cls => cls.value)] || []}
                  placeholder="Sélectionnez une sous-classe"
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                    }),
                  }}
                />
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default SelectionActivite;
