interface CardRarities {
    [key: string]: {
      rarities: string[];
    };
  }
  
export const cardRarities: CardRarities = {
    MTG: {
      rarities: [
        "Common",
        "Uncommon",
        "Rare",
        "Mythic Rare",
        "Special / Bonus Cards",
        "Basic Land",
        "Masterpiece Series",
        "Promos",
        "Extended Art",
        "Borderless",
      ],
    },
    Pokemon: {
      rarities: [
        "Common",
        "Uncommon",
        "Rare",
        "Holo Rare",
        "Reverse Holo",
        "Rare Holo V",
        "Ultra Rare",
        "Full Art",
        "Secret Rare",
        "Amazing Rare",
        "Rainbow Rare",
        "Gold Secret Rare",
        "Promos",
        "Radiant Collection",
      ],
    },
    Yugioh: {
      rarities: [
        "Common",
        "Rare",
        "Super Rare",
        "Ultra Rare",
        "Secret Rare",
        "Ultimate Rare",
        "Ghost Rare",
        "Starlight Rare",
        "Collector's Rare",
        "Prismatic Secret Rare",
        "Parallel Rare",
        "Platinum Rare",
      ],
    },
  };
  
  export const qualityList = [
    "Mint",
    "Near Mint",
    "Lightly Played",
    "Moderately Played",
    "Heavily Played",
    "Damaged",
  ];