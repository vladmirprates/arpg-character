export const INITIAL_ITEMS = [
  // --- Gears ---
  {
    selector: ".slot-w1",
    name: "The Null Pointer",
    base: "Automation Blade",
    rarity: "unique",
    icon: "icons/weapon1.svg",
    stats: [
      { text: "Attacks per Second: 1.85", color: "white" },
      { type: "separator" },
      {
        text: "Adds <span class='stat-blue'>10 to 20</span> Scripts per Commit",
      },
      {
        text: "<span class='stat-blue'>100%</span> chance to catch <span class='stat-blue'>Null Reference Exceptions</span>",
      },
      {
        text: "Socketed Gems are supported by <span class='stat-blue'>Typescript</span>",
      },
    ],
    flavor: "Undefined is not a function.",
  },
  {
    selector: ".slot-head",
    name: "Crown of the Automator",
    base: "QA Engineer Helmet",
    rarity: "unique",
    icon: "icons/head.svg",
    stats: [
      { text: "Experience Level: Mid-Level", color: "white" },
      { text: "Quality: +20%", color: "white" },
      { type: "separator" },
      {
        text: "Grants Level 20 <span class='stat-blue'>Playwright Automation</span> Skill",
      },
      {
        text: "<span class='stat-blue'>100%</span> Increased Bug Detection Rate",
      },
      {
        text: "Can execute <span class='stat-blue'>Functional Tests</span> autonomously",
      },
      {
        text: "Reflects <span class='stat-blue'>Critical Issues</span> to Developers instantly",
      },
      {
        text: "Has <span class='stat-blue'>1 Abyssal Socket</span>",
      },
    ],
    flavor: "Those who watch the code see what the creators chose to ignore.",
  },
  {
    selector: ".slot-amulet",
    name: "StackOverflow Star",
    base: "Onyx Amulet",
    rarity: "unique",
    icon: "icons/amulet.svg",
    stats: [
      { text: "+30 to All Attributes", color: "white" },
      { type: "separator" },
      { text: "Grants <span class='stat-blue'>Copy/Paste Mastery</span>" },
      {
        text: "Cannot be <span class='stat-blue'>Stunned</span> by Syntax Errors",
      },
    ],
    flavor: "Why reinvent the wheel?",
  },
  {
    selector: ".slot-w2",
    name: "Jira Ticket Board",
    base: "Kanban Shield",
    rarity: "rare",
    icon: "icons/weapon2.svg",
    stats: [
      { text: "Chance to Block: 35%", color: "white" },
      { type: "separator" },
      {
        text: "<span class='stat-blue'>+80</span> to Maximum Life (Work-Life Balance)",
      },
      {
        text: "Reflects <span class='stat-blue'>'Works on My Machine'</span> excuses back to sender",
      },
      { text: "<span class='stat-blue'>20%</span> Reduced Meeting Duration" },
    ],
  },
  {
    selector: ".slot-ring1",
    name: "Git Commit",
    base: "Iron Ring",
    rarity: "magic",
    icon: "icons/ring1.svg",
    stats: [
      { text: "Adds <span class='stat-white'>1-4</span> lines of clean code" },
      { text: "<span class='stat-white'>+20%</span> Rarity of bugs found" },
    ],
  },
  {
    selector: ".slot-chest",
    name: "Jenkins Firewall",
    base: "Astral Plate",
    rarity: "rare",
    icon: "icons/body.svg",
    stats: [
      { text: "Armour: 1205", color: "white" },
      { type: "separator" },
      { text: "<span class='stat-blue'>+100</span> to CI/CD Reliability" },
      {
        text: "<span class='stat-blue'>15%</span> Physical Damage Reduction from Scope Creep",
      },
      { text: "Has 6 Linked Sockets (Pipeline Integration)" },
    ],
  },
  {
    selector: ".slot-ring2",
    name: "Git Push",
    base: "Diamond Ring",
    rarity: "magic",
    icon: "icons/ring2.svg",
    stats: [
      {
        text: "<span class='stat-white'>20%</span> increased Quantity of Features",
      },
      {
        text: "Curse Enemies with <span class='stat-white'>Merge Conflict</span> on hit",
      },
    ],
  },
  {
    selector: ".slot-hands",
    name: "Manual Testers",
    base: "Silk Gloves",
    rarity: "magic",
    icon: "icons/gloves.svg",
    stats: [
      { text: "Energy Shield: 45", color: "white" },
      { type: "separator" },
      { text: "<span class='stat-white'>+50</span> to Accuracy Rating" },
      {
        text: "Can spot <span class='stat-white'>UI Misalignment</span> instantly",
      },
    ],
  },
  {
    selector: ".slot-belt",
    name: "The Scrum Master's Sash",
    base: "Leather Belt",
    rarity: "unique",
    icon: "icons/belt.svg",
    stats: [
      { text: "+40 to maximum Life", color: "white" },
      { type: "separator" },
      { text: "<span class='stat-blue'>20%</span> increased Stand-up Speed" },
      {
        text: "Immune to <span class='stat-blue'>Blockers</span> during Sprints",
      },
      {
        text: "Steals <span class='stat-blue'>Time Estimates</span> from developers",
      },
    ],
    flavor: "Yesterday I did... Today I will do...",
  },
  {
    selector: ".slot-feet",
    name: "Hotfix Striders",
    base: "Titan Greaves",
    rarity: "rare",
    icon: "icons/boots.svg",
    stats: [
      { text: "Armour: 220", color: "white" },
      { type: "separator" },
      { text: "<span class='stat-blue'>30%</span> Increased Movement Speed" },
      {
        text: "Cannot be Slowed by <span class='stat-blue'>Legacy Code</span>",
      },
    ],
  },
  {
    selector: ".slot-pet",
    name: "Junior Rubber Duck",
    base: "Legendary Companion",
    rarity: "unique",
    icon: "icons/pet.svg",
    stats: [
      { text: "Item Level: 100", color: "white" },
      { type: "separator" },
      { text: "Absorbs <span class='stat-blue'>50%</span> of Mental Stress" },
      { text: "Listens to your logic problems without judgment" },
      { text: "<span class='stat-blue'>'Quack.'</span>" },
    ],
    flavor: "A lonely QA's best friend.",
  },
  {
    selector: ".slot-charm1",
    name: "Stone of the Self-Taught",
    base: "Small Charm",
    rarity: "magic",
    icon: "icons/rune.svg",
    stats: [
      { text: "Requires Level: Mid-Level", color: "white" },
      { type: "separator" },
      { text: "<span class='stat-white'>+20</span> to Critical Thinking" },
      {
        text: "<span class='stat-white'>50%</span> increased effectiveness of <span class='stat-white'>Exploratory Testing</span>",
      },
      {
        text: "Immune to <span class='stat-white'>'By the Book'</span> constraints",
      },
    ],
    flavor: "I don't need a certificate to know it's broken.",
  },
  {
    selector: ".slot-aura1",
    name: "Collaboration Aura",
    base: "Passive Skill",
    rarity: "rare",
    icon: "icons/aura.svg",
    stats: [
      { type: "separator" },
      {
        text: "Grants <span class='stat-blue'>Empathy</span> to nearby allies",
      },
      {
        text: "Reduces Developer hostility by <span class='stat-blue'>20%</span>",
      },
      { text: "<span class='stat-blue'>Always Active</span>" },
    ],
  },

  // --- Backpack ---
  {
    selector: "#backpack-scroll",
    name: "Scroll of Documentation",
    base: "Currency",
    rarity: "magic",
    icon: "icons/backpack1.svg",
    stats: [
      { text: "Stack Size: 1/40", color: "white" },
      { type: "separator" },
      {
        text: "Identifies <span class='stat-white'>Unwritten Rules</span> of the project.",
      },
      {
        text: "Right click to learn <span class='stat-white'>'How this feature actually works'</span>.",
      },
    ],
    flavor: "RTFM (Read The Fine Manual).",
  },
  {
    selector: "#backpack-chaos",
    name: "Orb of Environment",
    base: "Currency",
    rarity: "rare",
    icon: "icons/backpack2.svg",
    stats: [
      { text: "Stack Size: 10/10", color: "white" },
      { type: "separator" },
      {
        text: "Reforges a <span class='stat-blue'>Staging Environment</span> with new random data.",
      },
      {
        text: "Right click to wipe the database and <span class='stat-blue'>Restart the Docker Containers</span>.",
      },
    ],
    flavor: "Have you tried turning it off and on again?",
  },
  {
    selector: "#backpack-vaal",
    name: "Orb of Hotfix",
    base: "Currency",
    rarity: "corrupted",
    icon: "icons/backpack3.svg",
    stats: [
      { text: "Stack Size: 1/10", color: "white" },
      { type: "separator" },
      {
        text: "Corrupts a <span class='stat-blue'>Pull Request</span>, deploying it instantly.",
      },
      {
        text: "<span class='stat-blue'>Unpredictable Outcome:</span> May fix the bug or bring down the Server.",
      },
    ],
    flavor: "We'll test it in Production.",
  },
  {
    selector: "#backpack-mirror",
    name: "Mirror of Replication",
    base: "Currency",
    rarity: "unique",
    icon: "icons/backpack4.svg",
    stats: [
      { text: "Stack Size: 1/1", color: "white" },
      { type: "separator" },
      {
        text: "Creates a duplicated copy of a <span class='stat-blue'>Complex Bug</span>.",
      },
      {
        text: "Allows the Developer to see the issue on <span class='stat-blue'>Localhost</span>.",
      },
    ],
    flavor: "It works on my machine... and now on yours too.",
  },
  {
    selector: "#backpack-whetstone",
    name: "Ticket Whetstone",
    base: "Currency",
    rarity: "magic",
    icon: "icons/backpack6.svg",
    stats: [
      { text: "Stack Size: 20/20", color: "white" },
      { type: "separator" },
      {
        text: "Improves the <span class='stat-white'>Quality</span> of a Bug Report.",
      },
      {
        text: "Adds <span class='stat-white'>+20% Clarity</span> by attaching Logs and Screenshots.",
      },
    ],
    flavor: "Sharp details cut through developer excuses.",
  },

  // --- Flasks ---
  {
    selector: "#slot-flask1",
    name: "Emergency Coffee",
    base: "Unique Flask",
    rarity: "unique",
    icon: "icons/flask1.svg",
    stats: [
      { text: "Consumes 100% Sanity", color: "red" },
      { type: "separator" },
      { text: "Consumes <span class='stat-blue'>1</span> Charge on <span class='stat-blue'>Critical Bug</span> discovery." },
      { text: "Grants <span class='stat-blue'>Immunity to Sleep</span> for 4 hours." }
    ],
    flavor: "Do not shake before use. Or do. I'm not a cop."
  },
  {
    selector: "#slot-flask2",
    name: "Flask of Focus",
    base: "Utility Flask",
    rarity: "magic",
    icon: "icons/flask2.svg",
    stats: [
      { text: "Immune to <span class='stat-blue'>Slack Notifications</span>" },
      { type: "separator" },
      { text: "<span class='stat-white'>40%</span> Increased Coding Speed" }
    ]
  },
  {
    selector: "#slot-flask3",
    name: "Tears of the Devs",
    base: "Unique Flask",
    rarity: "unique",
    icon: "icons/flask3.svg",
    stats: [
      { text: "Restores <span class='stat-blue'>Sanity</span> on use" }
    ]
  },
  {
    selector: "#slot-flask4",
    name: "Diamond Flask",
    base: "Utility Flask",
    rarity: "magic",
    icon: "icons/flask4.svg",
    stats: [
      { text: "Immune to <span class='stat-blue'>Flaky Tests</span>" },
      { type: "separator" },
      { text: "Your tests become <span class='stat-white'>Lucky</span>" }
    ]
  },
  {
    selector: "#slot-flask5",
    name: "Quicksilver Flask",
    base: "Utility Flask",
    rarity: "magic",
    icon: "icons/flask5.svg",
    stats: [
      { text: "Immune to <span class='stat-blue'>Freeze</span>" },
      { type: "separator" },
      { text: "<span class='stat-white'>50%</span> Increased Test Execution Speed" },
      { text: "<span class='stat-white'>40%</span> Increased Movement Speed towards the Exit on Fridays" }
    ]
  }
];
