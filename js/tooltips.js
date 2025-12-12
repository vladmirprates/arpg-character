export function setupTooltips() {
  const commonConfig = {
    allowHTML: true,
    placement: "top",
    animation: "shift-away",
    interactive: true,
    duration: [200, 0],
    delay: [50, 0],
  };

  tippy("#skill-q", {
    ...commonConfig,
    content: `
      <div class="poe-tooltip" style="display: block !important; position: static !important; visibility: visible !important; opacity: 1 !important;">
        <div class="item-header">
          <span class="item-name">Inspect Element</span>
          <span class="item-base">Intelligence Skill</span>
        </div>
        <div class="item-content">
          <div class="stat-blue">Mana Cost: 5 Coffee</div>
          <div class="stat-white">Cast Time: Instant</div>
          <div class="separator"></div>
          <div>Reveals hidden <span class="stat-blue">DOM Properties</span>.</div>
          <div>Allows you to delete annoying overlays.</div>
          <div><span class="stat-blue">50%</span> chance to feel like a hacker.</div>
          <div class="flavor-text">"It's not a bug, it's a feature... until I delete the div."</div>
        </div>
      </div>
    `,
  });

  tippy("#skill-w", {
    ...commonConfig,
    content: `
      <div class="poe-tooltip" style="display: block !important; position: static !important; visibility: visible !important; opacity: 1 !important;">
        <div class="item-header">
          <span class="item-name">Capture Bug</span>
          <span class="item-base">Dexterity Skill</span>
        </div>
        <div class="item-content">
          <div class="stat-blue">Cooldown: 2 Seconds</div>
          <div class="separator"></div>
          <div>Creates a <span class="stat-white">Jira Ticket</span> target.</div>
          <div>Applying <span class="stat-blue">"Steps to Reproduce"</span> freezes the Developer.</div>
          <div>Screenshots gain <span class="stat-blue">+20%</span> clarity.</div>
          <div class="flavor-text">"Gotta catch 'em all."</div>
        </div>
      </div>
    `,
  });

  tippy("#skill-e", {
    ...commonConfig,
    content: `
      <div class="poe-tooltip" style="display: block !important; position: static !important; visibility: visible !important; opacity: 1 !important;">
        <div class="item-header">
          <span class="item-name">Automated Regression</span>
          <span class="item-base">Spell Totem</span>
        </div>
        <div class="item-content">
          <div class="stat-blue">Mana Cost: 100% Patience</div>
          <div class="separator"></div>
          <div>Summons a <span class="stat-white">Pipeline</span> to fight for you.</div>
          <div>Deals <span class="stat-blue">Mental Damage</span> to whoever broke the build.</div>
          <div><span class="stat-red" style="color:#ff5555">WARNING:</span> May fail randomly (Flaky).</div>
          <div class="flavor-text">"If it happens once, it's an accident. If it happens twice, write a script."</div>
        </div>
      </div>
    `,
  });

  tippy("#skill-r", {
    ...commonConfig,
    content: `
      <div class="poe-tooltip" style="display: block !important; position: static !important; visibility: visible !important; opacity: 1 !important;">
        <div class="item-header">
          <span class="item-name">Break Production</span>
          <span class="item-base">Vaal Ultimate</span>
        </div>
        <div class="item-content">
          <div class="stat-red" style="color:#ff5555">Souls Per Use: 1 Career</div>
          <div class="separator"></div>
          <div><span class="stat-blue">100%</span> Global Critical Strike Chance.</div>
          <div>Causes <span class="stat-red" style="color:#ff5555">Mass Panic</span> in the Slack Channel.</div>
          <div>Summons <span class="stat-white">The Manager</span> (Level 100 Boss).</div>
          <div>Cannot be evaded.</div>
          <div class="flavor-text">"I just wanted to see what this button does..."</div>
        </div>
      </div>
    `,
  });

  tippy("#skill-t", {
    ...commonConfig,
    content: `
      <div class="poe-tooltip" style="display: block !important; position: static !important; visibility: visible !important; opacity: 1 !important;">
        <div class="item-header">
          <span class="item-name">Teleport to Meeting</span>
          <span class="item-base">Utility Spell</span>
        </div>
        <div class="item-content">
          <div class="stat-blue">Duration: Too Long</div>
          <div class="separator"></div>
          <div>Escapes current work context.</div>
          <div>Reduces <span class="stat-blue">Productivity</span> by 75%.</div>
          <div>Grants buff: <span class="stat-white">"Sorry, I was on mute."</span></div>
          <div class="flavor-text">"Could this have been an email?"</div>
        </div>
      </div>
    `,
  });
}