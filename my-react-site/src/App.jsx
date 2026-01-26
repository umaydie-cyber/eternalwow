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
            { level: 1, skillId: 'mastery_precise_block' },
            { level: 3, skillId: 'shield_bash' },
            { level: 5, skillId: 'shield_block' },
            { level: 10, skillId: 'revenge' },
            { level: 20, skillId: 'thunder_strike' },
            { level: 30, skillId: 'shield_wall' },
        ]
    },
    discipline_priest: {
        id: 'discipline_priest',
        name: '戒律牧师',
        baseStats: {
            hp: 100,
            mp: 120,
            attack: 5,
            spellPower: 15,
            armor: 10,
            magicResist: 20,
        },
        skills: [
            { level: 1, skillId: 'basic_attack' },
            { level: 1, skillId: 'rest' },
            { level: 1, skillId: 'mastery_atonement' },
            { level: 3, skillId: 'smite' },
            { level: 5, skillId: 'shadow_word_pain' },
            { level: 10, skillId: 'mind_blast' },
            { level: 20, skillId: 'power_word_radiance' },
            { level: 40, skillId: 'penance' },
        ]
    },
    frost_mage: {
        id: 'frost_mage',
        name: '冰霜法师',
        baseStats: {
            hp: 90,
            mp: 150,
            attack: 5,
            spellPower: 18,
            armor: 8,
            magicResist: 25,
        },
        skills: [
            { level: 1, skillId: 'basic_attack' },
            { level: 1, skillId: 'rest' },
            { level: 1, skillId: 'mastery_deep_winter' },
            { level: 3, skillId: 'frostbolt' },
            { level: 5, skillId: 'ice_lance' },
            { level: 10, skillId: 'blizzard' },
            { level: 20, skillId: 'frozen_orb' },
            { level: 30, skillId: 'icy_veins' },
            { level: 40, skillId: 'comet_storm' },
        ]
    }
};

// ==================== TALENTS ====================
// 天赋触发类型（用于未来扩展）
const TALENT_TYPES = {
    AURA: 'aura',          // 战斗中常驻/光环类（如护甲+100、姿态）
    ON_HIT: 'on_hit',      // 命中/使用普通攻击后触发
    ON_BLOCK: 'on_block',  // 成功格挡后触发
};

