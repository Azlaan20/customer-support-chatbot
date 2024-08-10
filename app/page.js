'use client';
import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { Stack, TextField, Button, Avatar, Typography, IconButton, Tooltip, Switch, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Slider } from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/system';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import SettingsIcon from '@mui/icons-material/Settings';
import MoodIcon from '@mui/icons-material/Mood';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudIcon from '@mui/icons-material/Cloud';
import axios from 'axios';

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
}));

const MessageBubble = styled(Box)(({ role, theme, bubbleColor }) => ({
  borderRadius: '20px',
  padding: '15px',
  maxWidth: '75%',
  color: theme === 'dark' ? '#fff' : '#000',
  backgroundColor: bubbleColor || (role === 'assistant' ? (theme === 'dark' ? 'rgba(0, 136, 169, 0.8)' : 'rgba(0, 136, 169, 0.6)') : (theme === 'dark' ? 'rgba(87, 95, 207, 0.8)' : 'rgba(87, 95, 207, 0.6)')),
  alignSelf: role === 'assistant' ? 'flex-start' : 'flex-end',
  boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  marginBottom: '15px',
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: role === 'assistant' ? '20px' : 'auto',
    right: role === 'assistant' ? 'auto' : '20px',
    borderTop: theme === 'dark' ? '10px solid rgba(0, 0, 0, 0.6)' : '10px solid rgba(255, 255, 255, 0.6)',
    borderLeft: role === 'assistant' ? '10px solid transparent' : 'none',
    borderRight: role === 'assistant' ? 'none' : '10px solid transparent',
  },
}));

const MessageInput = styled(TextField)(({ theme }) => ({
  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
  borderRadius: '10px',
  input: {
    color: theme === 'dark' ? '#fff' : '#000',
  },
}));

const SendButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme === 'dark' ? '#575fcf' : '#575fcf',
  color: '#fff',
  '&:hover': {
    backgroundColor: theme === 'dark' ? '#4e54c8' : '#4e54c8',
  },
}));

const AvatarContainer = styled(Avatar)(({ role, theme }) => ({
  backgroundColor: role === 'assistant' ? (theme === 'dark' ? '#0088a9' : '#0088a9') : (theme === 'dark' ? '#575fcf' : '#575fcf'),
  boxShadow: theme === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.1)',
}));

const ReactionsContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginTop: '-10px',
  marginBottom: '10px',
});

// Helper function to save chat history in local storage
const saveChatHistory = (messages) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }
};

// Helper function to retrieve chat history from local storage
const loadChatHistory = () => {
  if (typeof window !== 'undefined') {
    const savedMessages = localStorage.getItem('chatHistory');
    return savedMessages ? JSON.parse(savedMessages) : [];
  }
  return [];
};

// Helper function to save theme preference in local storage
const saveThemePreference = (theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('themePreference', theme);
  }
};

// Helper function to retrieve theme preference from local storage
const loadThemePreference = () => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('themePreference');
    return savedTheme ? savedTheme : 'dark';
  }
  return 'dark';
};

