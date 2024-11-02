import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Select, MenuItem, FormControl,
  InputLabel, Button, Box, IconButton, AppBar, Toolbar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';

function Registrations() {
  const navigate = useNavigate();
  const [filteredData, setFilteredData] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const batchOptions = ["R19", "R20", "R21", "R22"];
  const branchOptions = ["CS", "EC", "EE", "ME", "MM", "CH", "CE"];
  const sectionOptions = ["A", "B", "C", "D", "E", "F"];

  const [visibleRows, setVisibleRows] = useState(10);

  const fetchFilteredData = async () => {
    axios.get('http://localhost:8000/filtered-data', {
      params: {
        batch: selectedBatch,
        branch: selectedBranch,
        section: selectedSection
      }
    }).then((res) => setFilteredData(res.data));
  };

  const showMoreRows = () => {
    setVisibleRows((prev) => prev + 10);
  };

  const handleDelete = async (studentId) => {
    try {
      await axios.delete(`http://localhost:8000/delete-student/${studentId}`);
      setFilteredData((prevData) => prevData.filter(item => item.id !== studentId));
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete the record.");
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      {/* AppBar for Back Button and Title */}
      <AppBar position="static" color="default" sx={{ mb: 2 }}>
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>Student Registrations</Typography>
        </Toolbar>
      </AppBar>

      {/* Filter Controls */}
      <Box
        display="flex"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        mt={2}
        mb={2}
        sx={{ padding: 3, backgroundColor: '#f5f5f5', borderRadius: '6px' }}
      >
        <FormControl variant="outlined" size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Batch</InputLabel>
          <Select
            label="Batch"
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
          >
            <MenuItem value=""><em>Select Batch</em></MenuItem>
            {batchOptions.map((batch, index) => (
              <MenuItem key={index} value={batch}>{batch}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            label="Branch"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <MenuItem value=""><em>Select Branch</em></MenuItem>
            {branchOptions.map((branch, index) => (
              <MenuItem key={index} value={branch}>{branch}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Section</InputLabel>
          <Select
            label="Section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            <MenuItem value=""><em>Select Section</em></MenuItem>
            {sectionOptions.map((section, index) => (
              <MenuItem key={index} value={section}>{section}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchFilteredData}
          sx={{ minWidth: 100, height: '40px', fontSize: '0.875rem' }}
        >
          Fetch Data
        </Button>
      </Box>

      {/* Filtered Data Table */}
      <Typography variant="h6" gutterBottom>Filtered Data</Typography>
      <TableContainer component={Paper} sx={{ borderRadius: '6px', boxShadow: 2, maxHeight: 380, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Student ID</strong></TableCell>
              <TableCell><strong>Batch</strong></TableCell>
              <TableCell><strong>Branch</strong></TableCell>
              <TableCell><strong>Section</strong></TableCell>
              <TableCell><strong>Embeddings</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.slice(0, visibleRows).map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.batch}</TableCell>
                <TableCell>{item.branch}</TableCell>
                <TableCell>{item.section}</TableCell>
                <TableCell>
                  {item.embeddings ? <CheckCircleIcon color="success" /> : null}
                </TableCell>
                <TableCell>
                  <IconButton color="secondary" onClick={() => handleDelete(item.id)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredData.length > visibleRows && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ mt: 1, mb: 1 }}>
            <Button
              onClick={showMoreRows}
              sx={{ color: 'primary.main', textTransform: 'none', fontSize: '0.875rem' }}
              endIcon={<ExpandMoreIcon />}
            >
              See More
            </Button>
          </Box>
        )}
      </TableContainer>
    </Container>
  );
}

export default Registrations;