// 规则：每10级一行，每行3选1。未到等级不能点。点亮后同排其它变黑。
// 目前只实现战士（防护战士）10/20级，30-70级预留占位。
const TALENTS = {
    protection_warrior: [
        {
            tier: 10,
            options: [
                { id: 'plain', type: TALENT_TYPES.ON_HIT, name: '质朴', description: '普通攻击使你在本场战斗中的攻击强度提高5点。' },
                { id: 'block_master', type: TALENT_TYPES.ON_BLOCK, name: '格挡大师', description: '战斗中每次成功的格挡都会使你在本场战斗中的格挡值提高10点。' },
                { id: 'armor_up', type: TALENT_TYPES.AURA, name: '叠甲过', description: '你在战斗中的护甲值提升100点。' },
            ]
        },
        {
            tier: 20,
            options: [
                { id: 'defense_stance', type: TALENT_TYPES.AURA, name: '防御姿态', description: '你在战斗中受到的伤害降低20%。' },
                { id: 'battle_stance', type: TALENT_TYPES.AURA, name: '战斗姿态', description: '你在战斗中的攻击强度提升10%。' },
                { id: 'berserk_stance', type: TALENT_TYPES.AURA, name: '狂暴姿态', description: '你在战斗中获得额外的8%暴击和20%暴击伤害。' },
            ]
        },
        {
            tier: 30,
            options: [
                { id: 'brutal_momentum', type: TALENT_TYPES.ON_HIT, name: '残暴动力', description: '你的重伤造成的伤害的150%会治疗你。' },
                { id: 'demoralizing_shout', type: TALENT_TYPES.ON_HIT, name: '挫志怒吼', description: '你的雷霆一击会为目标施加debuff【挫志怒吼】，使其造成的所有伤害降低20%。' },
                { id: 'mountain_king', type: TALENT_TYPES.ON_HIT, name: '山丘之王', description: '雷霆一击有50%几率再次释放一次。' },
            ]
        },
        {
            tier: 40,
            options: [
                { id: 'guardian_shield', type: TALENT_TYPES.AURA, name: '护卫神盾', description: '你的盾墙可以配置2次。' },
                { id: 'indomitable_might', type: TALENT_TYPES.AURA, name: '无坚不摧之力', description: '你的盾墙同时使你造成的伤害提高50%。' },
                { id: 'fortified_wall', type: TALENT_TYPES.AURA, name: '坚毅长城', description: '盾墙的减伤提高到75%。' },
            ]
        },
        ...[50, 60, 70].map(tier => ({
            tier,
            options: [
                { id: `t${tier}_a`, name: '（预留）天赋A', description: '待实现' },
                { id: `t${tier}_b`, name: '（预留）天赋B', description: '待实现' },
                { id: `t${tier}_c`, name: '（预留）天赋C', description: '待实现' },
            ]
        }))
    ],
    discipline_priest: [
        {
            tier: 10,
            options: [
                {
                    id: 'shadow_amp',
                    name: '暗影增幅',
                    description: '战斗中暗影伤害提高20%',
                    type: 'aura'
                },
                {
                    id: 'holy_vuln',
                    name: '神圣增幅',
                    description: '惩击使目标受到的法术伤害提高10%，持续2回合',
                    type: 'on_hit'
                },
                {
                    id: 'holy_infusion',
                    name: '神圣灌注',
                    description: '惩击使你本场战斗法术强度+2',
                    type: 'on_cast'
                }
            ]
        },
        {
            tier: 20,
            options: [
                {
                    id: 'radiance_plus',
                    name: '圣光的许诺',
                    description: '真言术：耀可多配置1次',
                    type: 'aura'
                },
                {
                    id: 'long_atonement',
                    name: '持久之光',
                    description: '救赎持续时间+2回合',
                    type: 'aura'
                },
                {
                    id: 'dark_side',
                    name: '阴暗面之力',
                    description: '心灵震爆伤害提高80%',
                    type: 'aura'
                }
            ]
        },
        {
            tier: 30,
            options: [
                {
                    id: 'pwt',
                    name: '真言术：耐',
                    description: '全队生命值提高10%',
                    type: 'aura'
                },
                {
                    id: 'holy_enlight',
                    name: '神圣启迪',
                    description: '全队法术强度提高5%',
                    type: 'aura'
                },
                {
                    id: 'shadowfiend',
                    name: '暗影魔',
                    description: '每回合造成0.3倍法术强度的暗影伤害',
                    type: 'dot'
                }
            ]
        },
        {
            tier: 40,
            options: [
                {
                    id: 'fortune_misfortune',
                    name: '祸福相依',
                    description: '惩击和心灵震爆获得buff【祸福相依】，每层使苦修的治疗量提高25%，使用苦修后清空层数',
                    type: 'on_cast'
                },
                {
                    id: 'ultimate_penance',
                    name: '终极苦修',
                    description: '苦修还会对当前目标造成2倍法术强度的伤害',
                    type: 'aura'
                },
                {
                    id: 'borrowed_time',
                    name: '争分夺秒',
                    description: '释放苦修使你的急速提高30%，持续4回合',
                    type: 'on_cast'
                }
            ]
        }
    ],
    frost_mage: [
        {
            tier: 10,
            options: [
                {
                    id: 'lingering_cold',
                    name: '延绵寒冷',
                    description: '寒冰箭使你的法术强度提高5，持续到战斗结束',
                    type: 'on_cast'
                },
                {
                    id: 'piercing_cold',
                    name: '寒冷刺骨',
                    description: '爆击率提高10',
                    type: 'aura'
                },
                {
                    id: 'frost_amp',
                    name: '寒冰增幅',
                    description: '法术伤害提高10%',
                    type: 'aura'
                }
            ]
        },
        {
            tier: 20,
            options: [
                {
                    id: 'fingers_of_frost',
                    name: '寒冰指',
                    description: '寒冰箭有50%概率使你获得1层寒冰指效果，寒冰指使下一个冰枪术的伤害提高100%',
                    type: 'on_cast'
                },
                {
                    id: 'cold_wisdom',
                    name: '冰冷智慧',
                    description: '寒冰箭有25%概率额外对目标施放冰风暴',
                    type: 'on_cast'
                },
                {
                    id: 'endless_winter',
                    name: '无尽寒冬',
                    description: '寒冰宝珠持续时间提高2回合，伤害提高到0.8倍法术强度',
                    type: 'aura'
                }
            ]
        },
        {
            tier: 30,
            options: [
                {
                    id: 'frozen_touch',
                    name: '冰冻之触',
                    description: '你的冰枪术造成的伤害提升25%',
                    type: 'aura'
                },
                {
                    id: 'cold_intuition',
                    name: '冰冷直觉',
                    description: '你的冰冷智慧触发概率提高至40%',
                    type: 'aura'
                },
                {
                    id: 'orb_mastery',
                    name: '宝珠精通',
                    description: '你的寒冰宝珠造成DOT伤害时有25%概率生成一层寒冰指',
                    type: 'on_hit'
                }
            ]
        },
        {
            tier: 40,
            options: [
                {
                    id: 'glacial_spike',
                    name: '冰川突进',
                    description: '你的彗星风暴每造成一次伤害，获取一层寒冰指',
                    type: 'on_hit'
                },
                {
                    id: 'double_comet',
                    name: '双彗星',
                    description: '你的彗星风暴可以配置2次',
                    type: 'aura'
                },
                {
                    id: 'arcane_intellect',
                    name: '奥术智慧',
                    description: '你的小队所有成员的法术强度提高10%',
                    type: 'aura'
                }
            ]
        }
    ]

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
            // 急速：普通攻击伤害提高（急速 * 2%）
            const hasteMult = 1 + ((char.stats.haste || 0) * 0.02);
            let damage = char.stats.attack * 1.2 * (char.stats.basicAttackMultiplier || 1) * hasteMult;
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
    mastery_precise_block: {
        id: 'mastery_precise_block',
        name: '精通：精确格挡',
        icon: '🎯',
        type: 'passive',
        description: '被动：格挡值提高(10 + 精通/2)%。该提升基于原始格挡数值。'
    },
    shield_bash: {
        limit: 3,
        id: 'shield_bash',
        name: '盾牌猛击',
        description: '造成基于攻击强度和格挡值的伤害',
        icon: 'icons/wow/vanilla/spells/Spell_Fire_FireArmor.png',
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
    },
    thunder_strike: {
        id: 'thunder_strike',
        name: '雷霆一击',
        icon: '⚡',
        type: 'aoe_damage',
        limit: 2,
        description: '对所有敌人造成0.8倍攻击强度的伤害，暴击时对每个目标施加重伤（DOT 0.5倍攻击强度，持续4回合）',
        calculate: (char) => {
            let baseDamage = char.stats.attack * 0.8;

            // 暴击判定
            const isCrit = Math.random() < (char.stats.critRate / 100);
            if (isCrit) {
                baseDamage *= char.stats.critDamage;
            }

            // 全能加成
            baseDamage *= (1 + char.stats.versatility / 100);

            const damage = Math.floor(baseDamage);

            // 暴击时生成的DOT（每目标独立）
            const dot = isCrit ? {
                damagePerTurn: Math.floor(char.stats.attack * 0.5),
                duration: 4,
                name: '重伤'
            } : null;

            return {
                aoeDamage: damage,
                isCrit,
                dotOnCrit: dot  // 战斗系统会检查这个并对每个目标施加
            };
        }
    },

    shield_wall: {
        id: 'shield_wall',
        name: '盾墙',
        icon: '🛡️',
        type: 'buff',
        limit: 1, // 基础1次，护卫神盾天赋可提升到2次
        description: '受到的所有伤害降低50%，持续3回合',
        duration: 3,
        calculate: (char) => {
            // 40级天赋：坚毅长城 - 减伤提高到75%
            const damageTakenMult = char.talents?.[40] === 'fortified_wall' ? 0.25 : 0.5;
            // 40级天赋：无坚不摧之力 - 造成伤害提高50%
            const damageDealtMult = char.talents?.[40] === 'indomitable_might' ? 1.5 : 1;

            return {
                buff: {
                    damageTakenMult,
                    damageDealtMult,
                    duration: 3
                }
            };
        }
    },
    mastery_atonement: {
        id: 'mastery_atonement',
        name: '精通：救赎',
        icon: '✝️',
        type: 'passive',
        description: '被动：救赎治疗比例提升(精通/5)%。该数值直接加在基础20%上。'
    },
    smite: {
        id: 'smite',
        name: '惩击',
        icon: '✨',
        type: 'damage',
        limit: 3,
        description: '造成基于法术强度的神圣伤害',
        calculate: (char) => {
            let damage = char.stats.spellPower * 1.2;
            return {
                damage: Math.floor(damage),
                school: 'holy'
            };
        }
    },
    shadow_word_pain: {
        id: 'shadow_word_pain',
        name: '真言术：痛',
        icon: '🩸',
        type: 'dot',
        limit: 2,
        description: '持续3回合造成暗影伤害',
        calculate: (char) => ({
            dot: {
                school: 'shadow',
                damagePerTurn: Math.floor(char.stats.spellPower * 0.6),
                duration: 3
            }
        })
    },
    mind_blast: {
        id: 'mind_blast',
        name: '心灵震爆',
        icon: '🧠',
        type: 'damage',
        limit: 2,
        description: '造成高额暗影伤害',
        calculate: (char) => {
            let damage = char.stats.spellPower * 2.0;
            return {
                damage: Math.floor(damage),
                school: 'shadow'
            };
        }
    },
    power_word_radiance: {
        id: 'power_word_radiance',
        name: '真言术：耀',
        icon: '🌟',
        type: 'heal',
        limit: 2,
        description: '为全队治疗并施加【救赎】',
        calculate: (char) => ({
            healAll: Math.floor(char.stats.spellPower * 1.5),
            applyAtonement: {
                duration: 2
            }
        })
    },
    penance: {
        id: 'penance',
        name: '苦修',
        icon: '✝️',
        type: 'heal',
        limit: 2,
        description: '对最前排的队友回复3倍法术强度的生命值',
        calculate: (char, combatContext) => {
            let healAmount = Math.floor(char.stats.spellPower * 3);

            // 40级天赋：祸福相依 - 每层提高25%治疗量
            const fortuneStacks = combatContext?.fortuneMisfortuneStacks || 0;
            if (char.talents?.[40] === 'fortune_misfortune' && fortuneStacks > 0) {
                healAmount = Math.floor(healAmount * (1 + fortuneStacks * 0.25));
            }

            const result = {
                penanceHeal: healAmount,
                clearFortuneStacks: char.talents?.[40] === 'fortune_misfortune'
            };

            // 40级天赋：终极苦修 - 还会造成2倍法强伤害
            if (char.talents?.[40] === 'ultimate_penance') {
                result.penanceDamage = Math.floor(char.stats.spellPower * 2);
            }

            // 40级天赋：争分夺秒 - 释放后急速+30%持续4回合
            if (char.talents?.[40] === 'borrowed_time') {
                result.applyHasteBuff = {
                    hasteBonus: 30,
                    duration: 4
                };
            }

            return result;
        }
    },

    // ==================== 冰霜法师技能 ====================
    mastery_deep_winter: {
        id: 'mastery_deep_winter',
        name: '精通：深冬之寒',
        icon: '❄️',
        type: 'passive',
        description: '被动：冰枪术的基础技能倍率提升(精通/2)%。该数值直接加在基础120%上。'
    },
    frostbolt: {
        id: 'frostbolt',
        name: '寒冰箭',
        icon: '❄️',
        type: 'damage',
        limit: 8,
        description: '造成1.8倍法术强度的冰霜伤害',
        calculate: (char, combatContext) => {
            let damage = char.stats.spellPower * 1.8;

            // 冰冷血脉buff：冰霜伤害提高50%
            if (combatContext?.icyVeinsBuff) {
                damage *= 1.5;
            }

            // 10级天赋：寒冰增幅 - 法术伤害提高10%
            if (char.talents?.[10] === 'frost_amp') {
                damage *= 1.1;
            }

            // 暴击判定
            let critRate = char.stats.critRate;
            // 10级天赋：寒冷刺骨 - 暴击率提高10
            if (char.talents?.[10] === 'piercing_cold') {
                critRate += 10;
            }

            const isCrit = Math.random() < critRate / 100;
            if (isCrit) {
                damage *= char.stats.critDamage;
            }

            return {
                damage: Math.floor(damage),
                isCrit,
                school: 'frost',
                triggerFrostboltTalents: true // 标记用于触发天赋
            };
        }
    },
    ice_lance: {
        id: 'ice_lance',
        name: '冰枪术',
        icon: '🔱',
        type: 'damage',
        limit: 8,
        description: '造成1.2倍法术强度的冰霜伤害，爆击伤害额外增加200%',
        calculate: (char, combatContext) => {
            const baseMult = char.stats.iceLanceBaseMultiplier ?? 1.2;
            let damage = char.stats.spellPower * baseMult;

            // 冰冷血脉buff：冰霜伤害提高50%
            if (combatContext?.icyVeinsBuff) {
                damage *= 1.5;
            }

            // 10级天赋：寒冰增幅 - 法术伤害提高10%
            if (char.talents?.[10] === 'frost_amp') {
                damage *= 1.1;
            }

            // 30级天赋：冰冻之触 - 冰枪术伤害提升25%
            if (char.talents?.[30] === 'frozen_touch') {
                damage *= 1.25;
            }

            // 20级天赋：寒冰指 - 消耗一层寒冰指，伤害提高100%
            const fingersOfFrost = combatContext?.fingersOfFrost || 0;
            let consumeFinger = false;
            if (char.talents?.[20] === 'fingers_of_frost' && fingersOfFrost > 0) {
                damage *= 2;
                consumeFinger = true;
            }

            // 暴击判定
            let critRate = char.stats.critRate;
            // 10级天赋：寒冷刺骨 - 暴击率提高10
            if (char.talents?.[10] === 'piercing_cold') {
                critRate += 10;
            }

            // 冰风暴DOT期间必定爆击
            let forceCrit = false;
            if (combatContext?.blizzardActive) {
                forceCrit = true;
            }

            const isCrit = forceCrit || Math.random() < critRate / 100;
            if (isCrit) {
                // 基础暴击伤害 + 额外200%
                damage *= (char.stats.critDamage + 2);
            }

            return {
                damage: Math.floor(damage),
                isCrit,
                school: 'frost',
                consumeFingersOfFrost: consumeFinger
            };
        }
    },
    blizzard: {
        id: 'blizzard',
        name: '冰风暴',
        icon: '🌨️',
        type: 'dot',
        limit: 2,
        description: 'DOT持续3回合，每回合造成1倍法术强度的冰霜伤害，持续期间冰枪术必定爆击',
        calculate: (char, combatContext) => {
            let damagePerTurn = char.stats.spellPower * 1;

            // 冰冷血脉buff：冰霜伤害提高50%
            if (combatContext?.icyVeinsBuff) {
                damagePerTurn *= 1.5;
            }

            // 10级天赋：寒冰增幅 - 法术伤害提高10%
            if (char.talents?.[10] === 'frost_amp') {
                damagePerTurn *= 1.1;
            }

            return {
                dot: {
                    school: 'frost',
                    name: '冰风暴',
                    damagePerTurn: Math.floor(damagePerTurn),
                    duration: 3,
                    enableIceLanceCrit: true // 标记冰枪术必定爆击
                }
            };
        }
    },
    frozen_orb: {
        id: 'frozen_orb',
        name: '寒冰宝珠',
        icon: '🔮',
        type: 'aoe_dot',
        limit: 2,
        description: '对所有敌方单位施加DOT，持续3回合，每回合造成0.5倍法术强度的伤害',
        calculate: (char, combatContext) => {
            let damagePerTurn = char.stats.spellPower * 0.5;
            let duration = 3;

            // 20级天赋：无尽寒冬 - 持续时间+2，伤害提高到0.8倍
            if (char.talents?.[20] === 'endless_winter') {
                duration = 5;
                damagePerTurn = char.stats.spellPower * 0.8;
            }

            // 冰冷血脉buff：冰霜伤害提高50%
            if (combatContext?.icyVeinsBuff) {
                damagePerTurn *= 1.5;
            }

            // 10级天赋：寒冰增幅 - 法术伤害提高10%
            if (char.talents?.[10] === 'frost_amp') {
                damagePerTurn *= 1.1;
            }

            return {
                aoeDot: {
                    school: 'frost',
                    name: '寒冰宝珠',
                    damagePerTurn: Math.floor(damagePerTurn),
                    duration: duration,
                    canGenerateFinger: char.talents?.[30] === 'orb_mastery' // 30级天赋：宝珠精通
                }
            };
        }
    },
    icy_veins: {
        id: 'icy_veins',
        name: '冰冷血脉',
        icon: '💠',
        type: 'buff',
        limit: 1,
        description: '你造成的冰霜伤害提高50%，急速提高50%，持续4回合',
        calculate: (char) => {
            return {
                buff: {
                    type: 'icy_veins',
                    frostDamageMult: 1.5,
                    hasteBonus: 50,
                    duration: 4
                }
            };
        }
    },
    comet_storm: {
        id: 'comet_storm',
        name: '彗星风暴',
        icon: '☄️',
        type: 'aoe_damage',
        limit: 1,
        description: '对所有敌人造成3倍法术强度的伤害',
        calculate: (char, combatContext) => {
            let damage = char.stats.spellPower * 3;

            // 冰冷血脉buff：冰霜伤害提高50%
            if (combatContext?.icyVeinsBuff) {
                damage *= 1.5;
            }

            // 10级天赋：寒冰增幅 - 法术伤害提高10%
            if (char.talents?.[10] === 'frost_amp') {
                damage *= 1.1;
            }

            // 暴击判定
            let critRate = char.stats.critRate;
            // 10级天赋：寒冷刺骨 - 暴击率提高10
            if (char.talents?.[10] === 'piercing_cold') {
                critRate += 10;
            }

            const isCrit = Math.random() < critRate / 100;
            if (isCrit) {
                damage *= char.stats.critDamage;
            }

            return {
                aoeDamage: Math.floor(damage),
                isCrit,
                school: 'frost',
                generateFingerOnHit: char.talents?.[40] === 'glacial_spike' // 40级天赋：冰川突进
            };
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
        level: 10,
        type: 'explore',
        enemies: [
            { name: '收割机傀儡', hp: 250, attack: 25, defense: 20, exp: 45, gold: 35 },
            { name: '迪菲亚盗贼', hp: 300, attack: 30, defense: 18, exp: 50, gold: 40 },
        ],
        resources: ['木材', '毛皮'],
        unlocked: false,
        unlockLevel: 10
    },
    redridge: {
        id: 'redridge',
        name: '赤脊山',
        level: 20,
        type: 'explore',
        enemies: [
            { name: '豺狼人', hp: 1500, attack: 55, defense: 40, exp: 80, gold: 70 },
            { name: '黑石兽人', hp: 2000, attack: 85, defense: 50, exp: 120, gold: 100 },
        ],
        resources: ['木材', '铁矿'],
        unlocked: false,
        unlockLevel: 20
    },
    barrens: {
        id: 'barrens',
        name: '贫瘠之地',
        level: 25,
        type: 'explore',
        enemies: [
            {
                name: '风险投资公司雇员',
                hp: 5000,
                attack: 100,
                defense: 90,
                exp: 1200,
                gold: 800
            },
            {
                name: '贫瘠之地小野猪',
                hp: 8000,
                attack: 75,
                defense: 100,
                exp: 1100,
                gold: 900
            }
        ],
        resources: ['毛皮','铁矿'],
        unlocked: false,
        unlockLevel: 25
    },
    stranglethorn_vale: {
        id: 'stranglethorn_vale',
        name: '荆棘谷',
        level: 30,
        type: 'explore',
        enemies: [
            {
                name: '丛林大猩猩',
                hp: 9000,
                attack: 140,
                defense: 100,
                exp: 1700,
                gold: 1200
            },
            {
                name: '血顶巨魔',
                hp: 7000,
                attack: 150,
                defense: 110,
                exp: 1800,
                gold: 1200
            },
            {
                name: '巴尔瑟拉',
                hp: 15000,
                attack: 200,
                defense: 130,
                exp: 2500,
                gold: 1900
            },
            {
                name: '邦加拉什',
                hp: 12000,
                attack: 250,
                defense: 120,
                exp: 2500,
                gold: 2000
            }
        ],
        resources: ['毛皮', '草药'],
        unlocked: false,
        unlockLevel: 30
    },
    dustwallow_marsh: {
        id: 'dustwallow_marsh',
        name: '尘泥沼泽',
        level: 35,
        type: 'explore',
        enemies: [
            {
                name: '奥妮克希亚的爪牙',
                hp: 28000,
                attack: 280,
                defense: 200,
                exp: 2000,
                gold: 1800
            },
            {
                name: '石槌食人魔',
                hp: 26000,
                attack: 250,
                defense: 240,
                exp: 1800,
                gold: 1600
            },
            {
                name: '利齿鳄鱼',
                hp: 30000,
                attack: 300,
                defense: 180,
                exp: 2200,
                gold: 1900
            }
        ],
        resources: ['草药', '毛皮'],
        unlocked: false,
        unlockLevel: 35
    },
    desolace: {
        id: 'desolace',
        name: '凄凉之地',
        level: 35,
        type: 'explore',
        enemies: [
            {
                name: '毒刺鞭笞者',
                hp: 28000,
                attack: 420,
                defense: 200,
                exp: 2000,
                gold: 1800
            },
            {
                name: '萨特潜行者',
                hp: 26000,
                attack: 3800,
                defense: 240,
                exp: 1800,
                gold: 1600
            },
            {
                name: '半人马可汗',
                hp: 30000,
                attack: 450,
                defense: 180,
                exp: 2200,
                gold: 1900
            }
        ],
        resources: ['草药', '毛皮'],
        unlocked: false,
        unlockLevel: 35
    },
    tanaris: {
        id: 'tanaris',
        name: '塔纳利斯',
        level: 40,
        type: 'explore',
        enemies: [
            {
                name: '沙项巫医',
                hp: 42000,
                attack: 500,
                defense: 250,
                exp: 3000,
                gold: 2500
            },
            {
                name: '钢腭钳嘴龟',
                hp: 49000,
                attack: 550,
                defense: 300,
                exp: 3200,
                gold: 3000
            },
            {
                name: '恐须船长',
                hp: 42000,
                attack: 600,
                defense: 280,
                exp: 3200,
                gold: 3000
            },
            {
                name: '安图苏尔',
                hp: 47000,
                attack: 850,
                defense: 400,
                exp: 3500,
                gold: 4000
            }
        ],
        resources: ['草药', '矿石', '毛皮'],
        unlocked: false,
        unlockLevel: 40
    },
    scarlet_monastery: {
        id: 'scarlet_monastery',
        name: '血色修道院',
        level: 45,
        type: 'explore',
        enemies: [
            {
                name: '血色拷问者',
                hp: 82000,
                attack: 1500,
                defense: 500,
                exp: 4000,
                gold: 4000
            },
            {
                name: '血色僧侣',
                hp: 100000,
                attack: 1300,
                defense: 600,
                exp: 4500,
                gold: 5000
            },
            {
                name: '血色招魂师',
                hp: 82000,
                attack: 1400,
                defense: 550,
                exp: 4500,
                gold: 5000
            },
            {
                name: '血色巫师',
                hp: 90000,
                attack: 1500,
                defense: 600,
                exp: 5000,
                gold: 5500
            }
        ],
        resources: ['草药', '毛皮'],
        unlocked: false,
        unlockLevel: 45
    },
    blackrock_depths: {
        id: 'blackrock_depths',
        name: '黑石深渊',
        level: 50,
        type: 'explore',
        enemies: [
            {
                name: '黑铁矮人守卫',
                hp: 132000,
                attack: 3700,
                defense: 1400,
                exp: 5000,
                gold: 5500
            },
            {
                name: '被奴役的土元素',
                hp: 150000,
                attack: 2900,
                defense: 1900,
                exp: 5500,
                gold: 5000
            },
            {
                name: '战斗傀儡',
                hp: 182000,
                attack: 4100,
                defense: 1750,
                exp: 6500,
                gold: 6000
            }
        ],
        resources: ['铁矿', '矿石'],
        unlocked: false,
        unlockLevel: 50
    },


};

const DROP_TABLES = {
    elwynn_forest: {
        equipment: [
            {
                id: 'EQ_001',
                chance: 0.05, // 5%
            },
            {
                id: 'EQ_002',
                chance: 0.05, // 5%
            },
            {
                id: 'EQ_003',
                chance: 0.001, // 0.1%
            },
            {
                id: 'EQ_004',
                chance: 0.001, // 0.1%
            },
            {
                id: 'EQ_005',
                chance: 0.05, // 5%
            }
        ],
        items: [
            {
                id: 'IT_001',
                chance: 0.05
            }
        ]
    },
    westfall: {
        equipment: [
            { id: 'EQ_006', chance: 0.03 },
            { id: 'EQ_007', chance: 0.03 },
            { id: 'EQ_008', chance: 0.03 },
            { id: 'EQ_009', chance: 0.03 },
            { id: 'EQ_010', chance: 0.03 },
            { id: 'EQ_011', chance: 0.03 },
            { id: 'EQ_012', chance: 0.03 },
            { id: 'EQ_013', chance: 0.001 } // 0.1%
        ]
    },
    redridge: {
        equipment: [
            { id: 'EQ_014', chance: 0.01 },   // 1%
            { id: 'EQ_015', chance: 0.01 },   // 1%
            { id: 'EQ_016', chance: 0.01 },   // 1%
            { id: 'EQ_017', chance: 0.01 },   // 1%
            { id: 'EQ_018', chance: 0.001 }  // 0.1%
        ]
    },
    barrens: {
        equipment: [
            { id: 'EQ_019', chance: 0.01 },   // 1%
            { id: 'EQ_020', chance: 0.003 },  // 0.3%
            { id: 'EQ_021', chance: 0.003 },  // 0.3%
            { id: 'EQ_022', chance: 0.01 },   // 1%
            { id: 'EQ_023', chance: 0.01 },   // 1%
            { id: 'EQ_024', chance: 0.001 },  // 0.1%
            { id: 'EQ_025', chance: 0.003 },  // 0.3%
            { id: 'EQ_026', chance: 0.003 }   // 0.3%
        ]
    },
    stranglethorn_vale: {
        equipment: [
            { id: 'EQ_027', chance: 0.01 },
            { id: 'EQ_028', chance: 0.01 },
            { id: 'EQ_029', chance: 0.01 },
            { id: 'EQ_030', chance: 0.001 },
            { id: 'EQ_031', chance: 0.003 },
            { id: 'EQ_032', chance: 0.003 }
        ],
        items: [
            { id: 'IT_STV_001', chance: 0.005 },
            { id: 'IT_STV_002', chance: 0.005 },
            { id: 'IT_STV_003', chance: 0.005 },
            { id: 'IT_STV_004', chance: 0.005 }
        ]
    },
    dustwallow_marsh: {
        items: [
            {
                id: 'IT_BLACK_DRAGON_PROOF',
                chance: 0.001   // 0.1%，作为剧情钥匙，合理但不泛滥
            }
        ]
    },
    desolace: {
        equipment: [
            { id: 'EQ_033', chance: 0.003 }, // 0.3%
            { id: 'EQ_034', chance: 0.003 }, // 0.1%
            { id: 'EQ_035', chance: 0.01  }, // 1%
            { id: 'EQ_036', chance: 0.003 }, // 0.3%
            { id: 'EQ_037', chance: 0.003 }, // 0.3%
            { id: 'EQ_038', chance: 0.003 }, // 0.3%
            { id: 'EQ_039', chance: 0.003 }, // 0.3%
            { id: 'EQ_040', chance: 0.003 }  // 0.3%
        ]
    },
    tanaris: {
        equipment: [
            { id: 'EQ_041', chance: 0.001 }, // 0.1%
            { id: 'EQ_042', chance: 0.001 }, // 0.1%
            { id: 'EQ_043', chance: 0.003 }, // 0.3%
            { id: 'EQ_045', chance: 0.003 }, // 0.3%
            { id: 'EQ_046', chance: 0.003 }, // 0.3%
            { id: 'EQ_047', chance: 0.003 }, // 0.3%
            { id: 'EQ_048', chance: 0.01  }  // 1%
        ]
    },
    scarlet_monastery: {
        equipment: [
            { id: 'EQ_049', chance: 0.01 },   // 1%
            { id: 'EQ_050', chance: 0.003 },  // 0.3%
            { id: 'EQ_051', chance: 0.003 },  // 0.3%
            { id: 'EQ_052', chance: 0.01 },   // 1%
            { id: 'EQ_053', chance: 0.003 },  // 0.3%
            { id: 'EQ_054', chance: 0.003 },  // 0.3%
            { id: 'EQ_055', chance: 0.001 },  // 0.1%
            { id: 'EQ_056', chance: 0.003 },   // 0.3%
            { id: 'EQ_057', chance: 0.001 },  // 0.1%
            { id: 'EQ_058', chance: 0.003 },  // 0.3%
            { id: 'EQ_059', chance: 0.003 },  // 0.3%
            { id: 'EQ_060', chance: 0.003 },  // 0.3%
            { id: 'EQ_061', chance: 0.003 }   // 0.3%
        ]
    },
    blackrock_depths: {
        equipment: [
            { id: 'EQ_062', chance: 0.003 }, // 0.3%
            { id: 'EQ_063', chance: 0.003 }  // 0.3%
        ]
    },


};

const FIXED_EQUIPMENTS = {
    EQ_001: {
        id: 'EQ_001',
        name: '初心者的盾牌',
        icon: "icons/wow/vanilla/armor/INV_Shield_09.png",
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
        icon: "icons/wow/vanilla/weapons/INV_Sword_12.png",
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
    },
    EQ_003: {
        id: 'EQ_003',
        name: '神秘森林吊坠',
        icon: "icons/wow/vanilla/armor/INV_Jewelry_Necklace_11.png",
        type: 'equipment',
        slot: 'neck',
        rarity: 'blue',

        setId: 'secret_set',
        setName: '神秘套装',

        level: 1,
        maxLevel: 100,
        baseStats: {
            hp: 500,
            versatility: 10
        },
        growth: {
            hp: 2,
            versatility: 2
        }
    },
    EQ_004: {
        id: 'EQ_004',
        name: '神秘森林戒指',
        icon: "icons/wow/vanilla/armor/INV_Jewelry_Ring_12.png",
        type: 'equipment',
        slot: 'ring1',
        rarity: 'blue',

        setId: 'secret_set',
        setName: '神秘套装',

        level: 1,
        maxLevel: 100,
        baseStats: {
            mp: 100,
            versatility: 10
        },
        growth: {
            mp: 2,
            versatility: 2
        }
    },
    EQ_005: {
        id: 'EQ_005',
        name: '初心者的拐杖',
        icon: "icons/wow/vanilla/weapons/INV_Staff_02.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'green',

        setId: 'beginner_set',
        setName: '初心者套装',

        level: 8,
        maxLevel: 100,
        baseStats: {
            spellPower: 30
        },
        growth: {
            spellPower: 2
        }
    },
    REBIRTH_INVITATION: {
        id: 'REBIRTH_INVITATION',
        name: '破碎时空的邀请函',
        type: 'consumable',
        rarity: 'purple',
        icon: 'icons/wow/vanilla/items/INV_Misc_Note_04.png',
        canUse: true,
        description: '使用后解锁重生轮回'
    }
    ,
    EQ_006: {
        id: 'EQ_006',
        name: '旅行者的头盔',
        icon: 'icons/wow/vanilla/armor/INV_Helmet_16.png',
        type: 'equipment',
        slot: 'head',
        rarity: 'green',

        setId: 'traveler_set',
        setName: '旅行者套装',

        level: 2,
        maxLevel: 100,
        baseStats: {
            hp: 150,
            armor: 30
        },
        growth: {
            hp: 2,
            armor: 2
        }
    },
    EQ_007: {
        id: 'EQ_007',
        name: '旅行者的护肩',
        icon: 'icons/wow/vanilla/armor/INV_Shoulder_08.png',
        type: 'equipment',
        slot: 'shoulder',
        rarity: 'green',

        setId: 'traveler_set',
        setName: '旅行者套装',

        level: 2,
        maxLevel: 100,
        baseStats: {
            hp: 120,
            armor: 25,
            spellPower: 15
        },
        growth: {
            hp: 2,
            armor: 2,
            spellPower: 2
        }
    },
    EQ_008: {
        id: 'EQ_008',
        name: '旅行者的胸甲',
        icon: 'icons/wow/vanilla/armor/INV_Shirt_01.png',
        type: 'equipment',
        slot: 'chest',
        rarity: 'green',

        setId: 'traveler_set',
        setName: '旅行者套装',

        level: 2,
        maxLevel: 100,
        baseStats: {
            hp: 200,
            armor: 20
        },
        growth: {
            hp: 2,
            armor: 2
        }
    },
    EQ_009: {
        id: 'EQ_009',
        name: '旅行者的护腕',
        icon: 'icons/wow/vanilla/armor/INV_Bracer_11.png',
        type: 'equipment',
        slot: 'wrist',
        rarity: 'green',

        setId: 'traveler_set',
        setName: '旅行者套装',

        level: 2,
        maxLevel: 100,
        baseStats: {
            hp: 100,
            armor: 20,
            attack: 10
        },
        growth: {
            hp: 2,
            armor: 2,
            attack: 2
        }
    },
    EQ_010: {
        id: 'EQ_010',
        name: '旅行者的手套',
        icon: 'icons/wow/vanilla/armor/INV_Gauntlets_05.png',
        type: 'equipment',
        slot: 'hands',
        rarity: 'green',

        setId: 'traveler_set',
        setName: '旅行者套装',

        level: 2,
        maxLevel: 100,
        baseStats: {
            hp: 120,
            armor: 10,
            attack: 10
        },
        growth: {
            hp: 2,
            armor: 2,
            attack: 2
        }
    },
    EQ_011: {
        id: 'EQ_011',
        name: '旅行者的护腿',
        icon: 'icons/wow/vanilla/armor/INV_Pants_01.png',
        type: 'equipment',
        slot: 'legs',
        rarity: 'green',

        setId: 'traveler_set',
        setName: '旅行者套装',

        level: 2,
        maxLevel: 100,
        baseStats: {
            hp: 200,
            armor: 20,
            spellPower: 15
        },
        growth: {
            hp: 2,
            armor: 2,
            spellPower: 2
        }
    },
    EQ_012: {
        id: 'EQ_012',
        name: '旅行者的布靴',
        icon: 'icons/wow/vanilla/armor/INV_Boots_05.png',
        type: 'equipment',
        slot: 'feet',
        rarity: 'green',

        setId: 'traveler_set',
        setName: '旅行者套装',

        level: 2,
        maxLevel: 100,
        baseStats: {
            hp: 150,
            armor: 30
        },
        growth: {
            hp: 2,
            armor: 2
        }
    },
    EQ_013: {
        id: 'EQ_013',
        name: '神秘山脉戒指',
        icon: 'icons/wow/vanilla/armor/INV_Jewelry_Ring_31.png',
        type: 'equipment',
        slot: 'ring2',
        rarity: 'blue',

        level: 1,
        maxLevel: 100,
        baseStats: {
            mastery: 10
        },
        growth: {
            mastery: 2
        }
    },EQ_014: {
        id: 'EQ_014',
        name: '山脉卫士之刺',
        icon: 'icons/wow/vanilla/weapons/INV_Sword_12.png',
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'green',
        level: 1,
        maxLevel: 100,
        baseStats: {
            attack: 120,
            versatility: 10,
            mastery: 10
        },
        growth: {
            attack: 2,
            versatility: 2,
            mastery: 2
        }
    },
    EQ_015: {
        id: 'EQ_015',
        name: '山脉卫士之噬',
        icon: 'icons/wow/vanilla/weapons/INV_Staff_06.png',
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'green',
        level: 1,
        maxLevel: 100,
        baseStats: {
            spellPower: 180,
            versatility: 10,
            mastery: 10
        },
        growth: {
            spellPower: 2,
            versatility: 2,
            mastery: 2
        }
    },
    EQ_016: {
        id: 'EQ_016',
        name: '山脉卫士之盾',
        icon: 'icons/wow/vanilla/armor/INV_Shield_13.png',
        type: 'equipment',
        slot: 'offHand',
        rarity: 'green',
        level: 1,
        maxLevel: 100,
        baseStats: {
            blockRate: 15,
            blockValue: 80,
            mastery: 10
        },
        growth: {
            blockRate: 2,
            blockValue: 2,
            mastery: 2
        }
    },
    EQ_017: {
        id: 'EQ_017',
        name: '山脉卫士魔典',
        icon: 'icons/wow/vanilla/items/INV_Misc_Orb_02.png',
        type: 'equipment',
        slot: 'offHand',
        rarity: 'green',
        level: 1,
        maxLevel: 100,
        baseStats: {
            spellPower: 100,
            versatility: 10,
            mastery: 20
        },
        growth: {
            spellPower: 2,
            versatility: 2,
            mastery: 2
        }
    },
    EQ_018: {
        id: 'EQ_018',
        name: '山脉卫士之心',
        icon: 'icons/wow/vanilla/trade/INV_Stone_01.png',
        type: 'equipment',
        slot: 'trinket1',
        rarity: 'blue',
        level: 1,
        maxLevel: 100,
        baseStats: {
            spellPower: 120,
            attack: 80,
            mastery: 10,
            versatility: 10
        },
        growth: {
            spellPower: 2,
            attack: 2,
            mastery: 2,
            versatility: 2
        }
    },EQ_019: {
        id: 'EQ_019',
        name: '尖牙手套',
        icon: "icons/wow/vanilla/armor/INV_Gauntlets_18.png",
        type: 'equipment',
        slot: 'hands',
        rarity: 'green',
        setId: 'venom_embrace',
        setName: '毒蛇的拥抱',
        level: 1,
        maxLevel: 100,
        baseStats: {
            hp: 200,
            armor: 30,
            critRate: 2,
            critDamage: 0.10
        },
        growth: {
            hp: 2,
            armor: 2,
            critRate: 2,
            critDamage: 2
        }
    },
    EQ_020: {
        id: 'EQ_020',
        name: '尖牙护腿',
        icon: "icons/wow/vanilla/armor/INV_Pants_02.png",
        type: 'equipment',
        slot: 'legs',
        rarity: 'blue',
        setId: 'venom_embrace',
        setName: '毒蛇的拥抱',
        level: 1,
        maxLevel: 100,
        baseStats: {
            hp: 300,
            armor: 40,
            critRate: 3,
            critDamage: 0.10
        },
        growth: {
            hp: 2,
            armor: 2,
            critRate: 2,
            critDamage: 2
        }
    },
    EQ_021: {
        id: 'EQ_021',
        name: '尖牙铠甲',
        icon: "icons/wow/vanilla/armor/INV_Chest_Leather_08.png",
        type: 'equipment',
        slot: 'chest',
        rarity: 'blue',
        setId: 'venom_embrace',
        setName: '毒蛇的拥抱',
        level: 1,
        maxLevel: 100,
        baseStats: {
            hp: 300,
            armor: 40,
            critRate: 3,
            critDamage: 0.10
        },
        growth: {
            hp: 2,
            armor: 2,
            critRate: 2,
            critDamage: 2
        }
    },
    EQ_022: {
        id: 'EQ_022',
        name: '尖牙腰带',
        icon: "icons/wow/vanilla/armor/INV_Belt_10.png",
        type: 'equipment',
        slot: 'belt',
        rarity: 'green',
        setId: 'venom_embrace',
        setName: '毒蛇的拥抱',
        level: 1,
        maxLevel: 100,
        baseStats: {
            hp: 200,
            armor: 30,
            critRate: 2,
            critDamage: 0.10
        },
        growth: {
            hp: 2,
            armor: 2,
            critRate: 2,
            critDamage: 2
        }
    },
    EQ_023: {
        id: 'EQ_023',
        name: '尖牙足垫',
        icon: "icons/wow/vanilla/armor/INV_Boots_05.png",
        type: 'equipment',
        slot: 'feet',
        rarity: 'green',
        setId: 'venom_embrace',
        setName: '毒蛇的拥抱',
        level: 1,
        maxLevel: 100,
        baseStats: {
            hp: 250,
            armor: 30,
            critRate: 2,
            critDamage: 0.10
        },
        growth: {
            hp: 2,
            armor: 2,
            critRate: 2,
            critDamage: 2
        }
    },
    EQ_024: {
        id: 'EQ_024',
        name: '毒蛇',
        icon: "icons/wow/vanilla/weapons/INV_Weapon_Bow_10.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'purple',
        setId: 'venom_embrace',
        setName: '毒蛇的拥抱',
        level: 1,
        maxLevel: 100,
        baseStats: {
            attack: 250,
            critRate: 20,
            critDamage: 0.5,  // 50% 额外暴击伤害
            versatility: 5
        },
        growth: {
            attack: 2,
            critRate: 2,
            critDamage: 2,
            versatility: 2
        }
    },
    EQ_025: {
        id: 'EQ_025',
        name: '生命之根',
        icon: "icons/wow/vanilla/weapons/INV_Staff_26.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'blue',
        level: 1,
        maxLevel: 100,
        baseStats: {
            spellPower: 200,
            hp: 300,
            versatility: 10
        },
        growth: {
            spellPower: 2,
            hp: 2,
            versatility: 2
        }
    },
    EQ_026: {
        id: 'EQ_026',
        name: '克雷什之背',
        icon: "icons/wow/vanilla/armor/INV_Shield_18.png",
        type: 'equipment',
        slot: 'offHand',
        rarity: 'blue',
        level: 1,
        maxLevel: 100,
        baseStats: {
            blockRate: 20,
            blockValue: 100,
            hp: 400
        },
        growth: {
            blockRate: 2,
            blockValue: 2,
            hp: 2
        }
    },
    EQ_027: {
        id: 'EQ_027',
        name: '锈水头盔',
        icon: "icons/wow/vanilla/armor/INV_Helmet_20.png",
        type: 'equipment',
        slot: 'head',
        rarity: 'green',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 300,
            armor: 40,
            haste: 5,
            mastery: 5
        },
        growth: {
            hp: 2,
            armor: 2,
            haste: 2,
            mastery: 2
        }
    },

    EQ_028: {
        id: 'EQ_028',
        name: '锈水护肩',
        icon: "icons/wow/vanilla/armor/INV_Shoulder_06.png",
        type: 'equipment',
        slot: 'shoulder',
        rarity: 'green',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 220,
            armor: 35,
            haste: 5,
            mastery: 5
        },
        growth: {
            hp: 2,
            armor: 2,
            haste: 2,
            mastery: 2
        }
    },

    EQ_029: {
        id: 'EQ_029',
        name: '锈水护腕',
        icon: "icons/wow/vanilla/armor/INV_Bracer_03.png",
        type: 'equipment',
        slot: 'wrist',
        rarity: 'green',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 200,
            armor: 30,
            haste: 5,
            mastery: 5
        },
        growth: {
            hp: 2,
            armor: 2,
            haste: 2,
            mastery: 2
        }
    },
    EQ_030: {
        id: 'EQ_030',
        name: '乔丹法杖',
        icon: "icons/wow/vanilla/weapons/INV_Wand_06.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'purple',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 350,
            mastery: 10,
            haste: 10,
            versatility: 10,
            critRate: 10
        },
        growth: {
            spellPower: 2,
            mastery: 2,
            haste: 2,
            versatility: 2,
            critRate: 2
        }
    },
    EQ_031: {
        id: 'EQ_031',
        name: '短暂能量护符',
        icon: "icons/wow/vanilla/items/INV_Misc_StoneTablet_11.png",
        type: 'equipment',
        slot: 'trinket2',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 150
        },
        growth: {
            spellPower: 2
        },
        specialEffect: {
            type: 'skill_slot_buff',
            slots: [0, 4],
            spellPowerBonus: 600
        }
    },
    EQ_032: {
        id: 'EQ_032',
        name: '强攻护符',
        icon: "icons/wow/vanilla/items/INV_Misc_Head_Troll_01.png",
        type: 'equipment',
        slot: 'trinket2',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 150
        },
        growth: {
            attack: 2
        },
        specialEffect: {
            type: 'skill_slot_buff',
            slots: [0, 4],
            attackBonus: 600
        }
    },
    IT_BLACK_DRAGON_PROOF: {
        id: 'IT_BLACK_DRAGON_PROOF',
        name: '黑龙化身的证明',
        icon: "icons/wow/vanilla/items/INV_Misc_Head_Dragon_01.png",
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        description: '使用后，揭露真相，解锁隐藏Boss【普瑞斯托女士】'
    },
    EQ_033: {
        id: 'EQ_033',
        name: '天选者印记',
        icon: "icons/wow/vanilla/armor/INV_Jewelry_Talisman_08.png",
        type: 'equipment',
        slot: 'trinket1',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 500,
            versatility: 10,
            haste: 10,
            mastery: 10,
            critRate: 10
        },
        growth: {
            hp: 2,
            versatility: 2,
            haste: 2,
            mastery: 2,
            critRate: 2
        }
    },
    EQ_034: {
        id: 'EQ_034',
        name: '痛击之刃',
        icon: "icons/wow/vanilla/weapons/INV_Sword_36.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 350,
            critRate: 15,
            critDamage: 0.40
        },
        growth: {
            attack: 2,
            critRate: 2,
            critDamage: 2
        }
    },
    EQ_035: {
        id: 'EQ_035',
        name: '热情暗影坠饰',
        icon: "icons/wow/vanilla/armor/INV_Jewelry_Necklace_07.png",
        type: 'equipment',
        slot: 'neck',
        rarity: 'green',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 200,
            hp: 500
        },
        growth: {
            spellPower: 2,
            hp: 2
        }
    },
    EQ_036: {
        id: 'EQ_036',
        name: '莱瑟德斯之眼',
        icon: "icons/wow/vanilla/armor/INV_Jewelry_Ring_08.png",
        type: 'equipment',
        slot: 'ring2',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 200,
            hp: 300,
            critRate: 5
        },
        growth: {
            spellPower: 2,
            hp: 2,
            critRate: 2
        }
    },
    EQ_037: {
        id: 'EQ_037',
        name: '发明家的聚焦剑',
        icon: "icons/wow/vanilla/weapons/INV_Sword_14.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 350,
            critRate: 15,
            critDamage: 0.40
        },
        growth: {
            spellPower: 2,
            critRate: 2,
            critDamage: 2
        }
    },
    EQ_038: {
        id: 'EQ_038',
        name: '元素石脊护腿',
        icon: "icons/wow/vanilla/armor/INV_Pants_04.png",
        type: 'equipment',
        slot: 'legs',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 400,
            armor: 50,
            blockRate: 5
        },
        growth: {
            hp: 2,
            armor: 2,
            blockRate: 2
        }
    },
    EQ_039: {
        id: 'EQ_039',
        name: '黑石戒指',
        icon: "icons/wow/vanilla/armor/INV_Jewelry_Ring_17.png",
        type: 'equipment',
        slot: 'ring2',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 200,
            hp: 300,
            armor: 50,
            versatility: 5
        },
        growth: {
            attack: 2,
            hp: 2,
            armor: 2,
            versatility: 2
        }
    },
    EQ_040: {
        id: 'EQ_040',
        name: '吉兹洛克的高科技圆盾',
        icon: "icons/wow/vanilla/armor/INV_Shield_10.png",
        type: 'equipment',
        slot: 'offHand',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 600,
            armor: 100,
            blockRate: 20,
            blockValue: 200
        },
        growth: {
            hp: 2,
            armor: 2,
            blockRate: 2,
            blockValue: 2
        }
    },
    EQ_041: {
        id: 'EQ_041',
        name: '反击者桑萨斯',
        icon: "icons/wow/vanilla/weapons/INV_Sword_45.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'purple',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 500,
            versatility: 20,
            haste: 20
        },
        growth: {
            attack: 2,
            versatility: 2,
            haste: 2
        }
    },
    EQ_042: {
        id: 'EQ_042',
        name: '保护者加萨斯',
        icon: "icons/wow/vanilla/weapons/INV_Sword_43.png",
        type: 'equipment',
        slot: 'offHand',
        rarity: 'purple',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 500,
            mastery: 20,
            critRate: 20
        },
        growth: {
            attack: 2,
            mastery: 2,
            critRate: 2
        }
    },
    EQ_043: {
        id: 'EQ_043',
        name: '祖穆拉恩的能量法杖',
        icon: "icons/wow/vanilla/weapons/INV_Staff_10.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 550,
            critRate: 15,
            mastery: 15
        },
        growth: {
            spellPower: 2,
            critRate: 2,
            mastery: 2
        }
    },
    EQ_044: {
        id: 'EQ_044',
        name: '鞭笞者苏萨斯',
        icon: "icons/wow/vanilla/weapons/INV_Sword_40.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'orange',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 1200,
            mastery: 10,
            haste: 10,
            versatility: 10
        },
        growth: {
            attack: 2,
            mastery: 2,
            haste: 2,
            versatility: 2
        },
        specialEffect: {
            type: 'basic_attack_repeat',
            chance: 0.5
        },
        synth: { from: ['EQ_041', 'EQ_042'], requireLevel: 100 }
    },
    EQ_045: {
        id: 'EQ_045',
        name: '大坏蛋面具',
        icon: "icons/wow/vanilla/items/INV_Banner_01.png",
        type: 'equipment',
        slot: 'head',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 100,
            hp: 300,
            armor: 50,
            versatility: 5
        },
        growth: {
            spellPower: 2,
            hp: 2,
            armor: 2,
            versatility: 2
        }
    },
    EQ_046: {
        id: 'EQ_046',
        name: '狂乱者的拥抱',
        icon: "icons/wow/vanilla/abilities/Ability_Mount_WhiteDireWolf.png",
        type: 'equipment',
        slot: 'chest',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 100,
            hp: 400,
            armor: 50,
            critRate: 5
        },
        growth: {
            attack: 2,
            hp: 2,
            armor: 2,
            critRate: 2
        }
    },
    EQ_047: {
        id: 'EQ_047',
        name: '大坏蛋肩甲',
        icon: "icons/wow/vanilla/armor/INV_Shoulder_01.png",
        type: 'equipment',
        slot: 'shoulder',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 300,
            armor: 50,
            versatility: 10
        },
        growth: {
            hp: 2,
            armor: 2,
            versatility: 2
        }
    },
    EQ_048: {
        id: 'EQ_048',
        name: '闪亮腰带',
        icon: "icons/wow/vanilla/armor/INV_Belt_22.png",
        type: 'equipment',
        slot: 'belt',
        rarity: 'green',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 300,
            armor: 40,
            versatility: 5
        },
        growth: {
            hp: 2,
            armor: 2,
            versatility: 2
        }
    },
    // ==================== 血色修道院装备 ====================
    EQ_049: {
        id: 'EQ_049',
        name: '血色十字军腰带',
        icon: "icons/wow/vanilla/armor/INV_Belt_16.png",
        type: 'equipment',
        slot: 'belt',
        rarity: 'green',
        setId: 'scarlet_crusader',
        setName: '血色十字军',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 500,
            armor: 50,
            versatility: 10,
            blockRate: 2
        },
        growth: {
            hp: 2,
            armor: 2,
            versatility: 2,
            blockRate: 2
        }
    },
    EQ_050: {
        id: 'EQ_050',
        name: '血色十字军护胸',
        icon: "icons/wow/vanilla/armor/INV_Chest_Chain_16.png",
        type: 'equipment',
        slot: 'chest',
        rarity: 'blue',
        setId: 'scarlet_crusader',
        setName: '血色十字军',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 600,
            armor: 80,
            mastery: 10,
            blockRate: 3
        },
        growth: {
            hp: 2,
            armor: 2,
            mastery: 2,
            blockRate: 2
        }
    },
    EQ_051: {
        id: 'EQ_051',
        name: '血色十字军护腿',
        icon: "icons/wow/vanilla/armor/INV_Pants_06.png",
        type: 'equipment',
        slot: 'legs',
        rarity: 'blue',
        setId: 'scarlet_crusader',
        setName: '血色十字军',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 600,
            armor: 80,
            mastery: 10,
            versatility: 10
        },
        growth: {
            hp: 2,
            armor: 2,
            mastery: 2,
            versatility: 2
        }
    },
    EQ_052: {
        id: 'EQ_052',
        name: '血色十字军护手',
        icon: "icons/wow/vanilla/armor/INV_Gauntlets_26.png",
        type: 'equipment',
        slot: 'hands',
        rarity: 'green',
        setId: 'scarlet_crusader',
        setName: '血色十字军',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 500,
            armor: 50,
            mastery: 10,
            blockRate: 2
        },
        growth: {
            hp: 2,
            armor: 2,
            mastery: 2,
            blockRate: 2
        }
    },
    EQ_053: {
        id: 'EQ_053',
        name: '血色十字军战靴',
        icon: "icons/wow/vanilla/armor/INV_Boots_02.png",
        type: 'equipment',
        slot: 'feet',
        rarity: 'blue',
        setId: 'scarlet_crusader',
        setName: '血色十字军',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 500,
            armor: 50,
            versatility: 10,
            blockRate: 3
        },
        growth: {
            hp: 2,
            armor: 2,
            versatility: 2,
            blockRate: 2
        }
    },
    EQ_054: {
        id: 'EQ_054',
        name: '血色十字军腕甲',
        icon: "icons/wow/vanilla/armor/INV_Bracer_16.png",
        type: 'equipment',
        slot: 'wrist',
        rarity: 'blue',
        setId: 'scarlet_crusader',
        setName: '血色十字军',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 500,
            armor: 50,
            mastery: 10,
            blockValue: 50
        },
        growth: {
            hp: 2,
            armor: 2,
            mastery: 2,
            blockValue: 2
        }
    },
    EQ_055: {
        id: 'EQ_055',
        name: '赫洛德的肩铠',
        icon: "icons/wow/vanilla/armor/INV_Shoulder_25.png",
        type: 'equipment',
        slot: 'shoulder',
        rarity: 'purple',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 500,
            armor: 50,
            critRate: 5,
            haste: 10
        },
        growth: {
            hp: 2,
            armor: 2,
            critRate: 2,
            haste: 2
        }
    },
    EQ_056: {
        id: 'EQ_056',
        name: '圣使护符',
        icon: "icons/wow/vanilla/armor/INV_Jewelry_Amulet_01.png",
        type: 'equipment',
        slot: 'neck',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 800,
            mastery: 10,
            versatility: 10,
            spellPower: 300
        },
        growth: {
            hp: 2,
            mastery: 2,
            versatility: 2,
            spellPower: 2
        }
    },
    EQ_057: {
        id: 'EQ_057',
        name: '破坏者',
        icon: "icons/wow/vanilla/weapons/INV_Axe_11.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'purple',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 750,
            critRate: 20,
            versatility: 10,
            critDamage: 0.5
        },
        growth: {
            attack: 2,
            critRate: 2,
            versatility: 2,
            critDamage: 2
        }
    },
    EQ_058: {
        id: 'EQ_058',
        name: '公正之手',
        icon: "icons/wow/vanilla/weapons/INV_Mace_14.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 800,
            spellPower: 650,
            mastery: 20,
            versatility: 10
        },
        growth: {
            hp: 2,
            spellPower: 2,
            mastery: 2,
            versatility: 2
        }
    },
    EQ_059: {
        id: 'EQ_059',
        name: '血色指挥官之盾',
        icon: "icons/wow/vanilla/armor/INV_Shield_06.png",
        type: 'equipment',
        slot: 'offHand',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 1000,
            armor: 120,
            mastery: 20,
            blockRate: 20,
            blockValue: 300
        },
        growth: {
            hp: 2,
            armor: 2,
            mastery: 2,
            blockRate: 2,
            blockValue: 2
        }
    },
    EQ_060: {
        id: 'EQ_060',
        name: '幻影法杖',
        icon: "icons/wow/vanilla/weapons/INV_Staff_13.png",
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 750,
            critRate: 10,
            versatility: 20,
            haste: 20
        },
        growth: {
            spellPower: 2,
            critRate: 2,
            versatility: 2,
            haste: 2
        }
    },
    EQ_061: {
        id: 'EQ_061',
        name: '遗忘先知宝珠',
        icon: "icons/wow/vanilla/items/INV_Misc_Orb_02.png",
        type: 'equipment',
        slot: 'offHand',
        rarity: 'blue',
        level: 0,
        maxLevel: 100,
        baseStats: {
            spellPower: 500,
            mastery: 10,
            versatility: 10,
            haste: 10
        },
        growth: {
            spellPower: 2,
            mastery: 2,
            versatility: 2,
            haste: 2
        }
    },
    EQ_062: {
        id: 'EQ_062',
        name: '正义之手',
        icon: "icons/wow/vanilla/armor/INV_Jewelry_Talisman_01.png",
        type: 'equipment',
        slot: 'trinket1',
        rarity: 'blue',

        level: 0,
        maxLevel: 100,

        baseStats: {
            attack: 350,
            haste: 10
        },
        growth: {
            attack: 2,
            haste: 2
        },

        specialEffect: {
            type: 'basic_attack_repeat',
            chance: 0.20
        }
    },
    EQ_063: {
        id: 'EQ_063',
        name: '血蚀之刃',
        icon: "icons/wow/vanilla/weapons/INV_Weapon_ShortBlade_15.png",
        type: 'equipment',
        slot: 'offHand',
        rarity: 'blue',

        level: 0,
        maxLevel: 100,

        baseStats: {
            attack: 800,
            haste: 20,
            mastery: 20
        },
        growth: {
            attack: 2,
            haste: 2,
            mastery: 2
        },

        specialEffect: {
            type: 'basic_attack_repeat',
            chance: 0.20
        }
    },
};

//赤脊山5件图鉴100级点亮效果
const REDRIDGE_LV100_SET = ['EQ_014', 'EQ_015', 'EQ_016', 'EQ_017', 'EQ_018'];
// 贫瘠之地毒蛇的拥抱6件装备全部达到过Lv.100 → 全队爆击率+5
const BARRENS_LV100_SET = ['EQ_019', 'EQ_020', 'EQ_021', 'EQ_022', 'EQ_023', 'EQ_024'];

//荆棘谷6件100级图鉴点亮效果
const STRANGLETHORN_LV100_SET = ['EQ_027', 'EQ_028', 'EQ_029', 'EQ_030', 'EQ_031', 'EQ_032'];

// 凄凉之地 6 件装备全部达到过 Lv.100 → 全队精通 +5
const DESOLACE_LV100_SET = ['EQ_035', 'EQ_036', 'EQ_037', 'EQ_038', 'EQ_039', 'EQ_040'];
// 血色修道院 13 件装备全部达到过 Lv.100 → 全队攻击强度+200 法术强度+200
const SCARLET_MONASTERY_LV100_SET = [
    'EQ_049', 'EQ_050', 'EQ_051', 'EQ_052', 'EQ_053', 'EQ_054',
    'EQ_055', 'EQ_056', 'EQ_057', 'EQ_058', 'EQ_059', 'EQ_060', 'EQ_061'
];

