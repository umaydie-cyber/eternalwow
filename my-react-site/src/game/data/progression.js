export const MOUNT_CODEX = [
    {
        id: 'MOUNT_DEATHCHARGER',
        name: '死亡军马',
        icon: '🐴',
        imageUrl: 'icons/wow/vanilla/rider/siwangjunma.png',
        source: '击杀【瑞文戴尔男爵】',
        bossId: 'baron_rivendare',
        dropChance: 0.01,
        bonus: { expMult: 1.10 },
    },
    {
        id: 'MOUNT_TYRAELS_CHARGER',
        name: '泰瑞尔的战马',
        icon: '🐎',
        imageUrl: 'icons/wow/vanilla/rider/tairuier.png',
        source: '时空商城',
        bonus: { goldMult: 1.20 },
    },
    {
        id: 'MOUNT_RAZZASHI_RAPTOR',
        name: '拉扎什迅猛龙',
        icon: '🦖',
        imageUrl: 'icons/wow/vanilla/rider/lazhashixunmenglong.png',
        source: '祖尔格拉布掉落',
        zoneId: 'zul_gurub',
        dropChance: 0.0005,
        bonus: { goldMult: 1.10 },
    },
    {
        id: 'MOUNT_SWIFT_ZULIAN_TIGER',
        name: '迅捷祖利安猛虎',
        icon: '🐅',
        imageUrl: 'icons/wow/vanilla/rider/zulianmenghu.png',
        source: '祖尔格拉布掉落',
        zoneId: 'zul_gurub',
        dropChance: 0.0005,
        bonus: { resourceMult: 1.10 },
    },
    {
        id: 'MOUNT_GUANGYILONGYING',
        name: '光翼龙鹰',
        icon: '🦅',
        imageUrl: 'icons/wow/vanilla/rider/guangyilongying.png',
        source: '时空商城',
        bonus: { bossAttackMult: 1.02 },
    },
    {
        id: 'MOUNT_MORIZHIYU',
        name: '末日之羽',
        icon: '🪶',
        imageUrl: 'icons/wow/vanilla/rider/morizhiyu.png',
        source: '时空商城',
        bonus: { bossSpellMult: 1.02 },
    },
];

export const SPACETIME_SHOP_ITEMS = [
    {
        id: 'SHOP_MOUNT_TYRAELS_CHARGER',
        type: 'mount',
        name: '泰瑞尔的战马',
        icon: '🐎',
        imageUrl: 'icons/wow/vanilla/rider/tairuier.png',
        price: 5000,
        currencyKey: 'spacetimeCoin',
        currencyIcon: '🌀',
        mountId: 'MOUNT_TYRAELS_CHARGER',
        bonus: { goldMult: 1.20 },
        description: '圣光穿越时空而来。购买后将直接点亮【坐骑图鉴】，并永久获得金币掉落加成。',
        flavor: '“即便世界破碎，圣光亦将照耀前路。”',
        rarity: 'legendary'
    },
    {
        id: 'SHOP_MOUNT_GUANGYILONGYING',
        type: 'mount',
        name: '光翼龙鹰',
        icon: '🦅',
        imageUrl: 'icons/wow/vanilla/rider/guangyilongying.png',
        price: 3000,
        currencyKey: 'spacetimeCoin',
        currencyIcon: '🌀',
        mountId: 'MOUNT_GUANGYILONGYING',
        bonus: { bossAttackMult: 1.02 },
        description: '光翼划破长夜。购买后将直接点亮【坐骑图鉴】，并在BOSS战中永久获得攻击强度加成。',
        flavor: '“光翼一振，群星皆暗。”',
        rarity: 'epic'
    },
    {
        id: 'SHOP_MOUNT_MORIZHIYU',
        type: 'mount',
        name: '末日之羽',
        icon: '🪶',
        imageUrl: 'icons/wow/vanilla/rider/morizhiyu.png',
        price: 3000,
        currencyKey: 'spacetimeCoin',
        currencyIcon: '🌀',
        mountId: 'MOUNT_MORIZHIYU',
        bonus: { bossSpellMult: 1.02 },
        description: '终末的羽落无声。购买后将直接点亮【坐骑图鉴】，并在BOSS战中永久获得法术强度加成。',
        flavor: '“当最后一片羽毛落下，世界将归于寂静。”',
        rarity: 'epic'
    },
];

