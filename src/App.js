import React, { useState, useEffect } from 'react';
import { Camera, Plus, Trash2, Clock, Users, AlertCircle, ChefHat, Calendar, MapPin, X, ShoppingCart, Search, Info } from 'lucide-react';

const SavrApp = () => {
  const [activeTab, setActiveTab] = useState('fridge');
  const [fridgeItems, setFridgeItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', expiry: '', quantity: '', unit: 'pieces' });
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [surplusListings, setSurplusListings] = useState([
    { id: 1, type: 'dining', location: 'Willard Straight Hall', item: 'Leftover pizza', quantity: '6 slices', time: '30 mins ago', available: true, contact: 'dining@cornell.edu' },
    { id: 2, type: 'dining', location: 'Trillium', item: 'Bagels & cream cheese', quantity: '12 bagels', time: '1 hour ago', available: true, contact: 'dining@cornell.edu' },
    { id: 3, type: 'restaurant', location: 'Collegetown Bagels', item: 'Day-old bagels', quantity: '20 bagels', time: '2 hours ago', available: true, contact: '(607) 273-0982' },
    { id: 4, type: 'student', location: 'North Campus', item: 'Unopened cereal box', quantity: '1 box', time: '3 hours ago', available: true, contact: 'Share via app' }
  ]);
  const [mealPlan, setMealPlan] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedSurplus, setSelectedSurplus] = useState(null);
  const [shoppingList, setShoppingList] = useState([]);
  const [showShoppingCart, setShowShoppingCart] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [consumedCalories, setConsumedCalories] = useState(0);

  const commonItems = [
    'Milk', 'Eggs', 'Bread', 'Cheese', 'Chicken Breast', 'Ground Beef', 'Salmon',
    'Spinach', 'Tomatoes', 'Lettuce', 'Carrots', 'Broccoli', 'Onions', 'Garlic',
    'Rice', 'Pasta', 'Potatoes', 'Yogurt', 'Butter', 'Olive Oil', 'Bananas',
    'Apples', 'Oranges', 'Strawberries', 'Bell Peppers', 'Mushrooms', 'Cucumber'
  ];

  const units = ['pieces', 'grams', 'kg', 'lbs', 'oz', 'servings', 'cups', 'tbsp', 'tsp', 'ml', 'L'];

  const filteredItems = searchQuery.length >= 2
    ? commonItems.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date('2025-11-15');
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (days) => {
    if (days <= 1) return 'bg-red-100 border-red-300 text-red-800';
    if (days <= 3) return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-green-100 border-green-300 text-green-800';
  };

  const addItem = () => {
    if (newItem.name && newItem.expiry && newItem.quantity) {
      setFridgeItems([...fridgeItems, { 
        ...newItem, 
        id: Date.now(), 
        category: 'other',
        quantity: parseFloat(newItem.quantity)
      }]);
      setNewItem({ name: '', expiry: '', quantity: '', unit: 'pieces' });
      setSearchQuery('');
    }
  };

  const deleteItem = (id) => {
    setFridgeItems(fridgeItems.filter(item => item.id !== id));
  };

  const deductIngredients = (recipeIngredients) => {
    const updatedFridge = [...fridgeItems];
    
    recipeIngredients.forEach(ingredient => {
      const itemIndex = updatedFridge.findIndex(
        item => item.name.toLowerCase() === ingredient.name.toLowerCase()
      );
      
      if (itemIndex !== -1) {
        const currentQty = updatedFridge[itemIndex].quantity;
        const usedQty = ingredient.quantity;
        
        if (currentQty <= usedQty) {
          updatedFridge.splice(itemIndex, 1);
        } else {
          updatedFridge[itemIndex].quantity = currentQty - usedQty;
        }
      }
    });
    
    setFridgeItems(updatedFridge);
  };

  const generateRecipes = async () => {
    if (fridgeItems.length === 0) {
      alert('Please add items to your fridge first!');
      return;
    }

    setLoadingRecipes(true);
    
    const availableItems = fridgeItems.map(item => 
      `${item.name} (${item.quantity} ${item.unit})`
    ).join(', ');

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
      "Step 1 detailed instruction",
      "Step 2 detailed instruction"
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
      const parsed = JSON.parse(clean);
      setRecipes(parsed);
    } catch (err) {
      console.error("Error generating recipes:", err);
      setRecipes([
        {
          title: "Quick Fridge Medley",
          time: "20",
          servings: 2,
          calories: 400,
          ingredients: [
            {name: "Eggs", quantity: 2, unit: "pieces"},
            {name: "Cheese", quantity: 50, unit: "grams"}
          ],
          instructions: [
            "Heat a non-stick pan over medium heat",
            "Crack eggs into the pan and cook until whites are set",
            "Sprinkle cheese on top and cover until melted",
            "Season with salt and pepper to taste"
          ],
          nutritionalFacts: {
            protein: "20",
            carbs: "5",
            fat: "25",
            fiber: "0"
          }
        }
      ]);
    }
    
    setLoadingRecipes(false);
  };

  const generateMealPlan = async () => {
    if (fridgeItems.length === 0) {
      alert('Please add items to your fridge first!');
      return;
    }

    const allItems = fridgeItems.map(item => 
      `${item.name} (${item.quantity} ${item.unit}, expires ${item.expiry})`
    ).join(', ');
    
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
              content: `Create a 3-day meal plan using ONLY these ingredients: ${allItems}

Prioritize items expiring soonest. Target ${calorieGoal} calories per day.

Return ONLY a JSON object:
{
  "days": [
    {
      "day": 1,
      "meals": {
        "breakfast": {
          "name": "meal name",
          "calories": 400,
          "instructions": ["step 1", "step 2"],
          "ingredients": [{"name": "item", "quantity": 1, "unit": "pieces"}],
          "nutritionalFacts": {"protein": "20", "carbs": "30", "fat": "15"}
        },
        "lunch": {
          "name": "meal name",
          "calories": 500,
          "instructions": ["step 1"],
          "ingredients": [{"name": "item", "quantity": 1, "unit": "pieces"}],
          "nutritionalFacts": {"protein": "25", "carbs": "40", "fat": "18"}
        },
        "dinner": {
          "name": "meal name",
          "calories": 600,
          "instructions": ["step 1"],
          "ingredients": [{"name": "item", "quantity": 1, "unit": "pieces"}],
          "nutritionalFacts": {"protein": "30", "carbs": "45", "fat": "20"}
        }
      },
      "totalCalories": 1500
    }
  ],
  "wasteReduction": "85%",
  "missingIngredients": []
}`
            }
          ],
        })
      });

      const data = await response.json();
      const text = data.content.map(i => i.text || "").join("\n");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setMealPlan(parsed);
      
      if (parsed.missingIngredients && parsed.missingIngredients.length > 0) {
        setShoppingList(parsed.missingIngredients);
      }
    } catch (err) {
      console.error("Error generating meal plan:", err);
    }
  };

  const cookRecipe = (recipe) => {
    deductIngredients(recipe.ingredients);
    setConsumedCalories(prev => prev + recipe.calories);
    setSelectedRecipe(null);
    alert(`Recipe cooked! ${recipe.calories} calories added to your daily intake.`);
  };

  const cookMeal = (meal) => {
    deductIngredients(meal.ingredients);
    setConsumedCalories(prev => prev + meal.calories);
    setSelectedMeal(null);
    alert(`Meal prepared! ${meal.calories} calories added to your daily intake.`);
  };

  const sortedItems = [...fridgeItems].sort((a, b) => 
    getDaysUntilExpiry(a.expiry) - getDaysUntilExpiry(b.expiry)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ChefHat className="w-12 h-12 text-emerald-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Savr
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Smart Food Management & Waste Prevention</p>
          
          {/* Calorie Tracker */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">Daily Calories</span>
                <span className="text-sm text-gray-500">Goal: {calorieGoal}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-4 rounded-full transition-all"
                  style={{ width: `${Math.min((consumedCalories / calorieGoal) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-right mt-1 text-sm text-gray-600">
                {consumedCalories} / {calorieGoal} cal
              </div>
            </div>
          </div>

          {fridgeItems.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full">
              <AlertCircle className="w-5 h-5 text-emerald-700" />
              <span className="text-emerald-800 font-medium">
                {fridgeItems.filter(item => getDaysUntilExpiry(item.expiry) <= 1).length} items expiring soon!
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-2 shadow-md overflow-x-auto">
          <button
            onClick={() => setActiveTab('fridge')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'fridge' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            My Fridge
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'recipes' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Smart Recipes
          </button>
          <button
            onClick={() => setActiveTab('surplus')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'surplus' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Surplus Food
          </button>
          <button
            onClick={() => setActiveTab('mealplan')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === 'mealplan' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Meal Plan
          </button>
          <button
            onClick={() => setShowShoppingCart(true)}
            className="flex items-center gap-2 py-3 px-4 rounded-lg font-medium transition-all bg-teal-100 text-teal-700 hover:bg-teal-200 whitespace-nowrap"
          >
            <ShoppingCart className="w-5 h-5" />
            Cart ({shoppingList.length})
          </button>
        </div>

        {/* My Fridge Tab */}
        {activeTab === 'fridge' && (
          <div className="space-y-6">
            {/* Add Item Form */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Food Item</h2>
              <div className="space-y-4">
                {/* Item Name with Autocomplete */}
                <div className="relative">
                  <div className="flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg focus-within:border-emerald-500">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search or type item name..."
                      value={searchQuery || newItem.name}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setNewItem({...newItem, name: e.target.value});
                      }}
                      className="flex-1 outline-none"
                    />
                  </div>
                  {searchQuery.length >= 2 && filteredItems.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredItems.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setNewItem({...newItem, name: item});
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="date"
                    value={newItem.expiry}
                    onChange={(e) => setNewItem({...newItem, expiry: e.target.value})}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    step="0.1"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={addItem}
                  className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Item
                </button>
              </div>
            </div>

            {/* Fridge Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Fridge Inventory</h2>
              {fridgeItems.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Your fridge is empty!</p>
                  <p className="text-gray-400">Add items above to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedItems.map(item => {
                    const daysLeft = getDaysUntilExpiry(item.expiry);
                    return (
                      <div
                        key={item.id}
                        className={`border-2 rounded-lg p-4 flex items-center justify-between ${getUrgencyColor(daysLeft)}`}
                      >
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-sm opacity-80">{item.quantity} {item.unit}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="font-bold">
                                {daysLeft === 0 ? 'Expires today!' : 
                                 daysLeft === 1 ? 'Expires tomorrow' : 
                                 daysLeft < 0 ? 'Expired' :
                                 `${daysLeft} days left`}
                              </span>
                            </div>
                            <p className="text-xs opacity-70">{item.expiry}</p>
                          </div>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Smart Recipes Tab */}
        {activeTab === 'recipes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">AI-Generated Recipes</h2>
              <p className="text-gray-600 mb-6">
                Get detailed recipes using only the ingredients in your fridge
              </p>
              <button
                onClick={generateRecipes}
                disabled={loadingRecipes || fridgeItems.length === 0}
                className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingRecipes ? 'Generating...' : 'Generate Recipes with Claude'}
              </button>
            </div>

            {recipes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recipes.map((recipe, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
                      <h3 className="text-xl font-bold text-white">{recipe.title}</h3>
                      <div className="flex gap-4 text-white text-sm opacity-90 mt-2">
                        <span>⏱️ {recipe.time} min</span>
                        <span>🍽️ {recipe.servings} servings</span>
                        <span>🔥 {recipe.calories} cal</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <button
                        onClick={() => setSelectedRecipe(recipe)}
                        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Info className="w-4 h-4" />
                        View Details & Cook
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Surplus Food Tab */}
        {activeTab === 'surplus' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Available Surplus Food</h2>
              <p className="text-gray-600 mb-6">
                Find surplus from Cornell dining, local restaurants, and community members
              </p>
              
              <div className="space-y-3">
                {surplusListings.map(listing => (
                  <div 
                    key={listing.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all ${
                      listing.available 
                        ? 'border-emerald-200 bg-emerald-50' 
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                    onClick={() => listing.available && setSelectedSurplus(listing)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                          <h3 className="font-bold text-lg text-gray-800">{listing.location}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            listing.type === 'dining' ? 'bg-blue-100 text-blue-700' :
                            listing.type === 'restaurant' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {listing.type === 'dining' ? '🏫 Dining' : 
                             listing.type === 'restaurant' ? '🍽️ Restaurant' : '👤 Student'}
                          </span>
                        </div>
                        <p className="text-gray-700 font-medium mb-1">{listing.item}</p>
                        <p className="text-sm text-gray-600">Quantity: {listing.quantity}</p>
                        <p className="text-sm text-gray-500">Posted {listing.time}</p>
                      </div>
                      <div>
                        {listing.available ? (
                          <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                            Available
                          </span>
                        ) : (
                          <span className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-medium">
                            Claimed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-6 w-full bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium">
                Share Your Surplus Food
              </button>
            </div>
          </div>
        )}

        {/* Meal Plan Tab */}
        {activeTab === 'mealplan' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Smart Meal Planning</h2>
              <p className="text-gray-600 mb-6">
                Generate a 3-day meal plan optimized to use your expiring ingredients
              </p>
              <button
                onClick={generateMealPlan}
                disabled={fridgeItems.length === 0}
                className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Generate Meal Plan with Claude
              </button>
            </div>

            {mealPlan && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg p-6 text-center">
                  <h3 className="text-2xl font-bold mb-2">Estimated Waste Reduction</h3>
                  <p className="text-5xl font-bold">{mealPlan.wasteReduction}</p>
                </div>

                {mealPlan.days && mealPlan.days.map((dayData, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-emerald-600" />
                        Day {dayData.day}
                      </h3>
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-medium">
                        {dayData.totalCalories} cal
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['breakfast', 'lunch', 'dinner'].map(mealType => {
                        const meal = dayData.meals[mealType];
                        return (
                          <div key={mealType} className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-lg">
                            <h4 className="font-bold text-gray-800 mb-2 capitalize">
                              {mealType === 'breakfast' ? '🌅' : mealType === 'lunch' ? '☀️' : '🌙'} {mealType}
                            </h4>
                            <p className="text-gray-700 font-medium mb-2">{meal.name}</p>
                            <p className="text-sm text-gray-600 mb-2">{meal.calories} cal</p>
                            <button
                              onClick={() => setSelectedMeal(meal)}
                              className="w-full bg-emerald-600 text-white py-2 px-3 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipe Detail Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-500 p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedRecipe.title}</h2>
                  <div className="flex gap-4 text-white text-sm">
                    <span>⏱️ {selectedRecipe.time} min</span>
                    <span>🍽️ {selectedRecipe.servings} servings</span>
                    <span>🔥 {selectedRecipe.calories} cal/serving</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Ingredients */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Ingredients</h3>
                  <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                        <span className="text-gray-700">{ing.quantity} {ing.unit} {ing.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Instructions</h3>
                  <div className="space-y-3">
                    {selectedRecipe.instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </span>
                        <p className="text-gray-700 pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nutritional Facts */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Nutritional Facts (per serving)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-700">{selectedRecipe.nutritionalFacts.protein}g</p>
                      <p className="text-sm text-gray-600">Protein</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-700">{selectedRecipe.nutritionalFacts.carbs}g</p>
                      <p className="text-sm text-gray-600">Carbs</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-700">{selectedRecipe.nutritionalFacts.fat}g</p>
                      <p className="text-sm text-gray-600">Fat</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-700">{selectedRecipe.nutritionalFacts.fiber}g</p>
                      <p className="text-sm text-gray-600">Fiber</p>
                    </div>
                  </div>
                </div>

                {/* Cook Button */}
                <button
                  onClick={() => cookRecipe(selectedRecipe)}
                  className="w-full bg-emerald-600 text-white py-4 px-6 rounded-lg hover:bg-emerald-700 transition-colors font-bold text-lg"
                >
                  Cook This Recipe & Update Fridge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Meal Detail Modal */}
        {selectedMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-yellow-500 p-6 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedMeal.name}</h2>
                  <div className="text-white text-sm">
                    <span>🔥 {selectedMeal.calories} cal</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMeal(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Ingredients */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Ingredients</h3>
                  <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                    {selectedMeal.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                        <span className="text-gray-700">{ing.quantity} {ing.unit} {ing.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Instructions</h3>
                  <div className="space-y-3">
                    {selectedMeal.instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </span>
                        <p className="text-gray-700 pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nutritional Facts */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Nutritional Facts</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-700">{selectedMeal.nutritionalFacts.protein}g</p>
                      <p className="text-sm text-gray-600">Protein</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-700">{selectedMeal.nutritionalFacts.carbs}g</p>
                      <p className="text-sm text-gray-600">Carbs</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-700">{selectedMeal.nutritionalFacts.fat}g</p>
                      <p className="text-sm text-gray-600">Fat</p>
                    </div>
                  </div>
                </div>

                {/* Cook Button */}
                <button
                  onClick={() => cookMeal(selectedMeal)}
                  className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg hover:bg-orange-700 transition-colors font-bold text-lg"
                >
                  Prepare This Meal & Update Fridge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Surplus Detail Modal */}
        {selectedSurplus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 flex justify-between items-start rounded-t-xl">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedSurplus.location}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedSurplus.type === 'dining' ? 'bg-blue-100 text-blue-700' :
                    selectedSurplus.type === 'restaurant' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedSurplus.type === 'dining' ? '🏫 Dining Hall' : 
                     selectedSurplus.type === 'restaurant' ? '🍽️ Restaurant' : '👤 Student'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSurplus(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Available Item</h3>
                  <p className="text-2xl font-bold text-emerald-600">{selectedSurplus.item}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Quantity</h3>
                  <p className="text-gray-700">{selectedSurplus.quantity}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Location Details</h3>
                  <p className="text-gray-700">{selectedSurplus.location}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Contact</h3>
                  <p className="text-gray-700">{selectedSurplus.contact}</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Posted</h3>
                  <p className="text-gray-600">{selectedSurplus.time}</p>
                </div>

                <button
                  onClick={() => {
                    alert('Claim request sent! You will receive pickup instructions shortly.');
                    setSelectedSurplus(null);
                  }}
                  className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors font-bold"
                >
                  Claim This Food
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shopping Cart Modal */}
        {showShoppingCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 flex justify-between items-center rounded-t-xl">
                <h2 className="text-2xl font-bold text-white">Shopping List</h2>
                <button
                  onClick={() => setShowShoppingCart(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                {shoppingList.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your shopping list is empty!</p>
                    <p className="text-gray-400 text-sm">Generate a meal plan to see recommended items</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-600 mb-4">Recommended items to complete your meal plan:</p>
                    {shoppingList.map((item, idx) => (
                      <div key={idx} className="bg-teal-50 p-3 rounded-lg flex items-center gap-3">
                        <ShoppingCart className="w-5 h-5 text-teal-600" />
                        <span className="text-gray-800 font-medium">{item}</span>
                      </div>
                    ))}
                    <button className="w-full mt-4 bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors font-bold">
                      Export Shopping List
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavrApp;