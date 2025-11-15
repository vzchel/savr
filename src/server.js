const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory database (replace with MongoDB/PostgreSQL in production)
let users = {};
let fridgeItems = {};
let surplusListings = [
  { 
    id: 1, 
    type: 'dining', 
    location: 'Willard Straight Hall', 
    item: 'Leftover pizza', 
    quantity: '6 slices', 
    time: new Date().toISOString(), 
    available: true, 
    contact: 'dining@cornell.edu',
    userId: 'system'
  },
  { 
    id: 2, 
    type: 'dining', 
    location: 'Trillium', 
    item: 'Bagels & cream cheese', 
    quantity: '12 bagels', 
    time: new Date().toISOString(), 
    available: true, 
    contact: 'dining@cornell.edu',
    userId: 'system'
  },
  { 
    id: 3, 
    type: 'restaurant', 
    location: 'Collegetown Bagels', 
    item: 'Day-old bagels', 
    quantity: '20 bagels', 
    time: new Date().toISOString(), 
    available: true, 
    contact: '(607) 273-0982',
    userId: 'system'
  }
];

let recipeHistory = {};
let mealPlans = {};

// Helper function to get time ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}

// ==================== USER ROUTES ====================

// Get or create user session
app.post('/api/users/session', (req, res) => {
  const { userId } = req.body;
  
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      createdAt: new Date().toISOString(),
      calorieGoal: 2000,
      consumedCalories: 0
    };
    fridgeItems[userId] = [];
    recipeHistory[userId] = [];
    mealPlans[userId] = null;
  }
  
  res.json({ user: users[userId] });
});

// Update user preferences
app.put('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const { calorieGoal, consumedCalories } = req.body;
  
  if (!users[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (calorieGoal !== undefined) users[userId].calorieGoal = calorieGoal;
  if (consumedCalories !== undefined) users[userId].consumedCalories = consumedCalories;
  
  res.json({ user: users[userId] });
});

// ==================== FRIDGE ROUTES ====================

// Get all fridge items for a user
app.get('/api/fridge/:userId', (req, res) => {
  const { userId } = req.params;
  
  if (!fridgeItems[userId]) {
    fridgeItems[userId] = [];
  }
  
  res.json({ items: fridgeItems[userId] });
});

// Add item to fridge
app.post('/api/fridge/:userId', (req, res) => {
  const { userId } = req.params;
  const { name, expiry, quantity, unit } = req.body;
  
  if (!name || !expiry || !quantity || !unit) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!fridgeItems[userId]) {
    fridgeItems[userId] = [];
  }
  
  const newItem = {
    id: Date.now(),
    name,
    expiry,
    quantity: parseFloat(quantity),
    unit,
    category: 'other',
    addedAt: new Date().toISOString()
  };
  
  fridgeItems[userId].push(newItem);
  
  res.json({ item: newItem });
});

