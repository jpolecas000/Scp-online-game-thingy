// Zustand store for UI-relevant state only.
// Per-frame simulation data lives in gameState.js (mutable singleton).

import { create } from 'zustand';
import { FACTIONS, FACTION_MAP } from './factions.js';
import { gameState, initGameState, startDialogue as gsStartDialogue, endDialogue as gsEndDialogue, getDialogueNPC, getNearbyNPC } from './gameState.js';
import { generateGreeting, getDialogueOptions, getDialogueResponse } from './dialogue.js';
import { getAllNarrativeEvents, getRandomEvent } from './narrative.js';
import { SCPS } from './scps.js';

export const useGameStore = create((set, get) => ({
  // UI state
  phase: 'select', // 'select' | 'playing'
  playerFaction: null,
  activeDialogue: null, // { npcId, npcName, faction, factionColor, greeting, options }
  nearbyNPC: null, // { id, name, faction, factionColor }
  breachActive: false,
  breachSCPName: null,
  activeEvent: null,
  notifications: [],
  playerHealth: 100,
  showObjectives: false,
  objectives: [],

  selectFaction: (factionId) => {
    initGameState(factionId);
    set({
      phase: 'playing',
      playerFaction: factionId,
      activeDialogue: null,
      nearbyNPC: null,
      breachActive: false,
      breachSCPName: null,
      activeEvent: null,
      notifications: [],
      playerHealth: 100,
      showObjectives: false,
      objectives: [],
    });
  },

  backToFactionSelect: () => {
    gameState.initialized = false;
    set({
      phase: 'select',
      playerFaction: null,
      activeDialogue: null,
      nearbyNPC: null,
      breachActive: false,
      breachSCPName: null,
      activeEvent: null,
      notifications: [],
      showObjectives: false,
      objectives: [],
    });
  },

  // Called from the game loop to sync UI state
  syncFromGameState: () => {
    const state = get();
    const updates = {};

    // Nearby NPC
    const nearby = getNearbyNPC();
    const nearbyData = nearby ? {
      id: nearby.id,
      name: nearby.name,
      faction: nearby.faction,
      factionColor: nearby.factionColor,
    } : null;

    // Only update if changed
    if (JSON.stringify(nearbyData) !== JSON.stringify(state.nearbyNPC)) {
      updates.nearbyNPC = nearbyData;
    }

    // Breach state
    if (gameState.breachActive !== state.breachActive) {
      updates.breachActive = gameState.breachActive;
      updates.breachSCPName = gameState.breachNPCName;
    }

    // Active event
    if (gameState.activeEvent !== state.activeEvent) {
      updates.activeEvent = gameState.activeEvent;
      if (gameState.activeEvent) {
        updates.objectives = gameState.activeEvent.objectives || [];
      }
    }

    // New notifications
    if (gameState.notifications.length > 0) {
      const newNotifs = gameState.notifications.splice(0);
      updates.notifications = [...state.notifications, ...newNotifs].slice(-10);
    }

    // Player health
    if (gameState.player.health !== state.playerHealth) {
      updates.playerHealth = gameState.player.health;
    }

    if (Object.keys(updates).length > 0) {
      set(updates);
    }
  },

  startDialogue: () => {
    const npc = gsStartDialogue();
    if (!npc) return;
    const playerFaction = get().playerFaction;
    const greeting = generateGreeting(npc, playerFaction, gameState.breachActive, gameState.breachNPCName);
    const options = getDialogueOptions(npc, playerFaction, gameState.breachActive, gameState.breachNPCName);
    set({
      activeDialogue: {
        npcId: npc.id,
        npcName: npc.name,
        faction: npc.faction,
        factionColor: npc.factionColor,
        greeting,
        options,
        currentLine: greeting,
        selectedOption: null,
      },
    });
  },

  selectDialogueOption: (optionId) => {
    const dialogue = get().activeDialogue;
    if (!dialogue) return;
    const npc = getDialogueNPC();
    if (!npc) return;
    const playerFaction = get().playerFaction;
    const response = getDialogueResponse(optionId, npc, playerFaction, gameState.breachActive, gameState.breachNPCName);
    set({
      activeDialogue: {
        ...dialogue,
        currentLine: response,
        selectedOption: optionId,
        options: optionId === 'goodbye' ? [] : dialogue.options,
      },
    });
  },

  endDialogue: () => {
    gsEndDialogue();
    set({ activeDialogue: null });
  },

  triggerBreach: () => {
    // Manual trigger for testing
    import('./gameState.js').then(({ triggerBreach }) => {
      triggerBreach();
    });
  },

  dismissNotification: (notifId) => {
    set({
      notifications: get().notifications.filter(n => n.id !== notifId),
    });
  },

  toggleObjectives: () => {
    set({ showObjectives: !get().showObjectives });
  },
}));
