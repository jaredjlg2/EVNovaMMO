const systems = [
  {
    id: "sol",
    name: "Sol",
    x: 0,
    y: 0,
    links: ["deneb", "altair", "arcadia"],
    factionId: "sol_defense",
    status: "core",
    traffic: "heavy"
  },
  {
    id: "deneb",
    name: "Deneb",
    x: 140,
    y: -40,
    links: ["sol", "helios", "riftwatch"],
    factionId: "sol_defense",
    status: "core",
    traffic: "medium"
  },
  {
    id: "altair",
    name: "Altair",
    x: -120,
    y: -40,
    links: ["sol", "new_eden", "redoubt"],
    factionId: "sol_defense",
    status: "core",
    traffic: "medium"
  },
  {
    id: "arcadia",
    name: "Arcadia",
    x: 80,
    y: 120,
    links: ["sol", "helios", "borealis_gate"],
    factionId: "sol_defense",
    status: "core",
    traffic: "medium"
  },
  {
    id: "helios",
    name: "Helios",
    x: 200,
    y: 60,
    links: ["deneb", "arcadia", "lancer"],
    factionId: "sol_defense",
    status: "core",
    traffic: "heavy"
  },
  {
    id: "new_eden",
    name: "New Eden",
    x: -140,
    y: 120,
    links: ["altair", "cinder", "borealis_gate"],
    factionId: "sol_defense",
    status: "core",
    traffic: "medium"
  },
  {
    id: "borealis_gate",
    name: "Borealis Gate",
    x: 0,
    y: 220,
    links: ["arcadia", "new_eden", "borealis", "windfall"],
    factionId: "sol_defense",
    status: "border",
    traffic: "medium",
    disputedWith: ["outer_rim_compact"]
  },
  {
    id: "cinder",
    name: "Cinder",
    x: -220,
    y: 140,
    links: ["new_eden", "vega", "bastion"],
    factionId: "sol_defense",
    status: "border",
    traffic: "medium",
    disputedWith: ["vega_combine"]
  },
  {
    id: "lancer",
    name: "Lancer",
    x: 220,
    y: 200,
    links: ["helios", "aurora", "arkady"],
    factionId: "sol_defense",
    status: "border",
    traffic: "medium",
    disputedWith: ["orion_regency"]
  },
  {
    id: "redoubt",
    name: "Redoubt",
    x: -20,
    y: -200,
    links: ["altair", "sirius", "scar"],
    factionId: "sol_defense",
    status: "border",
    traffic: "medium",
    disputedWith: ["sirius_concord"]
  },
  {
    id: "riftwatch",
    name: "Riftwatch",
    x: 200,
    y: -200,
    links: ["deneb", "crown", "duskfall"],
    factionId: "sol_defense",
    status: "border",
    traffic: "medium",
    disputedWith: ["orion_regency", "sirius_concord"]
  },
  {
    id: "scar",
    name: "Scar",
    x: -160,
    y: -140,
    links: ["redoubt", "draco", "ember"],
    factionId: "sol_defense",
    status: "border",
    traffic: "light",
    disputedWith: ["draco_syndicate", "sirius_concord"]
  },
  {
    id: "vega",
    name: "Vega",
    x: -360,
    y: 120,
    links: ["cinder", "auriga", "windfall", "lyra"],
    factionId: "vega_combine",
    status: "core",
    traffic: "heavy"
  },
  {
    id: "auriga",
    name: "Auriga",
    x: -420,
    y: 0,
    links: ["vega", "cygnus", "ember"],
    factionId: "vega_combine",
    status: "core",
    traffic: "medium"
  },
  {
    id: "lyra",
    name: "Lyra",
    x: -480,
    y: 200,
    links: ["vega", "polaris", "cygnus"],
    factionId: "vega_combine",
    status: "core",
    traffic: "medium"
  },
  {
    id: "cygnus",
    name: "Cygnus",
    x: -520,
    y: 80,
    links: ["auriga", "lyra", "polaris"],
    factionId: "vega_combine",
    status: "core",
    traffic: "light"
  },
  {
    id: "polaris",
    name: "Polaris",
    x: -560,
    y: 260,
    links: ["lyra", "cygnus", "tundra"],
    factionId: "vega_combine",
    status: "frontier",
    traffic: "light"
  },
  {
    id: "windfall",
    name: "Windfall",
    x: -340,
    y: 260,
    links: ["vega", "zenith", "borealis_gate"],
    factionId: "vega_combine",
    status: "border",
    traffic: "medium",
    disputedWith: ["outer_rim_compact"]
  },
  {
    id: "ember",
    name: "Ember",
    x: -320,
    y: -80,
    links: ["auriga", "draco", "scar"],
    factionId: "vega_combine",
    status: "border",
    traffic: "medium",
    disputedWith: ["draco_syndicate", "sol_defense"]
  },
  {
    id: "draco",
    name: "Draco",
    x: -260,
    y: -200,
    links: ["scar", "ember", "bastion", "obsidian"],
    factionId: "draco_syndicate",
    status: "core",
    traffic: "medium"
  },
  {
    id: "bastion",
    name: "Bastion",
    x: -340,
    y: -140,
    links: ["draco", "fenrir", "cinder"],
    factionId: "draco_syndicate",
    status: "border",
    traffic: "medium",
    disputedWith: ["vega_combine", "sol_defense"]
  },
  {
    id: "fenrir",
    name: "Fenrir",
    x: -380,
    y: -260,
    links: ["bastion", "azrael"],
    factionId: "draco_syndicate",
    status: "core",
    traffic: "light"
  },
  {
    id: "azrael",
    name: "Azrael",
    x: -220,
    y: -320,
    links: ["fenrir", "obsidian", "numen"],
    factionId: "draco_syndicate",
    status: "frontier",
    traffic: "light"
  },
  {
    id: "obsidian",
    name: "Obsidian",
    x: -120,
    y: -280,
    links: ["draco", "azrael", "helene"],
    factionId: "draco_syndicate",
    status: "core",
    traffic: "medium"
  },
  {
    id: "sirius",
    name: "Sirius",
    x: 20,
    y: -360,
    links: ["redoubt", "helene", "valkyr"],
    factionId: "sirius_concord",
    status: "core",
    traffic: "medium"
  },
  {
    id: "helene",
    name: "Helene",
    x: -120,
    y: -420,
    links: ["sirius", "obsidian", "numen"],
    factionId: "sirius_concord",
    status: "core",
    traffic: "light"
  },
  {
    id: "valkyr",
    name: "Valkyr",
    x: 200,
    y: -360,
    links: ["sirius", "mirage", "duskfall"],
    factionId: "sirius_concord",
    status: "core",
    traffic: "medium"
  },
  {
    id: "mirage",
    name: "Mirage",
    x: 120,
    y: -420,
    links: ["valkyr", "numen", "miranda"],
    factionId: "sirius_concord",
    status: "core",
    traffic: "light"
  },
  {
    id: "numen",
    name: "Numen",
    x: 0,
    y: -480,
    links: ["helene", "mirage", "azrael"],
    factionId: "sirius_concord",
    status: "frontier",
    traffic: "light"
  },
  {
    id: "duskfall",
    name: "Duskfall",
    x: 140,
    y: -280,
    links: ["valkyr", "riftwatch", "crown"],
    factionId: "sirius_concord",
    status: "border",
    traffic: "medium",
    disputedWith: ["orion_regency", "sol_defense"]
  },
  {
    id: "orion",
    name: "Orion",
    x: 360,
    y: -80,
    links: ["aurora", "castor", "crown"],
    factionId: "orion_regency",
    status: "core",
    traffic: "heavy"
  },
  {
    id: "castor",
    name: "Castor",
    x: 420,
    y: 40,
    links: ["orion", "palatine", "aurora"],
    factionId: "orion_regency",
    status: "core",
    traffic: "medium"
  },
  {
    id: "palatine",
    name: "Palatine",
    x: 520,
    y: -20,
    links: ["castor", "eridani", "drifts"],
    factionId: "orion_regency",
    status: "core",
    traffic: "medium"
  },
  {
    id: "eridani",
    name: "Eridani",
    x: 480,
    y: -140,
    links: ["palatine", "miranda"],
    factionId: "orion_regency",
    status: "core",
    traffic: "light"
  },
  {
    id: "miranda",
    name: "Miranda",
    x: 440,
    y: -260,
    links: ["eridani", "mirage", "crown"],
    factionId: "orion_regency",
    status: "border",
    traffic: "medium",
    disputedWith: ["sirius_concord"]
  },
  {
    id: "aurora",
    name: "Aurora",
    x: 300,
    y: 40,
    links: ["orion", "castor", "lancer"],
    factionId: "orion_regency",
    status: "border",
    traffic: "medium",
    disputedWith: ["sol_defense"]
  },
  {
    id: "crown",
    name: "Crown",
    x: 300,
    y: -200,
    links: ["orion", "riftwatch", "miranda", "duskfall"],
    factionId: "orion_regency",
    status: "border",
    traffic: "medium",
    disputedWith: ["sirius_concord", "sol_defense"]
  },
  {
    id: "borealis",
    name: "Borealis",
    x: 0,
    y: 360,
    links: ["borealis_gate", "kepler", "zenith"],
    factionId: "outer_rim_compact",
    status: "core",
    traffic: "light"
  },
  {
    id: "kepler",
    name: "Kepler",
    x: 120,
    y: 420,
    links: ["borealis", "arkady", "drifts"],
    factionId: "outer_rim_compact",
    status: "core",
    traffic: "light"
  },
  {
    id: "luyten",
    name: "Luyten",
    x: -80,
    y: 460,
    links: ["zenith", "tundra"],
    factionId: "outer_rim_compact",
    status: "core",
    traffic: "light"
  },
  {
    id: "arkady",
    name: "Arkady",
    x: 200,
    y: 340,
    links: ["kepler", "lancer", "drifts"],
    factionId: "outer_rim_compact",
    status: "border",
    traffic: "medium",
    disputedWith: ["orion_regency", "sol_defense"]
  },
  {
    id: "zenith",
    name: "Zenith",
    x: -200,
    y: 360,
    links: ["borealis", "windfall", "luyten", "tundra"],
    factionId: "outer_rim_compact",
    status: "core",
    traffic: "light"
  },
  {
    id: "drifts",
    name: "Drifts",
    x: 260,
    y: 440,
    links: ["kepler", "arkady", "palatine"],
    factionId: "outer_rim_compact",
    status: "frontier",
    traffic: "light"
  },
  {
    id: "tundra",
    name: "Tundra",
    x: -260,
    y: 420,
    links: ["zenith", "polaris", "luyten"],
    factionId: "outer_rim_compact",
    status: "frontier",
    traffic: "light"
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
    id: "deneb_prime",
    systemId: "deneb",
    name: "Deneb Prime",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "altair_station",
    systemId: "altair",
    name: "Altair Station",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "arcadia_haven",
    systemId: "arcadia",
    name: "Arcadia Haven",
    outfitter: false,
    shipyard: true,
    missionBoard: true
  },
  {
    id: "helios_gate",
    systemId: "helios",
    name: "Helios Gate",
    outfitter: true,
    shipyard: true,
    missionBoard: true
  },
  {
    id: "new_eden",
    systemId: "new_eden",
    name: "New Eden",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "borealis_outpost",
    systemId: "borealis_gate",
    name: "Borealis Outpost",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "cinder_market",
    systemId: "cinder",
    name: "Cinder Market",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "lancer_hold",
    systemId: "lancer",
    name: "Lancer Hold",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "redoubt_station",
    systemId: "redoubt",
    name: "Redoubt Station",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "riftwatch_ring",
    systemId: "riftwatch",
    name: "Riftwatch Ring",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "scar_relay",
    systemId: "scar",
    name: "Scar Relay",
    outfitter: false,
    shipyard: false,
    missionBoard: true,
    blackMarket: true
  },
  {
    id: "vega_prime",
    systemId: "vega",
    name: "Vega Prime",
    outfitter: true,
    shipyard: true,
    missionBoard: true
  },
  {
    id: "auriga_foundry",
    systemId: "auriga",
    name: "Auriga Foundry",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "lyra_port",
    systemId: "lyra",
    name: "Lyra Port",
    outfitter: false,
    shipyard: true,
    missionBoard: true
  },
  {
    id: "cygnus_spire",
    systemId: "cygnus",
    name: "Cygnus Spire",
    outfitter: true,
    shipyard: false,
    missionBoard: false
  },
  {
    id: "polaris_crown",
    systemId: "polaris",
    name: "Polaris Crown",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "windfall_crossing",
    systemId: "windfall",
    name: "Windfall Crossing",
    outfitter: false,
    shipyard: false,
    missionBoard: true,
    blackMarket: true
  },
  {
    id: "ember_yards",
    systemId: "ember",
    name: "Ember Yards",
    outfitter: true,
    shipyard: false,
    missionBoard: true,
    blackMarket: true
  },
  {
    id: "draco_den",
    systemId: "draco",
    name: "Draco Den",
    outfitter: true,
    shipyard: true,
    missionBoard: true,
    blackMarket: true
  },
  {
    id: "bastion_ring",
    systemId: "bastion",
    name: "Bastion Ring",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "fenrir_keep",
    systemId: "fenrir",
    name: "Fenrir Keep",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "azrael_deep",
    systemId: "azrael",
    name: "Azrael Deep",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "obsidian_forge",
    systemId: "obsidian",
    name: "Obsidian Forge",
    outfitter: true,
    shipyard: false,
    missionBoard: true
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
    id: "helene_gardens",
    systemId: "helene",
    name: "Helene Gardens",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "valkyr_point",
    systemId: "valkyr",
    name: "Valkyr Point",
    outfitter: false,
    shipyard: true,
    missionBoard: true
  },
  {
    id: "mirage_atrium",
    systemId: "mirage",
    name: "Mirage Atrium",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "numen_station",
    systemId: "numen",
    name: "Numen Station",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "duskfall_gate",
    systemId: "duskfall",
    name: "Duskfall Gate",
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
  },
  {
    id: "castor_highport",
    systemId: "castor",
    name: "Castor Highport",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "palatine_court",
    systemId: "palatine",
    name: "Palatine Court",
    outfitter: false,
    shipyard: true,
    missionBoard: true
  },
  {
    id: "eridani_colony",
    systemId: "eridani",
    name: "Eridani Colony",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "miranda_quay",
    systemId: "miranda",
    name: "Miranda Quay",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "aurora_enclave",
    systemId: "aurora",
    name: "Aurora Enclave",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "crown_bastion",
    systemId: "crown",
    name: "Crown Bastion",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "borealis_haven",
    systemId: "borealis",
    name: "Borealis Haven",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "kepler_dock",
    systemId: "kepler",
    name: "Kepler Dock",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "luyten_refuge",
    systemId: "luyten",
    name: "Luyten Refuge",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "arkady_port",
    systemId: "arkady",
    name: "Arkady Port",
    outfitter: true,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "zenith_hub",
    systemId: "zenith",
    name: "Zenith Hub",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "drifts_outpost",
    systemId: "drifts",
    name: "Drifts Outpost",
    outfitter: false,
    shipyard: false,
    missionBoard: true
  },
  {
    id: "tundra_keep",
    systemId: "tundra",
    name: "Tundra Keep",
    outfitter: false,
    shipyard: false,
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
    price: 30000,
    defaultSecondaryWeapons: ["radar_missile_launcher"],
    defaultSecondaryAmmo: { radar_missile: 6 }
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
    price: 9000,
    defaultSecondaryWeapons: ["radar_missile_launcher"],
    defaultSecondaryAmmo: { radar_missile: 4 }
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
    price: 16000,
    defaultSecondaryWeapons: ["radar_missile_launcher"],
    defaultSecondaryAmmo: { radar_missile: 6 }
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
    price: 26000,
    defaultSecondaryWeapons: ["radar_missile_launcher"],
    defaultSecondaryAmmo: { radar_missile: 8 }
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
    price: 22000,
    defaultSecondaryWeapons: ["radar_missile_launcher"],
    defaultSecondaryAmmo: { radar_missile: 6 }
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
    price: 38000,
    defaultSecondaryWeapons: ["radar_missile_launcher"],
    defaultSecondaryAmmo: { radar_missile: 8 }
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
    price: 52000,
    defaultSecondaryWeapons: ["radar_missile_launcher"],
    defaultSecondaryAmmo: { radar_missile: 10 }
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
    id: "radar_missile_launcher",
    name: "Radar Missile Launcher",
    damage: 0,
    energyCost: 0,
    slotType: "secondary",
    ammoType: "radar_missile",
    requiresLock: true,
    price: 5200
  },
  {
    id: "radar_missile",
    name: "Radar Missile",
    damage: 70,
    energyCost: 0,
    slotType: "secondaryAmmo",
    ammoFor: "radar_missile_launcher",
    homing: true,
    projectileSpeed: 320,
    projectileLife: 2.6,
    turnRate: 4.5,
    range: 900,
    price: 350
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
  },
  {
    id: "quantum_core",
    name: "Quantum Core",
    effect: "+120 shield · +80 fuel",
    price: 1800000
  }
];

