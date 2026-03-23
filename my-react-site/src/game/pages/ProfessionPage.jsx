import React from 'react';
import { Panel, Button } from '../components/ui';
import { CLASSES } from '../data/core';
import { PROFESSIONS, PROFESSION_LEARN_COSTS } from '../data/professions';

export const ProfessionPage = ({ state, dispatch }) => {
    const professionList = Object.values(PROFESSIONS);

    return (
        <div style={{ display: 'grid', gap: 16 }}>
            <Panel title="专业系统">
                <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.8 }}>
                    每名角色最多学习 2 个专业。第 1 个专业花费 🪙{PROFESSION_LEARN_COSTS[0].toLocaleString()}，
                    第 2 个专业花费 🪙{PROFESSION_LEARN_COSTS[1].toLocaleString()}。
                    采集地图每 30 秒触发一次采集事件，并提升对应专业熟练度，最高 300 点。
                    达到材料隐藏难度后会稳定产出 2 星材料；精细和熟练会继续放大单次采集数量。
                </div>
            </Panel>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {state.characters.map(char => {
                    const learned = Array.isArray(char.professions) ? char.professions : [];

                    return (
                        <Panel key={char.id} title={char.name}>
                            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
                                Lv.{char.level} {CLASSES[char.classId]?.name || char.classId}
                            </div>

                            <div style={{ display: 'grid', gap: 10 }}>
                                {professionList.map(profession => {
                                    const isLearned = learned.includes(profession.id);
                                    const slotIndex = learned.length;
                                    const learnCost = PROFESSION_LEARN_COSTS[Math.min(slotIndex, PROFESSION_LEARN_COSTS.length - 1)];
                                    const skill = Math.max(0, Math.floor(Number(char.professionSkills?.[profession.id]) || 0));
                                    const canLearn = !isLearned && learned.length < 2 && (state.resources?.gold || 0) >= learnCost;

                                    return (
                                        <div
                                            key={profession.id}
                                            style={{
                                                padding: 14,
                                                borderRadius: 10,
                                                border: `1px solid ${isLearned ? '#4CAF50' : '#4a3c2a'}`,
                                                background: isLearned
                                                    ? 'linear-gradient(135deg, rgba(76,175,80,0.18), rgba(0,0,0,0.25))'
                                                    : 'rgba(0,0,0,0.28)',
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

                                                <Button
                                                    onClick={() => dispatch({
                                                        type: 'LEARN_PROFESSION',
                                                        payload: { characterId: char.id, professionId: profession.id }
                                                    })}
                                                    disabled={isLearned || !canLearn}
                                                    style={{ minWidth: 104 }}
                                                >
                                                    {isLearned ? '已掌握' : `学习 (${learnCost.toLocaleString()})`}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: 12, fontSize: 12, color: '#888' }}>
                                当前专业槽位：{learned.length}/2
                            </div>
                        </Panel>
                    );
                })}
            </div>
        </div>
    );
};