// Update fridge item
app.put('/api/fridge/:userId/:itemId', (req, res) => {
  const { userId, itemId } = req.params;
  const { quantity } = req.body;
  
  if (!fridgeItems[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const itemIndex = fridgeItems[userId].findIndex(item => item.id === parseInt(itemId));
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  fridgeItems[userId][itemIndex].quantity = parseFloat(quantity);
  
  res.json({ item: fridgeItems[userId][itemIndex] });
});

// Delete fridge item
app.delete('/api/fridge/:userId/:itemId', (req, res) => {
  const { userId, itemId } = req.params;
  
  if (!fridgeItems[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  fridgeItems[userId] = fridgeItems[userId].filter(item => item.id !== parseInt(itemId));
  
  res.json({ success: true });
});

// Batch update fridge (for recipe cooking)
app.post('/api/fridge/:userId/batch-update', (req, res) => {
  const { userId } = req.params;
  const { updates } = req.body; // Array of { itemName, quantityUsed }
  
  if (!fridgeItems[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  updates.forEach(update => {
    const itemIndex = fridgeItems[userId].findIndex(
      item => item.name.toLowerCase() === update.itemName.toLowerCase()
    );
    
    if (itemIndex !== -1) {
      const currentQty = fridgeItems[userId][itemIndex].quantity;
      const newQty = currentQty - update.quantityUsed;
      
      if (newQty <= 0) {
        fridgeItems[userId].splice(itemIndex, 1);
      } else {
        fridgeItems[userId][itemIndex].quantity = newQty;
      }
    }
  });
  
  res.json({ items: fridgeItems[userId] });
});

// ==================== RECIPE ROUTES ====================

// Generate recipes using Claude API
app.post('/api/recipes/generate/:userId', async (req, res) => {
  const { userId } = req.params;
  
  if (!fridgeItems[userId] || fridgeItems[userId].length === 0) {
    return res.status(400).json({ error: 'No items in fridge' });
  }
  
  const availableItems = fridgeItems[userId]
    .map(item => `${item.name} (${item.quantity} ${item.unit})`)
    .join(', ');
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          { 
            role: "user", 
            content: `I have these ingredients in my fridge: ${availableItems}

Generate 3 creative recipes using ONLY these ingredients (you can assume basic pantry items like salt, pepper, oil).

CRITICAL: Each recipe MUST use ingredients from my fridge. Calculate realistic quantities needed.

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Recipe name",
    "time": "25",
    "servings": 2,
    "calories": 450,
    "ingredients": [
      {"name": "ingredient name", "quantity": 1, "unit": "pieces"}
    ],
    "instructions": [
      "Step 1 with detailed instructions on temperature, timing, and technique",
      "Step 2 with specific measurements and cooking methods",
      "Step 3 with plating or serving suggestions"
    ],
    "nutritionalFacts": {
      "protein": "25",
      "carbs": "40",
      "fat": "15",
      "fiber": "8"
    }
  }
]`
          }
        ],
      })
    });
    
    const data = await response.json();
    const text = data.content.map(i => i.text || "").join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    const recipes = JSON.parse(clean);
    
    // Store in history
    if (!recipeHistory[userId]) {
      recipeHistory[userId] = [];
    }
    recipeHistory[userId].push({
      timestamp: new Date().toISOString(),
      recipes
    });
    
    res.json({ recipes });
  } catch (error) {
    console.error('Error generating recipes:', error);
    res.status(500).json({ error: 'Failed to generate recipes' });
  }
});

// Get recipe history
app.get('/api/recipes/history/:userId', (req, res) => {
  const { userId } = req.params;
  
  if (!recipeHistory[userId]) {
    recipeHistory[userId] = [];
  }
  
  res.json({ history: recipeHistory[userId] });
});

// ==================== MEAL PLAN ROUTES ====================

