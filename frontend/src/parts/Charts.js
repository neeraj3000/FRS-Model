import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Sample data for attendance
const data1 = [
  { name: 'CSE', attendance: 90 },
  { name: 'ECE', attendance: 85 },
  { name: 'EEE', attendance: 78 },
  { name: 'CIVIL', attendance: 92 },
  { name: 'MECH', attendance: 88 },
];

const data2 = [
  { name: 'E1', attendance: 75 },
  { name: 'E2', attendance: 80 },
  { name: 'E3', attendance: 65 },
  { name: 'E4', attendance: 70 },
];

const data3 = [
  { name: 'January', attendance: 95 },
  { name: 'February', attendance: 97 },
  { name: 'March', attendance: 93 },
  { name: 'April', attendance: 89 },
  { name: 'May', attendance: 94 },
  { name: 'June', attendance: 89 },
  { name: 'July', attendance: 45},
  { name: 'August', attendance: 89 },
  { name: 'September', attendance: 90 },
  { name: 'October', attendance: 65 },
  { name: 'November', attendance: 79 },
  { name: 'December', attendance: 50 },
];

const colors = ["#8884d8", "#82ca9d", "#ffc658"];

const AttendanceChart = ({ title, data, color }) => (
  <div style={{ flex: '1', margin: '10px' }}>
    <h2>{title}</h2>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="attendance" fill={color} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const AttendanceCharts = () => {
  return (
    <div style={{ padding: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <AttendanceChart title="Branchwise Attendance" data={data1} color={colors[0]} />
        <AttendanceChart title="Yearwise Attendance" data={data2} color={colors[1]} />
      </div>
      <div style={{ marginTop: '20px' }}>
        <AttendanceChart title="Monthly Attendance" data={data3} color={colors[2]} />
      </div>
    </div>
  );
};

export default AttendanceCharts;

