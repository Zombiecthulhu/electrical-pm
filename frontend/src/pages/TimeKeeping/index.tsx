import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  AccessTime,
  Schedule,
  Assessment,
} from '@mui/icons-material';
import SignInSheet from './SignInSheet';
import TimeEntryManagement from './TimeEntryManagement';
import TimeReports from './TimeReports';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`timekeeping-tabpanel-${index}`}
      aria-labelledby={`timekeeping-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `timekeeping-tab-${index}`,
    'aria-controls': `timekeeping-tabpanel-${index}`,
  };
}

const TimeKeeping: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="time keeping tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
          }}
        >
          <Tab
            icon={<AccessTime />}
            iconPosition="start"
            label="Sign-In Sheet"
            {...a11yProps(0)}
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<Schedule />}
            iconPosition="start"
            label="Time Entry"
            {...a11yProps(1)}
            sx={{ minHeight: 64 }}
          />
          <Tab
            icon={<Assessment />}
            iconPosition="start"
            label="Reports"
            {...a11yProps(2)}
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <SignInSheet />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <TimeEntryManagement />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <TimeReports />
      </TabPanel>
    </Box>
  );
};

export default TimeKeeping;
