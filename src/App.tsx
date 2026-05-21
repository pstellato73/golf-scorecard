import { useState, useEffect } from 'react';

// Inside your main component:
const [scores, setScores] = useState(() => {
  const savedScores = localStorage.getItem('current_round');
  return savedScores ? JSON.parse(savedScores) : {}; // Default empty scorecard structure
});

// Automatically save to the phone's storage whenever scores change
useEffect(() => {
  localStorage.setItem('current_round', JSON.stringify(scores));
}, [scores]);