// ==================== 图鉴集齐效果配置 ====================
const CODEX_SET_EFFECTS = [
    {
        id: 'redridge',
        name: '赤脊山',
        equipIds: REDRIDGE_LV100_SET,
        effect: '全队全能 +5',
        color: '#4CAF50'
    },
    {
        id: 'barrens',
        name: '贫瘠之地',
        equipIds: BARRENS_LV100_SET,
        effect: '全队爆击率 +5%',
        color: '#ff9800'
    },
    {
        id: 'stranglethorn',
        name: '荆棘谷',
        equipIds: STRANGLETHORN_LV100_SET,
        effect: '全队急速 +5',
        color: '#2196F3'
    },
    {
        id: 'desolace',
        name: '凄凉之地',
        equipIds: DESOLACE_LV100_SET,
        effect: '全队精通 +5',
        color: '#9C27B0'
    },
    {
        id: 'scarlet_monastery',
        name: '血色修道院',
        equipIds: SCARLET_MONASTERY_LV100_SET,
        effect: '全队攻击 +200，法强 +200',
        color: '#f44336'
    },
    {
        id: 'susas',
        name: '鞭笞者苏萨斯',
        equipIds: ['EQ_044'],
        effect: '全队全能 +5，急速 +10，精通 +10',
        color: '#ff8000'
    }
];

// ==================== RARITY COLORS ====================
const RARITY_COLORS = {
    white: '#d9d9d9',
    green: '#1eff00',
    blue: '#0070dd',
    purple: '#a335ee',
    orange: '#ff8000',
    gold: '#ffd700'
};

const getRarityColor = (rarity) => {
    if (!rarity) return '#4a3c2a';
    return RARITY_COLORS[rarity] || '#4a3c2a';
};

const ITEMS = {
    IT_001: {
        id: 'IT_001',
        name: '破烂的毛皮',
        type: 'junk',
        rarity: 'white',
        sellPrice: 200,
        icon: '🦊'
    },
    IT_STV_001: {
        id: 'IT_STV_001',
        name: '荆棘谷的青山·第一章',
        type: 'junk',
        rarity: 'white',
        sellPrice: 5000
    },
    IT_STV_002: {
        id: 'IT_STV_002',
        name: '荆棘谷的青山·第二章',
        type: 'junk',
        rarity: 'white',
        sellPrice: 5000
    },
    IT_STV_003: {
        id: 'IT_STV_003',
        name: '荆棘谷的青山·第三章',
        type: 'junk',
        rarity: 'white',
        sellPrice: 5000
    },
    IT_STV_004: {
        id: 'IT_STV_004',
        name: '荆棘谷的青山·第四章',
        type: 'junk',
        rarity: 'white',
        sellPrice: 5000
    }

};


const BUILDINGS = {
    house: { id: 'house', name: '民居', cost: { gold: 100, wood: 50 }, production: { population: 2 }, consumption: {} },
    lumber_mill: { id: 'lumber_mill', name: '伐木场', cost: { gold: 200 }, production: { wood: 5 }, consumption: { population: 1 } },
    iron_mine: { id: 'iron_mine', name: '铁矿场', cost: { gold: 300, wood: 150 }, production: { ironOre: 3 }, consumption: { population: 2 } },
    foundry: { id: 'foundry', name: '铸造厂', cost: { gold: 500, wood: 200, ironOre: 100 }, production: { ironIngot: 2 }, consumption: { population: 2, ironOre: 3 } },
    gathering_hut: { id: 'gathering_hut', name: '采集所', cost: { gold: 150, wood: 75 }, production: { herb: 4 }, consumption: { population: 1 } },
    hunter_lodge: { id: 'hunter_lodge', name: '猎人小屋', cost: { gold: 250, wood: 120 }, production: { leather: 3 }, consumption: { population: 1 } },
    mana_well: { id: 'mana_well', name: '魔力之源', cost: { gold: 800, ironIngot: 50 }, production: { magicEssence: 1 }, consumption: { population: 3 } },
    alchemy_lab: { id: 'alchemy_lab', name: '炼金实验室', cost: { gold: 600, wood: 100, herb: 50 }, production: { alchemyOil: 2 }, consumption: { population: 2, herb: 2 } },
    plaza_fountain: {
        id: 'plaza_fountain',
        name: '广场喷泉',
        cost: { gold: 10000, wood: 10000, ironOre: 8000 },
        production: {},
        consumption: {}
        // 效果在 gameReducer 的 TICK 中实现（见下文）
    },
};

function getBuildingCost(buildingId, state) {
    const building = BUILDINGS[buildingId];
    const builtCount = state.buildings[buildingId] || 0;

    const multiplier = 1 + builtCount * 0.1;

    const cost = {};
    for (const [res, amount] of Object.entries(building.cost)) {
        cost[res] = Math.ceil(amount * multiplier);
    }

    return cost;
}

function ItemIcon({ item, size = 28 }) {
    if (!item) return null;

    if (item.icon) {
        return (
            <img
                src={item.icon}
                alt={item.name}
                style={{
                    width: size,
                    height: size,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                    background: "#000",
                    border: "1px solid #444",
                    borderRadius: 4,
                }}
            />
        );
    }

    return <span style={{ fontSize: size }}>📦</span>;
}

function SlotIcon({ slot, size = 28 }) {
    const info = EQUIPMENT_SLOTS?.[slot];
    // 没有图片时回退到 emoji
    return <span style={{ fontSize: size }}>{info?.icon || "📦"}</span>;
}


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
    susas: {
        id: 'susas',
        name: '鞭笞者苏萨斯',
        description: '点亮【鞭笞者苏萨斯】Lv.100 图鉴',
        condition: (state) => Array.isArray(state.codexEquipLv100) && state.codexEquipLv100.includes('EQ_044'),
        reward: { dropBonus: 0.05 },
        icon: '🏴‍☠️'
    },
};

const WORLD_BOSSES = {
    hogger: { id: 'hogger', name: '霍格',icon:'icons/wow/vanilla/boss/hogger.png', hp: 18000, attack: 150, defense: 70, rewards: { gold: 5000, exp: 5500 } },
    vancleef: { id: 'vancleef', name: '艾德温·范克里夫', icon: 'icons/wow/vanilla/boss/vancleef.png', hp: 140000, attack: 550, defense: 350, rewards: { gold: 25000, exp: 19800 }, unlockLevel: 30 },
    prestor_lady: {
        id: 'prestor_lady',
        name: '普瑞斯托女士',
        maxHp: 400000,
        attack: 1000,
        defense: 960,
        unlockCondition: {
            requireItem: 'IT_BLACK_DRAGON_PROOF'
        },
        rewards: {
            gold: 20000,
            exp: 8000,
            items: [
                // 这里后续可以放黑龙主题紫装
            ]
        }
    }

};

// 装备槽位定义
const EQUIPMENT_SLOTS = {
    head: { name: '头部', icon: '⛑️' },
    neck: { name: '项链', icon: '📿' },
    shoulder: { name: '肩膀', icon: '🎽' },
    cloak: { name: '披风', icon: '🧥' },
    chest: { name: '胸甲', icon: '🛡️' },
    wrist: { name: '手腕', icon: '⌚' },
    hands: { name: '手套', icon: '🧤' },
    belt: { name: '腰带', icon: '🧷' },
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
    },
    traveler_set: {
        name: '旅行者套装',
        tiers: [
            {
                count: 6,
                bonus: {
                    expBonus: 0.40
                }
            }
        ]
    },venom_embrace: {
        name: '毒蛇的拥抱',
        tiers: [
            { count: 3, bonus: { versatility: 10 } },
            { count: 6, bonus: { critRate: 10, critDamage: 0.30 } }  // 10%爆击率 + 30%暴击伤害
        ]
    },scarlet_crusader: {
        name: '血色十字军',
        tiers: [
            { count: 3, bonus: { armor: 100, blockValue: 50 } },
            { count: 6, bonus: { hp: 1000, blockRate: 5 } }
        ]
    }
};

// ==================== BOSS DATA ====================
const BOSS_DATA = {
    hogger: {
        id: 'hogger',
        name: '霍格',
        maxHp: 18000,
        attack: 150,
        defense: 70,
        cycle: ['summon', 'strike', 'strike', 'strike'],
        summonCount: 2,
        heavyMultiplier: 2.5,
        minion: {
            name: '豺狼人小弟',
            maxHp: 300,
            attack: 75,
            defense: 20
        },
        rewards: {
            gold: 5000,
            exp: 5500,
            items: [
                { id: 'REBIRTH_INVITATION' }
            ]
        }
    },
    vancleef: {
        id: 'vancleef',
        name: '艾德温·范克里夫',
        maxHp: 140000,
        attack: 550,
        defense: 350,
        // 技能循环：致死打击 → 火炮手准备 → 致死打击 → 登上甲板
        cycle: ['mortal_strike', 'summon_cannoneers', 'mortal_strike', 'board_the_deck'],
        // 致死打击：3倍攻击
        mortalStrikeMultiplier: 3,
        // 致死打击debuff：减疗50%持续2回合
        mortalStrikeDebuff: {
            healingReduction: 0.5,
            duration: 2
        },
        // 火炮手配置
        minion: {
            name: '迪菲亚火炮手',
            maxHp: 600,
            attack: 0, // 火炮手不普攻，只AOE
            defense: 300,
            aoeDamageMultiplier: 0.7 // 对全队造成boss攻击×0.7的伤害
        },
        summonCount: 3,
        rewards: {
            gold: 25000,
            exp: 19800,
            items: [
                // 可以添加范克里夫专属掉落
            ]
        }
    }
};

// ==================== 羁绊名称映射 ====================
const BOND_NAMES = {
    baoernai: '包二奶',
    jianyue: '简约而不简单'
};

