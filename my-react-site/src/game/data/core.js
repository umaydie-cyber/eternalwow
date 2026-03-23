export const RACES = ['人类', '矮人', '暗夜精灵', '侏儒', '兽人', '巨魔', '牛头人', '亡灵'];

export const BOSS_BONUS_CONFIG = {
    hogger: { name: '霍格', bonus: 0.05 },
    vancleef: { name: '范克里夫', bonus: 0.10 },
    prestor_lady: { name: '普瑞斯托女士', bonus: 0.15 },
    thalnos: { name: '裂魂者萨尔诺斯', bonus: 0.15 },
    dagran_thaurissan: { name: '达格兰·索瑞森大帝', bonus: 0.15 },
    darkmaster_gandling: { name: '黑暗院长加丁', bonus: 0.20 },
    baron_rivendare: { name: '瑞文戴尔男爵', bonus: 0.20 },
    rend_blackhand: { name: '雷德黑手', bonus: 0.20 },
    hakkar: { name: '血神哈卡', bonus: 0.25 },
    ossirian: { name: '无疤者奥斯里安', bonus: 0.25 },
    garr: { name: '加尔', bonus: 0.25 },
    baron_geddon: { name: '迦顿男爵', bonus: 0.25 },
    golemagg: { name: '焚化者古雷曼格', bonus: 0.25 },
    majordomo_executus: { name: '管理者埃克索图斯', bonus: 0.25 },
    corrupted_vaelastrasz: { name: '堕落的瓦拉斯塔兹', bonus: 0.30 },
    viscidus: { name: '维希度斯', bonus: 0.30 },
    princess_huhuran: { name: '哈霍兰公主', bonus: 0.30 },
    thaddius: { name: '塔迪乌斯', bonus: 0.30 },
    maexxna: { name: '麦克斯纳', bonus: 0.30 },
    patchwerk: { name: '帕奇维克', bonus: 0.30 },
    loatheb: { name: '洛欧塞布', bonus: 0.30 },
    onyxia: { name: '奥妮克希亚', bonus: 0.30 },
    chromaggus: { name: '克洛玛古斯', bonus: 0.30 },
    nefarian: { name: '奈法利安', bonus: 0.30 },
    ragnaros: { name: '火焰之王拉格纳罗斯', bonus: 0.30 },
    cthun: { name: '克苏恩', bonus: 0.30 },
    sapphiron: { name: '萨菲隆', bonus: 0.30 },
    kelthuzad: { name: '克尔苏加德', bonus: 0.30 },
};

export const BOSS_NAMES = Object.fromEntries(
    Object.entries(BOSS_BONUS_CONFIG).map(([id, cfg]) => [id, cfg.name])
);

export const BOSS_BONUS = Object.fromEntries(
    Object.entries(BOSS_BONUS_CONFIG).map(([id, cfg]) => [id, cfg.bonus])
);

export const RACE_TRAITS = {
    '人类': {
        extraSkills: ['racial_human_spirit', 'racial_human_hospitality'],
        statBonus: { versatility: 2, mastery: 2, critRate: 2, haste: 2 },
        mapCombatEndHealPct: 0.10,
    },
    '矮人': {
        extraSkills: ['racial_dwarf_spirit', 'racial_dwarf_stoneform'],
        statBonus: { critDamage: 0.15 },
        firstDebuffImmunity: { curse: true, poison: true },
    },
    '暗夜精灵': {
        extraSkills: ['racial_nightelf_spirit', 'racial_nightelf_shadowmeld'],
        timeBasedStatBonus: {
            dayStart: 6,
            nightStart: 18,
            dayBonus: { critRate: 6 },
            nightBonus: { haste: 6 },
        },
        mapFirstSlotDamageMult: 1.2,
    },
    '侏儒': {
        extraSkills: ['racial_gnome_spirit', 'racial_gnome_familiarity'],
        statBonus: { versatility: 6 },
        gatherStatBonus: { proficiency: 30 },
    },
    '兽人': {
        extraSkills: ['racial_orc_spirit', 'racial_orc_bloodfury'],
        statBonus: { mastery: 3, versatility: 3 },
        firstNSlotDamageMult: { n: 4, mult: 1.10 },
    },
    '巨魔': {
        extraSkills: ['racial_troll_spirit', 'racial_troll_berserking'],
        statBonus: { mastery: 6 },
        firstNSlotStatBonus: { n: 4, stats: { haste: 20 } },
    },
    '牛头人': {
        extraSkills: ['racial_tauren_spirit', 'racial_tauren_cultivation'],
        hpPctBonus: 0.10,
        gatherStatBonus: { precision: 30 },
    },
    '亡灵': {
        extraSkills: ['racial_undead_spirit', 'racial_undead_will'],
        statBonus: { critRate: 6 },
        firstFearImmunity: true,
    },
};

