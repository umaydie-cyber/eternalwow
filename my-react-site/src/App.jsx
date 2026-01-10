
import React, { useState } from "react";
import "./styles.css";

const TALENT_TREES = {
  warrior: [
    {
      tier: 10,
      talents: [
        { id: "simple", name: "质朴", desc: "普通攻击使你在本场战斗中的攻击强度提高5点。" },
        { id: "block_master", name: "格挡大师", desc: "每次成功格挡使你在本场战斗中的格挡值提高10点。" },
        { id: "armor_stack", name: "叠甲过", desc: "你在本场战斗中的护甲值提升100点。" }
      ]
    },
    {
      tier: 20,
      talents: [
        { id: "def_stance", name: "防御姿态", desc: "你在战斗中受到的伤害降低20%。" },
        { id: "battle_stance", name: "战斗姿态", desc: "你在战斗中的攻击强度提升10%。" },
        { id: "berserk_stance", name: "狂暴姿态", desc: "你在战斗中获得8%暴击率和20%暴击伤害。" }
      ]
    },
    { tier: 30, talents: [] },
    { tier: 40, talents: [] },
    { tier: 50, talents: [] },
    { tier: 60, talents: [] },
    { tier: 70, talents: [] }
  ]
};

export default function App() {
  const [level] = useState(25);
  const [talents, setTalents] = useState({});

  const selectTalent = (tier, id) => {
    if (level < tier) return;
    setTalents({ ...talents, [tier]: id });
  };

  return (
    <div className="app">
      <h1>战士天赋系统（基础版）</h1>
      <p>当前等级：{level}</p>

      {TALENT_TREES.warrior.map((row) => (
        <div key={row.tier} className="talent-row">
          <h3>{row.tier} 级天赋</h3>
          {row.talents.length === 0 ? (
            <div className="locked">预留天赋位</div>
          ) : (
            <div className="talents">
              {row.talents.map((t) => {
                const selected = talents[row.tier] === t.id;
                const locked = talents[row.tier] && !selected;
                return (
                  <div
                    key={t.id}
                    className={
                      "talent " +
                      (selected ? "selected " : "") +
                      (locked ? "locked " : "")
                    }
                    onClick={() => selectTalent(row.tier, t.id)}
                  >
                    <strong>{t.name}</strong>
                    <p>{t.desc}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