export const RARITY_COLORS = {
    white: '#d9d9d9',
    green: '#1eff00',
    blue: '#0070dd',
    purple: '#a335ee',
    orange: '#ff8000',
    gold: '#ffd700'
};

export const getRarityColor = (rarity) => {
    if (!rarity) return '#4a3c2a';
    return RARITY_COLORS[rarity] || '#4a3c2a';
};

export const ITEMS = {
    IT_001: {
        id: 'IT_001',
        name: '破烂的毛皮',
        type: 'junk',
        rarity: 'white',
        sellPrice: 200,
        icon: 'icons/wow/vanilla/items/INV_Banner_03.png'
    },
    IT_STV_001: { id: 'IT_STV_001', name: '荆棘谷的青山·第一章', type: 'junk', rarity: 'white', sellPrice: 5000 },
    IT_STV_002: { id: 'IT_STV_002', name: '荆棘谷的青山·第二章', type: 'junk', rarity: 'white', sellPrice: 5000 },
    IT_STV_003: { id: 'IT_STV_003', name: '荆棘谷的青山·第三章', type: 'junk', rarity: 'white', sellPrice: 5000 },
    IT_STV_004: { id: 'IT_STV_004', name: '荆棘谷的青山·第四章', type: 'junk', rarity: 'white', sellPrice: 5000 },
    REBIRTH_INVITATION: {
        id: 'REBIRTH_INVITATION',
        name: '破碎时空的邀请函',
        type: 'consumable',
        rarity: 'purple',
        icon: 'icons/wow/vanilla/items/INV_Misc_Note_04.png',
        canUse: true,
        sellPrice: 0,
        description: '使用后解锁重生轮回'
    },
    IT_BLACK_DRAGON_PROOF: {
        id: 'IT_BLACK_DRAGON_PROOF',
        name: '黑龙化身的证明',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Head_Dragon_01.png',
        description: '使用后，揭露真相，解锁隐藏Boss【普瑞斯托女士】'
    },
    IT_HOGGER_BADGE: {
        id: 'IT_HOGGER_BADGE',
        name: '霍格的沾血徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_ArmorKit_01.png',
        description: '使用后选择一件【艾尔文森林，西部荒野，赤脊山】装备，使其等级提升 +2（最高100级）'
    },
    IT_SCARLET_CRUSADER_BADGE: {
        id: 'IT_SCARLET_CRUSADER_BADGE',
        name: '血色十字军的徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_ArmorKit_10.png',
        description: '使用后选择一件【血色修道院】装备，使其等级提升 +2（最高100级）'
    },
    IT_VANCLEEF_BADGE: {
        id: 'IT_VANCLEEF_BADGE',
        name: '迪菲亚徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/armor/INV_Jewelry_Talisman_05.png',
        description: '使用后选择一件【贫瘠之地】装备，使其等级提升 +2（最高100级）'
    },
    IT_PRESTOR_BADGE: {
        id: 'IT_PRESTOR_BADGE',
        name: '黑龙化身徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/armor/INV_Jewelry_Talisman_12.png',
        description: '使用后选择一件【荆棘谷，塔纳利斯】装备，使其等级提升 +2（最高100级）'
    },
    IT_THAURISSAN_BADGE: {
        id: 'IT_THAURISSAN_BADGE',
        name: '索瑞森大帝的徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Rune_04.png',
        description: '使用后选择一件【沉没的神庙，黑石深渊】装备，使其等级提升 +2（最高100级）'
    },
    IT_GANDLING_BADGE: {
        id: 'IT_GANDLING_BADGE',
        name: '加丁的徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Rune_08.png',
        description: '使用后选择一件【通灵学院】装备，使其等级提升 +2（最高100级）'
    },
    IT_RIVENDARE_BADGE: {
        id: 'IT_RIVENDARE_BADGE',
        name: '瑞文戴尔男爵的徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Rune_07.png',
        description: '使用后选择一件【斯坦索姆】装备，使其等级提升 +2（最高100级）'
    },
    IT_REND_BADGE: {
        id: 'IT_REND_BADGE',
        name: '雷德黑手的徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Rune_02.png',
        description: '使用后选择一件【黑石塔上】装备，使其等级提升 +2（最高100级）'
    },
    IT_HAKKAR_BADGE: {
        id: 'IT_HAKKAR_BADGE',
        name: '夺灵者的徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Idol_03.png',
        description: '使用后选择一件【祖尔格拉布】装备，使其等级提升 +2（最高100级）'
    },
    IT_OSSIRIAN_BADGE: {
        id: 'IT_OSSIRIAN_BADGE',
        name: '无疤者的徽章',
        type: 'consumable',
        rarity: 'purple',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_StoneTablet_08.png',
        description: '使用后选择一件【安琪拉废墟】装备，使其等级提升 +2（最高100级）'
    },
    IT_ONYXIA_BADGE: {
        id: 'IT_ONYXIA_BADGE',
        name: '黑龙女王的徽章',
        type: 'consumable',
        rarity: 'orange',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Head_Dragon_01.png',
        description: '使用后选择一件【奥妮克希亚的巢穴】掉落装备，使其等级提升 +2（最高100级）。'
    },
    IT_ELEMENTIUM_BADGE: {
        id: 'IT_ELEMENTIUM_BADGE',
        name: '源质徽章',
        type: 'consumable',
        rarity: 'orange',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_StoneTablet_05.png',
        description: '使用后选择一件【黑翼之巢】区域或【黑翼之巢BOSS】掉落装备，使其等级提升 +2（最高100级）。适用于堕落的瓦拉斯塔兹、克洛玛古斯、奈法利安掉落装备。'
    },
    IT_RAGNAROS_BADGE: {
        id: 'IT_RAGNAROS_BADGE',
        name: '火焰之王的徽章',
        type: 'consumable',
        rarity: 'orange',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Rune_06.png',
        description: '使用后选择一件【熔火之心】或【熔火之心BOSS】掉落装备，使其等级提升 +2（最高100级）。可用于风剑/橙锤等传奇装备。'
    },
    IT_CTHUN_BADGE: {
        id: 'IT_CTHUN_BADGE',
        name: '克苏恩的徽章',
        type: 'consumable',
        rarity: 'orange',
        canUse: true,
        sellPrice: 0,
        icon: 'icons/wow/vanilla/items/INV_Misc_Idol_02.png',
        description: '使用后选择一件【安其拉神庙】区域/世界首领/团队首领掉落装备，使其等级提升 +2（最高100级）。可用于维希度斯、哈霍兰公主、克苏恩等掉落装备。'
    }
};

