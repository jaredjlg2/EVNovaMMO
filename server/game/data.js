const systems = [
  {
    id: "sol",
    name: "Sol",
    x: 0,
    y: 0,
    links: ["alpha", "vega"]
  },
  {
    id: "alpha",
    name: "Alpha Centauri",
    x: 140,
    y: -60,
    links: ["sol", "draco", "sirius"]
  },
  {
    id: "vega",
    name: "Vega",
    x: -160,
    y: 90,
    links: ["sol", "draco"]
  },
  {
    id: "draco",
    name: "Draco",
    x: 260,
    y: 70,
    links: ["alpha", "vega", "orion"]
  },
  {
    id: "sirius",
    name: "Sirius",
    x: 40,
    y: -200,
    links: ["alpha", "orion"]
  },
  {
    id: "orion",
    name: "Orion",
    x: 300,
    y: -160,
    links: ["draco", "sirius"]
  }
];

const planets = [
  {
    id: "earth",
    systemId: "sol",
    name: "Earth",
    outfitter: true,
    shipyard: true,
    missionBoard: true
  },
  {
    id: "luna",
    systemId: "sol",
    name: "Luna",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "new_turin",
    systemId: "alpha",
    name: "New Turin",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "vega_prime",
    systemId: "vega",
    name: "Vega Prime",
    outfitter: true,
    shipyard: true,
    missionBoard: false
  },
  {
    id: "sirius_port",
    systemId: "sirius",
    name: "Sirius Port",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "orion_tradehub",
    systemId: "orion",
    name: "Orion Tradehub",
    outfitter: true,
    shipyard: true,
    missionBoard: true
  }
];

const ships = [
  {
    id: "shuttle",
    name: "Drifter Shuttle",
    hull: 80,
    shield: 20,
    cargo: 12,
    fuel: 120,
    hardpoints: 2,
    secondaryHardpoints: 1,
    price: 0
  },
  {
    id: "courier",
    name: "Wayfarer Courier",
    hull: 140,
    shield: 60,
    cargo: 22,
    fuel: 180,
    hardpoints: 3,
    secondaryHardpoints: 1,
    price: 12000
  },
  {
    id: "frigate",
    name: "Frontier Frigate",
    hull: 240,
    shield: 110,
    cargo: 30,
    fuel: 200,
    hardpoints: 4,
    secondaryHardpoints: 2,
    price: 30000
  },
  {
    id: "sparrow_mk1",
    name: "Sparrow Mk I (Light Fighter)",
    hull: 110,
    shield: 40,
    cargo: 6,
    fuel: 140,
    hardpoints: 2,
    secondaryHardpoints: 1,
    price: 9000
  },
  {
    id: "sparrow_mk2",
    name: "Sparrow Mk II (Medium Fighter)",
    hull: 150,
    shield: 70,
    cargo: 8,
    fuel: 160,
    hardpoints: 3,
    secondaryHardpoints: 1,
    price: 16000
  },
  {
    id: "vanguard",
    name: "Vanguard Talon (Heavy Fighter)",
    hull: 200,
    shield: 110,
    cargo: 10,
    fuel: 180,
    hardpoints: 4,
    secondaryHardpoints: 2,
    price: 26000
  },
  {
    id: "wisp_runner",
    name: "Wisp Runner (Light Escort)",
    hull: 170,
    shield: 90,
    cargo: 12,
    fuel: 200,
    hardpoints: 4,
    secondaryHardpoints: 2,
    price: 22000
  },
  {
    id: "bastion_guard",
    name: "Bastion Guard (Medium Escort)",
    hull: 260,
    shield: 150,
    cargo: 18,
    fuel: 220,
    hardpoints: 5,
    secondaryHardpoints: 2,
    price: 38000
  },
  {
    id: "ironclad",
    name: "Ironclad Ward (Heavy Escort)",
    hull: 340,
    shield: 210,
    cargo: 22,
    fuel: 240,
    hardpoints: 6,
    secondaryHardpoints: 3,
    price: 52000
  },
  {
    id: "pioneer_hauler",
    name: "Pioneer Hauler (Small Freighter)",
    hull: 200,
    shield: 80,
    cargo: 45,
    fuel: 200,
    hardpoints: 2,
    secondaryHardpoints: 1,
    price: 24000
  },
  {
    id: "atlas_bulk",
    name: "Atlas Bulk (Medium Freighter)",
    hull: 280,
    shield: 120,
    cargo: 80,
    fuel: 240,
    hardpoints: 3,
    secondaryHardpoints: 1,
    price: 42000
  },
  {
    id: "caravel_super",
    name: "Caravel Super (Heavy Freighter)",
    hull: 360,
    shield: 160,
    cargo: 120,
    fuel: 260,
    hardpoints: 4,
    secondaryHardpoints: 2,
    price: 65000
  },
  {
    id: "nomad_liner",
    name: "Nomad Liner (Passenger Freighter)",
    hull: 240,
    shield: 130,
    cargo: 50,
    fuel: 260,
    hardpoints: 3,
    secondaryHardpoints: 1,
    price: 36000
  },
  {
    id: "ember_skiff",
    name: "Ember Skiff (Scout)",
    hull: 120,
    shield: 50,
    cargo: 10,
    fuel: 240,
    hardpoints: 2,
    secondaryHardpoints: 1,
    price: 14000
  },
  {
    id: "aurora_clipper",
    name: "Aurora Clipper (Fast Trader)",
    hull: 190,
    shield: 90,
    cargo: 32,
    fuel: 260,
    hardpoints: 3,
    secondaryHardpoints: 1,
    price: 28000
  }
];

