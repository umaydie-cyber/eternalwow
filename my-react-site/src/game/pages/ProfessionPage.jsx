import React, { useState } from 'react';
import { Panel, Button } from '../components/ui';
import { CLASSES } from '../data/core';
import { PROFESSIONS, PROFESSION_LEARN_COSTS, PROFESSION_SLOT_LIMIT } from '../data/professions';

const professionList = Object.values(PROFESSIONS);

const normalizeProfessionList = (professions) => {
    if (!Array.isArray(professions)) return [];
    return professions
        .filter(professionId => !!PROFESSIONS[professionId])
        .filter((professionId, index, arr) => arr.indexOf(professionId) === index)
        .slice(0, PROFESSION_SLOT_LIMIT);
};

const getLearnCost = (slotIndex) => PROFESSION_LEARN_COSTS[Math.min(slotIndex, PROFESSION_LEARN_COSTS.length - 1)];

export const ProfessionPage = ({ state, dispatch }) => {
    const [openSelectorKey, setOpenSelectorKey] = useState(null);
    const currentGold = Math.max(0, Math.floor(Number(state.resources?.gold) || 0));

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <Panel title="专业系统">
                <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.8 }}>
                    每名角色最多学习 {PROFESSION_SLOT_LIMIT} 个专业。第 1 个专业花费 🪙{PROFESSION_LEARN_COSTS[0].toLocaleString()}，
                    第 2 个专业花费 🪙{PROFESSION_LEARN_COSTS[1].toLocaleString()}。
                    采集地图每 30 秒触发一次采集事件，并提升对应专业熟练度，最高 300 点。
                    专业技能达到材料隐藏难度的 2 倍后才会稳定产出 2 星材料；未达到时仍有概率产出 2 星材料。
                    精细和熟练会继续放大单次采集数量。
                </div>
            </Panel>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {state.characters.map(char => {
                    const learned = normalizeProfessionList(char.professions);
                    const learnedSet = new Set(learned);
                    const nextSlotIndex = learned.length;
                    const canLearnMore = nextSlotIndex < PROFESSION_SLOT_LIMIT;
                    const selectorKey = canLearnMore ? `${char.id}:${nextSlotIndex}` : null;
                    const isSelectorOpen = selectorKey && openSelectorKey === selectorKey;

                    return (
                        <Panel key={char.id} title={char.name}>
                            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                                Lv.{char.level} {CLASSES[char.classId]?.name || char.classId}
                            </div>

                            <div style={{ display: 'grid', gap: 10 }}>
                                {Array.from({ length: PROFESSION_SLOT_LIMIT }, (_, slotIndex) => {
                                    const professionId = learned[slotIndex];

                                    if (professionId) {
                                        const profession = PROFESSIONS[professionId];
                                        const skill = Math.max(0, Math.floor(Number(char.professionSkills?.[profession.id]) || 0));

                                        return (
                                            <div
                                                key={`${char.id}-${profession.id}`}
                                                style={{
                                                    padding: 14,
                                                    borderRadius: 10,
                                                    border: '1px solid #4CAF50',
                                                    background: 'linear-gradient(135deg, rgba(76,175,80,0.18), rgba(0,0,0,0.25))',
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#ffd700' }}>
                                                            {profession.icon} {profession.name}
                                                        </div>
                                                        <div style={{ marginTop: 6, fontSize: 12, color: '#aaa' }}>
                                                            熟练度：{skill}/{profession.maxSkill}
                                                        </div>
                                                    </div>

                                                    <Button disabled style={{ minWidth: 104 }}>
                                                        已掌握
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const isNextSlot = slotIndex === nextSlotIndex;
                                    const learnCost = getLearnCost(slotIndex);
                                    const isLockedSlot = !isNextSlot;

                                    return (
                                        <div
                                            key={`${char.id}-slot-${slotIndex}`}
                                            style={{
                                                padding: 14,
                                                borderRadius: 10,
                                                border: `1px solid ${isLockedSlot ? '#3d352a' : '#4a3c2a'}`,
                                                background: isLockedSlot ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.28)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#c9a227' }}>
                                                        空闲专业槽位 {slotIndex + 1}
                                                    </div>
                                                    <div style={{ marginTop: 6, fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                                                        {isLockedSlot
                                                            ? '先学习前一个专业后，才能解锁这个栏位。'
                                                            : `点击学习后可查看全部专业。当前费用：🪙${learnCost.toLocaleString()}`}
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => {
                                                        if (isLockedSlot) return;
                                                        setOpenSelectorKey(isSelectorOpen ? null : selectorKey);
                                                    }}
                                                    disabled={isLockedSlot}
                                                    style={{ minWidth: 104 }}
                                                >
                                                    {isLockedSlot ? '待解锁' : (isSelectorOpen ? '收起' : '学习')}
                                                </Button>
                                            </div>

                                            {isNextSlot && isSelectorOpen ? (
                                                <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                                                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                                                        可学习专业列表。当前仅草药、采矿开放，其余专业先展示名称与占位。
                                                    </div>

                                                    <div style={{ display: 'grid', gap: 8 }}>
                                                        {professionList.map(profession => {
                                                            const isLearned = learnedSet.has(profession.id);
                                                            const isAvailable = profession.isAvailable !== false;
                                                            const canAfford = currentGold >= learnCost;
                                                            const canLearn = !isLearned && isAvailable && canAfford;

                                                            let buttonLabel = `学习 (${learnCost.toLocaleString()})`;
                                                            if (isLearned) buttonLabel = '已掌握';
                                                            else if (!isAvailable) buttonLabel = '暂未开放';
                                                            else if (!canAfford) buttonLabel = '金币不足';

                                                            return (
                                                                <div
                                                                    key={profession.id}
                                                                    style={{
                                                                        padding: 12,
                                                                        borderRadius: 8,
                                                                        border: `1px solid ${isAvailable ? 'rgba(201,162,39,0.28)' : 'rgba(90,90,90,0.35)'}`,
                                                                        background: isAvailable ? 'rgba(201,162,39,0.08)' : 'rgba(80,80,80,0.12)',
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                                                        <div>
                                                                            <div style={{ fontSize: 14, fontWeight: 700, color: isAvailable ? '#ffd700' : '#aaa' }}>
                                                                                {profession.icon} {profession.name}
                                                                            </div>
                                                                            <div style={{ marginTop: 4, fontSize: 11, color: '#888' }}>
                                                                                {isAvailable ? '当前可学习' : '暂未开放，当前版本不可学习'}
                                                                            </div>
                                                                        </div>

                                                                        <Button
                                                                            onClick={() => {
                                                                                if (!canLearn) return;
                                                                                dispatch({
                                                                                    type: 'LEARN_PROFESSION',
                                                                                    payload: { characterId: char.id, professionId: profession.id }
                                                                                });
                                                                                setOpenSelectorKey(null);
                                                                            }}
                                                                            disabled={!canLearn}
                                                                            style={{ minWidth: 120 }}
                                                                        >
                                                                            {buttonLabel}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
                                当前专业槽位：{learned.length}/{PROFESSION_SLOT_LIMIT}
                            </div>
                        </Panel>
                    );
                })}
            </div>
        </div>
    );
};