// ==================== UTILS ====================
function formatItemStatValue(stat, valueRaw) {
    const v = Number(valueRaw) || 0;

    const percentStats = new Set(['critRate', 'blockRate']);

    if (percentStats.has(stat)) {
        return `${(v).toFixed(1)}%`;
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
        qualityColor: getRarityColor(tpl?.rarity),
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
        dropBonus: '掉落增幅',
        resourceBonus: '资源产出增幅',
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

function getAchievementDropBonus(state) {
    const unlocked = state?.achievements || {};
    let bonus = 0;
    Object.values(ACHIEVEMENTS).forEach(a => {
        if (unlocked[a.id] && a.reward?.dropBonus) {
            bonus += a.reward.dropBonus;
        }
    });
    return bonus; // 例如 0.05 = +5%
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

// 计算“全队光环”倍率：只要队里有人点了，就全队吃到
function getPartyAuraMultipliers(characters) {
    let hpMul = 1;
    let spellPowerMul = 1;

    (characters || []).forEach(c => {
        const t = c.talents || {};
        // 30级：真言术耐（全队HP+10%）
        if (t[30] === 'pwt') hpMul *= 1.10;

        // 30级：神圣启迪（全队法强+5%）
        if (t[30] === 'holy_enlight') spellPowerMul *= 1.05;

        // 冰霜法师40级：奥术智慧（全队法强+10%）
        if (t[40] === 'arcane_intellect') spellPowerMul *= 1.10;
    });

    return { hpMul, spellPowerMul };
}

// 用同一套光环倍率，重算全队 stats（关键：光环要全队一起重算）
function recalcPartyStats(gameState,characters) {
    const auras = getPartyAuraMultipliers(characters);
    return (characters || []).map(c => {
        const next = { ...c };
        next.stats = calculateTotalStats(next, auras, gameState);
        return next;
    });
}


// 计算角色总属性（基础+装备）
function calculateTotalStats(character, partyAuras = { hpMul: 1, spellPowerMul: 1 }, gameState) {
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
        blockRate: 0,
        expBonus: 0,

        // 天赋/状态用：受到伤害乘区（1=不变，0.8=减伤20%）
        damageTakenMult: 1
    };

    // 套装加成（expBonus / goldBonus / dropBonus 等）
    const setBonuses = getSetBonusesForCharacter(character);
    for (const set of setBonuses) {
        for (const tier of set.activated) {
            for (const [k, v] of Object.entries(tier.bonus || {})) {
                totalStats[k] = (totalStats[k] || 0) + v;
            }
        }
    }

    // 重生全局加成
    totalStats.expBonus = (totalStats.expBonus || 0) + (gameState?.rebirthBonuses?.exp || 0);

    // ===== 赤脊山五件装备全部达到过Lv.100 → 全队全能+5 =====
    if (gameState && Array.isArray(gameState.codexEquipLv100) &&
        REDRIDGE_LV100_SET.every(id => gameState.codexEquipLv100.includes(id))) {
        totalStats.versatility = (totalStats.versatility || 0) + 5;
    }

    // 贫瘠之地毒蛇的拥抱6件全部达到过Lv.100 → 全队爆击率+5
    if (gameState && Array.isArray(gameState.codexEquipLv100) &&
        BARRENS_LV100_SET.every(id => gameState.codexEquipLv100.includes(id))) {
        totalStats.critRate = (totalStats.critRate || 0) + 5;
    }

    // 荆棘谷 6 件装备全部达到过 Lv.100 → 全队急速 +5
    if (
        gameState &&
        Array.isArray(gameState.codexEquipLv100) &&
        STRANGLETHORN_LV100_SET.every(id =>
            gameState.codexEquipLv100.includes(id)
        )
    ) {
        totalStats.haste = (totalStats.haste || 0) + 5;
    }
    // 凄凉之地 6 件装备全部达到过 Lv.100 → 全队精通 +5
    if (
        gameState &&
        Array.isArray(gameState.codexEquipLv100) &&
        DESOLACE_LV100_SET.every(id => gameState.codexEquipLv100.includes(id))
    ) {
        totalStats.mastery = (totalStats.mastery || 0) + 5;
    }

    // 血色修道院 13 件装备全部达到过 Lv.100 → 全队攻击强度+200 法术强度+200
    if (
        gameState &&
        Array.isArray(gameState.codexEquipLv100) &&
        SCARLET_MONASTERY_LV100_SET.every(id => gameState.codexEquipLv100.includes(id))
    ) {
        totalStats.attack = (totalStats.attack || 0) + 200;
        totalStats.spellPower = (totalStats.spellPower || 0) + 200;
    }

    // 鞭笞者苏萨斯（EQ_044）点亮 100级图鉴：全队 全能+5 急速+10 精通+10
    if (gameState && Array.isArray(gameState.codexEquipLv100) &&
        gameState.codexEquipLv100.includes('EQ_044')) {
        totalStats.versatility = (totalStats.versatility || 0) + 5;
        totalStats.haste = (totalStats.haste || 0) + 10;
        totalStats.mastery = (totalStats.mastery || 0) + 10;
    }

    // 简约而不简单羁绊：单一职业队伍普通攻击伤害提高150%
    if (gameState?.rebirthBonds?.includes('jianyue')) {
        const allSameClass =
            (gameState?.characters?.length || 0) > 0 &&
            gameState.characters.every(c => c.classId === gameState.characters[0].classId);

        if (allSameClass) {
            totalStats.basicAttackMultiplier = (totalStats.basicAttackMultiplier || 1) * 2.5;
        }
    }

    Object.values(character.equipment || {}).forEach(item => {
        if (item && item.stats) {
            Object.entries(item.stats).forEach(([stat, value]) => {
                totalStats[stat] = (totalStats[stat] || 0) + value;
            });

        }
    });

    // ==================== TALENTS (PASSIVE) ====================
    // 仅处理“永久/战斗中始终生效”的被动：如护甲+100、姿态等。
    // 战斗内“叠层”类天赋（质朴/格挡大师）在战斗系统里处理。
    const t = character.talents || {};
    if (character.classId === 'protection_warrior') {
        // 10级：叠甲过 - 护甲 +100（战斗中生效；此游戏只有战斗用护甲，所以直接加到总护甲）
        if (t[10] === 'armor_up') {
            totalStats.armor = (totalStats.armor || 0) + 100;
        }

        // 20级：姿态三选一
        if (t[20] === 'defense_stance') {
            totalStats.damageTakenMult = (totalStats.damageTakenMult || 1) * 0.8; // 受到伤害 -20%
        } else if (t[20] === 'battle_stance') {
            totalStats.attack = (totalStats.attack || 0) * 1.10; // 攻击强度 +10%
        } else if (t[20] === 'berserk_stance') {
            totalStats.critRate = (totalStats.critRate || 0) + 8;      // 暴击 +8%
            totalStats.critDamage = (totalStats.critDamage || 2.0) + 0.20; // 暴击伤害 +20%（以倍率加成）
        }
    }

    // ==================== 精通：精确格挡 ====================
    if (character.classId === 'protection_warrior') {
        const mastery = totalStats.mastery || 0;

        // (10 + mastery / 2)%
        const masteryBonusPct = (10 + mastery / 2) / 100;

        // 只放大“原始格挡率 / 原始格挡值”
        //totalStats.blockRate += totalStats.blockRate * masteryBonusPct;
        totalStats.blockValue += totalStats.blockValue * masteryBonusPct;
    }

    // ==================== 戒律牧师精通：救赎（1级被动） ====================
    if (character.classId === 'discipline_priest') {
        const mastery = Number(totalStats.mastery) || 0;

        // 基础救赎 20% + 精通/5 %
        const atonementRate =
            0.20 + (mastery / 5) / 100;

        totalStats.atonement = {
            healingRate: atonementRate
        };
    }

    // ==================== 冰霜法师精通：深冬之寒（1级被动） ====================
    if (character.classId === 'frost_mage') {
        const mastery = Number(totalStats.mastery) || 0;
        // 基础 120% + 精通/2 %
        const iceLanceBaseMultiplier =
            1.20 + (mastery / 2) / 100;

        totalStats.iceLanceBaseMultiplier = iceLanceBaseMultiplier;
    }

    totalStats.maxHp = Math.floor((totalStats.hp || 0) * (partyAuras.hpMul || 1));
    totalStats.maxMp = totalStats.mp;

    // ✅ 关键：保留旧的 currentHp/currentMp，不要直接重置为满
    const prevHp = character.stats?.currentHp ?? totalStats.maxHp;
    const prevMp = character.stats?.currentMp ?? totalStats.maxMp;

    totalStats.currentHp = Math.min(totalStats.maxHp, Math.max(0, prevHp));
    totalStats.currentMp = Math.min(totalStats.maxMp, Math.max(0, prevMp));
    totalStats.spellPower = Math.floor((totalStats.spellPower || 0) * (partyAuras.spellPowerMul || 1));

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

// ==================== TRINKET: 技能栏强化（第1/第4格等） ====================
// 约定：specialEffect.type === 'skill_slot_buff'
// specialEffect.slots: [0..7]（0=第一格）
// specialEffect.attackBonus / spellPowerBonus：在该技能格释放技能时，临时加到角色计算用面板
// 与装备数值一致：满级(100)视为*2，因此这里也做线性缩放：mul = 1 + level/100
function getSkillSlotBuffBonus(character, slotIndex) {
    const idx = Number(slotIndex);
    if (!Number.isFinite(idx)) return { attackBonus: 0, spellPowerBonus: 0 };

    const eqList = Object.values(character?.equipment || {}).filter(Boolean);
    if (eqList.length === 0) return { attackBonus: 0, spellPowerBonus: 0 };

    let attackBonus = 0;
    let spellPowerBonus = 0;

    for (const eq of eqList) {
        const se = eq?.specialEffect;
        if (!se || se.type !== 'skill_slot_buff') continue;

        const slots = Array.isArray(se.slots) ? se.slots : [];
        if (!slots.includes(idx)) continue;

        // 线性缩放：lv0=1x, lv100=2x
        const lv = clamp(Number(eq.currentLevel ?? eq.level) || 0, 0, 100);
        const mul = 1 + (lv / 100);

        attackBonus += (Number(se.attackBonus) || 0) * mul;
        spellPowerBonus += (Number(se.spellPowerBonus) || 0) * mul;
    }

    return {
        attackBonus: Math.floor(attackBonus),
        spellPowerBonus: Math.floor(spellPowerBonus)
    };
}

// 检查角色是否有普攻重复特效，返回触发概率
function getBasicAttackRepeatChance(character) {
    const eqList = Object.values(character?.equipment || {}).filter(Boolean);
    for (const eq of eqList) {
        const se = eq?.specialEffect;
        if (se && se.type === 'basic_attack_repeat') {
            return se.chance || 0;
        }
    }
    return 0;
}

// ==================== BOSS战斗一步推进函数 ====================
function stepBossCombat(state) {
    if (!state.bossCombat) return state;

    let combat = { ...state.bossCombat };
    combat.logs = combat.logs || [];
    let logs = [...combat.logs];

    const boss = BOSS_DATA[combat.bossId];
    if (!boss) return state;

    combat.round += 1;

    // ==================== 玩家阶段 ====================
    for (let i = 0; i < combat.playerStates.length; i++) {
        const p = combat.playerStates[i];
        if (p.currentHp <= 0) continue;

        const slotIndex = p.skillIndex % p.validSkills.length;
        const skillId = p.validSkills[p.skillIndex % p.validSkills.length];
        p.skillIndex += 1;
        const skill = SKILLS[skillId];
        if (!skill) continue;

        // 饰品/装备特效
        const slotBuff = getSkillSlotBuffBonus(p.char, slotIndex);

        const charForCalc = {
            ...p.char,
            stats: {
                ...p.char.stats,
                attack: (p.char.stats.attack || 0) + (p.talentBuffs?.attackFlat || 0) + (slotBuff.attackBonus || 0),
                blockValue: (p.char.stats.blockValue || 0) + (p.talentBuffs?.blockValueFlat || 0),
                spellPower: (p.char.stats.spellPower || 0) + (p.talentBuffs?.spellPowerFlat || 0) + (slotBuff.spellPowerBonus || 0)
            }
        };

        // combatContext
        const icyVeinsBuff = p.buffs?.some(b => b.type === 'icy_veins');
        const blizzardActive = combat.bossDots?.some(d => d.name === '冰风暴' && d.sourcePlayerId === p.char.id) ||
            combat.minions?.some(m => m.dots?.some(d => d.name === '冰风暴' && d.sourcePlayerId === p.char.id));

        const combatContext = {
            fortuneMisfortuneStacks: p.fortuneMisfortuneStacks || 0,
            icyVeinsBuff,
            blizzardActive,
            fingersOfFrost: p.fingersOfFrost || 0
        };
        const result = skill.calculate(charForCalc, combatContext);

        // 目标选择逻辑 - 检查火炮手是否免疫
        let targetType = 'boss';
        let targetIndex = -1;

        // 检查是否有可攻击的小弟（排除免疫状态的火炮手）
        const attackableMinions = combat.minions
            .map((m, idx) => ({ idx, hp: m.hp, immune: m.immune }))
            .filter(m => m.hp > 0 && !m.immune);

        if (!combat.strategy.priorityBoss && attackableMinions.length > 0) {
            attackableMinions.sort((a, b) => a.hp - b.hp);
            targetIndex = attackableMinions[0].idx;
            targetType = 'minion';
        }

        // buff伤害加成
        let buffDamageDealtMult = 1;
        if (p.buffs) {
            p.buffs.forEach(b => {
                if (b.damageDealtMult) {
                    buffDamageDealtMult *= b.damageDealtMult;
                }
            });
        }

        // 普通攻击执行函数
        const executeBasicAttackDamage = (isRepeat = false) => {
            const basicSkill = SKILLS['basic_attack'];
            const basicResult = basicSkill.calculate(charForCalc, combatContext);

            if (basicResult.damage) {
                let damage = basicResult.damage * buffDamageDealtMult;
                const targetDefense = targetType === 'boss' ? boss.defense : (boss.minion?.defense || boss.cannoneer?.defense || 0);
                const actualDamage = Math.max(1, Math.floor(damage - targetDefense));

                if (targetType === 'boss') {
                    combat.bossHp -= actualDamage;
                } else {
                    // 检查免疫
                    if (combat.minions[targetIndex]?.immune) {
                        logs.push(`位置${i + 1} ${p.char.name} 的攻击被【登上甲板】免疫！`);
                        return 0;
                    }
                    combat.minions[targetIndex].hp -= actualDamage;
                }

                const repeatText = isRepeat ? '(鞭笞者苏萨斯)' : '';
                const minionName = boss.minion?.name || boss.cannoneer?.name || '小弟';
                logs.push(`位置${i + 1} ${p.char.name} 使用 普通攻击${repeatText} 对 ${targetType === 'boss' ? boss.name : minionName} 造成 ${actualDamage} 伤害${basicResult.isCrit ? '（暴击）' : ''}`);

                return actualDamage;
            }
            return 0;
        };

        // AOE伤害处理
        if (result.aoeDamage) {
            let damage = result.aoeDamage * buffDamageDealtMult;
            const skillName = skill.name || '技能';

            // 对 Boss 造成伤害
            if (combat.bossHp > 0) {
                combat.bossHp -= damage;
                logs.push(`位置${i + 1} ${p.char.name} 的${skillName}对 ${boss.name} 造成 ${Math.floor(damage)} 伤害${result.isCrit ? '（暴击！）' : ''}`);

                if (result.isCrit && result.dotOnCrit) {
                    combat.bossDots = combat.bossDots || [];
                    combat.bossDots.push({ ...result.dotOnCrit, sourcePlayerId: p.char.id });
                    logs.push(`→ ${boss.name} 获得【重伤】，将持续受到 DOT 伤害`);
                }

                if (result.generateFingerOnHit && p.char.classId === 'frost_mage') {
                    p.fingersOfFrost = (p.fingersOfFrost || 0) + 1;
                    logs.push(`【冰川突进】触发：${p.char.name} 获得1层寒冰指，当前${p.fingersOfFrost}层`);
                }

                if (p.char.talents?.[30] === 'demoralizing_shout') {
                    if (!combat.bossDebuffs?.demoralizingShout) {
                        combat.bossDebuffs = combat.bossDebuffs || {};
                        combat.bossDebuffs.demoralizingShout = { damageMult: 0.8 };
                        logs.push(`【挫志怒吼】触发：所有敌人造成的伤害降低20%`);
                    }
                }
            }

            // 对所有小弟造成伤害（检查免疫）
            combat.minions.forEach((m, idx) => {
                if (m.hp <= 0) return;

                // 检查免疫状态
                if (m.immune) {
                    logs.push(`位置${i + 1} ${p.char.name} 的${skillName}被 火炮手${idx + 1}【登上甲板】免疫！`);
                    return;
                }

                m.hp -= damage;
                const minionName = boss.minion?.name || boss.cannoneer?.name || '小弟';
                logs.push(`位置${i + 1} ${p.char.name} 的${skillName}对 ${minionName}${idx + 1} 造成 ${Math.floor(damage)} 伤害${result.isCrit ? '（暴击！）' : ''}`);

                if (result.isCrit && result.dotOnCrit) {
                    m.dots = m.dots || [];
                    m.dots.push({ ...result.dotOnCrit, sourcePlayerId: p.char.id });
                    logs.push(`→ ${minionName}${idx + 1} 获得【重伤】，将持续受到 DOT 伤害`);
                }

                if (result.generateFingerOnHit && p.char.classId === 'frost_mage') {
                    p.fingersOfFrost = (p.fingersOfFrost || 0) + 1;
                    logs.push(`【冰川突进】触发：${p.char.name} 获得1层寒冰指，当前${p.fingersOfFrost}层`);
                }
            });

            // 山丘之王天赋处理
            if (p.char.talents?.[30] === 'mountain_king' && Math.random() < 0.5) {
                const extraResult = skill.calculate(charForCalc);
                const extraDamage = extraResult.aoeDamage * buffDamageDealtMult;

                logs.push(`【山丘之王】触发：雷霆一击再次释放！`);

                if (combat.bossHp > 0) {
                    combat.bossHp -= extraDamage;
                    logs.push(`位置${i + 1} ${p.char.name} 的雷霆一击(山丘之王)对 ${boss.name} 造成 ${Math.floor(extraDamage)} 伤害${extraResult.isCrit ? '（暴击！）' : ''}`);

                    if (extraResult.isCrit && extraResult.dotOnCrit) {
                        combat.bossDots = combat.bossDots || [];
                        combat.bossDots.push({ ...extraResult.dotOnCrit, sourcePlayerId: p.char.id });
                        logs.push(`→ ${boss.name} 获得【重伤】`);
                    }
                }

                combat.minions.forEach((m, idx) => {
                    if (m.hp <= 0) return;
                    if (m.immune) {
                        logs.push(`雷霆一击(山丘之王)被 火炮手${idx + 1}【登上甲板】免疫！`);
                        return;
                    }
                    m.hp -= extraDamage;
                    const minionName = boss.minion?.name || boss.cannoneer?.name || '小弟';
                    logs.push(`位置${i + 1} ${p.char.name} 的雷霆一击(山丘之王)对 ${minionName}${idx + 1} 造成 ${Math.floor(extraDamage)} 伤害${extraResult.isCrit ? '（暴击！）' : ''}`);

                    if (extraResult.isCrit && extraResult.dotOnCrit) {
                        m.dots = m.dots || [];
                        m.dots.push({ ...extraResult.dotOnCrit, sourcePlayerId: p.char.id });
                    }
                });
            }
        }
        // 单体伤害处理
        else if (result.damage) {
            let damage = result.damage;

            // 天赋加成
            if (p.char.talents?.[10] === 'shadow_amp' && result.school === 'shadow') {
                damage *= 1.2;
            }
            if (p.char.talents?.[20] === 'dark_side' && skillId === 'mind_blast') {
                damage *= 1.8;
            }
            damage *= buffDamageDealtMult;

            // 法术易伤
            const isSpellSchool = (result.school === 'holy' || result.school === 'shadow');
            let takenMult = 1;
            if (isSpellSchool) {
                const vuln = combat.bossDebuffs?.spell_vuln;
                if (vuln) takenMult *= (vuln.mult ?? 1);
            }
            damage = Math.floor(damage * takenMult);

            const targetDefense = targetType === 'boss' ? boss.defense : (boss.minion?.defense || boss.cannoneer?.defense || 0);

            // 检查目标是否免疫
            if (targetType === 'minion' && combat.minions[targetIndex]?.immune) {
                logs.push(`位置${i + 1} ${p.char.name} 的${skill.name}被【登上甲板】免疫！`);
            } else {
                const actualDamage = Math.max(1, damage - targetDefense);

                if (targetType === 'boss') {
                    combat.bossHp -= actualDamage;
                } else {
                    combat.minions[targetIndex].hp -= actualDamage;
                }

                const minionName = boss.minion?.name || boss.cannoneer?.name || '小弟';
                logs.push(`位置${i + 1} ${p.char.name} 使用 ${skill.name} 对 ${targetType === 'boss' ? boss.name : minionName} 造成 ${actualDamage} 伤害${result.isCrit ? '（暴击）' : ''}`);

                // 救赎机制
                if (p.char.stats.atonement) {
                    // 检查减疗debuff
                    let healingMult = 1;
                    if (p.debuffs?.mortalStrike) {
                        healingMult = 1 - (p.debuffs.mortalStrike.healingReduction || 0);
                    }
                    const healFromAtonement = Math.floor(actualDamage * p.char.stats.atonement.healingRate * healingMult);
                    const maxHp = p.char.stats.maxHp || 0;
                    const actualHeal = Math.min(healFromAtonement, maxHp - p.currentHp);
                    p.currentHp += actualHeal;

                    let healLog = `因为救赎恢复 ${actualHeal} 点生命`;
                    if (healingMult < 1) {
                        healLog += `（受到致死打击减疗${Math.round((1 - healingMult) * 100)}%）`;
                    }
                    logs.push(healLog);
                }

                // 鞭笞者苏萨斯特效
                if (skillId === 'basic_attack') {
                    const repeatChance = getBasicAttackRepeatChance(p.char);
                    if (repeatChance > 0 && Math.random() < repeatChance) {
                        logs.push(`【鞭笞者苏萨斯】触发：再次发动普通攻击！`);
                        executeBasicAttackDamage(true);
                    }
                }
            }
        }

        // 治疗处理 - 需要考虑减疗debuff
        if (result.healAll) {
            let heal = Math.floor(result.healAll);
            combat.playerStates.forEach(ps => {
                if (ps.currentHp > 0) {
                    // 检查减疗debuff
                    let healingMult = 1;
                    if (ps.debuffs?.mortalStrike) {
                        healingMult = 1 - (ps.debuffs.mortalStrike.healingReduction || 0);
                    }
                    const actualHeal = Math.floor(heal * healingMult);
                    const newHp = Math.min(ps.char.stats.maxHp, ps.currentHp + actualHeal);
                    ps.currentHp = newHp;
                    ps.char.stats.currentHp = newHp;
                }
            });
            logs.push(`位置${i + 1} ${p.char.name} 全队治疗 ${heal}`);
        }

        // 苦修技能处理 - 需要考虑减疗debuff
        if (result.penanceHeal) {
            const frontPlayer = combat.playerStates.find(ps => ps.currentHp > 0);
            if (frontPlayer) {
                const fortuneStacks = p.fortuneMisfortuneStacks || 0;
                let healAmount = result.penanceHeal;

                // 检查减疗debuff
                let healingMult = 1;
                if (frontPlayer.debuffs?.mortalStrike) {
                    healingMult = 1 - (frontPlayer.debuffs.mortalStrike.healingReduction || 0);
                }
                healAmount = Math.floor(healAmount * healingMult);

                const newHp = Math.min(frontPlayer.char.stats.maxHp, frontPlayer.currentHp + healAmount);
                const actualHeal = newHp - frontPlayer.currentHp;
                frontPlayer.currentHp = newHp;

                let healText = `位置${i + 1} ${p.char.name} 苦修治疗 ${frontPlayer.char.name} ${actualHeal}`;
                if (fortuneStacks > 0 && p.char.talents?.[40] === 'fortune_misfortune') {
                    healText += `（祸福相依 ${fortuneStacks} 层加成）`;
                }
                if (healingMult < 1) {
                    healText += `（受到致死打击减疗${Math.round((1 - healingMult) * 100)}%）`;
                }
                logs.push(healText);

                // 终极苦修伤害
                if (result.penanceDamage) {
                    const targetDefense = targetType === 'boss' ? boss.defense : (boss.minion?.defense || boss.cannoneer?.defense || 0);

                    if (targetType === 'minion' && combat.minions[targetIndex]?.immune) {
                        logs.push(`【终极苦修】被【登上甲板】免疫！`);
                    } else {
                        const actualDamage = Math.max(1, Math.floor(result.penanceDamage * buffDamageDealtMult - targetDefense));

                        if (targetType === 'boss') {
                            combat.bossHp -= actualDamage;
                        } else if (targetIndex >= 0) {
                            combat.minions[targetIndex].hp -= actualDamage;
                        } else {
                            combat.bossHp -= actualDamage;
                        }

                        logs.push(`位置${i + 1} ${p.char.name}【终极苦修】造成 ${actualDamage} 伤害`);
                    }
                }

                // 争分夺秒
                if (result.applyHasteBuff) {
                    p.buffs = p.buffs || [];
                    p.buffs.push({
                        type: 'haste',
                        hasteBonus: result.applyHasteBuff.hasteBonus,
                        duration: result.applyHasteBuff.duration
                    });
                    logs.push(`【争分夺秒】触发：${p.char.name} 急速+${result.applyHasteBuff.hasteBonus}%，持续${result.applyHasteBuff.duration}回合`);
                }

                if (result.clearFortuneStacks) {
                    p.fortuneMisfortuneStacks = 0;
                }
            }
        }

        // DOT处理
        if (result.dot) {
            if (result.dot.name === '冰风暴') {
                if (targetType === 'boss') {
                    combat.bossDots = combat.bossDots || [];
                    combat.bossDots.push({ ...result.dot, sourcePlayerId: p.char.id });
                    logs.push(`位置${i + 1} ${p.char.name} 对 ${boss.name} 施放【冰风暴】，持续${result.dot.duration}回合`);
                } else if (targetIndex >= 0 && !combat.minions[targetIndex]?.immune) {
                    combat.minions[targetIndex].dots = combat.minions[targetIndex].dots || [];
                    combat.minions[targetIndex].dots.push({ ...result.dot, sourcePlayerId: p.char.id });
                    logs.push(`位置${i + 1} ${p.char.name} 对 火炮手${targetIndex + 1} 施放冰风暴！`);
                } else if (targetIndex >= 0 && combat.minions[targetIndex]?.immune) {
                    logs.push(`冰风暴被 火炮手${targetIndex + 1}【登上甲板】免疫！`);
                }
            }
        }

        // AOE DOT（寒冰宝珠）
        if (result.aoeDot) {
            if (combat.bossHp > 0) {
                combat.bossDots = combat.bossDots || [];
                combat.bossDots.push({ ...result.aoeDot, sourcePlayerId: p.char.id });
                logs.push(`位置${i + 1} ${p.char.name} 对 ${boss.name} 施放【${result.aoeDot.name}】，持续${result.aoeDot.duration}回合`);
            }
            combat.minions.forEach((m, idx) => {
                if (m.hp <= 0) return;
                if (m.immune) {
                    logs.push(`【${result.aoeDot.name}】被 火炮手${idx + 1}【登上甲板】免疫！`);
                    return;
                }
                m.dots = m.dots || [];
                m.dots.push({ ...result.aoeDot, sourcePlayerId: p.char.id });
                logs.push(`位置${i + 1} ${p.char.name} 对 火炮手${idx + 1} 施放【${result.aoeDot.name}】，持续${result.aoeDot.duration}回合`);
            });
        }

        // buff处理
        if (result.buff) {
            p.buffs = p.buffs || [];
            p.buffs.push({ ...result.buff });

            if (result.buff.damageTakenMult) {
                const damageReduction = Math.round((1 - result.buff.damageTakenMult) * 100);
                let buffText = `位置${i + 1} ${p.char.name} 开启盾墙，受到伤害降低${damageReduction}%（持续${result.buff.duration}回合）`;
                if (result.buff.damageDealtMult && result.buff.damageDealtMult > 1) {
                    const damageIncrease = Math.round((result.buff.damageDealtMult - 1) * 100);
                    buffText += `，造成伤害提高${damageIncrease}%`;
                }
                logs.push(buffText);
            }

            if (result.buff.type === 'icy_veins') {
                logs.push(`位置${i + 1} ${p.char.name} 开启【冰冷血脉】：冰霜伤害+50%，急速+50%，持续${result.buff.duration}回合`);
            }
        }

        // 天赋触发
        if (skillId === 'basic_attack' && p.char.talents?.[10] === 'plain') {
            p.talentBuffs.attackFlat = (p.talentBuffs.attackFlat || 0) + 5;
            logs.push(`【质朴】触发：攻击+5`);
        }

        if ((skillId === 'smite' || skillId === 'mind_blast') && p.char.talents?.[40] === 'fortune_misfortune') {
            p.fortuneMisfortuneStacks = (p.fortuneMisfortuneStacks || 0) + 1;
            logs.push(`【祸福相依】${p.char.name} 层数+1，当前${p.fortuneMisfortuneStacks}层`);
        }

        // 冰霜法师天赋
        if (skillId === 'frostbolt' && result.triggerFrostboltTalents) {
            if (p.char.talents?.[10] === 'lingering_cold') {
                p.talentBuffs = p.talentBuffs || {};
                p.talentBuffs.spellPowerFlat = (p.talentBuffs.spellPowerFlat || 0) + 5;
                logs.push(`【延绵寒冷】触发：${p.char.name} 法术强度+5`);
            }

            if (p.char.talents?.[20] === 'fingers_of_frost' && Math.random() < 0.5) {
                p.fingersOfFrost = (p.fingersOfFrost || 0) + 1;
                logs.push(`【寒冰指】触发：${p.char.name} 获得1层寒冰指，当前${p.fingersOfFrost}层`);
            }

            if (p.char.talents?.[20] === 'cold_wisdom' || p.char.talents?.[30] === 'cold_intuition') {
                const triggerChance = p.char.talents?.[30] === 'cold_intuition' ? 0.4 : 0.25;
                if (Math.random() < triggerChance) {
                    const blizzardSkill = SKILLS['blizzard'];
                    const blizzardResult = blizzardSkill.calculate(charForCalc, combatContext);

                    if (targetType === 'boss') {
                        combat.bossDots = combat.bossDots || [];
                        combat.bossDots.push({ ...blizzardResult.dot, sourcePlayerId: p.char.id });
                        logs.push(`【冰冷智慧】触发：${p.char.name} 额外对 ${boss.name} 施放冰风暴！`);
                    } else if (targetIndex >= 0 && !combat.minions[targetIndex]?.immune) {
                        combat.minions[targetIndex].dots = combat.minions[targetIndex].dots || [];
                        combat.minions[targetIndex].dots.push({ ...blizzardResult.dot, sourcePlayerId: p.char.id });
                        logs.push(`【冰冷智慧】触发：${p.char.name} 额外对 火炮手${targetIndex + 1} 施放冰风暴！`);
                    }
                }
            }
        }

        if (skillId === 'ice_lance' && result.consumeFingersOfFrost) {
            p.fingersOfFrost = Math.max(0, (p.fingersOfFrost || 0) - 1);
            logs.push(`【寒冰指】消耗1层，${p.char.name} 剩余${p.fingersOfFrost}层`);
        }

        // buff duration 减少
        if (p.buffs && p.buffs.length > 0) {
            p.buffs = p.buffs
                .map(b => {
                    if (b.duration !== undefined) {
                        b.duration -= 1;
                    }
                    return b;
                })
                .filter(b => (b.duration ?? 999) > 0);
        }

        // debuff duration 减少（致死打击减疗等）
        if (p.debuffs) {
            Object.keys(p.debuffs).forEach(key => {
                if (p.debuffs[key].duration !== undefined) {
                    p.debuffs[key].duration -= 1;
                    if (p.debuffs[key].duration <= 0) {
                        delete p.debuffs[key];
                        logs.push(`位置${i + 1} ${p.char.name} 的【致死打击】减疗效果消失`);
                    }
                }
            });
        }
    }

    // 羁绊效果
    if (state.rebirthBonds?.includes('baoernai')) {
        const priests = combat.playerStates.filter(p => p.char.classId === 'discipline_priest' && p.currentHp > 0).length;
        const warriors = combat.playerStates.filter(p => p.char.classId === 'protection_warrior' && p.currentHp > 0).length;
        if (warriors === 1 && priests === 2) {
            const warrior = combat.playerStates.find(p => p.char.classId === 'protection_warrior' && p.currentHp > 0);
            if (warrior) {
                const blockValue = (warrior.char.stats.blockValue || 0) + (warrior.talentBuffs?.blockValueFlat || 0);
                const aoeDamage = Math.floor(blockValue * 0.8);
                if (aoeDamage > 0) {
                    combat.bossHp -= aoeDamage;
                    combat.minions.forEach(m => {
                        if (m.hp > 0 && !m.immune) {
                            m.hp -= aoeDamage;
                        }
                    });
                    logs.push(`【包二奶羁绊】防护战士对所有敌人造成 ${aoeDamage} 额外伤害（基于格挡值）`);
                }
            }
        }
    }

    // DOT 结算
    if (combat.bossDots) {
        combat.bossDots = combat.bossDots.filter(dot => {
            const dmg = Math.max(1, Math.floor(dot.damagePerTurn));
            combat.bossHp -= dmg;

            const dotName = dot.name || '重伤';
            logs.push(`【${dotName}】对 ${boss.name} 造成 ${dmg} DOT 伤害（剩余${dot.duration - 1}回合）`);

            if (dot.sourcePlayerId) {
                const sourcePlayer = combat.playerStates.find(p => p.char.id === dot.sourcePlayerId);
                if (sourcePlayer && sourcePlayer.char.talents?.[30] === 'brutal_momentum' && sourcePlayer.currentHp > 0) {
                    const healAmount = Math.floor(dmg * 1.5);
                    const maxHp = sourcePlayer.char.stats.maxHp || 0;
                    const actualHeal = Math.min(healAmount, maxHp - sourcePlayer.currentHp);
                    if (actualHeal > 0) {
                        sourcePlayer.currentHp += actualHeal;
                        logs.push(`【残暴动力】触发：${sourcePlayer.char.name} 治疗 ${actualHeal} 点生命`);
                    }
                }

                if (dot.canGenerateFinger && sourcePlayer && sourcePlayer.char.talents?.[30] === 'orb_mastery') {
                    if (Math.random() < 0.25) {
                        sourcePlayer.fingersOfFrost = (sourcePlayer.fingersOfFrost || 0) + 1;
                        logs.push(`【宝珠精通】触发：${sourcePlayer.char.name} 获得1层寒冰指，当前${sourcePlayer.fingersOfFrost}层`);
                    }
                }
            }

            dot.duration -= 1;
            return dot.duration > 0;
        });
    }

    // 小弟DOT结算
    combat.minions = combat.minions.map((m, idx) => {
        if (m.hp <= 0) return m;
        if (m.dots && m.dots.length > 0) {
            m.dots = m.dots.filter(dot => {
                // 免疫状态下DOT不造成伤害
                if (m.immune) {
                    dot.duration -= 1;
                    return dot.duration > 0;
                }

                const dmg = Math.max(1, Math.floor(dot.damagePerTurn));
                m.hp -= dmg;

                const dotName = dot.name || '重伤';
                const minionName = boss.minion?.name || boss.cannoneer?.name || '小弟';
                logs.push(`【${dotName}】对 ${minionName}${idx + 1} 造成 ${dmg} DOT 伤害（剩余${dot.duration - 1}回合）`);

                if (dot.sourcePlayerId) {
                    const sourcePlayer = combat.playerStates.find(p => p.char.id === dot.sourcePlayerId);
                    if (sourcePlayer && sourcePlayer.char.talents?.[30] === 'brutal_momentum' && sourcePlayer.currentHp > 0) {
                        const healAmount = Math.floor(dmg * 1.5);
                        const maxHp = sourcePlayer.char.stats.maxHp || 0;
                        const actualHeal = Math.min(healAmount, maxHp - sourcePlayer.currentHp);
                        if (actualHeal > 0) {
                            sourcePlayer.currentHp += actualHeal;
                            logs.push(`【残暴动力】触发：${sourcePlayer.char.name} 治疗 ${actualHeal} 点生命`);
                        }
                    }

                    if (dot.canGenerateFinger && sourcePlayer && sourcePlayer.char.talents?.[30] === 'orb_mastery') {
                        if (Math.random() < 0.25) {
                            sourcePlayer.fingersOfFrost = (sourcePlayer.fingersOfFrost || 0) + 1;
                            logs.push(`【宝珠精通】触发：${sourcePlayer.char.name} 获得1层寒冰指，当前${sourcePlayer.fingersOfFrost}层`);
                        }
                    }
                }

                dot.duration -= 1;
                return dot.duration > 0;
            });
        }
        return m;
    });

    // ==================== Boss阶段 ====================
    const pickAlivePlayerIndex = () => {
        for (let idx = 0; idx < combat.playerStates.length; idx++) {
            const p = combat.playerStates[idx];
            if ((p.currentHp ?? 0) > 0) return idx;
        }
        return -1;
    };

    const getBuffBlockRate = (playerState) => {
        const buffs = Array.isArray(playerState?.buffs) ? playerState.buffs : [];
        return buffs.reduce((sum, b) => sum + (b?.blockRate || 0), 0);
    };

    const calcMitigatedAndBlockedDamage = (playerState, rawDamage, isHeavy = false) => {
        const armor = playerState?.char?.stats?.armor || 0;
        const dr = getArmorDamageReduction(armor);
        let dmg = applyPhysicalMitigation(rawDamage, armor);

        const baseBlockRate = playerState?.char?.stats?.blockRate || 0;
        const buffBlockRate = getBuffBlockRate(playerState);
        const blockChance = Math.max(0, Math.min(0.95, (baseBlockRate + buffBlockRate) / 100));

        let blockedAmount = 0;
        if (Math.random() < blockChance) {
            const blockValue = Math.floor(
                (playerState?.char?.stats?.blockValue || 0) + (playerState?.talentBuffs?.blockValueFlat || 0)
            );
            blockedAmount = Math.min(Math.max(0, dmg - 1), Math.max(0, blockValue));
            dmg = Math.max(1, dmg - blockedAmount);
        }

        const takenMult = playerState?.char?.stats?.damageTakenMult ?? 1;
        let buffTakenMult = 1;
        if (playerState.buffs) {
            playerState.buffs.forEach(b => {
                if (b.damageTakenMult) {
                    buffTakenMult *= b.damageTakenMult;
                }
            });
            playerState.buffs = playerState.buffs.filter(b => (b.duration ?? 999) > 0);
        }

        const finalTakenMult = takenMult * buffTakenMult;
        const demoralizingShoutMult = combat.bossDebuffs?.demoralizingShout?.damageMult ?? 1;
        dmg = Math.max(1, Math.floor(dmg * finalTakenMult * demoralizingShoutMult));

        return { damage: dmg, dr, blockedAmount, isHeavy };
    };

    // Boss 行动
    const bossAction = boss.cycle[(combat.round - 1) % boss.cycle.length];

    // ==================== 范克里夫特殊技能处理 ====================
    if (combat.bossId === 'vancleef') {
        // 致死打击
        if (bossAction === 'mortal_strike') {
            const tIdx = pickAlivePlayerIndex();
            if (tIdx >= 0) {
                const target = combat.playerStates[tIdx];
                const raw = Math.floor((boss.attack || 0) * (boss.mortalStrikeMultiplier || 3));
                const { damage, dr, blockedAmount } = calcMitigatedAndBlockedDamage(target, raw, true);

                target.currentHp -= damage;

                // 施加减疗debuff
                target.debuffs = target.debuffs || {};
                target.debuffs.mortalStrike = {
                    healingReduction: boss.mortalStrikeDebuff.healingReduction,
                    duration: boss.mortalStrikeDebuff.duration
                };

                const drPct = Math.round(dr * 100);
                const blockText = blockedAmount > 0 ? `，格挡 ${blockedAmount}` : '';
                logs.push(`【${boss.name}】使用【致死打击】对 位置${tIdx + 1} 造成 ${damage} 伤害（护甲减伤${drPct}%${blockText}）`);
                logs.push(`→ 位置${tIdx + 1} 受到【致死打击】：受到治疗效果降低50%，持续2回合`);
            }
        }
        // 火炮手准备
        else if (bossAction === 'summon_cannoneers') {
            const aliveMinions = (combat.minions || []).filter(m => (m.hp ?? 0) > 0);
            const need = Math.max(0, (boss.summonCount || 3) - aliveMinions.length);

            for (let i = 0; i < need; i++) {
                combat.minions.push({
                    hp: boss.minion.maxHp,
                    maxHp: boss.minion.maxHp,
                    attack: boss.minion.attack,
                    defense: boss.minion.defense,
                    isCannoneer: true,
                    immune: false,
                    dots: []
                });
            }

            if (need > 0) {
                logs.push(`【${boss.name}】大喊："火炮手准备！" 召唤了 ${need} 个${boss.minion.name}`);
            } else {
                logs.push(`【${boss.name}】尝试召唤火炮手，但场上火炮手已满`);
            }
        }
        // 登上甲板
        else if (bossAction === 'board_the_deck') {
            const aliveMinions = combat.minions.filter(m => m.hp > 0 && m.isCannoneer);
            if (aliveMinions.length > 0) {
                combat.minions.forEach(m => {
                    if (m.hp > 0 && m.isCannoneer) {
                        m.immune = true;
                    }
                });
                logs.push(`【${boss.name}】大喊："登上甲板！" 所有火炮手获得免疫伤害效果！`);
            } else {
                logs.push(`【${boss.name}】尝试命令火炮手登上甲板，但场上没有火炮手`);
            }
        }
    }
    // ==================== 霍格技能处理（保持原有逻辑） ====================
    else if (combat.bossId === 'hogger') {
        if (bossAction === 'summon') {
            const aliveMinions = (combat.minions || []).filter(m => (m.hp ?? 0) > 0);
            const need = Math.max(0, (boss.summonCount || 0) - aliveMinions.length);

            for (let i = 0; i < need; i++) {
                combat.minions.push({
                    hp: boss.minion.maxHp,
                    maxHp: boss.minion.maxHp,
                    attack: boss.minion.attack,
                    defense: boss.minion.defense,
                });
            }

            if (need > 0) {
                logs.push(`【${boss.name}】使用【召唤】呼叫了 ${need} 个${boss.minion.name}`);
            } else {
                logs.push(`【${boss.name}】尝试召唤，但场上小弟已满`);
            }
        }

        if (bossAction === 'strike') {
            const tIdx = pickAlivePlayerIndex();
            if (tIdx >= 0) {
                const target = combat.playerStates[tIdx];
                const raw = Math.floor((boss.attack || 0) * (boss.heavyMultiplier || 1));
                const { damage, dr, blockedAmount } = calcMitigatedAndBlockedDamage(target, raw, true);

                target.currentHp -= damage;

                const drPct = Math.round(dr * 100);
                const blockText = blockedAmount > 0 ? `，格挡 ${blockedAmount}` : '';
                logs.push(`【${boss.name}】使用【重击】对 位置${tIdx + 1} 造成 ${damage} 伤害（护甲减伤${drPct}%${blockText}）`);
            }
        }
    }

    // ==================== 小弟行动 ====================
    for (let i = 0; i < (combat.minions || []).length; i++) {
        const m = combat.minions[i];
        if ((m.hp ?? 0) <= 0) continue;

        // 范克里夫的火炮手：对全队造成AOE伤害
        if (combat.bossId === 'vancleef' && m.isCannoneer) {
            const aoeDamage = Math.floor((boss.attack || 0) * (boss.minion.aoeDamageMultiplier || 0.5));

            combat.playerStates.forEach((ps, pIdx) => {
                if (ps.currentHp <= 0) return;

                const armor = ps.char?.stats?.armor || 0;
                const dr = getArmorDamageReduction(armor);
                let dmg = applyPhysicalMitigation(aoeDamage, armor);

                // 受伤乘区
                const takenMult = ps.char?.stats?.damageTakenMult ?? 1;
                let buffTakenMult = 1;
                if (ps.buffs) {
                    ps.buffs.forEach(b => {
                        if (b.damageTakenMult) {
                            buffTakenMult *= b.damageTakenMult;
                        }
                    });
                }
                const demoralizingShoutMult = combat.bossDebuffs?.demoralizingShout?.damageMult ?? 1;
                dmg = Math.max(1, Math.floor(dmg * takenMult * buffTakenMult * demoralizingShoutMult));

                ps.currentHp -= dmg;
            });

            logs.push(`【${boss.minion.name}${i + 1}】炮击全队，每人受到 ${aoeDamage} 点伤害（护甲减伤后）`);
        }
        // 霍格的小弟：普通攻击
        else {
            const tIdx = pickAlivePlayerIndex();
            if (tIdx < 0) break;

            const target = combat.playerStates[tIdx];
            const raw = Math.floor(m.attack || 0);
            const { damage, dr, blockedAmount } = calcMitigatedAndBlockedDamage(target, raw, false);

            target.currentHp -= damage;

            const drPct = Math.round(dr * 100);
            const blockText = blockedAmount > 0 ? `，格挡 ${blockedAmount}` : '';
            const minionName = boss.minion?.name || '小弟';
            logs.push(`【${minionName}】攻击 位置${tIdx + 1} 造成 ${damage} 伤害（护甲减伤${drPct}%${blockText}）`);
        }
    }

    // 清理死亡小弟
    combat.minions = (combat.minions || []).filter(m => (m.hp ?? 0) > 0);

    // ==================== 胜负判定 ====================
    const allPlayersDead = combat.playerStates.every(p => p.currentHp <= 0);
    const bossDead = combat.bossHp <= 0;

    if (bossDead || allPlayersDead) {
        let newState = {
            ...state,
            bossCombat: null
        };

        if (bossDead) {
            logs.push('★★★ 胜利！获得奖励 ★★★');

            if (!newState.defeatedBosses) newState.defeatedBosses = [];
            if (!newState.defeatedBosses.includes(combat.bossId)) {
                newState.defeatedBosses = [...newState.defeatedBosses, combat.bossId];
            }

            const alreadyDefeated = (state.defeatedBosses || []).includes('hogger');
            if (bossDead && combat.bossId === 'hogger' && !alreadyDefeated) {
                newState.showHoggerPlot = true;
            }

            newState.resources = {
                ...newState.resources,
                gold: newState.resources.gold + boss.rewards.gold
            };

            newState.characters = newState.characters.map(char => {
                const p = combat.playerStates.find(ps => ps.char.id === char.id);
                if (!p) return char;

                let gainedExp = boss.rewards.exp * (1 + (char.stats.expBonus || 0));
                let newChar = { ...char, exp: char.exp + gainedExp };

                while (newChar.exp >= newChar.expToNext && newChar.level < 200) {
                    newChar.level += 1;
                    newChar.exp -= newChar.expToNext;
                    newChar.expToNext = Math.floor(100 * Math.pow(1.2, newChar.level - 1));
                    newChar.skills = learnNewSkills(newChar);
                }

                newChar.stats = calculateTotalStats(newChar, undefined, state);
                return newChar;
            });

            boss.rewards.items.forEach(itemTpl => {
                const dropId = (typeof itemTpl === 'string') ? itemTpl : itemTpl?.id;
                if (!dropId) return;

                if (FIXED_EQUIPMENTS?.[dropId]) {
                    const inst = createEquipmentInstance(dropId);
                    newState.inventory.push(inst);
                    newState = addEquipmentIdToCodex(newState, dropId);
                    return;
                }

                const tpl = ITEMS?.[dropId];
                if (tpl) {
                    newState.inventory.push({
                        ...tpl,
                        instanceId: `inv_${Date.now()}_${Math.random()}`,
                        id: tpl.id,
                    });
                    newState = addJunkIdToCodex(newState, dropId);
                    return;
                }

                newState.inventory.push({
                    instanceId: `boss_${Date.now()}_${Math.random()}`,
                    id: dropId,
                    name: dropId,
                    type: 'junk',
                });
            });

        } else {
            logs.push('××× 失败，全队阵亡 ×××');
        }

        const bossLogEntry = {
            id: `bosslog_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            characterName: '队伍',
            zoneName: '世界首领',
            enemyName: boss.name,
            result: bossDead ? 'victory' : 'defeat',
            logs: logs,
            rewards: bossDead
                ? { gold: boss.rewards.gold, exp: boss.rewards.exp }
                : { gold: 0, exp: 0 },
        };

        newState.combatLogs = [bossLogEntry, ...(newState.combatLogs || [])].slice(0, 50);

        return newState;
    }

    // 继续战斗
    combat.logs = logs.slice(-50);

    const syncedCharacters = (state.characters || []).map(c => {
        const ps = combat.playerStates?.find(p => p.char?.id === c.id);
        if (!ps) return c;

        const maxHp = c.stats?.maxHp ?? ps.char?.stats?.maxHp ?? 0;
        const nextHp = Math.min(maxHp, Math.max(0, Math.floor(ps.currentHp ?? 0)));

        return {
            ...c,
            stats: { ...c.stats, currentHp: nextHp }
        };
    });

    return { ...state, characters: syncedCharacters, bossCombat: combat };
}


// ==================== INITIAL STATE ====================
const initialState = {
    currentMenu: 'map',
    frame: 0,      // 总帧
    lifeFrame: 0,  // 本世帧
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
    prepareBoss: null, // 当前准备挑战的bossId
    bossTeam: [null, null, null], // 3个位置的charId
    bossStrategy: { priorityBoss: true, stance: 'dispersed' }, // 策略
    bossCombat: null, // 正在进行的boss战状态

    showHoggerPlot: false,
    showRebirthConfirm: false,
    showRebirthPlot: null,
    rebirthCount: 0,
    rebirthUnlocked: false,
    rebirthBonuses: {
        exp: 0,
        gold: 0,
        drop: 0,
        researchSpeed: 0
    },
    rebirthBonds: [],
    defeatedBosses: [] // 本世击杀的Boss列表
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
                    const achDropBonus = getAchievementDropBonus(state);
                    dropTable.equipment.filter(drop => allowDrop(drop.id)).forEach(drop => {
                        const base = (drop.chance ?? 0);
                        const effective = Math.min(1, base * (1 + achDropBonus));
                        if (Math.random() < effective) {
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

    // 保留 8 个槽位顺序：空/无效 => rest
    const slots8 = Array.from({ length: 8 }, (_, i) => (skillSlots?.[i] ?? ''));

    const validSkills = slots8.map(sid => (sid && SKILLS[sid]) ? sid : 'rest');

    // 保险：如果 rest 不存在，至少不会崩（可选）
    for (let i = 0; i < validSkills.length; i++) {
        if (!SKILLS[validSkills[i]]) validSkills[i] = 'basic_attack';
    }

    return {
        enemy: { ...enemy },
        enemyHp: enemy.hp,
        round: 0,
        skillIndex: 0,
        buffs,
        enemyDebuffs: [], // 怪物身上的 debuff
        validSkills,
        talentBuffs: { attackFlat: 0, blockValueFlat: 0, spellPowerFlat: 0 },
        fortuneMisfortuneStacks: 0, // 祸福相依层数
        fingersOfFrost: 0,          // 寒冰指层数
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
    // enemy debuffs
    let enemyDebuffs = Array.isArray(combatState.enemyDebuffs) ? [...combatState.enemyDebuffs] : [];

    // 天赋叠层（仅本场战斗有效）
    let talentBuffs = combatState.talentBuffs
        ? { ...combatState.talentBuffs }
        : { attackFlat: 0, blockValueFlat: 0, spellPowerFlat: 0 };

    // 祸福相依层数
    let fortuneMisfortuneStacks = combatState.fortuneMisfortuneStacks || 0;
    // 寒冰指层数
    let fingersOfFrost = combatState.fingersOfFrost || 0;

    const validSkills = Array.isArray(combatState.validSkills) && combatState.validSkills.length > 0
        ? combatState.validSkills
        : (() => {
            const slots8 = Array.from({ length: 8 }, (_, i) => (character.skillSlots?.[i] ?? ''));
            const v = slots8.map(sid => (sid && SKILLS[sid]) ? sid : 'rest');

            for (let i = 0; i < v.length; i++) {
                if (!SKILLS[v[i]]) v[i] = 'basic_attack';
            }
            return v;
        })();

    const getBuffBlockRate = () =>
        buffs.reduce((sum, b) => sum + (b.blockRate || 0), 0);

    const tickBuffs = () => {
        buffs = buffs
            .map(b => ({ ...b, duration: (b.duration ?? 0) - 1 }))
            .filter(b => (b.duration ?? 0) > 0);
    };
    const tickEnemyDebuffs = () => {
        enemyDebuffs = enemyDebuffs
            .map(d => ({ ...d, duration: (d.duration ?? 0) - 1 }))
            .filter(d => (d.duration ?? 0) > 0);
    };

    const maxRounds = 200;

    for (let i = 0; i < roundsPerTick; i++) {
        if (charHp <= 0 || enemyHp <= 0 || round >= maxRounds) break;

        round++;

        // ===== 角色回合 =====
        const slotIndex = skillIndex % validSkills.length;
        const currentSkillId = validSkills[skillIndex % validSkills.length];
        const skill = SKILLS[currentSkillId];
        // 饰品/装备特效：技能栏强化（例如：第1格与第4格）
        const slotBuff = getSkillSlotBuffBonus(character, slotIndex);
        const charForCalc = {
            ...character,
            stats: {
                ...character.stats,
                attack: (character.stats.attack || 0) + (talentBuffs.attackFlat || 0) + (slotBuff.attackBonus || 0),
                blockValue: (character.stats.blockValue || 0) + (talentBuffs.blockValueFlat || 0),
                spellPower: (character.stats.spellPower || 0) + (talentBuffs.spellPowerFlat || 0) + (slotBuff.spellPowerBonus || 0),
            }
        };


        // 冰冷血脉是否开启（buff 内含 icyVeinsBuff）
        const icyVeinsBuff = buffs.some(b => b.type === 'icy_veins');
        // 冰风暴DOT期间 -> 冰枪必爆
        const blizzardActive = enemyDebuffs.some(d =>
            d.type === 'dot' &&
            d.name === '冰风暴' &&
            d.enableIceLanceCrit === true
        );

        // 传入combatContext给技能计算（用于祸福相依等）
        const combatContext = {
            fortuneMisfortuneStacks,
            fingersOfFrost,
            icyVeinsBuff,
            blizzardActive
        };

        const result = skill.calculate(charForCalc, combatContext);

        // ===== 新增：雷霆一击（单体高伤 + 暴击时施加重伤DOT）=====
        if (result.aoeDamage) {
            let damage = result.aoeDamage;

            // 40级天赋：无坚不摧之力 - 盾墙期间伤害提高50%
            let buffDamageDealtMult = 1;
            buffs.forEach(b => {
                if (b.damageDealtMult) {
                    buffDamageDealtMult *= b.damageDealtMult;
                }
            });
            damage *= buffDamageDealtMult;

            // 全能等通用乘区已在上层calculate中处理，这里直接扣防御
            const actualDamage = Math.max(1, Math.floor(damage - (combatState.enemy?.defense ?? 0)));
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

            // 暴击时施加重伤DOT（与现有DOT结构兼容）
            if (result.isCrit && result.dotOnCrit) {
                enemyDebuffs.push({
                    type: 'dot',
                    sourceSkillId: currentSkillId,
                    sourceSkillName: skill.name,
                    damagePerTurn: result.dotOnCrit.damagePerTurn,
                    duration: result.dotOnCrit.duration
                });

                logs.push({
                    round,
                    actor: character.name,
                    action: `${skill.name}(重伤)`,
                    target: combatState.enemy?.name,
                    value: result.dotOnCrit.damagePerTurn,
                    type: 'debuff',
                    text: `【重伤】施加：每回合 ${result.dotOnCrit.damagePerTurn} 伤害，持续 ${result.dotOnCrit.duration} 回合`
                });
            }

            // 30级天赋：挫志怒吼 - 雷霆一击施加debuff，敌人造成的伤害降低20%
            if (character.talents?.[30] === 'demoralizing_shout') {
                const existingShout = enemyDebuffs.find(d => d.type === 'demoralizing_shout');
                if (!existingShout) {
                    enemyDebuffs.push({
                        type: 'demoralizing_shout',
                        damageMult: 0.8,  // 造成伤害降低20%
                        duration: 999     // 持续整场战斗
                    });
                    logs.push({
                        round,
                        kind: 'proc',
                        actor: character.name,
                        proc: '挫志怒吼',
                        text: '【挫志怒吼】触发：敌人造成的伤害降低20%'
                    });
                }
            }

            // 30级天赋：山丘之王 - 雷霆一击有50%几率再次释放一次
            if (character.talents?.[30] === 'mountain_king' && Math.random() < 0.5) {
                const extraResult = skill.calculate(charForCalc);
                const extraDamage = Math.max(1, Math.floor(extraResult.aoeDamage - (combatState.enemy?.defense ?? 0)));
                enemyHp -= extraDamage;

                logs.push({
                    round,
                    kind: 'proc',
                    actor: character.name,
                    proc: '山丘之王',
                    text: `【山丘之王】触发：雷霆一击再次释放！`
                });
                logs.push({
                    round,
                    actor: character.name,
                    action: `${skill.name}(山丘之王)`,
                    target: combatState.enemy?.name,
                    value: extraDamage,
                    type: 'damage',
                    isCrit: extraResult.isCrit
                });

                // 额外的雷霆一击也能触发暴击重伤
                if (extraResult.isCrit && extraResult.dotOnCrit) {
                    enemyDebuffs.push({
                        type: 'dot',
                        sourceSkillId: currentSkillId,
                        sourceSkillName: skill.name,
                        damagePerTurn: extraResult.dotOnCrit.damagePerTurn,
                        duration: extraResult.dotOnCrit.duration
                    });

                    logs.push({
                        round,
                        actor: character.name,
                        action: `${skill.name}(山丘之王-重伤)`,
                        target: combatState.enemy?.name,
                        value: extraResult.dotOnCrit.damagePerTurn,
                        type: 'debuff',
                        text: `【重伤】施加：每回合 ${extraResult.dotOnCrit.damagePerTurn} 伤害，持续 ${extraResult.dotOnCrit.duration} 回合`
                    });
                }
            }
        }else if (result.aoeDot) {
            // 把 aoeDot 当作单体 dot 挂到 enemyDebuffs
            enemyDebuffs.push({
                type: 'dot',
                sourceSkillId: currentSkillId,
                sourceSkillName: result.aoeDot.name || skill.name,
                ...result.aoeDot, // school, damagePerTurn, duration, canGenerateFinger, name 等
            });

            logs.push({
                round,
                actor: character.name,
                action: skill.name,
                target: combatState.enemy?.name,
                type: 'debuff',
                text: `施放【${result.aoeDot.name || skill.name}】：每回合 ${result.aoeDot.damagePerTurn}，持续 ${result.aoeDot.duration} 回合`
            });
        }

        // ===== 原有普通伤害逻辑（保持不变）=====
        else if (result.damage) {
            let damage = result.damage;

            // ===== 10级天赋：暗影增幅（暗影伤害 +20%）=====
            if (character.talents?.[10] === 'shadow_amp' && result.school === 'shadow') {
                damage *= 1.2;
            }

            // ===== 20级天赋：阴暗面之力（心灵震爆伤害 +80%）=====
            if (character.talents?.[20] === 'dark_side' && currentSkillId === 'mind_blast') {
                damage *= 1.8;
            }

            // 40级天赋：无坚不摧之力 - 盾墙期间伤害提高50%
            let buffDamageDealtMultForDamage = 1;
            buffs.forEach(b => {
                if (b.damageDealtMult) {
                    buffDamageDealtMultForDamage *= b.damageDealtMult;
                }
            });
            damage *= buffDamageDealtMultForDamage;

            // ===== 10级天赋：神圣增幅（惩击：目标受法术伤害 +10% 持续2回合）=====
            if (character.talents?.[10] === 'holy_vuln' && currentSkillId === 'smite') {
                enemyDebuffs.push({ type: 'spell_vuln', mult: 1.10, duration: 2 });
                logs.push({
                    round,
                    kind: 'proc',
                    actor: character.name,
                    proc: '神圣增幅',
                    text: '【神圣增幅】触发：目标受到的法术伤害 +10%（2回合）'
                });
            }

            const isSpellSchool = (result.school === 'holy' || result.school === 'shadow');
            let takenMult = 1;
            if (isSpellSchool) {
                const vuln = enemyDebuffs.find(d => d.type === 'spell_vuln');
                if (vuln) takenMult *= (vuln.mult ?? 1);
            }

            damage = Math.floor(damage * takenMult);
            const actualDamage = Math.max(1, damage - (combatState.enemy?.defense ?? 0));
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

            if (character.stats.atonement) {
                const healFromAtonement = Math.floor(actualDamage * character.stats.atonement.healingRate);
                const maxHp = character.stats.maxHp ?? character.stats.hp ?? 0;
                const actualHeal = Math.min(healFromAtonement, maxHp - charHp);
                charHp += actualHeal;
                logs.push({
                    round,
                    actor: character.name,
                    action: `救赎`,
                    target: character.name,
                    value: actualHeal,
                    type: 'heal',
                    text: `因为救赎恢复 ${healFromAtonement} 点生命`
                });
            }

            // ==================== 新增：鞭笞者苏萨斯特效 - 普攻后50%概率再次普攻 ====================
            if (currentSkillId === 'basic_attack') {
                const repeatChance = getBasicAttackRepeatChance(character);
                if (repeatChance > 0 && Math.random() < repeatChance) {
                    logs.push({
                        round,
                        kind: 'proc',
                        actor: character.name,
                        proc: '鞭笞者苏萨斯',
                        text: '【鞭笞者苏萨斯】触发：再次发动普通攻击！'
                    });
                    // ===== 天赋触发（保持不变）=====
                    if (currentSkillId === 'basic_attack' && character.talents?.[10] === 'plain') {
                        talentBuffs.attackFlat = (talentBuffs.attackFlat || 0) + 5;
                        logs.push({
                            round,
                            kind: 'proc',
                            actor: character.name,
                            proc: '质朴',
                            value: 5,
                            text: '【质朴】触发，攻击强度 +5（本场战斗）'
                        });
                    }
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
                }
            }
        }
        // ===== 原有其他技能逻辑（保持不变）=====
        else if (result.heal) {
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
        }
        else if (result.buff) {
            buffs.push({ ...result.buff });
            let buffText = '';
            if (result.buff.damageTakenMult) {
                const damageReduction = Math.round((1 - result.buff.damageTakenMult) * 100);
                buffText = `开启盾墙：受到伤害降低${damageReduction}%`;
                if (result.buff.damageDealtMult && result.buff.damageDealtMult > 1) {
                    const damageIncrease = Math.round((result.buff.damageDealtMult - 1) * 100);
                    buffText += `，造成伤害提高${damageIncrease}%`;
                }
            }
            logs.push({
                round,
                actor: character.name,
                action: skill.name,
                target: character.name,
                value: result.buff.duration ?? 0,
                type: 'buff',
                text: buffText
            });
        }
        else if (result.dot) {
            enemyDebuffs.push({
                type: 'dot',
                sourceSkillId: currentSkillId,
                sourceSkillName: skill.name,
                ...result.dot
            });

            logs.push({
                round,
                actor: character.name,
                action: `${skill.name}(施加)`,
                target: combatState.enemy?.name,
                value: result.dot.damagePerTurn,
                type: 'debuff',
                text: `施加持续伤害：每回合 ${result.dot.damagePerTurn}，持续 ${result.dot.duration} 回合`
            });
        }
        else if (result.healAll) {
            const maxHp = character.stats.maxHp ?? character.stats.hp ?? 0;
            const actualHeal = Math.min(result.healAll, maxHp - charHp);
            charHp += actualHeal;
            logs.push({
                round,
                actor: character.name,
                action: skill.name,
                target: character.name,
                value: actualHeal,
                type: 'heal'
            });
        }
        // ===== 苦修技能处理 =====
        else if (result.penanceHeal) {
            // 苦修治疗自己（普通战斗中只有一个角色，所以治疗自己）
            const maxHp = character.stats.maxHp ?? character.stats.hp ?? 0;
            const actualHeal = Math.min(result.penanceHeal, maxHp - charHp);
            charHp += actualHeal;

            let healText = `苦修治疗 ${actualHeal}`;
            if (fortuneMisfortuneStacks > 0 && character.talents?.[40] === 'fortune_misfortune') {
                healText += `（祸福相依 ${fortuneMisfortuneStacks} 层加成）`;
            }

            logs.push({
                round,
                actor: character.name,
                action: skill.name,
                target: character.name,
                value: actualHeal,
                type: 'heal',
                text: healText
            });

            // 40级天赋：终极苦修 - 造成伤害
            if (result.penanceDamage) {
                const actualDamage = Math.max(1, result.penanceDamage - (combatState.enemy?.defense ?? 0));
                enemyHp -= actualDamage;
                logs.push({
                    round,
                    actor: character.name,
                    action: `${skill.name}(终极苦修)`,
                    target: combatState.enemy?.name,
                    value: actualDamage,
                    type: 'damage',
                    text: '【终极苦修】造成伤害'
                });
            }

            // 40级天赋：争分夺秒 - 急速buff
            if (result.applyHasteBuff) {
                buffs.push({
                    type: 'haste',
                    hasteBonus: result.applyHasteBuff.hasteBonus,
                    duration: result.applyHasteBuff.duration
                });
                logs.push({
                    round,
                    kind: 'proc',
                    actor: character.name,
                    proc: '争分夺秒',
                    text: `【争分夺秒】触发：急速+${result.applyHasteBuff.hasteBonus}%，持续${result.applyHasteBuff.duration}回合`
                });
            }

            // 清空祸福相依层数
            if (result.clearFortuneStacks) {
                fortuneMisfortuneStacks = 0;
            }
        }

        if (result.applyAtonement) {
            const actualHeal = 0.2;
            const atonementDuration = result.applyAtonement.duration || 2;
            character.stats.atonement = {
                healingRate: actualHeal,
                duration: atonementDuration
            };
            logs.push({
                round,
                actor: character.name,
                action: skill.name,
                target: character.name,
                value: `救赎生效，持续 ${atonementDuration} 回合，治疗量：${actualHeal}倍伤害`,
                type: 'buff'
            });
        }

        // ===== 天赋触发（保持不变）=====
        if (currentSkillId === 'basic_attack' && character.talents?.[10] === 'plain') {
            talentBuffs.attackFlat = (talentBuffs.attackFlat || 0) + 5;
            logs.push({
                round,
                kind: 'proc',
                actor: character.name,
                proc: '质朴',
                value: 5,
                text: '【质朴】触发，攻击强度 +5（本场战斗）'
            });
        }

        if (currentSkillId === 'smite' && character.talents?.[10] === 'holy_infusion') {
            talentBuffs.spellPowerFlat = (talentBuffs.spellPowerFlat || 0) + 2;
            logs.push({
                round,
                kind: 'proc',
                actor: character.name,
                proc: '神圣灌注',
                value: 2,
                text: '【神圣灌注】触发，法术强度 +2（本场战斗）'
            });
        }

        // 40级天赋：祸福相依 - 惩击和心灵震爆累积层数
        if ((currentSkillId === 'smite' || currentSkillId === 'mind_blast') && character.talents?.[40] === 'fortune_misfortune') {
            fortuneMisfortuneStacks += 1;
            logs.push({
                round,
                kind: 'proc',
                actor: character.name,
                proc: '祸福相依',
                value: fortuneMisfortuneStacks,
                text: `【祸福相依】层数+1，当前${fortuneMisfortuneStacks}层（苦修治疗量+${fortuneMisfortuneStacks * 25}%）`
            });
        }

        // ✅ 冰枪消耗寒冰指
        if (result.consumeFingersOfFrost) {
            fingersOfFrost = Math.max(0, fingersOfFrost - 1);
            logs.push({
                round,
                kind: 'proc',
                actor: character.name,
                proc: '寒冰指',
                value: fingersOfFrost,
                text: `消耗 1 层寒冰指（剩余 ${fingersOfFrost} 层）`
            });
        }

        skillIndex++;

        if (enemyHp <= 0) break;

        // ===== DOT 结算（保持原有逻辑，重伤DOT会自动参与）=====
        const dots = enemyDebuffs.filter(d => d.type === 'dot');
        if (dots.length > 0) {
            for (const d of dots) {
                let dotDamage = d.damagePerTurn ?? 0;

                if (character.talents?.[10] === 'shadow_amp' && d.school === 'shadow') {
                    dotDamage *= 1.2;
                }

                const isSpellSchool = (d.school === 'holy' || d.school === 'shadow');
                if (isSpellSchool) {
                    const vuln = enemyDebuffs.find(x => x.type === 'spell_vuln');
                    if (vuln?.mult) dotDamage *= vuln.mult;
                }

                // 急速：DOT 伤害提高（急速 * 2%）
                dotDamage *= (1 + ((character.stats.haste || 0) * 0.02));
                dotDamage = Math.floor(dotDamage);
                const actualDot = Math.max(1, dotDamage - (combatState.enemy?.defense ?? 0));
                enemyHp -= actualDot;

                logs.push({
                    round,
                    actor: character.name,
                    action: `${d.sourceSkillName || '持续伤害'}(持续)`,
                    target: combatState.enemy?.name,
                    value: actualDot,
                    type: 'damage'
                });

                // 30级天赋：残暴动力 - 重伤伤害的150%治疗自己
                if (character.talents?.[30] === 'brutal_momentum' && d.sourceSkillName === '雷霆一击') {
                    const healAmount = Math.floor(actualDot * 1.5);
                    const maxHp = character.stats.maxHp ?? character.stats.hp ?? 0;
                    const actualHeal = Math.min(healAmount, maxHp - charHp);
                    if (actualHeal > 0) {
                        charHp += actualHeal;
                        logs.push({
                            round,
                            kind: 'proc',
                            actor: character.name,
                            proc: '残暴动力',
                            value: actualHeal,
                            type: 'heal',
                            text: `【残暴动力】触发：治疗 ${actualHeal} 点生命`
                        });
                    }
                }

                // ✅ 30级天赋：宝珠精通 - 寒冰宝珠的DOT有概率生成寒冰指
                if (character.talents?.[30] === 'orb_mastery' && d.canGenerateFinger) {
                    if (Math.random() < 0.25) { // 概率你可以按Boss战逻辑对齐；
                        fingersOfFrost += 1;
                        logs.push({
                            round,
                            kind: 'proc',
                            actor: character.name,
                            proc: '宝珠精通',
                            value: fingersOfFrost,
                            text: `【宝珠精通】触发：获得 1 层寒冰指（当前 ${fingersOfFrost} 层）`
                        });
                    }
                }


                if (enemyHp <= 0) break;
            }
        }

        // 救赎持续时间处理（保持不变）
        if (character.stats.atonement && character.stats.atonement.duration > 0) {
            character.stats.atonement.duration -= 1;
        }
        if (character.stats.atonement && character.stats.atonement.duration <= 0) {
            delete character.stats.atonement;
            logs.push({
                round,
                actor: character.name,
                action: "救赎结束",
                target: character.name,
                value: "救赎效果结束",
                type: 'buff'
            });
        }

        // ===== 敌人回合 =====
        const dr = getArmorDamageReduction(character.stats.armor);
        const rawEnemyDamage = applyPhysicalMitigation(combatState.enemy?.attack ?? 0, character.stats.armor);

        const blockChance = Math.max(
            0,
            Math.min(
                0.95,
                ((character.stats.blockRate || 0) + getBuffBlockRate()) / 100
            )
        );

        let finalDamage = rawEnemyDamage;
        let blockedAmount = 0;

        if (Math.random() < blockChance) {
            const blockValue = Math.floor((character.stats.blockValue || 0) + (talentBuffs.blockValueFlat || 0));
            blockedAmount = Math.min(finalDamage - 1, blockValue);
            finalDamage = Math.max(1, finalDamage - blockedAmount);
        }

        if (blockedAmount > 0 && character.talents?.[10] === 'block_master') {
            talentBuffs.blockValueFlat = (talentBuffs.blockValueFlat || 0) + 10;
            logs.push({
                round,
                kind: 'proc',
                actor: character.name,
                proc: '格挡大师',
                value: 10,
                text: '【格挡大师】触发，格挡值 +10（本场战斗）'
            });
        }

        // ===== 新增：buff减伤乘区（盾墙等）=====
        let buffDamageTakenMult = 1;
        let buffDamageDealtMult = 1;  // 40级天赋：无坚不摧之力
        buffs.forEach(b => {
            if (b.damageTakenMult) {
                buffDamageTakenMult *= b.damageTakenMult;
            }
            if (b.damageDealtMult) {
                buffDamageDealtMult *= b.damageDealtMult;
            }
        });

        // 30级天赋：挫志怒吼 - 敌人造成的伤害降低20%
        const demoralizingShout = enemyDebuffs.find(d => d.type === 'demoralizing_shout');
        const enemyDamageMult = demoralizingShout ? demoralizingShout.damageMult : 1;

        finalDamage = Math.max(1, Math.floor(finalDamage * (character.stats.damageTakenMult || 1) * buffDamageTakenMult * enemyDamageMult));

        charHp -= finalDamage;
        const blockText = blockedAmount > 0 ? `，格挡 ${blockedAmount}` : '';
        logs.push({
            round,
            actor: combatState.enemy?.name,
            action: `普通攻击(护甲减伤 ${(dr * 100).toFixed(3)}%${blockText})`,
            target: character.name,
            value: Math.floor(finalDamage),
            type: 'damage'
        });

        // 回合结束，buff/debuff duration -1（保持原有）
        tickBuffs();
        tickEnemyDebuffs();
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
            enemyDebuffs,
            validSkills,
            logs,
            talentBuffs,
            fortuneMisfortuneStacks,
            fingersOfFrost, // 把最新层数存回去
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
            const nextValue = current === false;

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
                    updatedChar.stats = calculateTotalStats(updatedChar, undefined, state);
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
            const deltaSeconds = action.payload?.deltaSeconds ?? 1;

            let newState = {
                ...state,
                frame: state.frame + deltaSeconds ,
                lifeFrame: (state.lifeFrame || 0) + deltaSeconds,};

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

            // ===== 广场喷泉：所有脱战英雄每秒回血 +1点（每座喷泉 +1，可叠加） =====
            const fountainCount = state.buildings.plaza_fountain || 0;

            // Boss战斗推进
            if (newState.bossCombat) {
                newState = stepBossCombat(newState);
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
                                char.stats = calculateTotalStats(char, undefined, state);
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

                            // ✅ 新增：记录掉落物品
                            const droppedItems = [];

                            // ✅ 装备掉落（修改版：记录掉落信息）
                            const dropTable = DROP_TABLES[zone.id];
                            if (dropTable?.equipment && newState.inventory.length < newState.inventorySize) {
                                const allowDrop = (id) => state.dropFilters?.[id] !== false;
                                const achDropBonus = getAchievementDropBonus(newState);

                                dropTable.equipment.filter(drop => allowDrop(drop.id)).forEach(drop => {
                                    if (newState.inventory.length >= newState.inventorySize) return;

                                    const baseChance = drop.chance ?? 0;
                                    const effectiveChance = Math.min(1, baseChance * (1 + achDropBonus));

                                    if (Math.random() < effectiveChance) {
                                        const instance = createEquipmentInstance(drop.id);
                                        newState.inventory.push(instance);
                                        newState = addEquipmentIdToCodex(newState, drop.id);

                                        // ✅ 记录掉落信息
                                        droppedItems.push({
                                            name: instance.name,
                                            rarity: instance.rarity,
                                            chance: baseChance * 100 // 转换为百分比
                                        });
                                    }
                                });
                            }

                            // ✅ 物品掉落（如果你也想用掉落表的 items）
                            if (dropTable?.items && newState.inventory.length < newState.inventorySize) {

                                const allowDrop = (id) => state.dropFilters?.[id] !== false; // 默认允许

                                dropTable.items.filter(drop => allowDrop(drop.id)).forEach(drop => {
                                    if (newState.inventory.length >= newState.inventorySize) return;

                                    const baseChance = drop.chance ?? 0;
                                    if (Math.random() < baseChance) {
                                        const tpl = ITEMS[drop.id];
                                        if (tpl) {
                                            newState.inventory.push({
                                                ...tpl,
                                                instanceId: `inv_${Date.now()}_${Math.random()}`,
                                                id: tpl.id,            // 保持模板 id: IT_001
                                            });
                                            newState = addJunkIdToCodex(newState, drop.id);

                                            // ✅ 记录掉落信息
                                            droppedItems.push({
                                                name: tpl.name,
                                                rarity: tpl.rarity || 'white',
                                                chance: baseChance * 100
                                            });
                                        }
                                    }
                                });
                            }

                            // ✅ 将掉落信息添加到战斗日志
                            if (droppedItems.length > 0) {
                                droppedItems.forEach(item => {
                                    finalLogs.push({
                                        round: '结算',
                                        kind: 'drop',
                                        itemName: item.name,
                                        rarity: item.rarity,
                                        chance: item.chance,
                                        text: `🎁 掉落【${item.name}】，概率：${item.chance < 1 ? item.chance.toFixed(2) : item.chance.toFixed(1)}%`
                                    });
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

            // ✅ 离开战斗 5 秒后开始回血：每秒 +10+喷泉数量
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
                        currentHp: Math.min(maxHp, curHp + REGEN_PER_SECOND+fountainCount*1)
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
                talents: {},
                skillSlots: ['basic_attack', 'basic_attack', 'basic_attack', 'basic_attack', 'basic_attack', 'basic_attack', 'basic_attack', 'basic_attack'], // 8个技能槽位
                skills: classData.skills.filter(s => s.level <= 1).map(s => s.skillId),
                buffs: [],
                lastCombatTime: 0,
                combatState: null,
            };

            newChar.stats = calculateTotalStats(newChar, undefined, state);

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
                nextChar.stats = calculateTotalStats(nextChar, undefined, state);

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

            const finalChars = recalcPartyStats(state,cleanedChars);

            return {
                ...state,
                characters: finalChars,
                inventory: newInventory,
            };
        }

        case 'UNEQUIP_ITEM': {
            const { characterId, slot } = action.payload;

            // Ensure the character exists
            const char = state.characters.find(c => c.id === characterId);
            if (!char) return state;

            // Get the item to unequip
            const equipped = char.equipment?.[slot];
            if (!equipped) return state;

            // Ensure the inventory has space
            if (state.inventory.length >= state.inventorySize) return state;

            // Map over characters and update their stats after unequipping the item
            const newChars = state.characters.map(c => {
                if (c.id !== characterId) return c;

                // Clone the character's equipment to avoid mutation
                const newEquipment = { ...c.equipment };
                delete newEquipment[slot];  // Remove the equipment from the slot

                // Recalculate stats after unequipping the item
                const updatedChar = { ...c, equipment: newEquipment };
                updatedChar.stats = calculateTotalStats(updatedChar, undefined, state);

                return updatedChar;
            });

            // Add the unequipped item back to the inventory
            const newInventory = [...state.inventory, equipped];

            const finalChars = recalcPartyStats(state,newChars);
            return {
                ...state,
                characters: finalChars,
                inventory: newInventory,
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



        case 'MERGE_EQUIPMENT_CHAIN': {
            const { targetInstanceId } = action.payload || {};
            if (!targetInstanceId) return state;

            let inv = [...state.inventory];

            const getLevel = (eq) => (eq?.currentLevel ?? eq?.level ?? 0);

            let targetIdx = inv.findIndex(i => i?.type === 'equipment' && i.instanceId === targetInstanceId);
            if (targetIdx === -1) return state;

            let target = inv[targetIdx];
            if (target?.type !== 'equipment') return state;

            while (getLevel(target) < 100) {
                const otherIdx = inv.findIndex(i =>
                    i?.type === 'equipment' &&
                    i.instanceId !== target.instanceId &&
                    i.id === target.id
                );

                if (otherIdx === -1) break;

                const other = inv[otherIdx];
                const merged = mergeEquipments(target, other);
                if (!merged) break;

                // 移除被合成的两件装备（先删较大索引）
                const idxA = inv.findIndex(i => i?.instanceId === target.instanceId);
                const idxB = inv.findIndex(i => i?.instanceId === other.instanceId);
                if (idxA === -1 || idxB === -1) break;

                inv.splice(Math.max(idxA, idxB), 1);
                inv.splice(Math.min(idxA, idxB), 1);

                inv.push(merged);
                target = merged;
            }

            let nextState = {
                ...addEquipmentIdToCodex(state, target.id),
                inventory: inv
            };

            if (getLevel(target) >= 100) {
                nextState = addEquipmentIdToLv100Codex(nextState, target.id);
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

            // 已建数量（建第1座时 builtCount=0 → 100% 成本）
            const builtCount = state.buildings[buildingId] || 0;

            // 每多一座 +10%
            const multiplier = 1 + builtCount * 0.1;

            // 计算动态成本（向上取整避免出现小数）
            const dynamicCost = {};
            Object.entries(building.cost).forEach(([resource, amount]) => {
                dynamicCost[resource] = Math.ceil(amount * multiplier);
            });

            // 校验资源够不够
            let canBuild = true;
            Object.entries(dynamicCost).forEach(([resource, amount]) => {
                if ((state.resources[resource] || 0) < amount) canBuild = false;
            });
            if (!canBuild) return state;

            // 扣资源
            const newResources = { ...state.resources };
            Object.entries(dynamicCost).forEach(([resource, amount]) => {
                newResources[resource] -= amount;
            });

            return {
                ...state,
                resources: newResources,
                buildings: {
                    ...state.buildings,
                    [buildingId]: builtCount + 1
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

            const item = state.inventory[idx];
            // ✅ 邀请函逻辑
            if (item.id === 'REBIRTH_INVITATION') {
                const newInventory = [...state.inventory];
                newInventory.splice(idx, 1);

                const alreadyRebirthed = (state.rebirthCount || 0) > 0;

                return {
                    ...state,
                    inventory: newInventory,
                    rebirthUnlocked: true,
                    showRebirthConfirm: !alreadyRebirthed // 只有没重生过才弹确认
                };
            }

            //黑龙女王的证明
            if (item.id === 'IT_BLACK_DRAGON_PROOF') {
                state.worldBossProgress = {
                    ...state.worldBossProgress,
                    prestor_lady: true
                };
            }



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

        case 'SET_TALENT': {
            const { characterId, tier, talentId } = action.payload || {};
            if (!characterId || !tier) return state;

            const updatedChars = state.characters.map(c => {
                if (c.id !== characterId) return c;

                const talents = { ...(c.talents || {}) };
                talents[tier] = talentId;

                return { ...c, talents };
            });

            // 关键：光环会影响全队，所以要全队一起重算
            const newChars = recalcPartyStats(state,updatedChars);

            return { ...state, characters: newChars };
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

        case 'OPEN_BOSS_PREPARE': {
            const bossId = action.payload;
            return {
                ...state,
                prepareBoss: bossId,
                bossTeam: [null, null, null],
                bossStrategy: { priorityBoss: true, stance: 'dispersed' }
            };
        }

        case 'CLOSE_BOSS_PREPARE': {
            return { ...state, prepareBoss: null, bossTeam: [null, null, null] };
        }

        case 'SET_BOSS_TEAM_SLOT': {
            const { slot, charId } = action.payload;
            const newTeam = [...state.bossTeam];
            // 如果同一个角色已存在，移除旧位置
            const oldSlot = newTeam.indexOf(charId);
            if (oldSlot !== -1 && oldSlot !== slot) newTeam[oldSlot] = null;
            newTeam[slot] = charId ?? null;
            return { ...state, bossTeam: newTeam };
        }

        case 'SET_BOSS_STRATEGY': {
            const { key, value } = action.payload;
            return {
                ...state,
                bossStrategy: { ...state.bossStrategy, [key]: value }
            };
        }

        case 'START_BOSS_COMBAT': {
            const bossId = state.prepareBoss;
            if (!bossId) return state;
            const boss = BOSS_DATA[bossId];
            if (!boss) return state;

            const teamIds = state.bossTeam.filter(Boolean);
            if (teamIds.length === 0) return state;

            const teamChars = teamIds.map(id => state.characters.find(c => c.id === id)).filter(Boolean);
            // 重新计算队伍光环
            const recalcedTeam = recalcPartyStats(state,teamChars.map(c => ({ ...c })));

            const playerStates = recalcedTeam.map(char => ({
                char,
                currentHp: char.stats.maxHp,
                currentMp: char.stats.maxMp,
                skillIndex: 0,
                buffs: [],
                talentBuffs: { attackFlat: 0, blockValueFlat: 0, spellPowerFlat: 0 },
                fortuneMisfortuneStacks: 0, // 祸福相依层数
                fingersOfFrost: 0, // 寒冰指层数（冰霜法师）
                validSkills: Array.from({ length: 8 }, (_, i) => {
                    const sid = char.skillSlots?.[i] || '';
                    return sid && SKILLS[sid] ? sid : 'rest';
                }).map(sid => SKILLS[sid] ? sid : 'basic_attack')
            }));

            return {
                ...state,
                bossCombat: {
                    bossId,
                    strategy: { ...state.bossStrategy },
                    playerStates,
                    bossHp: boss.maxHp,
                    minions: [],
                    minionDebuffs: [],
                    bossDebuffs: [],
                    round: 0,
                    logs: []
                },
                prepareBoss: null
            };
        }
        case 'CLOSE_HOGGER_PLOT': return { ...state, showHoggerPlot: false };
        case 'OPEN_REBIRTH_CONFIRM': return { ...state, showRebirthConfirm: true };
        case 'CLOSE_REBIRTH_CONFIRM': return { ...state, showRebirthConfirm: false };
        case 'PERFORM_REBIRTH': {
            const equippedCount = state.characters.reduce((sum, char) =>
                sum + Object.values(char.equipment || {}).filter(Boolean).length, 0);
            if (state.inventory.length + equippedCount > state.inventorySize) {
                alert('道具栏空间不足，请清理或扩容背包以存放所有装备！');
                return state;
            }

            let newState = { ...state, showRebirthConfirm: false };

            // 卸下所有装备
            const extraItems = [];
            newState.characters = newState.characters.map(char => {
                Object.values(char.equipment || {}).forEach(eq => { if (eq) extraItems.push(eq); });
                return { ...char, equipment: {} };
            });
            newState.inventory = [...newState.inventory, ...extraItems];

            // ==================== 新的重生加成计算公式 ====================
            // 帧数加成：对数函数，3600帧→10%, 36000帧→20%, 86400帧→30%
            // 公式：frameBonus = 0.1 * log10(frame / 360)，最小0
            const frame = state.lifeFrame || 0;
            const frameBonus = frame >= 360 ? 0.1 * Math.log10(frame / 360) : 0;

            // 等级加成：每级0.2%，最高等级
            const maxLevel = state.characters.reduce((m, c) => Math.max(m, c.level || 0), 0);
            const levelBonus = maxLevel * 0.002;

            // Boss加成：根据击杀的Boss给予加成
            const bossBonus = {
                hogger: 0.05,      // 霍格 +5%
                vancleef: 0.10,   // 范克里夫 +10%（预留）
                prestor_lady: 0.25
            };
            const defeatedBosses = state.defeatedBosses || [];
            const totalBossBonus = defeatedBosses.reduce((sum, bossId) => sum + (bossBonus[bossId] || 0), 0);

            // 总加成（经验/金币相同，掉落和研究有系数）
            const newExp = frameBonus + levelBonus + totalBossBonus;
            const newGold = newExp;
            const newDrop = newExp * 0.6;
            const newResearch = newExp * 0.5;

            // ⚠️ 重要：清空上一世加成，使用新的加成值（不叠加）
            newState.rebirthBonuses = {
                exp: newExp,
                gold: newGold,
                drop: newDrop,
                researchSpeed: newResearch
            };

            // 随机羁绊（羁绊仍然叠加保留）
            const possibleBonds = ['baoernai', 'jianyue'];
            const newBond = possibleBonds[Math.floor(Math.random() * possibleBonds.length)];
            newState.rebirthBonds = [...newState.rebirthBonds, newBond];

            // 消耗邀请函
            const tokenIdx = newState.inventory.findIndex(i => i.id === 'REBIRTH_INVITATION');
            if (tokenIdx >= 0) newState.inventory.splice(tokenIdx, 1);

            newState.rebirthCount += 1;

            // 重生剧情数据
            newState.showRebirthPlot = {
                frame: frame,
                maxLevel: maxLevel,
                defeatedBosses: defeatedBosses,
                newExp: (newExp * 100).toFixed(1),
                newGold: (newGold * 100).toFixed(1),
                newDrop: (newDrop * 100).toFixed(1),
                newResearch: (newResearch * 100).toFixed(1),
                newBond: BOND_NAMES[newBond],
                rebirthCount: newState.rebirthCount
            };

            // 重置游戏进度
            newState.characters = [];
            newState.resources = { ...initialState.resources, gold: 500 };
            newState.buildings = {};
            newState.research = {};
            newState.currentResearch = null;
            newState.researchProgress = 0;
            newState.assignments = {};
            newState.zones = JSON.parse(JSON.stringify(ZONES));
            newState.achievements = {};
            newState.prepareBoss = null;
            newState.bossTeam = [null, null, null];
            newState.bossCombat = null;
            newState.currentMenu = 'map';
            newState.lifeFrame = 0; // 新一世从0开始计
            newState.defeatedBosses = []; // 清空本世击杀的Boss
            return newState;
        }
        case 'CHEAT_ADD_GOLD': {
            return {
                ...state,
                resources: {
                    ...state.resources,
                    gold: state.resources.gold + action.payload
                }
            };
        }

        case 'CHEAT_ADD_EQUIPMENT': {
            const newInventory = [...state.inventory, action.payload];

            // 自动点亮图鉴
            let newCodex = state.codex.slice();
            if (!newCodex.includes(action.payload.id)) {
                newCodex.push(action.payload.id);
            }

            // 如果达到 Lv.100，点亮 Lv100 图鉴
            let newCodexLv100 = state.codexEquipLv100.slice();
            if (action.payload.currentLevel >= 100 && !newCodexLv100.includes(action.payload.id)) {
                newCodexLv100.push(action.payload.id);
            }

            return {
                ...state,
                inventory: newInventory,
                codex: newCodex,
                codexEquipLv100: newCodexLv100
            };
        }
        case 'CHEAT_ADD_LV100_CODEX': {
            const id = action.payload;
            let newCodexLv100 = state.codexEquipLv100.slice();
            if (!newCodexLv100.includes(id)) {
                newCodexLv100.push(id);
            }
            return {
                ...state,
                codexEquipLv100: newCodexLv100
            };
        }
        case 'CHEAT_ADD_BAGSLOT': {
            const amount = Math.max(0, parseInt(action.payload) || 0);
            return {
                ...state,
                inventorySize: state.inventorySize + amount
            };
        }
        case 'CHEAT_ADD_EXP': {
            const { amount, charIndex } = action.payload;
            if (charIndex < 0 || charIndex >= state.characters.length) {
                return state; // 安全检查
            }

            const newCharacters = [...state.characters];
            let char = { ...newCharacters[charIndex] };

            // 加经验
            char.exp = (char.exp || 0) + amount;

            // 升级循环
            while (char.exp >= char.expToNext && char.level < 200) {
                char.level += 1;
                char.exp -= char.expToNext;
                char.expToNext = Math.floor(100 * Math.pow(1.2, char.level - 1));
                char.skills = learnNewSkills(char); // 学会新技能
            }

            // 重算总属性（使用全队光环）
            const updatedParty = recalcPartyStats(state, newCharacters.map(c => c.id === char.id ? char : c));
            const updatedChar = updatedParty.find(c => c.id === char.id);

            newCharacters[charIndex] = updatedChar || char;

            return {
                ...state,
                characters: newCharacters
            };
        }
        case 'CLOSE_REBIRTH_PLOT':
            return { ...state, showRebirthPlot: null };
        case "DELETE_CHARACTER": {
            const { characterId } = action.payload || {};
            if (!characterId) return state;

            // 找到要删的角色（为了把装备退回背包）
            const target = (state.characters || []).find(c => c.id === characterId);
            if (!target) return state;

            // 1) 装备退回背包：把 target.equipment 里所有已穿戴装备捞出来
            const equippedItems = Object.values(target.equipment || {}).filter(Boolean);

            // 注意：你的系统对掉落/奖励入包会检查 inventorySize（避免超上限）
            // 这里删除角色属于“退回已有物品”，建议也遵守上限：能放多少放多少，剩余丢弃（避免背包无限膨胀）
            const freeSlots = Math.max(0, (state.inventorySize ?? 0) - (state.inventory?.length ?? 0));
            const canReturn = equippedItems.slice(0, freeSlots);
            const newInventory = [...(state.inventory || []), ...canReturn];

            // 2) 从角色列表移除（角色本体上就包含 exp/talents/skillSlots/combatState 等）
            // 角色对象包含 exp、equipment、talents、skillSlots、combatState 等字段，删掉对象即可清理 :contentReference[oaicite:2]{index=2}
            const newCharacters = (state.characters || []).filter(c => c.id !== characterId);

            // 3) 清理 assignments（防止离线奖励/派遣逻辑仍然引用已删除角色）
            const newAssignments = { ...(state.assignments || {}) };
            delete newAssignments[characterId];

            // 4) 清理 bossTeam：把阵容里引用的 charId 置空
            // bossTeam 在 state 里是 [null, null, null] 存 charId :contentReference[oaicite:3]{index=3}
            const newBossTeam = (state.bossTeam || []).map(id => (id === characterId ? null : id));

            // 5) 清理 bossCombat（如果该角色正在世界首领战里）
            let newBossCombat = state.bossCombat;
            if (newBossCombat?.playerStates?.some(ps => ps?.char?.id === characterId)) {
                newBossCombat = null; // 最稳妥：直接中止这场 boss 战，避免残留 playerStates 引用已删角色
            }

            // 6) 你项目里多处会重算全队/光环等，这里保持一致
            const finalChars = recalcPartyStats(state, newCharacters);

            return {
                ...state,
                characters: finalChars,
                inventory: newInventory,
                assignments: newAssignments,
                bossTeam: newBossTeam,
                bossCombat: newBossCombat,
            };
        }
        case 'SYNTHESIZE_EQ_044': {
            const getLevel = (eq) => (eq?.currentLevel ?? eq?.level ?? 0);

            const idxA = state.inventory.findIndex(i => i?.type === 'equipment' && i.id === 'EQ_041' && getLevel(i) >= 100);
            const idxB = state.inventory.findIndex(i => i?.type === 'equipment' && i.id === 'EQ_042' && getLevel(i) >= 100);
            if (idxA === -1 || idxB === -1) return state;

            // 背包空间：移除2件再加1件，一定有空间，不用额外判断
            const tpl = FIXED_EQUIPMENTS['EQ_044'];
            if (!tpl) return state;

            const instance = {
                ...tpl,
                instanceId: `syn_${Date.now()}_${Math.random().toString(36)}`,
                qualityColor: getRarityColor(tpl.rarity),
                currentLevel: 0,
                stats: scaleStats(tpl.baseStats, tpl.growth, 0)
            };

            const newInventory = [...state.inventory];
            newInventory.splice(Math.max(idxA, idxB), 1);
            newInventory.splice(Math.min(idxA, idxB), 1);
            newInventory.push(instance);

            let nextState = {
                ...state,
                inventory: newInventory
            };

            // 记录图鉴（跟你合成装备后记图鉴的逻辑一致）:contentReference[oaicite:5]{index=5}
            nextState = addEquipmentIdToCodex(nextState, instance.id);

            return nextState;
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

    // 获取技能的实际限制（考虑天赋效果）
    const getSkillLimit = (skillId) => {
        const skill = SKILLS[skillId];
        let limit = skill?.limit ?? Infinity;

        // 40级天赋：护卫神盾 - 盾墙可配置2次
        if (skillId === 'shield_wall' && character.talents?.[40] === 'guardian_shield') {
            limit = 2;
        }

        // 冰霜法师40级天赋：双彗星 - 彗星风暴可配置2次
        if (skillId === 'comet_storm' && character.talents?.[40] === 'double_comet') {
            limit = 2;
        }

        // 戒律牧师20级天赋：圣光的许诺 - 真言术：耀可多配置1次
        if (skillId === 'power_word_radiance' && character.talents?.[20] === 'radiance_plus') {
            limit = (skill?.limit || 2) + 1;
        }

        return limit;
    };

    const handleSlotChange = (index, skillId) => {
        const newSlots = [...skillSlots];
        newSlots[index] = skillId;

        // 统计每个技能在技能栏中的出现次数
        const countMap = {};
        newSlots.forEach(sid => {
            if (!sid) return;
            countMap[sid] = (countMap[sid] || 0) + 1;
        });

        // 校验每个技能的 limit（考虑天赋）
        for (const [sid, count] of Object.entries(countMap)) {
            const skill = SKILLS[sid];
            const limit = getSkillLimit(sid);

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
                                {character.skills // 被动技能仅用于展示，不允许塞进循环技能栏
                                    .filter((sid) => sid && SKILLS[sid] && SKILLS[sid].type !== 'passive').map(sid => {
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

// 查看可用技能（排除“休息/普通攻击”）
const SkillViewerModal = ({ character, onClose }) => {
    const availableSkillIds = (character.skills || []).filter(
        (sid) => sid && sid !== 'rest' && sid !== 'basic_attack' && SKILLS[sid]
    );

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
                maxWidth: 700,
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(201,162,39,0.3)',
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, color: '#ffd700' }}>
                            查看技能 - {character.name}
                        </h2>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                            仅展示可用技能
                        </div>
                    </div>
                    <Button onClick={onClose} variant="secondary">✕ 关闭</Button>
                </div>

                {availableSkillIds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                        暂无可用技能
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 12
                    }}>
                        {availableSkillIds.map((sid) => {
                            const skill = SKILLS[sid];
                            // 获取技能的实际限制（考虑天赋效果）
                            let limit = skill.limit;
                            if (sid === 'shield_wall' && character.talents?.[40] === 'guardian_shield') {
                                limit = 2;
                            }
                            // 冰霜法师40级天赋：双彗星
                            if (sid === 'comet_storm' && character.talents?.[40] === 'double_comet') {
                                limit = 2;
                            }
                            // 戒律牧师20级天赋：圣光的许诺
                            if (sid === 'power_word_radiance' && character.talents?.[20] === 'radiance_plus') {
                                limit = (skill?.limit || 2) + 1;
                            }
                            return (
                                <div key={sid} style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid #4a3c2a',
                                    borderRadius: 10,
                                    padding: 14
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <div style={{ fontSize: 26 }}>{skill.icon}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#ffd700', fontWeight: 700, fontSize: 13 }}>
                                                {skill.name}
                                            </div>
                                            <div style={{ color: '#888', fontSize: 11 }}>
                                                类型：{skill.type}{typeof limit === 'number' ? ` · 槽位上限：${limit}` : ''}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.5 }}>
                                        {skill.description}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ==================== COMBAT LOGS (MODULE) ====================
// 统一战斗日志规范：
// - 主动技能：显示“使用”
// - 被动触发（天赋/被动）：显示“【xxx】触发：...”，不算一次行动
// - 系统事件：显示纯文本
function normalizeCombatLogEntry(entry) {
    if (!entry || typeof entry !== 'object') {
        return { kind: 'system', text: String(entry ?? '') };
    }
    if (entry.kind) return entry;

    // 兼容旧字段：type
    if (entry.type === 'talent') {
        return { ...entry, kind: 'proc', proc: entry.action || entry.proc || '被动' };
    }
    if (entry.type === 'damage' || entry.type === 'heal' || entry.type === 'buff' || entry.type === 'block') {
        return { ...entry, kind: 'skill' };
    }
    return { ...entry, kind: 'system', text: entry.text || entry.action || '' };
}

function renderCombatLogLine(entry) {
    const e = normalizeCombatLogEntry(entry);

    // 系统日志
    if (e.kind === 'system') {
        return (
            <>
                <span style={{ color: '#aaa' }}>{e.text || ''}</span>
            </>
        );
    }

    // ✅ 新增：掉落日志
    if (e.kind === 'drop') {
        const rarityColors = {
            white: '#d9d9d9',
            green: '#1eff00',
            blue: '#0070dd',
            purple: '#a335ee',
            orange: '#ff8000'
        };
        const color = rarityColors[e.rarity] || '#ffd700';

        return (
            <>
                <span style={{ color: '#ffd700' }}>🎁 掉落</span>
                {' '}
                <span style={{
                    color: color,
                    fontWeight: 600,
                    textShadow: `0 0 6px ${color}66`
                }}>
                    【{e.itemName}】
                </span>
                <span style={{ color: '#888', marginLeft: 8, fontSize: '0.9em' }}>
                    概率：{e.chance < 1 ? e.chance.toFixed(2) : e.chance.toFixed(1)}%
                </span>
            </>
        );
    }

    // 被动触发：不显示“使用”，也不重复显示施放者（统一由文本自身表达）
    if (e.kind === 'proc') {
        return (
            <>
                <span style={{ color: '#ff9800' }}>
                    {e.text || `【${e.proc || e.action || '被动'}】触发`}
                </span>
            </>
        );
    }

// 主动技能：保留原来的“使用”语义
    return (
        <>
            <span style={{ color: '#ffd700' }}>{e.actor}</span>
            {' '}使用{' '}
            <span style={{ color: '#4CAF50' }}>{e.action}</span>

            {e.type === 'damage' && (
                <>
                    {' '}对{' '}
                    <span style={{ color: '#ff6b6b' }}>{e.target}</span>
                    {' '}造成{' '}
                    <span style={{ color: '#f44336', fontWeight: 600 }}>
                        {e.value}
                    </span>
                    {' '}点伤害
                    {e.isCrit && (
                        <span style={{ color: '#ff9800', marginLeft: 4 }}>
                            [暴击!]
                        </span>
                    )}
                </>
            )}

            {e.type === 'heal' && (
                <>
                    {' '}恢复{' '}
                    <span style={{ color: '#4CAF50', fontWeight: 600 }}>
                        {e.value}
                    </span>
                    {' '}点生命
                </>
            )}

            {e.type === 'block' && (
                <>
                    {' '}格挡了{' '}
                    <span style={{ color: '#4CAF50', fontWeight: 600 }}>
                        {e.value}
                    </span>
                    {' '}点伤害
                </>
            )}

            {e.type === 'buff' && (
                <>
                    {' '}获得效果（持续{' '}
                    <span style={{ color: '#4CAF50', fontWeight: 700 }}>{e.value}</span>
                    {' '}回合）
                </>
            )}
        </>
    );
}

// 战斗日志模态框
const CombatLogsModal = ({ logs, onClose, onClear }) => {

    const safe = Array.isArray(logs) ? logs : [];

    const normalized = safe
        .filter(Boolean)
        .map((x) => {
            if (typeof x === "string") {
                return {
                    id: `legacy_${Date.now()}_${Math.random()}`,
                    timestamp: Date.now(),
                    characterName: "系统",
                    zoneName: "",
                    enemyName: "",
                    result: "victory",
                    logs: [x],
                    rewards: { gold: 0, exp: 0 },
                    drops: [],

                };
            }
            return {
                ...x,
                logs: Array.isArray(x.logs) ? x.logs : [],
                drops: Array.isArray(x.drops) ? x.drops : [] // ✅ 新增
            };
        });

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
                        normalized.map(log => (
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
                                    {(log.logs || []).map((entry, i) => (
                                        <div key={i} style={{
                                            padding: '4px 0',
                                            borderBottom: i < log.logs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                        }}>
                                            <span style={{ color: '#888' }}>回合{entry.round}:</span>{' '}
                                            {renderCombatLogLine(entry)}
                                        </div>
                                    ))}
                                </div>

                                {/* 在奖励显示后添加掉落摘要 */}
                                {log.drops && log.drops.length > 0 && (
                                    <div style={{
                                        marginTop: 8,
                                        paddingTop: 8,
                                        borderTop: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: 12
                                    }}>
                                        <span style={{ color: '#ffd700', marginRight: 8 }}>🎁 掉落：</span>
                                        {log.drops.map((drop, idx) => {
                                            const rarityColors = {
                                                white: '#d9d9d9',
                                                green: '#1eff00',
                                                blue: '#0070dd',
                                                purple: '#a335ee',
                                                orange: '#ff8000'
                                            };
                                            const color = rarityColors[drop.rarity] || '#ffd700';
                                            return (
                                                <span key={idx} style={{ marginRight: 12 }}>
                                                <span style={{ color: color, fontWeight: 600 }}>{drop.name}</span>
                                                <span style={{ color: '#666', fontSize: 10, marginLeft: 4 }}>
                                                    ({drop.chance < 1 ? drop.chance.toFixed(2) : drop.chance.toFixed(1)}%)
                                                </span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

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
const CharacterDetailsModal = ({ characterId, state, onClose, onUnequip, onEditSkills, onViewSkills }) => {
    const character = state.characters.find(c => c.id === characterId);

    // 角色被删除/不存在时，直接不渲染（或你也可以 onClose()）
    if (!character) return null;

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
                        <Button onClick={onViewSkills} variant="secondary">👁 查看技能</Button>
                        <Button onClick={onEditSkills} variant="secondary">✏️ 编辑技能</Button>
                        <Button onClick={onClose} variant="secondary">✕ 关闭</Button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                    {/* 左侧：属性 */}
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
                                        {stat === 'critRate' || stat === 'blockRate'
                                            ? `${(character.stats[stat] || 0).toFixed(1)}%`
                                            : stat === 'critDamage'
                                                ? `${Math.round((character.stats[stat] || 0) * 100)}%`
                                                : Math.floor(character.stats[stat] || 0)
                                        }
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 右侧：装备 */}
                    <div>
                        <h3 style={{ fontSize: 16, color: '#c9a227', marginBottom: 12 }}>装备</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {equipped ? (
                                                <ItemIcon item={equipped} size={18} />
                                            ) : (
                                                <span>{slotInfo.icon}</span>
                                            )}
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

                        {/* 套装效果 */}
                        {setBonuses.length > 0 && (
                            <div style={{
                                marginTop: 14,
                                padding: 12,
                                borderRadius: 8,
                                background: 'rgba(0,0,0,0.25)',
                                border: '1px solid rgba(201,162,39,0.25)'
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#ffd700', marginBottom: 8 }}>
                                    套装效果
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {setBonuses.map(set => (
                                        <div key={set.setId} style={{
                                            padding: 10,
                                            borderRadius: 8,
                                            background: 'rgba(0,0,0,0.25)',
                                            border: '1px solid rgba(201,162,39,0.18)'
                                        }}>
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
                        <ItemIcon item={item} size={32} />
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

                {/* 特殊效果显示 */}
                {item.specialEffect && (
                    <div style={{
                        background: 'rgba(255, 152, 0, 0.1)',
                        border: '1px solid rgba(255, 152, 0, 0.3)',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 20
                    }}>
                        <h3 style={{ fontSize: 14, color: '#ff9800', marginBottom: 12 }}>⚡ 特殊效果</h3>
                        {/* skill_slot_buff 类型 */}
                        {item.specialEffect.type === 'skill_slot_buff' && (
                            <div style={{ fontSize: 12, color: '#ffb74d', lineHeight: 1.6 }}>
                                在第 <span style={{ color: '#ffd700', fontWeight: 600 }}>
                    {item.specialEffect.slots.map(s => s + 1).join('、')}
                </span> 技能格释放技能时：
                                {item.specialEffect.attackBonus && (
                                    <div style={{ marginTop: 8, color: '#fff' }}>
                                        • 攻击强度 <span style={{ color: '#4CAF50', fontWeight: 600 }}>+{item.specialEffect.attackBonus}</span>
                                    </div>
                                )}
                                {item.specialEffect.spellPowerBonus && (
                                    <div style={{ marginTop: 8, color: '#fff' }}>
                                        • 法术强度 <span style={{ color: '#4CAF50', fontWeight: 600 }}>+{item.specialEffect.spellPowerBonus}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* basic_attack_repeat 类型 */}
                        {item.specialEffect.type === 'basic_attack_repeat' && (
                            <div style={{ fontSize: 12, color: '#ffb74d', lineHeight: 1.6 }}>
                                <div style={{ marginBottom: 8, color: '#fff' }}>
                                    使用普通攻击后，有 <span style={{ color: '#ffd700', fontWeight: 600 }}>
                        {(item.specialEffect.chance * 100).toFixed(0)}%
                    </span> 概率再次发动一次普通攻击
                                </div>
                                <div style={{
                                    marginTop: 12,
                                    padding: '8px 12px',
                                    background: 'rgba(255,215,0,0.1)',
                                    borderRadius: 6,
                                    border: '1px dashed rgba(255,215,0,0.3)',
                                    fontSize: 11,
                                    color: '#c9a227'
                                }}>
                                    💡 提示：连击伤害与普通攻击相同，可触发"质朴"等普攻相关天赋
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                    {item.id === 'REBIRTH_INVITATION' && (
                        <Button
                            variant="danger"
                            onClick={() => {
                                dispatch({ type: 'USE_ITEM', payload: { itemInstanceId: item.instanceId || item.id } });
                                onClose();
                            }}
                            style={{ flex: 1 }}
                        >
                            🌀 使用邀请函
                        </Button>
                    )}
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
                    {(() => {
                        const getLevel = (eq) => (eq?.currentLevel ?? eq?.level ?? 0);
                        const isMatA = item.id === 'EQ_041' && getLevel(item) >= 100;
                        const isMatB = item.id === 'EQ_042' && getLevel(item) >= 100;

                        const hasOther =
                            isMatA
                                ? state.inventory.some(i => i?.type === 'equipment' && i.id === 'EQ_042' && getLevel(i) >= 100)
                                : isMatB
                                ? state.inventory.some(i => i?.type === 'equipment' && i.id === 'EQ_041' && getLevel(i) >= 100)
                                : false;

                        if (!(hasOther && (isMatA || isMatB))) return null;

                        return (
                            <Button
                                onClick={() => {
                                    if (window.confirm('消耗【反击者桑萨斯 Lv100】与【保护者加萨斯 Lv100】合成【鞭笞者苏萨斯 Lv0】？')) {
                                        dispatch({ type: 'SYNTHESIZE_EQ_044' });
                                        onClose();
                                    }
                                }}
                                style={{ flex: 1 }}
                            >
                                ⚗️ 合成鞭笞者苏萨斯
                            </Button>
                        );
                    })()}
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
const TalentPage = ({ state, dispatch }) => {
    const characters = state.characters || [];
    const [selectedId, setSelectedId] = useState(characters[0]?.id || '');

    useEffect(() => {
        if (!selectedId && characters[0]?.id) setSelectedId(characters[0].id);
        if (selectedId && !characters.some(c => c.id === selectedId)) {
            setSelectedId(characters[0]?.id || '');
        }
    }, [characters, selectedId]);

    const character = characters.find(c => c.id === selectedId);

    if (!character) {
        return (
            <Panel title="天赋">
                <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>
                    还没有角色，先去“角色”页面创建一个吧。
                </div>
            </Panel>
        );
    }

    const tiers = TALENTS[character.classId] || [];
    const talents = character.talents || {};

    const isTierUnlocked = (tier) => (character.level || 1) >= tier;

    const chooseTalent = (tier, talentId) => {
        if (!isTierUnlocked(tier)) return;
        dispatch({ type: 'SET_TALENT', payload: { characterId: character.id, tier, talentId } });
    };

    const cardStyle = (tier, optionId) => {
        const picked = talents?.[tier] === optionId;
        const hasPick = Boolean(talents?.[tier]);
        const locked = !isTierUnlocked(tier);

        const dim = hasPick && !picked;
        return {
            background: picked
                ? 'linear-gradient(135deg, rgba(201,162,39,0.20) 0%, rgba(120,90,20,0.15) 100%)'
                : 'rgba(0,0,0,0.25)',
            border: picked ? '2px solid #c9a227' : '2px solid rgba(74,60,42,0.9)',
            borderRadius: 10,
            padding: 14,
            cursor: (locked || dim) ? 'not-allowed' : 'pointer',
            opacity: locked ? 0.45 : (dim ? 0.25 : 1),
            transition: 'all 0.15s',
            boxShadow: picked ? '0 0 14px rgba(201,162,39,0.25)' : 'none',
            userSelect: 'none',
        };
    };

    return (
        <div>
            <Panel
                title="天赋"
                actions={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 12, color: '#aaa' }}>选择角色：</div>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            style={{
                                padding: '6px 10px',
                                background: 'rgba(0,0,0,0.4)',
                                border: '1px solid #4a3c2a',
                                borderRadius: 6,
                                color: '#fff',
                                fontSize: 12,
                                cursor: 'pointer'
                            }}
                        >
                            {characters.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name}（Lv{c.level}）
                                </option>
                            ))}
                        </select>
                    </div>
                }
            >
                <div style={{ color: '#888', fontSize: 12, marginBottom: 10 }}>
                    每10级解锁一行，每行3选1。
                </div>

                {tiers.map(tierDef => {
                    const tier = tierDef.tier;
                    const locked = !isTierUnlocked(tier);
                    const picked = talents?.[tier];

                    return (
                        <div key={tier} style={{
                            marginBottom: 14,
                            padding: 14,
                            background: 'rgba(0,0,0,0.18)',
                            border: '1px solid rgba(201,162,39,0.12)',
                            borderRadius: 10,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                                <div style={{ color: '#ffd700', fontWeight: 700 }}>
                                    Lv{tier} 天赋
                                </div>
                                <div style={{ fontSize: 12, color: locked ? '#a66' : '#7f7' }}>
                                    {locked ? `未解锁（需要 Lv${tier}）` : (picked ? `已选择：${tierDef.options.find(o => o.id === picked)?.name || picked}` : '未选择')}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {tierDef.options.map(opt => (
                                    <div
                                        key={opt.id}
                                        style={cardStyle(tier, opt.id)}
                                        onClick={() => {
                                            if (locked) return;
                                            // 如果已选这一项，则不做切换（避免误触）
                                            if (talents?.[tier] === opt.id) return;
                                            // 如果是占位（预留）行，先不允许选择（避免误导）
                                            if (tier >= 50) return;
                                            chooseTalent(tier, opt.id);
                                        }}
                                        title={locked ? '未解锁' : (tier >= 50 ? '预留天赋，待实现' : '点击选择')}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div style={{ fontWeight: 700, color: '#fff' }}>{opt.name}</div>
                                            {talents?.[tier] === opt.id && (
                                                <div style={{ color: '#c9a227', fontSize: 12, fontWeight: 800 }}>✓ 已点亮</div>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.45 }}>
                                            {opt.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </Panel>
        </div>
    );
};

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
    const [selectedCharId, setSelectedCharId] = useState(null);
    const [showSkillEditor, setShowSkillEditor] = useState(null);
    const [showSkillViewer, setShowSkillViewer] = useState(null);
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

            {showSkillViewer && (
                <SkillViewerModal
                    character={showSkillViewer}
                    onClose={() => setShowSkillViewer(null)}
                />
            )}

            {selectedCharId && (
                <CharacterDetailsModal
                    characterId={selectedCharId}
                    state={state}
                    onClose={() => setSelectedCharId(null)}
                    onUnequip={(charId, slot) => {
                        dispatch({ type: 'UNEQUIP_ITEM', payload: { characterId: charId, slot } });
                    }}
                    onEditSkills={() => {
                        const latest = state.characters.find(c => c.id === selectedCharId);
                        if (latest) setShowSkillEditor(latest);
                        setSelectedCharId(null);
                    }}
                    onViewSkills={() => {
                        const latest = state.characters.find(c => c.id === selectedCharId);
                        if (latest) setShowSkillViewer(latest);
                        setSelectedCharId(null);
                    }}
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
                                onClick={() => setSelectedCharId(char.id)}
                                style={{
                                    cursor: 'pointer',
                                    padding: 12,
                                    borderRadius: 10,
                                    border: '1px solid #333',
                                    background: 'rgba(0,0,0,0.35)',
                                    transition: 'transform 0.06s ease',
                                }}
                                onMouseDown={(e) => {
                                    // 小小按压反馈（可删）
                                    e.currentTarget.style.transform = 'scale(0.995)';
                                }}
                                onMouseMove={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                onMouseUp={(e) => {
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
                                    <div>攻击: {formatStatForDisplay('attack', char.stats.attack)}</div>
                                    <div>护甲: {Math.floor(char.stats.armor)}</div>
                                </div>

                                {/* ✅ 角色卡片：查看技能（排除“休息/普通攻击”） + 编辑技能 */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSkillViewer(char);
                                        }}
                                        variant="secondary"
                                        style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
                                    >
                                        查看技能
                                    </Button>
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
                                    <Button
                                        variant="danger"
                                        onClick={() => {
                                            if (window.confirm("确定要删除该角色吗？")) {
                                                dispatch({ type: "DELETE_CHARACTER", payload: { characterId: char.id } });
                                            }
                                        }}
                                    >
                                        🗑 删除
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
                            onClick={(e) => {
                                // ✅ 新增：邀请函直接使用（不管是不是 equipment）
                                if (item.id === 'REBIRTH_INVITATION') {
                                    dispatch({ type: 'USE_ITEM', payload: { itemInstanceId: item.instanceId || item.id } });
                                    return;
                                }
                                if (item.type !== 'equipment') return;
                                // Shift + 左键：把背包里同款装备依次合成到该装备上，直到 Lv100 或没有同款
                                if (e.shiftKey && item.instanceId) {
                                    e.preventDefault();
                                    dispatch({ type: 'MERGE_EQUIPMENT_CHAIN', payload: { targetInstanceId: item.instanceId } });
                                    return;
                                }
                                setSelectedItem(item);
                            }}
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
                                    ? `linear-gradient(135deg, ${(item.qualityColor || getRarityColor(item.rarity))}22, rgba(0,0,0,0.3))`
                                    : 'rgba(0,0,0,0.3)',
                                border: `2px solid ${item.type === 'equipment' ? (item.qualityColor || getRarityColor(item.rarity)) : '#4a3c2a'}`,
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
                                <ItemIcon item={item} size={32} />
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
                            {/* 显示特殊效果 */}
                            {item.specialEffect && (
                                <div style={{
                                    fontSize: 9,
                                    color: '#ff9800',
                                    marginTop: 4,
                                    padding: '2px 4px',
                                    background: 'rgba(255, 152, 0, 0.15)',
                                    borderRadius: 3
                                }}>
                                    {/* skill_slot_buff 类型 */}
                                    {item.specialEffect.type === 'skill_slot_buff' && (
                                        <>
                                            ⚡ {item.specialEffect.slots.map(s => s + 1).join('/')}格
                                            {item.specialEffect.attackBonus ? ` 攻+${item.specialEffect.attackBonus}` : ''}
                                            {item.specialEffect.spellPowerBonus ? ` 法+${item.specialEffect.spellPowerBonus}` : ''}
                                        </>
                                    )}
                                    {/* basic_attack_repeat 类型 */}
                                    {item.specialEffect.type === 'basic_attack_repeat' && (
                                        <>
                                            ⚔️ 普攻 {(item.specialEffect.chance * 100).toFixed(0)}% 连击
                                        </>
                                    )}
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

                        // ✅ 每多一座 +10%
                        const multiplier = 1 + count * 0.1;

                        // ✅ 动态成本（向上取整）
                        const dynamicCost = {};
                        Object.entries(building.cost).forEach(([resource, amount]) => {
                            dynamicCost[resource] = Math.ceil(amount * multiplier);
                        });

                        // ✅ 按动态成本判断是否可建造
                        let canBuild = true;
                        Object.entries(dynamicCost).forEach(([resource, amount]) => {
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
                                    ×{count}</span>
                                </div>

                                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>
                                    <div style={{ marginBottom: 4 }}>
                                        成本: {Object.entries(dynamicCost).map(([r, a]) => `${r}:${a}`).join(', ')}
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

// ==================== WorldBossPage 修改 ====================
const WorldBossPage = ({ state, dispatch }) => {
    return (
        <Panel title="世界首领">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {Object.values(WORLD_BOSSES).map(boss => {
                    const bossData = BOSS_DATA[boss.id] || boss;
                    const unlocked = !boss.unlockLevel || state.characters.some(c => c.level >= (boss.unlockLevel || 0));

                    // 普瑞斯托女士特殊解锁条件
                    if (boss.id === 'prestor_lady' && !state.worldBossProgress?.prestor_lady) {
                        return null;
                    }

                    return (
                        <div key={boss.id} style={{
                            padding: 20,
                            background: unlocked
                                ? 'linear-gradient(135deg, rgba(180,50,50,0.2) 0%, rgba(80,20,20,0.3) 100%)'
                                : 'rgba(0,0,0,0.3)',
                            border: `2px solid ${unlocked ? '#a03030' : '#333'}`,
                            borderRadius: 12,
                            opacity: unlocked ? 1 : 0.5,
                            boxShadow: unlocked ? '0 4px 20px rgba(160,48,48,0.3)' : 'none'
                        }}>
                            {/* BOSS图片区域 */}
                            <div style={{
                                width: '100%',
                                height: 180,
                                background: 'linear-gradient(135deg, rgba(60,20,20,0.5) 0%, rgba(30,10,10,0.6) 100%)',
                                border: '2px solid rgba(180,50,50,0.4)',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16,
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)'
                            }}>
                                {boss.icon ? (
                                    <img
                                        src={boss.icon}
                                        alt={boss.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            filter: unlocked ? 'none' : 'grayscale(100%)'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        fontSize: 64,
                                        opacity: 0.6,
                                        filter: unlocked
                                            ? 'drop-shadow(0 0 15px rgba(255,100,100,0.5))'
                                            : 'grayscale(100%)'
                                    }}>
                                        {unlocked ? '🐲' : '🔒'}
                                    </div>
                                )}

                                {/* 锁定遮罩 */}
                                {!unlocked && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <span style={{ fontSize: 48 }}>🔒</span>
                                    </div>
                                )}

                                {/* 底部渐变 */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '40%',
                                    background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
                                    pointerEvents: 'none'
                                }} />
                            </div>

                            {/* BOSS名称 */}
                            <h3 style={{
                                textAlign: 'center',
                                color: unlocked ? '#ff6b6b' : '#666',
                                margin: '0 0 12px 0',
                                fontSize: 20,
                                textShadow: unlocked ? '0 0 10px rgba(255,107,107,0.5)' : 'none'
                            }}>
                                {boss.name}
                            </h3>

                            {/* BOSS属性预览 */}
                            {unlocked && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: 8,
                                    marginBottom: 16,
                                    padding: 10,
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: 6
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#888' }}>生命</div>
                                        <div style={{ fontSize: 12, color: '#f44336', fontWeight: 600 }}>
                                            {(bossData.maxHp || boss.hp)?.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#888' }}>攻击</div>
                                        <div style={{ fontSize: 12, color: '#ff9800', fontWeight: 600 }}>
                                            {bossData.attack || boss.attack}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#888' }}>防御</div>
                                        <div style={{ fontSize: 12, color: '#4CAF50', fontWeight: 600 }}>
                                            {bossData.defense || boss.defense}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 挑战按钮 / 解锁条件 */}
                            {unlocked ? (
                                <Button
                                    variant="danger"
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        fontSize: 14,
                                        fontWeight: 600
                                    }}
                                    onClick={() => dispatch({ type: 'OPEN_BOSS_PREPARE', payload: boss.id })}
                                >
                                    ⚔️ 挑战
                                </Button>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    color: '#666',
                                    padding: '10px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 6,
                                    fontSize: 12
                                }}>
                                    🔒 需要等级 {boss.unlockLevel || 0}
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
                    const bonusText = formatBonusText(achievement.reward);

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

                            {/* ✅ BONUS 展示（已解锁显示“已获得”，未解锁显示“奖励预览”也行） */}
                            {!!bonusText && (
                                <div style={{
                                    fontSize: 11,
                                    color: unlocked ? '#4CAF50' : '#9aa0a6',
                                    textAlign: 'center',
                                    padding: '6px 8px',
                                    background: unlocked ? 'rgba(76,175,80,0.10)' : 'rgba(255,255,255,0.04)',
                                    borderRadius: 6,
                                    border: unlocked ? '1px solid rgba(76,175,80,0.25)' : '1px solid rgba(255,255,255,0.08)',
                                    marginBottom: 8
                                }}>
                                    {unlocked ? `奖励：${bonusText}` : `奖励：${bonusText}`}
                                </div>
                            )}

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
    const [tab, setTab] = React.useState('equipment'); // 'equipment' | 'junk' | 'effects'

    const allowDrop = (id) => state.dropFilters?.[id] !== false;

    // ===== 装备图鉴 =====
    const allEquipTemplates = Object.values(FIXED_EQUIPMENTS);
    const equipCodexSet = new Set(state.codex || []);
    const lv100CodexSet = new Set(state.codexEquipLv100 || []);

    const hasLevel100 = (equipmentId) => {
        return lv100CodexSet.has(equipmentId);
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
                    🚫
                </div>
            )}
        </div>
    );

    // ===== 图鉴集齐效果渲染 =====
    const renderEffectsTab = () => {
        return (
            <div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
                    集齐指定区域的所有装备 Lv.100 图鉴后，全队永久获得对应加成
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {CODEX_SET_EFFECTS.map(effect => {
                        const collected = effect.equipIds.filter(id => lv100CodexSet.has(id)).length;
                        const total = effect.equipIds.length;
                        const isComplete = collected === total;
                        const progress = collected / total;

                        return (
                            <div
                                key={effect.id}
                                style={{
                                    padding: 16,
                                    background: isComplete
                                        ? `linear-gradient(135deg, ${effect.color}22, ${effect.color}11)`
                                        : 'rgba(0,0,0,0.3)',
                                    border: isComplete
                                        ? `2px solid ${effect.color}`
                                        : '1px solid #4a3c2a',
                                    borderRadius: 10,
                                    boxShadow: isComplete ? `0 0 20px ${effect.color}33` : 'none',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 10
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{
                                            fontSize: 20,
                                            filter: isComplete ? 'none' : 'grayscale(100%)',
                                            opacity: isComplete ? 1 : 0.5
                                        }}>
                                            {isComplete ? '✅' : '🔒'}
                                        </span>
                                        <span style={{
                                            fontSize: 16,
                                            fontWeight: 700,
                                            color: isComplete ? effect.color : '#888'
                                        }}>
                                            {effect.name}
                                        </span>
                                    </div>

                                    <span style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: isComplete ? '#4CAF50' : '#888',
                                        padding: '4px 10px',
                                        background: isComplete ? 'rgba(76,175,80,0.15)' : 'rgba(0,0,0,0.2)',
                                        borderRadius: 6,
                                        border: isComplete ? '1px solid rgba(76,175,80,0.3)' : '1px solid #333'
                                    }}>
                                        {collected}/{total}
                                    </span>
                                </div>

                                {/* 进度条 */}
                                <div style={{
                                    height: 6,
                                    background: 'rgba(0,0,0,0.4)',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    marginBottom: 10
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${progress * 100}%`,
                                        background: isComplete
                                            ? `linear-gradient(90deg, ${effect.color}, ${effect.color}cc)`
                                            : 'linear-gradient(90deg, #666, #888)',
                                        borderRadius: 3,
                                        transition: 'width 0.3s'
                                    }} />
                                </div>

                                {/* 效果描述 */}
                                <div style={{
                                    fontSize: 13,
                                    color: isComplete ? '#fff' : '#666',
                                    padding: '8px 12px',
                                    background: isComplete ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)',
                                    borderRadius: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}>
                                    <span style={{ color: effect.color, fontWeight: 700 }}>效果：</span>
                                    <span style={{
                                        color: isComplete ? '#ffd700' : '#666',
                                        fontWeight: isComplete ? 600 : 400
                                    }}>
                                        {effect.effect}
                                    </span>
                                    {isComplete && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            fontSize: 11,
                                            color: '#4CAF50',
                                            fontWeight: 700
                                        }}>
                                            生效中
                                        </span>
                                    )}
                                </div>

                                {/* 装备列表（折叠显示） */}
                                <details style={{ marginTop: 10 }}>
                                    <summary style={{
                                        cursor: 'pointer',
                                        fontSize: 11,
                                        color: '#888',
                                        outline: 'none'
                                    }}>
                                        查看装备列表
                                    </summary>
                                    <div style={{
                                        marginTop: 8,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 6
                                    }}>
                                        {effect.equipIds.map(id => {
                                            const tpl = FIXED_EQUIPMENTS[id];
                                            const has100 = lv100CodexSet.has(id);
                                            return (
                                                <span
                                                    key={id}
                                                    style={{
                                                        fontSize: 10,
                                                        padding: '3px 8px',
                                                        borderRadius: 4,
                                                        background: has100 ? 'rgba(76,175,80,0.2)' : 'rgba(0,0,0,0.3)',
                                                        border: has100 ? '1px solid rgba(76,175,80,0.5)' : '1px solid #333',
                                                        color: has100 ? '#4CAF50' : '#666'
                                                    }}
                                                >
                                                    {has100 ? '✓' : '○'} {tpl?.name || id}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </details>
                            </div>
                        );
                    })}
                </div>

                {/* 统计总览 */}
                <div style={{
                    marginTop: 20,
                    padding: 16,
                    background: 'rgba(201,162,39,0.1)',
                    border: '1px solid rgba(201,162,39,0.3)',
                    borderRadius: 10
                }}>
                    <div style={{ fontSize: 14, color: '#c9a227', fontWeight: 700, marginBottom: 10 }}>
                        📊 集齐进度总览
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {CODEX_SET_EFFECTS.map(effect => {
                            const collected = effect.equipIds.filter(id => lv100CodexSet.has(id)).length;
                            const total = effect.equipIds.length;
                            const isComplete = collected === total;
                            return (
                                <div key={effect.id} style={{
                                    fontSize: 12,
                                    color: isComplete ? effect.color : '#666'
                                }}>
                                    {isComplete ? '✅' : '⬜'} {effect.name}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Panel
            title="图鉴"
            actions={
                <div style={{ display: 'flex', gap: 8 }}>
                    <TabButton id="effects">⚡ 集齐效果</TabButton>
                    <TabButton id="equipment">🛡️ 装备</TabButton>
                    <TabButton id="junk">🧺 垃圾</TabButton>
                </div>
            }
        >
            {/* ===== 集齐效果 ===== */}
            {tab === 'effects' && renderEffectsTab()}

            {/* ===== 装备图鉴 ===== */}
            {tab === 'equipment' && (
                <>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                        ✅ 点亮：已获得过　|　✨ 金边：已达 Lv.100　|　点击切换掉落开关
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: 10
                    }}>
                        {allEquipTemplates.map((tpl) => {
                            const unlocked = equipCodexSet.has(tpl.id);
                            const lv100 = hasLevel100(tpl.id);

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
                                            <ItemIcon item={tpl} size={28} />
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
                                                Lv.100 ✨
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
                        ✅ 点亮：已获得过该垃圾　|　点击切换掉落开关
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
                                当前没有定义垃圾物品
                            </div>
                        )}
                    </div>
                </>
            )}
        </Panel>
    );
};

// ==================== Boss准备模态（重新设计版） ====================
const BossPrepareModal = ({ state, dispatch }) => {
    const bossId = state.prepareBoss;
    console.log('bossId:', bossId);
    console.log('BOSS_DATA:', BOSS_DATA);
    console.log('boss:', BOSS_DATA[bossId]);
    if (!bossId) return null;
    const boss = BOSS_DATA[bossId];
    const available = state.characters.filter(c => !state.assignments[c.id]);
    const [dragged, setDragged] = useState(null);

    // 计算队伍总属性
    const teamStats = state.bossTeam.filter(Boolean).reduce((acc, charId) => {
        const char = state.characters.find(c => c.id === charId);
        if (char) {
            acc.totalHp += char.stats.maxHp || 0;
            acc.totalAttack += char.stats.attack || 0;
            acc.totalSpellPower += char.stats.spellPower || 0;
            acc.count += 1;
        }
        return acc;
    }, { totalHp: 0, totalAttack: 0, totalSpellPower: 0, count: 0 });

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
        }}>
            <div style={{
                width: 1100,
                maxWidth: '95vw',
                maxHeight: '95vh',
                overflowY: 'auto',
                background: 'linear-gradient(180deg, #1a1208 0%, #0d0906 100%)',
                borderRadius: 16,
                border: '3px solid #8b6914',
                boxShadow: '0 0 60px rgba(139,105,20,0.4), inset 0 0 100px rgba(0,0,0,0.5)',
                position: 'relative'
            }}>
                {/* 顶部装饰条 */}
                <div style={{
                    height: 4,
                    background: 'linear-gradient(90deg, transparent, #c9a227, #ffd700, #c9a227, transparent)',
                    borderRadius: '16px 16px 0 0'
                }} />

                {/* 标题区域 */}
                <div style={{
                    textAlign: 'center',
                    padding: '20px 30px',
                    borderBottom: '1px solid rgba(201,162,39,0.2)',
                    background: 'linear-gradient(180deg, rgba(139,105,20,0.15) 0%, transparent 100%)'
                }}>
                    <div style={{
                        fontSize: 12,
                        color: '#888',
                        letterSpacing: 4,
                        marginBottom: 8
                    }}>
                        ⚔️ 世界首领挑战 ⚔️
                    </div>
                    <h2 style={{
                        margin: 0,
                        fontSize: 32,
                        color: '#ffd700',
                        textShadow: '0 0 20px rgba(255,215,0,0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontWeight: 700,
                        letterSpacing: 2
                    }}>
                        {boss.name}
                    </h2>
                </div>

                {/* 主体内容 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '320px 1fr',
                    gap: 0,
                    minHeight: 500
                }}>
                    {/* ==================== 左侧：BOSS信息区 ==================== */}
                    <div style={{
                        borderRight: '1px solid rgba(201,162,39,0.2)',
                        background: 'linear-gradient(180deg, rgba(80,20,20,0.2) 0%, rgba(40,10,10,0.3) 100%)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* BOSS图片区域 - 带边框装饰 */}
                        <div style={{
                            width: '100%',
                            aspectRatio: '1/1',
                            background: 'linear-gradient(135deg, rgba(100,30,30,0.3) 0%, rgba(40,10,10,0.5) 100%)',
                            border: '3px solid',
                            borderImage: 'linear-gradient(135deg, #8b3030, #4a1515, #8b3030) 1',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: `
        inset 0 0 40px rgba(0,0,0,0.5), 
        0 4px 20px rgba(0,0,0,0.4),
        0 0 30px rgba(139,48,48,0.3)
    `
                        }}>
                            {WORLD_BOSSES[bossId]?.icon ? (
                                <img
                                    src={WORLD_BOSSES[bossId].icon}
                                    alt={boss.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: 'contrast(1.1) saturate(1.1)'  // 让图片更鲜艳
                                    }}
                                />
                            ) : (
                                <div style={{
                                    fontSize: 80,
                                    opacity: 0.6,
                                    filter: 'drop-shadow(0 0 20px rgba(255,100,100,0.5))'
                                }}>
                                    🐲
                                </div>
                            )}

                            {/* 顶部渐变遮罩 - 让图片边缘更融合 */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '30%',
                                background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
                                pointerEvents: 'none'
                            }} />

                            {/* 底部渐变遮罩 */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '30%',
                                background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                                pointerEvents: 'none'
                            }} />

                            {/* 角落装饰 */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                border: '3px solid transparent',
                                borderImage: 'linear-gradient(45deg, #8b3030, transparent, transparent, #8b3030) 1',
                                pointerEvents: 'none'
                            }} />

                        </div>



                        {/* BOSS属性 */}
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 16,
                            border: '1px solid rgba(180,50,50,0.3)'
                        }}>
                            <div style={{
                                fontSize: 12,
                                color: '#ff6b6b',
                                fontWeight: 600,
                                marginBottom: 10,
                                textAlign: 'center',
                                borderBottom: '1px solid rgba(180,50,50,0.2)',
                                paddingBottom: 8
                            }}>
                                📊 首领属性
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: '#888' }}>❤️ 生命值</span>
                                    <span style={{ color: '#f44336', fontWeight: 600 }}>{boss.maxHp?.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: '#888' }}>⚔️ 攻击力</span>
                                    <span style={{ color: '#ff9800', fontWeight: 600 }}>{boss.attack}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: '#888' }}>🛡️ 防御力</span>
                                    <span style={{ color: '#4CAF50', fontWeight: 600 }}>{boss.defense}</span>
                                </div>
                            </div>
                        </div>

                        {/* BOSS技能说明 */}
                        <div style={{
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: 8,
                            padding: 12,
                            flex: 1,
                            border: '1px solid rgba(180,50,50,0.3)'
                        }}>
                            <div style={{
                                fontSize: 12,
                                color: '#ff6b6b',
                                fontWeight: 600,
                                marginBottom: 10,
                                textAlign: 'center',
                                borderBottom: '1px solid rgba(180,50,50,0.2)',
                                paddingBottom: 8
                            }}>
                                📜 技能机制
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {/* 霍格的技能 */}
                                {bossId === 'hogger' && (
                                    <>
                                        <div style={{
                                            padding: 10,
                                            background: 'rgba(255,100,100,0.1)',
                                            borderRadius: 6,
                                            borderLeft: '3px solid #f44336'
                                        }}>
                                            <div style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600, marginBottom: 4 }}>
                                                💥 重击
                                            </div>
                                            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
                                                对目标造成 <span style={{ color: '#ffd700' }}>{boss.heavyMultiplier}倍</span> 攻击的物理伤害
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: 10,
                                            background: 'rgba(156,39,176,0.1)',
                                            borderRadius: 6,
                                            borderLeft: '3px solid #9C27B0'
                                        }}>
                                            <div style={{ fontSize: 12, color: '#ce93d8', fontWeight: 600, marginBottom: 4 }}>
                                                👥 召唤小弟
                                            </div>
                                            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
                                                召唤 <span style={{ color: '#ffd700' }}>{boss.summonCount}</span> 个{boss.minion?.name || '小弟'}
                                                <br/>
                                                <span style={{ color: '#888' }}>
                            (HP:{boss.minion?.maxHp} / 攻击:{boss.minion?.attack})
                        </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* 范克里夫的技能 */}
                                {bossId === 'vancleef' && (
                                    <>
                                        <div style={{
                                            padding: 10,
                                            background: 'rgba(255,100,100,0.1)',
                                            borderRadius: 6,
                                            borderLeft: '3px solid #f44336'
                                        }}>
                                            <div style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600, marginBottom: 4 }}>
                                                ⚔️ 致死打击
                                            </div>
                                            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
                                                对目标造成 <span style={{ color: '#ffd700' }}>{boss.mortalStrikeMultiplier}倍</span> 攻击伤害
                                                <br/>
                                                <span style={{ color: '#ff6b6b' }}>
                            并降低目标受到治疗效果 {(boss.mortalStrikeDebuff?.healingReduction || 0.5) * 100}%，持续{boss.mortalStrikeDebuff?.duration || 2}回合
                        </span>
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: 10,
                                            background: 'rgba(156,39,176,0.1)',
                                            borderRadius: 6,
                                            borderLeft: '3px solid #9C27B0'
                                        }}>
                                            <div style={{ fontSize: 12, color: '#ce93d8', fontWeight: 600, marginBottom: 4 }}>
                                                🔫 火炮手准备！
                                            </div>
                                            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
                                                召唤 <span style={{ color: '#ffd700' }}>{boss.summonCount}</span> 个{boss.minion?.name || '火炮手'}
                                                <br/>
                                                <span style={{ color: '#888' }}>
                            (HP:{boss.minion?.maxHp} / 每回合对全队造成Boss攻击×{boss.minion?.aoeDamageMultiplier}伤害)
                        </span>
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: 10,
                                            background: 'rgba(33,150,243,0.1)',
                                            borderRadius: 6,
                                            borderLeft: '3px solid #2196F3'
                                        }}>
                                            <div style={{ fontSize: 12, color: '#64b5f6', fontWeight: 600, marginBottom: 4 }}>
                                                🛡️ 登上甲板！
                                            </div>
                                            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
                                                命令所有火炮手登上甲板
                                                <br/>
                                                <span style={{ color: '#2196F3' }}>
                            火炮手免疫任何伤害
                        </span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{
                                marginTop: 12,
                                padding: 10,
                                background: 'rgba(255,215,0,0.1)',
                                borderRadius: 6,
                                border: '1px dashed rgba(255,215,0,0.3)'
                            }}>
                                <div style={{ fontSize: 11, color: '#c9a227', fontWeight: 600, marginBottom: 4 }}>
                                    🔄 技能循环
                                </div>
                                <div style={{ fontSize: 11, color: '#888' }}>
                                    {bossId === 'hogger' && '召唤 → 重击 → 重击 → 重击 → 循环'}
                                    {bossId === 'vancleef' && '致死打击 → 火炮手准备 → 致死打击 → 登上甲板 → 循环'}
                                    {bossId !== 'hogger' && bossId !== 'vancleef' && (boss.cycle?.join(' → ') || '未知')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ==================== 右侧：队伍配置区 ==================== */}
                    <div style={{
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                    }}>
                        {/* 队伍配置 */}
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: 10,
                            padding: 16,
                            border: '1px solid rgba(201,162,39,0.2)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12
                            }}>
                                <div style={{
                                    fontSize: 14,
                                    color: '#c9a227',
                                    fontWeight: 600
                                }}>
                                    ⚔️ 队伍阵容
                                </div>
                                <div style={{
                                    fontSize: 11,
                                    color: '#888',
                                    padding: '4px 10px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: 4
                                }}>
                                    位置1优先受到攻击
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 12
                            }}>
                                {[0, 1, 2].map(slot => {
                                    const charId = state.bossTeam[slot];
                                    const char = charId ? state.characters.find(c => c.id === charId) : null;

                                    return (
                                        <div
                                            key={slot}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                if (dragged) {
                                                    dispatch({ type: 'SET_BOSS_TEAM_SLOT', payload: { slot, charId: dragged } });
                                                }
                                                setDragged(null);
                                            }}
                                            onDragOver={e => e.preventDefault()}
                                            style={{
                                                padding: 16,
                                                borderRadius: 10,
                                                minHeight: 120,
                                                background: char
                                                    ? 'linear-gradient(135deg, rgba(201,162,39,0.15) 0%, rgba(139,115,25,0.1) 100%)'
                                                    : 'rgba(0,0,0,0.3)',
                                                border: char
                                                    ? '2px solid rgba(201,162,39,0.5)'
                                                    : '2px dashed rgba(74,60,42,0.5)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s',
                                                cursor: 'default'
                                            }}
                                        >
                                            {/* 位置标签 */}
                                            <div style={{
                                                position: 'absolute',
                                                top: 8,
                                                left: 8,
                                                fontSize: 10,
                                                color: slot === 0 ? '#f44336' : '#888',
                                                fontWeight: 600,
                                                padding: '2px 6px',
                                                background: 'rgba(0,0,0,0.4)',
                                                borderRadius: 3
                                            }}>
                                                位置 {slot + 1} {slot === 0 && '(坦克位)'}
                                            </div>

                                            {char ? (
                                                <>
                                                    <div style={{
                                                        fontSize: 32,
                                                        marginBottom: 8
                                                    }}>
                                                        {char.classId === 'protection_warrior' ? '🛡️' :
                                                            char.classId === 'discipline_priest' ? '✝️' :
                                                                char.classId === 'frost_mage' ? '❄️' : '👤'}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 13,
                                                        color: '#ffd700',
                                                        fontWeight: 600,
                                                        marginBottom: 4
                                                    }}>
                                                        {char.name}
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#888' }}>
                                                        Lv.{char.level} {CLASSES[char.classId].name}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 10,
                                                        color: '#4CAF50',
                                                        marginTop: 4
                                                    }}>
                                                        HP: {char.stats.maxHp}
                                                    </div>

                                                    {/* 移除按钮 */}
                                                    <button
                                                        onClick={() => dispatch({
                                                            type: 'SET_BOSS_TEAM_SLOT',
                                                            payload: { slot, charId: null }
                                                        })}
                                                        style={{
                                                            position: 'absolute',
                                                            top: 8,
                                                            right: 8,
                                                            background: 'rgba(244,67,54,0.3)',
                                                            border: '1px solid rgba(244,67,54,0.5)',
                                                            borderRadius: 4,
                                                            color: '#f44336',
                                                            fontSize: 10,
                                                            padding: '2px 6px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{
                                                        fontSize: 32,
                                                        opacity: 0.3,
                                                        marginBottom: 8
                                                    }}>
                                                        ➕
                                                    </div>
                                                    <div style={{
                                                        fontSize: 11,
                                                        color: '#555',
                                                        textAlign: 'center'
                                                    }}>
                                                        拖拽角色到此处
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 队伍总属性 */}
                            {teamStats.count > 0 && (
                                <div style={{
                                    marginTop: 12,
                                    padding: 10,
                                    background: 'rgba(76,175,80,0.1)',
                                    borderRadius: 6,
                                    border: '1px solid rgba(76,175,80,0.2)',
                                    display: 'flex',
                                    justifyContent: 'space-around'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#888' }}>队伍总HP</div>
                                        <div style={{ fontSize: 14, color: '#4CAF50', fontWeight: 600 }}>
                                            {teamStats.totalHp.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#888' }}>总攻击</div>
                                        <div style={{ fontSize: 14, color: '#ff9800', fontWeight: 600 }}>
                                            {teamStats.totalAttack}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#888' }}>总法强</div>
                                        <div style={{ fontSize: 14, color: '#2196F3', fontWeight: 600 }}>
                                            {teamStats.totalSpellPower}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 可用角色列表 */}
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: 10,
                            padding: 16,
                            border: '1px solid rgba(201,162,39,0.2)',
                            flex: 1
                        }}>
                            <div style={{
                                fontSize: 14,
                                color: '#c9a227',
                                fontWeight: 600,
                                marginBottom: 12
                            }}>
                                👥 可用角色 <span style={{ color: '#888', fontWeight: 400 }}>（拖拽到上方队伍位置）</span>
                            </div>

                            {available.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: 30,
                                    color: '#555'
                                }}>
                                    没有可用角色（角色可能已被派遣到其他区域）
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                    gap: 10,
                                    maxHeight: 200,
                                    overflowY: 'auto',
                                    padding: 4
                                }}>
                                    {available.map(char => {
                                        const isInTeam = state.bossTeam.includes(char.id);
                                        return (
                                            <div
                                                key={char.id}
                                                draggable={!isInTeam}
                                                onDragStart={() => !isInTeam && setDragged(char.id)}
                                                style={{
                                                    padding: 12,
                                                    background: isInTeam
                                                        ? 'rgba(76,175,80,0.1)'
                                                        : 'rgba(0,0,0,0.3)',
                                                    border: isInTeam
                                                        ? '1px solid rgba(76,175,80,0.3)'
                                                        : '1px solid rgba(74,60,42,0.5)',
                                                    borderRadius: 8,
                                                    cursor: isInTeam ? 'default' : 'grab',
                                                    opacity: isInTeam ? 0.6 : 1,
                                                    transition: 'all 0.15s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10
                                                }}
                                            >
                                                <div style={{ fontSize: 24 }}>
                                                    {char.classId === 'protection_warrior' ? '🛡️' :
                                                        char.classId === 'discipline_priest' ? '✝️' :
                                                            char.classId === 'frost_mage' ? '❄️' : '👤'}
                                                </div>
                                                <div>
                                                    <div style={{
                                                        fontSize: 12,
                                                        color: isInTeam ? '#4CAF50' : '#ffd700',
                                                        fontWeight: 600
                                                    }}>
                                                        {char.name} {isInTeam && '✓'}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: '#888' }}>
                                                        Lv.{char.level} {CLASSES[char.classId].name}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* 战斗策略 */}
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: 10,
                            padding: 16,
                            border: '1px solid rgba(201,162,39,0.2)'
                        }}>
                            <div style={{
                                fontSize: 14,
                                color: '#c9a227',
                                fontWeight: 600,
                                marginBottom: 12
                            }}>
                                ⚙️ 战斗策略
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 16
                            }}>
                                {/* 攻击优先级 */}
                                <div style={{
                                    padding: 12,
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 8,
                                    border: '1px solid rgba(74,60,42,0.3)'
                                }}>
                                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                                        攻击优先级
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <label style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '8px 12px',
                                            background: state.bossStrategy.priorityBoss
                                                ? 'rgba(244,67,54,0.15)'
                                                : 'rgba(0,0,0,0.2)',
                                            border: state.bossStrategy.priorityBoss
                                                ? '1px solid rgba(244,67,54,0.4)'
                                                : '1px solid transparent',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontSize: 11
                                        }}>
                                            <input
                                                type="radio"
                                                name="priority"
                                                checked={state.bossStrategy.priorityBoss}
                                                onChange={() => dispatch({
                                                    type: 'SET_BOSS_STRATEGY',
                                                    payload: { key: 'priorityBoss', value: true }
                                                })}
                                            />
                                            <span style={{ color: state.bossStrategy.priorityBoss ? '#f44336' : '#888' }}>
                                                🎯 优先Boss
                                            </span>
                                        </label>
                                        <label style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '8px 12px',
                                            background: !state.bossStrategy.priorityBoss
                                                ? 'rgba(156,39,176,0.15)'
                                                : 'rgba(0,0,0,0.2)',
                                            border: !state.bossStrategy.priorityBoss
                                                ? '1px solid rgba(156,39,176,0.4)'
                                                : '1px solid transparent',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontSize: 11
                                        }}>
                                            <input
                                                type="radio"
                                                name="priority"
                                                checked={!state.bossStrategy.priorityBoss}
                                                onChange={() => dispatch({
                                                    type: 'SET_BOSS_STRATEGY',
                                                    payload: { key: 'priorityBoss', value: false }
                                                })}
                                            />
                                            <span style={{ color: !state.bossStrategy.priorityBoss ? '#ce93d8' : '#888' }}>
                                                👥 优先小弟
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* 站位选择 */}
                                <div style={{
                                    padding: 12,
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 8,
                                    border: '1px solid rgba(74,60,42,0.3)'
                                }}>
                                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                                        站位方式
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <label style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '8px 12px',
                                            background: state.bossStrategy.stance === 'concentrated'
                                                ? 'rgba(33,150,243,0.15)'
                                                : 'rgba(0,0,0,0.2)',
                                            border: state.bossStrategy.stance === 'concentrated'
                                                ? '1px solid rgba(33,150,243,0.4)'
                                                : '1px solid transparent',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontSize: 11
                                        }}>
                                            <input
                                                type="radio"
                                                name="stance"
                                                checked={state.bossStrategy.stance === 'concentrated'}
                                                onChange={() => dispatch({
                                                    type: 'SET_BOSS_STRATEGY',
                                                    payload: { key: 'stance', value: 'concentrated' }
                                                })}
                                            />
                                            <span style={{ color: state.bossStrategy.stance === 'concentrated' ? '#64b5f6' : '#888' }}>
                                                📍 集中站位
                                            </span>
                                        </label>
                                        <label style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '8px 12px',
                                            background: state.bossStrategy.stance === 'dispersed'
                                                ? 'rgba(76,175,80,0.15)'
                                                : 'rgba(0,0,0,0.2)',
                                            border: state.bossStrategy.stance === 'dispersed'
                                                ? '1px solid rgba(76,175,80,0.4)'
                                                : '1px solid transparent',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontSize: 11
                                        }}>
                                            <input
                                                type="radio"
                                                name="stance"
                                                checked={state.bossStrategy.stance === 'dispersed'}
                                                onChange={() => dispatch({
                                                    type: 'SET_BOSS_STRATEGY',
                                                    payload: { key: 'stance', value: 'dispersed' }
                                                })}
                                            />
                                            <span style={{ color: state.bossStrategy.stance === 'dispersed' ? '#81c784' : '#888' }}>
                                                🔀 分散站位
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 底部按钮区 */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(201,162,39,0.2)',
                    background: 'linear-gradient(180deg, transparent, rgba(139,105,20,0.1))',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 16
                }}>
                    <Button
                        onClick={() => dispatch({ type: 'START_BOSS_COMBAT' })}
                        disabled={teamStats.count === 0}
                        style={{
                            padding: '12px 40px',
                            fontSize: 16,
                            fontWeight: 700
                        }}
                    >
                        ⚔️ 开始战斗
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => dispatch({ type: 'CLOSE_BOSS_PREPARE' })}
                        style={{
                            padding: '12px 30px'
                        }}
                    >
                        取消
                    </Button>
                </div>

                {/* 底部装饰条 */}
                <div style={{
                    height: 4,
                    background: 'linear-gradient(90deg, transparent, #c9a227, #ffd700, #c9a227, transparent)',
                    borderRadius: '0 0 16px 16px'
                }} />
            </div>
        </div>
    );
};

