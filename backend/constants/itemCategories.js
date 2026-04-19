/**
 * Lost & found item categories (must stay in sync with frontend/src/itemCategories.js).
 */
const ITEM_CATEGORY_GROUPS = [
  {
    label: '📱 Electronics',
    options: [
      'Mobile phones',
      'Laptops',
      'Tablets',
      'Chargers / Power banks',
      'Headphones / Earbuds',
      'USB drives',
    ],
  },
  {
    label: '🪪 Personal Identification',
    options: ['Student ID cards', 'National ID / Passport', 'Driving license', 'Library cards'],
  },
  {
    label: '👕 Clothing & Accessories',
    options: ['Jackets / Hoodies', 'Caps / Hats', 'Shoes / Slippers', 'Watches', 'Glasses / Sunglasses'],
  },
  {
    label: '🎒 Bags & Containers',
    options: ['Backpacks', 'Handbags', 'Laptop bags', 'Lunch boxes', 'Water bottles'],
  },
  {
    label: '📚 Books & Stationery',
    options: ['Textbooks', 'Notebooks', 'Files / Documents', 'Pens / Pencil cases'],
  },
  {
    label: '🔑 Keys & Security Items',
    options: ['Room keys', 'Vehicle keys', 'Keychains', 'Access cards'],
  },
  {
    label: '💳 Money & Valuables',
    options: ['Wallets', 'Cash', 'Debit/Credit cards', 'Jewelry'],
  },
  {
    label: '🧴 Miscellaneous Items',
    options: ['Umbrellas', 'Cosmetics', 'Sports equipment', 'Gadgets (small items not listed)'],
  },
  {
    label: '🚲 Vehicles & Transport',
    options: ['Bicycles', 'Helmets', 'Scooter accessories'],
  },
];

const ALLOWED_ITEM_CATEGORIES = ITEM_CATEGORY_GROUPS.flatMap((g) => g.options);

module.exports = {
  ITEM_CATEGORY_GROUPS,
  ALLOWED_ITEM_CATEGORIES,
};
