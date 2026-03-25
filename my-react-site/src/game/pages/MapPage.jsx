import React, { useCallback, useMemo, useState } from 'react';
import { Panel, Button } from '../components/ui';
import { CLASSES } from '../data/core';
import { GATHERING_ZONES, MATERIALS, PROFESSIONS } from '../data/professions';
import { useIsMobile } from '../hooks/responsive';

const normalizeProfessionList = (professions) => {
    if (!Array.isArray(professions)) return [];
    return professions
        .filter(professionId => !!PROFESSIONS[professionId])
        .filter((professionId, index, arr) => arr.indexOf(professionId) === index)
        .slice(0, 2);
};

const normalizeGatherEntry = (entry) => {
    if (typeof entry === 'string') return { materialId: entry, minSkill: null };
    if (!entry || typeof entry !== 'object') return null;
    return {
        materialId: entry.materialId || entry.id,
        minSkill: Number.isFinite(Number(entry.minSkill)) ? Math.max(0, Math.floor(Number(entry.minSkill))) : null,
    };
};

const formatGatherMaterialLabel = (entry, { showMinSkill = true } = {}) => {
    const material = MATERIALS[entry?.materialId];
    if (!material) return entry?.materialId || '';
    const minSkillLabel = showMinSkill && entry?.minSkill != null ? `（最低${entry.minSkill}）` : '';
    return `${material.icon} ${material.name}${minSkillLabel}`;
};