// ==================== Boss战斗显示模态 ====================
// ==================== Boss战斗显示模态 ====================
const BossCombatModal = ({ combat, state }) => {
    if (!combat) return null;
    const boss = BOSS_DATA[combat.bossId];
    if (!boss) return null;

    const minionConfig = boss.minion || { name: '小弟', maxHp: 100 };
    const minionName = minionConfig.name || '小弟';

    return (
        <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 1200,
            height: '90%',
            background: 'rgba(20,10,10,0.98)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            border: '4px solid #c9a227',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(201,162,39,0.6)'
        }}>
            <div style={{ padding: 16, textAlign: 'center', color: '#ffd700', fontSize: 24 }}>
                正在挑战 {boss.name} - 第 {combat.round} 回合
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: 20, flex: 1, overflow: 'hidden' }}>
                {/* 左侧：队伍 */}
                <div style={{ overflowY: 'auto' }}>
                    <h3 style={{ color: '#4CAF50', marginBottom: 12 }}>队伍</h3>
                    {combat.playerStates.map((p, i) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 14, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                                <span>位置{i + 1} {p.char.name} Lv.{p.char.level}</span>
                                {/* 显示减疗debuff */}
                                {p.debuffs?.mortalStrike && (
                                    <span style={{
                                        color: '#ff6b6b',
                                        fontSize: 11,
                                        padding: '2px 6px',
                                        background: 'rgba(255,100,100,0.2)',
                                        borderRadius: 4
                                    }}>
                                        减疗 {p.debuffs.mortalStrike.healingReduction * 100}% ({p.debuffs.mortalStrike.duration}回合)
                                    </span>
                                )}
                            </div>
                            <StatBar
                                label="生命值"
                                current={p.currentHp}
                                max={p.char.stats.maxHp}
                                color="#f44336"
                            />
                        </div>
                    ))}
                </div>

                {/* 右侧：敌人 */}
                <div style={{ overflowY: 'auto' }}>
                    <h3 style={{ color: '#f44336', marginBottom: 12 }}>敌人</h3>

                    {/* Boss血条 */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 14, marginBottom: 4 }}>{boss.name}</div>
                        <StatBar
                            label="生命值"
                            current={combat.bossHp}
                            max={boss.maxHp}
                            color="#ff4444"
                        />
                    </div>

                    {/* 小弟/火炮手血条 */}
                    {combat.minions && combat.minions.length > 0 && (
                        <div>
                            <div style={{ fontSize: 14, marginBottom: 8, color: '#ce93d8' }}>
                                {minionName} ({combat.minions.length}个)
                            </div>
                            {combat.minions.map((m, i) => (
                                <div key={i} style={{ marginBottom: 8 }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 4
                                    }}>
                                        <span style={{ fontSize: 12, color: '#aaa' }}>
                                            {minionName} {i + 1}
                                        </span>
                                        {/* 显示免疫状态 */}
                                        {m.immune && (
                                            <span style={{
                                                fontSize: 10,
                                                color: '#2196F3',
                                                padding: '2px 6px',
                                                background: 'rgba(33,150,243,0.2)',
                                                borderRadius: 4,
                                                fontWeight: 600
                                            }}>
                                                🛡️ 免疫中
                                            </span>
                                        )}
                                    </div>
                                    <StatBar
                                        label="生命值"
                                        current={m.hp}
                                        max={m.maxHp || minionConfig.maxHp}
                                        color={m.immune ? "#2196F3" : "#ff6666"}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 战斗日志 */}
            <div style={{
                height: 200,
                overflowY: 'auto',
                padding: 16,
                background: 'rgba(0,0,0,0.5)',
                fontSize: 12,
                borderTop: '1px solid rgba(201,162,39,0.3)'
            }}>
                {combat.logs.slice(-30).map((log, i) => (
                    <div key={i} style={{
                        padding: '2px 0',
                        color: log.includes('免疫') ? '#2196F3' :
                            log.includes('致死打击') ? '#ff6b6b' :
                                log.includes('火炮手') ? '#ce93d8' :
                                    log.includes('登上甲板') ? '#64b5f6' :
                                        '#ccc'
                    }}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==================== 霍格剧情模态框 ====================
const HoggerPlotModal = ({ state, dispatch }) => {
    if (!state.showHoggerPlot) return null;
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ width: 600, padding: 40, background: '#1a1510', border: '3px solid #c9a227', borderRadius: 12, textAlign: 'center' }}>
                <h2 style={{ color: '#ffd700', marginBottom: 30 }}>轮回之始</h2>
                <p style={{ fontSize: 16, lineHeight: 1.8, color: '#e8dcc4' }}>
                    你感到一阵头晕目眩，过往的种种白驹过隙，熟悉的感觉涌上心头，仿佛这已经是你无数次击败过的对手，<br/>
                    这一世你击败了强劲的对手霍格，三十年河东三十年河西，莫欺少年穷。
                </p>
                <Button onClick={() => dispatch({ type: 'CLOSE_HOGGER_PLOT' })} style={{ marginTop: 30 }}>
                    确定
                </Button>
            </div>
        </div>
    );
};

// ==================== 重生确认模态框 ====================
const RebirthConfirmModal = ({ state, dispatch }) => {
    if (!state.showRebirthConfirm) return null;
    const equippedCount = state.characters.reduce((s, c) => s + Object.values(c.equipment || {}).filter(Boolean).length, 0);
    const spaceNeeded = state.inventory.length + equippedCount > state.inventorySize;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ width: 500, padding: 30, background: '#1a1510', border: '3px solid #ff6b6b', borderRadius: 12 }}>
                <h2 style={{ color: '#ff6b6b', textAlign: 'center' }}>重生轮回确认</h2>
                <p style={{ lineHeight: 1.6, margin: '20px 0' }}>
                    重生轮回将重置王国的建筑、资源、研究等级以及角色，<br/>
                    但道具栏和装备会保留。<br/><br/>
                    {spaceNeeded ?
                        <span style={{ color: '#ff6b6b' }}>⚠️ 背包空间不足，无法容纳所有装备！</span> :
                        `需要 ${equippedCount} 个背包空格存放当前装备。`
                    }
                </p>
                <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                    <Button onClick={() => dispatch({ type: 'PERFORM_REBIRTH' })} variant="danger" disabled={spaceNeeded}>
                        确认重生
                    </Button>
                    <Button onClick={() => dispatch({ type: 'CLOSE_REBIRTH_CONFIRM' })} variant="secondary">
                        取消
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ==================== 重生剧情模态框 ====================
const RebirthPlotModal = ({ state, dispatch }) => {
    if (!state.showRebirthPlot) return null;
    const p = state.showRebirthPlot;
    const bossNames = (p.defeatedBosses || []).map(id => {
        const names = { hogger: '霍格', vancleef: '范克里夫' ,prestor_lady:'普瑞斯托女士'};
        return names[id] || id;
    });
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ width: 700, padding: 40, background: '#1a1510', border: '4px solid #ffd700', borderRadius: 16, textAlign: 'center' }}>
                <h2 style={{ color: '#ffd700', marginBottom: 30 }}>第 {p.rebirthCount} 世</h2>
                <p style={{ fontSize: 18, lineHeight: 2, color: '#e8dcc4' }}>
                    你眼前一黑，上一世经历了 {p.frame} 帧的努力，
                    {bossNames.length > 0 ? `击败了${bossNames.join('、')}，` : ''}
                    最高等级达到 Lv.{p.maxLevel || 0}。<br/>
                    这一世，你获得了 {p.newExp}% 经验值、{p.newGold}% 金币、{p.newDrop}% 掉落、<br/>
                    {p.newResearch}% 研究速度增幅，并获得了羁绊「{p.newBond}」。<br/><br/>
                    你缓缓睁开双眼，<br/>
                    这是你经历的第 {p.rebirthCount} 世，这一世你感到全身充满了力量，fighting!
                </p>
                <Button onClick={() => dispatch({ type: 'CLOSE_REBIRTH_PLOT' })} style={{ marginTop: 40, padding: '12px 40px', fontSize: 18 }}>
                    开始新的一世
                </Button>
            </div>
        </div>
    );
};

