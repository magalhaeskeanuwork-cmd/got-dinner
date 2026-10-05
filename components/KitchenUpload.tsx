"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react";

type InventoryItem = {
  name: string;
  quantity?: string;
  location?: string;
  category?: string;
  confidence?: number;
};

type DinnerFilters = {
  time: string;
  foodStyle: string[];
  appliance: string[];
  temperature: string;
  cuisines: string[];
};

type RecipeIngredient = {
  name: string;
  amount: string;
  from_kitchen: boolean;
};

type Recipe = {
  name: string;
  description: string;
  match_percentage: number;
  total_time_minutes: number;
  difficulty: string;
  servings: number;
  ingredients: RecipeIngredient[];
  missing_ingredients: {
    name: string;
    amount: string;
    essential: boolean;
  }[];
  steps: string[];
  tags: string[];
};

type RecipeImage = {
  url: string | null;
  thumbnail: string | null;
  source: string | null;
  title: string;
} | null;

type UploadedPhoto = {
  id: string;
  file: File;
  preview: string;
};

/* =========================================================
   EMOJI SYSTEM
   ========================================================= */

const FOOD_EMOJI_MAP: Record<string, string> = {
  /* Proteins */
  chicken: "🍗",
  "chicken breast": "🍗",
  "chicken thigh": "🍗",
  "chicken thighs": "🍗",
  "chicken leg": "🍗",
  turkey: "🦃",
  beef: "🥩",
  steak: "🥩",
  "beef steak": "🥩",
  mince: "🥩",
  "ground beef": "🥩",
  lamb: "🍖",
  pork: "🥩",
  bacon: "🥓",
  ham: "🍖",
  sausage: "🌭",
  sausages: "🌭",
  meatball: "🍖",
  meatballs: "🍖",

  /* Fish */
  fish: "🐟",
  salmon: "🐟",
  tuna: "🐟",
  cod: "🐟",
  sardine: "🐟",
  sardines: "🐟",
  anchovy: "🐟",
  mackerel: "🐟",
  trout: "🐟",
  haddock: "🐟",

  /* Seafood */
  shrimp: "🍤",
  prawns: "🍤",
  prawn: "🍤",
  crab: "🦀",
  lobster: "🦞",
  oyster: "🦪",
  oysters: "🦪",
  mussel: "🦪",
  mussels: "🦪",
  clam: "🦪",
  clams: "🦪",
  squid: "🦑",
  octopus: "🐙",
  shellfish: "🦐",

  /* Eggs and dairy */
  egg: "🥚",
  eggs: "🥚",
  milk: "🥛",
  "soy milk": "🥛",
  cheese: "🧀",
  cheddar: "🧀",
  mozzarella: "🧀",
  parmesan: "🧀",
  feta: "🧀",
  ricotta: "🧀",
  yogurt: "🥛",
  yoghurt: "🥛",
  cream: "🥛",
  "sour cream": "🥛",
  butter: "🧈",
  "cream cheese": "🧀",

  /* Vegetables */
  tomato: "🍅",
  tomatoes: "🍅",
  potato: "🥔",
  potatoes: "🥔",
  sweetpotato: "🍠",
  "sweet potato": "🍠",
  onion: "🧅",
  onions: "🧅",
  garlic: "🧄",
  carrot: "🥕",
  carrots: "🥕",
  cucumber: "🥒",
  cucumbers: "🥒",
  lettuce: "🥬",
  spinach: "🥬",
  kale: "🥬",
  cabbage: "🥬",
  bokchoy: "🥬",
  "bok choy": "🥬",
  broccoli: "🥦",
  cauliflower: "🥦",
  zucchini: "🥒",
  courgette: "🥒",
  eggplant: "🍆",
  aubergine: "🍆",
  pepper: "🫑",
  peppers: "🫑",
  "bell pepper": "🫑",
  "bell peppers": "🫑",
  chili: "🌶️",
  chilli: "🌶️",
  "chili pepper": "🌶️",
  jalapeno: "🌶️",
  mushroom: "🍄",
  mushrooms: "🍄",
  corn: "🌽",
  peas: "🫛",
  pea: "🫛",
  asparagus: "🌿",
  artichoke: "🌿",
  celery: "🥬",
  leek: "🥬",
  turnip: "🥬",
  radish: "🌱",
  beetroot: "🥬",
  beet: "🥬",
  pumpkin: "🎃",
  squash: "🎃",
  avocado: "🥑",
  olive: "🫒",
  olives: "🫒",

  /* Fruit */
  apple: "🍎",
  apples: "🍎",
  banana: "🍌",
  bananas: "🍌",
  orange: "🍊",
  oranges: "🍊",
  lemon: "🍋",
  lemons: "🍋",
  lime: "🍋",
  limes: "🍋",
  strawberry: "🍓",
  strawberries: "🍓",
  blueberry: "🫐",
  blueberries: "🫐",
  raspberry: "🫐",
  raspberries: "🫐",
  blackberry: "🫐",
  blackberries: "🫐",
  grape: "🍇",
  grapes: "🍇",
  watermelon: "🍉",
  melon: "🍈",
  peach: "🍑",
  peaches: "🍑",
  pear: "🍐",
  pears: "🍐",
  pineapple: "🍍",
  mango: "🥭",
  kiwi: "🥝",
  passionfruit: "🥝",
  "passion fruit": "🥝",
  papaya: "🥭",
  pomegranate: "🍎",
  fig: "🫐",
  figs: "🫐",
  date: "🍇",
  dates: "🍇",
  coconut: "🥥",

  /* Grains, bread and pasta */
  rice: "🍚",
  pasta: "🍝",
  spaghetti: "🍝",
  noodles: "🍜",
  bread: "🍞",
  toast: "🍞",
  baguette: "🥖",
  flour: "🌾",
  wheat: "🌾",
  oats: "🌾",
  oatmeal: "🥣",
  quinoa: "🌾",
  couscous: "🌾",
  barley: "🌾",
  rye: "🌾",
  tortilla: "🌯",
  wrap: "🌯",
  breadcrumbs: "🍞",
  cornstarch: "🌾",

  /* Beans and legumes */
  beans: "🫘",
  bean: "🫘",
  chickpeas: "🫘",
  chickpea: "🫘",
  lentils: "🫘",
  lentil: "🫘",

  /* Nuts and seeds */
  peanut: "🥜",
  peanuts: "🥜",
  almond: "🥜",
  almonds: "🥜",
  cashew: "🥜",
  cashews: "🥜",
  walnut: "🥜",
  walnuts: "🥜",
  pistachio: "🥜",
  pistachios: "🥜",
  hazelnut: "🥜",
  hazelnuts: "🥜",
  sesame: "🌰",
  "sesame seeds": "🌰",
  chia: "🌱",
  "chia seeds": "🌱",
  sunflower: "🌻",
  "sunflower seeds": "🌻",

  /* Herbs */
  basil: "🌿",
  parsley: "🌿",
  coriander: "🌿",
  cilantro: "🌿",
  mint: "🌿",
  rosemary: "🌿",
  thyme: "🌿",
  oregano: "🌿",
  dill: "🌿",
  chives: "🌿",
  sage: "🌿",

  /* Spices */
  salt: "🧂",
  "black pepper": "🌶️",
  paprika: "🌶️",
  cumin: "🌿",
  turmeric: "🌿",
  cinnamon: "🪵",
  nutmeg: "🌰",
  ginger: "🫚",
  "ginger root": "🫚",
  garlicpowder: "🧄",
  "garlic powder": "🧄",
  curry: "🍛",

  /* Sauces */
  sauce: "🫙",
  dressing: "🫙",
  ketchup: "🫙",
  mustard: "🫙",
  mayonnaise: "🫙",
  mayo: "🫙",
  "soy sauce": "🫙",
  "hot sauce": "🌶️",
  pesto: "🌿",
  tahini: "🫙",
  hummus: "🫘",

  /* Oils */
  oil: "🫒",
  "olive oil": "🫒",
  "vegetable oil": "🫒",
  "coconut oil": "🥥",

  /* Broths */
  broth: "🥣",
  stock: "🥣",
  "chicken stock": "🥣",
  "beef stock": "🥣",
  "vegetable stock": "🥣",

  /* Breakfast */
  cereal: "🥣",
  granola: "🥣",
  pancake: "🥞",
  pancakes: "🥞",
  waffle: "🧇",
  waffles: "🧇",

  /* Sweets */
  chocolate: "🍫",
  cookie: "🍪",
  cookies: "🍪",
  cake: "🍰",
  honey: "🍯",
  jam: "🍓",

  /* Drinks */
  water: "💧",
  coffee: "☕",
  tea: "🍵",
  juice: "🧃",
  smoothie: "🥤",
};

