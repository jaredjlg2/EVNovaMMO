const systems = require("./systems.json");

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

const ships = require("./ships.json");

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

const storyArcs = [
  {
    id: "solar_directorate",
    name: "Solar Directorate",
    theme: "Authority/Military",
    startTriggers: [
      "Accept Directorate contract",
      "Pass initial loyalty test"
    ],
    consequences: [
      "Access to military ships/outfits",
      "Hostile to rebels and raiders"
    ],
    mechanics: [
      "Rank ladder",
      "License-locked weapons",
      "Legal immunity"
    ],
    primaryFactionId: "solar_directorate",
    pointOfNoReturnStep: 4
  },
  {
    id: "ironclad_clans",
    name: "Ironclad Clans",
    theme: "Warrior Tribes",
    startTriggers: ["Win clan duel", "Clan sponsorship received"],
    consequences: ["Unlock clan ranks", "Rival clans auto-hostile"],
    mechanics: ["Duel mode", "Honor score affects shops"],
    primaryFactionId: "ironclad_clans",
    pointOfNoReturnStep: 3
  },
  {
    id: "echotrail_communion",
    name: "Echotrail Communion",
    theme: "Psychic/Ancient",
    startTriggers: ["Contact Communion emissary", "Artifact encounter"],
    consequences: ["Psychic systems replace weapons", "Banned from most shipyards"],
    mechanics: ["Psychic abilities", "Isolation travel restrictions"],
    primaryFactionId: "echotrail_communion",
    pointOfNoReturnStep: 3
  },
  {
    id: "luminari_compact",
    name: "Luminari Compact",
    theme: "Hypertech Isolationists",
    startTriggers: ["Aid stranded Luminari scientist"],
    consequences: ["Access hypergates", "Illegal tech in most jurisdictions"],
    mechanics: ["Hypergate travel", "Exotic fuels", "Contraband scan flags"],
    primaryFactionId: "luminari_compact",
    pointOfNoReturnStep: 3
  },
  {
    id: "free_horizons_guild",
    name: "Free Horizons Guild",
    theme: "Independent/Mercenary",
    startTriggers: [
      "Reject faction invitations",
      "Complete freelancer job chain"
    ],
    consequences: [
      "Neutral baseline reputation",
      "Flexible access without unique tech"
    ],
    mechanics: ["Contract chains", "Dynamic reputation neutrality"],
    primaryFactionId: "free_horizons_guild",
    pointOfNoReturnStep: 4
  },
  {
    id: "black_flag_syndicate",
    name: "Black Flag Syndicate",
    theme: "Pirate/Underworld",
    startTriggers: [
      "Commit crime intentionally",
      "Accept Syndicate contract"
    ],
    consequences: [
      "Access contraband markets",
      "Pursued by authorities"
    ],
    mechanics: ["Boarding boosts", "Auto-bounty increases"],
    primaryFactionId: "black_flag_syndicate",
    pointOfNoReturnStep: 3
  },
  {
    id: "starseed_foundation",
    name: "Starseed Foundation",
    theme: "Terraformers/Colonists",
    startTriggers: [
      "Deliver colony seed ships",
      "Prove logistics capability"
    ],
    consequences: [
      "Colonization income",
      "Unlock new worlds"
    ],
    mechanics: ["Colony development", "Passive income streams"],
    primaryFactionId: "starseed_foundation",
    pointOfNoReturnStep: 4
  },
  {
    id: "obsidian_covenant",
    name: "Obsidian Covenant",
    theme: "Cult/Mystic Tech",
    startTriggers: [
      "Recover cursed relic",
      "Accept forbidden bargain"
    ],
    consequences: [
      "Unstable high-power gear",
      "Corruption meter and narrative risk"
    ],
    mechanics: ["Corruption meter", "Unstable gear risks"],
    primaryFactionId: "obsidian_covenant",
    pointOfNoReturnStep: 2
  }
];

