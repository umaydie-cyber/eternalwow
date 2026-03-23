export const MATERIAL_BAG_DEFAULT_SIZE = 100;

export const PROFESSION_LEARN_COSTS = [5000, 100000];

export const PROFESSIONS = {
    herbalism: {
        id: 'herbalism',
        name: '采药',
        icon: '🌿',
        maxSkill: 300,
    },
    mining: {
        id: 'mining',
        name: '挖矿',
        icon: '⛏️',
        maxSkill: 300,
    },
};

export const MATERIALS = {
    peacebloom: {
        id: 'peacebloom',
        name: '宁神花',
        enName: 'Peacebloom',
        icon: '🌼',
        professionId: 'herbalism',
        stackLimit: Infinity,
    },
    silverleaf: {
        id: 'silverleaf',
        name: '银叶草',
        enName: 'Silverleaf',
        icon: '🍃',
        professionId: 'herbalism',
        stackLimit: Infinity,
    },
    copper_ore: {
        id: 'copper_ore',
        name: '铜矿',
        enName: 'Copper Ore',
        icon: '🟠',
        professionId: 'mining',
        stackLimit: Infinity,
    },
    tin_ore: {
        id: 'tin_ore',
        name: '锡矿',
        enName: 'Tin Ore',
        icon: '⚙️',
        professionId: 'mining',
        stackLimit: Infinity,
    },
};

export const GATHERING_ZONES = {
    westfall: {
        id: 'westfall',
        name: '西部荒野',
        icon: '🌾',
        description: '适合新人练手的采集区域，草药和低级矿脉都很常见。',
        unlocked: true,
        professionPools: {
            herbalism: ['peacebloom', 'silverleaf'],
            mining: ['copper_ore', 'tin_ore'],
        },
    },
};

export const createDefaultProfessionSkills = () =>
    Object.keys(PROFESSIONS).reduce((acc, professionId) => {
        acc[professionId] = 0;
        return acc;
    }, {});