export const CLASSES = {
    protection_warrior: {
        id: 'protection_warrior',
        name: '防护战士',
        baseStats: { hp: 150, mp: 50, attack: 15, spellPower: 5, armor: 30, magicResist: 10, blockValue: 20 },
        baseGatherStats: { proficiency: 5, precision: 3, perception: 2 },
        skills: [
            { level: 1, skillId: 'basic_attack' },
            { level: 1, skillId: 'rest' },
            { level: 1, skillId: 'mastery_precise_block' },
            { level: 3, skillId: 'shield_bash' },
            { level: 5, skillId: 'shield_block' },
            { level: 10, skillId: 'revenge' },
            { level: 20, skillId: 'thunder_strike' },
            { level: 30, skillId: 'shield_wall' },
            { level: 50, skillId: 'victory_rush' },
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
        baseGatherStats: { proficiency: 5, precision: 3, perception: 2 },
        skills: [
            { level: 1, skillId: 'basic_attack' },
            { level: 1, skillId: 'rest' },
            { level: 1, skillId: 'mastery_atonement' },
            { level: 3, skillId: 'smite' },
            { level: 5, skillId: 'shadow_word_pain' },
            { level: 10, skillId: 'mind_blast' },
            { level: 20, skillId: 'power_word_radiance' },
            { level: 30, skillId: 'penance' },
            { level: 50, skillId: 'holy_nova' },
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
        baseGatherStats: { proficiency: 5, precision: 3, perception: 2 },
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
            { level: 50, skillId: 'ice_barrier' },
            { level: 52, skillId: 'conditional_frost_strike' },
            { level: 60, skillId: 'ice_spike' },
        ]
    },
    outlaw_rogue: {
        id: 'outlaw_rogue',
        name: '狂徒盗贼',
        baseStats: {
            hp: 120,
            mp: 60,
            attack: 18,
            spellPower: 5,
            armor: 18,
            magicResist: 10,
        },
        baseGatherStats: { proficiency: 5, precision: 3, perception: 2 },
        skills: [
            { level: 1, skillId: 'basic_attack' },
            { level: 1, skillId: 'rest' },
            { level: 1, skillId: 'mastery_sword_heart' },
            { level: 3, skillId: 'blade_flurry' },
            { level: 5, skillId: 'shadowstrike' },
            { level: 10, skillId: 'eviscerate' },
            { level: 20, skillId: 'ambush' },
            { level: 30, skillId: 'crimson_vial' },
            { level: 40, skillId: 'slice_and_dice' },
            { level: 50, skillId: 'between_the_eyes' },
            { level: 60, skillId: 'adrenaline_rush' },
        ]
    },
    vengeance_demon_hunter: {
        id: 'vengeance_demon_hunter',
        name: '复仇恶魔猎手',
        baseStats: {
            hp: 140,
            mp: 60,
            attack: 17,
            spellPower: 5,
            armor: 22,
            magicResist: 15,
            blockValue: 0,
        },
        baseGatherStats: { proficiency: 5, precision: 3, perception: 2 },
        skills: [
            { level: 1, skillId: 'basic_attack' },
            { level: 1, skillId: 'rest' },
            { level: 1, skillId: 'mastery_fel_blood' },
            { level: 1, skillId: 'counterattack' },
            { level: 3, skillId: 'rupture' },
            { level: 5, skillId: 'shattered_soul' },
            { level: 10, skillId: 'demon_spikes' },
            { level: 10, skillId: 'fel_devastation' },
            { level: 20, skillId: 'fiery_brand' },
            { level: 30, skillId: 'soul_cleave' },
            { level: 40, skillId: 'metamorphosis' },
            { level: 50, skillId: 'spirit_bomb' },
            { level: 60, skillId: 'sigil_of_flame' },
            { level: 70, skillId: 'immolation_aura' },
        ]
    }
};

export const RESOURCE_BUILDINGS = {
    lumber_mill: {
        id: 'lumber_mill',
        name: '伐木场',
        icon: '🪓',
        description: '派遣角色砍伐木材',
        resourceType: 'wood',
        baseProduction: 5,
        maxWorkers: 3,
        statWeights: { proficiency: 0.6, precision: 0.2, perception: 0.2 }
    },
    iron_mine: {
        id: 'iron_mine',
        name: '铁矿场',
        icon: '⛏️',
        description: '派遣角色开采铁矿',
        resourceType: 'ironOre',
        baseProduction: 3,
        maxWorkers: 3,
        statWeights: { proficiency: 0.5, precision: 0.3, perception: 0.2 }
    },
    gathering_hut: {
        id: 'gathering_hut',
        name: '采集所',
        icon: '🌿',
        description: '派遣角色采集草药',
        resourceType: 'herb',
        baseProduction: 4,
        maxWorkers: 3,
        statWeights: { proficiency: 0.3, precision: 0.3, perception: 0.4 }
    },
    hunter_lodge: {
        id: 'hunter_lodge',
        name: '猎人小屋',
        icon: '🏹',
        description: '派遣角色狩猎获取毛皮',
        resourceType: 'leather',
        baseProduction: 3,
        maxWorkers: 3,
        statWeights: { proficiency: 0.4, precision: 0.4, perception: 0.2 }
    },
    mana_well: {
        id: 'mana_well',
        name: '魔力之源',
        icon: '💎',
        description: '派遣角色汲取魔法精华',
        resourceType: 'magicEssence',
        baseProduction: 1,
        maxWorkers: 2,
        statWeights: { proficiency: 0.2, precision: 0.3, perception: 0.5 }
    },
    foundry: {
        id: 'foundry',
        name: '铸造厂',
        icon: '🔥',
        description: '派遣角色将铁矿炼成铁锭（消耗铁矿）',
        resourceType: 'ironIngot',
        baseProduction: 2,
        maxWorkers: 2,
        consumption: { ironOre: 3 },
        statWeights: { proficiency: 0.5, precision: 0.4, perception: 0.1 }
    },
    alchemy_lab: {
        id: 'alchemy_lab',
        name: '炼金实验室',
        icon: '⚗️',
        description: '派遣角色炼制炼金油（消耗草药）',
        resourceType: 'alchemyOil',
        baseProduction: 2,
        maxWorkers: 2,
        consumption: { herb: 2 },
        statWeights: { proficiency: 0.3, precision: 0.5, perception: 0.2 }
    },
};

export const FUNCTIONAL_BUILDINGS = {
    plaza_fountain: {
        id: 'plaza_fountain',
        name: '广场喷泉',
        icon: '⛲',
        description: '所有脱战英雄每秒额外回复2点生命',
        cost: { gold: 10000, wood: 10000, ironOre: 8000 },
        maxCount: 500,
        effect: { type: 'regen', value: 2 }
    },
    fountain_lawn: {
        id: 'fountain_lawn',
        name: '喷泉草坪',
        icon: '🌿',
        description: '每座提高喷泉效率10%（最多+200%）；仅影响“广场喷泉”的脱战回血。',
        unlockBoss: 'dagran_thaurissan',
        cost: { gold: 1000000, wood: 800000, herb: 800000 },
        maxCount: 20,
        effect: { type: 'fountainEfficiency', value: 0.10 }
    },
    fountain_decor: {
        id: 'fountain_decor',
        name: '喷泉外饰',
        icon: '🪷',
        description: '每座提高喷泉效率10%（最多+200%）；仅影响“广场喷泉”的脱战回血。',
        unlockBoss: 'rend_blackhand',
        cost: { gold: 2500000, ironIngot: 900000, magicEssence: 600000 },
        maxCount: 20,
        effect: { type: 'fountainEfficiency', value: 0.10 }
    },
    volcanic_hot_spring: {
        id: 'volcanic_hot_spring',
        name: '火山温泉',
        icon: '♨️',
        description: '每座提供每秒0.025%最大生命值的生命回复（最多20座）',
        unlockBoss: 'ragnaros',
        cost: { ironIngot: 1200000, alchemyOil: 1200000 },
        maxCount: 20,
        effect: { type: 'hpRegenPct', value: 0.00025 }
    },
    warehouse: {
        id: 'warehouse',
        name: '仓库',
        icon: '🏚️',
        description: '增加1个背包格子',
        cost: { gold: 80000, ironOre: 30000, ironIngot: 15000, magicEssence: 15000, alchemyOil: 10000 },
        maxCount: 150,
        effect: { type: 'inventorySize', value: 1 }
    },
    training_dummy: {
        id: 'training_dummy',
        name: '训练假人',
        icon: '🎯',
        description: '所有角色经验获取提高1%',
        cost: { gold: 500000, leather: 30000, ironOre: 30000, ironIngot: 15000, magicEssence: 15000 },
        maxCount: 30,
        effect: { type: 'expBonus', value: 0.01 }
    },
    mechanical_arm: {
        id: 'mechanical_arm',
        name: '机械臂',
        icon: '🦾',
        description: '强化一个背包栏位，使其自动合成',
        cost: { gold: 500000, ironIngot: 20000, magicEssence: 20000, alchemyOil: 15000 },
        maxCount: 10,
        effect: { type: 'autoMerge', value: 1 }
    },
    astral_forge: {
        id: 'astral_forge',
        name: '星界铸造所',
        icon: '🪐',
        description: '使道具栏前 N 个“机械臂强化”格进化为星界强化（N=星界铸造所数量）。星界强化格内装备每秒获得1点淬炼进度，累计3600点时：装备等级+1。数量上限：2（拉格纳罗斯→4，奈法利安→6），且不超过机械臂数量。',
        cost: { gold: 20000000, ironOre: 5000000, magicEssence: 5000000, alchemyOil: 5000000 },
        maxCount: 2,
        effect: { type: 'astralForge', value: 1 }
    },
    glow_lighthouse: {
        id: 'glow_lighthouse',
        name: '辉光灯塔',
        icon: '🗼',
        description: '每座使角色脱离战斗所需时间降低1秒（最多降低2秒）',
        cost: { gold: 1000000, ironOre: 200000, wood: 500000, alchemyOil: 100000 },
        maxCount: 2,
        effect: { type: 'outOfCombatDelay', value: -1 }
    },
    dragon_seekers_guild: {
        id: 'dragon_seekers_guild',
        name: '寻龙会',
        icon: '🐉',
        description: '每级提高装备/物品掉落概率5%（满级+100%：0.1%→0.2%）',
        cost: { gold: 50000, ironIngot: 30000, magicEssence: 30000 },
        maxCount: 20,
        effect: { type: 'dropBonus', value: 0.05 }
    },
};
