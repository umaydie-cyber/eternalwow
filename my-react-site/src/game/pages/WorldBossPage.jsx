import React, { useState } from 'react';
import { Panel, Button } from '../components/ui';
import { WORLD_BOSSES, TEAM_BOSSES } from '../data/progression';
import { QUEST_REWARD_EQUIPMENTS } from './QuestPage';

// ==================== WorldBossPage 修改 ====================
export const WorldBossPage = ({ state, dispatch, BOSS_DATA, computeGrandVaultSnapshot, GrandVaultModal, getBossPartySize }) => {
    const [showVault, setShowVault] = useState(false);
    const [vaultRows, setVaultRows] = useState(null);

    const openVault = () => {
        const nowTs = Date.now();
        const snap = computeGrandVaultSnapshot(state, nowTs);
        const dayKey = snap.dayKey;
        const gv = snap.grandVault || {};

        // ✅ 当日已领取：点击提示
        if (gv.claimedDayKey === dayKey) {
            alert('宏伟宝库：当日已经领取。');
            return;
        }

        const rows = Array.isArray(snap.rows) ? snap.rows : [];
        if (!rows || rows.length === 0) {
            alert('宏伟宝库：你尚未击杀过可计入宝库的世界首领，暂无可用奖励。');
            return;
        }

        // ✅ 同步到存档：保证同一日周期内不会反复打开刷新出不同结果
        if (snap.changed) {
            dispatch({ type: 'SET_GRAND_VAULT', payload: { grandVault: gv } });
        }

        setVaultRows(rows);
        setShowVault(true);
    };

    const VaultButton = ({ onClick }) => (
        <button
            onClick={onClick}
            style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '2px solid rgba(201,162,39,0.9)',
                background: 'linear-gradient(180deg, rgba(201,162,39,0.25), rgba(139,115,25,0.18))',
                color: '#ffd700',
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                letterSpacing: 0.5
            }}
            title="打开宏伟宝库"
        >
            🏛️ 宏伟宝库
        </button>
    );

    return (
        <Panel
            title="世界首领"
            actions={
                <>
                    <VaultButton onClick={openVault} />
                </>
            }
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {Object.values(WORLD_BOSSES).map(boss => {
                    const bossData = BOSS_DATA[boss.id] || boss;
                    const unlocked = !boss.unlockLevel || state.characters.some(c => c.level >= (boss.unlockLevel || 0));
                    const cdSeconds = state.bossCooldowns?.[boss.id] || 0;
                    const cdText = cdSeconds > 0 ? `${String(Math.floor(cdSeconds / 60)).padStart(2, '0')}:${String(cdSeconds % 60).padStart(2, '0')}` : '';

                    // ===== 自动击杀（跨世累计10次解锁） =====
                    const totalKills = state.worldBossKillCounts?.[boss.id] || 0;
                    const autoEnabled = !!state.worldBossAutoKill?.[boss.id];
                    const autoUnlocked = totalKills >= 10;

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
                                <div>
                                    {/* 自动击杀开关 */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 10,
                                        padding: '8px 10px',
                                        marginBottom: 10,
                                        background: 'rgba(0,0,0,0.22)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 6
                                    }}>
                                        <div style={{ lineHeight: 1.2 }}>
                                            <div style={{ fontSize: 12, color: '#ffd700', fontWeight: 700 }}>
                                                🤖 自动击杀
                                            </div>
                                            <div style={{ fontSize: 10, color: '#aaa' }}>
                                                {autoUnlocked
                                                    ? 'CD结束后自动击杀并掉落'
                                                    : `解锁：累计击杀 ${totalKills}/10`}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => dispatch({ type: 'TOGGLE_WORLD_BOSS_AUTOKILL', payload: { bossId: boss.id } })}
                                            disabled={!autoUnlocked}
                                            style={{
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                background: autoEnabled ? 'rgba(76,175,80,0.18)' : 'rgba(255,255,255,0.06)',
                                                color: autoUnlocked ? (autoEnabled ? '#7CFF7C' : '#ddd') : '#666',
                                                padding: '6px 10px',
                                                borderRadius: 999,
                                                fontSize: 11,
                                                fontWeight: 800,
                                                cursor: autoUnlocked ? 'pointer' : 'not-allowed',
                                                opacity: autoUnlocked ? 1 : 0.7
                                            }}
                                        >
                                            {autoEnabled ? '开启' : '关闭'}
                                        </button>
                                    </div>

                                    {cdSeconds > 0 && (
                                        <div style={{
                                            textAlign: 'center',
                                            marginBottom: 10,
                                            padding: '8px 10px',
                                            background: 'rgba(0,0,0,0.25)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: 6,
                                            color: '#ffd700',
                                            fontSize: 12
                                        }}>
                                            ⏳ 重生冷却中：<b>{cdText}</b>
                                        </div>
                                    )}
                                    <Button
                                        variant="danger"
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            opacity: cdSeconds > 0 ? 0.6 : 1
                                        }}
                                        disabled={cdSeconds > 0}
                                        onClick={() => dispatch({ type: 'OPEN_BOSS_PREPARE', payload: boss.id })}
                                    >
                                        {cdSeconds > 0 ? `⏳ 重生中 (${cdText})` : '⚔️ 挑战'}
                                    </Button>
                                </div>
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

            {/* ==================== 团队首领区域（框架） ==================== */}
            <div style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid rgba(201,162,39,0.2)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 16
                }}>
                    <div>
                        <div style={{
                            fontSize: 18,
                            fontWeight: 900,
                            color: '#ffd700',
                            textShadow: '0 0 14px rgba(255,215,0,0.25)'
                        }}>
                            🧩 团队首领
                        </div>
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>

                        </div>
                    </div>

                    <div style={{
                        fontSize: 11,
                        color: '#888',
                        padding: '6px 10px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8
                    }}>
                        👥 5人战斗
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {Object.values(TEAM_BOSSES).map(boss => {
                        const bossData = BOSS_DATA[boss.id] || boss;
                        const unlocked = !boss.unlockLevel || state.characters.some(c => c.level >= (boss.unlockLevel || 0));
                        const cdSeconds = state.bossCooldowns?.[boss.id] || 0;
                        const cdText = cdSeconds > 0
                            ? `${String(Math.floor(cdSeconds / 60)).padStart(2, '0')}:${String(cdSeconds % 60).padStart(2, '0')}`
                            : '';

                        // ===== 自动击杀（跨世累计10次解锁） =====
                        const totalKills = state.worldBossKillCounts?.[boss.id] || 0;
                        const autoEnabled = !!state.worldBossAutoKill?.[boss.id];
                        const autoUnlocked = totalKills >= 10;

                        const partySize = getBossPartySize(boss.id);

                        return (
                            <div key={boss.id} style={{
                                padding: 20,
                                background: unlocked
                                    ? 'linear-gradient(135deg, rgba(255,120,0,0.14) 0%, rgba(60,20,10,0.32) 100%)'
                                    : 'rgba(0,0,0,0.3)',
                                border: `2px solid ${unlocked ? 'rgba(255,140,0,0.65)' : '#333'}`,
                                borderRadius: 12,
                                opacity: unlocked ? 1 : 0.5,
                                boxShadow: unlocked ? '0 4px 20px rgba(255,140,0,0.18)' : 'none'
                            }}>
                                {/* BOSS图片区域 */}
                                <div style={{
                                    width: '100%',
                                    height: 180,
                                    background: 'linear-gradient(135deg, rgba(90,30,10,0.55) 0%, rgba(25,10,6,0.75) 100%)',
                                    border: '2px solid rgba(255,140,0,0.35)',
                                    borderRadius: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.55)'
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
                                            opacity: 0.7,
                                            filter: unlocked
                                                ? 'drop-shadow(0 0 18px rgba(255,140,0,0.45))'
                                                : 'grayscale(100%)'
                                        }}>
                                            {unlocked ? '🔥' : '🔒'}
                                        </div>
                                    )}

                                    {/* 标签：团队首领 */}
                                    <div style={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 10,
                                        padding: '4px 8px',
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.55)',
                                        border: '1px solid rgba(255,140,0,0.35)',
                                        color: '#ffb74d',
                                        fontSize: 11,
                                        fontWeight: 900,
                                        letterSpacing: 0.5
                                    }}>
                                        团队首领 · {partySize}人
                                    </div>

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
                                        background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
                                        pointerEvents: 'none'
                                    }} />
                                </div>

                                {/* BOSS名称 */}
                                <h3 style={{
                                    textAlign: 'center',
                                    color: unlocked ? '#ffb74d' : '#666',
                                    margin: '0 0 12px 0',
                                    fontSize: 20,
                                    textShadow: unlocked ? '0 0 10px rgba(255,140,0,0.25)' : 'none'
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
                                    <div>
                                        {/* 自动击杀开关 */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 10,
                                            padding: '8px 10px',
                                            marginBottom: 10,
                                            background: 'rgba(0,0,0,0.22)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: 6
                                        }}>
                                            <div style={{ lineHeight: 1.2 }}>
                                                <div style={{ fontSize: 12, color: '#ffd700', fontWeight: 700 }}>
                                                    🤖 自动击杀
                                                </div>
                                                <div style={{ fontSize: 10, color: '#aaa' }}>
                                                    {autoUnlocked
                                                        ? 'CD结束后自动击杀并掉落'
                                                        : `解锁：累计击杀 ${totalKills}/10`}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => dispatch({ type: 'TOGGLE_WORLD_BOSS_AUTOKILL', payload: { bossId: boss.id } })}
                                                disabled={!autoUnlocked}
                                                style={{
                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                    background: autoEnabled ? 'rgba(76,175,80,0.18)' : 'rgba(255,255,255,0.06)',
                                                    color: autoUnlocked ? (autoEnabled ? '#7CFF7C' : '#ddd') : '#666',
                                                    padding: '6px 10px',
                                                    borderRadius: 999,
                                                    fontSize: 11,
                                                    fontWeight: 800,
                                                    cursor: autoUnlocked ? 'pointer' : 'not-allowed',
                                                    opacity: autoUnlocked ? 1 : 0.7
                                                }}
                                            >
                                                {autoEnabled ? '开启' : '关闭'}
                                            </button>
                                        </div>

                                        {cdSeconds > 0 && (
                                            <div style={{
                                                textAlign: 'center',
                                                marginBottom: 10,
                                                padding: '8px 10px',
                                                background: 'rgba(0,0,0,0.25)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: 6,
                                                color: '#ffd700',
                                                fontSize: 12
                                            }}>
                                                ⏳ 重生冷却中：<b>{cdText}</b>
                                            </div>
                                        )}
                                        <Button
                                            variant="danger"
                                            style={{
                                                width: '100%',
                                                padding: '10px 16px',
                                                fontSize: 14,
                                                fontWeight: 600,
                                                opacity: cdSeconds > 0 ? 0.6 : 1
                                            }}
                                            disabled={cdSeconds > 0}
                                            onClick={() => dispatch({ type: 'OPEN_BOSS_PREPARE', payload: boss.id })}
                                        >
                                            {cdSeconds > 0 ? `⏳ 重生中 (${cdText})` : '🔥 进入准备'}
                                        </Button>
                                    </div>
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
            </div>

            {showVault && (
                <GrandVaultModal
                    rows={vaultRows}
                    inventoryFull={(state.inventory?.length || 0) >= (state.inventorySize || 0)}
                    onClose={() => setShowVault(false)}
                    onClaim={(templateId) => {
                        if (!templateId) return;
                        dispatch({ type: 'CLAIM_GRAND_VAULT_REWARD', payload: { templateId } });
                        setShowVault(false);
                    }}
                />
            )}
        </Panel>
    );
};