// ==================== 本世重生加成模态框 ====================
const RebirthBonusModal = ({ state, onClose }) => {
    const bonuses = state.rebirthBonuses || { exp: 0, gold: 0, drop: 0, researchSpeed: 0 };
    const bonds = state.rebirthBonds || [];
    const rebirthCount = state.rebirthCount || 0;

    // 羁绊详细信息
    const BOND_DETAILS = {
        baoernai: {
            name: '包二奶',
            description: '队伍中有1个防护战士和2个戒律牧师时，每回合战士对所有敌人造成格挡值80%的额外伤害'
        },
        jianyue: {
            name: '简约而不简单',
            description: '队伍全为同一职业时，普通攻击伤害提高150%'
        }
    };

    // 所有可能的羁绊池
    const ALL_BONDS = ['baoernai', 'jianyue'];

    // Boss加成配置
    const BOSS_BONUS_CONFIG = {
        hogger: { name: '霍格', bonus: 0.05 },
        vancleef: { name: '范克里夫', bonus: 0.10 },
        prestor_lady:{ name: '普瑞斯托女士', bonus: 0.25 },
    };

    // 去重后的已获得羁绊
    const uniqueBonds = [...new Set(bonds)];

    // ==================== 计算预测加成（新公式） ====================
    // 帧数加成：对数函数，3600帧→10%, 36000帧→20%, 86400帧→30%
    const frame = state.lifeFrame || 0;
    const frameBonus = frame >= 360 ? 0.1 * Math.log10(frame / 360) : 0;

    // 等级加成：每级0.2%
    const maxLevel = state.characters.reduce((m, c) => Math.max(m, c.level || 0), 0);
    const levelBonus = maxLevel * 0.002;

    // Boss加成
    const defeatedBosses = state.defeatedBosses || [];
    const totalBossBonus = defeatedBosses.reduce((sum, bossId) => sum + (BOSS_BONUS_CONFIG[bossId]?.bonus || 0), 0);

    // 总预测加成
    const predictedExp = frameBonus + levelBonus + totalBossBonus;
    const predictedGold = predictedExp;
    const predictedDrop = predictedExp * 0.6;
    const predictedResearch = predictedExp * 0.5;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }} onClick={onClose}>
            <div style={{
                width: 680,
                maxHeight: '85vh',
                overflowY: 'auto',
                padding: 30,
                background: 'linear-gradient(135deg, #1a1510 0%, #0d0a07 100%)',
                border: '3px solid #c9a227',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(201,162,39,0.3)'
            }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{
                    color: '#ffd700',
                    textAlign: 'center',
                    marginBottom: 24,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}>
                    ⚡ 轮回加成总览
                </h2>

                {/* 重生次数 */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: 24,
                    padding: '12px 20px',
                    background: 'rgba(201,162,39,0.15)',
                    borderRadius: 8,
                    border: '1px solid rgba(201,162,39,0.3)'
                }}>
                    <span style={{ color: '#c9a227', fontSize: 14 }}>已轮回 </span>
                    <span style={{ color: '#ffd700', fontSize: 24, fontWeight: 700 }}>{rebirthCount}</span>
                    <span style={{ color: '#c9a227', fontSize: 14 }}> 世</span>
                </div>

                {/* 当前生效加成（来自上一世） */}
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                    border: '1px solid #4a3c2a'
                }}>
                    <h3 style={{ color: '#c9a227', fontSize: 14, marginBottom: 12, borderBottom: '1px solid rgba(201,162,39,0.2)', paddingBottom: 8 }}>
                        📊 当前生效加成（来自上一世）
                    </h3>
                    {rebirthCount === 0 ? (
                        <div style={{ color: '#666', textAlign: 'center', padding: 12, fontSize: 13 }}>
                            尚未轮回，暂无生效加成
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(76,175,80,0.1)', borderRadius: 6, border: '1px solid rgba(76,175,80,0.3)' }}>
                                <span style={{ color: '#888' }}>⭐ 经验值</span>
                                <span style={{ color: '#4CAF50', fontWeight: 600 }}>+{(bonuses.exp * 100).toFixed(1)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,215,0,0.1)', borderRadius: 6, border: '1px solid rgba(255,215,0,0.3)' }}>
                                <span style={{ color: '#888' }}>🪙 金币</span>
                                <span style={{ color: '#ffd700', fontWeight: 600 }}>+{(bonuses.gold * 100).toFixed(1)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(163,51,238,0.1)', borderRadius: 6, border: '1px solid rgba(163,51,238,0.3)' }}>
                                <span style={{ color: '#888' }}>📦 掉落</span>
                                <span style={{ color: '#a335ee', fontWeight: 600 }}>+{(bonuses.drop * 100).toFixed(1)}%</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,112,221,0.1)', borderRadius: 6, border: '1px solid rgba(0,112,221,0.3)' }}>
                                <span style={{ color: '#888' }}>🔬 研究速度</span>
                                <span style={{ color: '#0070dd', fontWeight: 600 }}>+{(bonuses.researchSpeed * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 预测：如果现在重生能获得的加成 */}
                <div style={{
                    background: 'rgba(255,107,107,0.1)',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                    border: '1px solid rgba(255,107,107,0.3)'
                }}>
                    <h3 style={{ color: '#ff6b6b', fontSize: 14, marginBottom: 12, borderBottom: '1px solid rgba(255,107,107,0.2)', paddingBottom: 8 }}>
                        🔮 若此刻重生，下一世将获得
                    </h3>

                    {/* 当前进度明细 */}
                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: 6,
                        padding: 12,
                        marginBottom: 12,
                        fontSize: 12
                    }}>
                        <div style={{ color: '#888', marginBottom: 8 }}>本世进度：</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            <div>
                                <span style={{ color: '#666' }}>帧数：</span>
                                <span style={{ color: '#ffd700' }}>{Math.floor(frame)}</span>
                                <span style={{ color: '#4CAF50', marginLeft: 4 }}>→ +{(frameBonus * 100).toFixed(1)}%</span>
                            </div>
                            <div>
                                <span style={{ color: '#666' }}>最高等级：</span>
                                <span style={{ color: '#ffd700' }}>Lv.{maxLevel}</span>
                                <span style={{ color: '#4CAF50', marginLeft: 4 }}>→ +{(levelBonus * 100).toFixed(1)}%</span>
                            </div>
                            <div>
                                <span style={{ color: '#666' }}>Boss击杀：</span>
                                <span style={{ color: '#ffd700' }}>{defeatedBosses.length}个</span>
                                <span style={{ color: '#4CAF50', marginLeft: 4 }}>→ +{(totalBossBonus * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                        {defeatedBosses.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {defeatedBosses.map(bossId => (
                                    <span key={bossId} style={{
                                        padding: '2px 6px',
                                        background: 'rgba(255,107,107,0.2)',
                                        borderRadius: 3,
                                        fontSize: 10,
                                        color: '#ff6b6b'
                                    }}>
                                        ✓ {BOSS_BONUS_CONFIG[bossId]?.name || bossId}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 预测加成数值 */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                            <span style={{ color: '#888', fontSize: 12 }}>⭐ 经验值</span>
                            <span style={{ color: '#4CAF50', fontWeight: 600, fontSize: 12 }}>+{(predictedExp * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                            <span style={{ color: '#888', fontSize: 12 }}>🪙 金币</span>
                            <span style={{ color: '#ffd700', fontWeight: 600, fontSize: 12 }}>+{(predictedGold * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                            <span style={{ color: '#888', fontSize: 12 }}>📦 掉落</span>
                            <span style={{ color: '#a335ee', fontWeight: 600, fontSize: 12 }}>+{(predictedDrop * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                            <span style={{ color: '#888', fontSize: 12 }}>🔬 研究速度</span>
                            <span style={{ color: '#0070dd', fontWeight: 600, fontSize: 12 }}>+{(predictedResearch * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* 羁绊池 */}
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,215,0,0.1)', borderRadius: 6, border: '1px dashed rgba(255,215,0,0.3)' }}>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>羁绊：随机获得以下之一（同一羁绊只生效一次）</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {ALL_BONDS.map(bondId => {
                                const owned = uniqueBonds.includes(bondId);
                                return (
                                    <span key={bondId} style={{
                                        padding: '3px 8px',
                                        background: owned ? 'rgba(102,102,102,0.3)' : 'rgba(201,162,39,0.2)',
                                        borderRadius: 4,
                                        fontSize: 11,
                                        color: owned ? '#666' : '#ffd700',
                                        textDecoration: owned ? 'line-through' : 'none'
                                    }}>
                                        {BOND_DETAILS[bondId]?.name || bondId}{owned ? '（已有）' : ''}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* 提示：加成不叠加 */}
                    <div style={{ marginTop: 10, fontSize: 11, color: '#888', textAlign: 'center' }}>
                        ⚠️ 重生后，上述加成将<span style={{ color: '#ff6b6b' }}>替换</span>当前生效加成（不叠加）
                    </div>
                </div>

                {/* 已获得羁绊列表 */}
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                    border: '1px solid #4a3c2a'
                }}>
                    <h3 style={{ color: '#c9a227', fontSize: 14, marginBottom: 12, borderBottom: '1px solid rgba(201,162,39,0.2)', paddingBottom: 8 }}>
                        🔗 已获得羁绊 ({uniqueBonds.length}/{ALL_BONDS.length})
                    </h3>
                    {uniqueBonds.length === 0 ? (
                        <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>
                            暂无羁绊
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {uniqueBonds.map(bondId => {
                                const detail = BOND_DETAILS[bondId] || { name: bondId, description: '未知羁绊' };
                                return (
                                    <div key={bondId} style={{
                                        padding: 12,
                                        background: 'linear-gradient(135deg, rgba(201,162,39,0.1), rgba(139,115,25,0.05))',
                                        borderRadius: 6,
                                        border: '1px solid rgba(201,162,39,0.3)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ color: '#ffd700', fontWeight: 600 }}>
                                                ✓ {detail.name}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#4CAF50' }}>生效中</span>
                                        </div>
                                        <div style={{ color: '#aaa', fontSize: 12, lineHeight: 1.5 }}>
                                            {detail.description}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 羁绊池一览 */}
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    padding: 16,
                    border: '1px solid #4a3c2a'
                }}>
                    <h3 style={{ color: '#c9a227', fontSize: 14, marginBottom: 12, borderBottom: '1px solid rgba(201,162,39,0.2)', paddingBottom: 8 }}>
                        📜 羁绊池一览
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ALL_BONDS.map(bondId => {
                            const detail = BOND_DETAILS[bondId] || { name: bondId, description: '未知羁绊' };
                            const owned = uniqueBonds.includes(bondId);
                            return (
                                <div key={bondId} style={{
                                    padding: 10,
                                    background: owned ? 'rgba(76,175,80,0.1)' : 'rgba(0,0,0,0.2)',
                                    borderRadius: 6,
                                    border: owned ? '1px solid rgba(76,175,80,0.3)' : '1px solid rgba(74,60,42,0.5)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ color: owned ? '#4CAF50' : '#888', fontWeight: 600, fontSize: 13 }}>
                                            {owned ? '✓ ' : ''}{detail.name}
                                        </span>
                                        {owned && (
                                            <span style={{ fontSize: 11, color: '#4CAF50' }}>已获得</span>
                                        )}
                                    </div>
                                    <div style={{ color: '#777', fontSize: 11, lineHeight: 1.4 }}>
                                        {detail.description}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Button onClick={onClose} variant="secondary">
                        关闭
                    </Button>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN APP ====================
export default function WoWIdleGame() {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [consoleOpen, setConsoleOpen] = useState(false);
    const [command, setCommand] = useState('');
    const [consoleLogs, setConsoleLogs] = useState([]);
    const [isPaused, setIsPaused] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [importData, setImportData] = useState('');
    const [showRebirthBonus, setShowRebirthBonus] = useState(false);
    const intervalRef = useRef(null);
    const saveIntervalRef = useRef(null);

    const lastTickRef = useRef(Date.now());
    const hiddenAtRef = useRef(null);

    // 按 ` 键开关控制台
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '`') {
                e.preventDefault();
                setConsoleOpen(prev => !prev);
                setCommand(''); // 打开时清空输入
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const onVisChange = () => {
            if (document.hidden) {
                // 切走：记录隐藏开始时间
                hiddenAtRef.current = Date.now();
                return;
            }

            // 切回：计算离开秒数
            const hiddenAt = hiddenAtRef.current;
            hiddenAtRef.current = null;
            if (!hiddenAt) return;

            const deltaSeconds = Math.floor((Date.now() - hiddenAt) / 1000);
            if (deltaSeconds <= 0) return;

            // ✅ 补一发 tick
            dispatch({ type: "TICK", payload: { deltaSeconds } });

            // ✅ 关键：同步 lastTickRef，防止 interval 下一次又用旧的 lastTickRef 再补一遍
            if (lastTickRef?.current != null) {
                lastTickRef.current = Date.now();
            }
        };

        document.addEventListener("visibilitychange", onVisChange);
        return () => document.removeEventListener("visibilitychange", onVisChange);
    }, [dispatch]); // lastTickRef 是 ref，不用放依赖

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

    const executeCommand = (cmd) => {
        const trimmed = cmd.trim();
        if (!trimmed) return;

        setConsoleLogs(prev => [...prev, `> ${trimmed}`]);

        const parts = trimmed.split(' ');
        const mainCmd = parts[0].toLowerCase();

        if (mainCmd === 'add') {
            const subCmd = parts[1]?.toLowerCase();

            if (subCmd === 'gold' && parts[2]) {
                const amount = parseFloat(parts[2]);
                if (!isNaN(amount) && amount > 0) {
                    dispatch({ type: 'CHEAT_ADD_GOLD', payload: amount });
                    setConsoleLogs(prev => [...prev, `✓ 成功添加 ${amount} 金币`]);
                } else {
                    setConsoleLogs(prev => [...prev, '✗ 错误：金币数量必须是正数']);
                }
            }
            else if (subCmd === 'equip' && parts[2]) {
                const equipArg = parts[2];
                const [idRaw, levelStr] = equipArg.split(',');
                if (!idRaw) {
                    setConsoleLogs(prev => [...prev, '✗ 错误：装备ID不能为空']);
                    return;
                }

                const id = idRaw.trim().toUpperCase();
                const level = parseInt(levelStr?.trim()) || 1;
                const clampedLevel = Math.max(1, Math.min(100, level));

                const tpl = FIXED_EQUIPMENTS[id];
                if (!tpl) {
                    setConsoleLogs(prev => [...prev, `✗ 错误：找不到装备 ID "${id}"`]);
                    return;
                }

                const instance = {
                    ...tpl,
                    instanceId: `cheat_${Date.now()}_${Math.random().toString(36)}`,
                    qualityColor: getRarityColor(tpl.rarity),
                    currentLevel: clampedLevel,
                    stats: scaleStats(tpl.baseStats, tpl.growth, clampedLevel)
                };

                dispatch({ type: 'CHEAT_ADD_EQUIPMENT', payload: instance });
                setConsoleLogs(prev => [...prev, `✓ 成功添加 ${tpl.name} (ID: ${id}) Lv.${clampedLevel}`]);

                if (clampedLevel >= 100) {
                    dispatch({ type: 'CHEAT_ADD_LV100_CODEX', payload: id });
                }
            }
            else if (subCmd === 'bagslot' && parts[2]) {
                const amount = parseInt(parts[2]);
                if (!isNaN(amount) && amount > 0) {
                    dispatch({ type: 'CHEAT_ADD_BAGSLOT', payload: amount });
                    setConsoleLogs(prev => [...prev, `✓ 成功增加 ${amount} 个背包栏位（当前总栏位：${state.inventorySize + amount}）`]);
                } else {
                    setConsoleLogs(prev => [...prev, '✗ 错误：栏位数量必须是正整数']);
                }
            }
            // ===== 新增：add exp =====
            else if (subCmd === 'exp' && parts[2]) {
                const expArg = parts[2];
                const [amountStr, indexStr] = expArg.split(',');
                const amount = parseInt(amountStr?.trim());
                const index1Based = parseInt(indexStr?.trim());

                if (isNaN(amount) || amount <= 0) {
                    setConsoleLogs(prev => [...prev, '✗ 错误：经验值必须是正整数']);
                    return;
                }
                if (isNaN(index1Based) || index1Based < 1 || index1Based > state.characters.length) {
                    setConsoleLogs(prev => [...prev, `✗ 错误：角色索引无效（当前有 ${state.characters.length} 个角色，索引范围 1~${state.characters.length}）`]);
                    return;
                }

                const charIndex = index1Based - 1; // 转为0-based索引
                dispatch({ type: 'CHEAT_ADD_EXP', payload: { amount, charIndex } });
                const char = state.characters[charIndex];
                setConsoleLogs(prev => [...prev, `✓ 成功给 ${char.name} (第${index1Based}个角色) 添加 ${amount} 经验`]);
            }
            else {
                setConsoleLogs(prev => [...prev, '✗ 用法：']);
                setConsoleLogs(prev => [...prev, '   add gold <数量>']);
                setConsoleLogs(prev => [...prev, '   add equip <装备ID>,<等级>（等级可选）']);
                setConsoleLogs(prev => [...prev, '   add bagslot <数量>']);
                setConsoleLogs(prev => [...prev, '   add exp <经验值>,<角色索引>（索引从1开始）']);
                setConsoleLogs(prev => [...prev, '   示例：add exp 99999,1']);
            }
        }
        else {
            setConsoleLogs(prev => [...prev, '✗ 未知命令，目前仅支持 add gold / add equip / add bagslot / add exp']);
        }

        setCommand('');
    };

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
        { id: 'talent', name: '天赋', icon: '🌟' },
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
            case 'talent': return <TalentPage state={state} dispatch={dispatch} />;
            case 'inventory': return <InventoryPage state={state} dispatch={dispatch} />;
            case 'city': return <CityPage state={state} dispatch={dispatch} />;
            case 'research': return <ResearchPage state={state} dispatch={dispatch} />;
            case 'worldboss': return <WorldBossPage state={state} dispatch={dispatch}/>;
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

            {/* ===== 添加两个Boss模态 ===== */}
            {state.prepareBoss && <BossPrepareModal state={state} dispatch={dispatch} />}
            {state.bossCombat && <BossCombatModal combat={state.bossCombat} state={state} />}

            <HoggerPlotModal state={state} dispatch={dispatch} />
            <RebirthConfirmModal state={state} dispatch={dispatch} />
            {state.showRebirthPlot && <RebirthPlotModal state={state} dispatch={dispatch} />}
            {showRebirthBonus && <RebirthBonusModal state={state} onClose={() => setShowRebirthBonus(false)} />}

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
                        ⚔️ 艾泽拉斯万世轮回
                    </h1>
                    <span style={{
                        padding: '4px 12px',
                        background: 'rgba(201,162,39,0.2)',
                        borderRadius: 4,
                        fontSize: 12,
                        color: '#c9a227',
                    }}>
            本世帧: {Math.floor(state.lifeFrame || 0)} ｜ 总帧: {Math.floor(state.frame)}
          </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#888' }}>🪙 {Math.floor(state.resources.gold)}</span>
                    </div>

                    <Button onClick={() => setShowRebirthBonus(true)} variant="secondary" style={{ padding: '6px 10px', fontSize: 11 }}>
                        ⚡ 轮回加成
                    </Button>

                    {state.rebirthUnlocked && (
                        <Button onClick={() => dispatch({ type: 'OPEN_REBIRTH_CONFIRM' })} variant="danger">
                            重生轮回
                        </Button>
                    )}

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

            {/* 开发者控制台 */}
            {consoleOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.95)',
                    borderTop: '2px solid #0f0',
                    padding: '10px',
                    zIndex: 9999,
                    fontFamily: 'monospace',
                    color: '#0f0',
                    maxHeight: '40vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        marginBottom: '8px',
                        paddingRight: '8px'
                    }}>
                        {consoleLogs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                    <input
                        autoFocus
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                executeCommand(command);
                            }
                        }}
                        placeholder="输入命令，按 Enter 执行，按 ` 关闭"
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: '1px solid #0f0',
                            color: '#0f0',
                            padding: '8px',
                            fontFamily: 'monospace',
                            outline: 'none'
                        }}
                    />
                </div>
            )}
        </div>
    );
}