const FOOD_ALIASES: Record<string, string> = {
  "chicken fillet": "chicken breast",
  "chicken breast fillets": "chicken breast",
  "chicken breasts": "chicken breast",
  "beef mince": "ground beef",
  "minced beef": "ground beef",
  "minced meat": "ground beef",
  "pork chop": "pork",
  "pork chops": "pork",
  "tinned tuna": "tuna",
  "canned tuna": "tuna",
  "fresh tuna": "tuna",
  "green beans": "beans",
  "red onion": "onion",
  "yellow onion": "onion",
  "white onion": "onion",
  "spring onion": "onion",
  "spring onions": "onion",
  "cherry tomatoes": "tomatoes",
  "roma tomatoes": "tomatoes",
  "baby spinach": "spinach",
  "mixed salad": "lettuce",
  "salad leaves": "lettuce",
  rocket: "lettuce",
  arugula: "lettuce",
  capsicum: "bell pepper",
  "red pepper": "bell pepper",
  "green pepper": "bell pepper",
  "yellow pepper": "bell pepper",
  "frozen vegetables": "broccoli",
  "frozen veggies": "broccoli",
  sweetcorn: "corn",
  "corn kernels": "corn",
  "green peas": "peas",
  "black olives": "olives",
  "green olives": "olives",
  "plain yogurt": "yogurt",
  "greek yogurt": "yogurt",
  "greek yoghurt": "yogurt",
  "lactose free yogurt": "yogurt",
  "lactose-free yogurt": "yogurt",
  "lactose free yoghurt": "yogurt",
  "lactose-free yoghurt": "yogurt",
  "cream cheese": "cream cheese",
  "fresh cheese": "cheese",
  "white rice": "rice",
  "brown rice": "rice",
  "basmati rice": "rice",
  "jasmine rice": "rice",
  "gluten free pasta": "pasta",
  "gluten-free pasta": "pasta",
  "whole wheat pasta": "pasta",
};

const foodStyles = [
  "Vegan",
  "Vegetarian",
  "Low Carb",
  "Keto",
  "Low Calorie",
  "High Protein",
  "Comfort Food",
];

const appliances = [
  "Stove",
  "Oven",
  "Air Fryer",
  "No Cooking",
];

const cuisines = [
  "Mediterranean",
  "Middle Eastern",
  "Italian",
  "Asian",
  "Japanese",
  "Korean",
  "Chinese",
  "Indian",
  "Mexican",
  "American",
  "Portuguese",
  "French",
  "Greek",
  "Turkish",
  "Thai",
  "Spanish",
];

function normalizeFoodName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function getIngredientEmoji(name: string) {
  const normalized = normalizeFoodName(name);

  if (FOOD_EMOJI_MAP[normalized]) {
    return FOOD_EMOJI_MAP[normalized];
  }

  if (FOOD_ALIASES[normalized]) {
    return (
      FOOD_EMOJI_MAP[
        FOOD_ALIASES[normalized]
      ] || "🍽️"
    );
  }

  for (const [key, emoji] of Object.entries(
    FOOD_EMOJI_MAP
  )) {
    if (
      normalized.includes(key) ||
      key.includes(normalized)
    ) {
      return emoji;
    }
  }

  for (const [alias, canonical] of Object.entries(
    FOOD_ALIASES
  )) {
    if (
      normalized.includes(alias) ||
      alias.includes(normalized)
    ) {
      return (
        FOOD_EMOJI_MAP[canonical] ||
        "🍽️"
      );
    }
  }

  return "🍽️";
}

