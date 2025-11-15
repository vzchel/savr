# Savr: AI Foodwaste Prevention App for Cornell and Beyond

## Project Overview

Savr is an AI-powered app that prevents food waste through inventory management, Claude-generated recipes from items in your fridge, real-time surplus food sharing from dining halls and restaurants, calorie tracking, and a waste prevention counter. Track your fridge with image recognition or manual entry, get personalized meal plans that use expiring items first, claim surplus food that auto-adds to your inventory, and see exactly how many pounds of waste you've prevented. 

## Installation/Setup Instructions

You need:
- Node.js 16+ and npm
- Claude API access (provided via hackathon credits)

Running it locally: 
1. Clone the repository:
```bash
git clone https://github.com/vzchel/savr.git
cd savr
```

2. Install dependencies:
```bash
npm install react react-dom lucide-react
```

3. The Claude API is already integrated - no API key needed in artifacts!

4. Run the development server:
```bash
npm start
```

5. Open http://localhost:3000 in your browser

## Usage Guide

Getting Started: Open the app and you'll land on the "My Fridge" tab with an empty inventory. Start by either uploading a photo of your fridge (the app will identify items automatically) or manually adding items by searching and selecting from the dropdown menu. Specify quantities with unit options (grams, lbs, kg, servings) and set expiration dates.

Smart Recipes: Once you have items in your fridge, head to the "Smart Recipes" tab to see AI-generated recipes using only what you have, sorted by expiration urgency. Click any recipe to see detailed cooking instructions, nutritional facts, and ingredient quantities. Clicking "Cook This" will automatically deduct used items from your fridge inventory.

Meal Planning: Go to the "Meal Plan" tab to generate a 3-day optimized meal plan that strategically uses expiring items first. Each meal is clickable to view full instructions and nutritional breakdowns, and you can cook meals directly from the plan, which updates your fridge automatically.

Surplus Food: Check the "Surplus Food" tab to browse real-time listings from Cornell dining halls, local restaurants, and other Savr users. When you find something you want, click "Claim" and it auto-adds to your fridge. You can manually set the expiration date if needed. Post your own surplus by clicking "Share Your Food" and filling in quick details like location, item type, and how long it's available.

Nutrition & Impact: Set your dietary restrictions in the "Preferences" tab (allergies, dietary needs), then use the "Calorie Calculator" to input your height, weight, age, sex, and activity level to get personalized daily calorie recommendations. Track your waste prevention progress in the "Impact" tab to see how many pounds of food you've saved and celebrate milestones.

## Tech Stack

Frontend: React, Tailwind CSS, Lucide Icons
AI Integration: Claude Sonnet 4 API, Grok 4 API
Development: JavaScript ES6+, Modern Hooks
Deployment: GitHub Pages

##Claude API Integration

First, the AI Recipe Generator uses Claude to analyze your fridge inventory and generate creative, personalized recipes using only the items you currently have, Claude understands ingredient combinations, dietary restrictions, cooking skill levels, and dorm kitchen constraints to produce recipes you'd actually want to make. Second, the Meal Planning feature uses Claude to intelligently sequence meals across 3 days, prioritizing items expiring soonest so nothing goes to waste while ensuring nutritionally balanced meals. Third, we use Claude Vision to identify ingredients from fridge photos. when you upload an image, Claude analyzes it and extracts a list of identified items with quantities, which then populates your inventory. All Claude responses are structured as JSON, allowing recipe suggestions, meal plans, and ingredient lists to flow directly into the app's UI without additional processing

## Challenges & Solutions

Challenge 1: Computer Vision Image Recognition Accuracy
Problem: The fridge image upload feature was identifying items incorrectly (always returning "apples and milk" regardless of actual contents), and uploading a new image wasn't clearing previous identifications.
Solution: Retrained the Claude Vision prompts with more specific item identification guidelines and implemented a state reset function that clears previous items before processing new uploads. We also added a confirmation popup where users can manually verify and edit identified items before saving to fridge.

Challenge 2: Bulk Item Storage to Fridge
Problem: When items were identified from fridge photos, only one item was being saved to "My Fridge" instead of all identified items.
Solution: Refactored the backend storage logic to batch-process all identified items and save them as an array to the fridge inventory. Implemented proper error handling to ensure each item with its quantity and expiration date is individually stored.

Challenge 3: Dynamic Meal Plan Generation
Problem: The meal plan feature wasn't generating recipes based on current fridge inventory—it was showing generic meals unrelated to available items, and the shopping cart wasn't suggesting items actually needed.
Solution: Rebuilt the meal plan algorithm to first query current fridge contents, then pass that inventory to Claude for generation. Implemented logic that identifies missing ingredients and automatically populates the shopping cart with only items not currently in the fridge.

Challenge 4: Surplus Food Social Media Integration
Problem: The surplus food feed was only displaying "leftover bagels from Trillium" with no variety in items or locations, making the feature feel static and unrealistic.
Solution: Expanded the social media tracking keywords to include 50+ common food surplus terms (discount, leftover, free, available, expires, etc.) and integrated multiple dining hall accounts (Morrison, Okenshields, Becker, Willard Straight, etc.) plus local restaurant partners. Added dynamic location tags and item variety to make the feed feel authentic and useful.


## Future Plans

In the short-term, we're fixing the remaining bugs with image recognition accuracy, completing the meal plan generation to work with current fridge items, and getting the share surplus button fully functional so the community features actually work seamlessly. Looking ahead over the next few months, we plan to partner with Cornell Dining Services to share anonymized surplus data so they can optimize what they prepare and reduce waste at the source, while integrating with Cornell's meal plan system so students see dining menus in-app and get recipe suggestions that complement daily offerings. We're also exploring barcode scanning for faster item entry and working with local food banks to create a donation system for unclaimed surplus food. To build community engagement, we'll add dorm-level waste prevention competitions with sustainability incentives through Residential Life partnerships and create an API for student sustainability organizations to embed Savr into their platforms. 

## Team Members & Contributions

Vachel Ng - Built the React component using CSS, Implemented Smart Fridge Inventory interface, Designed the Surplus Food tank UI and user interactions, Made the waste prevention counter

Oishik Chakraborty - Developed backend infrastructure for data storage, integrated Claude API for recipe regeneration and meal planning, and Implemented calorie calculation

Matthew Wang - Implemented the image recognition using Claude vision, built the dietary restriction system, and developed the surplus food social media tracking system
