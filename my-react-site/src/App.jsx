import React, { useState, useEffect, useCallback, useReducer, useRef } from 'react';

// ==================== GAME DATA ====================
const RACES = ['人类', '矮人', '暗夜精灵', '侏儒', '兽人', '巨魔', '牛头人', '亡灵'];
const CLASSES = {
    protection_warrior: {
        id: 'protection_warrior',
        name: '防护战士',
        baseStats: { hp: 150, mp: 50, attack: 15, spellPower: 5, armor: 30, magicResist: 10, blockValue: 20},
        skills: [
            { level: 1, skillId: 'basic_attack' },
            { level: 1, skillId: 'rest' },
            { level: 3, skillId: 'shield_bash' },
            { level: 5, skillId: 'shield_block' },
            { level: 10, skillId: 'revenge' },
        ]
    }
};

const SKILLS = {
    basic_attack: {
        limit: 20,
        id: 'basic_attack',
        name: '普通攻击',
        description: '造成基于攻击强度的伤害',
        icon: '⚔️',
        type: 'damage',
        calculate: (char) => {
            let damage = char.stats.attack * 1.2;
            if (Math.random() < char.stats.critRate/100) {
                damage *= char.stats.critDamage;
                return { damage: Math.floor(damage), isCrit: true };
            }
            damage *= (1 + char.stats.versatility / 100);
            return { damage: Math.floor(damage), isCrit: false };
        }
    },
    rest: {
        limit: 20,
        id: 'rest',
        name: '休息',
        description: '回复基于血量上限的生命',
        icon: '💤',
        type: 'heal',
        calculate: (char) => ({ heal: Math.floor(char.stats.maxHp * 0.05) })
    },
    shield_bash: {
        limit: 3,
        id: 'shield_bash',
        name: '盾牌猛击',
        description: '造成基于攻击强度和格挡值的伤害',
        icon: '🛡️',
        type: 'damage',
        calculate: (char) => {
            let damage = char.stats.attack * 1.5 + char.stats.blockValue * 0.3;
            damage *= (1 + char.stats.mastery / 100);
            if (Math.random() < char.stats.critRate/100) {
                damage *= char.stats.critDamage;
                return { damage: Math.floor(damage), isCrit: true };
            }
            damage *= (1 + char.stats.versatility / 100);
            return { damage: Math.floor(damage), isCrit: false };
        }
    },
    shield_block: {
        limit: 2,
        id: 'shield_block',
        name: '盾牌格挡',
        description: '获得40%格挡率加成，持续2帧',
        icon: '🔰',
        type: 'buff',
        duration: 2,
        calculate: () => ({ buff: { blockRate: 0.4, duration: 2 } })
    },
    revenge: {
        limit: 2,
        id: 'revenge',
        name: '复仇',
        description: '造成基于攻击强度的高额伤害',
        icon: '💥',
        type: 'damage',
        calculate: (char) => {
            let damage = char.stats.attack * 2.5;
            if (Math.random() < char.stats.critRate/100) {
                damage *= char.stats.critDamage;
                return { damage: Math.floor(damage), isCrit: true };
            }
            damage *= (1 + char.stats.versatility / 100);
            return { damage: Math.floor(damage), isCrit: false };
        }
    }
};

const ZONES = {
    elwynn_forest: {
        id: 'elwynn_forest',
        name: '艾尔文森林',
        level: 1,
        type: 'explore',
        enemies: [
            { name: '狼', hp: 30, attack: 5, defense: 2, exp: 10, gold: 5 },
            { name: '土匪', hp: 50, attack: 8, defense: 5, exp: 20, gold: 15 },
        ],
        resources: ['木材', '草药'],
        unlocked: true
    },
    westfall: {
        id: 'westfall',
        name: '西部荒野',
        level: 5,
        type: 'explore',
        enemies: [
            { name: '收割机傀儡', hp: 80, attack: 12, defense: 8, exp: 35, gold: 25 },
            { name: '迪菲亚盗贼', hp: 100, attack: 15, defense: 10, exp: 50, gold: 40 },
        ],
        resources: ['铁矿', '毛皮'],
        unlocked: false,
        unlockLevel: 5
    },
    redridge: {
        id: 'redridge',
        name: '赤脊山',
        level: 10,
        type: 'explore',
        enemies: [
            { name: '豺狼人', hp: 1500, attack: 20, defense: 150, exp: 80, gold: 60 },
            { name: '黑石兽人', hp: 2000, attack: 25, defense: 200, exp: 120, gold: 100 },
        ],
        resources: ['魔法精华', '炼金油'],
        unlocked: false,
        unlockLevel: 10
    }
};

const DROP_TABLES = {
    elwynn_forest: {
        equipment: [
            {
                id: 'EQ_001',
                chance: 0.05, // 0.5%
            },
            {
                id: 'EQ_002',
                chance: 0.05, // 0.5%
            }
        ],
        items: [
            {
                id: 'IT_001',
                chance: 0.05
            }
        ]
    }
};

const FIXED_EQUIPMENTS = {
    EQ_001: {
        id: 'EQ_001',
        name: '初心者的盾牌',
        type: 'equipment',
        slot: 'offHand',
        rarity: 'green',

        setId: 'beginner_set',
        setName: '初心者套装',

        level: 8,
        maxLevel: 100,
        baseStats: {
            armor: 10,
            blockValue: 20,
            blockRate: 5
        },
        growth: {
            armor: 2,
            blockValue: 2,
            blockRate: 2
        }
    },

    EQ_002: {
        id: 'EQ_002',
        name: '初心者的小刀',
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'green',

        setId: 'beginner_set',
        setName: '初心者套装',

        level: 8,
        maxLevel: 100,
        baseStats: {
            attack: 20,
            critRate: 3,
            critDamage: 0.10
        },
        growth: {
            attack: 2,
            critRate: 2,
            critDamage: 2
        }
    }
};

const ITEMS = {
    IT_001: {
        id: 'IT_001',
        name: '破烂的毛皮',
        type: 'junk',
        rarity: 'white',
        sellPrice: 10,
        icon: '🦊'
    }
};


const BUILDINGS = {
    house: { id: 'house', name: '民居', cost: { gold: 100, wood: 50 }, production: { population: 2 }, consumption: {} },
    lumber_mill: { id: 'lumber_mill', name: '伐木场', cost: { gold: 200, wood: 100 }, production: { wood: 5 }, consumption: { population: 1 } },
    iron_mine: { id: 'iron_mine', name: '铁矿场', cost: { gold: 300, wood: 150 }, production: { ironOre: 3 }, consumption: { population: 2 } },
    foundry: { id: 'foundry', name: '铸造厂', cost: { gold: 500, wood: 200, ironOre: 100 }, production: { ironIngot: 2 }, consumption: { population: 2, ironOre: 3 } },
    gathering_hut: { id: 'gathering_hut', name: '采集所', cost: { gold: 150, wood: 75 }, production: { herb: 4 }, consumption: { population: 1 } },
    hunter_lodge: { id: 'hunter_lodge', name: '猎人小屋', cost: { gold: 250, wood: 120 }, production: { leather: 3 }, consumption: { population: 1 } },
    mana_well: { id: 'mana_well', name: '魔力之源', cost: { gold: 800, ironIngot: 50 }, production: { magicEssence: 1 }, consumption: { population: 3 } },
    alchemy_lab: { id: 'alchemy_lab', name: '炼金实验室', cost: { gold: 600, wood: 100, herb: 50 }, production: { alchemyOil: 2 }, consumption: { population: 2, herb: 2 } },
};

const RESEARCH = {
    fertility: { id: 'fertility', name: '生育', description: '民居提供的居民人数提升', baseCost: 100, effect: 'population', bonus: 0.1 },
    lumber_mastery: { id: 'lumber_mastery', name: '伐木精通', description: '提升伐木效率', baseCost: 150, effect: 'wood', bonus: 0.15 },
    mining_mastery: { id: 'mining_mastery', name: '采矿精通', description: '提升采矿效率', baseCost: 150, effect: 'ironOre', bonus: 0.15 },
};

const ACHIEVEMENTS = {
    novice: { id: 'novice', name: '初出茅庐', description: '角色升级到10级', condition: (state) => state.characters.some(c => c.level >= 10), reward: { expBonus: 0.02 }, icon: '⚔️' },
    first_blood: { id: 'first_blood', name: '初战告捷', description: '完成第一次战斗', condition: (state) => state.stats.battlesWon >= 1, reward: { goldBonus: 0.05 }, icon: '🩸' },
    collector: { id: 'collector', name: '收藏家', description: '收集10种不同物品', condition: (state) => state.codex.length >= 10, reward: { dropBonus: 0.1 }, icon: '📦' },
    builder: { id: 'builder', name: '建设者', description: '建造5座建筑', condition: (state) => Object.values(state.buildings).reduce((a, b) => a + b, 0) >= 5, reward: { resourceBonus: 0.05 }, icon: '🏗️' },
};

const WORLD_BOSSES = {
    hogger: { id: 'hogger', name: '霍格', hp: 1000, attack: 30, defense: 20, rewards: { gold: 500, exp: 300, items: ['霍格之爪'] } },
    vancleef: { id: 'vancleef', name: '艾德温·范克里夫', hp: 3000, attack: 50, defense: 35, rewards: { gold: 1500, exp: 800, items: ['范克里夫之刃'] }, unlockLevel: 15 },
};

// 装备槽位定义
const EQUIPMENT_SLOTS = {
    head: { name: '头部', icon: '⛑️' },
    neck: { name: '项链', icon: '📿' },
    shoulder: { name: '肩膀', icon: '🎽' },
    chest: { name: '胸甲', icon: '🛡️' },
    wrist: { name: '手腕', icon: '⌚' },
    hands: { name: '手套', icon: '🧤' },
    legs: { name: '腿部', icon: '👖' },
    feet: { name: '鞋子', icon: '👢' },
    ring1: { name: '戒指1', icon: '💍' },
    ring2: { name: '戒指2', icon: '💍' },
    trinket1: { name: '饰品1', icon: '✨' },
    trinket2: { name: '饰品2', icon: '✨' },
    mainHand: { name: '主手', icon: '⚔️' },
    offHand: { name: '副手', icon: '🛡️' }
};

const SET_BONUSES = {
    beginner_set: {
        name: '初心者套装',
        tiers: [
            { count: 2, bonus: { expBonus: 0.20 } },
        ]
    }
};

// ==================== UTILS ====================
function formatItemStatValue(stat, valueRaw) {
    const v = Number(valueRaw) || 0;

    const percentStats = new Set(['critRate', 'blockRate']);

    if (percentStats.has(stat)) {
        return `${Math.floor(v * 100)}%`;
    }

    if (stat === 'critDamage') {
        return v <= 1
            ? `${Math.floor(v * 100)}%`
            : `${Math.floor(v)}`;
    }

    return `${Math.floor(v)}`;
}


function mergeEquipments(eqA, eqB) {
    if (eqA.id !== eqB.id) return null;

    const newLevel = Math.min(100, (eqA.currentLevel || 0) + (eqB.currentLevel || 0) + 1);

    return {
        ...eqA,
        currentLevel: newLevel,
        stats: scaleStats(eqA.baseStats, eqA.growth, newLevel)
    };
}


function createEquipmentInstance(templateId) {
    const tpl = FIXED_EQUIPMENTS[templateId];
    return {
        ...tpl,
        instanceId: `eq_${Date.now()}_${Math.random()}`,
        currentLevel: tpl.level,
        stats: scaleStats(tpl.baseStats, tpl.growth, tpl.level)
    };
}

function getSetBonusesForCharacter(character) {
    // character.equipment: { weapon, armor, ... } 每个 slot 可能是 null 或装备实例
    const eqList = Object.values(character.equipment || {}).filter(Boolean);
    if (eqList.length === 0) return [];

    // 统计套装 id / 名称（根据你装备数据结构改字段名）
    // 这里优先用 setId / setName，如果你是用 tpl.set 就改一下
    const countBySet = new Map(); // setId -> { setId, setName, count }
    for (const eq of eqList) {
        const setId = eq.setId || eq.set || null;
        const setName = eq.setName || eq.set || eq.setId || null;
        if (!setId) continue;

        const prev = countBySet.get(setId) || { setId, setName, count: 0 };
        prev.count += 1;
        countBySet.set(setId, prev);
    }

    // 你的套装规则表：SET_BONUSES（你可以自己定义）
    // 例：
    // const SET_BONUSES = {
    //   wolf: { name:'狼王', tiers:[ {count:2, bonus:{atkPct:0.1}}, {count:4, bonus:{hpPct:0.15}} ] }
    // }
    if (typeof SET_BONUSES === 'undefined') return []; // 兼容你目前还没加 set 表

    const active = [];
    for (const { setId, setName, count } of countBySet.values()) {
        const def = SET_BONUSES[setId];
        if (!def) continue;

        // 找到已激活的 tier
        const tiers = Array.isArray(def.tiers) ? def.tiers : [];
        const activated = tiers.filter(t => count >= t.count);

        if (activated.length > 0) {
            active.push({
                setId,
                name: def.name || setName || setId,
                count,
                activated,
            });
        }
    }

    // 固定排序：激活多的在前
    active.sort((a, b) => (b.activated.length - a.activated.length) || (b.count - a.count));
    return active;
}

