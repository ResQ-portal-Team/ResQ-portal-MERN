// Bad words list (English + Sinhala + Singlish)
const badWords = [
  // ========== ENGLISH BAD WORDS ==========
  'stupid', 'idiot', 'dumb', 'fool', 'crazy', 'hate', 'kill',
  'shit', 'damn', 'crap', 'hell', 'fuck', 'ass', 'bitch', 'bastard',
  'wtf', 'stfu', 'gtfo', 'fck', 'fuk', 'damm',
  
  // ========== SINHALA BAD WORDS (Unicode) ==========
  'හොරා', 'බොල', 'හරක', 'ගොනා', 'මෝඩයා', 'අම්මගෙ', 'තාත්තගෙ',
  'කෑල්ල', 'මරු', 'කාපන්',
  
  // ========== SINGLISH BAD WORDS (Sinhala in English letters) ==========
  // Insults
  'hora', 'bola', 'haraka', 'gona', 'modaya', 'moda',
  'pissu', 'pissa', 'wandam', 'wandata', 'kudu', 'kudda', 
  'balla', 'balleya',  'ganna', 'kapan', 'kapanna','buruwa','balla', 
  
  // Swear words
  
  'puk', 'puka', 'uka', 'ahang', 
  
  // Common bad phrases
  'wara', 'pala', 'gahanawa', 'gahapan', 'tho', 'thota', 'gothaya', 
];

// Filter profanity from text - Improved version
const filterProfanity = (text) => {
  if (!text) return text;
  
  let filtered = text;
  let replaced = false;
  
  // Method 1: Replace exact word matches with word boundaries
  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const newText = filtered.replace(regex, (match) => {
      replaced = true;
      console.log(`🔍 Filtered word: "${match}" → "***"`);
      return '***';
    });
    filtered = newText;
  });
  
  // Method 2: Also replace words that appear as substrings (for cases like "idiot" inside text)
  // Only for words longer than 3 characters
  const longWords = badWords.filter(word => word.length >= 3);
  longWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    if (regex.test(filtered)) {
      filtered = filtered.replace(regex, (match) => {
        replaced = true;
        console.log(`🔍 Filtered substring: "${match}" → "***"`);
        return '***';
      });
    }
  });
  
  if (replaced) {
    console.log(`📨 Filtered message result: "${filtered}"`);
  }
  
  return filtered;
};

// Check if text contains profanity
const containsProfanity = (text) => {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Check whole word matches
  for (const word of badWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerText)) return true;
  }
  
  // Check substrings for longer words
  for (const word of badWords) {
    if (word.length >= 3 && lowerText.includes(word)) return true;
  }
  
  return false;
};

// Get profanity level
const getProfanityLevel = (text) => {
  if (!text) return 'none';
  
  const mildWords = ['stupid', 'dumb', 'fool', 'crazy', 'modaya', 'bola', 'payya'];
  const severeWords = ['fuck', 'shit', 'bitch', 'hora', 'puk', 'kanawa', 'maru', 'choo'];
  
  const lowerText = text.toLowerCase();
  
  for (const word of severeWords) {
    if (lowerText.includes(word)) return 'severe';
  }
  
  for (const word of mildWords) {
    if (lowerText.includes(word)) return 'moderate';
  }
  
  return containsProfanity(text) ? 'mild' : 'none';
};

module.exports = { 
  filterProfanity, 
  containsProfanity, 
  getProfanityLevel,
  badWords 
};