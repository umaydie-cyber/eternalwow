import React, { useState } from 'react';
import { Panel, Button } from '../components/ui';
import { BOSS_NAMES, CLASSES, FUNCTIONAL_BUILDINGS, RESOURCE_BUILDINGS } from '../data/core';
import { useIsMobile } from '../hooks/responsive';

// ==================== PAGE: CITY (重新设计) ====================
export const CityPage = ({ state, dispatch, calculateGatherStats, calculateBuildingProduction, getFountainEfficiency, getVolcanicHotSpringRegenPct, getFunctionalBuildingCost, getFunctionalBuildingMaxCount, getFunctionalBuildingEffectiveMaxCount }) => {
    const isMobile = useIsMobile();
    const [draggedChar, setDraggedChar] = useState(null);
    const [mobileSelectedCharId, setMobileSelectedCharId] = useState(null);
    const [activeTab, setActiveTab] = useState('resources'); // 'resources' | 'functional'

    const selectedCharId = isMobile ? mobileSelectedCharId : null;

    const selectedChar = selectedCharId
        ? state.characters.find(c => c.id === selectedCharId)
        : null;


    // 获取未被派遣的角色（不在地图也不在资源建筑）
    const getAvailableChars = () => {
        const mapAssigned = new Set(Object.keys(state.assignments || {}));
        const professionAssigned = new Set(Object.keys(state.gatherAssignments || {}));
        const resourceAssigned = new Set(
            Object.values(state.resourceAssignments || {}).flat()
        );

        return state.characters.filter(c =>
            !mapAssigned.has(c.id) && !resourceAssigned.has(c.id)
            && !professionAssigned.has(c.id)
        );
    };

    const availableChars = getAvailableChars();

    // 获取某建筑的工人（过滤掉不存在的角色）
    const getWorkers = (buildingId) => {
        return (state.resourceAssignments?.[buildingId] || [])
            .map(id => state.characters.find(c => c.id === id))
            .filter(Boolean);  // ✅ 这行已经能过滤掉找不到的角色
    };

    const handleDragStart = (e, charId) => {
        setDraggedChar(charId);

        // ✅ Edge/部分浏览器需要 setData 才会认为这是“有效拖拽”
        e.dataTransfer.setData('text/plain', charId);

        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, buildingId) => {
        e.preventDefault();

        // ✅ 优先使用 draggedChar，其次从 dataTransfer 获取（提升兼容性）
        const charId = draggedChar || e.dataTransfer.getData('text/plain');

        if (charId) {
            dispatch({
                type: 'ASSIGN_RESOURCE_BUILDING',
                payload: { characterId: charId, buildingId }
            });
        } else {
            console.warn('handleDrop: 没有获取到 charId');
        }
        setDraggedChar(null);
    };

    // ✅ 资源显示配置（过滤掉 population 和 maxPopulation）
    const resourceConfig = {
        gold: { icon: '🟡', name: '金币' },
        spacetimeCoin: { icon: '🌀', name: '时空币' },
        wood: { icon: '🪵', name: '木材' },
        ironOre: { icon: '🪙', name: '铁矿' },
        ironIngot: { icon: '🔩', name: '铁锭' },
        herb: { icon: '🌿', name: '草药' },
        leather: { icon: '🦌', name: '毛皮' },
        magicEssence: { icon: '💎', name: '魔法精华' },
        alchemyOil: { icon: '⚗️', name: '炼金油' }
    };

    // ✅ 只显示配置中定义的资源
    const displayedResources = Object.entries(state.resources)
        .filter(([key]) => resourceConfig[key]);

    return (
        <div>
            {/* 资源总览 */}
            <Panel title="📦 资源总览">
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 10
                }}>
                    {displayedResources.map(([key, value]) => {
                        const config = resourceConfig[key];
                        return (
                            <div key={key} style={{
                                padding: 12,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid #4a3c2a',
                                borderRadius: 8,
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: 24, marginBottom: 4 }}>{config.icon}</div>
                                <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{config.name}</div>
                                <div style={{ fontSize: 16, color: '#ffd700', fontWeight: 600 }}>
                                    {Math.floor(value)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Panel>

            {/* 可派遣角色 */}
            {availableChars.length > 0 && (
                <Panel title="👥 可派遣角色" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {availableChars.map(char => {
                            const gatherStats = calculateGatherStats(char);
                            const selected = selectedCharId === char.id;
                            return (
                                <div
                                    key={char.id}
                                    draggable={!isMobile}
                                    onDragStart={!isMobile ? (e) => handleDragStart(e, char.id) : undefined}
                                    onClick={() => {
                                        if (!isMobile) return;
                                        setMobileSelectedCharId(prev => prev === char.id ? null : char.id);
                                    }}
                                    style={{
                                        padding: 12,
                                        background: selected
                                            ? 'linear-gradient(135deg, rgba(255,215,0,0.22), rgba(139,115,25,0.12))'
                                            : 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(139,115,25,0.1))',
                                        border: selected ? '2px solid #ffd700' : '2px solid #c9a227',
                                        borderRadius: 8,
                                        cursor: isMobile ? 'pointer' : 'grab',
                                        transition: 'all 0.2s',
                                        minWidth: 140,
                                        userSelect: 'none',
                                        opacity: selectedCharId && !selected ? 0.85 : 1
                                    }}
                                >
                                    <div style={{ fontSize: 14, color: '#ffd700', fontWeight: 600, marginBottom: 4 }}>
                                        {char.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
                                        Lv.{char.level} {CLASSES[char.classId].name}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#aaa', display: 'flex', gap: 8 }}>
                                        <span title="熟练">🔧{gatherStats.proficiency}</span>
                                        <span title="精细">🎯{gatherStats.precision}</span>
                                        <span title="感知">👁️{gatherStats.perception}</span>
                                    </div>

{isMobile && selected && (
    <div style={{ marginTop: 6, fontSize: 11, color: '#ffd700', fontWeight: 700 }}>
        ✅ 已选中
    </div>
)}

                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                        {isMobile ? '💡 点选角色 → 点选建筑【派遣】按钮' : '💡 拖拽角色到下方建筑进行派遣采集'}
                    </div>
                    {isMobile && selectedChar && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                            当前选择：<span style={{ color: '#ffd700', fontWeight: 800 }}>{selectedChar.name}</span>（再次点选可取消）
                        </div>
                    )}
                </Panel>
            )}

            {/* Tab 切换 */}
            <div style={{
                display: 'flex',
                gap: 4,
                marginBottom: 16,
                padding: 4,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                border: '1px solid #3a3a3a'
            }}>
                <button
                    onClick={() => setActiveTab('resources')}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: activeTab === 'resources'
                            ? 'linear-gradient(180deg, rgba(201,162,39,0.3), rgba(139,115,25,0.2))'
                            : 'transparent',
                        border: activeTab === 'resources' ? '1px solid #c9a227' : '1px solid transparent',
                        borderRadius: 6,
                        color: activeTab === 'resources' ? '#ffd700' : '#888',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        fontWeight: 600
                    }}
                >
                    ⛏️ 资源建筑
                </button>
                <button
                    onClick={() => setActiveTab('functional')}
                    style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: activeTab === 'functional'
                            ? 'linear-gradient(180deg, rgba(201,162,39,0.3), rgba(139,115,25,0.2))'
                            : 'transparent',
                        border: activeTab === 'functional' ? '1px solid #c9a227' : '1px solid transparent',
                        borderRadius: 6,
                        color: activeTab === 'functional' ? '#ffd700' : '#888',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 14,
                        fontWeight: 600
                    }}
                >
                    🏛️ 功能建筑
                </button>
            </div>

            {/* 资源建筑区域 */}
            {activeTab === 'resources' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 16
                }}>
                    {Object.values(RESOURCE_BUILDINGS).map(building => {
                        const workers = getWorkers(building.id);
                        const currentProduction = workers.length > 0
                            ? calculateBuildingProduction(building.id, workers.map(w => w.id), state)
                            : 0;
                        const isFull = workers.length >= building.maxWorkers;

                        return (
                            <div
                                key={building.id}
                                onDragOver={!isMobile ? handleDragOver : undefined}
                                onDrop={!isMobile ? (e) => handleDrop(e, building.id) : undefined}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(40,35,30,0.9), rgba(25,20,15,0.95))',
                                    border: workers.length > 0 ? '2px solid #c9a227' : '2px solid #4a3c2a',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {/* 建筑头部 */}
                                <div style={{
                                    padding: 16,
                                    background: workers.length > 0
                                        ? 'linear-gradient(180deg, rgba(201,162,39,0.15), transparent)'
                                        : 'linear-gradient(180deg, rgba(60,50,40,0.3), transparent)',
                                    borderBottom: '1px solid rgba(201,162,39,0.2)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 50,
                                            height: 50,
                                            background: 'rgba(0,0,0,0.4)',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 28,
                                            border: '1px solid rgba(201,162,39,0.3)'
                                        }}>
                                            {building.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 16, color: '#ffd700', fontWeight: 600 }}>
                                                {building.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                                                {building.description}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 11, color: '#888' }}>工人</div>
                                            <div style={{
                                                fontSize: 14,
                                                color: workers.length >= building.maxWorkers ? '#f44336' : '#4CAF50',
                                                fontWeight: 600
                                            }}>
                                                {workers.length}/{building.maxWorkers}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 产出信息 */}
                                <div style={{
                                    padding: '12px 16px',
                                    background: 'rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ fontSize: 11, color: '#888' }}>当前产出：</span>
                                        <span style={{
                                            fontSize: 14,
                                            color: currentProduction > 0 ? '#4CAF50' : '#666',
                                            fontWeight: 600,
                                            marginLeft: 4
                                        }}>
                                            +{currentProduction.toFixed(1)}/秒
                                        </span>
                                    </div>
                                    {building.consumption && (
                                        <div style={{ fontSize: 11, color: '#f44336' }}>
                                            消耗: {Object.entries(building.consumption).map(([r, a]) =>
                                            `${r}×${a}`
                                        ).join(', ')}/人
                                        </div>
                                    )}
                                </div>

                                {/* 工人区域 */}
                                <div style={{
                                    padding: 16,
                                    minHeight: 80,
                                    background: 'rgba(201,162,39,0.03)',
                                    borderTop: '1px dashed rgba(201,162,39,0.2)'
                                }}>
                                    {workers.length > 0 ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {workers.map(char => {
                                                const gatherStats = calculateGatherStats(char);
                                                return (
                                                    <div key={char.id} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: '8px 12px',
                                                        background: 'rgba(201,162,39,0.1)',
                                                        border: '1px solid rgba(201,162,39,0.3)',
                                                        borderRadius: 6
                                                    }}>
                                                        <div>
                                                            <div style={{ fontSize: 12, color: '#ffd700' }}>
                                                                {char.name}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#888' }}>
                                                                🔧{gatherStats.proficiency} 🎯{gatherStats.precision} 👁️{gatherStats.perception}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => dispatch({
                                                                type: 'UNASSIGN_RESOURCE_BUILDING',
                                                                payload: { characterId: char.id, buildingId: building.id }
                                                            })}
                                                            style={{
                                                                background: 'rgba(244,67,54,0.2)',
                                                                border: '1px solid rgba(244,67,54,0.5)',
                                                                borderRadius: 4,
                                                                color: '#f44336',
                                                                padding: '4px 8px',
                                                                fontSize: 10,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            召回
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div style={{
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#555',
                                            fontSize: 12,
                                            fontStyle: 'italic'
                                        }}>
                                            {isMobile ? (selectedCharId ? '点下面按钮派遣选中角色' : '先在上方点选一个角色') : '拖拽角色到此处开始采集'}
                                        </div>
                                    )}
{isMobile && selectedCharId && (
    <div style={{ marginTop: 12 }}>
        <Button
            onClick={() => {
                if (isFull) return;
                dispatch({
                    type: 'ASSIGN_RESOURCE_BUILDING',
                    payload: { characterId: selectedCharId, buildingId: building.id }
                });
                setMobileSelectedCharId(null);
            }}
            disabled={isFull}
            style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
        >
            {isFull ? '⛔ 已满员' : `✅ 派遣 ${selectedChar?.name || '选中角色'}`}
        </Button>

        <Button
            onClick={() => setMobileSelectedCharId(null)}
            variant="secondary"
            style={{ width: '100%', marginTop: 8, padding: '10px 12px', fontSize: 13 }}
        >
            取消选择
        </Button>
    </div>
)}

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 功能建筑区域 */}
            {activeTab === 'functional' && (
                <div>
                    {/* ✅ 喷泉效率汇总（喷泉草坪/喷泉外饰独立乘区） */}
                    {(() => {
                        const fountainCount = state.functionalBuildings?.plaza_fountain || 0;
                        const { lawnCount, decorCount, lawnMult, decorMult, totalMult } = getFountainEfficiency(state);
                        const fountainRegen = fountainCount * 2 * totalMult;

                        // 没建喷泉也允许看预览（避免用户不知道怎么涨）
                        return (
                            <div style={{
                                marginBottom: 16,
                                padding: 14,
                                background: 'rgba(201,162,39,0.08)',
                                border: '1px solid rgba(201,162,39,0.35)',
                                borderRadius: 10
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ color: '#ffd700', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                                            ⛲ 喷泉脱战回血效率
                                        </div>
                                        <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5 }}>
                                            广场喷泉数量：<span style={{ color: '#fff' }}>{fountainCount}</span>（每座基础 +2/秒）
                                            <br />
                                            喷泉草坪：{lawnCount}/20（×{lawnMult.toFixed(2)}）｜喷泉外饰：{decorCount}/20（×{decorMult.toFixed(2)}）
                                            <br />
                                            总倍率：<span style={{ color: '#4CAF50', fontWeight: 700 }}>×{totalMult.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div style={{
                                        minWidth: 140,
                                        padding: '10px 12px',
                                        background: 'rgba(0,0,0,0.25)',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}>
                                        <div style={{ color: '#888', fontSize: 11, marginBottom: 2 }}>当前喷泉额外回血</div>
                                        <div style={{ color: fountainRegen > 0 ? '#4CAF50' : '#666', fontWeight: 800, fontSize: 16 }}>
                                            +{fountainRegen.toFixed(1)}/秒
                                        </div>
                                        <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>
                                            （仅脱战生效）
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ✅ 火山温泉回血汇总 */}
                    {(() => {
                        const hotSpringCount = state.functionalBuildings?.volcanic_hot_spring || 0;
                        const hotSpringPct = getVolcanicHotSpringRegenPct(state); // 每秒最大生命值百分比（0.00025=0.025%）
                        const hotSpringPctDisplay = (hotSpringPct * 100);

                        return (
                            <div style={{
                                marginBottom: 16,
                                padding: 14,
                                background: 'rgba(255,87,34,0.08)',
                                border: '1px solid rgba(255,87,34,0.35)',
                                borderRadius: 10
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ color: '#ff8a65', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                                            ♨️ 火山温泉回血
                                        </div>
                                        <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.5 }}>
                                            火山温泉数量：<span style={{ color: '#fff' }}>{hotSpringCount}</span>/20（每座 +0.025% 最大生命/秒）
                                            <br />
                                            当前总效果：<span style={{ color: hotSpringCount > 0 ? '#4CAF50' : '#666', fontWeight: 700 }}>
                                                +{hotSpringPctDisplay.toFixed(3)}% 最大生命/秒
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        minWidth: 140,
                                        padding: '10px 12px',
                                        background: 'rgba(0,0,0,0.25)',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}>
                                        <div style={{ color: '#888', fontSize: 11, marginBottom: 2 }}>说明</div>
                                        <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.4 }}>
                                            每个角色的具体回血值 = 最大生命 × {hotSpringPctDisplay.toFixed(3)}% / 秒
                                        </div>
                                        <div style={{ color: '#666', fontSize: 10, marginTop: 4 }}>
                                            （按角色最大生命值计算）
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 16
                    }}>
                    {Object.values(FUNCTIONAL_BUILDINGS).map(building => {
                        const currentCount = Math.max(0, Math.floor(Number(state.functionalBuildings?.[building.id]) || 0));

                        // ✅ 动态上限（星界铸造所：Boss 解锁上限 + 机械臂数量限制）
                        const maxCount = getFunctionalBuildingMaxCount(building.id, state);
                        const effectiveMaxCount = getFunctionalBuildingEffectiveMaxCount(building.id, state);
                        const mechanicalArmCount = Math.max(0, Math.floor(Number(state.functionalBuildings?.mechanical_arm) || 0));

                        const isMaxed = currentCount >= effectiveMaxCount;

                        // ✅ 解锁条件：击败指定 Boss
                        const unlocked = !building.unlockBoss || (state.defeatedBosses || []).includes(building.unlockBoss);

                        // ✅ 获取动态成本
                        const dynamicCost = getFunctionalBuildingCost(building.id, state);

                        // 检查资源是否足够
                        let canBuild = true;
                        Object.entries(dynamicCost).forEach(([res, amount]) => {
                            if ((state.resources[res] || 0) < amount) canBuild = false;
                        });

                        // 星界铸造所：受机械臂数量限制（即便 Boss 上限更高，也不能超过机械臂）
                        const astralNeedArms = building.id === 'astral_forge'
                            && currentCount >= mechanicalArmCount
                            && currentCount < maxCount;

                        return (
                            <div key={building.id} style={{
                                padding: 20,
                                background: !unlocked
                                    ? 'rgba(0,0,0,0.45)'
                                    : currentCount > 0
                                    ? 'linear-gradient(135deg, rgba(76,175,80,0.1), rgba(40,35,30,0.9))'
                                    : 'rgba(0,0,0,0.3)',
                                border: !unlocked
                                    ? '2px solid rgba(180,180,180,0.25)'
                                    : (currentCount > 0 ? '2px solid #4CAF50' : '2px solid #4a3c2a'),
                                borderRadius: 12
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        background: 'rgba(0,0,0,0.4)',
                                        borderRadius: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 26
                                    }}>
                                        {building.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 16, color: '#ffd700', fontWeight: 600 }}>
                                            {building.name}
                                        </div>
                                        <div style={{
                                            fontSize: 12,
                                            color: currentCount > 0 ? '#4CAF50' : '#888'
                                        }}>
                                            已建造: {currentCount}/{maxCount}
                                            {building.id === 'astral_forge' && effectiveMaxCount < maxCount && (
                                                <span style={{ color: '#ffb74d' }}>
                                                    {' '}(受机械臂限制：{effectiveMaxCount}/{mechanicalArmCount})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    fontSize: 12,
                                    color: '#aaa',
                                    marginBottom: 12,
                                    padding: 10,
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 6
                                }}>
                                    {building.description}
                                    {!unlocked && (
                                        <div style={{
                                            marginTop: 8,
                                            paddingTop: 8,
                                            borderTop: '1px dashed rgba(255,255,255,0.15)',
                                            color: '#ff9800',
                                            fontSize: 11
                                        }}>
                                            🔒 解锁条件：击败 {BOSS_NAMES[building.unlockBoss] || building.unlockBoss}
                                        </div>
                                    )}
                                </div>

                                {/* ✅ 显示动态成本 */}
                                <div style={{
                                    fontSize: 11,
                                    color: '#888',
                                    marginBottom: 12,
                                    padding: 10,
                                    background: 'rgba(0,0,0,0.15)',
                                    borderRadius: 6
                                }}>
                                    <div style={{ marginBottom: 4, color: '#aaa' }}>
                                        建造成本 {currentCount > 0 && (
                                        <span style={{ color: '#ff9800', fontSize: 10 }}>
                                                (+{((Math.pow(1.2, currentCount) - 1) * 100).toFixed(0)}%)
                                            </span>
                                    )}：
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {Object.entries(dynamicCost).map(([res, amount]) => {
                                            const names = {
                                                gold: '🟡 金币',
                                                wood: '🪵 木材',
                                                ironOre: '🪙 铁矿',
                                                ironIngot: '🔩 铁锭',
                                                herb: '🌿 草药',
                                                leather: '🦌 毛皮',
                                                magicEssence: '💎 魔法精华',
                                                alchemyOil: '⚗️ 炼金油'
                                            };
                                            const hasEnough = (state.resources[res] || 0) >= amount;
                                            return (
                                                <span key={res} style={{
                                                    color: hasEnough ? '#4CAF50' : '#f44336',
                                                    padding: '2px 6px',
                                                    background: hasEnough ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                                                    borderRadius: 4,
                                                    border: `1px solid ${hasEnough ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`
                                                }}>
                                                    {names[res] || res}: {amount.toLocaleString()}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => dispatch({
                                        type: 'BUILD_FUNCTIONAL',
                                        payload: { buildingId: building.id }
                                    })}
                                    disabled={!unlocked || !canBuild || isMaxed}
                                    style={{ width: '100%' }}
                                >
                                    {!unlocked
                                        ? '未解锁'
                                        : (astralNeedArms
                                            ? '需要机械臂'
                                            : (isMaxed ? '已达上限' : '建造'))}
                                </Button>
                            </div>
                        );
                    })}
                    </div>
                </div>
            )}
        </div>
    );
};
