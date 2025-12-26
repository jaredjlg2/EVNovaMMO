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
    name: "Courier",
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