// ==================== PAGE: ACHIEVEMENT ====================
export const AchievementPage = ({ state, ACHIEVEMENTS, formatBonusText }) => {
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
export const CodexPage = ({
    state,
    dispatch,
    getRarityColor,
    ItemIcon,
    FIXED_EQUIPMENTS,
    ITEMS,
    MOUNT_CODEX,
    BADGE_UPGRADE_RULES,
    CODEX_SET_EFFECTS,
    formatBonusText,
    scaleStats,
}) => {
    const [tab, setTab] = React.useState('equipment'); // 'equipment' | 'junk' | 'effects'
// ===== 装备悬浮提示（宏伟宝库风格）=====
    const [hoveredEquip, setHoveredEquip] = React.useState(null); // { tpl, unlocked, lv100, dropEnabled }
    const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

    const STAT_LABELS = {
        hp: '生命值',
        mp: '法力值',
        attack: '攻击',
        spellPower: '法术强度',
        armor: '护甲',
        magicResist: '法术抗性',
        blockValue: '格挡值',
        blockRate: '格挡率',
        critRate: '暴击',
        haste: '急速',
        mastery: '精通',
        versatility: '全能',
        critDamage: '暴击伤害',
        lifeSteal: '吸血',
        dodgeRate: '闪避',
    };

    const SLOT_LABELS = {
        head: '头部',
        chest: '胸部',
        legs: '腿部',
        hands: '手部',
        feet: '脚部',
        shoulder: '肩部',
        waist: '腰部',
        wrist: '手腕',
        neck: '项链',
        ring: '戒指',
        mainHand: '主手',
        offHand: '副手',
        trinket: '饰品',
    };

    const formatEquipStat = (k, vRaw) => {
        const v = Number(vRaw) || 0;
        const label = STAT_LABELS[k] || k;

        // 百分比点数（例如 暴击=+6%）
        const percentPointStats = new Set(['critRate', 'haste', 'mastery', 'versatility', 'blockRate', 'dodgeRate']);
        if (percentPointStats.has(k)) {
            const val = Math.round(v * 10) / 10;
            const sign = val >= 0 ? '+' : '';
            return { label, value: `${sign}${val}%` };
        }

        // 暴击伤害：额外倍率（0.10 => +10%）
        if (k === 'critDamage') {
            const pct = Math.round(v * 1000) / 10;
            const sign = pct >= 0 ? '+' : '';
            return { label, value: `${sign}${pct}%` };
        }

        const val = Math.floor(v);
        const sign = val >= 0 ? '+' : '';
        return { label, value: `${sign}${val}` };
    };

    const handleEquipMouseMove = (e) => {
        const pad = 16;
        const w = 280;
        const h = 260;
        const vw = window.innerWidth || 1200;
        const vh = window.innerHeight || 800;

        let x = (e.clientX ?? 0) + 18;
        let y = (e.clientY ?? 0) + 18;

        if (x + w + pad > vw) x = (e.clientX ?? 0) - w - 18;
        if (y + h + pad > vh) y = (e.clientY ?? 0) - h - 18;

        x = Math.max(pad, Math.min(vw - w - pad, x));
        y = Math.max(pad, Math.min(vh - h - pad, y));

        setTooltipPos({ x, y });
    };

    React.useEffect(() => {
      // 只兜底“装备页”的 tooltip，避免影响别的 tab
      const onMove = (e) => {
        // 没开 tooltip 就不用检查（省性能）
        if (!hoveredEquip?.tpl) return;
        // 不在装备 tab，也关掉（避免切 tab 后残留）
        if (tab !== 'equipment') {
          setHoveredEquip(null);
          return;
        }

        const x = e.clientX ?? 0;
        const y = e.clientY ?? 0;

        const el = document.elementFromPoint(x, y);
        const card = el?.closest?.('[data-codex-equip="1"]');

        // 如果鼠标当前位置不在任何装备卡片上：强制关闭
        if (!card) setHoveredEquip(null);
      };

      const hide = () => setHoveredEquip(null);

      // 用捕获阶段更稳（事件丢失概率更低）
      window.addEventListener('mousemove', onMove, true);
      // 鼠标冲出页面/窗口失焦时也要关（否则会残留）
      document.addEventListener('mouseleave', hide);
      window.addEventListener('blur', hide);

      return () => {
        window.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('mouseleave', hide);
        window.removeEventListener('blur', hide);
      };
    }, [hoveredEquip?.tpl, tab]);

    const renderEquipTooltip = () => {
        if (!hoveredEquip?.tpl) return null;
        const { tpl, unlocked, lv100, dropEnabled } = hoveredEquip;

        const displayLv = lv100 ? 100 : (Number(tpl.level) || 0);
        const scaled = scaleStats(tpl.baseStats || {}, tpl.growth || {}, displayLv);

        const statLines = Object.entries(scaled)
            .filter(([, v]) => (Number(v) || 0) !== 0)
            .map(([k, v]) => formatEquipStat(k, v));

        const rarityColor = getRarityColor(tpl.rarity);
        const slotText = SLOT_LABELS[tpl.slot] || tpl.slot || '未知部位';

        return (
            <div
                style={{
                    position: 'fixed',
                    left: tooltipPos.x,
                    top: tooltipPos.y,
                    width: 280,
                    zIndex: 9999,
                    pointerEvents: 'none',
                    background: 'linear-gradient(180deg, rgba(18,18,18,0.96), rgba(8,8,8,0.92))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    boxShadow: '0 18px 40px rgba(0,0,0,0.55)',
                    padding: 12,
                }}
            >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 8,
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <ItemIcon item={tpl} size={28} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                        <div style={{
                            fontSize: 13,
                            fontWeight: 900,
                            color: unlocked ? rarityColor : '#666',
                            textShadow: unlocked ? '0 0 10px rgba(0,0,0,0.55)' : 'none',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}>
                            {tpl.name}
                        </div>

                        <div style={{ marginTop: 2, fontSize: 10, color: '#aaa' }}>
                            {slotText} · Lv.{displayLv}{lv100 ? ' ✨' : ''}
                        </div>
                    </div>
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

                <div style={{ fontSize: 11, color: '#ddd', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {statLines.length > 0 ? statLines.map((row, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                            <span style={{ color: '#bbb' }}>{row.label}</span>
                            <span style={{ color: '#fff', fontWeight: 800 }}>{row.value}</span>
                        </div>
                    )) : (
                        <div style={{ color: '#777' }}>无属性</div>
                    )}
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '10px 0 8px' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
                <span style={{ color: unlocked ? '#8ee18e' : '#777' }}>
                    {unlocked ? '✅ 已点亮图鉴' : '🔒 未点亮图鉴'}
                </span>
                    <span style={{ color: dropEnabled ? 'rgba(120,220,120,0.9)' : 'rgba(255,80,80,0.9)' }}>
                    掉落：{dropEnabled ? '开启' : '关闭'}
                </span>
                </div>
            </div>
        );
    };


    const allowDrop = (id) => state.dropFilters?.[id] !== false;

    // ===== 装备图鉴 =====
    const allEquipTemplates = [
        ...Object.values(FIXED_EQUIPMENTS),
        ...Object.values(QUEST_REWARD_EQUIPMENTS),
    ];
    const equipCodexSet = new Set(state.codex || []);
    const lv100CodexSet = new Set(state.codexEquipLv100 || []);

    const hasLevel100 = (equipmentId) => {
        return lv100CodexSet.has(equipmentId);
    };

    // ===== 垃圾图鉴 =====
    const allJunkTemplates = Object.values(ITEMS).filter(it => it?.type === 'junk');
    const junkCodexSet = new Set(state.codexJunk || []);

    // ===== 坐骑图鉴 =====
    const mountTemplates = Array.isArray(MOUNT_CODEX) ? MOUNT_CODEX : [];
    const mountCodexSet = new Set(state.codexMounts || []);

    // ===== Boss 徽章（可在图鉴里开关掉落） =====
    const badgeTemplates = Object.keys(BADGE_UPGRADE_RULES || {})
        .map(id => ITEMS?.[id])
        .filter(Boolean);

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
                    <TabButton id="badges">🏅 徽章</TabButton>
                    <TabButton id="mounts">🐴 坐骑</TabButton>
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
                                    data-codex-equip="1"
                                    data-equip-id={tpl.id}
                                    onMouseEnter={(e) => {
                                        setHoveredEquip({ tpl, unlocked, lv100, dropEnabled });
                                        handleEquipMouseMove(e);
                                    }}
                                    onMouseMove={(e) => {
                                        setHoveredEquip(prev => (prev?.tpl?.id === tpl.id ? prev : { tpl, unlocked, lv100, dropEnabled }));
                                        handleEquipMouseMove(e);
                                    }}
                                    onMouseLeave={() => setHoveredEquip(null)}
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


            {/* ===== 坐骑图鉴 ===== */}
            {tab === 'mounts' && (
                <>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                        ✅ 点亮：击杀世界首领/地区战斗胜利有概率获得坐骑，或在时空商城购买
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: 10
                    }}>
                        {mountTemplates.map((m) => {
                            const unlocked = mountCodexSet.has(m.id);
                            const bonusText = m.bonus ? formatBonusText(m.bonus) : '';

                            return (
                                <div
                                    key={m.id}
                                    title={`${m.name}${m.dropChance ? `（掉落率 ${Math.round(m.dropChance * 100)}%）` : ''}`}
                                    style={{
                                        background: unlocked ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.18)',
                                        borderRadius: 10,
                                        border: unlocked ? '2px solid rgba(255, 215, 0, 0.85)' : '1px solid #333',
                                        boxShadow: unlocked ? '0 0 12px rgba(255,215,0,0.18)' : 'none',
                                        padding: 12,
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '100%',
                                        height: 114,
                                        borderRadius: 8,
                                        background: 'rgba(0,0,0,0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        marginBottom: 8,
                                        overflow: 'hidden'
                                    }}>
                                        {m.imageUrl
                                            ? (
                                                <img
                                                    src={m.imageUrl}
                                                    alt={m.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            )
                                            : (
                                                <div style={{ fontSize: 36, opacity: unlocked ? 1 : 0.35 }}>
                                                    {m.icon || '🐴'}
                                                </div>
                                            )
                                        }
                                    </div>

                                    <div style={{
                                        fontSize: 12,
                                        fontWeight: 800,
                                        color: unlocked ? '#ffd700' : '#555',
                                        lineHeight: 1.2,
                                        minHeight: 28
                                    }}>
                                        {m.name}
                                    </div>

                                    <div style={{ marginTop: 4, fontSize: 10, color: '#777' }}>
                                        {m.source}{m.dropChance ? `（${Math.round(m.dropChance * 100)}%）` : ''}
                                    </div>

                                    {!!bonusText && (
                                        <div style={{
                                            marginTop: 8,
                                            fontSize: 10,
                                            fontWeight: 800,
                                            color: unlocked ? 'rgba(120,220,120,0.95)' : '#666',
                                            background: unlocked ? 'rgba(120,220,120,0.10)' : 'rgba(255,255,255,0.04)',
                                            border: unlocked ? '1px solid rgba(120,220,120,0.25)' : '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: 6,
                                            padding: '6px 8px',
                                        }}>
                                            {bonusText}
                                        </div>
                                    )}

                                    <div style={{ marginTop: 8, fontSize: 9, color: unlocked ? '#aaa' : '#444' }}>
                                        {unlocked ? '已获得' : '未获得'}
                                    </div>
                                </div>
                            );
                        })}

                        {mountTemplates.length === 0 && (
                            <div style={{ color: '#666', fontSize: 12 }}>
                                当前没有定义坐骑
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ===== 徽章图鉴（Boss 掉落） ===== */}
            {tab === 'badges' && (
                <>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                        ✅ 点亮：曾获得过该徽章　|　点击切换掉落开关（影响世界首领 / 自动击杀 / 其它掉落来源）
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                        gap: 10
                    }}>
                        {badgeTemplates.map((tpl) => {
                            const unlocked = junkCodexSet.has(tpl.id) || (state.inventory || []).some(i => i?.id === tpl.id);
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
                                            <ItemIcon item={tpl} size={28} />
                                        </div>

                                        <div style={{
                                            fontSize: 10,
                                            color: unlocked ? '#ffd700' : '#555',
                                            lineHeight: 1.2,
                                            minHeight: 30,
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

                                        <DropTag enabled={dropEnabled} />
                                    </CardShell>
                                </div>
                            );
                        })}

                        {badgeTemplates.length === 0 && (
                            <div style={{ color: '#666', fontSize: 12 }}>
                                当前没有定义 Boss 徽章
                            </div>
                        )}
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
                                            <ItemIcon item={tpl} size={26} />
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
            {renderEquipTooltip()}

        </Panel>
    );
};
