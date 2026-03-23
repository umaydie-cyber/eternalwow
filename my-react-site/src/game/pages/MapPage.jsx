import React, { useCallback, useEffect, useState } from 'react';
import { Panel, Button } from '../components/ui';
import { CLASSES } from '../data/core';
import { useIsMobile } from '../hooks/responsive';

export const MapPage = ({ state, dispatch }) => {
    const isMobile = useIsMobile();
    const [draggedChar, setDraggedChar] = useState(null);
    const [selectedCharId, setSelectedCharId] = useState(null);

    // 桌面端切回时清空点选状态
    useEffect(() => {
        if (!isMobile) setSelectedCharId(null);
    }, [isMobile]);


    const selectedChar = selectedCharId
        ? state.characters.find(c => c.id === selectedCharId)
        : null;

    const assignToZone = useCallback((characterId, zoneId) => {
        if (!characterId || !zoneId) return;
        dispatch({
            type: 'ASSIGN_ZONE',
            payload: { characterId, zoneId }
        });
    }, [dispatch]);

    // ===== 拖拽派遣（桌面端保留） =====
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

    const handleDrop = (e, zoneId) => {
        e.preventDefault();
        const charId = draggedChar || e.dataTransfer.getData('text/plain');
        if (charId) {
            assignToZone(charId, zoneId);
            setDraggedChar(null);
        }
    };

    // 获取所有在主城资源建筑工作的角色ID
    const resourceAssignedIds = new Set(
        Object.values(state.resourceAssignments || {}).flat()
    );

    // 过滤：既不在地图打怪，也不在主城采集
    const unassignedChars = state.characters.filter(c =>
        !state.assignments[c.id] && !resourceAssignedIds.has(c.id)
    );

    const handleSelectChar = (charId) => {
        // 移动端使用点选派遣（拖拽在 H5 上不稳定）
        if (!isMobile) return;
        setSelectedCharId(prev => prev === charId ? null : charId);
    };

    return (
        <div>
            {/* 未分配的角色列表 */}
            {unassignedChars.length > 0 && (
                <div
                    style={{
                        position: 'sticky',
                        top: 12,
                        zIndex: 50,
                        // 可选：如果角色很多，固定栏自己滚动
                        maxHeight: isMobile ? '46vh' : '40vh',
                        overflowY: 'auto',
                    }}
                >
                    <Panel title="可派遣角色" style={{ marginBottom: 16 }}>
                        <div style={{
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap'
                        }}>
                            {unassignedChars.map(char => {
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
                                            minWidth: 140,
                                            opacity: selectedCharId && !selected ? 0.85 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (isMobile) return;
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,162,39,0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (isMobile) return;
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ fontSize: 14, color: '#ffd700', fontWeight: 700 }}>
                                            {char.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                                            Lv.{char.level} {CLASSES[char.classId].name}
                                        </div>
                                        {isMobile && selected && (
                                            <div style={{ marginTop: 6, fontSize: 11, color: '#ffd700', fontWeight: 700 }}>
                                                ✅ 已选中，点选下方区域派遣
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{
                            marginTop: 12,
                            fontSize: 12,
                            color: '#888',
                            fontStyle: 'italic'
                        }}>
                            {isMobile ? '💡 点选角色 → 点选区域【派遣】按钮' : '💡 拖拽角色到区域进行分配'}
                        </div>

                        {isMobile && selectedChar && (
                            <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                                当前选择：<span style={{ color: '#ffd700', fontWeight: 800 }}>{selectedChar.name}</span>（再次点选可取消）
                            </div>
                        )}
                    </Panel>
                </div>
            )}

            {/* 区域列表 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16
            }}>
                {Object.values(state.zones).map(zone => {
                    const assignedChars = Object.entries(state.assignments)
                        .filter(([_, zId]) => zId === zone.id)
                        .map(([cId, _]) => state.characters.find(c => c.id === cId))
                        .filter(Boolean);

                    return (
                        <div
                            key={zone.id}
                            onDragOver={!isMobile && zone.unlocked ? handleDragOver : undefined}
                            onDrop={!isMobile && zone.unlocked ? (e) => handleDrop(e, zone.id) : undefined}
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
                                                        gap: 8,
                                                        padding: 6,
                                                        background: 'rgba(201,162,39,0.1)',
                                                        borderRadius: 4,
                                                        marginBottom: 6
                                                    }}>
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
                                                        ? (selectedCharId ? '点下面按钮派遣选中角色' : '先在上方点选一个角色')
                                                        : '拖拽角色到此处'}
                                                </div>
                                            )}

                                            {/* ✅ 移动端：点选派遣按钮 */}
                                            {isMobile && selectedCharId && (
                                                <div style={{ marginTop: 10 }}>
                                                    <Button
                                                        onClick={() => {
                                                            assignToZone(selectedCharId, zone.id);
                                                            setSelectedCharId(null);
                                                        }}
                                                        disabled={!selectedCharId}
                                                        style={{ width: '100%', padding: '10px 12px', fontSize: 13 }}
                                                    >
                                                        ✅ 派遣 {selectedChar?.name || '选中角色'}
                                                    </Button>

                                                    <Button
                                                        onClick={() => setSelectedCharId(null)}
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
        </div>
    );
};