function formatBonusText(bonusObj) {
    const entries = Object.entries(bonusObj || {});
    if (entries.length === 0) return '';

    const nameMap = {
        atkPct: '攻击',
        hpPct: '生命',
        expBonus: '经验值增幅',
        goldBonus: '金币增幅',
        dropBonus: '掉落增幅'
    };

    return entries.map(([k, v]) => {
        if (typeof v === 'number') {
            // 明确按百分比展示的字段
            if (k.endsWith('Pct') || k === 'expBonus' || k === 'goldBonus' || k === 'dropBonus') {
                return `${nameMap[k] || k} +${Math.round(v * 100)}%`;
            }
            return `${nameMap[k] || k} +${v}`;
        }
        return `${nameMap[k] || k} +${String(v)}`;
    }).join('，');
}



function formatStatForDisplay(stat, value) {
    if (stat === 'critRate' || stat === 'blockRate' || stat === 'expBonus') {
        return `${Math.floor(value * 100)}%`;
    }
    return Math.floor(value);
}


function addEquipmentIdToCodex(state, equipmentId) {
    if (!equipmentId) return state;
    const current = Array.isArray(state.codex) ? state.codex : [];
    if (current.includes(equipmentId)) return state;
    return { ...state, codex: [...current, equipmentId] };
}

function addEquipmentIdToLv100Codex(state, equipmentId) {
    if (!equipmentId) return state;
    const cur = Array.isArray(state.codexEquipLv100) ? state.codexEquipLv100 : [];
    if (cur.includes(equipmentId)) return state;
    return { ...state, codexEquipLv100: [...cur, equipmentId] };
}


function addJunkIdToCodex(state, junkId) {
    if (!junkId) return state;
    const current = Array.isArray(state.codexJunk) ? state.codexJunk : [];
    if (current.includes(junkId)) return state;
    return { ...state, codexJunk: [...current, junkId] };
}

function learnNewSkills(character) {
    const classData = CLASSES[character.classId];
    const learned = new Set(character.skills);

    classData.skills.forEach(({ level, skillId }) => {
        if (character.level >= level && !learned.has(skillId)) {
            learned.add(skillId);
        }
    });

    return Array.from(learned);
}