const baseMissionTemplates = [
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

const storyArcMissionTemplates = [
  {
    id: "solar_directorate_intro",
    type: "story_arc",
    title: "Directorate Loyalty Test",
    cargo: "clearance dossier",
    baseReward: 18000,
    rewardPerJump: 2200,
    minReward: 18000,
    maxReward: 26000,
    cargoSpace: 4,
    weight: 0.2,
    description:
      "Deliver {cargo} to {destination} and swear provisional service.",
    arcId: "solar_directorate",
    arcTemplateType: "intro_decision",
    arcStatusRequired: "inactive",
    arcCommitOnAccept: true,
    arcAdvanceStep: 1,
    arcEffects: { rankDelta: 1, legalStatusDelta: -2 }
  },
  {
    id: "solar_directorate_trial",
    type: "story_arc",
    title: "Directorate Patrol Sweep",
    cargo: "fleet telemetry",
    baseReward: 32000,
    rewardPerJump: 4200,
    minReward: 32000,
    maxReward: 52000,
    cargoSpace: 6,
    weight: 0.15,
    minCombatRating: 3,
    description: "Escort {cargo} to {destination} and file a classified report.",
    arcId: "solar_directorate",
    arcTemplateType: "reputation_trial",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { rankDelta: 1 }
  },
  {
    id: "solar_directorate_conflict",
    type: "story_arc",
    title: "Suppress Raider Cell",
    cargo: "detention warrants",
    baseReward: 42000,
    rewardPerJump: 5200,
    minReward: 42000,
    maxReward: 68000,
    cargoSpace: 6,
    weight: 0.12,
    minCombatRating: 5,
    description: "Track a raider cell near {destination} and enforce order.",
    arcId: "solar_directorate",
    arcTemplateType: "faction_conflict",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "solar_directorate_tech",
    type: "story_arc",
    title: "Prototype Arsenal Transfer",
    cargo: "license-locked arsenal",
    baseReward: 52000,
    rewardPerJump: 4200,
    minReward: 52000,
    maxReward: 76000,
    cargoSpace: 8,
    weight: 0.1,
    minReputation: 8,
    description: "Move {cargo} to {destination}. Clearance required.",
    arcId: "solar_directorate",
    arcTemplateType: "tech_unlock",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { licenseWeapons: true } }
  },
  {
    id: "solar_directorate_moral",
    type: "story_arc",
    title: "Directorate Mercy Hearing",
    cargo: "civilian detainees",
    baseReward: 30000,
    rewardPerJump: 3500,
    minReward: 30000,
    maxReward: 48000,
    cargoSpace: 8,
    weight: 0.12,
    description:
      "Decide the fate of {cargo} en route to {destination}.",
    arcId: "solar_directorate",
    arcTemplateType: "moral_fork",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { honorDelta: 2 }
  },
  {
    id: "solar_directorate_endgame",
    type: "story_arc",
    title: "Directorate Ascendancy",
    cargo: "sovereignty charter",
    baseReward: 140000,
    rewardPerJump: 0,
    minReward: 140000,
    maxReward: 140000,
    cargoSpace: 6,
    weight: 0.06,
    minCombatRating: 6,
    description:
      "Deliver {cargo} to {destination} and secure a Directorate mandate.",
    arcId: "solar_directorate",
    arcTemplateType: "endgame_state",
    arcStatusRequired: "active",
    arcStepMin: 4,
    arcPointOfNoReturn: true,
    arcAdvanceStep: 1
  },
  {
    id: "ironclad_intro",
    type: "story_arc",
    title: "Ironclad Sponsorship Rite",
    cargo: "clan seal",
    baseReward: 20000,
    rewardPerJump: 2400,
    minReward: 20000,
    maxReward: 30000,
    cargoSpace: 4,
    weight: 0.2,
    description:
      "Deliver {cargo} to {destination} to be recognized by the clans.",
    arcId: "ironclad_clans",
    arcTemplateType: "intro_decision",
    arcStatusRequired: "inactive",
    arcCommitOnAccept: true,
    arcAdvanceStep: 1,
    arcEffects: { honorDelta: 3 }
  },
  {
    id: "ironclad_trial",
    type: "story_arc",
    title: "Clan Honor Trial",
    cargo: "duel summons",
    baseReward: 34000,
    rewardPerJump: 3600,
    minReward: 34000,
    maxReward: 54000,
    cargoSpace: 4,
    weight: 0.15,
    minCombatRating: 4,
    description:
      "Deliver {cargo} to {destination} for ritual combat arbitration.",
    arcId: "ironclad_clans",
    arcTemplateType: "reputation_trial",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { honorDelta: 4 }
  },
  {
    id: "ironclad_conflict",
    type: "story_arc",
    title: "Rival Clan Intercept",
    cargo: "warband supplies",
    baseReward: 48000,
    rewardPerJump: 5200,
    minReward: 48000,
    maxReward: 72000,
    cargoSpace: 8,
    weight: 0.12,
    minCombatRating: 5,
    description: "Intercept a rival warband near {destination}.",
    arcId: "ironclad_clans",
    arcTemplateType: "faction_conflict",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "ironclad_tech",
    type: "story_arc",
    title: "Ancestral Forge Transfer",
    cargo: "ancestral weapon core",
    baseReward: 52000,
    rewardPerJump: 4400,
    minReward: 52000,
    maxReward: 76000,
    cargoSpace: 6,
    weight: 0.1,
    description:
      "Escort {cargo} to {destination} to unlock clan-forged arms.",
    arcId: "ironclad_clans",
    arcTemplateType: "tech_unlock",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { duelAccess: true } }
  },
  {
    id: "ironclad_moral",
    type: "story_arc",
    title: "Honor of Mercy",
    cargo: "rival survivors",
    baseReward: 28000,
    rewardPerJump: 3200,
    minReward: 28000,
    maxReward: 46000,
    cargoSpace: 6,
    weight: 0.12,
    description:
      "Transport {cargo} to {destination} and decide their fate.",
    arcId: "ironclad_clans",
    arcTemplateType: "moral_fork",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { honorDelta: 2 }
  },
  {
    id: "ironclad_endgame",
    type: "story_arc",
    title: "Ironclad Ascension",
    cargo: "clan treaty",
    baseReward: 130000,
    rewardPerJump: 0,
    minReward: 130000,
    maxReward: 130000,
    cargoSpace: 6,
    weight: 0.06,
    minCombatRating: 6,
    description:
      "Deliver {cargo} to {destination} and unify the Ironclad banners.",
    arcId: "ironclad_clans",
    arcTemplateType: "endgame_state",
    arcStatusRequired: "active",
    arcStepMin: 4,
    arcPointOfNoReturn: true,
    arcAdvanceStep: 1
  },
  {
    id: "echotrail_intro",
    type: "story_arc",
    title: "Communion Emissary",
    cargo: "resonance capsule",
    baseReward: 22000,
    rewardPerJump: 2600,
    minReward: 22000,
    maxReward: 32000,
    cargoSpace: 4,
    weight: 0.2,
    description:
      "Deliver {cargo} to {destination} and accept the mind-link.",
    arcId: "echotrail_communion",
    arcTemplateType: "intro_decision",
    arcStatusRequired: "inactive",
    arcCommitOnAccept: true,
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { psychicSystems: true } }
  },
  {
    id: "echotrail_trial",
    type: "story_arc",
    title: "Echo Resonance Trial",
    cargo: "bio-symbiotic cores",
    baseReward: 36000,
    rewardPerJump: 4200,
    minReward: 36000,
    maxReward: 56000,
    cargoSpace: 6,
    weight: 0.15,
    minCombatRating: 4,
    description:
      "Escort {cargo} to {destination} to stabilize the communion.",
    arcId: "echotrail_communion",
    arcTemplateType: "reputation_trial",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { corruptionDelta: 1 }
  },
  {
    id: "echotrail_conflict",
    type: "story_arc",
    title: "Silence the Hunters",
    cargo: "relic ward",
    baseReward: 48000,
    rewardPerJump: 5200,
    minReward: 48000,
    maxReward: 72000,
    cargoSpace: 6,
    weight: 0.12,
    minCombatRating: 5,
    description: "Protect the communion enclave near {destination}.",
    arcId: "echotrail_communion",
    arcTemplateType: "faction_conflict",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "echotrail_tech",
    type: "story_arc",
    title: "Symbiote Protocol",
    cargo: "psychic lattice",
    baseReward: 54000,
    rewardPerJump: 4600,
    minReward: 54000,
    maxReward: 78000,
    cargoSpace: 6,
    weight: 0.1,
    description:
      "Deliver {cargo} to {destination} to unlock mind-linked systems.",
    arcId: "echotrail_communion",
    arcTemplateType: "tech_unlock",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { bannedShipyards: true } }
  },
  {
    id: "echotrail_moral",
    type: "story_arc",
    title: "Isolation Accord",
    cargo: "silent pilgrims",
    baseReward: 30000,
    rewardPerJump: 3400,
    minReward: 30000,
    maxReward: 48000,
    cargoSpace: 8,
    weight: 0.12,
    description:
      "Carry {cargo} to {destination} and decide how far the mind-link spreads.",
    arcId: "echotrail_communion",
    arcTemplateType: "moral_fork",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { corruptionDelta: 2 }
  },
  {
    id: "echotrail_endgame",
    type: "story_arc",
    title: "Echo Ascendance",
    cargo: "awakening relic",
    baseReward: 145000,
    rewardPerJump: 0,
    minReward: 145000,
    maxReward: 145000,
    cargoSpace: 6,
    weight: 0.06,
    minCombatRating: 6,
    description:
      "Deliver {cargo} to {destination} to awaken the communion.",
    arcId: "echotrail_communion",
    arcTemplateType: "endgame_state",
    arcStatusRequired: "active",
    arcStepMin: 4,
    arcPointOfNoReturn: true,
    arcAdvanceStep: 1
  },
  {
    id: "luminari_intro",
    type: "story_arc",
    title: "Luminari Rescue",
    cargo: "stranded scientist",
    baseReward: 24000,
    rewardPerJump: 2600,
    minReward: 24000,
    maxReward: 34000,
    cargoSpace: 4,
    weight: 0.2,
    description:
      "Escort {cargo} to {destination} and earn Luminari favor.",
    arcId: "luminari_compact",
    arcTemplateType: "intro_decision",
    arcStatusRequired: "inactive",
    arcCommitOnAccept: true,
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { hypergateAccess: true, illegalTech: true } }
  },
  {
    id: "luminari_trial",
    type: "story_arc",
    title: "Gate Calibration",
    cargo: "exotic fuel canisters",
    baseReward: 36000,
    rewardPerJump: 4200,
    minReward: 36000,
    maxReward: 56000,
    cargoSpace: 6,
    weight: 0.15,
    minCombatRating: 3,
    description:
      "Deliver {cargo} to {destination} and stabilize the hypergate.",
    arcId: "luminari_compact",
    arcTemplateType: "reputation_trial",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "luminari_conflict",
    type: "story_arc",
    title: "Isolation Protocol",
    cargo: "containment seals",
    baseReward: 47000,
    rewardPerJump: 5200,
    minReward: 47000,
    maxReward: 72000,
    cargoSpace: 6,
    weight: 0.12,
    minCombatRating: 5,
    description:
      "Deliver {cargo} to {destination} and repel interference.",
    arcId: "luminari_compact",
    arcTemplateType: "faction_conflict",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "luminari_tech",
    type: "story_arc",
    title: "Exotic Engine Retrofit",
    cargo: "phase-spool assembly",
    baseReward: 56000,
    rewardPerJump: 4800,
    minReward: 56000,
    maxReward: 80000,
    cargoSpace: 6,
    weight: 0.1,
    description:
      "Deliver {cargo} to {destination} for hypertech access.",
    arcId: "luminari_compact",
    arcTemplateType: "tech_unlock",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { exoticFuel: true } }
  },
  {
    id: "luminari_moral",
    type: "story_arc",
    title: "Non-Violent Accord",
    cargo: "ceasefire envoys",
    baseReward: 30000,
    rewardPerJump: 3400,
    minReward: 30000,
    maxReward: 48000,
    cargoSpace: 6,
    weight: 0.12,
    description:
      "Transport {cargo} to {destination} and uphold Luminari doctrine.",
    arcId: "luminari_compact",
    arcTemplateType: "moral_fork",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { honorDelta: 2 }
  },
  {
    id: "luminari_endgame",
    type: "story_arc",
    title: "Luminari Singularity",
    cargo: "hypergate keystone",
    baseReward: 150000,
    rewardPerJump: 0,
    minReward: 150000,
    maxReward: 150000,
    cargoSpace: 6,
    weight: 0.06,
    minCombatRating: 6,
    description:
      "Deliver {cargo} to {destination} and seal the Luminari nexus.",
    arcId: "luminari_compact",
    arcTemplateType: "endgame_state",
    arcStatusRequired: "active",
    arcStepMin: 4,
    arcPointOfNoReturn: true,
    arcAdvanceStep: 1
  },
  {
    id: "free_horizons_intro",
    type: "story_arc",
    title: "Free Horizons Contract",
    cargo: "open-freelance charter",
    baseReward: 16000,
    rewardPerJump: 2000,
    minReward: 16000,
    maxReward: 24000,
    cargoSpace: 4,
    weight: 0.2,
    description:
      "Deliver {cargo} to {destination} and join the Free Horizons Guild.",
    arcId: "free_horizons_guild",
    arcTemplateType: "intro_decision",
    arcStatusRequired: "inactive",
    arcCommitOnAccept: true,
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { neutralRep: true } }
  },
  {
    id: "free_horizons_trial",
    type: "story_arc",
    title: "Freelancer Trial Run",
    cargo: "mixed contracts",
    baseReward: 30000,
    rewardPerJump: 3000,
    minReward: 30000,
    maxReward: 48000,
    cargoSpace: 6,
    weight: 0.15,
    description:
      "Deliver {cargo} to {destination} and prove your flexibility.",
    arcId: "free_horizons_guild",
    arcTemplateType: "reputation_trial",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "free_horizons_conflict",
    type: "story_arc",
    title: "Contract Arbitration",
    cargo: "neutral arbitration docket",
    baseReward: 38000,
    rewardPerJump: 4200,
    minReward: 38000,
    maxReward: 60000,
    cargoSpace: 6,
    weight: 0.12,
    description:
      "Deliver {cargo} to {destination} and keep rival factions at bay.",
    arcId: "free_horizons_guild",
    arcTemplateType: "faction_conflict",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "free_horizons_tech",
    type: "story_arc",
    title: "Open-Source Retrofit",
    cargo: "shared module suite",
    baseReward: 45000,
    rewardPerJump: 4200,
    minReward: 45000,
    maxReward: 68000,
    cargoSpace: 6,
    weight: 0.1,
    description:
      "Deliver {cargo} to {destination} to unlock guild upgrades.",
    arcId: "free_horizons_guild",
    arcTemplateType: "tech_unlock",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "free_horizons_moral",
    type: "story_arc",
    title: "Mercy Clause",
    cargo: "refugee manifests",
    baseReward: 28000,
    rewardPerJump: 3200,
    minReward: 28000,
    maxReward: 46000,
    cargoSpace: 8,
    weight: 0.12,
    description:
      "Transport {cargo} to {destination} and choose between profit or mercy.",
    arcId: "free_horizons_guild",
    arcTemplateType: "moral_fork",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { honorDelta: 2 }
  },
  {
    id: "free_horizons_endgame",
    type: "story_arc",
    title: "Free Horizons Charter",
    cargo: "guild charter seals",
    baseReward: 120000,
    rewardPerJump: 0,
    minReward: 120000,
    maxReward: 120000,
    cargoSpace: 6,
    weight: 0.06,
    minCombatRating: 5,
    description:
      "Deliver {cargo} to {destination} and establish guild autonomy.",
    arcId: "free_horizons_guild",
    arcTemplateType: "endgame_state",
    arcStatusRequired: "active",
    arcStepMin: 4,
    arcPointOfNoReturn: true,
    arcAdvanceStep: 1
  },
  {
    id: "black_flag_intro",
    type: "story_arc",
    title: "Black Flag Induction",
    cargo: "smuggler insignia",
    baseReward: 24000,
    rewardPerJump: 2600,
    minReward: 24000,
    maxReward: 36000,
    cargoSpace: 4,
    weight: 0.2,
    description:
      "Deliver {cargo} to {destination} to join the Syndicate.",
    arcId: "black_flag_syndicate",
    arcTemplateType: "intro_decision",
    arcStatusRequired: "inactive",
    arcCommitOnAccept: true,
    arcAdvanceStep: 1,
    arcEffects: { legalStatusDelta: 6, unlockFlags: { contrabandAccess: true } },
    arcConflictBehavior: "betrayal"
  },
  {
    id: "black_flag_trial",
    type: "story_arc",
    title: "Raid Logistics",
    cargo: "plunder manifests",
    baseReward: 36000,
    rewardPerJump: 4200,
    minReward: 36000,
    maxReward: 56000,
    cargoSpace: 6,
    weight: 0.15,
    minCombatRating: 4,
    description:
      "Deliver {cargo} to {destination} and prepare a boarding strike.",
    arcId: "black_flag_syndicate",
    arcTemplateType: "reputation_trial",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { legalStatusDelta: 4 }
  },
  {
    id: "black_flag_conflict",
    type: "story_arc",
    title: "Authority Convoy Ambush",
    cargo: "ambush coordinates",
    baseReward: 52000,
    rewardPerJump: 5600,
    minReward: 52000,
    maxReward: 78000,
    cargoSpace: 6,
    weight: 0.12,
    minCombatRating: 5,
    description:
      "Deliver {cargo} to {destination} and strike a loyalist convoy.",
    arcId: "black_flag_syndicate",
    arcTemplateType: "faction_conflict",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { legalStatusDelta: 6 }
  },
  {
    id: "black_flag_tech",
    type: "story_arc",
    title: "Contraband Cache",
    cargo: "illegal tech cache",
    baseReward: 56000,
    rewardPerJump: 4800,
    minReward: 56000,
    maxReward: 82000,
    cargoSpace: 6,
    weight: 0.1,
    description:
      "Deliver {cargo} to {destination} to unlock syndicate gear.",
    arcId: "black_flag_syndicate",
    arcTemplateType: "tech_unlock",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { illegalTech: true } }
  },
  {
    id: "black_flag_moral",
    type: "story_arc",
    title: "Syndicate Clemency",
    cargo: "captured officers",
    baseReward: 32000,
    rewardPerJump: 3600,
    minReward: 32000,
    maxReward: 52000,
    cargoSpace: 8,
    weight: 0.12,
    description:
      "Transport {cargo} to {destination} and decide their fate.",
    arcId: "black_flag_syndicate",
    arcTemplateType: "moral_fork",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { corruptionDelta: 2 }
  },
  {
    id: "black_flag_endgame",
    type: "story_arc",
    title: "Syndicate Ascendant",
    cargo: "plunder tithe",
    baseReward: 150000,
    rewardPerJump: 0,
    minReward: 150000,
    maxReward: 150000,
    cargoSpace: 6,
    weight: 0.06,
    minCombatRating: 6,
    description:
      "Deliver {cargo} to {destination} and cement the pirate confederacy.",
    arcId: "black_flag_syndicate",
    arcTemplateType: "endgame_state",
    arcStatusRequired: "active",
    arcStepMin: 4,
    arcPointOfNoReturn: true,
    arcAdvanceStep: 1
  },
  {
    id: "starseed_intro",
    type: "story_arc",
    title: "Seedship Convoy",
    cargo: "colony seed pods",
    baseReward: 26000,
    rewardPerJump: 2600,
    minReward: 26000,
    maxReward: 36000,
    cargoSpace: 8,
    weight: 0.2,
    description:
      "Deliver {cargo} to {destination} and join the Starseed mission.",
    arcId: "starseed_foundation",
    arcTemplateType: "intro_decision",
    arcStatusRequired: "inactive",
    arcCommitOnAccept: true,
    arcAdvanceStep: 1,
    arcEffects: { colonyIncomeDelta: 600 }
  },
  {
    id: "starseed_trial",
    type: "story_arc",
    title: "Terraforming Logistics",
    cargo: "biosphere modules",
    baseReward: 42000,
    rewardPerJump: 4400,
    minReward: 42000,
    maxReward: 62000,
    cargoSpace: 10,
    weight: 0.15,
    minCombatRating: 4,
    description:
      "Deliver {cargo} to {destination} to expand the colony grid.",
    arcId: "starseed_foundation",
    arcTemplateType: "reputation_trial",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { colonyIncomeDelta: 800 }
  },
  {
    id: "starseed_conflict",
    type: "story_arc",
    title: "Defend the Nurseries",
    cargo: "colony defense kits",
    baseReward: 52000,
    rewardPerJump: 5200,
    minReward: 52000,
    maxReward: 76000,
    cargoSpace: 10,
    weight: 0.12,
    minCombatRating: 5,
    description:
      "Deliver {cargo} to {destination} and repel industrial raids.",
    arcId: "starseed_foundation",
    arcTemplateType: "faction_conflict",
    arcStatusRequired: "active",
    arcAdvanceStep: 1
  },
  {
    id: "starseed_tech",
    type: "story_arc",
    title: "Ecology Core Unlock",
    cargo: "terraforming core",
    baseReward: 58000,
    rewardPerJump: 5000,
    minReward: 58000,
    maxReward: 82000,
    cargoSpace: 10,
    weight: 0.1,
    description:
      "Deliver {cargo} to {destination} to unlock new colony tech.",
    arcId: "starseed_foundation",
    arcTemplateType: "tech_unlock",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { colonyIncomeDelta: 1000 }
  },
  {
    id: "starseed_moral",
    type: "story_arc",
    title: "Frontier Mercy",
    cargo: "evacuee transports",
    baseReward: 32000,
    rewardPerJump: 3600,
    minReward: 32000,
    maxReward: 52000,
    cargoSpace: 12,
    weight: 0.12,
    description:
      "Transport {cargo} to {destination} and choose between profit and care.",
    arcId: "starseed_foundation",
    arcTemplateType: "moral_fork",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { honorDelta: 2 }
  },
  {
    id: "starseed_endgame",
    type: "story_arc",
    title: "Starseed Terraforming Finale",
    cargo: "worldseed matrix",
    baseReward: 160000,
    rewardPerJump: 0,
    minReward: 160000,
    maxReward: 160000,
    cargoSpace: 10,
    weight: 0.06,
    minCombatRating: 6,
    description:
      "Deliver {cargo} to {destination} and inaugurate a new world.",
    arcId: "starseed_foundation",
    arcTemplateType: "endgame_state",
    arcStatusRequired: "active",
    arcStepMin: 4,
    arcPointOfNoReturn: true,
    arcAdvanceStep: 1,
    arcEffects: { colonyIncomeDelta: 1500 }
  },
  {
    id: "obsidian_intro",
    type: "story_arc",
    title: "Obsidian Oath",
    cargo: "cursed relic",
    baseReward: 24000,
    rewardPerJump: 2600,
    minReward: 24000,
    maxReward: 36000,
    cargoSpace: 4,
    weight: 0.2,
    description:
      "Deliver {cargo} to {destination} and accept the Covenant's bargain.",
    arcId: "obsidian_covenant",
    arcTemplateType: "intro_decision",
    arcStatusRequired: "inactive",
    arcCommitOnAccept: true,
    arcAdvanceStep: 1,
    arcEffects: { corruptionDelta: 3 }
  },
  {
    id: "obsidian_trial",
    type: "story_arc",
    title: "Void Ritual Trial",
    cargo: "ritual catalysts",
    baseReward: 36000,
    rewardPerJump: 4200,
    minReward: 36000,
    maxReward: 56000,
    cargoSpace: 6,
    weight: 0.15,
    minCombatRating: 4,
    description:
      "Deliver {cargo} to {destination} for forbidden rites.",
    arcId: "obsidian_covenant",
    arcTemplateType: "reputation_trial",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { corruptionDelta: 2 }
  },
  {
    id: "obsidian_conflict",
    type: "story_arc",
    title: "Void Supplication",
    cargo: "silence directives",
    baseReward: 48000,
    rewardPerJump: 5200,
    minReward: 48000,
    maxReward: 72000,
    cargoSpace: 6,
    weight: 0.12,
    minCombatRating: 5,
    description:
      "Deliver {cargo} to {destination} and silence the Covenant's foes.",
    arcId: "obsidian_covenant",
    arcTemplateType: "faction_conflict",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { corruptionDelta: 2 }
  },
  {
    id: "obsidian_tech",
    type: "story_arc",
    title: "Forbidden Engine Core",
    cargo: "void engine core",
    baseReward: 56000,
    rewardPerJump: 4800,
    minReward: 56000,
    maxReward: 82000,
    cargoSpace: 6,
    weight: 0.1,
    description:
      "Deliver {cargo} to {destination} to unlock unstable engines.",
    arcId: "obsidian_covenant",
    arcTemplateType: "tech_unlock",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { unlockFlags: { forbiddenEngines: true } }
  },
  {
    id: "obsidian_moral",
    type: "story_arc",
    title: "Covenant Mercy",
    cargo: "bound acolytes",
    baseReward: 30000,
    rewardPerJump: 3400,
    minReward: 30000,
    maxReward: 48000,
    cargoSpace: 6,
    weight: 0.12,
    description:
      "Transport {cargo} to {destination} and decide their fate.",
    arcId: "obsidian_covenant",
    arcTemplateType: "moral_fork",
    arcStatusRequired: "active",
    arcAdvanceStep: 1,
    arcEffects: { corruptionDelta: 1 }
  },
  {
    id: "obsidian_endgame",
    type: "story_arc",
    title: "Obsidian Eclipse",
    cargo: "void sigil",
    baseReward: 155000,
    rewardPerJump: 0,
    minReward: 155000,
    maxReward: 155000,
    cargoSpace: 6,
    weight: 0.06,
    minCombatRating: 6,
    description:
      "Deliver {cargo} to {destination} and open the Covenant's gate.",
    arcId: "obsidian_covenant",
    arcTemplateType: "endgame_state",
    arcStatusRequired: "active",
    arcStepMin: 4,
    arcPointOfNoReturn: true,
    arcAdvanceStep: 1
  }
];