function getAllergenInfo(name: string) {
  const normalized =
    normalizeFoodName(name);

  if (
    /shrimp|prawn|crab|lobster|oyster|mussel|clam|squid|octopus|shellfish/.test(
      normalized
    )
  ) {
    return {
      label: "SHELLFISH",
      className: "bg-[#ff7043]",
    };
  }

  if (
    /milk|cheese|cheddar|mozzarella|parmesan|feta|ricotta|yogurt|yoghurt|cream|butter|dairy/.test(
      normalized
    )
  ) {
    return {
      label: "DAIRY",
      className: "bg-[#ffe033]",
    };
  }

  if (
    /wheat|flour|bread|pasta|spaghetti|noodle|barley|rye|couscous|gluten/.test(
      normalized
    )
  ) {
    return {
      label: "GLUTEN",
      className: "bg-[#ffe033]",
    };
  }

  if (
    /peanut|almond|cashew|walnut|pistachio|hazelnut|nut/.test(
      normalized
    )
  ) {
    return {
      label: "NUTS",
      className: "bg-[#ff7043]",
    };
  }

  if (
    /soy|soya|tofu|edamame/.test(
      normalized
    )
  ) {
    return {
      label: "SOY",
      className: "bg-[#ffe033]",
    };
  }

  return {
    label: "NO COMMON ALLERGEN",
    className: "bg-[#72d84c]",
  };
}

function getCardRotation(index: number) {
  const rotations = [
    "-rotate-1",
    "rotate-1",
    "-rotate-1",
    "rotate-1",
    "rotate-0",
    "-rotate-1",
  ];

  return rotations[index % rotations.length];
}

function getCardAccent(index: number) {
  const accents = [
    "#ffe033",
    "#72d84c",
    "#3aa8ff",
    "#ff7043",
    "#ffe033",
    "#72d84c",
  ];

  return accents[index % accents.length];
}

