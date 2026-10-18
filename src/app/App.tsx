import { useCallback, useEffect, useState } from "react";
import { CharacterPanel } from "../features/character/CharacterPanel";
import { CraftingBench } from "../features/crafting/CraftingBench";
import { InventoryPanel } from "../features/inventory/InventoryPanel";
import { ActionBar } from "../features/skills/ActionBar";
import { BugHuntProvider } from "../features/bughunt/BugHunt";
import { StashPanel } from "../features/stash/StashPanel";
import { StashProvider } from "../features/stash/StashProvider";
import { FeaturesPanel } from "../features/hub/FeaturesPanel";
import { PassiveTree, type TreeTab } from "../features/tree/PassiveTree";
import { QuestLog } from "../features/quests/QuestLog";
import { DivinationCards } from "../features/divination/DivinationCards";
import { BountyProvider } from "../features/bounty/BountyProvider";
import { BugBounty } from "../features/bounty/BugBounty";
import { QAReport } from "../features/qa/QAReport";
import { AchievementsProvider } from "../features/achievements/AchievementsProvider";
import { AchievementsPanel } from "../features/achievements/AchievementsPanel";
import { CertificationPanel } from "../features/certification/CertificationPanel";
import { GamepadController } from "../features/gamepad/GamepadController";
import { PerfOverlay } from "../features/perf/PerfOverlay";
import { setAudioSuspended } from "../audio/sfx";
import { track } from "../game/events";
import { takeCorrupted } from "../hooks/usePersistentState";
import { Backdrop } from "../fx/Backdrop";
import { EmberField } from "../fx/EmberField";
import { Modal } from "../components/Modal";
import { ToastProvider, useToast } from "../components/Toasts";
import { TooltipProvider } from "../components/Tooltip";
import { copyToClipboard, getCopyText } from "../components/copyTarget";
import { decodeRecipe, type Recipe } from "../game/crafting/recipe";
import { I18nProvider, useI18n } from "../i18n/I18nProvider";
import type { Locale } from "../i18n/types";
import { SettingsProvider, useSettings } from "./SettingsProvider";
import { TopBar } from "./TopBar";
import "./App.css";

export function App({ initialLocale }: { initialLocale?: Locale }) {
  return (
    <SettingsProvider>
      <I18nProvider initialLocale={initialLocale}>
        <ToastProvider>
          <AchievementsProvider>
            <TooltipProvider>
              <BountyProvider>
                <StashProvider>
                  <BugHuntProvider>
                    <Shell />
                  </BugHuntProvider>
                </StashProvider>
              </BountyProvider>
            </TooltipProvider>
          </AchievementsProvider>
        </ToastProvider>
      </I18nProvider>
    </SettingsProvider>
  );
}

type Overlay = "tree" | "bench" | "quests" | "cards" | "bounty" | "qa" | "achievements" | "cert" | null;

/** Reads `#tree=<code>` / `#craft=<code>` share links. */
function readHash(): { tree?: string; craft?: Recipe } {
  const params = new URLSearchParams(location.hash.slice(1));
  const tree = params.get("tree") ?? undefined;
  const craftCode = params.get("craft");
  const craft = craftCode ? (decodeRecipe(craftCode) ?? undefined) : undefined;
  return { tree, craft };
}