const weapons = [
  {
    id: "pulse_laser",
    name: "Pulse Laser",
    damage: 12,
    energyCost: 5,
    slotType: "primary",
    price: 800
  },
  {
    id: "rail_cannon",
    name: "Rail Cannon",
    damage: 28,
    energyCost: 12,
    slotType: "primary",
    price: 2200
  },
  {
    id: "ion_blaster",
    name: "Ion Blaster",
    damage: 20,
    energyCost: 8,
    slotType: "primary",
    price: 1500
  },
  {
    id: "sting_missile",
    name: "Sting Missile Rack",
    damage: 40,
    energyCost: 18,
    slotType: "secondary",
    price: 3200
  },
  {
    id: "viper_rockets",
    name: "Viper Rocket Pod",
    damage: 55,
    energyCost: 24,
    slotType: "secondary",
    price: 4600
  },
  {
    id: "thunder_torpedo",
    name: "Thunder Torpedo Tube",
    damage: 80,
    energyCost: 34,
    slotType: "secondary",
    price: 6800
  }
];

const outfits = [
  {
    id: "cargo_expander",
    name: "Cargo Expander",
    effect: "+6 cargo capacity",
    price: 1200
  },
  {
    id: "shield_booster",
    name: "Shield Booster",
    effect: "+25 shield",
    price: 2000
  },
  {
    id: "fuel_cells",
    name: "Fuel Cells",
    effect: "+40 fuel",
    price: 900
  }
];

const missions = [
  {
    id: "med_delivery",
    title: "Medical Delivery",
    description: "Rush medical supplies to Orion Tradehub.",
    reward: 2400,
    fromPlanetId: "earth",
    toPlanetId: "orion_tradehub"
  },
  {
    id: "data_courier",
    title: "Encrypted Datapad",
    description: "Carry the encrypted datapad to New Turin.",
    reward: 1500,
    fromPlanetId: "luna",
    toPlanetId: "new_turin"
  },
  {
    id: "ore_contract",
    title: "Vega Ore Contract",
    description: "Deliver ore samples to Vega Prime.",
    reward: 1800,
    fromPlanetId: "sirius_port",
    toPlanetId: "vega_prime"
  }
];