export const BUILDINGS = {
    house: { id: 'house', name: '民居', cost: { gold: 100, wood: 50 }, production: { population: 2 }, consumption: {} },
};

export const RESEARCH = {
    lumber_mastery: { id: 'lumber_mastery', name: '伐木精通', description: '提升伐木效率', baseCost: 500, effect: 'wood', bonus: 0.03 },
    mining_mastery: { id: 'mining_mastery', name: '采矿精通', description: '提升采矿效率', baseCost: 500, effect: 'ironOre', bonus: 0.03 },
    gathering_efficiency: {
        id: 'gathering_efficiency',
        name: '采集精通',
        description: '提升采集所采集草药的效率（击败范克里夫后解锁）',
        baseCost: 1500,
        effect: 'herb',
        bonus: 0.03,
        unlockBoss: 'vancleef',
    },
    skinning_efficiency: {
        id: 'skinning_efficiency',
        name: '捕猎精通',
        description: '提升猎人小屋获取毛皮的效率（击败范克里夫后解锁）',
        baseCost: 1500,
        effect: 'leather',
        bonus: 0.03,
        unlockBoss: 'vancleef',
    },
    siphon_mastery: {
        id: 'siphon_mastery',
        name: '汲魔精通',
        description: '提升魔力之源汲取魔法精华的效率（击败普瑞斯托女士后解锁）',
        baseCost: 5000,
        effect: 'magicEssence',
        bonus: 0.03,
        unlockBoss: 'prestor_lady',
    },
    cast_iron_mastery: {
        id: 'cast_iron_mastery',
        name: '铸铁精通',
        description: '提升铸造厂炼制铁锭的效率（击败普瑞斯托女士后解锁）',
        baseCost: 5000,
        effect: 'ironIngot',
        bonus: 0.03,
        unlockBoss: 'prestor_lady',
    },
    alchemy_mastery: {
        id: 'alchemy_mastery',
        name: '炼金精通',
        description: '提升炼金术效率（击败裂魂者萨尔诺斯后解锁）',
        baseCost: 10000,
        effect: 'alchemyOil',
        bonus: 0.03,
        unlockBoss: 'thalnos',
    },
};