// Helper function to fetch weather information
const fetchWeather = async () => {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: 'New York',
        appid: 'your_api_key',
        units: 'metric',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

export default function Home() {
  const [messages, setMessages] = useState(loadChatHistory());
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [theme, setTheme] = useState(loadThemePreference());
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);
  const [isEditingMessage, setIsEditingMessage] = useState(null);
  const [bubbleColor, setBubbleColor] = useState('#575fcf');
  const [openProfileSettings, setOpenProfileSettings] = useState(false);
  const [username, setUsername] = useState('User');
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    const userMessage = message.trim();
    if (!userMessage) return;

    const newMessages = [
      ...messages,
      {
        role: 'user',
        content: userMessage,
        bubbleColor,
      },
    ];
    setMessages(newMessages);
    setMessage('');
    setIsTyping(true);

    saveChatHistory(newMessages);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMessages),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let result = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      result += text;

      const updatedMessages = newMessages.map((msg, index) => {
        if (index === newMessages.length - 1) {
          return {
            ...msg,
            content: msg.content + text,
          };
        }
        return msg;
      });

      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    }
    setIsTyping(false);
    setAssistantTyping(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReactionClick = (event, index) => {
    setReactionAnchorEl(event.currentTarget);
    setSelectedMessageIndex(index);
  };

  const handleReactionClose = () => {
    setReactionAnchorEl(null);
    setSelectedMessageIndex(null);
  };

  const handleReactionSelect = (reaction) => {
    const updatedMessages = messages.map((msg, index) => {
      if (index === selectedMessageIndex) {
        return {
          ...msg,
          reaction,
        };
      }
      return msg;
    });
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    handleReactionClose();
  };

  const handleThemeChange = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };

  const handleEditMessage = (index) => {
    setIsEditingMessage(index);
    setMessage(messages[index].content);
  };

  const handleDeleteMessage = (index) => {
    const updatedMessages = messages.filter((_, i) => i !== index);
    setMessages(updatedMessages);
    saveChatHistory(updatedMessages);
  };

  const handleSaveEditedMessage = () => {
    const updatedMessages = messages.map((msg, index) => {
      if (index === isEditingMessage) {
        return {
          ...msg,
          content: message,
        };
      }
      return msg;
    });
    setMessages(updatedMessages);
    setIsEditingMessage(null);
    setMessage('');
    saveChatHistory(updatedMessages);
  };

  const handleOpenProfileSettings = () => {
    setOpenProfileSettings(true);
  };

  const handleCloseProfileSettings = () => {
    setOpenProfileSettings(false);
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
      }}
    >
      {/* Animated background particles */}
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
          <Typography variant="h6" color="inherit">
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
            <Tooltip title="Profile Settings">
              <IconButton onClick={handleOpenProfileSettings}>
                <SettingsIcon color="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fetch Weather">
              <IconButton onClick={async () => {
                const weatherData = await fetchWeather();
                if (weatherData) {
                  setMessages([...messages, {
                    role: 'assistant',
                    content: `The current weather in New York is ${weatherData.main.temp}°C with ${weatherData.weather[0].description}.`,
                  }]);
                }
              }}>
                <CloudIcon color="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" sx={{ paddingRight: '10px' }}>
          {messages.map((message, index) => (
            <Box key={index} display="flex" alignItems="flex-end">
              {message.role === 'assistant' && (
                <AvatarContainer role={message.role} theme={theme}>
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
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleReactionClick(e, index);
                  }}
                >
                  {message.content}
                </MessageBubble>
                {message.reaction && (
                  <ReactionsContainer>
                    <Typography variant="body2" color="inherit">
                      {message.reaction}
                    </Typography>
                  </ReactionsContainer>
                )}
              </Box>
              {message.role === 'user' && (
                <AvatarContainer role={message.role} theme={theme}>
                  <Avatar src="/user-avatar.png" alt={username} />
                </AvatarContainer>
              )}
              {message.role === 'user' && (
                <Box display="flex" flexDirection="column">
                  <IconButton onClick={() => handleEditMessage(index)}>
                    <EditIcon color="inherit" />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteMessage(index)}>
                    <DeleteIcon color="inherit" />
                  </IconButton>
                </Box>
              )}
            </Box>
          ))}
          {isTyping && (
            <Box display="flex" alignItems="center">
              <AvatarContainer role="assistant" theme={theme}>
                <Avatar src="/assistant-avatar.png" alt="Assistant" />
              </AvatarContainer>
              <MessageBubble
                role="assistant"
                theme={theme}
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
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
          {assistantTyping && (
            <Box display="flex" alignItems="center">
              <AvatarContainer role="user" theme={theme}>
                <Avatar src="/user-avatar.png" alt={username} />
              </AvatarContainer>
              <MessageBubble
                role="user"
                theme={theme}
                component={motion.div}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
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
            label={isEditingMessage !== null ? "Edit your message" : "Type a message"}
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                isEditingMessage !== null ? handleSaveEditedMessage() : sendMessage();
              }
            }}
            InputLabelProps={{
              style: { color: theme === 'dark' ? '#fff' : '#000' },
            }}
            sx={{
              input: { color: theme === 'dark' ? '#fff' : '#000' },
              label: { color: theme === 'dark' ? '#fff' : '#000' },
            }}
          />
          <SendButton
            onClick={isEditingMessage !== null ? handleSaveEditedMessage : sendMessage}
            theme={theme}
            variant="contained"
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            sx={{ minWidth: '80px' }}
          >
            {isEditingMessage !== null ? "Save" : "Send"}
          </SendButton>
          <Tooltip title="Add Reaction">
            <IconButton onClick={handleReactionClick}>
              <EmojiEmotionsIcon color="inherit" />
            </IconButton>
          </Tooltip>
        </Stack>
      </ChatContainer>

      <Menu
        anchorEl={reactionAnchorEl}
        open={Boolean(reactionAnchorEl)}
        onClose={handleReactionClose}
      >
        <MenuItem onClick={() => handleReactionSelect('👍')}>
          <ThumbUpAltIcon /> Thumbs Up
        </MenuItem>
        <MenuItem onClick={() => handleReactionSelect('😊')}>
          <MoodIcon /> Smile
        </MenuItem>
        <MenuItem onClick={() => handleReactionSelect('😄')}>
          <SentimentSatisfiedAltIcon /> Grin
        </MenuItem>
        {/* Add more reactions here */}
      </Menu>

      {/* Profile settings dialog */}
      <Dialog open={openProfileSettings} onClose={handleCloseProfileSettings}>
        <DialogTitle>Profile Settings</DialogTitle>
        <DialogContent>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Typography gutterBottom>Bubble Color</Typography>
          <Slider
            value={bubbleColor}
            onChange={(e, newValue) => setBubbleColor(newValue)}
            aria-labelledby="bubble-color-slider"
            step={1}
            min={0}
            max={255}
            valueLabelDisplay="auto"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProfileSettings} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
