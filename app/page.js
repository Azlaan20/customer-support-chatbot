'use client'
import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { Stack, TextField, Button, Avatar, Typography, IconButton, Tooltip, Switch, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/system';
import axios from 'axios';
import CloudIcon from '@mui/icons-material/Cloud';

// Helper function to fetch weather information based on user's location
const fetchWeather = async (latitude, longitude) => {
    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                lat: latitude,
                lon: longitude,
                appid: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
                units: 'metric',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
};

// Helper function to fetch user's location
const fetchUserLocation = async () => {
    try {
        const response = await axios.get('https://ipapi.co/json/');
        return response.data;
    } catch (error) {
        console.error('Error fetching location data:', error);
        return null;
    }
};

// Custom Styled Components for Enhanced Aesthetics
const ChatContainer = styled(Box)(({ theme }) => ({
    width: '600px',
    height: '700px',
    border: `1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)'}`,
    borderRadius: '16px',
    backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(15px)',
    boxShadow: theme === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    transformStyle: 'preserve-3d',
}));

const MessageBubble = styled(Box)(({ role, theme, bubbleColor }) => ({
    borderRadius: '20px',
    padding: '15px',
    maxWidth: role === 'user' ? '85%' : '75%',
    color: theme === 'dark' ? '#fff' : '#000',
    backgroundColor: bubbleColor || (role === 'assistant' ? (theme === 'dark' ? 'rgba(0, 136, 169, 0.8)' : 'rgba(0, 136, 169, 0.6)') : (theme === 'dark' ? 'rgba(87, 95, 207, 0.8)' : 'rgba(87, 95, 207, 0.6)')),
    alignSelf: role === 'assistant' ? 'flex-start' : 'flex-end',
    boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    marginBottom: '15px',
    transition: 'transform 0.6s ease',
    transformStyle: 'preserve-3d',
}));

const MessageInput = styled(TextField)(({ theme }) => ({
    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: '10px',
    input: {
        color: theme === 'dark' ? '#fff' : '#000',
    },
    transformStyle: 'preserve-3d',
    transform: 'translateZ(5px)',
}));

const SendButton = styled(Button)(({ theme }) => ({
    backgroundColor: theme === 'dark' ? '#575fcf' : '#575fcf',
    color: '#fff',
    '&:hover': {
        backgroundColor: theme === 'dark' ? '#4e54c8' : '#4e54c8',
    },
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden', // Fixed here
}));

const AvatarContainer = styled(Avatar)(({ role, theme }) => ({
    backgroundColor: role === 'assistant' ? (theme === 'dark' ? '#0088a9' : '#0088a9') : (theme === 'dark' ? '#575fcf' : '#575fcf'),
    boxShadow: theme === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.1)',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.3s ease',
}));

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [loadingWeather, setLoadingWeather] = useState(false);
    const messagesEndRef = useRef(null);

    const sendMessage = async () => {
        const userMessage = message.trim();
        if (!userMessage) return;

        const newMessages = [
            ...messages,
            {
                role: 'user',
                content: userMessage,
            },
            {
                role: 'assistant',
                content: '',
            },
        ];
        setMessages(newMessages);
        setMessage('');
        setIsTyping(true);

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newMessages.slice(0, -1)), // Send all but the last empty assistant message
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let result = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            result += text;

            setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1].content = result;
                return updatedMessages;
            });
        }
        setIsTyping(false);
    };

    const handleFeedback = async (feedback) => {
        try {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
                await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: lastMessage.content, feedback }),
                });
                const feedbackResponse = feedback === 'negative' ? 'We will try to improve.' : 'Thanks for your feedback!';
                setMessages([...messages, { role: 'assistant', content: feedbackResponse }]);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleThemeChange = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const handleFetchWeather = async () => {
        setLoadingWeather(true);
        try {
            const locationData = await fetchUserLocation();
            if (locationData) {
                const weatherData = await fetchWeather(locationData.latitude, locationData.longitude);
                if (weatherData) {
                    const locationInfo = `${locationData.city}, ${locationData.country_name}`;
                    setMessages([...messages, {
                        role: 'assistant',
                        content: `The current weather in ${locationInfo} is ${weatherData.main.temp}°C with ${weatherData.weather[0].description}.`,
                    }]);
                }
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
        } finally {
            setLoadingWeather(false);
        }
    };

    return (
        <Box
            width="100vw"
            height="100vh"
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
                background: theme === 'dark' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #e0e0e0 100%)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.5s ease-in-out',
                animation: 'slide-in 0.8s ease-out',
                '@keyframes slide-in': {
                    '0%': { transform: 'translateY(-50px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 },
                },
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -1,
                    background: 'url(/particles.png) no-repeat center center',
                    backgroundSize: 'cover',
                    opacity: 0.3,
                }}
            />

            <ChatContainer
                theme={theme}
                component={motion.div}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color={theme === 'dark' ? '#fff' : '#000'}>
                        Chat with Support
                    </Typography>
                    <Box display="flex" alignItems="center">
                        <Tooltip title="Toggle Theme">
                            <Switch
                                checked={theme === 'dark'}
                                onChange={handleThemeChange}
                                color="default"
                            />
                        </Tooltip>
                        <Tooltip title="Fetch Weather">
                            <IconButton
                                onClick={handleFetchWeather}
                                disabled={loadingWeather}
                                sx={{ transformStyle: 'preserve-3d', transition: 'transform 0.3s' }}
                                whileHover={{ scale: 1.1, rotateX: 15, rotateY: 15 }}
                            >
                                {loadingWeather ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    <CloudIcon color="inherit" />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
                <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" sx={{ paddingRight: '10px' }}>
                    {messages.map((message, index) => (
                        <Box key={index} display="flex" justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}>
                            {message.role === 'assistant' && (
                                <AvatarContainer
                                    role={message.role}
                                    theme={theme}
                                    component={motion.div}
                                    initial={{ rotateY: 180 }}
                                    animate={{ rotateY: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                >
                                    <Avatar src="/assistant-avatar.png" alt="Assistant" />
                                </AvatarContainer>
                            )}
                            <Box display="flex" flexDirection="column">
                                <MessageBubble
                                    role={message.role}
                                    theme={theme}
                                    bubbleColor={message.bubbleColor}
                                    component={motion.div}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    whileHover={{ scale: 1.05, rotateX: 10, rotateY: 10, translateZ: 10 }}
                                >
                                    {message.content}
                                </MessageBubble>
                                {message.role === 'assistant' && (
                                    <Box display="flex" justifyContent="flex-end">
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            size="small"
                                            onClick={() => handleFeedback('positive')}
                                            sx={{ marginRight: '8px', transformStyle: 'preserve-3d', transition: 'transform 0.3s' }}
                                            whileHover={{ scale: 1.1, rotateX: 15, rotateY: 15 }}
                                        >
                                            👍
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            onClick={() => handleFeedback('negative')}
                                            sx={{ transformStyle: 'preserve-3d', transition: 'transform 0.3s' }}
                                            whileHover={{ scale: 1.1, rotateX: 15, rotateY: 15 }}
                                        >
                                            👎
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                            {message.role === 'user' && (
                                <AvatarContainer
                                    role={message.role}
                                    theme={theme}
                                    component={motion.div}
                                    initial={{ rotateY: -180 }}
                                    animate={{ rotateY: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                                >
                                    <Avatar src="/user-avatar.png" alt="User" />
                                </AvatarContainer>
                            )}
                        </Box>
                    ))}
                    {isTyping && (
                        <Box display="flex" justifyContent="flex-start">
                            <AvatarContainer
                                role="assistant"
                                theme={theme}
                                component={motion.div}
                                initial={{ rotateY: -180 }}
                                animate={{ rotateY: 0 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                            >
                                <Avatar src="/assistant-avatar.png" alt="Assistant" />
                            </AvatarContainer>
                            <MessageBubble
                                role="assistant"
                                theme={theme}
                                component={motion.div}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                whileHover={{ scale: 1.05, rotateX: 10, rotateY: 10, translateZ: 10 }}
                            >
                                <motion.div
                                    animate={{
                                        opacity: [0.2, 1, 0.2],
                                        translateX: [0, 10, -10, 0],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.5,
                                    }}
                                >
                                    <Typography variant="body2">...</Typography>
                                </motion.div>
                            </MessageBubble>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mt: 'auto' }}>
                    <MessageInput
                        theme={theme}
                        variant="outlined"
                        label="Type a message"
                        fullWidth
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                sendMessage();
                            }
                        }}
                        InputLabelProps={{
                            style: { color: theme === 'dark' ? '#fff' : '#000', marginBottom: '5px' },
                        }}
                        sx={{
                            input: { color: theme === 'dark' ? '#fff' : '#000' },
                            label: { color: theme === 'dark' ? '#fff' : '#000' },
                        }}
                        component={motion.div}
                        initial={{ translateZ: 5 }}
                        whileHover={{ translateZ: 15 }}
                    />
                    <SendButton
                        onClick={sendMessage}
                        theme={theme}
                        variant="contained"
                        component={motion.button}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        sx={{ minWidth: '80px' }}
                    >
                        Send
                    </SendButton>
                </Stack>
            </ChatContainer>
        </Box>
    );
}
