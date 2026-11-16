import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Nigerian food descriptions — authentic, short, appetizing
const FOOD_DESCRIPTIONS: Record<string, string> = {
  // Rice dishes
  "jollof rice": "Smoky party-style jollof with rich tomato base and perfectly seasoned long grain rice.",
  "smokey jollof rice": "Wood-fired smoky jollof with intense tomato flavour and a slight char on the bottom.",
  "fried rice": "Nigerian-style fried rice with mixed vegetables, liver, and seasoning.",
  "special fried rice": "Premium fried rice loaded with prawns, chicken, and extra vegetables.",
  "rich jollof rice": "Creamy, flavour-packed jollof made with extra stock, butter, and spices.",
  "asun fried rice": "Spicy peppered goat meat served on a bed of seasoned fried rice.",
  "asun pepper rice": "Fiery peppered goat paired with aromatic long grain rice.",
  "caribbean rice": "Sweet and savoury rice with pineapple, peppers, and island seasoning.",
  "prawn rice": "Seasoned rice topped with succulent jumbo prawns in pepper sauce.",
  "fiesta fried rice": "Colourful party rice with chicken, sausage, and mixed vegetables.",
  "turkey rice": "Herb-seasoned rice served with tender smoked turkey pieces.",
  "spaghetti": "Nigerian-style spaghetti cooked in rich tomato and pepper sauce.",
  "asun spaghetti": "Spicy peppered goat meat tossed with spaghetti in a bold pepper sauce.",

  // Proteins
  "grilled chicken": "Flame-grilled chicken marinated in suya spice and herb seasoning.",
  "peppered chicken": "Tender chicken pieces in a fiery bell pepper and scotch bonnet sauce.",
  "fried chicken": "Crispy golden fried chicken seasoned with Nigerian spices.",
  "chicken suya": "Smoky grilled chicken coated in ground peanut suya spice blend.",
  "peppered turkey": "Succulent smoked turkey in a rich pepper and onion sauce.",
  "peppered goat": "Tender goat meat slow-cooked in spicy pepper sauce.",
  "asun": "Spicy peppered goat meat grilled to perfection with scotch bonnet.",
  "peppered beef": "Slow-cooked beef strips in a bold pepper and tomato sauce.",
  "grilled fish": "Whole tilapia grilled with onions, peppers, and traditional seasoning.",
  "peppered fish": "Catfish cooked in rich pepper sauce with onions and spices.",
  "fried fish": "Crispy deep-fried fish seasoned with salt, pepper, and garlic.",
  "peppered snail": "Giant African snails cooked in spicy pepper sauce with herbs.",
  "suya": "Classic street-style beef suya with ground peanut spice and raw onions.",

  // Soups & swallows
  "egusi soup": "Rich melon seed soup with leafy greens, assorted meat, and stockfish.",
  "efo riro": "Hearty spinach stew with locust beans, assorted meat, and palm oil.",
  "ogbono soup": "Thick draw soup made from ground ogbono seeds with okra and meat.",
  "pepper soup": "Light, spicy broth loaded with meat, fish, or goat and aromatic spices.",
  "afang soup": "Cross River-style soup with afang leaves, waterleaf, and crayfish.",
  "edikaikong": "Premium vegetable soup with waterleaf, pumpkin leaves, and seafood.",
  "banga soup": "Palm fruit soup rich in palm cream, spices, and assorted protein.",
  "oha soup": "Traditional Igbo soup with oha leaves, cocoyam, and assorted meat.",
  "pounded yam": "Smooth, stretchy pounded yam — the perfect swallow for any soup.",
  "amala": "Soft, dark yam flour swallow with a smooth, stretchy texture.",
  "eba": "Firm garri swallow made from cassava — a classic Nigerian staple.",
  "fufu": "Soft fermented cassava swallow, smooth and perfect for soups.",
  "semovita": "Light semolina swallow with a smooth, mild flavour.",
  "wheat": "Whole wheat swallow — a lighter, healthier option for your soup.",

  // Snacks & sides
  "plantain": "Sweet ripe plantain fried golden and caramelised.",
  "fried plantain": "Sweet ripe plantain slices fried until golden and caramelised.",
  "dodo": "Sweet fried plantain — crispy on the outside, soft and sweet inside.",
  "moi moi": "Steamed bean pudding with eggs, fish, and peppers.",
  "coleslaw": "Fresh crunchy cabbage and carrot salad in creamy mayonnaise dressing.",
  "salad": "Fresh mixed garden salad with lettuce, tomatoes, and light dressing.",
  "chips": "Crispy golden potato chips, lightly salted.",
  "yam": "Boiled or fried yam served with pepper sauce or egg.",
  "fried yam": "Crispy fried yam sticks served with spicy pepper sauce.",
  "crispy fried yam": "Extra crispy yam coated with egg and veggies, fried golden.",
  "puff puff": "Sweet deep-fried dough balls — a beloved Nigerian street snack.",
  "meat pie": "Flaky pastry filled with seasoned minced meat and vegetables.",
  "spring roll": "Crispy rolled pastry filled with seasoned vegetables and chicken.",
  "shawarma": "Grilled chicken wrapped in flatbread with coleslaw and spicy sauce.",

  // Drinks
  "chapman": "Nigeria's signature cocktail — Fanta, Sprite, grenadine, and bitters.",
  "zobo": "Chilled hibiscus drink sweetened with pineapple and ginger.",
  "palm wine": "Fresh naturally fermented palm sap — sweet and mildly alcoholic.",
  "kunun": "Traditional millet drink with ginger, cloves, and natural sweetness.",

  // Combos
  "chick wizz": "Crispy toasted club sandwich loaded with seasoned chicken, fresh lettuce, mayo, and signature spice blend. A campus favourite.",
  "ewa agoyin": "Mashed honey beans in rich, spicy palm oil sauce. A Lagos street food classic.",
  "ewa agoyin & bread": "Mashed honey beans in spicy sauce served with soft agege bread. The ultimate Lagos breakfast.",
  "beans & plantain": "Seasoned beans paired with sweet fried plantain — comfort food at its finest.",
};

