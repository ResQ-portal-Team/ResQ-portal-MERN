// Bad words list (Sinhala + English)
const badWords = [
  // English bad words
  'stupid', 'idiot', 'dumb', 'fool', 'crazy', 'hate', 'kill',
  'stupid', 'idiot', 'dumb', 'fool', 'crazy', 'hate', 'kill',
  'shit', 'damn', 'crap', 'hell',
  
  // Sinhala bad words (common)
  'හොරා', 'බොල', 'හරක්', 'ගොනා', 'මෝඩයා',
  'අම්මගෙ', 'තාත්තගෙ', 'කෑල්ල', 
];

// Filter profanity from text
const filterProfanity = (text) => {
  if (!text) return text;
  
  let filtered = text;
  badWords.forEach(word => {
    // Case insensitive regex
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
};

// Check if text contains profanity
const containsProfanity = (text) => {
  if (!text) return false;
  
  return badWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  });
};

module.exports = { filterProfanity, containsProfanity, badWords };