// 计算角色总属性（基础+装备）
function calculateTotalStats(character) {
    const classData = CLASSES[character.classId];

    // 先算 max
    let totalStats = {
        hp: classData.baseStats.hp + (character.level - 1) * 10,
        mp: classData.baseStats.mp + (character.level - 1) * 5,
        attack: classData.baseStats.attack + (character.level - 1) * 2,
        spellPower: classData.baseStats.spellPower + (character.level - 1) * 2,
        armor: classData.baseStats.armor + (character.level - 1) * 3,
        magicResist: classData.baseStats.magicResist + (character.level - 1) * 1,
        blockValue: classData.baseStats.blockValue || 0,

        haste: 0,
        critRate: 5,
        critDamage: 2.0,
        mastery: 0,
        versatility: 0,
        blockRate: 0.1,
        expBonus: 0
    };

    const hasBeginnerSet =
        character.equipment.mainHand?.id === 'EQ_002' &&
        character.equipment.offHand?.id === 'EQ_001';

    if (hasBeginnerSet) {
        totalStats.expBonus = (totalStats.expBonus || 0) + 0.2;
    }

    Object.values(character.equipment || {}).forEach(item => {
        if (item && item.stats) {
            Object.entries(item.stats).forEach(([stat, value]) => {
                totalStats[stat] = (totalStats[stat] || 0) + value;
            });
        }
    });

    totalStats.maxHp = totalStats.hp;
    totalStats.maxMp = totalStats.mp;

    // ✅ 关键：保留旧的 currentHp/currentMp，不要直接重置为满
    const prevHp = character.stats?.currentHp ?? totalStats.maxHp;
    const prevMp = character.stats?.currentMp ?? totalStats.maxMp;

    totalStats.currentHp = Math.min(totalStats.maxHp, Math.max(0, prevHp));
    totalStats.currentMp = Math.min(totalStats.maxMp, Math.max(0, prevMp));

    return totalStats;
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

/**
 * 按 level(0~100) 将 baseStats 缩放到 baseStats * growth
 * - level = 0   => baseStats
 * - level = 100 => baseStats * growth
 * - 中间线性插值：base * (1 + (level/100) * (growth - 1))
 */
function scaleStats(baseStats = {}, growth = {}, level = 0) {
    const lv = clamp(Number(level) || 0, 0, 100);
    const t = lv / 100;

    const scaled = {};

    for (const [stat, baseValRaw] of Object.entries(baseStats)) {
        const baseVal = Number(baseValRaw) || 0;

        const g = Number(growth?.[stat]);
        const growthMul = Number.isFinite(g) ? g : 1;

        const mul = 1 + t * (growthMul - 1);
        scaled[stat] = baseVal * mul; // ✅ 保留小数
    }

    return scaled;
}


// ==================== INITIAL STATE ====================
const initialState = {
    currentMenu: 'map',
    frame: 0,
    characters: [],
    characterSlots: 1,
    maxCharacterSlots: 10,
    resources: {
        gold: 500,
        wood: 200,
        ironOre: 50,
        ironIngot: 10,
        herb: 30,
        leather: 20,
        magicEssence: 5,
        alchemyOil: 5,
        population: 0,
        maxPopulation: 0,
    },
    buildings: {},
    research: {},
    currentResearch: null,
    researchProgress: 0,
    inventory: [],
    inventorySize: 40,
    achievements: {},
    codex: [],
    codexJunk: [],
    zones: JSON.parse(JSON.stringify(ZONES)),
    assignments: {},
    combatLogs: [],
    stats: { battlesWon: 0, totalDamage: 0, totalHealing: 0 },
    worldBossProgress: {},
    lastOnlineTime: Date.now(),
    offlineRewards: null,
    dropFilters: {}, // { [itemId]: true/false }  true=允许掉落  false=禁止掉落
    codexEquipLv100: [], // 记录曾经到过Lv100的装备模板id（永久亮框）
};

// ==================== BASE64 ENCODING (支持中文) ====================
function encodeBase64(str) {
    // 先用 encodeURIComponent 转换成 UTF-8，再用 btoa 编码
    return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(str) {
    // 先用 atob 解码，再用 decodeURIComponent 转回 UTF-8
    return decodeURIComponent(escape(atob(str)));
}

// ==================== LOCAL STORAGE ====================
const SAVE_KEY = 'wow_idle_game_save';

function saveToLocalStorage(state) {
    try {
        const saveData = JSON.stringify(state);
        localStorage.setItem(SAVE_KEY, saveData);
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saveData = localStorage.getItem(SAVE_KEY);
        if (saveData) {
            return JSON.parse(saveData);
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
    return null;
}

// ==================== OFFLINE REWARDS CALCULATOR ====================
function calculateOfflineRewards(state, offlineSeconds) {
    const MAX_OFFLINE_SECONDS = 2 * 24 * 60 * 60;
    const actualSeconds = Math.min(offlineSeconds, MAX_OFFLINE_SECONDS);

    let rewards = {
        gold: 0,
        exp: {},
        items: [],
        kingdomResources: {},   // ✅ 新增：主城资源
        researchProgress: 0,
        combats: 0
    };
    Object.entries(state.assignments).forEach(([charId, zoneId]) => {
        const character = state.characters.find(c => c.id === charId);
        const zone = state.zones[zoneId];

        if (character && zone && zone.enemies) {
            const combatsPerSecond = 0.1;
            const totalCombats = Math.floor(actualSeconds * combatsPerSecond);

            rewards.combats += totalCombats;

            for (let i = 0; i < totalCombats; i++) {
                const enemy = zone.enemies[Math.floor(Math.random() * zone.enemies.length)];
                rewards.gold += enemy.gold;

                if (!rewards.exp[charId]) {
                    rewards.exp[charId] = 0;
                }
                rewards.exp[charId] += enemy.exp;

                if (Math.random() < 0.1 && zone.resources) {
                    const resourceName = zone.resources[Math.floor(Math.random() * zone.resources.length)];
                    rewards.kingdomResources[resourceName] = (rewards.kingdomResources[resourceName] || 0) + 1;
                }

                const dropTable = DROP_TABLES[zone.id];
                if (dropTable?.equipment) {
                    const allowDrop = (id) => state.dropFilters?.[id] !== false; // 默认允许
                    dropTable.equipment.filter(drop => allowDrop(drop.id)).forEach(drop => {
                        if (Math.random() < (drop.chance ?? 0)) {
                            rewards.items.push(createEquipmentInstance(drop.id));
                        }
                    });
                }
            }
        }
    });

    if (state.currentResearch) {
        const research = RESEARCH[state.currentResearch];
        if (research) {
            const level = state.research[state.currentResearch] || 0;
            const cost = Math.floor(research.baseCost * Math.pow(1.5, level));
            const progressPerSecond = state.resources.gold >= cost ? 1 : 0;
            rewards.researchProgress = actualSeconds * progressPerSecond;
        }
    }

    return {
        rewards,
        actualSeconds,
        maxSeconds: MAX_OFFLINE_SECONDS
    };
}

const ARMOR_DR_CAP = 0.99999;
const ARMOR_K = 1000; // 你可以调参：1000/5000/10000...

function getArmorDamageReduction(armor) {
    const a = Math.max(0, armor || 0);
    const dr = a / (a + ARMOR_K);
    return Math.min(ARMOR_DR_CAP, dr);
}

function applyPhysicalMitigation(rawDamage, armor) {
    const dr = getArmorDamageReduction(armor);
    const reduced = rawDamage * (1 - dr);
    return Math.max(1, Math.floor(reduced)); // 至少1点伤害
}


// ==================== COMBAT SYSTEM ====================
// 将战斗拆成“多 tick 多回合”推进：这样 UI 能实时看到血量变化
function createCombatState(character, enemy, skillSlots) {
    // 战斗内 buffs（不改角色本体）
    let buffs = []; // { blockRate, duration }

    // 过滤出有效技能（战斗开始时固定下来）
    const validSkills = (skillSlots || []).filter(sid => sid && SKILLS[sid]);
    if (validSkills.length === 0) validSkills.push('basic_attack');

    return {
        enemy: { ...enemy },
        enemyHp: enemy.hp,
        round: 0,
        skillIndex: 0,
        buffs,
        validSkills,
        logs: [],
        startedAt: Date.now(),
    };
}

function stepCombatRounds(character, combatState, roundsPerTick = 1) {
    let logs = [...(combatState.logs || [])];

    let charHp = Number.isFinite(character?.stats?.currentHp)
        ? character.stats.currentHp
        : (character?.stats?.maxHp ?? character?.stats?.hp ?? 0);

    let enemyHp = combatState.enemyHp ?? combatState.enemy?.hp ?? 0;
    let round = combatState.round ?? 0;
    let skillIndex = combatState.skillIndex ?? 0;

    // buffs
    let buffs = Array.isArray(combatState.buffs) ? [...combatState.buffs] : [];

    const validSkills = Array.isArray(combatState.validSkills) && combatState.validSkills.length > 0
        ? combatState.validSkills
        : (() => {
            const v = (character.skillSlots || []).filter(sid => sid && SKILLS[sid]);
            if (v.length === 0) v.push('basic_attack');
            return v;
        })();

    const getBuffBlockRate = () =>
        buffs.reduce((sum, b) => sum + (b.blockRate || 0), 0);

    const tickBuffs = () => {
        buffs = buffs
            .map(b => ({ ...b, duration: (b.duration ?? 0) - 1 }))
            .filter(b => (b.duration ?? 0) > 0);
    };

    const maxRounds = 20;

    for (let i = 0; i < roundsPerTick; i++) {
        if (charHp <= 0 || enemyHp <= 0 || round >= maxRounds) break;

        round++;

        // ===== 角色回合 =====
        const currentSkillId = validSkills[skillIndex % validSkills.length];
        const skill = SKILLS[currentSkillId];
        const result = skill.calculate(character);

        if (result.damage) {
            const actualDamage = Math.max(1, result.damage - (combatState.enemy?.defense ?? 0));
            enemyHp -= actualDamage;
            logs.push({
                round,
                actor: character.name,
                action: skill.name,
                target: combatState.enemy?.name,
                value: actualDamage,
                type: 'damage',
                isCrit: result.isCrit
            });
        } else if (result.heal) {
            const maxHp = character.stats.maxHp ?? character.stats.hp ?? 0;
            const actualHeal = Math.min(result.heal, maxHp - charHp);
            charHp += actualHeal;
            logs.push({
                round,
                actor: character.name,
                action: skill.name,
                target: character.name,
                value: actualHeal,
                type: 'heal'
            });
        } else if (result.buff) {
            buffs.push({ ...result.buff });
            logs.push({
                round,
                actor: character.name,
                action: skill.name,
                target: character.name,
                value: result.buff.duration ?? 0,
                type: 'buff'
            });
        }

        skillIndex++;
        if (enemyHp <= 0) break;

        // ===== 敌人回合 =====
        const dr = getArmorDamageReduction(character.stats.armor);
        const rawEnemyDamage = applyPhysicalMitigation(combatState.enemy?.attack ?? 0, character.stats.armor);

        // 格挡判定：基础 blockRate + buffs
        const blockChance = Math.max(
            0,
            Math.min(0.95, (character.stats.blockRate || 0) + getBuffBlockRate())
        );

        let finalDamage = rawEnemyDamage;
        let blockedAmount = 0;

        if (Math.random() < blockChance) {
            const blockValue = Math.floor(character.stats.blockValue || 0);
            blockedAmount = Math.min(finalDamage - 1, blockValue); // 至少掉1血
            finalDamage = Math.max(1, finalDamage - blockedAmount);

            logs.push({
                round,
                actor: character.name,
                action: '格挡',
                target: character.name,
                value: blockedAmount,
                type: 'block'
            });
        }

        charHp -= finalDamage;

        logs.push({
            round,
            actor: combatState.enemy?.name,
            action: `普通攻击(护甲减伤 ${(dr * 100).toFixed(3)}%)`,
            target: character.name,
            value: Math.floor(finalDamage),
            type: 'damage'
        });

        // 回合结束，buff duration -1
        tickBuffs();
    }

    const finished = (charHp <= 0) || (enemyHp <= 0) || (round >= 20);

    return {
        finished,
        won: enemyHp <= 0,
        charHp,
        combatState: {
            ...combatState,
            enemyHp,
            round,
            skillIndex,
            buffs,
            validSkills,
            logs
        }
    };
}

// ==================== GAME REDUCER ====================
function gameReducer(state, action) {
    switch (action.type) {
        case 'TOGGLE_DROP_FILTER': {
            const { itemId } = action.payload;
            const current = state.dropFilters?.[itemId];

            // current === false => 切回 true
            // undefined / true => 切成 false
            const nextValue = current === false ? true : false;

            return {
                ...state,
                dropFilters: {
                    ...(state.dropFilters || {}),
                    [itemId]: nextValue
                }
            };
        }

        case 'APPLY_OFFLINE_REWARDS': {
            const { rewards, actualSeconds } = action.payload;
            let newState = { ...state };

            newState.resources = {
                ...newState.resources,
                gold: newState.resources.gold + rewards.gold
            };

            newState.characters = newState.characters.map(char => {
                if (rewards.exp[char.id]) {
                    let exp = char.exp + rewards.exp[char.id];
                    let level = char.level;
                    let expToNext = char.expToNext;

                    while (exp >= expToNext && level < 60) {
                        exp -= expToNext;
                        level++;
                        expToNext = Math.floor(100 * Math.pow(1.2, level - 1));
                    }

                    const updatedChar = { ...char, exp, level, expToNext };
                    updatedChar.stats = calculateTotalStats(updatedChar);
                    return updatedChar;
                }
                return char;
            });

            // ✅ 离线资源进主城 resources（按名称映射到 key）
            const mapResourceNameToKey = (name) => {
                const m = {
                    '木材': 'wood',
                    '草药': 'herb',
                    '铁矿': 'ironOre',
                    '毛皮': 'leather',
                    '魔法精华': 'magicEssence',
                    '炼金油': 'alchemyOil',
                };
                return m[name] || null;
            };

            if (rewards.kingdomResources) {
                const res = { ...newState.resources };
                Object.entries(rewards.kingdomResources).forEach(([cnName, amount]) => {
                    const key = mapResourceNameToKey(cnName);
                    if (!key) return;
                    res[key] = (res[key] || 0) + (amount || 0);
                });
                newState.resources = res;
            }

            if (rewards.items.length > 0) {
                newState.inventory = [...newState.inventory];

                const allowDrop = (id) => state.dropFilters?.[id] !== false;
                rewards.items.forEach(item => {
                    if (item && (item.type === 'junk' || item.type === 'equipment')) {
                        if (!allowDrop(item.id)) return; // ✅ 禁用掉落 => 直接跳过
                    }
                    if (newState.inventory.length < newState.inventorySize) {
                        if (typeof item === 'string') {
                            newState.inventory.push({
                                id: `item_${Date.now()}_${Math.random()}`,
                                name: item,
                                type: 'resource'
                            });
                        } else {
                            newState.inventory.push(item);
                        }

                        if (item && item.type === 'equipment') {
                            newState = addEquipmentIdToCodex(newState, item.id);
                        }

                        if (item && item.type === 'junk') {
                            newState = addJunkIdToCodex(newState, item.id);
                        }
                    }
                });
            }

            if (rewards.researchProgress > 0 && newState.currentResearch) {
                newState.researchProgress = Math.min(
                    100,
                    newState.researchProgress + rewards.researchProgress
                );
            }

            newState.offlineRewards = null;
            newState.lastOnlineTime = Date.now();

            return newState;
        }

        case 'CALCULATE_OFFLINE_REWARDS': {
            const now = Date.now();
            const offlineSeconds = Math.floor((now - state.lastOnlineTime) / 1000);

            if (offlineSeconds > 60) {
                const offlineData = calculateOfflineRewards(state, offlineSeconds);
                return {
                    ...state,
                    offlineRewards: offlineData
                };
            }

            return {
                ...state,
                lastOnlineTime: now
            };
        }

        case 'DISMISS_OFFLINE_REWARDS': {
            return {
                ...state,
                offlineRewards: null,
                lastOnlineTime: Date.now()
            };
        }

        case 'TICK': {
            let newState = { ...state, frame: state.frame + 1 };

            newState.lastOnlineTime = Date.now();

            let newResources = { ...newState.resources };
            const researchBonus = {};
            Object.entries(newState.research).forEach(([id, level]) => {
                const research = RESEARCH[id];
                if (research) {
                    researchBonus[research.effect] = (researchBonus[research.effect] || 0) + research.bonus * level;
                }
            });

            Object.entries(newState.buildings).forEach(([buildingId, count]) => {
                if (count > 0) {
                    const building = BUILDINGS[buildingId];
                    Object.entries(building.production || {}).forEach(([resource, amount]) => {
                        const bonus = researchBonus[resource] || 0;
                        const production = amount * count * (1 + bonus);
                        newResources[resource] = (newResources[resource] || 0) + production;
                    });
                    Object.entries(building.consumption || {}).forEach(([resource, amount]) => {
                        newResources[resource] = (newResources[resource] || 0) - amount * count;
                    });
                }
            });

            const maxPopBonus = researchBonus.population || 0;
            const houseCount = newState.buildings.house || 0;
            newResources.maxPopulation = Math.floor(houseCount * 2 * (1 + maxPopBonus));

            newState.resources = newResources;

            if (newState.currentResearch) {
                const research = RESEARCH[newState.currentResearch];
                const level = newState.research[newState.currentResearch] || 0;
                const cost = Math.floor(research.baseCost * Math.pow(1.5, level));

                if (newState.resources.gold >= cost) {
                    newState.researchProgress += 1;
                    if (newState.researchProgress >= 100) {
                        newState.research = {
                            ...newState.research,
                            [newState.currentResearch]: level + 1
                        };
                        newState.researchProgress = 0;
                        newState.resources.gold -= cost;
                    }
                }
            }

            const toRecall = [];

            // 后台战斗（拆分成多 tick 推进，实时更新血量）
            const COMBAT_START_INTERVAL_FRAMES = 10; // 与旧逻辑保持节奏：每10帧“开一场”
            const COMBAT_ROUNDS_PER_TICK = 2; // 每秒推进2回合：最多20回合 => 最长约10秒

            Object.entries(newState.assignments).forEach(([charId, zoneId]) => {
                const zone = newState.zones[zoneId];
                const charIndex = newState.characters.findIndex(c => c.id === charId);
                if (charIndex === -1) return;

                let char = { ...newState.characters[charIndex] };

                if (!zone || !zone.enemies) return;

                const now = Date.now();

                // 只有“到点”才会拉怪开始一场新战斗（避免每秒都重开）
                if (!char.combatState && newState.frame % COMBAT_START_INTERVAL_FRAMES === 0) {
                    const enemy = zone.enemies[Math.floor(Math.random() * zone.enemies.length)];
                    char.combatState = createCombatState(char, enemy, char.skillSlots || []);
                    char.lastCombatTime = now; // 进入战斗
                }

                // 推进当前战斗：每tick更新一次 currentHp => UI 实时变化
                if (char.combatState) {
                    char.lastCombatTime = now; // 战斗中持续刷新，确保不会被脱战回血逻辑影响

                    const step = stepCombatRounds(char, char.combatState, COMBAT_ROUNDS_PER_TICK);

                    const endHp = Number.isFinite(step.charHp)
                        ? Math.max(0, Math.floor(step.charHp))
                        : (char.stats.currentHp ?? char.stats.maxHp);

                    char.stats = { ...char.stats, currentHp: endHp };
                    char.combatState = step.combatState;

                    // 战斗结束：写日志、结算奖励、清 combatState
                    if (step.finished) {
                        char.lastCombatTime = now; // 结束也刷新一次：脱战回血从这里开始计时

                        const enemy = step.combatState.enemy;
                        const finalLogs = step.combatState.logs || [];

                        newState.combatLogs = [
                            {
                                id: `log_${Date.now()}_${Math.random()}`,
                                timestamp: Date.now(),
                                characterName: char.name,
                                zoneName: zone.name,
                                enemyName: enemy.name,
                                result: step.won ? 'victory' : 'defeat',
                                logs: finalLogs,
                                rewards: step.won ? { gold: enemy.gold, exp: enemy.exp } : { gold: 0, exp: 0 }
                            },
                            ...newState.combatLogs
                        ].slice(0, 50);

                        // 清理战斗状态
                        char.combatState = null;

                        // 失败：如果死亡则召回
                        if (!step.won) {
                            if (endHp <= 0) {
                                toRecall.push(charId);
                            }
                        } else {
                            // 胜利结算
                            newState.resources.gold += enemy.gold;

                            let expGained = (1 + (char.stats.expBonus || 0));
                            char.exp += enemy.exp * expGained;

                            while (char.exp >= char.expToNext && char.level < 200) {
                                char.exp -= char.expToNext;
                                char.level++;
                                char.expToNext = Math.floor(100 * Math.pow(1.2, char.level - 1));
                                char.skills = learnNewSkills(char);
                                char.stats = calculateTotalStats(char);
                            }

                            newState.stats.battlesWon++;

                            const mapResourceNameToKey = (name) => {
                                const m = {
                                    '木材': 'wood',
                                    '草药': 'herb',
                                    '铁矿': 'ironOre',
                                    '毛皮': 'leather',
                                    '魔法精华': 'magicEssence',
                                    '炼金油': 'alchemyOil',
                                };
                                return m[name] || null;
                            };

                            if (Math.random() < 0.1 && zone.resources) {
                                const resourceName = zone.resources[Math.floor(Math.random() * zone.resources.length)];
                                const key = mapResourceNameToKey(resourceName);
                                if (key) {
                                    newState.resources = { ...newState.resources, [key]: (newState.resources[key] || 0) + 1 };
                                }
                            }

                            // ✅ 装备掉落：使用掉落表（例如第一张图 elwynn_forest 掉初心者套装）
                            const dropTable = DROP_TABLES[zone.id];
                            if (dropTable?.equipment && newState.inventory.length < newState.inventorySize) {
                                const allowDrop = (id) => state.dropFilters?.[id] !== false; // 默认允许
                                dropTable.equipment.filter(drop => allowDrop(drop.id)).forEach(drop => {
                                    if (newState.inventory.length >= newState.inventorySize) return;
                                    if (Math.random() < (drop.chance ?? 0)) {
                                        // 固定装备：用模板创建实例
                                        newState.inventory.push(createEquipmentInstance(drop.id));
                                        newState = addEquipmentIdToCodex(newState, drop.id);
                                    }
                                });
                            }

                            // ✅ 物品掉落（如果你也想用掉落表的 items）
                            if (dropTable?.items && newState.inventory.length < newState.inventorySize) {

                                const allowDrop = (id) => state.dropFilters?.[id] !== false; // 默认允许

                                dropTable.items.filter(drop => allowDrop(drop.id)).forEach(drop => {
                                    if (newState.inventory.length >= newState.inventorySize) return;
                                    if (Math.random() < (drop.chance ?? 0)) {
                                        const tpl = ITEMS[drop.id];
                                        if (tpl) {
                                            newState.inventory.push({
                                                ...tpl,
                                                instanceId: `inv_${Date.now()}_${Math.random()}`,
                                                id: tpl.id,            // 保持模板 id: IT_001
                                            });
                                            newState = addJunkIdToCodex(newState, drop.id);
                                        }
                                    }
                                });
                            }

                        }
                    }

                    // 写回角色
                    newState.characters = [...newState.characters];
                    newState.characters[charIndex] = char;
                }
            });
            if (toRecall.length > 0) {
                const newAssignments = { ...newState.assignments };
                toRecall.forEach(id => delete newAssignments[id]);
                newState.assignments = newAssignments;
            }

            Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
                if (!newState.achievements[id] && achievement.condition(newState)) {
                    newState.achievements = { ...newState.achievements, [id]: true };
                }
            });

            const maxCharLevel = Math.max(...newState.characters.map(c => c.level), 0);
            Object.values(newState.zones).forEach(zone => {
                if (!zone.unlocked && zone.unlockLevel && maxCharLevel >= zone.unlockLevel) {
                    zone.unlocked = true;
                }
            });

            // ✅ 离开战斗 5 秒后开始回血：每秒 +10
            const REGEN_DELAY_MS = 5000;
            const REGEN_PER_SECOND = 10;
            const now = Date.now();

            newState.characters = newState.characters.map(char => {
                const maxHp = char.stats?.maxHp ?? char.stats?.hp ?? 0;
                const curHp = char.stats?.currentHp ?? maxHp;

                // 战斗中不回血
                if (char.combatState) return char;

                if (curHp >= maxHp) return char;

                const lastCombatTime = char.lastCombatTime || 0;
                if (now - lastCombatTime < REGEN_DELAY_MS) return char;

                return {
                    ...char,
                    stats: {
                        ...char.stats,
                        currentHp: Math.min(maxHp, curHp + REGEN_PER_SECOND)
                    }
                };
            });

            return newState;
        }

        case 'CREATE_CHARACTER': {
            const { name, race, classId } = action.payload;
            if (state.characters.length >= state.characterSlots) return state;

            const classData = CLASSES[classId];
            const newChar = {
                id: `char_${Date.now()}`,
                name,
                race,
                classId,
                level: 1,
                exp: 0,
                expToNext: 100,
                equipment: {},
                skillSlots: ['basic_attack', 'rest', '', '', '', '', '', ''], // 8个技能槽位
                skills: classData.skills.filter(s => s.level <= 1).map(s => s.skillId),
                buffs: [],
                lastCombatTime: 0,
                combatState: null,
            };

            newChar.stats = calculateTotalStats(newChar);

            return {
                ...state,
                characters: [...state.characters, newChar]
            };
        }

        case 'UPDATE_SKILL_SLOTS': {
            const { characterId, skillSlots } = action.payload;
            const charIndex = state.characters.findIndex(c => c.id === characterId);
            if (charIndex === -1) return state;

            let newChars = [...state.characters];
            newChars[charIndex] = { ...newChars[charIndex], skillSlots };

            return {
                ...state,
                characters: newChars
            };
        }

        case 'EQUIP_ITEM': {
            const { characterId, itemInstanceId } = action.payload;

            // 1) 找到背包里的这件装备
            const invIdx = state.inventory.findIndex(i =>
                (i.instanceId && i.instanceId === itemInstanceId) ||
                (!i.instanceId && i.id === itemInstanceId) // 兼容老存档
            );
            if (invIdx === -1) return state;

            const item = state.inventory[invIdx];
            if (!item || item.type !== 'equipment') return state;

            const slot = item.slot;
            if (!slot) return state;

            // 2) 更新角色：把装备放进对应 slot
            const newChars = state.characters.map(c => {
                if (c.id !== characterId) return c;

                const prevEquipped = c.equipment?.[slot] || null;

                const nextChar = {
                    ...c,
                    equipment: {
                        ...(c.equipment || {}),
                        [slot]: item,
                    },
                };

                // 3) 重算属性（你已经有 calculateTotalStats）
                nextChar.stats = calculateTotalStats(nextChar);

                // 把之前穿着的同槽装备（如果有）临时挂到 nextChar 上，方便后面塞回背包
                nextChar.__prevEquipped = prevEquipped;
                return nextChar;
            });

            // 4) 背包移除已装备物品，并把被替换下来的装备塞回背包（有空间才塞）
            const newInventory = [...state.inventory];
            newInventory.splice(invIdx, 1);

            const equippedChar = newChars.find(c => c.id === characterId);
            const prevEquipped = equippedChar?.__prevEquipped;
            if (prevEquipped) {
                if (newInventory.length < state.inventorySize) {
                    newInventory.push(prevEquipped);
                }
            }

            // 清理临时字段
            const cleanedChars = newChars.map(c => {
                if (c.__prevEquipped === undefined) return c;
                const { __prevEquipped, ...rest } = c;
                return rest;
            });

            return {
                ...state,
                characters: cleanedChars,
                inventory: newInventory,
            };
        }

        case 'UNEQUIP_ITEM': {
            const { characterId, slot } = action.payload;

            const char = state.characters.find(c => c.id === characterId);
            if (!char) return state;

            const equipped = char.equipment?.[slot];
            if (!equipped) return state;

            // 背包满了就不让卸下（避免丢失）
            if (state.inventory.length >= state.inventorySize) return state;

            const newChars = state.characters.map(c => {
                if (c.id !== characterId) return c;

                const nextEquip = { ...(c.equipment || {}) };
                delete nextEquip[slot];

                const nextChar = { ...c, equipment: nextEquip };
                nextChar.stats = calculateTotalStats(nextChar);
                return nextChar;
            });

            return {
                ...state,
                characters: newChars,
                inventory: [...state.inventory, equipped],
            };
        }


        case 'MERGE_EQUIPMENT': {
            const { instanceIdA, instanceIdB } = action.payload;

            const idxA = state.inventory.findIndex(i => i.instanceId === instanceIdA);
            const idxB = state.inventory.findIndex(i => i.instanceId === instanceIdB);
            if (idxA === -1 || idxB === -1 || idxA === idxB) return state;

            const eqA = state.inventory[idxA];
            const eqB = state.inventory[idxB];
            if (eqA.type !== 'equipment' || eqB.type !== 'equipment') return state;

            const merged = mergeEquipments(eqA, eqB);
            if (!merged) return state;

            const newInventory = [...state.inventory];
            newInventory.splice(Math.max(idxA, idxB), 1);
            newInventory.splice(Math.min(idxA, idxB), 1);
            newInventory.push(merged);

            let nextState = {
                ...addEquipmentIdToCodex(state, merged.id),
                inventory: newInventory
            };

            if ((merged.currentLevel ?? merged.level ?? 0) >= 100) {
                nextState = addEquipmentIdToLv100Codex(nextState, merged.id);
            }

            return nextState;
        }


        case 'ASSIGN_ZONE': {
            const { characterId, zoneId } = action.payload;
            return {
                ...state,
                assignments: {
                    ...state.assignments,
                    [characterId]: zoneId
                }
            };
        }

        case 'UNASSIGN_CHARACTER': {
            const { characterId } = action.payload;
            const newAssignments = { ...state.assignments };
            delete newAssignments[characterId];

            // 召回时视为脱战：清理战斗状态，并刷新 lastCombatTime（5秒后开始回血）
            const newChars = state.characters.map(c => {
                if (c.id !== characterId) return c;
                return {
                    ...c,
                    combatState: null,
                    lastCombatTime: Date.now()
                };
            });

            return {
                ...state,
                assignments: newAssignments,
                characters: newChars
            };
        }

        case 'BUILD': {
            const { buildingId } = action.payload;
            const building = BUILDINGS[buildingId];
            let canBuild = true;

            Object.entries(building.cost).forEach(([resource, amount]) => {
                if ((state.resources[resource] || 0) < amount) canBuild = false;
            });

            if (!canBuild) return state;

            const newResources = { ...state.resources };
            Object.entries(building.cost).forEach(([resource, amount]) => {
                newResources[resource] -= amount;
            });

            return {
                ...state,
                resources: newResources,
                buildings: {
                    ...state.buildings,
                    [buildingId]: (state.buildings[buildingId] || 0) + 1
                }
            };
        }

        case 'START_RESEARCH': {
            const { researchId } = action.payload;
            return {
                ...state,
                currentResearch: researchId,
                researchProgress: 0
            };
        }

        case 'CANCEL_RESEARCH': {
            return {
                ...state,
                currentResearch: null,
                researchProgress: 0
            };
        }

        case 'USE_ITEM': {
            const { itemInstanceId } = action.payload;

            const idx = state.inventory.findIndex(i =>
                (i.instanceId && i.instanceId === itemInstanceId) ||
                (!i.instanceId && i.id === itemInstanceId) // 兼容老数据
            );
            if (idx === -1) return state;

            const newInventory = [...state.inventory];
            newInventory.splice(idx, 1);

            return { ...state, inventory: newInventory };
        }

        case 'SELL_ITEM': {
            const { itemInstanceId } = action.payload;

            const idx = state.inventory.findIndex(i =>
                (i.instanceId && i.instanceId === itemInstanceId) ||
                (!i.instanceId && i.id === itemInstanceId) // 兼容老数据
            );
            if (idx === -1) return state;

            const item = state.inventory[idx];
            if (!item.sellPrice) return state;

            const newInventory = [...state.inventory];
            newInventory.splice(idx, 1);

            return {
                ...state,
                inventory: newInventory,
                resources: {
                    ...state.resources,
                    gold: state.resources.gold + item.sellPrice
                }
            };
        }

        case 'SELL_ALL_JUNK': {
            // 认定：type === 'junk' 且有 sellPrice 的都算“垃圾可出售”
            const junkItems = state.inventory.filter(i => i?.type === 'junk' && (i.sellPrice || 0) > 0);
            if (junkItems.length === 0) return state;

            const totalGold = junkItems.reduce((sum, it) => sum + (it.sellPrice || 0), 0);

            const newInventory = state.inventory.filter(i => !(i?.type === 'junk' && (i.sellPrice || 0) > 0));

            return {
                ...state,
                inventory: newInventory,
                resources: {
                    ...state.resources,
                    gold: state.resources.gold + totalGold
                }
            };
        }


        case 'SET_MENU': {
            return {
                ...state,
                currentMenu: action.payload
            };
        }

        case 'EXPORT_SAVE': {
            return state;
        }

        case 'IMPORT_SAVE': {
            try {
                const decoded = JSON.parse(decodeBase64(action.payload));
                return {
                    ...decoded,
                    lastOnlineTime: Date.now(),
                    offlineRewards: null
                };
            } catch {
                return state;
            }
        }

        case 'EXPAND_CHARACTER_SLOTS': {
            if (state.characterSlots >= state.maxCharacterSlots) return state;
            const cost = 1000 * Math.pow(2, state.characterSlots);
            if (state.resources.gold < cost) return state;

            return {
                ...state,
                resources: {
                    ...state.resources,
                    gold: state.resources.gold - cost
                },
                characterSlots: state.characterSlots + 1
            };
        }

        case 'CLEAR_COMBAT_LOGS': {
            return {
                ...state,
                combatLogs: []
            };
        }

        default:
            return state;
    }
}

// ==================== UI COMPONENTS ====================
const Panel = ({ title, children, actions, style }) => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(30,25,20,0.95) 0%, rgba(20,15,12,0.98) 100%)',
        border: '2px solid #4a3c2a',
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        ...style
    }}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: title ? 16 : 0,
            paddingBottom: title ? 12 : 0,
            borderBottom: title ? '1px solid rgba(201,162,39,0.2)' : 'none'
        }}>
            {title && (
                <h3 style={{
                    margin: 0,
                    fontSize: 18,
                    color: '#c9a227',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontWeight: 600
                }}>
                    {title}
                </h3>
            )}
            {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
        {children}
    </div>
);

