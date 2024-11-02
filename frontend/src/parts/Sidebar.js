import React, { useState } from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon,
    Update as UpdateIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import GridViewIcon from '@mui/icons-material/GridView';
const drawerWidth = 240;

const Sidebar = () => {
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const navigate = useNavigate(); // Initialize the navigate function

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setOpen(open);
    };

    const handleListItemClick = (index, path) => {
        setSelectedIndex(index);
        if (path) {
            navigate(path); // Navigate to the specified path
        }
    };

    const menuItems = [
        { text: 'Dashboard/Home', icon: <DashboardIcon />, path: '/' },
        {
            text: 'User Management',
            icon: <PeopleIcon />,
            subItems: [
                { text: 'Add User', icon: <PersonAddIcon />, path: '/student' },
                { text: 'Remove User', icon: <PersonRemoveIcon />, path: '/remove-user' },
                { text: 'Update User', icon: <UpdateIcon />, path: '/update-user' },
            ],
        },
        {
            text: 'Attendance Management',
            icon: <CheckCircleIcon />,
            subItems: [
                { text: 'Update Attendance', icon: <UpdateIcon />, path: '/update-attendance' },
            ],
        },
        {
            text: 'View new registrations',
            icon: <GridViewIcon />,
            path: '/registrations',
        },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={toggleDrawer(true)}
                        edge="start"
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div">
                        Admin Portal
                    </Typography>
                </Toolbar>
            </AppBar>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        top: '64px',
                        boxSizing: 'border-box',
                        backgroundColor: '#f8f8f8',
                    },
                }}
                variant="temporary"
                anchor="left"
                open={open}
                onClose={toggleDrawer(false)}
            >
                <List>
                    {menuItems.map((item, index) => (
                        <React.Fragment key={index}>
                            <ListItem
                                button
                                onClick={() => handleListItemClick(index, item.path)}
                                selected={selectedIndex === index}
                                sx={{
                                    bgcolor: selectedIndex === index ? '#2196F3' : 'transparent',
                                    color: selectedIndex === index ? '#fff' : '#000',
                                    boxShadow: selectedIndex === index ? '0px 4px 10px rgba(0, 0, 0, 0.2)' : 'none',
                                    '&:hover': {
                                        bgcolor: '#2196F3',
                                        color: '#fff',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                            {item.subItems && selectedIndex === index && (
                                <List component="div" disablePadding>
                                    {item.subItems.map((subItem, subIndex) => (
                                        <ListItem
                                            button
                                            key={subIndex}
                                            onClick={() => handleListItemClick(index + subIndex + 0.1, subItem.path)}
                                            selected={selectedIndex === index + subIndex + 0.1}
                                            sx={{
                                                pl: 4,
                                                bgcolor: selectedIndex === index + subIndex + 0.1 ? '#fff' : 'transparent',
                                                color: selectedIndex === index + subIndex + 0.1 ? '#2196F3' : '#000',
                                                boxShadow: selectedIndex === index + subIndex + 0.1 ? '0px 4px 10px rgba(0, 0, 0, 0.2)' : 'none',
                                                '&:hover': {
                                                    bgcolor: '#f0f0f0',
                                                    color: '#2196F3',
                                                },
                                            }}
                                        >
                                            <ListItemIcon sx={{ color: 'inherit' }}>{subItem.icon}</ListItemIcon>
                                            <ListItemText primary={subItem.text} />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                            <Divider />
                        </React.Fragment>
                    ))}
                </List>
            </Drawer>
        </Box>
    );
};

export default Sidebar;