export default function KitchenUpload() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const photoUrlsRef =
    useRef<string[]>([]);

  const [photos, setPhotos] =
    useState<UploadedPhoto[]>([]);

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [recipes, setRecipes] =
    useState<Recipe[]>([]);

  const [selectedRecipe, setSelectedRecipe] =
    useState<Recipe | null>(null);

  const [recipeImages, setRecipeImages] =
    useState<Record<string, RecipeImage>>(
      {}
    );

  const [isScanning, setIsScanning] =
    useState(false);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [isLoadingMore, setIsLoadingMore] =
    useState(false);

  const [scanComplete, setScanComplete] =
    useState(false);

  const [showUpload, setShowUpload] =
    useState(true);

  const [showCuisines, setShowCuisines] =
    useState(false);

  const [recipeSort, setRecipeSort] =
    useState("best");

  const [difficultyFilter, setDifficultyFilter] =
    useState("all");

  const [filters, setFilters] =
    useState<DinnerFilters>({
      time: "30",
      foodStyle: [],
      appliance: [],
      temperature: "hot",
      cuisines: [],
    });

  const sortedRecipes = useMemo(() => {
    let filtered = [...recipes];

    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (recipe) =>
          recipe.difficulty?.toLowerCase() ===
          difficultyFilter
      );
    }

    filtered.sort((a, b) => {
      if (recipeSort === "complete") {
        return (
          (a.missing_ingredients?.length ||
            0) -
          (b.missing_ingredients?.length ||
            0)
        );
      }

      if (recipeSort === "missing") {
        return (
          (a.missing_ingredients?.length ||
            0) -
          (b.missing_ingredients?.length ||
            0)
        );
      }

      if (recipeSort === "fastest") {
        return (
          a.total_time_minutes -
          b.total_time_minutes
        );
      }

      if (recipeSort === "easiest") {
        const order: Record<
          string,
          number
        > = {
          easy: 1,
          medium: 2,
          hard: 3,
        };

        return (
          (order[
            a.difficulty?.toLowerCase()
          ] || 99) -
          (order[
            b.difficulty?.toLowerCase()
          ] || 99)
        );
      }

      return (
        b.match_percentage -
        a.match_percentage
      );
    });

    return filtered;
  }, [
    recipes,
    recipeSort,
    difficultyFilter,
  ]);

  function cleanupPhotoUrls() {
    photoUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    photoUrlsRef.current = [];
  }

  function clearPhotos() {
    cleanupPhotoUrls();
    setPhotos([]);
  }

  function addPhotos(
    files: File[]
  ) {
    const imageFiles = files.filter(
      (file) =>
        file.type.startsWith("image/")
    );

    const remaining =
      Math.max(0, 3 - photos.length);

    const filesToAdd =
      imageFiles.slice(0, remaining);

    const newPhotos =
      filesToAdd.map((file) => {
        const preview =
          URL.createObjectURL(file);

        photoUrlsRef.current.push(preview);

        return {
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          file,
          preview,
        };
      });

    setPhotos((current) => [
      ...current,
      ...newPhotos,
    ]);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    addPhotos(files);

    event.target.value = "";
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    const files = Array.from(
      event.dataTransfer.files || []
    );

    addPhotos(files);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const photo = current.find(
        (item) => item.id === id
      );

      if (photo) {
        URL.revokeObjectURL(
          photo.preview
        );

        photoUrlsRef.current =
          photoUrlsRef.current.filter(
            (url) =>
              url !== photo.preview
          );
      }

      return current.filter(
        (item) => item.id !== id
      );
    });
  }

  async function scanKitchen() {
    if (!photos.length) return;

    setIsScanning(true);

    try {
      const formData =
        new FormData();

      photos.forEach((photo) => {
        formData.append(
          "photos",
          photo.file
        );
      });

      const response = await fetch(
        "/api/scan",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          "Kitchen scan failed"
        );
      }

      const data =
        await response.json();

      const items =
        Array.isArray(data?.items)
          ? data.items
          : [];

      setInventory(
        items.map(
          (item: InventoryItem) => ({
            name:
              item.name || "Unknown ingredient",
            quantity:
              item.quantity || "",
            location:
              item.location ||
              "unknown",
            category:
              item.category ||
              "other",
            confidence:
              item.confidence,
          })
        )
      );

      setScanComplete(true);
      setShowUpload(false);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "SCAN ERROR:",
        error
      );

      alert(
        "We couldn't scan the kitchen. Please try again."
      );
    } finally {
      setIsScanning(false);
    }
  }

  /* =========================================================
     INVENTORY EDITING
     ========================================================= */

  function updateInventoryItem(
    index: number,
    field: keyof InventoryItem,
    value: string
  ) {
    setInventory((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      )
    );
  }

  function removeInventoryItem(
    index: number
  ) {
    setInventory((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  function addInventoryItem() {
    setInventory((current) => [
      ...current,
      {
        name: "New ingredient",
        quantity: "",
        location: "unknown",
        category: "other",
      },
    ]);
  }

  /* =========================================================
     FILTER HELPERS
     ========================================================= */

  function toggleFoodStyle(
    style: string
  ) {
    setFilters((current) => ({
      ...current,
      foodStyle:
        current.foodStyle.includes(style)
          ? current.foodStyle.filter(
              (item) => item !== style
            )
          : [
              ...current.foodStyle,
              style,
            ],
    }));
  }

  function toggleAppliance(
    appliance: string
  ) {
    setFilters((current) => ({
      ...current,
      appliance:
        current.appliance.includes(
          appliance
        )
          ? current.appliance.filter(
              (item) =>
                item !== appliance
            )
          : [
              ...current.appliance,
              appliance,
            ],
    }));
  }

  function toggleCuisine(
    cuisine: string
  ) {
    setFilters((current) => ({
      ...current,
      cuisines:
        current.cuisines.includes(cuisine)
          ? current.cuisines.filter(
              (item) =>
                item !== cuisine
            )
          : [
              ...current.cuisines,
              cuisine,
            ],
    }));
  }

  /* =========================================================
     GOOGLE IMAGE SEARCH
     ========================================================= */

  async function loadRecipeImages(
    recipeList: Recipe[]
  ) {
    try {
      const queries =
        recipeList.map(
          (recipe) => recipe.name
        );

      const response = await fetch(
        "/api/images",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            queries,
          }),
        }
      );

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      if (data?.images) {
        setRecipeImages(
          (current) => ({
            ...current,
            ...data.images,
          })
        );
      }
    } catch (error) {
      console.error(
        "Could not load recipe images:",
        error
      );
    }
  }

  /* =========================================================
     GENERATE DINNER
     ========================================================= */

  async function generateDinner() {
    if (!inventory.length) return;

    setIsGenerating(true);
    setSelectedRecipe(null);
    setRecipes([]);

    try {
      const response = await fetch(
        "/api/dinner",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            inventory,
            filters,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Dinner API error:",
          errorText
        );

        throw new Error(
          errorText ||
            "Dinner generation failed"
        );
      }

      const data =
        await response.json();

      const generatedRecipes =
        data?.recipes || [];

      setRecipes(
        generatedRecipes
      );

      setRecipeSort("best");
      setDifficultyFilter("all");

      if (generatedRecipes.length) {
        loadRecipeImages(
          generatedRecipes
        );
      }

      setTimeout(() => {
        document
          .getElementById(
            "recipe-results"
          )
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 100);
    } catch (error) {
      console.error(
        "DINNER ERROR:",
        error
      );

      alert(
        "We couldn't generate dinner ideas. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  /* =========================================================
     MORE RECIPES
     ========================================================= */

  async function generateMoreRecipes() {
    if (
      !inventory.length ||
      isLoadingMore
    ) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await fetch(
        "/api/dinner",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            inventory,
            filters,
          }),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "More dinner API error:",
          errorText
        );

        throw new Error(
          errorText ||
            "More dinner generation failed"
        );
      }

      const data =
        await response.json();

      const freshRecipes: Recipe[] =
        Array.isArray(data?.recipes)
          ? data.recipes
          : [];

      const existingNames =
        new Set(
          recipes.map((recipe) =>
            recipe.name
              .toLowerCase()
              .trim()
          )
        );

      const uniqueFreshRecipes =
        freshRecipes.filter(
          (recipe) =>
            !existingNames.has(
              recipe.name
                .toLowerCase()
                .trim()
            )
        );

      if (
        uniqueFreshRecipes.length
      ) {
        setRecipes((current) => [
          ...current,
          ...uniqueFreshRecipes,
        ]);

        await loadRecipeImages(
          uniqueFreshRecipes
        );
      }
    } catch (error) {
      console.error(
        "MORE DINNER ERROR:",
        error
      );

      alert(
        "We couldn't find more dinner ideas. Please try again."
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  /* =========================================================
     RESET
     ========================================================= */

  function resetEverything() {
    clearPhotos();

    setInventory([]);
    setRecipes([]);
    setSelectedRecipe(null);
    setScanComplete(false);
    setShowUpload(true);
    setRecipeImages({});
    setRecipeSort("best");
    setDifficultyFilter("all");

    setFilters({
      time: "30",
      foodStyle: [],
      appliance: [],
      temperature: "hot",
      cuisines: [],
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =========================================================
     RECIPE DETAIL
     ========================================================= */

  if (selectedRecipe) {
    const recipeImage =
      recipeImages[
        selectedRecipe.name
      ];

    return (
      <main className="min-h-screen bg-[#3aa8ff] text-[#171717]">
        <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
          <button
            type="button"
            onClick={() =>
              setSelectedRecipe(null)
            }
            className="mb-10 rounded-full border-3 border-black bg-white px-5 py-3 text-sm font-black uppercase shadow-[4px_4px_0_#171717] transition-transform hover:-translate-y-1"
          >
            ← Back to dinner ideas
          </button>

          <div className="overflow-hidden rounded-[36px] border-4 border-black bg-white shadow-[8px_8px_0_#171717]">
            <div className="relative h-[300px] overflow-hidden border-b-4 border-black md:h-[440px]">
              {recipeImage?.thumbnail ? (
                <img
                  src={
                    recipeImage.thumbnail
                  }
                  alt={
                    selectedRecipe.name
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#ffe033]">
                  <div className="text-[150px]">
                    {getIngredientEmoji(
                      selectedRecipe
                        .ingredients?.[0]
                        ?.name ||
                        "food"
                    )}
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 right-6">
                <div className="mb-3 inline-block rounded-full border-2 border-black bg-[#72d84c] px-4 py-2 text-xs font-black shadow-[3px_3px_0_#171717]">
                  {
                    selectedRecipe.match_percentage
                  }
                  % MATCH
                </div>

                <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-white md:text-7xl">
                  {
                    selectedRecipe.name
                  }
                </h1>
              </div>
            </div>

            <div className="grid gap-10 p-6 md:p-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xl font-bold leading-relaxed md:text-2xl">
                  {
                    selectedRecipe.description
                  }
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <MetaPill>
                    ⏱{" "}
                    {
                      selectedRecipe.total_time_minutes
                    }{" "}
                    MIN
                  </MetaPill>

                  <MetaPill>
                    DIFFICULTY{" "}
                    {selectedRecipe.difficulty?.toUpperCase()}
                  </MetaPill>

                  <MetaPill>
                    {selectedRecipe.servings}{" "}
                    SERVINGS
                  </MetaPill>
                </div>

                {selectedRecipe.tags?.length >
                  0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {selectedRecipe.tags.map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-black px-3 py-2 text-xs font-black uppercase text-white"
                        >
                          {tag}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border-3 border-black bg-[#fffaf0] p-6">
                <div className="mb-5 text-xs font-black uppercase tracking-[0.18em] opacity-50">
                  WHAT YOU NEED
                </div>

                <div className="space-y-3">
                  {selectedRecipe.ingredients?.map(
                    (
                      ingredient,
                      index
                    ) => (
                      <div
                        key={`${ingredient.name}-${index}`}
                        className="flex items-center justify-between gap-4 border-b-2 border-black/10 pb-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {getIngredientEmoji(
                              ingredient.name
                            )}
                          </span>

                          <span className="font-black">
                            {
                              ingredient.name
                            }
                          </span>
                        </div>

                        <span className="text-right text-sm font-bold opacity-60">
                          {
                            ingredient.amount
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>

                {selectedRecipe
                  .missing_ingredients
                  ?.length > 0 && (
                  <div className="mt-8 rounded-[20px] border-2 border-black bg-[#ff7043] p-5">
                    <div className="text-xs font-black uppercase tracking-[0.16em]">
                      YOU NEED TO BUY
                    </div>

                    <div className="mt-4 space-y-2">
                      {selectedRecipe.missing_ingredients.map(
                        (
                          ingredient,
                          index
                        ) => (
                          <div
                            key={`${ingredient.name}-${index}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="font-black">
                              {
                                ingredient.name
                              }
                            </span>

                            <span className="text-sm font-bold">
                              {
                                ingredient.amount
                              }
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t-4 border-black bg-[#ffe033] p-6 md:p-12">
              <div className="mb-8 text-xs font-black uppercase tracking-[0.18em]">
                HOW TO MAKE IT
              </div>

              <div className="space-y-5">
                {selectedRecipe.steps?.map(
                  (step, index) => (
                    <div
                      key={index}
                      className="flex gap-5 rounded-[24px] border-3 border-black bg-white p-5 shadow-[4px_4px_0_#171717]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-3 border-black bg-[#72d84c] text-lg font-black">
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </div>

                      <p className="pt-2 text-lg font-bold leading-relaxed">
                        {step}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {recipeImage?.source && (
              <div className="border-t-4 border-black bg-white px-6 py-4 text-right">
                <a
                  href={
                    recipeImage.source
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-black uppercase tracking-[0.15em] underline"
                >
                  View image source
                </a>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  /* =========================================================
     MAIN PAGE
     ========================================================= */

  return (
    <main className="min-h-screen bg-[#fffaf0] text-[#171717]">
      {/* HERO */}

      <section className="relative overflow-hidden border-b-4 border-black bg-[#fffaf0]">
        <div className="absolute -right-8 top-10 rotate-12 text-[100px] md:text-[150px]">
          🍅
        </div>

        <div className="absolute left-[4%] top-[25%] -rotate-12 text-[70px] md:text-[110px]">
          🥑
        </div>

        <div className="absolute bottom-[-30px] right-[12%] -rotate-6 text-[90px] md:text-[130px]">
          🥚
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-20">
          <div className="mb-8 flex items-center justify-between">
            <div className="text-xs font-black uppercase tracking-[0.22em]">
              AI KITCHEN ASSISTANT
            </div>

            <div className="rounded-full border-2 border-black bg-[#ffe033] px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#171717]">
              01 → DINNER
            </div>
          </div>

          <div className="max-w-5xl">
            <h1 className="text-[18vw] font-black uppercase leading-[0.75] tracking-[-0.075em] md:text-[12rem]">
              GOT
              <br />
              DINNER?
            </h1>

            <p className="mt-8 max-w-2xl text-xl font-bold leading-relaxed md:text-3xl">
              Show us what you've got.
              <br />
              We'll figure out what you
              can make.
            </p>
          </div>

          {!scanComplete && (
            <div className="mt-12">
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="mr-3 rounded-full border-3 border-black bg-[#ffe033] px-7 py-4 text-sm font-black uppercase shadow-[5px_5px_0_#171717] transition-transform hover:-translate-y-1"
              >
                SHOW US YOUR KITCHEN
              </button>

              <button
                type="button"
                onClick={() => {
                  setInventory([]);
                  setScanComplete(true);
                  setShowUpload(false);
                }}
                className="mt-4 rounded-full border-3 border-black bg-white px-7 py-4 text-sm font-black uppercase shadow-[5px_5px_0_#171717] transition-transform hover:-translate-y-1 md:mt-0"
              >
                I'LL JUST TYPE IT
              </button>
            </div>
          )}
        </div>
      </section>

      {/* UPLOAD */}

      {showUpload && !scanComplete && (
        <section className="bg-[#72d84c] px-5 py-12 md:px-8 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] opacity-60">
                  SHOW US WHAT YOU'VE GOT
                </div>

                <h2 className="mt-2 text-5xl font-black uppercase leading-[0.85] tracking-[-0.05em] md:text-7xl">
                  ONE KITCHEN.
                  <br />
                  THREE PHOTOS.
                </h2>
              </div>

              <div className="text-sm font-black uppercase">
                {photos.length}/3 PHOTOS
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={handleDrop}
              onClick={() => {
                if (photos.length < 3) {
                  fileInputRef.current?.click();
                }
              }}
              className="cursor-pointer rounded-[36px] border-4 border-dashed border-black bg-[#ffe033] p-8 shadow-[8px_8px_0_#171717] transition-transform hover:-translate-y-1 md:p-14"
            >
              <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                <div className="mb-4 text-7xl">
                  +
                </div>

                <div className="text-3xl font-black uppercase md:text-5xl">
                  DROP YOUR KITCHEN HERE
                </div>

                <p className="mt-4 max-w-xl text-base font-bold md:text-lg">
                  Take photos of your fridge,
                  counter, cupboard or
                  leftovers. Up to 3 photos.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm font-black uppercase md:grid-cols-4">
              <UploadSuggestion emoji="🧊">
                Fridge
              </UploadSuggestion>

              <UploadSuggestion emoji="🍳">
                Counter
              </UploadSuggestion>

              <UploadSuggestion emoji="🗄️">
                Cupboard
              </UploadSuggestion>

              <UploadSuggestion emoji="🍱">
                Leftovers
              </UploadSuggestion>
            </div>

            {photos.length > 0 && (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {photos.map(
                  (photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative overflow-hidden rounded-[24px] border-3 border-black bg-white shadow-[4px_4px_0_#171717]"
                    >
                      <img
                        src={photo.preview}
                        alt={`Kitchen photo ${
                          index + 1
                        }`}
                        className="h-64 w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removePhoto(
                            photo.id
                          );
                        }}
                        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-lg font-black shadow-[3px_3px_0_#171717]"
                      >
                        ×
                      </button>

                      <div className="absolute bottom-3 left-3 rounded-full border-2 border-black bg-[#ffe033] px-3 py-2 text-xs font-black">
                        PHOTO{" "}
                        {index + 1}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {photos.length > 0 && (
              <button
                type="button"
                disabled={isScanning}
                onClick={scanKitchen}
                className="mt-8 w-full rounded-[24px] border-3 border-black bg-[#171717] px-6 py-5 text-lg font-black uppercase text-white shadow-[6px_6px_0_#fffaf0] transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isScanning
                  ? "SCANNING YOUR KITCHEN..."
                  : "FIGURE OUT DINNER →"}
              </button>
            )}
          </div>
        </section>
      )}

      {/* INVENTORY */}

      {scanComplete && (
        <section className="bg-[#171717] px-5 py-12 text-white md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
                  KITCHEN SCAN COMPLETE
                </div>

                <h2 className="mt-2 text-5xl font-black uppercase leading-[0.85] tracking-[-0.05em] md:text-7xl">
                  HERE'S WHAT
                  <br />
                  WE FOUND.
                </h2>
              </div>

              <button
                type="button"
                onClick={resetEverything}
                className="rounded-full border-2 border-white px-5 py-3 text-xs font-black uppercase transition-transform hover:-translate-y-1"
              >
                START OVER
              </button>
            </div>

            {inventory.length === 0 ? (
              <div className="rounded-[30px] border-3 border-white/30 bg-white/10 p-8">
                <p className="text-lg font-bold">
                  No ingredients yet.
                  Add them manually below.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inventory.map(
                  (item, index) => {
                    const allergen =
                      getAllergenInfo(
                        item.name
                      );

                    return (
                      <div
                        key={`${item.name}-${index}`}
                        className={`rounded-[28px] border-3 border-black bg-white p-5 text-black shadow-[5px_5px_0_#ffe033] ${getCardRotation(
                          index
                        )}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="text-5xl">
                              {getIngredientEmoji(
                                item.name
                              )}
                            </div>

                            <div>
                              <input
                                value={
                                  item.name
                                }
                                onChange={(event) =>
                                  updateInventoryItem(
                                    index,
                                    "name",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="w-full border-b-2 border-black bg-transparent text-xl font-black uppercase outline-none"
                              />

                              <input
                                value={
                                  item.quantity ||
                                  ""
                                }
                                onChange={(event) =>
                                  updateInventoryItem(
                                    index,
                                    "quantity",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="QUANTITY"
                                className="mt-1 w-full bg-transparent text-xs font-bold uppercase outline-none placeholder:text-black/30"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeInventoryItem(
                                index
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black font-black"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-5">
                          <span
                            className={`inline-flex rounded-full border-2 border-black px-3 py-1 text-[10px] font-black uppercase ${allergen.className}`}
                          >
                            {allergen.label}
                          </span>
                        </div>

                        <div className="mt-4 text-[10px] font-black uppercase opacity-40">
                          {item.location ||
                            "UNKNOWN"}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}

            <button
              type="button"
              onClick={addInventoryItem}
              className="mt-8 rounded-full border-3 border-white bg-transparent px-6 py-3 text-sm font-black uppercase text-white transition-transform hover:-translate-y-1"
            >
              + ADD INGREDIENT
            </button>
          </div>
        </section>
      )}

      {/* FILTERS */}

      {scanComplete && (
        <section className="bg-[#ffe033] px-5 py-12 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <div className="text-xs font-black uppercase tracking-[0.18em] opacity-50">
                BEFORE WE COOK
              </div>

              <h2 className="mt-2 text-5xl font-black uppercase leading-[0.85] tracking-[-0.05em] md:text-7xl">
                WHAT ARE YOU
                <br />
                IN THE MOOD FOR?
              </h2>
            </div>

            <div className="space-y-10">
              {/* TIME */}

              <FilterSection
                number="01"
                title="HOW MUCH TIME?"
              >
                <div className="flex flex-wrap gap-3">
                  {[
                    "10",
                    "20",
                    "30",
                    "45+",
                  ].map((time) => (
                    <FilterButton
                      key={time}
                      active={
                        filters.time ===
                        time
                      }
                      onClick={() =>
                        setFilters(
                          (current) => ({
                            ...current,
                            time,
                          })
                        )
                      }
                    >
                      {time === "45+"
                        ? "45+ MIN"
                        : `${time} MIN`}
                    </FilterButton>
                  ))}
                </div>
              </FilterSection>

              {/* FOOD STYLE */}

              <FilterSection
                number="02"
                title="FOOD STYLE"
              >
                <div className="flex flex-wrap gap-3">
                  {foodStyles.map(
                    (style) => (
                      <FilterButton
                        key={style}
                        active={filters.foodStyle.includes(
                          style
                        )}
                        onClick={() =>
                          toggleFoodStyle(
                            style
                          )
                        }
                      >
                        {style}
                      </FilterButton>
                    )
                  )}
                </div>
              </FilterSection>

              {/* APPLIANCES */}

              <FilterSection
                number="03"
                title="WHAT CAN WE USE?"
              >
                <div className="flex flex-wrap gap-3">
                  {appliances.map(
                    (appliance) => (
                      <FilterButton
                        key={appliance}
                        active={filters.appliance.includes(
                          appliance
                        )}
                        onClick={() =>
                          toggleAppliance(
                            appliance
                          )
                        }
                      >
                        {appliance}
                      </FilterButton>
                    )
                  )}
                </div>
              </FilterSection>

              {/* TEMPERATURE */}

              <FilterSection
                number="04"
                title="HOT OR COLD?"
              >
                <div className="flex flex-wrap gap-3">
                  {[
                    "hot",
                    "cold",
                  ].map(
                    (temperature) => (
                      <FilterButton
                        key={temperature}
                        active={
                          filters.temperature ===
                          temperature
                        }
                        onClick={() =>
                          setFilters(
                            (current) => ({
                              ...current,
                              temperature,
                            })
                          )
                        }
                      >
                        {temperature}
                      </FilterButton>
                    )
                  )}
                </div>
              </FilterSection>

              {/* CUISINES */}

              <FilterSection
                number="05"
                title="TAKE IT SOMEWHERE?"
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowCuisines(
                      (current) =>
                        !current
                    )
                  }
                  className="rounded-full border-3 border-black bg-white px-6 py-3 text-sm font-black uppercase shadow-[4px_4px_0_#171717] transition-transform hover:-translate-y-1"
                >
                  {showCuisines
                    ? "− HIDE CUISINES"
                    : "+ EXPLORE CUISINES"}
                </button>

                {showCuisines && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {cuisines.map(
                      (cuisine) => (
                        <FilterButton
                          key={cuisine}
                          active={filters.cuisines.includes(
                            cuisine
                          )}
                          onClick={() =>
                            toggleCuisine(
                              cuisine
                            )
                          }
                        >
                          {cuisine}
                        </FilterButton>
                      )
                    )}
                  </div>
                )}
              </FilterSection>
            </div>

            <button
              type="button"
              onClick={generateDinner}
              disabled={
                isGenerating ||
                inventory.length === 0
              }
              className="mt-14 w-full rounded-[28px] border-4 border-black bg-[#171717] px-8 py-7 text-2xl font-black uppercase text-white shadow-[7px_7px_0_#ff7043] transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 md:text-4xl"
            >
              {isGenerating
                ? "COOKING UP IDEAS..."
                : "GENERATE MY DINNER →"}
            </button>
          </div>
        </section>
      )}

      {/* GENERATING */}

      {isGenerating && (
        <section className="bg-[#ff7043] px-5 py-20 md:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <div className="text-7xl">
              🍳
            </div>

            <h2 className="mt-8 text-6xl font-black uppercase leading-[0.85] tracking-[-0.05em] md:text-8xl">
              THINKING
              <br />
              ABOUT DINNER...
            </h2>

            <p className="mx-auto mt-8 max-w-xl text-lg font-bold">
              Gemini is matching your
              kitchen with your
              preferences.
            </p>
          </div>
        </section>
      )}

      {/* RECIPE RESULTS */}

      {!isGenerating &&
        recipes.length > 0 && (
          <section
            id="recipe-results"
            className="bg-[#fffaf0] px-5 py-12 md:px-8 md:py-20"
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-10">
                <div className="text-xs font-black uppercase tracking-[0.18em] opacity-50">
                  DINNER IS SERVED
                </div>

                <h2 className="mt-2 text-5xl font-black uppercase leading-[0.85] tracking-[-0.05em] md:text-7xl">
                  YOUR
                  <br />
                  OPTIONS.
                </h2>
              </div>

              {/* SORTING */}

              <div className="mb-10 rounded-[28px] border-3 border-black bg-white p-5 shadow-[5px_5px_0_#171717]">
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] opacity-50">
                      SORT DINNER
                    </div>

                    <div className="mt-1 text-2xl font-black uppercase">
                      What matters most?
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        id: "best",
                        label: "Best Match",
                      },
                      {
                        id: "complete",
                        label: "All Ingredients",
                      },
                      {
                        id: "missing",
                        label: "Fewest Missing",
                      },
                      {
                        id: "fastest",
                        label: "Fastest",
                      },
                      {
                        id: "easiest",
                        label: "Easiest",
                      },
                    ].map(
                      (option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setRecipeSort(
                              option.id
                            )
                          }
                          className={`rounded-full border-2 border-black px-4 py-2 text-xs font-black uppercase transition-transform hover:-translate-y-1 ${
                            recipeSort ===
                            option.id
                              ? "bg-black text-white"
                              : "bg-[#fffaf0]"
                          }`}
                        >
                          {
                            option.label
                          }
                        </button>
                      )
                    )}
                  </div>

                  <div className="border-t-2 border-black/10 pt-5">
                    <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] opacity-50">
                      DIFFICULTY
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          id: "all",
                          label: "All",
                        },
                        {
                          id: "easy",
                          label: "Easy",
                        },
                        {
                          id: "medium",
                          label: "Medium",
                        },
                        {
                          id: "hard",
                          label: "Hard",
                        },
                      ].map(
                        (option) => (
                          <button
                            key={
                              option.id
                            }
                            type="button"
                            onClick={() =>
                              setDifficultyFilter(
                                option.id
                              )
                            }
                            className={`rounded-full border-2 border-black px-4 py-2 text-xs font-black uppercase transition-transform hover:-translate-y-1 ${
                              difficultyFilter ===
                              option.id
                                ? "bg-[#72d84c]"
                                : "bg-[#fffaf0]"
                            }`}
                          >
                            {
                              option.label
                            }
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {sortedRecipes.length ===
              0 ? (
                <div className="rounded-[30px] border-3 border-black bg-[#ffe033] p-8 text-center shadow-[5px_5px_0_#171717]">
                  <div className="text-5xl">
                    🍳
                  </div>

                  <div className="mt-4 text-2xl font-black uppercase">
                    Nothing matches
                    that filter.
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDifficultyFilter(
                        "all"
                      )
                    }
                    className="mt-5 rounded-full border-2 border-black bg-white px-5 py-3 text-xs font-black uppercase"
                  >
                    SHOW EVERYTHING
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {sortedRecipes.map(
                      (
                        recipe,
                        index
                      ) => {
                        const image =
                          recipeImages[
                            recipe.name
                          ];

                        const accent =
                          getCardAccent(
                            index
                          );

                        return (
                          <article
                            key={`${recipe.name}-${index}`}
                            className={`group overflow-hidden rounded-[32px] border-4 border-black bg-white shadow-[7px_7px_0_#171717] transition-transform hover:-translate-y-2 ${getCardRotation(
                              index
                            )}`}
                          >
                            <div
                              className="relative min-h-[260px] overflow-hidden border-b-4 border-black"
                              style={{
                                background:
                                  accent,
                              }}
                            >
                              {image?.thumbnail ? (
                                <img
                                  src={
                                    image.thumbnail
                                  }
                                  alt={
                                    recipe.name
                                  }
                                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <>
                                  <div className="absolute -right-5 -top-8 text-[130px] opacity-20">
                                    {getIngredientEmoji(
                                      recipe
                                        .ingredients?.[0]
                                        ?.name ||
                                        "food"
                                    )}
                                  </div>

                                  <div className="absolute bottom-[-25px] left-[15%] rotate-[-12deg] text-7xl">
                                    {getIngredientEmoji(
                                      recipe
                                        .ingredients?.[1]
                                        ?.name ||
                                        "vegetable"
                                    )}
                                  </div>

                                  <div className="absolute right-[20%] top-[42%] rotate-[8deg] text-6xl">
                                    {getIngredientEmoji(
                                      recipe
                                        .ingredients?.[2]
                                        ?.name ||
                                        "food"
                                    )}
                                  </div>
                                </>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                              <div className="relative z-10 flex items-start justify-between p-6">
                                <div className="rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black shadow-[3px_3px_0_#171717]">
                                  #
                                  {String(
                                    index + 1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </div>

                                <div className="rounded-full border-2 border-black bg-[#72d84c] px-3 py-2 text-xs font-black shadow-[3px_3px_0_#171717]">
                                  {
                                    recipe.match_percentage
                                  }
                                  % MATCH
                                </div>
                              </div>

                              {image?.source && (
                                <a
                                  href={
                                    image.source
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(
                                    event
                                  ) =>
                                    event.stopPropagation()
                                  }
                                  className="absolute bottom-3 right-4 z-10 text-[9px] font-bold uppercase text-white/70 hover:text-white"
                                >
                                  Image source
                                </a>
                              )}
                            </div>

                            <div className="p-6">
                              <div className="mb-3 flex flex-wrap gap-2">
                                <span className="rounded-full border-2 border-black bg-[#ffe033] px-3 py-1 text-[10px] font-black uppercase">
                                  {
                                    recipe.total_time_minutes
                                  }{" "}
                                  MIN
                                </span>

                                <span className="rounded-full border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase">
                                  {
                                    recipe.difficulty
                                  }
                                </span>
                              </div>

                              <h3 className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.04em]">
                                {
                                  recipe.name
                                }
                              </h3>

                              <p className="mt-4 line-clamp-3 text-sm font-bold leading-relaxed opacity-70">
                                {
                                  recipe.description
                                }
                              </p>

                              <div className="mt-5 flex items-center justify-between border-t-2 border-black/10 pt-5">
                                <div>
                                  <div className="text-[10px] font-black uppercase opacity-40">
                                    MISSING
                                  </div>

                                  <div className="text-lg font-black">
                                    {
                                      recipe
                                        .missing_ingredients
                                        ?.length ||
                                      0
                                    }
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[10px] font-black uppercase opacity-40">
                                    SERVES
                                  </div>

                                  <div className="text-lg font-black">
                                    {
                                      recipe.servings
                                    }
                                  </div>
                                </div>
                              </div>

                              {recipe.tags?.length >
                                0 && (
                                <div className="mt-5 flex flex-wrap gap-2">
                                  {recipe.tags
                                    .slice(
                                      0,
                                      3
                                    )
                                    .map(
                                      (
                                        tag
                                      ) => (
                                        <span
                                          key={
                                            tag
                                          }
                                          className="text-[10px] font-black uppercase opacity-50"
                                        >
                                          #
                                          {tag}
                                        </span>
                                      )
                                    )}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedRecipe(
                                    recipe
                                  )
                                }
                                className="mt-7 w-full rounded-full border-3 border-black bg-[#171717] px-5 py-4 text-sm font-black uppercase text-white transition-transform hover:-translate-y-1"
                              >
                                SEE FULL RECIPE →
                              </button>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={
                      generateMoreRecipes
                    }
                    disabled={isLoadingMore}
                    className="mt-12 w-full rounded-[28px] border-4 border-black bg-[#ffe033] px-8 py-6 text-xl font-black uppercase shadow-[7px_7px_0_#171717] transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 md:text-3xl"
                  >
                    {isLoadingMore
                      ? "FINDING MORE DINNER..."
                      : "SHOW ME MORE RECIPES →"}
                  </button>
                </>
              )}
            </div>
          </section>
        )}

      <Footer />
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function UploadSuggestion({
  emoji,
  children,
}: {
  emoji: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-full border-2 border-black bg-white px-4 py-3 shadow-[3px_3px_0_#171717]">
      <span className="text-xl">
        {emoji}
      </span>

      <span>{children}</span>
    </div>
  );
}

function FilterSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t-3 border-black pt-6">
      <div className="mb-5 flex items-center gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-xs font-black">
          {number}
        </span>

        <h3 className="text-2xl font-black uppercase">
          {title}
        </h3>
      </div>

      {children}
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-3 border-black px-5 py-3 text-sm font-black uppercase transition-transform hover:-translate-y-1 ${
        active
          ? "bg-black text-white shadow-[3px_3px_0_#fff]"
          : "bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function MetaPill({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full border-2 border-black bg-[#ffe033] px-4 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#171717]">
      {children}
    </span>
  );
}

function Footer() {
  return (
    <footer className="border-t-4 border-black bg-[#171717] px-5 py-10 text-center text-white md:px-8">
      <div className="text-sm font-black uppercase tracking-[0.16em]">
        GOT DINNER?
      </div>

      <div className="mt-3 text-xs font-bold text-white/50">
        Powered by Google Gemini · Created by
        Keanu Magalhaes
      </div>
    </footer>
  );
}