const Button = ({ children, onClick, variant = 'primary', disabled, style }) => {
    const variants = {
        primary: {
            background: disabled
                ? 'rgba(60,60,60,0.5)'
                : 'linear-gradient(180deg, rgba(201,162,39,0.9), rgba(139,115,25,0.9))',
            color: disabled ? '#666' : '#fff',
            border: `2px solid ${disabled ? '#444' : '#c9a227'}`,
        },
        secondary: {
            background: 'rgba(40,35,30,0.8)',
            color: '#c9a227',
            border: '2px solid #5a4c3a',
        },
        danger: {
            background: 'linear-gradient(180deg, rgba(180,50,50,0.9), rgba(120,30,30,0.9))',
            color: '#fff',
            border: '2px solid #a03030',
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: '8px 16px',
                ...variants[variant],
                borderRadius: 4,
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: disabled ? 'none' : '0 2px 6px rgba(0,0,0,0.4)',
                textShadow: disabled ? 'none' : '1px 1px 2px rgba(0,0,0,0.6)',
                ...style
            }}
        >
            {children}
        </button>
    );
};

const StatBar = ({ label, current, max, color = '#4CAF50' }) => (
    <div style={{ marginBottom: 8 }}>
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#aaa',
            marginBottom: 4
        }}>
            <span>{label}</span>
            <span>{Math.floor(current)} / {Math.floor(max)}</span>
        </div>
        <div style={{
            height: 8,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{
                height: '100%',
                width: `${Math.min(100, (current / max) * 100)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                transition: 'width 0.3s',
                boxShadow: `0 0 8px ${color}88`
            }} />
        </div>
    </div>
);

// ==================== MODALS ====================

// 技能编辑模态框
const SkillEditorModal = ({ character, onClose, onSave, state }) => {
    const [skillSlots, setSkillSlots] = useState(character.skillSlots || Array(8).fill(''));

    const handleSlotChange = (index, skillId) => {
        const newSlots = [...skillSlots];
        newSlots[index] = skillId;

        // 统计每个技能在技能栏中的出现次数
        const countMap = {};
        newSlots.forEach(sid => {
            if (!sid) return;
            countMap[sid] = (countMap[sid] || 0) + 1;
        });

        // 校验每个技能的 limit
        for (const [sid, count] of Object.entries(countMap)) {
            const skill = SKILLS[sid];
            const limit = skill?.limit ?? Infinity;

            if (count > limit) {
                alert(`${skill.name} 在技能栏中最多只能放 ${limit} 次`);
                return; // ❌ 阻止这次修改
            }
        }

        setSkillSlots(newSlots);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
        }} >
            <div style={{
                background: 'linear-gradient(135deg, rgba(30,25,20,0.98) 0%, rgba(20,15,12,0.98) 100%)',
                border: '3px solid #c9a227',
                borderRadius: 12,
                padding: 24,
                maxWidth: 600,
                width: '100%',
                boxShadow: '0 8px 32px rgba(201,162,39,0.3)',
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ marginBottom: 20 }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: 20, color: '#ffd700' }}>
                        编辑技能栏 - {character.name}
                    </h2>
                    <div style={{ fontSize: 12, color: '#888' }}>
                        战斗时会循环使用这8个技能
                    </div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                    marginBottom: 20
                }}>
                    {skillSlots.map((skillId, index) => (
                        <div key={index} style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '2px solid #4a3c2a',
                            borderRadius: 6,
                            padding: 12,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>
                                槽位 {index + 1}
                            </div>
                            <select
                                value={skillId}
                                onChange={(e) => handleSlotChange(index, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '6px',
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid #4a3c2a',
                                    borderRadius: 4,
                                    color: '#fff',
                                    fontSize: 11,
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="">空</option>
                                {character.skills.map(sid => {
                                    const skill = SKILLS[sid];
                                    return (
                                        <option key={sid} value={sid}>
                                            {skill.icon} {skill.name}
                                        </option>
                                    );
                                })}
                            </select>
                            {skillId && SKILLS[skillId] && (
                                <div style={{
                                    fontSize: 24,
                                    marginTop: 8
                                }}>
                                    {SKILLS[skillId].icon}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button onClick={() => {
                        onSave(character.id, skillSlots);
                        onClose();
                    }} style={{ flex: 1 }}>
                        ✓ 保存
                    </Button>
                    <Button onClick={onClose} variant="secondary" style={{ flex: 1 }}>
                        取消
                    </Button>
                </div>
            </div>
        </div>
    );
};

// 战斗日志模态框
const CombatLogsModal = ({ logs, onClose, onClear }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
        }} onClick={onClose}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(30,25,20,0.98) 0%, rgba(20,15,12,0.98) 100%)',
                border: '3px solid #c9a227',
                borderRadius: 12,
                padding: 24,
                maxWidth: 800,
                width: '100%',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(201,162,39,0.3)',
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 20, color: '#ffd700' }}>
                        战斗日志
                    </h2>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button onClick={onClear} variant="danger">清空日志</Button>
                        <Button onClick={onClose} variant="secondary">✕ 关闭</Button>
                    </div>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 6,
                    padding: 12
                }}>
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: 40 }}>
                            暂无战斗记录
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} style={{
                                background: log.result === 'victory' ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                                border: `1px solid ${log.result === 'victory' ? '#4CAF50' : '#f44336'}`,
                                borderRadius: 6,
                                padding: 12,
                                marginBottom: 12
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 8,
                                    paddingBottom: 8,
                                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div>
                                        <span style={{ color: '#ffd700', fontWeight: 600 }}>
                                            {log.characterName}
                                        </span>
                                        <span style={{ color: '#888', margin: '0 8px' }}>VS</span>
                                        <span style={{ color: '#ff6b6b', fontWeight: 600 }}>
                                            {log.enemyName}
                                        </span>
                                        <span style={{ color: '#888', marginLeft: 8 }}>
                                            @ {log.zoneName}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: log.result === 'victory' ? '#4CAF50' : '#f44336',
                                        fontWeight: 600
                                    }}>
                                        {log.result === 'victory' ? '✓ 胜利' : '✗ 失败'}
                                    </div>
                                </div>

                                <div style={{
                                    maxHeight: 200,
                                    overflowY: 'auto',
                                    fontSize: 11,
                                    color: '#ccc'
                                }}>
                                    {log.logs.map((entry, i) => (
                                        <div key={i} style={{
                                            padding: '4px 0',
                                            borderBottom: i < log.logs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                        }}>
                                            <span style={{ color: '#888' }}>回合{entry.round}:</span>
                                            {' '}
                                            <span style={{ color: '#ffd700' }}>{entry.actor}</span>
                                            {' '}使用{' '}
                                            <span style={{ color: '#4CAF50' }}>{entry.action}</span>
                                            {entry.type === 'damage' && (
                                                <>
                                                    {' '}对{' '}
                                                    <span style={{ color: '#ff6b6b' }}>{entry.target}</span>
                                                    {' '}造成{' '}
                                                    <span style={{ color: '#f44336', fontWeight: 600 }}>
                                                        {entry.value}
                                                    </span>
                                                    {' '}点伤害
                                                    {entry.isCrit && (
                                                        <span style={{ color: '#ff9800', marginLeft: 4 }}>
                                                            [暴击!]
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {entry.type === 'heal' && (
                                                <>
                                                    {' '}恢复{' '}
                                                    <span style={{ color: '#4CAF50', fontWeight: 600 }}>
                                                        {entry.value}
                                                    </span>
                                                    {' '}点生命
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {log.rewards && (
                                    <div style={{
                                        marginTop: 8,
                                        paddingTop: 8,
                                        borderTop: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: 11,
                                        color: '#ffd700'
                                    }}>
                                        奖励: 🪙{log.rewards.gold} | ⭐{log.rewards.exp}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// 角色详情模态框
const CharacterDetailsModal = ({ character, onClose, onUnequip, onEditSkills, state }) => {
    const statNames = {
        hp: '生命值',
        mp: '法力值',
        attack: '攻击强度',
        spellPower: '法术强度',
        armor: '护甲',
        magicResist: '魔法抗性',
        haste: '急速',
        critRate: '暴击率',
        critDamage: '暴击伤害',
        mastery: '精通',
        versatility: '全能',
        blockRate: '格挡率',
        blockValue: '格挡值',
    };

    const setBonuses = getSetBonusesForCharacter(character);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            overflowY: 'auto'
        }} onClick={onClose}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(30,25,20,0.98) 0%, rgba(20,15,12,0.98) 100%)',
                border: '3px solid #c9a227',
                borderRadius: 12,
                padding: 24,
                maxWidth: 900,
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(201,162,39,0.3)',
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                    <div>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: 24, color: '#ffd700' }}>
                            {character.name}
                        </h2>
                        <div style={{ fontSize: 14, color: '#888' }}>
                            Lv.{character.level} {character.race} {CLASSES[character.classId].name}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button onClick={onEditSkills} variant="secondary">✏️ 编辑技能</Button>
                        <Button onClick={onClose} variant="secondary">✕ 关闭</Button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                    {/* 左侧：属性面板 */}
                    <div>
                        <h3 style={{ fontSize: 16, color: '#c9a227', marginBottom: 12 }}>角色属性</h3>
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 6,
                            padding: 12,
                            border: '1px solid #4a3c2a'
                        }}>
                            {Object.entries(statNames).map(([stat, name]) => (
                                <div key={stat} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '6px 0',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    fontSize: 12
                                }}>
                                    <span style={{ color: '#aaa' }}>{name}</span>
                                    <span style={{ color: '#ffd700', fontWeight: 600 }}>
                                        {stat === 'critRate' || stat === 'blockRate' ? `${(character.stats[stat] || 0).toFixed(1)}%` : stat === 'critDamage' ? `${Math.round((character.stats[stat] || 0) * 100)}%` : stat === 'expBonus' ? `${Math.round((character.stats[stat] || 0) * 100)}%` : Math.floor(character.stats[stat] || 0)}
                                    </span>

                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 右侧：装备栏 */}
                    <div>
                        <h3 style={{ fontSize: 16, color: '#c9a227', marginBottom: 12 }}>装备</h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 8
                        }}>
                            {Object.entries(EQUIPMENT_SLOTS).map(([slot, slotInfo]) => {
                                const equipped = character.equipment[slot];
                                return (
                                    <div
                                        key={slot}
                                        style={{
                                            background: equipped ? 'rgba(201,162,39,0.15)' : 'rgba(0,0,0,0.3)',
                                            border: `2px solid ${equipped ? '#c9a227' : '#4a3c2a'}`,
                                            borderRadius: 6,
                                            padding: 12,
                                            minHeight: 80,
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            fontSize: 11,
                                            color: '#888',
                                            marginBottom: 6,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4
                                        }}>
                                            <span>{slotInfo.icon}</span>
                                            <span>{slotInfo.name}</span>
                                        </div>

                                        {equipped ? (
                                            <>
                                                <div style={{
                                                    fontSize: 12,
                                                    color: equipped.qualityColor,
                                                    fontWeight: 600,
                                                    marginBottom: 6
                                                }}>
                                                    {equipped.name}
                                                </div>
                                                <div style={{ fontSize: 10, color: '#aaa', marginBottom: 8 }}>
                                                    {Object.entries(equipped.stats).map(([stat, value]) => (
                                                        <div key={stat}>
                                                            {statNames[stat] || stat}: +{formatItemStatValue(stat, value)}
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button
                                                    onClick={() => onUnequip(character.id, slot)}
                                                    variant="danger"
                                                    style={{ padding: '4px 8px', fontSize: 10, width: '100%' }}
                                                >
                                                    卸下
                                                </Button>
                                            </>
                                        ) : (
                                            <div style={{
                                                fontSize: 24,
                                                color: '#333',
                                                textAlign: 'center',
                                                paddingTop: 8
                                            }}>
                                                ∅
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {/* ✅ 套装效果展示 */}
                        {setBonuses.length > 0 && (
                            <div style={{
                                marginTop: 14,
                                padding: 12,
                                borderRadius: 8,
                                background: 'rgba(0,0,0,0.25)',
                                border: '1px solid rgba(201,162,39,0.25)'
                            }}>
                                <div style={{
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: '#ffd700',
                                    marginBottom: 8
                                }}>
                                    套装效果
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {setBonuses.map(set => (
                                        <div
                                            key={set.setId}
                                            style={{
                                                padding: 10,
                                                borderRadius: 8,
                                                background: 'rgba(0,0,0,0.25)',
                                                border: '1px solid rgba(201,162,39,0.18)'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'baseline',
                                                marginBottom: 6
                                            }}>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: '#c9a227' }}>
                                                    {set.name}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#aaa' }}>
                                                    已装备 {set.count} 件
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {set.activated.map((t, idx) => (
                                                    <div key={idx} style={{ fontSize: 12, color: '#ddd' }}>
                                                        ✅ {t.count} 件：{formatBonusText(t.bonus)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};




// 物品详情模态框
const ItemDetailsModal = ({ item, onClose, onEquip, characters, state , dispatch }) => {
    const [selectedCharId, setSelectedCharId] = useState('');

    const statNames = {
        hp: '生命值',
        mp: '法力值',
        attack: '攻击强度',
        spellPower: '法术强度',
        armor: '护甲',
        magicResist: '魔法抗性',
        haste: '急速',
        critRate: '暴击率',
        critDamage: '暴击伤害',
        mastery: '精通',
        versatility: '全能',
        blockRate: '格挡率',
        blockValue: '格挡值',
        expBonus: '经验值增幅',
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
        }} onClick={onClose}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(30,25,20,0.98) 0%, rgba(20,15,12,0.98) 100%)',
                border: `3px solid ${item.qualityColor || '#4a3c2a'}`,
                borderRadius: 12,
                padding: 24,
                maxWidth: 400,
                width: '100%',
                boxShadow: `0 8px 32px ${item.qualityColor}44`,
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                        {EQUIPMENT_SLOTS[item.slot]?.icon || '📦'}
                    </div>
                    <h2 style={{
                        margin: '0 0 8px 0',
                        fontSize: 20,
                        color: item.qualityColor,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}>
                        {item.name}
                    </h2>
                    <div style={{ fontSize: 12, color: '#888' }}>
                        {EQUIPMENT_SLOTS[item.slot]?.name} · 等级 {item.currentLevel ?? item.level ?? 0} · {item.quality}
                    </div>
                </div>

                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20
                }}>
                    <h3 style={{ fontSize: 14, color: '#c9a227', marginBottom: 12 }}>属性</h3>
                    {Object.entries(item.stats).map(([stat, value]) => (
                        <div
                            key={stat}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '6px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                fontSize: 12
                            }}
                        >
                            <span style={{ color: '#aaa' }}>{statNames[stat] || stat}</span>
                            <span style={{ color: '#4CAF50', fontWeight: 600 }}>
                                +{formatItemStatValue(stat, value)}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#c9a227', marginBottom: 8 }}>
                        装备给角色
                    </label>
                    <select
                        value={selectedCharId}
                        onChange={(e) => setSelectedCharId(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid #4a3c2a',
                            borderRadius: 4,
                            color: '#fff',
                            fontSize: 13,
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">选择角色...</option>
                        {characters.map(char => (
                            <option key={char.id} value={char.id}>
                                {char.name} (Lv.{char.level})
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        onClick={() => {
                            if (selectedCharId) {
                                onEquip(selectedCharId, item.instanceId || item.id);
                                onClose();
                            }
                        }}
                        disabled={!selectedCharId}
                        style={{ flex: 1 }}
                    >
                        装备
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => {
                            if (window.confirm(`确定要丢弃 ${item.name} 吗？`)) {
                                dispatch({ type: 'USE_ITEM', payload: { itemInstanceId: item.instanceId || item.id } });
                                onClose();
                            }
                        }}
                    >
                        🗑️ 丢弃
                    </Button>
                    <Button onClick={onClose} variant="secondary" style={{ flex: 1 }}>
                        关闭
                    </Button>
                </div>
            </div>
        </div>
    );
};

// 离线奖励模态框
const OfflineRewardsModal = ({ rewards, actualSeconds, maxSeconds, onClaim, onDismiss }) => {
    const formatTime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}天 ${hours}小时`;
        if (hours > 0) return `${hours}小时 ${minutes}分钟`;
        return `${minutes}分钟`;
    };

    const totalExp = Object.values(rewards.exp).reduce((a, b) => a + b, 0);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
        }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(30,25,20,0.98) 0%, rgba(20,15,12,0.98) 100%)',
                border: '3px solid #c9a227',
                borderRadius: 12,
                padding: 32,
                maxWidth: 500,
                width: '100%',
                boxShadow: '0 8px 32px rgba(201,162,39,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
                    <h2 style={{
                        margin: '0 0 8px 0',
                        fontSize: 24,
                        color: '#ffd700',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}>
                        欢迎回来!
                    </h2>
                    <p style={{ margin: 0, color: '#aaa', fontSize: 14 }}>
                        你已离线 {formatTime(actualSeconds)}
                        {actualSeconds >= maxSeconds && ` (达到上限: ${formatTime(maxSeconds)})`}
                    </p>
                </div>

                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    padding: 20,
                    marginBottom: 20
                }}>
                    <h3 style={{
                        margin: '0 0 16px 0',
                        fontSize: 16,
                        color: '#c9a227',
                        textAlign: 'center'
                    }}>
                        挂机收益
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{
                            background: 'rgba(201,162,39,0.1)',
                            padding: 12,
                            borderRadius: 6,
                            border: '1px solid rgba(201,162,39,0.3)'
                        }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>战斗次数</div>
                            <div style={{ fontSize: 20, color: '#ffd700', fontWeight: 600 }}>
                                {rewards.combats}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(201,162,39,0.1)',
                            padding: 12,
                            borderRadius: 6,
                            border: '1px solid rgba(201,162,39,0.3)'
                        }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>金币</div>
                            <div style={{ fontSize: 20, color: '#ffd700', fontWeight: 600 }}>
                                +{Math.floor(rewards.gold)}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(201,162,39,0.1)',
                            padding: 12,
                            borderRadius: 6,
                            border: '1px solid rgba(201,162,39,0.3)'
                        }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>经验值</div>
                            <div style={{ fontSize: 20, color: '#4CAF50', fontWeight: 600 }}>
                                +{Math.floor(totalExp)}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(201,162,39,0.1)',
                            padding: 12,
                            borderRadius: 6,
                            border: '1px solid rgba(201,162,39,0.3)'
                        }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>物品</div>
                            <div style={{ fontSize: 20, color: '#9C27B0', fontWeight: 600 }}>
                                +{rewards.items.length}
                            </div>
                        </div>
                    </div>

                    {rewards.researchProgress > 0 && (
                        <div style={{
                            marginTop: 12,
                            background: 'rgba(201,162,39,0.1)',
                            padding: 12,
                            borderRadius: 6,
                            border: '1px solid rgba(201,162,39,0.3)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>研究进度</div>
                            <div style={{ fontSize: 20, color: '#2196F3', fontWeight: 600 }}>
                                +{Math.floor(rewards.researchProgress)}%
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button onClick={onClaim} style={{ flex: 1 }}>
                        ✓ 领取奖励
                    </Button>
                    <Button onClick={onDismiss} variant="secondary" style={{ flex: 1 }}>
                        稍后领取
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ==================== PAGE: MAP (with Drag & Drop) ====================
const MapPage = ({ state, dispatch }) => {
    const [draggedChar, setDraggedChar] = useState(null);

    const handleDragStart = (e, charId) => {
        setDraggedChar(charId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, zoneId) => {
        e.preventDefault();
        if (draggedChar) {
            dispatch({
                type: 'ASSIGN_ZONE',
                payload: { characterId: draggedChar, zoneId }
            });
            setDraggedChar(null);
        }
    };

    const unassignedChars = state.characters.filter(c => !state.assignments[c.id]);

    return (
        <div>
            {/* 未分配的角色列表 */}
            {unassignedChars.length > 0 && (
                <Panel title="可派遣角色" style={{ marginBottom: 16 }}>
                    <div style={{
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap'
                    }}>
                        {unassignedChars.map(char => (
                            <div
                                key={char.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, char.id)}
                                style={{
                                    padding: '12px 16px',
                                    background: 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(139,115,25,0.1))',
                                    border: '2px solid #c9a227',
                                    borderRadius: 6,
                                    cursor: 'grab',
                                    transition: 'all 0.2s',
                                    userSelect: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,162,39,0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ fontSize: 14, color: '#ffd700', fontWeight: 600 }}>
                                    {char.name}
                                </div>
                                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                                    Lv.{char.level} {CLASSES[char.classId].name}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        marginTop: 12,
                        fontSize: 12,
                        color: '#888',
                        fontStyle: 'italic'
                    }}>
                        💡 拖拽角色到区域进行分配
                    </div>
                </Panel>
            )}

            {/* 区域列表 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {Object.values(state.zones).map(zone => {
                    const assignedChars = Object.entries(state.assignments)
                        .filter(([_, zId]) => zId === zone.id)
                        .map(([cId, _]) => state.characters.find(c => c.id === cId))
                        .filter(Boolean);

                    return (
                        <div
                            key={zone.id}
                            onDragOver={zone.unlocked ? handleDragOver : undefined}
                            onDrop={zone.unlocked ? (e) => handleDrop(e, zone.id) : undefined}
                            style={{
                                opacity: zone.unlocked ? 1 : 0.6,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Panel title={zone.name}>
                                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 12 }}>
                                    等级: {zone.level} | {zone.unlocked ? '✓ 已解锁' : `🔒 需要等级 ${zone.unlockLevel}`}
                                </div>

                                {zone.unlocked && (
                                    <>
                                        <div style={{ marginBottom: 12 }}>
                                            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>怪物:</div>
                                            {zone.enemies?.map((enemy, i) => (
                                                <div key={i} style={{
                                                    fontSize: 11,
                                                    padding: 6,
                                                    background: 'rgba(0,0,0,0.3)',
                                                    borderRadius: 4,
                                                    marginBottom: 4
                                                }}>
                                                    {enemy.name} (HP: {enemy.hp}, 攻击: {enemy.attack})
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{
                                            minHeight: 60,
                                            padding: 12,
                                            background: 'rgba(201,162,39,0.05)',
                                            border: '2px dashed #4a3c2a',
                                            borderRadius: 6,
                                            marginBottom: 12
                                        }}>
                                            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                                                已分配角色:
                                            </div>
                                            {assignedChars.length > 0 ? (
                                                assignedChars.map(char => (
                                                    <div key={char.id} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: 6,
                                                        background: 'rgba(201,162,39,0.1)',
                                                        borderRadius: 4,
                                                        marginBottom: 4
                                                    }}>
                                                        <span style={{ fontSize: 11 }}>{char.name} (Lv.{char.level})</span>
                                                        <Button
                                                            onClick={() => dispatch({
                                                                type: 'UNASSIGN_CHARACTER',
                                                                payload: { characterId: char.id }
                                                            })}
                                                            variant="danger"
                                                            style={{ padding: '4px 8px', fontSize: 10 }}
                                                        >
                                                            召回
                                                        </Button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                                                    拖拽角色到此处
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Panel>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ==================== PAGE: CHARACTER ====================
const CharacterPage = ({ state, dispatch }) => {
    const [showCreate, setShowCreate] = useState(false);
    const [newChar, setNewChar] = useState({ name: '', race: RACES[0], classId: 'protection_warrior' });
    const [selectedChar, setSelectedChar] = useState(null);
    const [showSkillEditor, setShowSkillEditor] = useState(null);
    const [showCombatLogs, setShowCombatLogs] = useState(false);

    const createCharacter = () => {
        if (newChar.name.trim()) {
            dispatch({ type: 'CREATE_CHARACTER', payload: newChar });
            setNewChar({ name: '', race: RACES[0], classId: 'protection_warrior' });
            setShowCreate(false);
        }
    };

    const expandCost = 1000 * Math.pow(2, state.characterSlots);
    const hasAvailableSlots = state.characters.length < state.characterSlots;

    return (
        <div>
            {showCombatLogs && (
                <CombatLogsModal
                    logs={state.combatLogs}
                    onClose={() => setShowCombatLogs(false)}
                    onClear={() => {
                        dispatch({ type: 'CLEAR_COMBAT_LOGS' });
                        setShowCombatLogs(false);
                    }}
                />
            )}

            {showSkillEditor && (
                <SkillEditorModal
                    character={showSkillEditor}
                    onClose={() => setShowSkillEditor(null)}
                    onSave={(charId, skillSlots) => {
                        dispatch({ type: 'UPDATE_SKILL_SLOTS', payload: { characterId: charId, skillSlots } });
                    }}
                    state={state}
                />
            )}

            {selectedChar && (
                <CharacterDetailsModal
                    character={selectedChar}
                    onClose={() => setSelectedChar(null)}
                    onUnequip={(charId, slot) => {
                        dispatch({ type: 'UNEQUIP_ITEM', payload: { characterId: charId, slot } });
                        const updated = state.characters.find(c => c.id === charId);
                        if (updated) setSelectedChar(updated);
                    }}
                    onEditSkills={() => {
                        setShowSkillEditor(selectedChar);
                        setSelectedChar(null);
                    }}
                    state={state}
                />
            )}

            <Panel
                title="角色管理"
                actions={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            onClick={() => setShowCombatLogs(true)}
                            variant="secondary"
                        >
                            📜 战斗日志 ({state.combatLogs.length})
                        </Button>
                        <Button
                            onClick={() => setShowCreate(!showCreate)}
                            disabled={!hasAvailableSlots}
                        >
                            {showCreate ? '✗ 取消' : '+ 创建角色'}
                        </Button>
                        <Button
                            onClick={() => dispatch({ type: 'EXPAND_CHARACTER_SLOTS' })}
                            variant="secondary"
                            disabled={state.characterSlots >= state.maxCharacterSlots || state.resources.gold < expandCost}
                        >
                            扩展槽位 ({state.characterSlots}/{state.maxCharacterSlots}) - 🪙{expandCost}
                        </Button>
                    </div>
                }
            >
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>
                    角色槽位: {state.characters.length} / {state.characterSlots}
                </div>

                {showCreate && (
                    <div style={{
                        padding: 16,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        marginBottom: 16,
                        border: '1px solid #4a3c2a'
                    }}>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: 'block', fontSize: 12, color: '#c9a227', marginBottom: 4 }}>
                                角色名
                            </label>
                            <input
                                type="text"
                                value={newChar.name}
                                onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
                                placeholder="输入角色名..."
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid #4a3c2a',
                                    borderRadius: 4,
                                    color: '#fff',
                                    fontSize: 13
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#c9a227', marginBottom: 4 }}>
                                    种族
                                </label>
                                <select
                                    value={newChar.race}
                                    onChange={(e) => setNewChar({ ...newChar, race: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid #4a3c2a',
                                        borderRadius: 4,
                                        color: '#fff',
                                        fontSize: 13,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {RACES.map(race => (
                                        <option key={race} value={race}>{race}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: '#c9a227', marginBottom: 4 }}>
                                    职业
                                </label>
                                <select
                                    value={newChar.classId}
                                    onChange={(e) => setNewChar({ ...newChar, classId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: 'rgba(0,0,0,0.4)',
                                        border: '1px solid #4a3c2a',
                                        borderRadius: 4,
                                        color: '#fff',
                                        fontSize: 13,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {Object.values(CLASSES).map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Button onClick={createCharacter} disabled={!newChar.name.trim()}>
                            ✓ 创建
                        </Button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {state.characters.map(char => {
                        const assignment = state.assignments[char.id];
                        const zone = assignment ? state.zones[assignment] : null;
                        const equippedCount = Object.keys(char.equipment || {}).length;

                        return (
                            <div
                                key={char.id}
                                onClick={() => setSelectedChar(char)}  // ✅ 整个卡片可点，直接打开详情
                                style={{
                                    cursor: 'pointer',
                                    padding: 12,
                                    borderRadius: 10,
                                    border: '1px solid #333',
                                    background: 'rgba(0,0,0,0.35)',
                                    transition: 'transform 0.06s ease',
                                }}
                                onPointerDown={(e) => {
                                    // 小小按压反馈（可删）
                                    e.currentTarget.style.transform = 'scale(0.995)';
                                }}
                                onPointerMove={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                onPointerUp={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                {/* ===== 顶部信息 ===== */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        {/* ✅ 名字不需要再单独绑定 onClick，因为整个卡片都能点 */}
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#ffd700' }}>
                                            {char.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                                            Lv.{char.level} · {RACES[char.race]?.name} · {CLASSES[char.classId]?.name}
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        {zone && (
                                            <div style={{
                                                padding: '4px 8px',
                                                background: 'rgba(201,162,39,0.2)',
                                                borderRadius: 4,
                                                fontSize: 10,
                                                color: '#c9a227',
                                                marginBottom: 4
                                            }}>
                                                📍 {zone.name}
                                            </div>
                                        )}
                                        <div style={{ fontSize: 10, color: '#888' }}>
                                            装备: {equippedCount}/{Object.keys(EQUIPMENT_SLOTS).length}
                                        </div>
                                    </div>
                                </div>

                                <StatBar
                                    label="生命"
                                    current={char.stats.currentHp}
                                    max={char.stats.maxHp}
                                    color="#f44336"
                                />
                                <StatBar
                                    label="经验"
                                    current={char.exp}
                                    max={char.expToNext}
                                    color="#4CAF50"
                                />

                                <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                                    {char.combatState
                                        ? '⚔️ 战斗中'
                                        : (Date.now() - (char.lastCombatTime || 0) < 5000
                                                ? `🕒 脱战回血 ${(Math.ceil((5000 - (Date.now() - (char.lastCombatTime || 0))) / 1000))} 秒后开始`
                                                : '💚 脱战回血中：每秒 +10'
                                        )
                                    }
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 8,
                                    fontSize: 11,
                                    color: '#aaa',
                                    marginTop: 12,
                                    marginBottom: 12
                                }}>
                                    <div>生命: {Math.floor(char.stats.currentHp)} / {Math.floor(char.stats.maxHp)}</div>
                                    <div>法力: {Math.floor(char.stats.currentMp)} / {Math.floor(char.stats.maxMp)}</div>
                                    <div>攻击: {char.stats.attack}</div>
                                    <div>护甲: {Math.floor(char.stats.armor)}</div>
                                    <div>格挡率: {(((char.stats.blockRate || 0) * 100).toFixed(1))}%</div>
                                    <div>格挡值: {Math.floor(char.stats.blockValue || 0)}</div>
                                </div>

                                {/* ✅ 删除“查看详情”按钮，只保留“编辑技能” */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();     // ✅ 防止触发卡片点击打开详情
                                            setShowSkillEditor(char);
                                        }}
                                        variant="secondary"
                                        style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
                                    >
                                        编辑技能
                                    </Button>
                                </div>
                            </div>
                        );

                    })}
                </div>
            </Panel>
        </div>
    );
};