export const MapPage = ({ state, dispatch }) => {
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState('combat');
    const [draggedChar, setDraggedChar] = useState(null);
    const [mobileSelectedCharId, setMobileSelectedCharId] = useState(null);

    const resourceAssignedIds = useMemo(() => (
        new Set(Object.values(state.resourceAssignments || {}).flat())
    ), [state.resourceAssignments]);
    const combatAssignedIds = useMemo(() => (
        new Set(Object.keys(state.assignments || {}))
    ), [state.assignments]);
    const gatherAssignedIds = useMemo(() => (
        new Set(Object.keys(state.gatherAssignments || {}))
    ), [state.gatherAssignments]);

    const unassignedChars = useMemo(() => (
        state.characters.filter(char =>
            !combatAssignedIds.has(char.id) &&
            !gatherAssignedIds.has(char.id) &&
            !resourceAssignedIds.has(char.id)
        )
    ), [state.characters, combatAssignedIds, gatherAssignedIds, resourceAssignedIds]);

    const gatherReadyChars = useMemo(() => (
        unassignedChars.filter(char => normalizeProfessionList(char.professions).length > 0)
    ), [unassignedChars]);

    const visibleChars = activeTab === 'combat' ? unassignedChars : gatherReadyChars;
    const selectedChar = isMobile
        ? visibleChars.find(char => char.id === mobileSelectedCharId) || null
        : null;
    const selectedCharId = selectedChar?.id || null;

    const assignToZone = useCallback((characterId, zoneId) => {
        if (!characterId || !zoneId) return;
        dispatch({
            type: 'ASSIGN_ZONE',
            payload: { characterId, zoneId }
        });
    }, [dispatch]);

    const assignToGatherZone = useCallback((characterId, zoneId) => {
        if (!characterId || !zoneId) return;
        dispatch({
            type: 'ASSIGN_GATHER_ZONE',
            payload: { characterId, zoneId }
        });
    }, [dispatch]);

    const handleDragStart = (e, charId) => {
        setDraggedChar(charId);
        e.dataTransfer.setData('text/plain', charId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, zoneId, mode) => {
        e.preventDefault();
        const charId = draggedChar || e.dataTransfer.getData('text/plain');
        if (!charId) return;

        if (mode === 'gather') {
            assignToGatherZone(charId, zoneId);
        } else {
            assignToZone(charId, zoneId);
        }

        setDraggedChar(null);
    };

    const handleSelectChar = (charId) => {
        if (!isMobile) return;
        setMobileSelectedCharId(prev => prev === charId ? null : charId);
    };

    const renderCharacterList = (chars, emptyText) => (
        chars.length > 0 ? (
            <div
                style={{
                    position: 'sticky',
                    top: 12,
                    zIndex: 50,
                    maxHeight: isMobile ? '46vh' : '40vh',
                    overflowY: 'auto',
                    marginBottom: 16,
                }}
            >
                <Panel title={activeTab === 'combat' ? '可派遣角色' : '可派遣采集角色'}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {chars.map(char => {
                            const learnedProfessions = normalizeProfessionList(char.professions);
                            const selected = selectedCharId === char.id;

                            return (
                                <div
                                    key={char.id}
                                    draggable={!isMobile}
                                    onDragStart={!isMobile ? (e) => handleDragStart(e, char.id) : undefined}
                                    onClick={() => handleSelectChar(char.id)}
                                    style={{
                                        padding: '12px 16px',
                                        background: selected
                                            ? 'linear-gradient(135deg, rgba(255,215,0,0.22), rgba(139,115,25,0.12))'
                                            : 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(139,115,25,0.1))',
                                        border: selected ? '2px solid #ffd700' : '2px solid #c9a227',
                                        borderRadius: 8,
                                        cursor: isMobile ? 'pointer' : 'grab',
                                        transition: 'all 0.2s',
                                        userSelect: 'none',
                                        minWidth: 160,
                                    }}
                                >
                                    <div style={{ fontSize: 14, color: '#ffd700', fontWeight: 700 }}>
                                        {char.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                                        Lv.{char.level} {CLASSES[char.classId]?.name}
                                    </div>
                                    {activeTab === 'gather' && (
                                        <div style={{ marginTop: 6, fontSize: 11, color: '#aaa' }}>
                                            {learnedProfessions.map(professionId => `${PROFESSIONS[professionId]?.icon} ${PROFESSIONS[professionId]?.name}`).join(' / ')}
                                        </div>
                                    )}
                                    {isMobile && selected && (
                                        <div style={{ marginTop: 6, fontSize: 11, color: '#ffd700', fontWeight: 700 }}>
                                            已选中，点下方区域派遣
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: 12, fontSize: 12, color: '#888', fontStyle: 'italic' }}>
                        {isMobile ? '点选角色后，再点区域按钮派遣' : '拖拽角色到区域进行分配'}
                    </div>

                    {isMobile && selectedChar && (
                        <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                            当前选择：<span style={{ color: '#ffd700', fontWeight: 800 }}>{selectedChar.name}</span>
                        </div>
                    )}
                </Panel>
            </div>
        ) : (
            <Panel title={activeTab === 'combat' ? '可派遣角色' : '可派遣采集角色'} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#888' }}>{emptyText}</div>
            </Panel>
        )
    );

    const renderCombatZones = () => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16
        }}>
            {Object.values(state.zones).map(zone => {
                const assignedChars = Object.entries(state.assignments || {})
                    .filter(([, zId]) => zId === zone.id)
                    .map(([charId]) => state.characters.find(char => char.id === charId))
                    .filter(Boolean);

                return (
                    <div
                        key={zone.id}
                        onDragOver={!isMobile && zone.unlocked ? handleDragOver : undefined}
                        onDrop={!isMobile && zone.unlocked ? (e) => handleDrop(e, zone.id, 'combat') : undefined}
                        style={{ opacity: zone.unlocked ? 1 : 0.6 }}
                    >
                        <Panel title={zone.name}>
                            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 12 }}>
                                等级: {zone.level} | {zone.unlocked ? '已解锁' : `需要等级 ${zone.unlockLevel}`}
                            </div>

                            {zone.unlocked && (
                                <>
                                    <div style={{ marginBottom: 12 }}>
                                        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>怪物:</div>
                                        {zone.enemies?.map((enemy, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    fontSize: 11,
                                                    padding: 6,
                                                    background: 'rgba(0,0,0,0.3)',
                                                    borderRadius: 4,
                                                    marginBottom: 4
                                                }}
                                            >
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
                                        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>已分配角色:</div>

                                        {assignedChars.length > 0 ? (
                                            assignedChars.map(char => (
                                                <div
                                                    key={char.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        padding: 6,
                                                        background: 'rgba(201,162,39,0.1)',
                                                        borderRadius: 4,
                                                        marginBottom: 6
                                                    }}
                                                >
                                                    <span style={{ fontSize: 11 }}>
                                                        {char.name} (Lv.{char.level})
                                                    </span>
                                                    <Button
                                                        onClick={(e) => {
                                                            e?.stopPropagation?.();
                                                            dispatch({
                                                                type: 'UNASSIGN_CHARACTER',
                                                                payload: { characterId: char.id }
                                                            });
                                                        }}
                                                        variant="danger"
                                                        style={{ padding: '6px 10px', fontSize: 11 }}
                                                    >
                                                        召回
                                                    </Button>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                                                {isMobile
                                                    ? (selectedCharId ? '点下方按钮派遣选中角色' : '先在上方点选一个角色')
                                                    : '拖拽角色到此处'}
                                            </div>
                                        )}

                                        {isMobile && selectedCharId && zone.unlocked && (
                                            <div style={{ marginTop: 10 }}>
                                                <Button
                                                    onClick={() => {
                                                        assignToZone(selectedCharId, zone.id);
                                                        setMobileSelectedCharId(null);
                                                    }}
                                                    style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
                                                >
                                                    派遣 {selectedChar?.name || '选中角色'}
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
                                </>
                            )}
                        </Panel>
                    </div>
                );
            })}
        </div>
    );

    const renderGatherZones = () => (
        <div style={{ display: 'grid', gap: 16 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 16
            }}>
                {Object.values(GATHERING_ZONES).map(zone => {
                    const assignedChars = Object.entries(state.gatherAssignments || {})
                        .filter(([, zId]) => zId === zone.id)
                        .map(([charId]) => state.characters.find(char => char.id === charId))
                        .filter(Boolean);

                    return (
                        <div
                            key={zone.id}
                            onDragOver={!isMobile ? handleDragOver : undefined}
                            onDrop={!isMobile ? (e) => handleDrop(e, zone.id, 'gather') : undefined}
                        >
                            <Panel title={`${zone.icon} ${zone.name}`}>
                                <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.7, marginBottom: 12 }}>
                                    {zone.description}
                                </div>

                                <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                                    {Object.entries(zone.professionPools || {}).map(([professionId, materialEntries]) => (
                                        <div
                                            key={professionId}
                                            style={{
                                                padding: 10,
                                                borderRadius: 8,
                                                background: 'rgba(0,0,0,0.25)',
                                                border: '1px solid #4a3c2a',
                                            }}
                                        >
                                            <div style={{ fontSize: 12, color: '#ffd700', marginBottom: 6 }}>
                                                {PROFESSIONS[professionId]?.icon} {PROFESSIONS[professionId]?.name}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#aaa' }}>
                                                {materialEntries.map(rawEntry => {
                                                    const entry = normalizeGatherEntry(rawEntry);
                                                    return formatGatherMaterialLabel(entry);
                                                }).join(' / ')}
                                            </div>
                                            {Array.isArray(zone.rareCompanions?.[professionId]) && zone.rareCompanions[professionId].length > 0 && (
                                                <div style={{ marginTop: 6, fontSize: 11, color: '#d7b56d' }}>
                                                    稀有伴生：
                                                    {zone.rareCompanions[professionId].map(rawEntry => {
                                                        const entry = normalizeGatherEntry(rawEntry);
                                                        return ` ${formatGatherMaterialLabel(entry, { showMinSkill: false })}`;
                                                    }).join(' / ')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    minHeight: 60,
                                    padding: 12,
                                    background: 'rgba(76,175,80,0.08)',
                                    border: '2px dashed #355b35',
                                    borderRadius: 6,
                                }}>
                                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>已派驻采集角色:</div>

                                    {assignedChars.length > 0 ? (
                                        assignedChars.map(char => (
                                            <div
                                                key={char.id}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: 6,
                                                    background: 'rgba(76,175,80,0.12)',
                                                    borderRadius: 4,
                                                    marginBottom: 6
                                                }}
                                            >
                                                <span style={{ fontSize: 11 }}>
                                                    {char.name}
                                                </span>
                                                <Button
                                                    onClick={() => dispatch({
                                                        type: 'UNASSIGN_GATHER_CHARACTER',
                                                        payload: { characterId: char.id }
                                                    })}
                                                    variant="danger"
                                                    style={{ padding: '6px 10px', fontSize: 11 }}
                                                >
                                                    召回
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                                            {isMobile
                                                ? (selectedCharId ? '点下方按钮派遣选中角色' : '先选择一个已学习专业的角色')
                                                : '拖拽已学习专业的角色到此处'}
                                        </div>
                                    )}

                                    {isMobile && selectedCharId && (
                                        <div style={{ marginTop: 10 }}>
                                            <Button
                                                onClick={() => {
                                                    assignToGatherZone(selectedCharId, zone.id);
                                                    setMobileSelectedCharId(null);
                                                }}
                                                style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
                                            >
                                                派遣 {selectedChar?.name || '选中角色'} 采集
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
                            </Panel>
                        </div>
                    );
                })}
            </div>

            <Panel title="最近采集记录">
                {(state.gatherLogs || []).length > 0 ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                        {(state.gatherLogs || []).slice(0, 12).map((log, index) => (
                            <div
                                key={`${log}_${index}`}
                                style={{
                                    fontSize: 12,
                                    color: '#ddd',
                                    padding: '8px 10px',
                                    background: 'rgba(0,0,0,0.25)',
                                    borderRadius: 6,
                                }}
                            >
                                {log}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ fontSize: 12, color: '#888' }}>
                        暂无采集记录。把角色拖到采集区域后，每 30 秒会触发一次采集事件。
                    </div>
                )}
            </Panel>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <Button
                    onClick={() => setActiveTab('combat')}
                    variant={activeTab === 'combat' ? 'primary' : 'secondary'}
                >
                    战斗
                </Button>
                <Button
                    onClick={() => setActiveTab('gather')}
                    variant={activeTab === 'gather' ? 'primary' : 'secondary'}
                >
                    采集
                </Button>
            </div>

            {renderCharacterList(
                visibleChars,
                activeTab === 'combat'
                    ? '暂无可派遣角色，可能已在战斗地图、主城资源建筑或采集区域工作。'
                    : '暂无可派遣的采集角色。先去“专业”页学习草药或采矿。'
            )}

            {activeTab === 'combat' ? renderCombatZones() : renderGatherZones()}
        </div>
    );
};