// POST /api/admin/generate-descriptions — auto-fill empty descriptions
export async function POST() {
  // Get all menu items without descriptions
  const menuItems = await prisma.menuItem.findMany({
    where: { OR: [{ description: null }, { description: "" }] },
    select: { id: true, name: true },
  });

  // Get all products without descriptions
  const products = await prisma.product.findMany({
    where: { OR: [{ description: null }, { description: "" }] },
    select: { id: true, name: true },
  });

  let updated = 0;

  for (const item of [...menuItems, ...products]) {
    const nameLower = item.name.toLowerCase().trim();

    // Try exact match first
    let desc = FOOD_DESCRIPTIONS[nameLower];

    // Try partial match — find the longest matching key
    if (!desc) {
      const matches = Object.entries(FOOD_DESCRIPTIONS)
        .filter(([key]) => nameLower.includes(key) || key.includes(nameLower))
        .sort((a, b) => b[0].length - a[0].length);
      if (matches.length > 0) desc = matches[0][1];
    }

    // Generic fallback based on common keywords
    if (!desc) {
      if (nameLower.includes("rice")) desc = "Seasoned Nigerian rice dish prepared with fresh ingredients and spices.";
      else if (nameLower.includes("chicken")) desc = "Tender chicken prepared Nigerian-style with bold seasoning.";
      else if (nameLower.includes("beef")) desc = "Slow-cooked beef in a rich, flavourful Nigerian sauce.";
      else if (nameLower.includes("fish")) desc = "Fresh fish prepared with traditional Nigerian seasonings.";
      else if (nameLower.includes("goat")) desc = "Tender goat meat cooked in rich pepper sauce.";
      else if (nameLower.includes("turkey")) desc = "Smoked turkey prepared in a spicy pepper sauce.";
      else if (nameLower.includes("soup")) desc = "Traditional Nigerian soup with assorted meat and fresh ingredients.";
      else if (nameLower.includes("yam")) desc = "Nigerian yam dish — a hearty, satisfying staple.";
      else if (nameLower.includes("plantain")) desc = "Sweet ripe plantain fried golden and caramelised.";
      else if (nameLower.includes("beans")) desc = "Seasoned Nigerian beans prepared with palm oil and spices.";
      else if (nameLower.includes("vm") || nameLower.includes("value meal")) desc = "Complete value meal with rice, protein, and sides.";
      else if (nameLower.includes("xl")) desc = "Extra-large portion with generous servings of rice and protein.";
      else if (nameLower.includes("combo")) desc = "A satisfying combination meal with your choice of sides.";
      else desc = "A delicious Nigerian dish prepared fresh with quality ingredients.";
    }

    // Update in the right table
    const isMenuItem = menuItems.some(m => m.id === item.id);
    if (isMenuItem) {
      await prisma.menuItem.update({ where: { id: item.id }, data: { description: desc } });
    } else {
      await prisma.product.update({ where: { id: item.id }, data: { description: desc } });
    }
    updated++;
  }

  return NextResponse.json({
    success: true,
    data: {
      menuItemsProcessed: menuItems.length,
      productsProcessed: products.length,
      totalUpdated: updated,
    },
  });
}