const missionTemplates = [
  {
    id: "relief",
    type: "relief",
    title: "Relief Convoy",
    cargo: "relief supplies",
    baseReward: 900,
    rewardPerJump: 360,
    cargoSpace: 6,
    description:
      "Relief coordinators need {cargo} delivered to {destination}. Keep the timeline tight."
  },
  {
    id: "courier",
    type: "courier",
    title: "Priority Dispatch",
    cargo: "encrypted dispatches",
    baseReward: 650,
    rewardPerJump: 280,
    cargoSpace: 2,
    description: "Carry {cargo} from {origin} to {destination} without delays."
  },
  {
    id: "charter",
    type: "passenger",
    title: "Passenger Charter",
    cargo: "passenger accommodations",
    baseReward: 1200,
    rewardPerJump: 420,
    cargoSpace: 8,
    description: "Escort {cargo} from {origin} to {destination}. Discretion required."
  },
  {
    id: "survey",
    type: "survey",
    title: "Survey Drop",
    cargo: "survey drones",
    baseReward: 800,
    rewardPerJump: 320,
    cargoSpace: 4,
    description: "Deliver {cargo} to {destination} for a scheduled deployment."
  },
  {
    id: "salvage",
    type: "salvage",
    title: "Salvage Pickup",
    cargo: "salvage crates",
    baseReward: 1100,
    rewardPerJump: 380,
    cargoSpace: 10,
    description: "Retrieve {cargo} at {destination} for onward transfer."
  },
  {
    id: "security",
    type: "security",
    title: "Security Transfer",
    cargo: "security equipment",
    baseReward: 1000,
    rewardPerJump: 400,
    cargoSpace: 5,
    description: "Move {cargo} from {origin} to {destination}. Remain vigilant."
  }
];

const goods = [
  { id: "foodstuffs", name: "Foodstuffs", basePrice: 40 },
  { id: "textiles", name: "Textiles", basePrice: 55 },
  { id: "industrial_ore", name: "Industrial Ore", basePrice: 70 },
  { id: "machinery", name: "Machinery", basePrice: 120 },
  { id: "electronics", name: "Electronics", basePrice: 160 },
  { id: "medical_supplies", name: "Medical Supplies", basePrice: 150 },
  { id: "luxury_goods", name: "Luxury Goods", basePrice: 220 },
  { id: "refined_fuel", name: "Refined Fuel", basePrice: 90 }
];

const markets = {
  earth: {
    foodstuffs: "low",
    textiles: "low",
    industrial_ore: "medium",
    machinery: "high",
    electronics: "high",
    medical_supplies: "medium",
    luxury_goods: "high",
    refined_fuel: "medium"
  },
  luna: {
    foodstuffs: "high",
    textiles: "medium",
    industrial_ore: "medium",
    machinery: "medium",
    electronics: "medium",
    medical_supplies: "high",
    luxury_goods: "high",
    refined_fuel: "low"
  },
  new_turin: {
    foodstuffs: "medium",
    textiles: "medium",
    industrial_ore: "high",
    machinery: "low",
    electronics: "medium",
    medical_supplies: "medium",
    luxury_goods: "high",
    refined_fuel: "medium"
  },
  vega_prime: {
    foodstuffs: "medium",
    textiles: "high",
    industrial_ore: "low",
    machinery: "medium",
    electronics: "low",
    medical_supplies: "high",
    luxury_goods: "medium",
    refined_fuel: "medium"
  },
  sirius_port: {
    foodstuffs: "medium",
    textiles: "low",
    industrial_ore: "high",
    machinery: "medium",
    electronics: "medium",
    medical_supplies: "low",
    luxury_goods: "medium",
    refined_fuel: "high"
  },
  orion_tradehub: {
    foodstuffs: "high",
    textiles: "medium",
    industrial_ore: "low",
    machinery: "low",
    electronics: "high",
    medical_supplies: "medium",
    luxury_goods: "medium",
    refined_fuel: "high"
  }
};

const factions = [
  {
    id: "free_traders",
    name: "Free Traders Guild"
  },
  {
    id: "sol_defense",
    name: "Sol Defense Union"
  }
];

module.exports = {
  systems,
  planets,
  ships,
  weapons,
  outfits,
  missions,
  missionTemplates,
  goods,
  markets,
  factions
};
