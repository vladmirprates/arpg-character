/**
 * The build shown on the passive tree's "My Build" tab.
 *
 * To change it: open the tree, switch to "Make Your Own", allocate the nodes you want,
 * press "Export build code", and paste the copied code below.
 * (Alternatively, list target nodes in MY_BUILD_NODES — used when the code is empty. Each target is
 * allocated together with the shortest path to it, so you only list the notables you want.)
 */
export const MY_BUILD_CODE = "____z__8Pfn_7____z-_4v___3_-8x__-_7___x_AA";

export const MY_BUILD_NODES: readonly string[] = [
  // Game Testing
  "gm_mechanics",
  "gm_ui",
  "gm_audio",
  "gm_collision",
  "gm_save",
  "gm_economy",
  "gm_balance",
  "gm_tuto",
  "gm_engine",
  "gm_pc",
  "gm_master",
  "ks_deterministic",
  // Manual Testing
  "man_bugs",
  "man_explore",
  "man_regression",
  "man_smoke",
  "man_compat",
  "man_triage",
  "man_logs",
  "man_master",
  "ks_zero_bug",
  "ks_pixel",
  // Test Automation
  "tech_cicd",
  "tech_git",
  "tech_bdd",
  "tech_sql",
  "tech_playwright",
  "tech_selenium",
  "tech_cypress",
  "tech_appium",
  "tech_python",
  "tech_java",
  "tech_api_tools",
  "tech_master",
  "ks_shift_left",
  "ks_flaky",
  // Strategy & Leadership
  "proc_testplan",
  "proc_risk",
  "proc_agile",
  "proc_jira",
  "proc_mentor",
  "proc_docs",
  "proc_master",
  "ks_dod",
  "ks_servant",
  // Bridges
  "br_profiling",
  "br_security",
  "br_a11y",
  "br_liveops",
  "br_community",
  "ks_player",
];
