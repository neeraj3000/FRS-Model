import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  InputAdornment,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const StudentForm = () => {
  const [formData, setFormData] = useState({
    studentIdSuffix: "", // Only last four digits entered by the user
    batch: "",
    name: "",
    branch: "",
    section: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const batchOptions = ["R19", "R20", "R21", "R22"];

  const handleBatchChange = (e) => {
    const selectedBatch = e.target.value;
    setFormData((prevData) => ({
      ...prevData,
      batch: selectedBatch,
      studentIdSuffix: "", // Reset suffix when batch changes
    }));
  };

  const handleStudentIdSuffixChange = async (e) => {
    const suffix = e.target.value;
    const fullStudentId = formData.batch + suffix;

    setFormData((prevData) => ({
      ...prevData,
      studentIdSuffix: suffix,
    }));

    if (suffix.length === 4) {
      try {
        const response = await axios.post("http://localhost:8000/student-details", { studentId: fullStudentId });
        const data = response.data;

        if (data.error) {
          setErrorMessage(data.error);
          setFormData((prevData) => ({
            ...prevData,
            name: "",
            branch: "",
            section: "",
          }));
        } else {
          setFormData((prevData) => ({
            ...prevData,
            name: data.name,
            branch: data.branch,
            section: data.section,
          }));
          setErrorMessage("");
        }
      } catch (error) {
        setErrorMessage("Error retrieving student details.");
        setFormData((prevData) => ({
          ...prevData,
          name: "",
          branch: "",
          section: "",
        }));
      }
    } else {
      setErrorMessage("");
      setFormData((prevData) => ({
        ...prevData,
        name: "",
        branch: "",
        section: "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.batch || !formData.studentIdSuffix || formData.studentIdSuffix.length < 4) {
      setErrorMessage("Please fill in all fields and ensure the Student ID has 4 digits.");
      return;
    }

    if (!formData.name || !formData.branch || !formData.section) {
      setErrorMessage("Please retrieve student details before submitting.");
      return;
    }

    const submissionData = {
      name: formData.name,
      studentId: formData.batch + formData.studentIdSuffix,
      batch: formData.batch,
      branch: formData.branch,
      section: formData.section,
    };
    
    console.log(submissionData);
    navigate("/webcam-capture", { state: { formData: submissionData } });
  };

  return (
    <Paper elevation={4} sx={{ p: 4, maxWidth: 500, mx: "auto", mt: 5, borderRadius: "16px" }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate("/")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" gutterBottom sx={{ flexGrow: 1, textAlign: "center", fontWeight: 500 }}>
          Student Registration
        </Typography>
      </Box>

      <form onSubmit={handleSubmit} noValidate>
        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel>Batch</InputLabel>
          <Select
            name="batch"
            value={formData.batch}
            onChange={handleBatchChange}
            label="Batch"
            required
          >
            {batchOptions.map((batch) => (
              <MenuItem key={batch} value={batch}>{batch}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField
            label="Student ID"
            variant="outlined"
            value={formData.studentIdSuffix}
            onChange={handleStudentIdSuffixChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {formData.batch}
                </InputAdornment>
              ),
              inputProps: { maxLength: 4 },
            }}
            helperText="Enter the last four digits of your Student ID"
          />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField label="Student Name" value={formData.name} InputProps={{ readOnly: true }} variant="outlined" />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField label="Branch" value={formData.branch} InputProps={{ readOnly: true }} variant="outlined" />
        </FormControl>

        <FormControl fullWidth margin="normal">
          <TextField label="Section" value={formData.section} InputProps={{ readOnly: true }} variant="outlined" />
        </FormControl>

        {errorMessage && (
          <Typography color="error" variant="body2" sx={{ mt: 2, textAlign: "center" }}>
            {errorMessage}
          </Typography>
        )}

        <Box textAlign="center" mt={3}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            sx={{ minWidth: "200px", borderRadius: "8px", padding: "10px 20px" }}
          >
            Start Recording
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default StudentForm;
