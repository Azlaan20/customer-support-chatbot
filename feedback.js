import { useState } from 'react';
import { Box, Button, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Rating, Alert } from '@mui/material';
import { styled } from '@mui/system';
import { db } from '../firebase'; // Import your Firestore database from Firebase
import { addDoc, collection } from 'firebase/firestore';

// Custom Styled Components for Enhanced Aesthetics
const FeedbackButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme === 'dark' ? '#575fcf' : '#575fcf',
  color: '#fff',
  '&:hover': {
    backgroundColor: theme === 'dark' ? '#4e54c8' : '#4e54c8',
  },
}));

const FeedbackDialog = styled(Dialog)(({ theme }) => ({
  '.MuiDialog-paper': {
    backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : '#fff',
    color: theme === 'dark' ? '#fff' : '#000',
  },
}));

export default function Feedback({ open, handleClose, theme }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please provide a rating.');
      return;
    }

    try {
      await addDoc(collection(db, 'feedback'), {
        rating,
        comments,
        timestamp: new Date(),
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
        setSuccess(false);
        setRating(0);
        setComments('');
      }, 2000); // Close dialog after 2 seconds
    } catch (error) {
      setError('Failed to submit feedback. Please try again later.');
    }
  };

  return (
    <FeedbackDialog open={open} onClose={handleClose}>
      <DialogTitle>Submit Feedback</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h6">Rate your experience</Typography>
          <Rating
            name="rating"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
              setError('');
            }}
            sx={{ fontSize: '2rem', marginBottom: '10px', color: theme === 'dark' ? '#ffeb3b' : '#ff5722' }}
          />
          <TextField
            label="Additional Comments"
            fullWidth
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            sx={{
              marginTop: '10px',
              backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              input: { color: theme === 'dark' ? '#fff' : '#000' },
            }}
          />
          {error && <Alert severity="error" sx={{ marginTop: '10px' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ marginTop: '10px' }}>Feedback submitted successfully!</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Cancel</Button>
        <FeedbackButton onClick={handleSubmit}>Submit</FeedbackButton>
      </DialogActions>
    </FeedbackDialog>
  );
}