export const WORLD_BOSSES = {
    hogger: { id: 'hogger', name: '霍格', icon: 'icons/wow/vanilla/boss/hogger.png', hp: 18000, attack: 150, defense: 70, rewards: { gold: 5000, exp: 5500 } },
    vancleef: { id: 'vancleef', name: '艾德温·范克里夫', icon: 'icons/wow/vanilla/boss/vancleef.png', hp: 140000, attack: 550, defense: 350, rewards: { gold: 25000, exp: 19800 }, unlockLevel: 30 },
    prestor_lady: {
        id: 'prestor_lady',
        name: '普瑞斯托女士',
        icon: 'icons/wow/vanilla/boss/prestor_lady.jpg',
        hp: 800000,
        attack: 1500,
        defense: 800,
        rewards: { gold: 100000, exp: 80000 },
        unlockCondition: { requireItem: 'IT_BLACK_DRAGON_PROOF' }
    },
    thalnos: { id: 'thalnos', name: '裂魂者萨尔诺斯', icon: 'icons/wow/vanilla/boss/thalnos.png', hp: 1000000, attack: 1800, defense: 750, rewards: { gold: 120000, exp: 95000 }, unlockLevel: 50 },
    dagran_thaurissan: { id: 'dagran_thaurissan', name: '达格兰·索瑞森大帝', icon: 'icons/wow/vanilla/boss/dagran_thaurissan.png', hp: 1500000, attack: 3000, defense: 1000, rewards: { gold: 300000, exp: 165000 }, unlockLevel: 50 },
    darkmaster_gandling: { id: 'darkmaster_gandling', name: '黑暗院长加丁', icon: 'icons/wow/vanilla/boss/darkmaster_gandling.png', hp: 2800000, attack: 3600, defense: 1200, rewards: { gold: 450000, exp: 240000 }, unlockLevel: 60 },
    baron_rivendare: { id: 'baron_rivendare', name: '瑞文戴尔男爵', icon: 'icons/wow/vanilla/boss/baron_rivendare.png', hp: 3400000, attack: 4000, defense: 1350, rewards: { gold: 550000, exp: 300000 }, unlockLevel: 60 },
    rend_blackhand: { id: 'rend_blackhand', name: '雷德·黑手', icon: 'icons/wow/vanilla/boss/rend_blackhand.png', hp: 4000000, attack: 4000, defense: 1400, rewards: { gold: 580000, exp: 350000 }, unlockLevel: 60 },
    hakkar: { id: 'hakkar', name: '血神哈卡', icon: 'icons/wow/vanilla/boss/hakkar.png', hp: 10000000, attack: 8000, defense: 3500, rewards: { gold: 1400000, exp: 900000 }, unlockLevel: 60 },
    ossirian: { id: 'ossirian', name: '无疤者奥斯里安', icon: 'icons/wow/vanilla/boss/ossirian.png', hp: 12000000, attack: 8500, defense: 800000, rewards: { gold: 1800000, exp: 1100000 }, unlockLevel: 60 },
    garr: { id: 'garr', name: '加尔', icon: 'icons/wow/vanilla/boss/garr.png', hp: 15000000, attack: 10800, defense: 10000, rewards: { gold: 2000000, exp: 1200000 }, unlockLevel: 60 },
    baron_geddon: { id: 'baron_geddon', name: '迦顿男爵', icon: 'icons/wow/vanilla/boss/jiadunnanjue.png', hp: 16000000, attack: 11200, defense: 12000, rewards: { gold: 2200000, exp: 1300000 }, unlockLevel: 60 },
    golemagg: { id: 'golemagg', name: '焚化者古雷曼格', icon: 'icons/wow/vanilla/boss/golemagg.png', hp: 18000000, attack: 12800, defense: 13000, rewards: { gold: 2400000, exp: 1400000 }, unlockLevel: 60 },
    majordomo_executus: { id: 'majordomo_executus', name: '管理者埃克索图斯', icon: 'icons/wow/vanilla/boss/guanlizhe.png', hp: 20000000, attack: 12800, defense: 15000, rewards: { gold: 2600000, exp: 1500000 }, unlockLevel: 60 },
    corrupted_vaelastrasz: { id: 'corrupted_vaelastrasz', name: '堕落的瓦拉斯塔兹', icon: 'icons/wow/vanilla/boss/vaelastrasz.png', hp: 40000000, attack: 25000, defense: 20000, rewards: { gold: 4000000, exp: 2200000 }, unlockLevel: 60 },
    viscidus: { id: 'viscidus', name: '维希度斯', icon: 'icons/wow/vanilla/boss/viscidus.png', hp: 35000000, attack: 32000, defense: 30000, rewards: { gold: 4200000, exp: 2400000 }, unlockLevel: 60 },
    princess_huhuran: { id: 'princess_huhuran', name: '哈霍兰公主', icon: 'icons/wow/vanilla/boss/princess_huhuran.png', hp: 40000000, attack: 35000, defense: 32000, rewards: { gold: 4400000, exp: 2600000 }, unlockLevel: 60 },
    thaddius: { id: 'thaddius', name: '塔迪乌斯', icon: 'icons/wow/vanilla/boss/thaddius.png', hp: 50000000, attack: 38000, defense: 35000, rewards: { gold: 4800000, exp: 3000000 }, unlockLevel: 60 },
    maexxna: { id: 'maexxna', name: '麦克斯纳', icon: 'icons/wow/vanilla/boss/maexxna.png', hp: 50000000, attack: 40000, defense: 36000, rewards: { gold: 5200000, exp: 3300000 }, unlockLevel: 60 },
    patchwerk: { id: 'patchwerk', name: '帕奇维克', icon: 'icons/wow/vanilla/boss/patchwerk.png', hp: 50000000, attack: 42000, defense: 36000, rewards: { gold: 5400000, exp: 3500000 }, unlockLevel: 60 },
    loatheb: { id: 'loatheb', name: '洛欧塞布', icon: 'icons/wow/vanilla/boss/loatheb.png', hp: 70000000, attack: 42000, defense: 36000, rewards: { gold: 5800000, exp: 3800000 }, unlockLevel: 60 },
};

