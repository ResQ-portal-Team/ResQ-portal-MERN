// Store message counts per user
const userMessageCounts = new Map(); // userId -> { count, resetTime }

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of userMessageCounts.entries()) {
    if (now > data.resetTime) {
      userMessageCounts.delete(userId);
    }
  }
}, 3600000); // 1 hour

/**
 * Check if user is within rate limit
 * @param {string} userId - User ID
 * @param {number} maxMessages - Max messages allowed in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} { allowed, remaining, resetTime }
 */
const checkRateLimit = (userId, maxMessages = 10, windowMs = 60000) => {
  const now = Date.now();
  const userData = userMessageCounts.get(userId);
  
  // First message from this user
  if (!userData) {
    userMessageCounts.set(userId, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxMessages - 1, resetTime: now + windowMs };
  }
  
  // Check if window has expired
  if (now > userData.resetTime) {
    // Reset counter
    userMessageCounts.set(userId, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true, remaining: maxMessages - 1, resetTime: now + windowMs };
  }
  
  // Check if user exceeded limit
  if (userData.count >= maxMessages) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetTime: userData.resetTime,
      message: `Too many messages. Please wait ${Math.ceil((userData.resetTime - now) / 1000)} seconds.`
    };
  }
  
  // Increment count
  userData.count++;
  userMessageCounts.set(userId, userData);
  
  return { 
    allowed: true, 
    remaining: maxMessages - userData.count, 
    resetTime: userData.resetTime 
  };
};

// Get user's current rate limit status
const getRateLimitStatus = (userId, maxMessages = 10, windowMs = 60000) => {
  const now = Date.now();
  const userData = userMessageCounts.get(userId);
  
  if (!userData || now > userData.resetTime) {
    return { remaining: maxMessages, resetTime: now + windowMs };
  }
  
  return {
    remaining: Math.max(0, maxMessages - userData.count),
    resetTime: userData.resetTime
  };
};

module.exports = { checkRateLimit, getRateLimitStatus };