const missionTemplates = [...baseMissionTemplates, ...storyArcMissionTemplates];

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
    id: "solar_directorate",
    name: "Solar Directorate",
    code: "SD",
    description:
      "A disciplined authority with modular fleets and legal enforcement across the core.",
    homeSystemId: "sol"
  },
  {
    id: "ironclad_clans",
    name: "Ironclad Clans",
    code: "KESH",
    description:
      "Warrior clans who favor brutal hulls, honor duels, and boarding victories.",
    homeSystemId: "auriga"
  },
  {
    id: "echotrail_communion",
    name: "Echotrail Communion",
    code: "ECHO",
    description:
      "Psychic bio-ship custodians whose vessels focus on shielding, disabling, and isolation.",
    homeSystemId: "scar"
  },
  {
    id: "luminari_compact",
    name: "Luminari Compact",
    code: "LU",
    description:
      "Hypertech isolationists relying on exotic drives, low signatures, and extreme mobility.",
    homeSystemId: "sirius"
  },
  {
    id: "free_horizons_guild",
    name: "Free Horizons Guild",
    code: "FH",
    description:
      "Independent captains who prize flexibility and modular ship upgrades.",
    homeSystemId: "sol"
  },
  {
    id: "black_flag_syndicate",
    name: "Black Flag Syndicate",
    code: "BF",
    description:
      "Underworld raiders who specialize in boarding actions and stolen hardware.",
    homeSystemId: "orion"
  },
  {
    id: "starseed_foundation",
    name: "Starseed Foundation",
    code: "ST",
    description:
      "Terraforming engineers running massive logistics fleets and colony infrastructure.",
    homeSystemId: "st_01"
  },
  {
    id: "obsidian_covenant",
    name: "Obsidian Covenant",
    code: "OC",
    description:
      "A mystic cult wielding volatile void tech and corruption-charged weaponry.",
    homeSystemId: "obsidian"
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
  factions,
  storyArcs
};