// Generate meal plan using Claude API
app.post('/api/mealplan/generate/:userId', async (req, res) => {
  const { userId } = req.params;
  const { calorieGoal } = req.body;
  
  if (!fridgeItems[userId] || fridgeItems[userId].length === 0) {
    return res.status(400).json({ error: 'No items in fridge' });
  }
  
  const allItems = fridgeItems[userId]
    .map(item => `${item.name} (${item.quantity} ${item.unit}, expires ${item.expiry})`)
    .join(', ');
  
  const userCalorieGoal = calorieGoal || users[userId]?.calorieGoal || 2000;
  
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        messages: [
          { 
            role: "user", 
            content: `Create a 3-day meal plan using ONLY these ingredients: ${allItems}

Prioritize items expiring soonest. Target ${userCalorieGoal} calories per day.

Return ONLY a JSON object:
{
  "days": [
    {
      "day": 1,
      "meals": {
        "breakfast": {
          "name": "meal name",
          "calories": 400,
          "instructions": [
            "Detailed step 1 with cooking temperatures and times",
            "Detailed step 2 with specific techniques",
            "Detailed step 3 with serving suggestions"
          ],
          "ingredients": [{"name": "item", "quantity": 1, "unit": "pieces"}],
          "nutritionalFacts": {"protein": "20", "carbs": "30", "fat": "15"}
        },
        "lunch": {
          "name": "meal name",
          "calories": 500,
          "instructions": ["detailed step 1", "detailed step 2"],
          "ingredients": [{"name": "item", "quantity": 1, "unit": "pieces"}],
          "nutritionalFacts": {"protein": "25", "carbs": "40", "fat": "18"}
        },
        "dinner": {
          "name": "meal name",
          "calories": 600,
          "instructions": ["detailed step 1", "detailed step 2"],
          "ingredients": [{"name": "item", "quantity": 1, "unit": "pieces"}],
          "nutritionalFacts": {"protein": "30", "carbs": "45", "fat": "20"}
        }
      },
      "totalCalories": 1500
    }
  ],
  "wasteReduction": "85%",
  "missingIngredients": ["item1 if needed", "item2 if needed"]
}`
          }
        ],
      })
    });
    
    const data = await response.json();
    const text = data.content.map(i => i.text || "").join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    const mealPlan = JSON.parse(clean);
    
    // Store meal plan
    mealPlans[userId] = {
      ...mealPlan,
      createdAt: new Date().toISOString()
    };
    
    res.json({ mealPlan: mealPlans[userId] });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

// Get current meal plan
app.get('/api/mealplan/:userId', (req, res) => {
  const { userId } = req.params;
  
  res.json({ mealPlan: mealPlans[userId] || null });
});

// ==================== SURPLUS FOOD ROUTES ====================

// Get all surplus listings
app.get('/api/surplus', (req, res) => {
  const listings = surplusListings.map(listing => ({
    ...listing,
    time: getTimeAgo(listing.time)
  }));
  
  res.json({ listings });
});

// Create new surplus listing
app.post('/api/surplus', (req, res) => {
  const { userId, type, location, item, quantity, contact } = req.body;
  
  if (!type || !location || !item || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newListing = {
    id: Date.now(),
    userId: userId || 'anonymous',
    type,
    location,
    item,
    quantity,
    contact: contact || 'Contact via app',
    time: new Date().toISOString(),
    available: true
  };
  
  surplusListings.push(newListing);
  
  res.json({ listing: newListing });
});

// Claim surplus listing
app.post('/api/surplus/:listingId/claim', (req, res) => {
  const { listingId } = req.params;
  const { userId } = req.body;
  
  const listing = surplusListings.find(l => l.id === parseInt(listingId));
  
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  
  if (!listing.available) {
    return res.status(400).json({ error: 'Listing already claimed' });
  }
  
  listing.available = false;
  listing.claimedBy = userId;
  listing.claimedAt = new Date().toISOString();
  
  res.json({ listing });
});

// Delete surplus listing
app.delete('/api/surplus/:listingId', (req, res) => {
  const { listingId } = req.params;
  
  surplusListings = surplusListings.filter(l => l.id !== parseInt(listingId));
  
  res.json({ success: true });
});

// ==================== ANALYTICS ROUTES ====================

// Get user statistics
app.get('/api/analytics/:userId', (req, res) => {
  const { userId } = req.params;
  
  const stats = {
    totalItems: fridgeItems[userId]?.length || 0,
    expiringItems: fridgeItems[userId]?.filter(item => {
      const daysLeft = Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 3;
    }).length || 0,
    recipesGenerated: recipeHistory[userId]?.length || 0,
    mealPlansCreated: mealPlans[userId] ? 1 : 0,
    calorieProgress: {
      consumed: users[userId]?.consumedCalories || 0,
      goal: users[userId]?.calorieGoal || 2000
    }
  };
  
  res.json({ stats });
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    users: Object.keys(users).length,
    totalFridgeItems: Object.values(fridgeItems).reduce((sum, items) => sum + items.length, 0),
    surplusListings: surplusListings.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Savr backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;