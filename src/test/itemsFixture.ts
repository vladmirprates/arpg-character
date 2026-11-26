/**
 * A fixed bag and board for tests about how items move: no altar, a roomy board and every spare idol
 * in the bag. It keeps those tests independent of the site's default arrangement (data/idols.ts),
 * which can change freely. Stored as a save would be: missing items fill the bag in data order.
 *
 * Bag: currency 0-4, Telemetry 5, Full Playthrough 6, Release Day 7, Cassandra 11, Sisyphus 12,
 * Patch Notes 14, Hourglass 15, Crossroads 16, Cube 19, first free cell 21.
 */
export const RULES_LAYOUT = {
  bag: [] as string[],
  idols: [
    { ref: "d:idol-localization", index: 1 },
    { ref: "d:idol-regression", index: 5 },
    { ref: "d:idol-reproduction", index: 6 },
    { ref: "d:idol-exploration", index: 8 },
    { ref: "d:idol-hotfix", index: 16 },
  ],
  altar: null,
};
