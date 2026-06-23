import React, { useRef, useEffect, useState } from 'react';
import { Loader2, ShieldCheck, Zap } from 'lucide-react';
import { Lobby } from '../types';
import { audio } from '../lib/audio';
import { useWallet } from '../hooks/useWallet';

interface GameClientProps {
  lobby: Lobby;
  onExit: () => void;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

import { genLayerService } from '../services/genlayer';

export default function GameClient({ lobby, onExit, difficulty = 'Medium' }: GameClientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { client, contractAddress, clearContractAddress } = useWallet();
  const [status, setStatus] = useState<string>('Syncing Genlayer Shard...');
  const [isReady, setIsReady] = useState(true);
  const [gameKey, setGameKey] = useState(0);
  const [gameOver, setGameOver] = useState<'won' | 'lost' | false>(false);
  const [finalKills, setFinalKills] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSaveScore = async () => {
    if (gameOver === false || finalKills === null || !contractAddress || !client) {
      if (!client) setSaveStatus("Please connect your wallet to save the score.");
      return;
    }

    setIsSaving(true);
    setTxHash(null);
    setSaveStatus('Protocol Validators are evaluating performance & reaching consensus (takes 10-20s)...');
    
    try {
      // Build a play summary to be passed to Intelligent Contract
      const outcome = gameOver === 'won' ? "Player survived and won the match." : "Player was destroyed in combat.";
      const summary = `Run ended with ${finalKills} kills on difficulty ${difficulty}. ${outcome}`;
      
      const hash = await genLayerService.submitMatch(contractAddress, difficulty, finalKills, summary);
      
      console.log("Tx hash:", hash);
      setTxHash(hash as string);
      setSaveStatus('Validated and saved on-chain successfully!');
    } catch (e: any) {
      console.error("Tx error details:", e);
      let errMsg = '';
      try {
        errMsg = (
          String(e?.message || '') + ' ' + 
          String(e?.details || '') + ' ' + 
          String(e?.error?.message || '') + ' ' + 
          JSON.stringify(e)
        ).toLowerCase();
      } catch {
        errMsg = String(e || '').toLowerCase();
      }

      if (
        errMsg.includes('not found') || 
        errMsg.includes('not_found') || 
        errMsg.includes('notfound') || 
        errMsg.includes('does not exist') ||
        errMsg.includes('invalid contract')
      ) {
        clearContractAddress();
      }

      setSaveStatus('Failed to save score on GenLayer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine if it's training mode
  const isTraining = lobby.name === 'Training Grounds' || lobby.players === 1 || lobby.players === 2;

  // Starting directly with countdown as requested

  useEffect(() => {
    if (!isReady || !canvasRef.current || gameOver) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game Constants
    const COLORS = ['#00E5FF', '#FF00FF', '#FFEA00']; // Cyan, Magenta, Yellow
    
    // Helper for safe spawning positions
    const getValidSpawnPosition = (existingEntities: {x: number, y: number, radius: number}[], width: number, height: number, padding: number, entityRadius: number): {x: number, y: number} => {
        let x = width / 2, y = height / 2;
        let attempts = 0;

        do {
            x = Math.random() * (width - 2 * padding) + padding;
            y = Math.random() * (height - 2 * padding) + padding;
            let collision = false;
            // Gradually reduce required distance if we're struggling to find space
            const minDistance = attempts > 200 ? 5 : (attempts > 100 ? entityRadius * 1.5 : entityRadius * 2.5);
            for (const entity of existingEntities) {
                if (Math.hypot(x - entity.x, y - entity.y) < entityRadius + entity.radius + minDistance) {
                    collision = true;
                    break;
                }
            }
            if (!collision) return { x, y };
            attempts++;
        } while (attempts < 500);
        return { x, y };
    };

    const PIP_COLOR_MAP: Record<string, { fill: string, trail: string, stroke: string }> = {
      '#FFEA00': { fill: '#FFEA00', trail: '#f59e0b', stroke: '#fff' },
      '#FF00FF': { fill: '#FF00FF', trail: '#db2777', stroke: '#fff' },
      '#00E5FF': { fill: '#00E5FF', trail: '#0284c7', stroke: '#fff' },
    };
    
    const getRandomColorObj = () => ({ ...PIP_COLOR_MAP[COLORS[Math.floor(Math.random() * COLORS.length)]] });

    const beats = (c1: string, c2: string, hp1: number, hp2: number) => {
       if (c1 === '#00E5FF' && c2 === '#FF00FF') return true; // Cyan beats Magenta (Pink)
       if (c1 === '#FF00FF' && c2 === '#FFEA00') return true; // Magenta beats Yellow
       if (c1 === '#FFEA00' && c2 === '#00E5FF') return true; // Yellow beats Cyan
       if (c1 === c2 && hp1 > hp2) return true; // Same color, higher HP wins
       return false;
    };
    
    // Set up canvas to resize dynamically
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    let w = canvas.width;
    let h = canvas.height;
    
    const PADDING = 120;
    const botEntities: {x: number, y: number, radius: number}[] = [];
    const minPadding = 120;
    const playerPos = getValidSpawnPosition(botEntities, w, h, minPadding, 20);
    // Add player implicitly to botEntities so bots avoid it
    botEntities.push({ x: playerPos.x, y: playerPos.y, radius: 20 });
    
    // Define bot player positions
    const botPlayers = (() => {
      const names = [ 'Node-Llama-3', 'Node-Gemini-1.5', 'Node-Claude-3', 'Node-Gemma-2', 'Node-DeepSeek-v3', 'Node-Mistral-Large', 'Node-GPT-4o', 'Node-Phi-3', 'Node-Qwen-2.5', 'Node-Mixtral' ];
      
      return isTraining ? Array.from({ length: difficulty === 'Hard' ? 10 : difficulty === 'Medium' ? 5 : 2 }).map((_, idx) => {
        const pos = getValidSpawnPosition(botEntities, w, h, minPadding, 20);
        botEntities.push({ x: pos.x, y: pos.y, radius: 20 });
        return {
          x: pos.x, y: pos.y, vx: 0, vy: 0, radius: 20,
          color: getRandomColorObj(), trail: [] as {x: number, y: number, life: number}[],
          targetX: 0, targetY: 0, waitTimer: 0, hp: 100, isBoosting: false, isDead: false, respawnTimer: 0,
          name: names[idx % names.length]
        };
      }) : [];
    })();

    // Generate initial pips based on player count (2 pips per player)
    const initialPipCount = lobby.players * 2;
    const initialPips = [];
    
    for (let i = 0; i < initialPipCount; i++) {
       const minX = Math.min(minPadding, w * 0.3);
       const maxX = Math.max(w - minX, w * 0.7);
       const minY = Math.min(minPadding, h * 0.3);
       const maxY = Math.max(h - minY, h * 0.7);
       
       let px = 0, py = 0;
       let attempts = 0;
       let collision = false;
       do {
          px = minX + Math.random() * (maxX - minX);
          py = minY + Math.random() * (maxY - minY);
          collision = false;
          for (const ent of botEntities) {
             if (Math.hypot(px - ent.x, py - ent.y) < ent.radius + 15 + 10) { // Reduced clearance to 10
                collision = true; break;
             }
          }
          attempts++;
       } while (collision && attempts < 200); // Increased attempts to 200

       if (!collision) {
          const radius = 15;
          botEntities.push({ x: px, y: py, radius }); // add pip to entities to avoid other pips spawning on it
          initialPips.push({
            x: px,
            y: py,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
          });
       }
    }
    
    const state = {
      gameStartTime: Date.now(),
      lastPipSpawnTime: Date.now(),
      mouseX: w / 2,
      mouseY: h / 2,
      screenShake: 0,
      kills: 0,
      floatingTexts: [] as {x: number, y: number, text: string, color: string, life: number}[],
      zone: { x: w / 2, y: h / 2, radius: Math.max(w, h) * 0.8 },
      player: { 
        x: playerPos.x, y: playerPos.y, vx: 0, vy: 0, radius: 20, 
        color: getRandomColorObj(), trail: [] as {x: number, y: number, life: number}[],
        hp: 100, isBoosting: false, isDead: false, respawnTimer: 0
      },
      bots: botPlayers,
      pips: initialPips as {x: number, y: number, color: string, isBox?: boolean, letter?: string}[],
      particles: [] as {x: number, y: number, vx: number, vy: number, life: number, color: string, size: number}[]
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === parent) {
           const newW = entry.contentRect.width;
           const newH = entry.contentRect.height;
           state.zone.x += (newW - canvas.width) / 2;
           state.zone.y += (newH - canvas.height) / 2;
           canvas.width = newW;
           canvas.height = newH;
        }
      }
    });
    if (parent) resizeObserver.observe(parent);

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      state.mouseX = (e.clientX - rect.left) * scaleX;
      state.mouseY = (e.clientY - rect.top) * scaleY;
    };

    const emitParticles = (x: number, y: number, color: string, count: number, speedMult: number = 1) => {
      for (let i = 0; i < count; i++) {
        state.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 10 * speedMult,
          vy: (Math.random() - 0.5) * 10 * speedMult,
          life: 1.0,
          color,
          size: Math.random() * 4 + 2
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      audio.init();
      if (Date.now() - state.gameStartTime < 3000) return; // Prevent actions during spawning countdown
      if (e.button === 0 && !state.player.isDead && state.player.hp > 25) {
        const dx = state.mouseX - state.player.x;
        const dy = state.mouseY - state.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            state.player.vx = (dx / dist) * 16; // Consistent dash impulse
            state.player.vy = (dy / dist) * 16;
            state.player.hp -= state.player.hp * 0.25; // Consume 25% HP
            
            audio.playBoost();
            
            // Boost particles backward
            for (let i = 0; i < 15; i++) {
               state.particles.push({
                 x: state.player.x, y: state.player.y,
                 vx: -(dx / dist) * (Math.random() * 5 + 2) + (Math.random() - 0.5) * 4,
                 vy: -(dy / dist) * (Math.random() * 5 + 2) + (Math.random() - 0.5) * 4,
                 life: 1.0, color: '#ffffff', size: Math.random() * 4 + 2
               });
            }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    // Physics Engine
    const applyPhysics = (entity: any, targetX: number, targetY: number, baseMaxSpd: number = 3) => {
      if (entity.isDead) return;

      // Update Radius dynamically based on HP (HP is unlimited but visual radius is capped at 55 for gameplay visibility)
      entity.radius = Math.min(55, 25 + entity.hp * 0.12);
      
      // All balls have the same speed, except those in critical state (exclamation mark)
      const isCritical = entity.hp <= 25;
      const moveSpeed = isCritical ? baseMaxSpd * 0.6 : baseMaxSpd;

      const dx = targetX - entity.x;
      const dy = targetY - entity.y;
      const dist = Math.hypot(dx, dy);

      // Desired velocity vector (Steering)
      let desiredVx = 0;
      let desiredVy = 0;
      
      const currentImpulse = Math.hypot(entity.vx, entity.vy);
      const isDashing = currentImpulse > moveSpeed * 1.5;

      // Only apply steering if not actively dashing, to prevent artificial braking
      if (dist > 2 && !isDashing) {
        desiredVx = (dx / dist) * Math.min(dist, moveSpeed);
        desiredVy = (dy / dist) * Math.min(dist, moveSpeed);
      }

      // Normal movement is applied directly. Impulses (vx, vy) decay naturally.
      entity.vx *= 0.9;
      entity.vy *= 0.9;

      // Move
      entity.x += entity.vx + desiredVx;
      entity.y += entity.vy + desiredVy;

      // Canvas boundary limits
      const padding = 2;
      if (entity.x < entity.radius + padding) {
        entity.x = entity.radius + padding;
        entity.vx *= -0.5;
      } else if (entity.x > canvas.width - entity.radius - padding) {
        entity.x = canvas.width - entity.radius - padding;
        entity.vx *= -0.5;
      }
      if (entity.y < entity.radius + padding) {
        entity.y = entity.radius + padding;
        entity.vy *= -0.5;
      } else if (entity.y > canvas.height - entity.radius - padding) {
        entity.y = canvas.height - entity.radius - padding;
        entity.vy *= -0.5;
      }

      // Trail generation
      const speed = Math.hypot(entity.vx, entity.vy);
      if (speed > 1) {
        if (Math.random() > 0.3) {
          entity.trail.push({ x: entity.x, y: entity.y, life: 1.0 });
        }
      }
      
      // Update trail
      entity.trail.forEach((t: any) => t.life -= 0.05);
      entity.trail = entity.trail.filter((t: any) => t.life > 0);
    };

    const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(-r/2, -r/2, r, r);
      ctx.restore();
    };

    // Render loop
    const render = () => {
      // Dynamic Canvas Stats
      w = canvas.width;
      h = canvas.height;

      const countdownLeft = 3000 - (Date.now() - state.gameStartTime);

      if (countdownLeft > 0) {
        // Freeze movement during countdown, keep zone max radius constant
        state.zone.radius = Math.max(w, h) * 0.8;
        
        state.player.vx = 0;
        state.player.vy = 0;
        state.player.radius = Math.min(55, 25 + state.player.hp * 0.12);

        state.bots.forEach(bot => {
          bot.vx = 0;
          bot.vy = 0;
          bot.radius = Math.min(55, 25 + bot.hp * 0.12);
        });

        // Decay screen shake
        if (state.screenShake > 0) {
          state.screenShake *= 0.9;
          if (state.screenShake < 0.5) state.screenShake = 0;
        }
      } else {
        // 1. Logic Update
        state.zone.radius -= 0.15; // Shrink zone

        // Player Follows Mouse
        applyPhysics(state.player, state.mouseX, state.mouseY, 3.0);

        // Agent logic
        const allEntities = [state.player, ...state.bots].filter(e => !e.isDead);
        const isHard = difficulty === 'Hard';
        const isEasy = difficulty === 'Easy';
        const botBaseSpeed = isHard ? 3.5 : isEasy ? 2.0 : 3.0;

        state.bots.forEach(bot => {
          if (bot.isDead) return;
          bot.waitTimer -= 1;
          if (bot.waitTimer <= 0) {
            bot.waitTimer = Math.random() * (isHard ? 10 : isEasy ? 40 : 20) + (isHard ? 5 : isEasy ? 20 : 10);

            // Evaluate threats and prey
            let nearestThreat: any = null;
            let nearestPrey: any = null;
            let threatDist = Infinity;
            let preyDist = Infinity;
            
            const sightRange = isHard ? 600 : isEasy ? 200 : 400;

            allEntities.forEach(other => {
               if (other === bot) return;
               const d = Math.hypot(other.x - bot.x, other.y - bot.y);
               if (d > sightRange) return;
               
               // Does other beat bot?
               if (beats(other.color.fill, bot.color.fill, other.hp, bot.hp)) {
                  if (d < threatDist) { threatDist = d; nearestThreat = other; }
               } else if (beats(bot.color.fill, other.color.fill, bot.hp, other.hp)) {
                  if (d < preyDist) { preyDist = d; nearestPrey = other; }
               }
            });

            let botHasTarget = false;
            
            if (nearestThreat && threatDist < (isHard ? 400 : 250)) {
               // Run away
               const dx = bot.x - nearestThreat.x;
               const dy = bot.y - nearestThreat.y;
               bot.targetX = Math.max(50, Math.min(w - 50, bot.x + dx));
               bot.targetY = Math.max(50, Math.min(h - 50, bot.y + dy));
               botHasTarget = true;
            } else if (nearestPrey && preyDist < (isHard ? 500 : 300)) {
               // Chase!
               bot.targetX = nearestPrey.x;
               bot.targetY = nearestPrey.y;
               botHasTarget = true;
            } else {
               // Find closest pip
               let closestPip = state.pips[0];
               let minDist = Infinity;
               state.pips.forEach(p => {
                 const d = Math.hypot(p.x - bot.x, p.y - bot.y);
                 if (d < minDist) { minDist = d; closestPip = p; }
               });
               
               if (closestPip && minDist < sightRange) {
                 bot.targetX = closestPip.x;
                 bot.targetY = closestPip.y;
                 botHasTarget = true;
               }
            }
            
            // Fallback or stay near center
            if (!botHasTarget) {
               bot.targetX = state.zone.x + (Math.random() - 0.5) * state.zone.radius * 0.5;
               bot.targetY = state.zone.y + (Math.random() - 0.5) * state.zone.radius * 0.5;
            }
            
            // Safety: If outside zone, run back to zone!
            const distToZone = Math.hypot(bot.x - state.zone.x, bot.y - state.zone.y);
            if (distToZone > state.zone.radius * 0.8) {
               bot.targetX = state.zone.x;
               bot.targetY = state.zone.y;
            }

            // Smart Dash: Dash if fleeing a threat or chasing prey and having enough HP
            const dashProb = isHard ? 0.4 : isEasy ? 0.9 : 0.6;
            if (bot.hp > 80 && Math.random() > dashProb && (nearestThreat || nearestPrey)) {
              const dx = bot.targetX - bot.x;
              const dy = bot.targetY - bot.y;
              const dist = Math.hypot(dx, dy);
              if (dist > 0) {
                bot.vx = (dx / dist) * 16;
                bot.vy = (dy / dist) * 16;
                bot.hp -= bot.hp * 0.25;
                
                for (let i = 0; i < 10; i++) {
                   state.particles.push({
                     x: bot.x, y: bot.y,
                     vx: -(dx / dist) * (Math.random() * 5 + 2) + (Math.random() - 0.5) * 4,
                     vy: -(dy / dist) * (Math.random() * 5 + 2) + (Math.random() - 0.5) * 4,
                     life: 1.0, color: '#ffffff', size: Math.random() * 3 + 1
                   });
                }
              }
            }
          }
          applyPhysics(bot, bot.targetX, bot.targetY, botBaseSpeed);
        });

        // Combat Collision Detection
        const addFloatingText = (x: number, y: number, text: string, color: string) => {
           state.floatingTexts.push({ x, y, text, color, life: 1.0 });
        };

        const entities = [state.player, ...state.bots].filter(e => !e.isDead);
        
        for (let i = 0; i < entities.length; i++) {
          for (let j = i + 1; j < entities.length; j++) {
            const e1 = entities[i];
            const e2 = entities[j];
            let dx = e2.x - e1.x;
            let dy = e2.y - e1.y;
            let dist = Math.hypot(dx, dy);
            
            if (dist === 0) {
               dx = (Math.random() - 0.5);
               dy = (Math.random() - 0.5);
               dist = Math.hypot(dx, dy);
            }

            if (dist < e1.radius + e2.radius) {
              // Physical bounce
              const overlap = (e1.radius + e2.radius) - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              
              // push apart
              e1.x -= nx * (overlap / 2 + 1); // add a slight extra push to ensure separation
              e1.y -= ny * (overlap / 2 + 1);
              e2.x += nx * (overlap / 2 + 1);
              e2.y += ny * (overlap / 2 + 1);
              
              // exchange velocity
              const p = 2 * (e1.vx * nx + e1.vy * ny - e2.vx * nx - e2.vy * ny) / 2;
              e1.vx -= p * nx * 0.95;
              e1.vy -= p * ny * 0.95;
              e2.vx += p * nx * 0.95;
              e2.vy += p * ny * 0.95;
              
              // Combat rules: Rock-Paper-Scissors
              const c1 = e1.color.fill;
              const c2 = e2.color.fill;
              
               if (beats(c1, c2, e1.hp, e2.hp)) {
                 emitParticles(e2.x, e2.y, c2, 15, 1.5);
                 if (e2.hp <= 25) {
                   e1.hp += e2.hp;
                   e2.hp = 0;
                   addFloatingText(e2.x, e2.y, "CRUSHED!", c1);
                   if (e1 === state.player) { audio.playEat(); state.screenShake = 10; state.kills++; }
                   else if (e2 === state.player) { audio.playEat(); state.screenShake = 20; }
                 } else {
                   e2.hp -= 20;
                   e1.hp += 10;
                   e1.vx -= nx * 4.5;
                   e1.vy -= ny * 4.5;
                   e2.vx += nx * 9;
                   e2.vy += ny * 9;
                   addFloatingText(e2.x, e2.y, "-20", "#ef4444");
                   addFloatingText(e1.x, e1.y, "+10", "#10b981");
                   if (e1 === state.player) { audio.playBump(); state.screenShake = 5; }
                   if (e2 === state.player) { audio.playDamage(); state.screenShake = 15; }
                 }
              } else if (beats(c2, c1, e2.hp, e1.hp)) {
                 emitParticles(e1.x, e1.y, c1, 15, 1.5);
                 if (e1.hp <= 25) {
                   e2.hp += e1.hp;
                   e1.hp = 0;
                   addFloatingText(e1.x, e1.y, "CRUSHED!", c2);
                   if (e2 === state.player) { audio.playEat(); state.screenShake = 10; state.kills++; }
                   else if (e1 === state.player) { audio.playEat(); state.screenShake = 20; }
                 } else {
                   e1.hp -= 20;
                   e2.hp += 10;
                   e1.vx -= nx * 9;
                   e1.vy -= ny * 9;
                   e2.vx += nx * 4.5;
                   e2.vy += ny * 4.5;
                   addFloatingText(e1.x, e1.y, "-20", "#ef4444");
                   addFloatingText(e2.x, e2.y, "+10", "#10b981");
                   if (e2 === state.player) { audio.playBump(); state.screenShake = 5; }
                   if (e1 === state.player) { audio.playDamage(); state.screenShake = 15; }
                 }
              } else {
                 // Tie - larger damages smaller. If much smaller/critical, eat them.
                 emitParticles((e1.x + e2.x) / 2, (e1.y + e2.y) / 2, '#ffffff', 10, 1.0);
                 e1.vx -= nx * 5.5;
                 e1.vy -= ny * 5.5;
                 e2.vx += nx * 5.5;
                 e2.vy += ny * 5.5;
                 if (e1 === state.player || e2 === state.player) { audio.playBump(); state.screenShake = 8; }
                 
                 if (e1.hp > e2.hp) {
                    if (e2.hp <= 25) {
                       e1.hp += e2.hp;
                       e2.hp = 0;
                       addFloatingText(e2.x, e2.y, "CRUSHED!", c1);
                       if (e1 === state.player) { state.kills++; }
                    } else {
                       e2.hp -= 15;
                       e1.hp += 5;
                       addFloatingText(e2.x, e2.y, "-15", "#ef4444");
                       addFloatingText(e1.x, e1.y, "+5", "#10b981");
                    }
                 } else if (e2.hp > e1.hp) {
                    if (e1.hp <= 25) {
                       e2.hp += e1.hp;
                       e1.hp = 0;
                       addFloatingText(e1.x, e1.y, "CRUSHED!", c2);
                       if (e2 === state.player) { state.kills++; }
                    } else {
                       e1.hp -= 15;
                       e2.hp += 5;
                       addFloatingText(e1.x, e1.y, "-15", "#ef4444");
                       addFloatingText(e2.x, e2.y, "+5", "#10b981");
                    }
                 } else {
                   if (e1.hp <= 25) e1.hp = 0; else e1.hp -= 10;
                   if (e2.hp <= 25) e2.hp = 0; else e2.hp -= 10;
                   addFloatingText(e1.x, e1.y, "-10", "#ef4444");
                   addFloatingText(e2.x, e2.y, "-10", "#ef4444");
                 }
              }

              // Check if dead immediately after combat
              const checkDeath = (ent: any) => {
                 if (ent.hp <= 0 && !ent.isDead) { 
                   ent.hp = 0; 
                   ent.isDead = true; 
                   // Drop lucky box (clamped inside safe boundaries)
                   const minX = Math.min(PADDING, canvas.width * 0.3);
                   const maxX = Math.max(canvas.width - minX, canvas.width * 0.7);
                   const minY = Math.min(PADDING, canvas.height * 0.3);
                   const maxY = Math.max(canvas.height - minY, canvas.height * 0.7);
                   const boxX = Math.max(minX, Math.min(maxX, ent.x));
                   const boxY = Math.max(minY, Math.min(maxY, ent.y));

                   state.pips.push({
                      x: boxX, y: boxY, color: ent.color.fill, isBox: true, letter: 'R'
                   });
                 }
              };
              checkDeath(e1);
              checkDeath(e2);
            }
          }
        }

        // Pip collection
        const checkPips = (entity: any) => {
          if (entity.isDead) return;
          state.pips = state.pips.filter(pip => {
            const dist = Math.hypot(pip.x - entity.x, pip.y - entity.y);
            if (dist < entity.radius + (pip.isBox ? 15 : 5)) {
              entity.hp += pip.isBox ? 30 : 10; // Grow and heal
              
              if (entity === state.player) {
                audio.playCollect();
              }

              // Change color
              if (!pip.isBox && PIP_COLOR_MAP[pip.color]) {
                entity.color = { ...PIP_COLOR_MAP[pip.color] };
              }

              return false;
            }
            return true;
          });
        };
        
        checkPips(state.player);
        state.bots.forEach(checkPips);

        // Pip Spawning (Every second, 1 or 2 pips)
        if (Date.now() - state.lastPipSpawnTime > 1000) {
          state.lastPipSpawnTime = Date.now();
          const spawnCount = Math.random() < 0.5 ? 1 : 2;
          for (let i = 0; i < spawnCount; i++) {
            let px = 0, py = 0;
            let collision = true;
            let attempts = 0;
            
            while (collision && attempts < 20) {
                const r = Math.random() * state.zone.radius * 0.9;
                const theta = Math.random() * Math.PI * 2;
                px = state.zone.x + Math.cos(theta) * r;
                py = state.zone.y + Math.sin(theta) * r;

                const minX = Math.min(PADDING, canvas.width * 0.3);
                const maxX = Math.max(canvas.width - minX, canvas.width * 0.7);
                const minY = Math.min(PADDING, canvas.height * 0.3);
                const maxY = Math.max(canvas.height - minY, canvas.height * 0.7);

                px = Math.max(minX, Math.min(maxX, px));
                py = Math.max(minY, Math.min(maxY, py));
                
                collision = false;
                const aliveEntities = [state.player, ...state.bots].filter(e => !e.isDead);
                for (const ent of aliveEntities) {
                    if (Math.hypot(px - ent.x, py - ent.y) < ent.radius + 15 + 10) {
                        collision = true;
                        break;
                    }
                }
                attempts++;
            }

            if (!collision) {
                state.pips.push({
                  x: px,
                  y: py,
                  color: COLORS[Math.floor(Math.random() * COLORS.length)]
                });
            }
          }
        }

        // Zone Damage
        const applyZoneDamage = (entity: any) => {
          if (entity.isDead) return;
          const distFromCenter = Math.hypot(entity.x - state.zone.x, entity.y - state.zone.y);
          if (distFromCenter > state.zone.radius) {
            entity.hp -= 0.5;
          }
          if (entity.hp <= 0 && !entity.isDead) {
            entity.hp = 0;
            entity.isDead = true;

            const minX = Math.min(PADDING, canvas.width * 0.3);
            const maxX = Math.max(canvas.width - minX, canvas.width * 0.7);
            const minY = Math.min(PADDING, canvas.height * 0.3);
            const maxY = Math.max(canvas.height - minY, canvas.height * 0.7);
            const boxX = Math.max(minX, Math.min(maxX, entity.x));
            const boxY = Math.max(minY, Math.min(maxY, entity.y));

            state.pips.push({ x: boxX, y: boxY, color: entity.color.fill, isBox: true, letter: 'R' });
          }
        };

        applyZoneDamage(state.player);
        state.bots.forEach(applyZoneDamage);

        // Update screen shake
        if (state.screenShake > 0) {
          state.screenShake *= 0.9;
          if (state.screenShake < 0.5) state.screenShake = 0;
        }
      }

      ctx.save();
      if (state.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * state.screenShake;
        const shakeY = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // 2. Clear & Draw Background
      ctx.fillStyle = '#040608'; // Deep space digital black
      ctx.fillRect(0, 0, w, h);

      // Draw active scrolling cyber-grid
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.05)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      const scrollOffset = (Date.now() / 65) % gridSpacing;
      for (let x = -gridSpacing; x < w + gridSpacing; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x + scrollOffset, 0);
        ctx.lineTo(x + scrollOffset, h);
        ctx.stroke();
      }
      for (let y = -gridSpacing; y < h + gridSpacing; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y + scrollOffset);
        ctx.lineTo(w, y + scrollOffset);
        ctx.stroke();
      }
      ctx.restore();

      // Draw faint blockchain consensus linkages (peer-to-peer visual channels)
      ctx.save();
      const activeEntities = [state.player, ...state.bots].filter(e => !e.isDead);
      ctx.lineWidth = 0.5;
      for (let i = 0; i < activeEntities.length; i++) {
        for (let j = i + 1; j < activeEntities.length; j++) {
          const e1 = activeEntities[i];
          const e2 = activeEntities[j];
          const dist = Math.hypot(e1.x - e2.x, e1.y - e2.y);
          if (dist < 180) {
            if (e1.color.fill === e2.color.fill) {
              ctx.strokeStyle = 'rgba(52, 211, 153, 0.15)'; // Syncing state
            } else {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            }
            ctx.beginPath();
            ctx.moveTo(e1.x, e1.y);
            ctx.lineTo(e2.x, e2.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Draw map boundary band (elastic border)
      const padding = 2;
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2);
      ctx.restore();

      // 3. Draw Zone (outside is dark)
      ctx.save();
      ctx.beginPath();
      ctx.arc(state.zone.x, state.zone.y, Math.max(state.zone.radius, 0), 0, Math.PI * 2);
      ctx.rect(w, 0, -w, h); // Inverse clip
      ctx.clip('evenodd');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Zone border
      ctx.beginPath();
      ctx.arc(state.zone.x, state.zone.y, Math.max(state.zone.radius, 0), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Red outline for desync barrier
      ctx.lineWidth = 3;
      ctx.stroke();

      // 4. Draw Pips / Boxes
      state.pips.forEach(pip => {
        if (pip.isBox) {
           ctx.save();
           ctx.translate(pip.x, pip.y);
           ctx.shadowColor = pip.color;
           ctx.shadowBlur = 15;
           ctx.fillStyle = pip.color;
           ctx.fillRect(-8, -8, 16, 16);
           
           if (pip.letter) {
              ctx.fillStyle = '#111827';
              ctx.font = 'bold 12px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(pip.letter, 0, 0);
           }
           ctx.restore();
        } else {
           drawDiamond(ctx, pip.x, pip.y, 8, pip.color);
        }
      });

      // 5. Draw Entities (Player & Bots)
      const drawEntity = (entity: any) => {
        if (entity.isDead) return;

        // Trail
        entity.trail.forEach((t: any) => {
          ctx.beginPath();
          ctx.arc(t.x, t.y, entity.radius * 0.8 * t.life, 0, Math.PI * 2);
          ctx.fillStyle = entity.color.trail;
          ctx.globalAlpha = t.life * 0.5;
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Ball
        ctx.beginPath();
        ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
        ctx.fillStyle = entity.color.fill;
        ctx.fill();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = entity.color.stroke;
        ctx.stroke();

        // Warning indicator if this bot can beat the player
        if (entity !== state.player && beats(entity.color.fill, state.player.color.fill, entity.hp, state.player.hp)) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(entity.x, entity.y, entity.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.stroke();
          ctx.restore();
        }

        // Target pointing indicator ring for player (pointing/facing towards the mouse cursor)
        if (entity === state.player && !entity.isDead) {
          ctx.save();
          const angle = Math.atan2(state.mouseY - entity.y, state.mouseX - entity.x);
          const ringRadius = entity.radius + 12;

          // Draw the concentric outer circle ring line matching the player's stroke style
          ctx.beginPath();
          ctx.arc(entity.x, entity.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = entity.color.stroke || '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.globalAlpha = 0.65;
          ctx.stroke();

          // Draw the direction indicator arrowhead on the ring pointing outward
          ctx.translate(entity.x, entity.y);
          ctx.rotate(angle);

          ctx.beginPath();
          const arrowSize = 6.5;
          // Triangle points outwards on the ring perimeter
          ctx.moveTo(ringRadius - arrowSize * 0.5, -arrowSize);
          ctx.lineTo(ringRadius + arrowSize * 1.5, 0); // Outward tip
          ctx.lineTo(ringRadius - arrowSize * 0.5, arrowSize);
          ctx.closePath();
          ctx.fillStyle = entity.color.stroke || '#ffffff';
          ctx.globalAlpha = 0.95;
          ctx.fill();

          ctx.restore();
        }

        // Bot / Player Name Label Above (Skipped for player as requested to keep UI clean and minimalist)


        // Draw elegant high-tech GenLayer logo inside the nodes (with warning state if low HP)
        ctx.save();
        ctx.translate(entity.x, entity.y);
        
        const logoSize = entity.radius * 0.58;
        const pulse = Math.abs(Math.sin(Date.now() / 200));
        
        // Setup styling based on entity and state
        if (entity.hp <= 25) {
          // Critical state styling (red warning pulse)
          ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + pulse * 0.6})`;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
        } else {
          // Normal clean styling
          const isYellowOrCyan = entity.color.fill === '#FFEA00' || entity.color.fill === '#00E5FF';
          if (entity === state.player) {
            if (isYellowOrCyan) {
              // High contrast dark/matte slate logo on bright yellow/cyan backgrounds
              ctx.fillStyle = '#0f172a'; // Deep slate dark for maximum visibility
              ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
              ctx.shadowBlur = 4;
            } else {
              // White/bright logo with crisp white glow on magenta backgrounds
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 12;
            }
          } else {
            // Bots get contrasting logo style matching their team background contrast
            if (isYellowOrCyan) {
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Dark grey on yellow/cyan
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'; // Crisp white on hot magenta/pink
            }
            ctx.shadowBlur = 0;
          }
        }

        const s = logoSize;

        // Draw the GenLayer Logo exactly using Path2D
        ctx.save();
        ctx.scale(s / 31.5, s / 31.5);
        ctx.translate(-31.5, -30);
        
        const path1 = new Path2D("M28.2569 20.762L17.6973 43.0771L27.6377 48.0703L0 59L28.2569 0V20.762Z");
        const path2 = new Path2D("M34.1562 20.762L44.7159 43.0771L34.7755 48.0703L62.4132 59L34.1562 0V20.762Z");
        const path3 = new Path2D("M31.0531 28.0977L37.2395 40.3944L31.0531 43.4429L25.1987 40.3816L31.0531 28.0977Z");

        ctx.fill(path1);
        ctx.fill(path2);
        ctx.fill(path3);
        
        ctx.restore();

        ctx.restore();
      };

      state.bots.forEach(drawEntity);
      drawEntity(state.player);



      // Particle Update & Draw
      for (let i = state.particles.length - 1; i >= 0; i--) {
         const p = state.particles[i];
         p.x += p.vx;
         p.y += p.vy;
         p.life -= 0.05;
         
         if (p.life <= 0) {
            state.particles.splice(i, 1);
         } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
         }
      }
      ctx.globalAlpha = 1.0;

      // Draw and update floating texts
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
         const ft = state.floatingTexts[i];
         ft.y -= 1; // float up
         ft.life -= 0.02; // fade out
         
         ctx.globalAlpha = Math.max(0, ft.life);
         ctx.fillStyle = ft.color;
         ctx.font = 'bold 16px sans-serif';
         ctx.textAlign = 'center';
         ctx.fillText(ft.text, ft.x, ft.y);
         
         if (ft.life <= 0) {
            state.floatingTexts.splice(i, 1);
         }
      }
      ctx.globalAlpha = 1.0;

      // Restore screen shake transform before HUD
      ctx.restore();

      // Spawning countdown overlay
      if (countdownLeft > 0) {
        ctx.save();
        ctx.font = 'bold 60px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(Math.ceil(countdownLeft / 1000).toString(), w - 20, 10);
        ctx.restore();
      }



      // Status text overlay (warnings only)
      if (!state.player.isDead && Math.hypot(state.player.x - state.zone.x, state.player.y - state.zone.y) > state.zone.radius) {
         ctx.font = 'bold 12px JetBrains Mono, monospace';
         ctx.fillStyle = '#ff3366';
         ctx.fillText('NETWORK DESYNCHRONIZATION IN PROGRESS (AUDITING CORRUPT STATE)', 20, h - 70);
      }

      // Update Bottom HTML HUD bar values
      const hpHud = document.getElementById('hud-player-hp');
      if (hpHud) {
        if (state.player.isDead) {
          hpHud.textContent = 'ELIMINATED';
          hpHud.className = "text-[#ff0055] text-2xl font-black font-sans tracking-tight";
        } else {
          hpHud.textContent = `${Math.round(state.player.hp)} HP`;
          hpHud.className = "text-white text-2xl md:text-3xl font-black font-sans tracking-tight";
        }
      }

      const chipHud = document.getElementById('hud-hp-chip');
      if (chipHud) {
        if (state.player.isDead) {
          chipHud.style.opacity = '0.15';
        } else {
          chipHud.style.opacity = '1';
          if (state.player.color?.fill) {
            chipHud.style.backgroundColor = state.player.color.fill;
          }
        }
      }

      const killsHud = document.getElementById('hud-match-kills');
      if (killsHud) {
        killsHud.textContent = state.kills.toString();
      }

      const botsRemainingCount = state.bots.filter(b => !b.isDead).length;
      const botsHud = document.getElementById('hud-bots-count');
      if (botsHud) {
        botsHud.textContent = botsRemainingCount.toString();
      }
      
      if (state.player.isDead) {
         setFinalKills(state.kills);
         setGameOver('lost');
         audio.playLose();
         return; // Stop render loop
      } else if (state.bots.length > 0 && state.bots.every(b => b.isDead)) {
         setFinalKills(state.kills);
         setGameOver('won');
         audio.playWin();
         return; // Stop render loop
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isReady, lobby, gameKey]);

  if (!isReady) {
    return (
      <div className="relative w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center space-y-6 overflow-hidden">
        <Loader2 className="w-12 h-12 text-white animate-spin relative z-10" />
        <div className="font-mono text-lg text-slate-300 relative z-10">{status}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Game Field Container */}
      <div className="flex-1 w-full relative min-h-0">
        <canvas 
          ref={canvasRef}
          className="relative z-10 w-full h-full cursor-crosshair block"
        />
        
        {gameOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none bg-black/80 backdrop-blur-md">
            {gameOver === 'won' ? (
               <div className="text-center mb-6 animate-in fade-in zoom-in duration-500">
                 <h2 className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] mb-2">WINNER!</h2>
                 <p className="text-lg font-mono text-white">You survived The Darkness</p>
               </div>
            ) : (
               <div className="text-center mb-6 animate-in fade-in zoom-in duration-500">
                 <h2 className="text-5xl font-black text-[#ff0055] drop-shadow-[0_0_15px_rgba(255,0,85,0.5)] mb-2">ELIMINATED</h2>
                 <p className="text-lg font-mono text-slate-300">You were destroyed</p>
               </div>
            )}

            {/* Current Score */}
            <div className="mb-8 text-center animate-pulse">
              <span className="text-sm font-mono text-zinc-500 tracking-widest uppercase">Match Performance</span>
              <div className="text-3xl font-bold text-white tracking-wide">
                {finalKills} <span className="text-sm font-mono text-zinc-400">KILLS</span>
              </div>
            </div>

            {/* On-Chain Saving Status */}
            <div className="w-full max-w-[450px] mx-auto px-6 py-4 rounded-xl border border-white/5 bg-zinc-950/80 mb-6 text-center pointer-events-auto flex flex-col items-center justify-center gap-3">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">GENLAYER LEDGER</span>
              
              {!txHash && !isSaving && (
                 <button
                   onClick={handleSaveScore}
                   className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-sm rounded-lg transition-colors active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-2"
                 >
                   RECORD MATCH ON-CHAIN
                 </button>
              )}

              <div className="flex items-center gap-2 text-sm text-zinc-300 font-mono text-center">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                ) : txHash ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : null}
                <span className={txHash ? "text-emerald-400 font-medium" : "text-zinc-300"}>
                  {saveStatus || 'Awaiting manual save...'}
                </span>
              </div>

              {txHash && (
                <div className="w-full text-center mt-2 flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-500">TRANSACTION HASH</span>
                  <span className="font-mono text-xs text-zinc-300 bg-white/5 py-1 px-2.5 rounded max-w-full truncate pointer-events-auto select-all selection:bg-cyan-500 selection:text-black">
                    {txHash}
                  </span>
                </div>
              )}
            </div>
            
            <button 
              onClick={onExit}
              disabled={isSaving}
              className={`pointer-events-auto px-8 py-3 rounded-full font-bold transition-all flex items-center space-x-2 ${isSaving ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed' : 'bg-white hover:bg-zinc-200 text-black shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-95'}`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              <span>{isSaving ? 'Registering...' : 'Return to Lobbies'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom HUD Bar under the game cadre */}
      <div className="h-[64px] border-t border-white/5 bg-[#06060f] flex items-center justify-between px-6 relative z-20 select-none">
        {/* Left panel info */}
        <div className="flex items-center gap-6">
           <button 
             onClick={onExit}
             className="bg-zinc-900/50 hover:bg-zinc-800 hover:text-rose-400 text-zinc-400 border border-zinc-800/80 px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 focus:outline-none pointer-events-auto cursor-pointer"
           >
             Exit Match
           </button>
           
           <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
              <div>KILLS: <span id="hud-match-kills" className="text-white font-bold font-sans text-sm">0</span></div>
              <span className="text-zinc-800">|</span>
              <div>BOTS REMAINING: <span id="hud-bots-count" className="text-rose-400 font-bold font-sans text-sm">--</span></div>
           </div>
        </div>

        {/* Right panel HP info */}
        <div className="flex items-center gap-3">
           <span id="hud-player-hp" className="text-white text-2xl md:text-3xl font-black font-sans tracking-tight">100 HP</span>
           <div id="hud-hp-chip" className="w-8 h-8 rounded-full flex items-center justify-center relative border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-all">
              {/* Dotted inner ring */}
              <div className="absolute inset-1 rounded-full border border-dashed border-white/50" />
              {/* Spade icon / GenLayer indicator */}
              <svg className="w-3.5 h-3.5 text-white z-10" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12,2L3,15.5H12V22L21,8.5H12V2Z" />
              </svg>
           </div>
        </div>
      </div>
    </div>
  );
}
