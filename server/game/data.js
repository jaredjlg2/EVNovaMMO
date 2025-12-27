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
    price: 28000
  }
];

const weapons = [
  {
    id: "pulse_laser",
    name: "Pulse Laser",
    damage: 12,
    energyCost: 5,
    price: 800
  },
  {
    id: "rail_cannon",
    name: "Rail Cannon",
    damage: 28,
    energyCost: 12,
    price: 2200
  },
  {
    id: "ion_blaster",
    name: "Ion Blaster",
    damage: 20,
    energyCost: 8,
    price: 1500
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
  factions
};