function Shell() {
  const { t } = useI18n();
  const { reducedMotion, perfOverlay, setPerfOverlay } = useSettings();
  const notify = useToast();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [treeTab, setTreeTab] = useState<TreeTab>("mine");
  const [sharedTree, setSharedTree] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<{ recipe: Recipe; shared: boolean } | null>(null);

  // Deep links: open the right overlay for a shared build or craft.
  useEffect(() => {
    const { tree, craft } = readHash();
    if (tree) {
      setSharedTree(tree);
      setTreeTab("yours");
      setOverlay("tree");
    } else if (craft) {
      setIncoming({ recipe: craft, shared: true });
      setOverlay("bench");
    }
  }, []);

  const close = useCallback(() => {
    setOverlay(null);
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }, []);

  const openBench = useCallback((recipe?: Recipe) => {
    if (recipe) setIncoming({ recipe, shared: false });
    setOverlay("bench");
  }, []);

  // Global Ctrl+C on a hovered/focused item, unless the user is copying selected text.
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "c") return;
      if (window.getSelection()?.toString()) return;
      const text = getCopyText();
      if (!text) return;
      e.preventDefault();
      if (await copyToClipboard(text)) {
        notify(t("item.copied"), "success");
        track({ type: "item.copied" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notify, t]);

  // Corrupted save data: the providers already fell back to defaults; say so once, like a console
  // game does, instead of silently losing progress.
  useEffect(() => {
    if (takeCorrupted().length) notify(t("save.corrupted"), "error");
  }, [notify, t]);

  // Suspend / resume, the console way: a hidden tab pauses animation, audio and Coffee regen, and
  // everything is exactly where it was when the player comes back.
  useEffect(() => {
    const onVisibility = () => {
      document.documentElement.toggleAttribute("data-suspended", document.hidden);
      setAudioSuspended(document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <>
      <a className="skip-link" href="#sheet">
        {t("app.skip")}
      </a>
      <Backdrop />
      <EmberField disabled={reducedMotion} />
      <div className="app">
        <TopBar />
        <main id="sheet" className="sheet" tabIndex={-1}>
          {/* Character sheet | inventory window | stash tab + features. */}
          <CharacterPanel />
          <InventoryPanel onOpenBench={openBench} />
          <div className="sheet__side">
            <StashPanel onOpenBench={openBench} />
            <FeaturesPanel
              onOpenTree={() => setOverlay("tree")}
              onOpenBench={() => openBench()}
              onOpenQuests={() => setOverlay("quests")}
              onOpenCards={() => setOverlay("cards")}
              onOpenBounty={() => setOverlay("bounty")}
              onOpenQA={() => setOverlay("qa")}
              onOpenAchievements={() => setOverlay("achievements")}
              onOpenCert={() => {
                setOverlay("cert");
                track({ type: "cert.opened" });
              }}
            />
          </div>
        </main>
        <ActionBar />
      </div>
      {perfOverlay && <PerfOverlay onClose={() => setPerfOverlay(false)} />}
      <GamepadController />

      <Modal
        open={overlay === "tree"}
        onClose={close}
        title={t("tree.title")}
        titleId="tree-title"
        className="modal--tree"
      >
        <PassiveTree tab={treeTab} onTabChange={setTreeTab} sharedCode={sharedTree} />
      </Modal>

      <Modal
        open={overlay === "bench"}
        onClose={close}
        title={t("bench.title")}
        titleId="bench-title"
        className="modal--bench"
      >
        <CraftingBench incoming={incoming} />
      </Modal>

      <Modal
        open={overlay === "quests"}
        onClose={close}
        title={t("nav.quests")}
        titleId="quests-title"
        className="modal--quests"
      >
        <QuestLog />
      </Modal>

      <Modal
        open={overlay === "cards"}
        onClose={close}
        title={t("nav.cards")}
        titleId="cards-title"
        className="modal--quests modal--cards"
      >
        <DivinationCards />
      </Modal>

      <Modal
        open={overlay === "bounty"}
        onClose={close}
        title={t("nav.bounty")}
        titleId="bounty-title"
        className="modal--quests modal--bounty"
      >
        <BugBounty />
      </Modal>

      <Modal
        open={overlay === "qa"}
        onClose={close}
        title={t("nav.qa")}
        titleId="qa-title"
        className="modal--quests modal--qa"
      >
        <QAReport />
      </Modal>

      <Modal
        open={overlay === "achievements"}
        onClose={close}
        title={t("nav.achievements")}
        titleId="achievements-title"
        className="modal--quests modal--qa"
      >
        <AchievementsPanel />
      </Modal>

      <Modal
        open={overlay === "cert"}
        onClose={close}
        title={t("nav.cert")}
        titleId="cert-title"
        className="modal--quests modal--qa"
      >
        <CertificationPanel />
      </Modal>
    </>
  );
}