// ==================== PAGE: INVENTORY ====================
const InventoryPage = ({ state, dispatch }) => {
    const [selectedItem, setSelectedItem] = useState(null);
    const [draggedItemId, setDraggedItemId] = useState(null);

    return (
        <div>
            {selectedItem && selectedItem.type === 'equipment' && (
                <ItemDetailsModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onEquip={(charId, itemInstanceId) => {
                        dispatch({ type: 'EQUIP_ITEM', payload: { characterId: charId, itemInstanceId } });
                    }}
                    characters={state.characters}
                    state={state}
                    dispatch={dispatch}
                />
            )}

            <Panel
                title={`道具栏 (${state.inventory.length}/${state.inventorySize})`}
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => {
                            const junkItems = state.inventory.filter(i => i?.type === 'junk' && (i.sellPrice || 0) > 0);
                            const totalGold = junkItems.reduce((sum, it) => sum + (it.sellPrice || 0), 0);

                            if (junkItems.length === 0) {
                                alert('没有可出售的垃圾。');
                                return;
                            }

                            if (window.confirm(`一键出售 ${junkItems.length} 件垃圾，获得 🪙${totalGold} 金币？`)) {
                                dispatch({ type: 'SELL_ALL_JUNK' });
                            }
                        }}
                    >
                        🔘 一键卖垃圾
                    </Button>
                }
            >

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 8
                }}>
                    {state.inventory.map(item => (
                        <div
                            key={item.instanceId || item.id}
                            draggable={item.type === 'equipment'}
                            onDragStart={(e) => {
                                if (item.type !== 'equipment') return;
                                if (!item.instanceId) return;
                                setDraggedItemId(item.instanceId);
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragOver={(e) => {
                                // 允许放到“另一个装备”上
                                if (item.type !== 'equipment') return;
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                                if (item.type !== 'equipment') return;
                                e.preventDefault();

                                const fromInstanceId = draggedItemId;
                                const toInstanceId = item.instanceId;

                                if (!fromInstanceId || !toInstanceId || fromInstanceId === toInstanceId) return;

                                const fromItem = state.inventory.find(i => i.instanceId === fromInstanceId);
                                const toItem = state.inventory.find(i => i.instanceId === toInstanceId);

                                if (!fromItem || !toItem) return;
                                if (fromItem.type !== 'equipment' || toItem.type !== 'equipment') return;

                                // ✅ 只能同模板 id 合成（EQ_001 + EQ_001 / EQ_002 + EQ_002）
                                if (fromItem.id !== toItem.id) {
                                    alert('只能拖拽到同款装备上合成！');
                                    setDraggedItemId(null);
                                    return;
                                }

                                dispatch({
                                    type: 'MERGE_EQUIPMENT',
                                    payload: { instanceIdA: fromInstanceId, instanceIdB: toInstanceId }
                                });

                                setDraggedItemId(null);
                            }}
                            onDragEnd={() => setDraggedItemId(null)}
                            onClick={() => item.type === 'equipment' && setSelectedItem(item)}
                            onContextMenu={(e) => {
                                e.preventDefault();

                                if (item.sellPrice) {
                                    if (window.confirm(`出售 ${item.name}，获得 🪙${item.sellPrice} 金币？`)) {
                                        dispatch({ type: 'SELL_ITEM', payload: { itemInstanceId: item.instanceId || item.id } });
                                    }
                                } else {
                                    if (window.confirm(`确定要丢弃 ${item.name} 吗？`)) {
                                        dispatch({ type: 'USE_ITEM', payload: { itemInstanceId: item.instanceId || item.id } });
                                    }
                                }
                            }}

                            style={{
                                padding: 12,
                                background: item.type === 'equipment'
                                    ? `linear-gradient(135deg, ${item.qualityColor}22, rgba(0,0,0,0.3))`
                                    : 'rgba(0,0,0,0.3)',
                                border: `2px solid ${item.type === 'equipment' ? item.qualityColor : '#4a3c2a'}`,
                                outline:
                                    (draggedItemId && item.type === 'equipment' && draggedItemId === item.instanceId)
                                        ? '2px solid #ffd700'
                                        : 'none',
                                borderRadius: 6,
                                textAlign: 'center',
                                cursor: item.type === 'equipment' ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (item.type === 'equipment') {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = `0 4px 12px ${item.qualityColor}66`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (item.type === 'equipment') {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            <div style={{ fontSize: 28, marginBottom: 8 }}>
                                {item.type === 'equipment' ? EQUIPMENT_SLOTS[item.slot]?.icon : '📦'}
                            </div>
                            <div style={{
                                fontSize: 11,
                                color: item.type === 'equipment' ? item.qualityColor : '#ffd700',
                                fontWeight: item.type === 'equipment' ? 600 : 'normal'
                            }}>
                                {item.name}
                            </div>
                            {item.type === 'equipment' && (
                                <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>
                                    Lv.{item.currentLevel ?? item.level ?? 0}
                                </div>
                            )}
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, state.inventorySize - state.inventory.length) }).map((_, i) => (
                        <div
                            key={`empty_${i}`}
                            style={{
                                padding: 12,
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px dashed #333',
                                borderRadius: 6,
                                textAlign: 'center',
                                opacity: 0.3
                            }}
                        >
                            <div style={{ fontSize: 28 }}>∅</div>
                        </div>
                    ))}
                </div>
            </Panel>
        </div>
    );
};

// ==================== PAGE: CITY ====================
const CityPage = ({ state, dispatch }) => {
    return (
        <div>
            <Panel title="资源">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 12
                }}>
                    {Object.entries(state.resources).map(([key, value]) => (
                        <div
                            key={key}
                            style={{
                                padding: 12,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid #4a3c2a',
                                borderRadius: 6,
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                                {key}
                            </div>
                            <div style={{ fontSize: 16, color: '#ffd700', fontWeight: 600 }}>
                                {Math.floor(value)}
                            </div>
                        </div>
                    ))}
                </div>
            </Panel>

            <Panel title="建筑">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                    {Object.values(BUILDINGS).map(building => {
                        const count = state.buildings[building.id] || 0;
                        let canBuild = true;
                        Object.entries(building.cost).forEach(([resource, amount]) => {
                            if ((state.resources[resource] || 0) < amount) canBuild = false;
                        });

                        return (
                            <div
                                key={building.id}
                                style={{
                                    padding: 16,
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '2px solid #4a3c2a',
                                    borderRadius: 6,
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 12
                                }}>
                                    <h4 style={{ margin: 0, fontSize: 14, color: '#ffd700' }}>
                                        {building.name}
                                    </h4>
                                    <span style={{
                                        padding: '4px 8px',
                                        background: 'rgba(201,162,39,0.2)',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        color: '#c9a227'
                                    }}>
                                        ×{count}
                                    </span>
                                </div>

                                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>
                                    <div style={{ marginBottom: 4 }}>
                                        成本: {Object.entries(building.cost).map(([r, a]) => `${r}:${a}`).join(', ')}
                                    </div>
                                    {Object.keys(building.production || {}).length > 0 && (
                                        <div style={{ color: '#4CAF50' }}>
                                            产出: {Object.entries(building.production).map(([r, a]) => `${r}:+${a}`).join(', ')}
                                        </div>
                                    )}
                                    {Object.keys(building.consumption || {}).length > 0 && (
                                        <div style={{ color: '#f44336' }}>
                                            消耗: {Object.entries(building.consumption).map(([r, a]) => `${r}:-${a}`).join(', ')}
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={() => dispatch({ type: 'BUILD', payload: { buildingId: building.id } })}
                                    disabled={!canBuild}
                                    style={{ width: '100%' }}
                                >
                                    建造
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </Panel>
        </div>
    );
};

// ==================== PAGE: RESEARCH ====================
const ResearchPage = ({ state, dispatch }) => {
    return (
        <Panel title="研究">
            {state.currentResearch && (
                <div style={{
                    padding: 16,
                    background: 'rgba(201,162,39,0.1)',
                    border: '2px solid #c9a227',
                    borderRadius: 6,
                    marginBottom: 16
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8
                    }}>
                        <span style={{ fontSize: 14, color: '#ffd700' }}>
                            正在研究: {RESEARCH[state.currentResearch].name}
                        </span>
                        <Button
                            onClick={() => dispatch({ type: 'CANCEL_RESEARCH' })}
                            variant="danger"
                            style={{ padding: '4px 12px', fontSize: 11 }}
                        >
                            取消
                        </Button>
                    </div>
                    <StatBar
                        label="进度"
                        current={state.researchProgress}
                        max={100}
                        color="#2196F3"
                    />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {Object.values(RESEARCH).map(research => {
                    const level = state.research[research.id] || 0;
                    const cost = Math.floor(research.baseCost * Math.pow(1.5, level));
                    const canResearch = !state.currentResearch && state.resources.gold >= cost;

                    return (
                        <div
                            key={research.id}
                            style={{
                                padding: 16,
                                background: 'rgba(0,0,0,0.3)',
                                border: '2px solid #4a3c2a',
                                borderRadius: 6,
                            }}
                        >
                            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#ffd700' }}>
                                {research.name} (Lv.{level})
                            </h4>
                            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 12 }}>
                                {research.description}
                            </div>
                            <div style={{ fontSize: 11, color: '#4CAF50', marginBottom: 12 }}>
                                效果: +{(research.bonus * 100).toFixed(0)}% {research.effect}
                            </div>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                                成本: 🪙{cost}
                            </div>
                            <Button
                                onClick={() => dispatch({ type: 'START_RESEARCH', payload: { researchId: research.id } })}
                                disabled={!canResearch}
                                style={{ width: '100%' }}
                            >
                                研究
                            </Button>
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
};

// ==================== PAGE: WORLD BOSS ====================
const WorldBossPage = ({ state }) => {
    return (
        <Panel title="世界首领">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {Object.values(WORLD_BOSSES).map(boss => {
                    const unlocked = !boss.unlockLevel || state.characters.some(c => c.level >= boss.unlockLevel);

                    return (
                        <div
                            key={boss.id}
                            style={{
                                padding: 20,
                                background: unlocked ? 'rgba(180,50,50,0.2)' : 'rgba(0,0,0,0.3)',
                                border: `2px solid ${unlocked ? '#a03030' : '#333'}`,
                                borderRadius: 8,
                                opacity: unlocked ? 1 : 0.5
                            }}
                        >
                            <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>
                                {unlocked ? '🐲' : '🔒'}
                            </div>
                            <h3 style={{
                                margin: '0 0 12px 0',
                                fontSize: 18,
                                color: unlocked ? '#ff6b6b' : '#666',
                                textAlign: 'center'
                            }}>
                                {boss.name}
                            </h3>
                            {unlocked ? (
                                <>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#aaa',
                                        marginBottom: 12,
                                        textAlign: 'center'
                                    }}>
                                        HP: {boss.hp} | 攻击: {boss.attack} | 防御: {boss.defense}
                                    </div>
                                    <div style={{
                                        fontSize: 11,
                                        color: '#ffd700',
                                        textAlign: 'center',
                                        marginBottom: 12
                                    }}>
                                        奖励: 🪙{boss.rewards.gold} | ⭐{boss.rewards.exp}
                                    </div>
                                    <Button variant="danger" style={{ width: '100%' }} disabled>
                                        挑战 (开发中)
                                    </Button>
                                </>
                            ) : (
                                <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                                    需要等级 {boss.unlockLevel}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
};

// ==================== PAGE: ACHIEVEMENT ====================
const AchievementPage = ({ state }) => {
    return (
        <Panel title="成就">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {Object.values(ACHIEVEMENTS).map(achievement => {
                    const unlocked = state.achievements[achievement.id];

                    return (
                        <div
                            key={achievement.id}
                            style={{
                                padding: 16,
                                background: unlocked ? 'rgba(201,162,39,0.2)' : 'rgba(0,0,0,0.3)',
                                border: `2px solid ${unlocked ? '#c9a227' : '#4a3c2a'}`,
                                borderRadius: 6,
                                opacity: unlocked ? 1 : 0.6
                            }}
                        >
                            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>
                                {achievement.icon}
                            </div>
                            <h4 style={{
                                margin: '0 0 8px 0',
                                fontSize: 14,
                                color: unlocked ? '#ffd700' : '#888',
                                textAlign: 'center'
                            }}>
                                {achievement.name}
                            </h4>
                            <div style={{
                                fontSize: 11,
                                color: '#aaa',
                                textAlign: 'center',
                                marginBottom: 8
                            }}>
                                {achievement.description}
                            </div>
                            {unlocked && (
                                <div style={{
                                    fontSize: 10,
                                    color: '#4CAF50',
                                    textAlign: 'center',
                                    padding: '4px 8px',
                                    background: 'rgba(76,175,80,0.1)',
                                    borderRadius: 4
                                }}>
                                    ✓ 已解锁
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Panel>
    );
};

// ==================== PAGE: CODEX ====================
const CodexPage = ({ state, dispatch }) => {
    const [tab, setTab] = React.useState('equipment'); // 'equipment' | 'junk'

    const allowDrop = (id) => state.dropFilters?.[id] !== false;

    // ===== 装备图鉴 =====
    const allEquipTemplates = Object.values(FIXED_EQUIPMENTS);
    const equipCodexSet = new Set(state.codex || []);

    const hasLevel100 = (equipmentId) => {
        const inv100 = state.inventory.some(it =>
            it?.type === 'equipment' &&
            it?.id === equipmentId &&
            (it?.currentLevel ?? it?.level ?? 0) >= 100
        );

        const equip100 = state.characters.some(char =>
            Object.values(char.equipment || {}).some(eq =>
                eq?.id === equipmentId && (eq?.currentLevel ?? eq?.level ?? 0) >= 100
            )
        );

        return inv100 || equip100;
    };

    // ===== 垃圾图鉴 =====
    const allJunkTemplates = Object.values(ITEMS).filter(it => it?.type === 'junk');
    const junkCodexSet = new Set(state.codexJunk || []);

    const TabButton = ({ id, children }) => (
        <button
            onClick={() => setTab(id)}
            style={{
                padding: '8px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
                border: tab === id ? '2px solid #c9a227' : '2px solid #4a3c2a',
                color: tab === id ? '#ffd700' : '#888',
                background: tab === id
                    ? 'linear-gradient(180deg, rgba(201,162,39,0.25), rgba(139,115,25,0.18))'
                    : 'rgba(0,0,0,0.25)',
                boxShadow: tab === id ? '0 0 12px rgba(255,215,0,0.15)' : 'none',
                transition: 'all 0.15s',
            }}
        >
            {children}
        </button>
    );

    const toggleDrop = (itemId) => {
        dispatch({
            type: 'TOGGLE_DROP_FILTER',
            payload: { itemId }
        });
    };

    const DropTag = ({ enabled }) => (
        <div style={{
            marginTop: 8,
            fontSize: 9,
            fontWeight: 800,
            display: 'inline-block',
            padding: '2px 6px',
            borderRadius: 999,
            border: enabled ? '1px solid rgba(120,220,120,0.5)' : '1px solid rgba(255,80,80,0.55)',
            color: enabled ? 'rgba(120,220,120,0.9)' : 'rgba(255,80,80,0.9)',
            background: enabled ? 'rgba(120,220,120,0.08)' : 'rgba(255,80,80,0.08)',
        }}>
            {enabled ? '掉落：开启' : '掉落：关闭'}
        </div>
    );

    const CardShell = ({ children, onClick, disabledDrop }) => (
        <div
            onClick={onClick}
            style={{
                cursor: 'pointer',
                userSelect: 'none',
                position: 'relative',
                padding: 12,
                borderRadius: 8,
                textAlign: 'center',
                transition: 'all 0.15s',
                outline: 'none',
                opacity: disabledDrop ? 0.55 : 1,
                filter: disabledDrop ? 'grayscale(35%)' : 'none'
            }}
        >
            {children}
            {disabledDrop && (
                <div style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    fontSize: 10,
                    fontWeight: 900,
                    color: 'rgba(255,80,80,0.95)',
                    background: 'rgba(0,0,0,0.45)',
                    padding: '2px 6px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,80,80,0.5)'
                }}>
                    🚫 禁用掉落
                </div>
            )}
        </div>
    );

    return (
        <Panel
            title="图鉴（点击卡片开关掉落）"
            actions={
                <div style={{ display: 'flex', gap: 8 }}>
                    <TabButton id="equipment">🛡️ 装备</TabButton>
                    <TabButton id="junk">🧺 垃圾</TabButton>
                </div>
            }
        >
            {/* ===== 装备图鉴 ===== */}
            {tab === 'equipment' && (
                <>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                        ✅ 点亮：已获得过（state.codex）　|　✨ 亮色边框：该装备已合成到 Lv.100
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: 10
                    }}>
                        {allEquipTemplates.map((tpl) => {
                            const unlocked = equipCodexSet.has(tpl.id);
                            const lv100 = hasLevel100(tpl.id);
                            const icon = EQUIPMENT_SLOTS[tpl.slot]?.icon || '📦';

                            const dropEnabled = allowDrop(tpl.id);
                            const disabledDrop = !dropEnabled;

                            return (
                                <div
                                    key={tpl.id}
                                    title={`${tpl.name}（点击开关掉落）`}
                                    style={{
                                        background: unlocked ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.18)',
                                        borderRadius: 8,
                                        border: lv100
                                            ? '2px solid rgba(255, 215, 0, 0.95)'
                                            : `1px solid ${unlocked ? '#4a3c2a' : '#333'}`,
                                        boxShadow: lv100 ? '0 0 10px rgba(255,215,0,0.35)' : 'none',
                                    }}
                                >
                                    <CardShell
                                        onClick={() => toggleDrop(tpl.id)}
                                        disabledDrop={disabledDrop}
                                    >
                                        <div style={{ fontSize: 26, marginBottom: 6 }}>
                                            {icon}
                                        </div>

                                        <div style={{
                                            fontSize: 10,
                                            color: unlocked ? '#ffd700' : '#555',
                                            lineHeight: 1.2,
                                            minHeight: 26,
                                            opacity: unlocked ? 1 : 0.7
                                        }}>
                                            {tpl.name}
                                        </div>

                                        <div style={{
                                            marginTop: 6,
                                            fontSize: 9,
                                            color: unlocked ? '#aaa' : '#444'
                                        }}>
                                            {unlocked ? '已获取' : '未获取'}
                                        </div>

                                        {lv100 && (
                                            <div style={{
                                                marginTop: 6,
                                                fontSize: 9,
                                                color: '#ffd700',
                                                fontWeight: 900
                                            }}>
                                                Lv.100
                                            </div>
                                        )}

                                        <DropTag enabled={dropEnabled} />
                                    </CardShell>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* ===== 垃圾图鉴 ===== */}
            {tab === 'junk' && (
                <>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                        ✅ 点亮：已获得过该垃圾（state.codexJunk）
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: 10
                    }}>
                        {allJunkTemplates.map((tpl) => {
                            const unlocked = junkCodexSet.has(tpl.id);
                            const icon = tpl.icon || '🧺';

                            const dropEnabled = allowDrop(tpl.id);
                            const disabledDrop = !dropEnabled;

                            return (
                                <div
                                    key={tpl.id}
                                    title={`${tpl.name}（点击开关掉落）`}
                                    style={{
                                        background: unlocked ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.18)',
                                        borderRadius: 8,
                                        border: `1px solid ${unlocked ? '#4a3c2a' : '#333'}`,
                                    }}
                                >
                                    <CardShell
                                        onClick={() => toggleDrop(tpl.id)}
                                        disabledDrop={disabledDrop}
                                    >
                                        <div style={{ fontSize: 26, marginBottom: 6 }}>
                                            {icon}
                                        </div>

                                        <div style={{
                                            fontSize: 10,
                                            color: unlocked ? '#ffd700' : '#555',
                                            lineHeight: 1.2,
                                            minHeight: 26,
                                            opacity: unlocked ? 1 : 0.7
                                        }}>
                                            {tpl.name}
                                        </div>

                                        <div style={{
                                            marginTop: 6,
                                            fontSize: 9,
                                            color: unlocked ? '#aaa' : '#444'
                                        }}>
                                            {unlocked ? '已获取' : '未获取'}
                                        </div>

                                        <div style={{
                                            marginTop: 4,
                                            fontSize: 9,
                                            color: unlocked ? '#888' : '#444'
                                        }}>
                                            🪙 {tpl.sellPrice || 0}
                                        </div>

                                        <DropTag enabled={dropEnabled} />
                                    </CardShell>
                                </div>
                            );
                        })}

                        {allJunkTemplates.length === 0 && (
                            <div style={{ color: '#666', fontSize: 12 }}>
                                当前没有定义垃圾物品（ITEMS 中 type === 'junk' 的条目为空）
                            </div>
                        )}
                    </div>
                </>
            )}
        </Panel>
    );
};




// ==================== MAIN APP ====================
export default function WoWIdleGame() {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [isPaused, setIsPaused] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [importData, setImportData] = useState('');
    const intervalRef = useRef(null);
    const saveIntervalRef = useRef(null);

    const lastTickRef = useRef(Date.now());

    // 加载存档
    useEffect(() => {
        const savedState = loadFromLocalStorage();
        if (savedState) {
            // 合并初始状态和保存的状态，确保新字段有默认值
            const mergedState = {
                ...initialState,
                ...savedState,

                zones: JSON.parse(JSON.stringify(ZONES)),

                combatLogs: savedState.combatLogs || [],
                offlineRewards: null
            };

            // 使用导入功能加载状态
            dispatch({ type: 'IMPORT_SAVE', payload: encodeBase64(JSON.stringify(mergedState)) });
        }

        dispatch({ type: 'CALCULATE_OFFLINE_REWARDS' });
    }, []);

    // 自动保存（每10秒）
    useEffect(() => {
        saveIntervalRef.current = setInterval(() => {
            saveToLocalStorage(state);
        }, 10000);

        return () => {
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
                saveToLocalStorage(state); // 在组件卸载时也保存一次
            }
        };
    }, [state]);

    // 游戏主循环
    useEffect(() => {
        if (!isPaused) {
            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const deltaSeconds = Math.max(1, Math.floor((now - lastTickRef.current) / 1000));
                lastTickRef.current = now;

                dispatch({ type: 'TICK', payload: { deltaSeconds } });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [isPaused]);

    const exportSave = () => {
        const saveData = encodeBase64(JSON.stringify(state));
        navigator.clipboard?.writeText(saveData);
        setShowExport(true);
        setTimeout(() => setShowExport(false), 2000);
    };

    const importSave = () => {
        if (importData.trim()) {
            dispatch({ type: 'IMPORT_SAVE', payload: importData.trim() });
            setImportData('');
        }
    };

    const menus = [
        { id: 'map', name: '地图', icon: '🗺️' },
        { id: 'character', name: '角色', icon: '👥' },
        { id: 'inventory', name: '道具', icon: '📦' },
        { id: 'city', name: '主城', icon: '🏰' },
        { id: 'research', name: '研究', icon: '🔬' },
        { id: 'worldboss', name: '世界首领', icon: '🐲' },
        { id: 'achievement', name: '成就', icon: '🏆' },
        { id: 'codex', name: '图鉴', icon: '📚' },
    ];

    const renderPage = () => {
        switch (state.currentMenu) {
            case 'map': return <MapPage state={state} dispatch={dispatch} />;
            case 'character': return <CharacterPage state={state} dispatch={dispatch} />;
            case 'inventory': return <InventoryPage state={state} dispatch={dispatch} />;
            case 'city': return <CityPage state={state} dispatch={dispatch} />;
            case 'research': return <ResearchPage state={state} dispatch={dispatch} />;
            case 'worldboss': return <WorldBossPage state={state} />;
            case 'achievement': return <AchievementPage state={state} />;
            case 'codex': return <CodexPage state={state} dispatch={dispatch} />;
            default: return <MapPage state={state} dispatch={dispatch} />;
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #1a1510 0%, #0d0a07 50%, #151210 100%)',
            fontFamily: '"Noto Serif SC", "Cinzel", Georgia, serif',
            color: '#e8dcc4',
            padding: 16,
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Noto+Serif+SC:wght@400;600&display=swap');
        
        * { box-sizing: border-box; }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #4a3c2a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #5a4c3a; }
        
        select, input { font-family: inherit; }
      `}</style>

            {state.offlineRewards && (
                <OfflineRewardsModal
                    rewards={state.offlineRewards.rewards}
                    actualSeconds={state.offlineRewards.actualSeconds}
                    maxSeconds={state.offlineRewards.maxSeconds}
                    onClaim={() => dispatch({
                        type: 'APPLY_OFFLINE_REWARDS',
                        payload: state.offlineRewards
                    })}
                    onDismiss={() => dispatch({ type: 'DISMISS_OFFLINE_REWARDS' })}
                />
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                padding: '12px 20px',
                background: 'linear-gradient(180deg, rgba(40,30,20,0.9), rgba(25,18,12,0.95))',
                border: '2px solid #4a3c2a',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: 24,
                        color: '#c9a227',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        fontWeight: 700,
                    }}>
                        ⚔️ 艾泽拉斯经理人
                    </h1>
                    <span style={{
                        padding: '4px 12px',
                        background: 'rgba(201,162,39,0.2)',
                        borderRadius: 4,
                        fontSize: 12,
                        color: '#c9a227',
                    }}>
            帧: {state.frame}
          </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#888' }}>🪙 {Math.floor(state.resources.gold)}</span>
                    </div>

                    <Button onClick={() => setIsPaused(!isPaused)} variant="secondary">
                        {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
                    </Button>

                    <Button onClick={exportSave} variant="secondary">
                        {showExport ? '✓ 已复制' : '💾 导出'}
                    </Button>

                    <div style={{ display: 'flex', gap: 4 }}>
                        <input
                            type="text"
                            placeholder="粘贴存档..."
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                            style={{
                                padding: '6px 10px',
                                width: 120,
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid #4a3c2a',
                                borderRadius: 4,
                                color: '#fff',
                                fontSize: 12,
                            }}
                        />
                        <Button onClick={importSave} variant="secondary">导入</Button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 16,
                padding: 4,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                border: '1px solid #3a3a3a',
            }}>
                {menus.map(menu => (
                    <button
                        key={menu.id}
                        onClick={() => dispatch({ type: 'SET_MENU', payload: menu.id })}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            background: state.currentMenu === menu.id
                                ? 'linear-gradient(180deg, rgba(201,162,39,0.3), rgba(139,115,25,0.2))'
                                : 'transparent',
                            border: state.currentMenu === menu.id
                                ? '1px solid #c9a227'
                                : '1px solid transparent',
                            borderRadius: 6,
                            color: state.currentMenu === menu.id ? '#ffd700' : '#888',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: 13,
                            transition: 'all 0.2s',
                            textShadow: state.currentMenu === menu.id ? '0 0 10px rgba(255,215,0,0.5)' : 'none',
                        }}
                    >
                        {menu.icon} {menu.name}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ minHeight: 'calc(100vh - 160px)' }}>
                {renderPage()}
            </div>
        </div>
    );
}