const missions = [
  {
    id: "med_delivery",
    title: "Medical Delivery",
    description: "Rush medical supplies to Orion Tradehub.",
    reward: 12000,
    fromPlanetId: "earth",
    toPlanetId: "orion_tradehub"
  },
  {
    id: "data_courier",
    title: "Encrypted Datapad",
    description: "Carry the encrypted datapad to New Turin.",
    reward: 8000,
    fromPlanetId: "luna",
    toPlanetId: "new_turin"
  },
  {
    id: "ore_contract",
    title: "Vega Ore Contract",
    description: "Deliver ore samples to Vega Prime.",
    reward: 15000,
    fromPlanetId: "sirius_port",
    toPlanetId: "vega_prime"
  }
];

const missionTemplates = [
  {
    id: "fuel_refill",
    type: "fuel_refill",
    title: "Fuel Refill",
    cargo: "refined fuel",
    baseReward: 2000,
    rewardPerJump: 120,
    minReward: 2000,
    maxReward: 2600,
    cargoSpace: 2,
    weight: 1.1,
    description: "Deliver {cargo} to {destination} to top off a convoy."
  },
  {
    id: "courier",
    type: "courier",
    title: "Priority Dispatch",
    cargo: "encrypted dispatches",
    baseReward: 7000,
    rewardPerJump: 2000,
    minReward: 5000,
    maxReward: 15000,
    cargoSpace: 2,
    weight: 1.2,
    description: "Carry {cargo} from {origin} to {destination} without delays."
  },
  {
    id: "passenger",
    type: "passenger",
    title: "Passenger Charter",
    cargo: "passenger accommodations",
    baseReward: 6000,
    rewardPerJump: 2200,
    minReward: 5000,
    maxReward: 15000,
    cargoSpace: 8,
    weight: 1.1,
    description: "Escort {cargo} from {origin} to {destination}. Discretion required."
  },
  {
    id: "delivery",
    type: "delivery",
    title: "Commercial Delivery",
    cargo: "trade bundles",
    baseReward: 10000,
    rewardPerJump: 4200,
    minReward: 10000,
    maxReward: 20000,
    cargoSpace: 10,
    weight: 1.4,
    description: "Move {cargo} from {origin} to {destination}. Standard priority."
  },
  {
    id: "escort",
    type: "escort",
    title: "Escort & Special Delivery",
    cargo: "priority cargo",
    baseReward: 26000,
    rewardPerJump: 5200,
    minReward: 30000,
    maxReward: 42000,
    cargoSpace: 12,
    weight: 0.9,
    minCombatRating: 3,
    description: "Protect {cargo} en route to {destination}. Hostile contacts expected."
  },
  {
    id: "equipment",
    type: "equipment",
    title: "Equipment Delivery",
    cargo: "industrial gear",
    baseReward: 28000,
    rewardPerJump: 4800,
    minReward: 30000,
    maxReward: 42000,
    cargoSpace: 10,
    weight: 0.9,
    description: "Deliver {cargo} to {destination} under strict handling protocols."
  },
  {
    id: "united_shipping",
    type: "united_shipping",
    title: "United Shipping Contract",
    cargo: "United Shipping freight",
    baseReward: 12000,
    rewardPerJump: 9000,
    minReward: 10000,
    maxReward: 50000,
    cargoSpace: 14,
    weight: 0.9,
    minReputation: 5,
    maxLegalStatus: 60,
    description: "Fulfill a United Shipping freight run to {destination}."
  },
  {
    id: "special_mission",
    type: "special",
    title: "Special Assignment",
    cargo: "secure package",
    baseReward: 50000,
    rewardPerJump: 0,
    minReward: 50000,
    maxReward: 50000,
    cargoSpace: 4,
    weight: 0.3,
    minReputation: 12,
    maxLegalStatus: 55,
    description: "Confidential cargo needs delivery to {destination}. One-off assignment."
  },
  {
    id: "rush_delivery",
    type: "rush",
    title: "Rush Delivery",
    cargo: "urgent medical relay",
    baseReward: 32000,
    rewardPerJump: 11000,
    minReward: 30000,
    maxReward: 60000,
    cargoSpace: 8,
    weight: 0.8,
    timeLimitMinutes: 18,
    description: "Rush {cargo} to {destination}. Delays void the bonus."
  },
  {
    id: "rescue",
    type: "rescue",
    title: "Rescue Operation",
    cargo: "rescue survivors",
    baseReward: 75000,
    rewardPerJump: 6000,
    minReward: 75000,
    maxReward: 95000,
    cargoSpace: 12,
    weight: 0.6,
    minCombatRating: 4,
    maxLegalStatus: 60,
    description: "Extract {cargo} from {destination} and return safely."
  },
  {
    id: "colonist",
    type: "colonist",
    title: "Colonist Transport",
    cargo: "colonist berths",
    baseReward: 75000,
    rewardPerJump: 7000,
    minReward: 75000,
    maxReward: 100000,
    cargoSpace: 18,
    weight: 0.6,
    minReputation: 8,
    maxLegalStatus: 60,
    description: "Relocate {cargo} to {destination}. Comfort is mandatory."
  },
  {
    id: "mining",
    type: "mining",
    title: "Asteroid Mining Run",
    cargo: "mineral crates",
    baseReward: 150000,
    rewardPerJump: 0,
    minReward: 150000,
    maxReward: 150000,
    cargoSpace: 20,
    weight: 0.5,
    minCombatRating: 6,
    description: "Collect {cargo} from {destination} and return with a full haul."
  },
  {
    id: "us_long",
    type: "united_shipping_long",
    title: "United Shipping Long Haul",
    cargo: "sealed freight",
    baseReward: 120000,
    rewardPerJump: 90000,
    minReward: 100000,
    maxReward: 500000,
    cargoSpace: 20,
    weight: 0.3,
    minReputation: 15,
    timeLimitMinutes: 28,
    description:
      "Long-haul delivery to {destination}. Tight deadline and inspection risk."
  },
  {
    id: "smuggling",
    type: "smuggling",
    title: "Smuggling Run",
    cargo: "restricted cargo",
    baseReward: 180000,
    rewardPerJump: 70000,
    minReward: 200000,
    maxReward: 450000,
    cargoSpace: 12,
    weight: 0.35,
    minCombatRating: 4,
    maxLegalStatus: 70,
    requiresBlackMarket: true,
    description: "Slip {cargo} to {destination} without drawing scans."
  },
  {
    id: "domination",
    type: "domination",
    title: "Planetary Domination",
    cargo: "occupation supplies",
    baseReward: 50000,
    rewardPerJump: 0,
    minReward: 50000,
    maxReward: 50000,
    cargoSpace: 16,
    weight: 0.2,
    minCombatRating: 8,
    description:
      "Land {cargo} on {destination} and establish a tribute regime."
  },
  {
    id: "bounty_small",
    type: "bounty",
    title: "Local Bounty",
    cargo: "bounty directive",
    baseReward: 22500,
    rewardPerJump: 0,
    minReward: 22500,
    maxReward: 22500,
    cargoSpace: 0,
    weight: 0.8,
    targetRoles: ["shuttle", "courier", "scout"],
    description: "Eliminate a petty raider near {destination} and report back."
  },
  {
    id: "bounty_medium",
    type: "bounty",
    title: "Regional Bounty",
    cargo: "bounty directive",
    baseReward: 65000,
    rewardPerJump: 0,
    minReward: 45000,
    maxReward: 90000,
    cargoSpace: 0,
    weight: 0.6,
    minCombatRating: 4,
    targetRoles: ["fighter", "escort"],
    description: "Track and neutralize a hostile patrol near {destination}."
  },
  {
    id: "bounty_large",
    type: "bounty",
    title: "High-Value Bounty",
    cargo: "bounty directive",
    baseReward: 120000,
    rewardPerJump: 0,
    minReward: 90000,
    maxReward: 135000,
    cargoSpace: 0,
    weight: 0.4,
    minCombatRating: 7,
    targetRoles: ["freighter", "frigate"],
    description: "Hunt down a dangerous target operating near {destination}."
  }
];