export const TEAM_BOSSES = {
    ragnaros: { id: 'ragnaros', name: '火焰之王拉格纳罗斯', icon: 'icons/wow/vanilla/boss/ragnaros.png', hp: 30000000, attack: 18000, defense: 18000, rewards: { gold: 3200000, exp: 1800000 }, unlockLevel: 60, partySize: 5 },
    onyxia: { id: 'onyxia', name: '奥妮克希亚', icon: 'icons/wow/vanilla/boss/onyxia.png', hp: 35000000, attack: 20000, defense: 20000, rewards: { gold: 3600000, exp: 2000000 }, unlockLevel: 60, partySize: 5 },
    chromaggus: { id: 'chromaggus', name: '克洛玛古斯', icon: 'icons/wow/vanilla/boss/chromaggus.png', hp: 37000000, attack: 22000, defense: 22000, rewards: { gold: 3800000, exp: 2100000 }, unlockLevel: 60, partySize: 5 },
    nefarian: { id: 'nefarian', name: '奈法利安', icon: 'icons/wow/vanilla/boss/nefarian.png', hp: 50000000, attack: 32000, defense: 32000, rewards: { gold: 4500000, exp: 3200000 }, unlockLevel: 60, partySize: 5 },
    cthun: { id: 'cthun', name: '克苏恩', icon: 'icons/wow/vanilla/boss/cthun.png', hp: 60000000, attack: 40000, defense: 35000, rewards: { gold: 6000000, exp: 4000000 }, unlockLevel: 60, partySize: 5 },
    sapphiron: { id: 'sapphiron', name: '萨菲隆', icon: 'icons/wow/vanilla/boss/sapphiron.png', hp: 90000000, attack: 50000, defense: 40000, rewards: { gold: 7000000, exp: 4500000 }, unlockLevel: 60, partySize: 5 },
    kelthuzad: { id: 'kelthuzad', name: '克尔苏加德', icon: 'icons/wow/vanilla/boss/kelthuzad.png', hp: 100000000, attack: 50000, defense: 40000, rewards: { gold: 8000000, exp: 5200000 }, unlockLevel: 60, partySize: 5 },
};

export const BOND_NAMES = {
    baoernai: '包二奶',
    jianyue: '简约而不简单',
    guangtou_baoji: '光头加暴击',
    beiweizhuru: '一个卑微的侏儒？',
    mengduo: '蒙多想去哪就去哪',
    wusheng: '武圣转世',
    tianduyingcai: '天妒英才'
};