const goods = [
  { id: "foodstuffs", name: "Foodstuffs", basePrice: 2000 },
  { id: "textiles", name: "Textiles", basePrice: 3000 },
  { id: "industrial_ore", name: "Industrial Ore", basePrice: 4500 },
  { id: "machinery", name: "Machinery", basePrice: 9000 },
  { id: "electronics", name: "Electronics", basePrice: 12000 },
  { id: "medical_supplies", name: "Medical Supplies", basePrice: 10000 },
  { id: "luxury_goods", name: "Luxury Goods", basePrice: 18000 },
  { id: "refined_fuel", name: "Refined Fuel", basePrice: 6000 },
  { id: "salvaged_components", name: "Salvaged Components", basePrice: 38000 },
  { id: "prototype_cores", name: "Prototype Cores", basePrice: 52000 },
  {
    id: "shadow_stims",
    name: "Shadow Stims",
    basePrice: 26000,
    isContraband: true
  },
  {
    id: "illegal_weapons",
    name: "Illegal Weapons",
    basePrice: 32000,
    isContraband: true
  },
  {
    id: "forbidden_artifacts",
    name: "Forbidden Artifacts",
    basePrice: 60000,
    isContraband: true
  }
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
  deneb_prime: {
    foodstuffs: "medium",
    textiles: "medium",
    industrial_ore: "medium",
    machinery: "high",
    electronics: "high",
    medical_supplies: "medium",
    luxury_goods: "high",
    refined_fuel: "medium"
  },
  helios_gate: {
    foodstuffs: "medium",
    textiles: "low",
    industrial_ore: "medium",
    machinery: "high",
    electronics: "high",
    medical_supplies: "medium",
    luxury_goods: "medium",
    refined_fuel: "high"
  },
  new_eden: {
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
  auriga_foundry: {
    foodstuffs: "medium",
    textiles: "low",
    industrial_ore: "high",
    machinery: "high",
    electronics: "medium",
    medical_supplies: "low",
    luxury_goods: "low",
    refined_fuel: "medium"
  },
  windfall_crossing: {
    foodstuffs: "high",
    textiles: "medium",
    industrial_ore: "medium",
    machinery: "low",
    electronics: "medium",
    medical_supplies: "medium",
    luxury_goods: "high",
    refined_fuel: "high"
  },
  ember_yards: {
    foodstuffs: "medium",
    textiles: "low",
    industrial_ore: "high",
    machinery: "high",
    electronics: "low",
    medical_supplies: "low",
    luxury_goods: "medium",
    refined_fuel: "high"
  },
  draco_den: {
    foodstuffs: "low",
    textiles: "low",
    industrial_ore: "high",
    machinery: "high",
    electronics: "medium",
    medical_supplies: "low",
    luxury_goods: "high",
    refined_fuel: "high"
  },
  obsidian_forge: {
    foodstuffs: "low",
    textiles: "low",
    industrial_ore: "high",
    machinery: "high",
    electronics: "medium",
    medical_supplies: "low",
    luxury_goods: "medium",
    refined_fuel: "high"
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
  helene_gardens: {
    foodstuffs: "high",
    textiles: "medium",
    industrial_ore: "low",
    machinery: "low",
    electronics: "medium",
    medical_supplies: "high",
    luxury_goods: "high",
    refined_fuel: "low"
  },
  valkyr_point: {
    foodstuffs: "medium",
    textiles: "medium",
    industrial_ore: "medium",
    machinery: "high",
    electronics: "high",
    medical_supplies: "medium",
    luxury_goods: "medium",
    refined_fuel: "medium"
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
  },
  palatine_court: {
    foodstuffs: "medium",
    textiles: "high",
    industrial_ore: "low",
    machinery: "medium",
    electronics: "high",
    medical_supplies: "medium",
    luxury_goods: "high",
    refined_fuel: "medium"
  },
  miranda_quay: {
    foodstuffs: "medium",
    textiles: "medium",
    industrial_ore: "medium",
    machinery: "low",
    electronics: "high",
    medical_supplies: "medium",
    luxury_goods: "high",
    refined_fuel: "medium"
  },
  crown_bastion: {
    foodstuffs: "low",
    textiles: "low",
    industrial_ore: "high",
    machinery: "high",
    electronics: "medium",
    medical_supplies: "low",
    luxury_goods: "medium",
    refined_fuel: "high"
  },
  borealis_haven: {
    foodstuffs: "high",
    textiles: "medium",
    industrial_ore: "low",
    machinery: "low",
    electronics: "medium",
    medical_supplies: "high",
    luxury_goods: "high",
    refined_fuel: "low"
  }
};

const tradeRoutes = [
  {
    id: "sol_relief_loop",
    name: "Sol Relief Loop",
    fromPlanetId: "earth",
    toPlanetId: "orion_tradehub",
    goodId: "medical_supplies"
  },
  {
    id: "vega_industrial",
    name: "Vega Industrial Exchange",
    fromPlanetId: "auriga_foundry",
    toPlanetId: "earth",
    goodId: "machinery"
  },
  {
    id: "luxury_spiral",
    name: "Luxury Spiral",
    fromPlanetId: "palatine_court",
    toPlanetId: "draco_den",
    goodId: "luxury_goods"
  },
  {
    id: "fuel_corridor",
    name: "Fuel Corridor",
    fromPlanetId: "crown_bastion",
    toPlanetId: "orion_tradehub",
    goodId: "refined_fuel"
  }
];

const factions = [
  {
    id: "free_traders",
    name: "Free Traders Guild",
    code: "FTG",
    description:
      "Independent merchants and couriers who keep the trade lanes flowing regardless of politics.",
    homeSystemId: "sol"
  },
  {
    id: "sol_defense",
    name: "Sol Defense Union",
    code: "SDU",
    description:
      "An old military compact holding the Sol core, focused on stability and disciplined patrols.",
    homeSystemId: "sol"
  },
  {
    id: "vega_combine",
    name: "Vega Combine",
    code: "VGC",
    description:
      "Industrial trade houses clustered around Vega, leveraging cargo fleets and corporate security.",
    homeSystemId: "vega"
  },
  {
    id: "orion_regency",
    name: "Orion Regency",
    code: "ORG",
    description:
      "An aristocratic regime with elite escort wings guarding the eastern corridors.",
    homeSystemId: "orion"
  },
  {
    id: "draco_syndicate",
    name: "Draco Syndicate",
    code: "DRS",
    description:
      "A shadow network of raiders and salvagers, thriving in volatile border zones.",
    homeSystemId: "draco"
  },
  {
    id: "sirius_concord",
    name: "Sirius Concord",
    code: "SRC",
    description:
      "A coalition of sanctuary systems known for fast response fleets and humanitarian convoys.",
    homeSystemId: "sirius"
  },
  {
    id: "outer_rim_compact",
    name: "Outer Rim Compact",
    code: "ORC",
    description:
      "Frontier cooperatives that barter passage and defense across the far northern rim.",
    homeSystemId: "borealis"
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
  tradeRoutes,
  factions
};
