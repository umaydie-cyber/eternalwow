import React, { useState } from 'react';
import { Panel, Button } from '../components/ui';

// ==================== 任务系统数据结构 ====================

// 任务状态常量
export const QUEST_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// 范克里夫通缉令任务线
export const QUEST_CHAINS = {
    vancleef_wanted: {
        id: 'vancleef_wanted',
        name: '范克里夫通缉令',
        description: '暴风城发布了对范克里夫的通缉令，但事情似乎并不简单...',
        icon: '📜',
        unlockCondition: {
            type: 'boss_defeated',
            bossId: 'hogger'  // 需要先击败霍格
        },
        resetsOnRebirth: true,  // 轮回重置

        // 任务步骤
        steps: {
            // ==================== 第一步：接受任务 ====================
            step_1_accept: {
                id: 'step_1_accept',
                title: '神秘的通缉令',
                description: '你在暴风城公告板上发现了一张通缉令，上面写着"迪菲亚兄弟会首领 艾德温·范克里夫"。一位神秘的贵族女士正在一旁观察着...',
                dialogues: [
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '啊，冒险者，你对这张通缉令感兴趣吗？范克里夫曾是暴风城的工匠大师，如今却沦为通缉犯...'
                    },
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '他带领迪菲亚兄弟会在西部荒野肆虐，必须有人阻止他。你愿意接受这个任务吗？'
                    }
                ],
                choices: [
                    {
                        id: 'accept_quest',
                        text: '接受任务，追查范克里夫',
                        nextStep: 'step_2_investigate',
                        rewards: { gold: 500 }
                    },
                    {
                        id: 'ask_more',
                        text: '我想先了解更多关于范克里夫的事情',
                        nextStep: 'step_1b_background',
                        rewards: null
                    },
                    {
                        id: 'refuse',
                        text: '这不关我的事（结束任务线）',
                        nextStep: null,
                        endQuest: true,
                        rewards: null
                    }
                ]
            },

            // ==================== 第一步分支：了解背景 ====================
            step_1b_background: {
                id: 'step_1b_background',
                title: '范克里夫的过去',
                description: '你询问普瑞斯托女士关于范克里夫的更多信息...',
                dialogues: [
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '范克里夫...他曾是暴风城重建工程的首席工匠。在兽人战争后，他带领工匠们重建了这座城市。'
                    },
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '但后来...贵族们拒绝支付工匠们应得的报酬。范克里夫愤怒地离开，创建了迪菲亚兄弟会。'
                    },
                    {
                        speaker: '你',
                        portrait: '🤔',
                        text: '（她说话时眼神闪烁，似乎有所隐瞒...）'
                    }
                ],
                choices: [
                    {
                        id: 'accept_after_info',
                        text: '我明白了，我会追查范克里夫',
                        nextStep: 'step_2_investigate',
                        rewards: { gold: 500 },
                        flagSet: ['knows_background']  // 设置标记
                    },
                    {
                        id: 'suspicious',
                        text: '为什么贵族不付钱？是谁做的决定？',
                        nextStep: 'step_1c_suspicion',
                        rewards: null,
                        flagSet: ['suspicious_of_nobles']
                    }
                ]
            },

            // ==================== 第一步分支：产生怀疑 ====================
            step_1c_suspicion: {
                id: 'step_1c_suspicion',
                title: '贵族的秘密',
                description: '你的问题似乎触动了普瑞斯托女士的神经...',
                dialogues: [
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '...这是很久以前的事了。当时的贵族议会做出了决定，我也无能为力。'
                    },
                    {
                        speaker: '你',
                        portrait: '🤔',
                        text: '（她的语气变得冷淡。也许我应该另外调查一下...）'
                    },
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '无论如何，范克里夫现在是通缉犯。你是要帮助暴风城，还是要袖手旁观？'
                    }
                ],
                choices: [
                    {
                        id: 'accept_suspicious',
                        text: '我会去调查的（但我会保持警惕）',
                        nextStep: 'step_2_investigate',
                        rewards: { gold: 500 },
                        flagSet: ['deeply_suspicious']
                    },
                    {
                        id: 'investigate_nobles',
                        text: '我想先调查一下贵族议会的记录',
                        nextStep: 'step_2_alt_investigate_nobles',
                        rewards: null,
                        flagSet: ['investigating_nobles']
                    }
                ]
            },

            // ==================== 第二步：调查范克里夫 ====================
            step_2_investigate: {
                id: 'step_2_investigate',
                title: '西部荒野的调查',
                description: '你前往西部荒野调查迪菲亚兄弟会的活动...',
                requirement: {
                    type: 'zone_battles',
                    zoneId: 'westfall',
                    count: 10
                },
                dialogues: [
                    {
                        speaker: '农夫',
                        portrait: '👨‍🌾',
                        text: '迪菲亚？他们确实在这里活动...但你知道吗，他们从不伤害我们这些平民。'
                    },
                    {
                        speaker: '农夫',
                        portrait: '👨‍🌾',
                        text: '他们只攻击那些为贵族工作的商队。有人说，范克里夫是被冤枉的...'
                    },
                    {
                        speaker: '你',
                        portrait: '🤔',
                        text: '（在战斗中，你发现了一些奇怪的文件...）'
                    }
                ],
                onComplete: {
                    giveItem: 'IT_DEFIAS_DOCUMENT'  // 给予迪菲亚文件
                },
                choices: [
                    {
                        id: 'continue_hunt',
                        text: '继续追捕范克里夫',
                        nextStep: 'step_3_deadmines',
                        rewards: { gold: 1000, exp: 2000 }
                    },
                    {
                        id: 'read_documents',
                        text: '仔细研究这些文件',
                        nextStep: 'step_2b_read_documents',
                        rewards: { exp: 1000 },
                        requireFlag: null  // 所有人都能选
                    }
                ]
            },

            // ==================== 第二步替代：调查贵族 ====================
            step_2_alt_investigate_nobles: {
                id: 'step_2_alt_investigate_nobles',
                title: '暴风城档案馆',
                description: '你潜入暴风城档案馆，寻找当年工程款的记录...',
                requirement: {
                    type: 'have_gold',
                    amount: 2000  // 需要贿赂守卫
                },
                dialogues: [
                    {
                        speaker: '档案管理员',
                        portrait: '📚',
                        text: '（在收下你的"捐款"后）好吧...这是当年的财务记录。'
                    },
                    {
                        speaker: '你',
                        portrait: '🤔',
                        text: '（记录显示，工程款被一位"K女士"批准转移到了其他用途...K？普瑞斯托？）'
                    }
                ],
                onComplete: {
                    giveItem: 'IT_FINANCIAL_RECORD',
                    flagSet: ['found_financial_proof']
                },
                choices: [
                    {
                        id: 'confront_prestor',
                        text: '直接质问普瑞斯托女士',
                        nextStep: 'step_3_alt_confront',
                        rewards: { exp: 3000 }
                    },
                    {
                        id: 'gather_more_evidence',
                        text: '继续收集更多证据',
                        nextStep: 'step_3_alt_more_evidence',
                        rewards: { exp: 2000 }
                    }
                ]
            },

            // ==================== 第二步分支：阅读文件 ====================
            step_2b_read_documents: {
                id: 'step_2b_read_documents',
                title: '迪菲亚的真相',
                description: '你仔细阅读了从迪菲亚成员身上搜到的文件...',
                dialogues: [
                    {
                        speaker: '（文件内容）',
                        portrait: '📄',
                        text: '"...暴风城贵族背叛了我们。我们建造了这座城市，却被像狗一样赶走..."'
                    },
                    {
                        speaker: '（文件内容）',
                        portrait: '📄',
                        text: '"...那个女人，她操控了一切。她不是人类，她是...龙..."'
                    },
                    {
                        speaker: '你',
                        portrait: '😮',
                        text: '（龙？这听起来太疯狂了...但如果是真的呢？）'
                    }
                ],
                onComplete: {
                    flagSet: ['knows_dragon_secret']
                },
                choices: [
                    {
                        id: 'dismiss_as_crazy',
                        text: '这是疯话，继续追捕范克里夫',
                        nextStep: 'step_3_deadmines',
                        rewards: { gold: 1000, exp: 2000 }
                    },
                    {
                        id: 'investigate_dragon',
                        text: '调查这个"龙"的说法',
                        nextStep: 'step_3_dragon_investigation',
                        rewards: { exp: 3000 },
                        flagSet: ['pursuing_dragon_truth']
                    }
                ]
            },

            // ==================== 第三步：进攻死亡矿井 ====================
            step_3_deadmines: {
                id: 'step_3_deadmines',
                title: '死亡矿井',
                description: '你追踪范克里夫到了他的老巢——死亡矿井...',
                requirement: {
                    type: 'character_level',
                    level: 25
                },
                dialogues: [
                    {
                        speaker: '迪菲亚守卫',
                        portrait: '⚔️',
                        text: '入侵者！保护队长！'
                    },
                    {
                        speaker: '你',
                        portrait: '🤔',
                        text: '（深入矿井，你发现这里正在建造一艘巨大的战船...范克里夫在计划什么？）'
                    }
                ],
                choices: [
                    {
                        id: 'fight_vancleef',
                        text: '直接与范克里夫战斗',
                        nextStep: 'step_4_final_battle_vancleef',
                        rewards: { gold: 2000 }
                    },
                    {
                        id: 'talk_to_vancleef',
                        text: '尝试与范克里夫对话',
                        nextStep: 'step_3b_talk_vancleef',
                        rewards: null,
                        requireFlag: ['knows_background']  // 需要了解背景
                    }
                ]
            },

            // ==================== 第三步分支：与范克里夫对话 ====================
            step_3b_talk_vancleef: {
                id: 'step_3b_talk_vancleef',
                title: '工匠大师的悲歌',
                description: '你选择与范克里夫对话，而不是立即战斗...',
                dialogues: [
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '...你居然愿意听我说话？大多数"英雄"早就挥剑砍过来了。'
                    },
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '我们建造了暴风城，砖一砖，石一石。战争结束后，贵族们说国库空虚，无法支付工钱。'
                    },
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '但我知道真相。是那个女人...普瑞斯托...她把钱转走了。她不是人类！'
                    },
                    {
                        speaker: '你',
                        portrait: '🤔',
                        text: '你说她不是人类？你有证据吗？'
                    },
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '我见过她变身...在尘泥沼泽的深处，她有一个巢穴。去那里找证据吧。'
                    }
                ],
                onComplete: {
                    flagSet: ['allied_with_vancleef']
                },
                choices: [
                    {
                        id: 'believe_vancleef',
                        text: '我相信你。我会去调查普瑞斯托',
                        nextStep: 'step_4_dragon_hunt',
                        rewards: { exp: 5000 },
                        flagSet: ['full_alliance']
                    },
                    {
                        id: 'still_arrest',
                        text: '不管怎样，你仍然是通缉犯',
                        nextStep: 'step_4_final_battle_vancleef',
                        rewards: { gold: 2000 }
                    }
                ]
            },

            // ==================== 第三步替代：调查龙 ====================
            step_3_dragon_investigation: {
                id: 'step_3_dragon_investigation',
                title: '追寻黑龙的踪迹',
                description: '你开始调查文件中提到的"龙"...',
                requirement: {
                    type: 'zone_battles',
                    zoneId: 'dustwallow_marsh',
                    count: 15
                },
                dialogues: [
                    {
                        speaker: '塞拉摩法师',
                        portrait: '🧙',
                        text: '黑龙？在这片沼泽确实有龙的活动痕迹...奥妮克希亚的巢穴就在附近。'
                    },
                    {
                        speaker: '塞拉摩法师',
                        portrait: '🧙',
                        text: '有传言说，黑龙公主会化身为人类，潜伏在各国的权力中心...'
                    },
                    {
                        speaker: '你',
                        portrait: '😮',
                        text: '（这与迪菲亚文件中的描述吻合...普瑞斯托女士...）'
                    }
                ],
                onComplete: {
                    giveItem: 'IT_DRAGON_SCALE_SAMPLE'
                },
                choices: [
                    {
                        id: 'find_more_proof',
                        text: '寻找更多证据证明普瑞斯托的身份',
                        nextStep: 'step_4_dragon_hunt',
                        rewards: { exp: 5000 }
                    },
                    {
                        id: 'report_to_king',
                        text: '直接向国王报告',
                        nextStep: 'step_3c_report_king',
                        rewards: { gold: 3000 }
                    }
                ]
            },

            // ==================== 第三步替代：向国王报告 ====================
            step_3c_report_king: {
                id: 'step_3c_report_king',
                title: '国王的怒火',
                description: '你试图向瓦里安·乌瑞恩国王报告普瑞斯托的真实身份...',
                dialogues: [
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '（她恰好在场）陛下，这个冒险者在散布关于我的谣言...'
                    },
                    {
                        speaker: '国王',
                        portrait: '👑',
                        text: '普瑞斯托女士是王国最忠诚的顾问！你有证据吗？'
                    },
                    {
                        speaker: '你',
                        portrait: '😰',
                        text: '（没有确凿证据，你的话毫无说服力...你需要找到铁证！）'
                    }
                ],
                onComplete: {
                    flagSet: ['exposed_to_prestor']
                },
                choices: [
                    {
                        id: 'retreat_find_proof',
                        text: '退下，去寻找确凿证据',
                        nextStep: 'step_4_dragon_hunt',
                        rewards: null
                    }
                ]
            },

            // ==================== 第三步替代：直接质问 ====================
            step_3_alt_confront: {
                id: 'step_3_alt_confront',
                title: '危险的对质',
                description: '你带着财务记录直接面对普瑞斯托女士...',
                dialogues: [
                    {
                        speaker: '你',
                        portrait: '😠',
                        text: '普瑞斯托女士，我有证据表明是你转移了工匠们的工钱！'
                    },
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '（她的眼睛闪过一丝危险的光芒）你在玩火，凡人...'
                    },
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '🐉',
                        text: '（她周围的空气开始扭曲，你感受到了一股强大的威压）既然你知道了太多...'
                    },
                    {
                        speaker: '你',
                        portrait: '😨',
                        text: '（她...她真的不是人类！你必须逃跑并寻找帮助！）'
                    }
                ],
                onComplete: {
                    flagSet: ['witnessed_transformation', 'prestor_hostile']
                },
                choices: [
                    {
                        id: 'escape_gather_allies',
                        text: '逃离并召集盟友',
                        nextStep: 'step_4_gather_allies',
                        rewards: { exp: 5000 }
                    }
                ]
            },

            // ==================== 第三步替代：收集更多证据 ====================
            step_3_alt_more_evidence: {
                id: 'step_3_alt_more_evidence',
                title: '深入调查',
                description: '你继续秘密收集关于普瑞斯托女士的证据...',
                requirement: {
                    type: 'have_item',
                    itemId: 'IT_BLACK_DRAGON_PROOF'  // 需要从尘泥沼泽获得
                },
                dialogues: [
                    {
                        speaker: '你',
                        portrait: '🤔',
                        text: '（你找到了黑龙化身的证明...现在证据确凿了！）'
                    }
                ],
                choices: [
                    {
                        id: 'prepare_battle',
                        text: '准备与黑龙战斗',
                        nextStep: 'step_4_dragon_hunt',
                        rewards: { exp: 5000 }
                    }
                ]
            },

            // ==================== 第四步：猎杀黑龙 ====================
            step_4_dragon_hunt: {
                id: 'step_4_dragon_hunt',
                title: '揭露真相',
                description: '你收集了足够的证据，是时候揭露普瑞斯托女士的真实身份了...',
                requirement: {
                    type: 'character_level',
                    level: 40
                },
                dialogues: [
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '（如果你与他结盟）我的兄弟会会支援你。让那条黑龙付出代价！'
                    },
                    {
                        speaker: '雷克萨',
                        portrait: '🐻',
                        text: '（如果你曾帮助过他）我也会助你一臂之力，朋友。'
                    },
                    {
                        speaker: '你',
                        portrait: '⚔️',
                        text: '普瑞斯托女士...不，奥妮克希亚！你的阴谋到此为止！'
                    }
                ],
                choices: [
                    {
                        id: 'final_battle_dragon',
                        text: '发起最终战斗！',
                        nextStep: 'ending_dragon_slayer',
                        rewards: null  // 奖励在结局中给
                    }
                ]
            },

            // ==================== 第四步替代：召集盟友 ====================
            step_4_gather_allies: {
                id: 'step_4_gather_allies',
                title: '召集盟友',
                description: '你需要强大的盟友来对抗黑龙...',
                requirement: {
                    type: 'boss_defeated',
                    bossId: 'vancleef'  // 需要先和范克里夫和解或击败他
                },
                dialogues: [
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '所以你终于相信我了...好，迪菲亚兄弟会将与你并肩作战！'
                    }
                ],
                choices: [
                    {
                        id: 'attack_dragon',
                        text: '联合进攻黑龙！',
                        nextStep: 'ending_dragon_slayer',
                        rewards: null
                    }
                ]
            },

            // ==================== 第四步：最终战斗（范克里夫线） ====================
            step_4_final_battle_vancleef: {
                id: 'step_4_final_battle_vancleef',
                title: '死亡矿井决战',
                description: '你与范克里夫展开最终决战...',
                requirement: {
                    type: 'boss_defeated',
                    bossId: 'vancleef'
                },
                dialogues: [
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '莱恩国王偿清了欠我们的债...你的也到期了！'
                    },
                    {
                        speaker: '（战斗后）',
                        portrait: '⚔️',
                        text: '（范克里夫倒下了...他的眼中满是不甘）'
                    },
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '（临终前）那个女人...她才是...真正的敌人...'
                    }
                ],
                choices: [
                    {
                        id: 'ignore_words',
                        text: '无视他的遗言，返回暴风城领赏',
                        nextStep: 'ending_bounty_hunter',
                        rewards: null
                    },
                    {
                        id: 'heed_warning',
                        text: '他的话让我在意...调查普瑞斯托',
                        nextStep: 'step_5_post_vancleef_investigation',
                        rewards: null,
                        flagSet: ['posthumous_warning']
                    }
                ]
            },

            // ==================== 第五步：击杀范克里夫后的调查 ====================
            step_5_post_vancleef_investigation: {
                id: 'step_5_post_vancleef_investigation',
                title: '死者的警告',
                description: '范克里夫的遗言让你无法安心。你决定调查普瑞斯托女士...',
                requirement: {
                    type: 'zone_battles',
                    zoneId: 'dustwallow_marsh',
                    count: 20
                },
                dialogues: [
                    {
                        speaker: '你',
                        portrait: '🤔',
                        text: '（在尘泥沼泽深处，你发现了黑龙的痕迹...范克里夫说的是真的！）'
                    }
                ],
                onComplete: {
                    giveItem: 'IT_BLACK_DRAGON_PROOF'
                },
                choices: [
                    {
                        id: 'hunt_dragon',
                        text: '为范克里夫复仇，猎杀黑龙！',
                        nextStep: 'ending_redemption',
                        rewards: null
                    }
                ]
            },

            // ==================== 结局：赏金猎人 ====================
            ending_bounty_hunter: {
                id: 'ending_bounty_hunter',
                title: '结局：赏金猎人',
                isEnding: true,
                branch: 'suppress_vancleef',
                description: '你成功击杀了范克里夫，完成了暴风城的通缉任务。',
                dialogues: [
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '干得好，冒险者。范克里夫终于被绳之以法了。这是你应得的奖励。'
                    },
                    {
                        speaker: '普瑞斯托女士',
                        portrait: '👸',
                        text: '（她的笑容让你感到一丝寒意...但你选择了忽视它）'
                    },
                    {
                        speaker: '（旁白）',
                        portrait: '📜',
                        text: '你完成了通缉任务，获得了丰厚的报酬。但真相...或许永远被埋藏在死亡矿井的深处。'
                    }
                ],
                rewards: {
                    gold: 50000,
                    exp: 30000,
                    items: [
                        { id: 'EQ_QUEST_BOUNTY_CLOAK', guaranteed: true }  // 赏金猎人披风
                    ],
                    title: '暴风城赏金猎人'
                }
            },

            // ==================== 结局：屠龙者 ====================
            ending_dragon_slayer: {
                id: 'ending_dragon_slayer',
                title: '结局：屠龙者',
                isEnding: true,
                branch: 'slay_prestor',
                description: '你揭露了普瑞斯托女士的真实身份，并与黑龙公主展开最终决战！',
                requirement: {
                    type: 'boss_defeated',
                    bossId: 'prestor_lady'
                },
                dialogues: [
                    {
                        speaker: '奥妮克希亚',
                        portrait: '🐉',
                        text: '愚蠢的凡人！你以为你能战胜我？我是死亡之翼的女儿！'
                    },
                    {
                        speaker: '（战斗后）',
                        portrait: '⚔️',
                        text: '（黑龙公主倒下了，她的伪装彻底瓦解）'
                    },
                    {
                        speaker: '国王',
                        portrait: '👑',
                        text: '...我竟然被她蒙蔽了这么久。勇士，你拯救了整个王国！'
                    },
                    {
                        speaker: '范克里夫',
                        portrait: '🏴‍☠️',
                        text: '（如果存活）正义...终于得到了伸张。也许，是时候让迪菲亚兄弟会解散了。'
                    }
                ],
                rewards: {
                    gold: 100000,
                    exp: 80000,
                    items: [
                        { id: 'EQ_QUEST_DRAGON_SLAYER_RING', guaranteed: true },  // 屠龙者之戒
                        { id: 'EQ_QUEST_ONYXIA_SCALE_CLOAK', guaranteed: true }   // 奥妮克希亚鳞片披风
                    ],
                    title: '黑龙终结者',
                    unlockBoss: 'prestor_lady_heroic'  // 解锁英雄难度
                }
            },

            // ==================== 结局：救赎 ====================
            ending_redemption: {
                id: 'ending_redemption',
                title: '结局：迟来的救赎',
                isEnding: true,
                branch: 'slay_prestor',
                description: '虽然范克里夫已经死去，但你为他揭露了真相，并击败了真正的幕后黑手。',
                requirement: {
                    type: 'boss_defeated',
                    bossId: 'prestor_lady'
                },
                dialogues: [
                    {
                        speaker: '你',
                        portrait: '😔',
                        text: '范克里夫...我为你报仇了。你的冤屈，终于得到了洗清。'
                    },
                    {
                        speaker: '迪菲亚残党',
                        portrait: '🏴‍☠️',
                        text: '...谢谢你，冒险者。虽然队长已经不在了，但真相终于大白于天下。'
                    },
                    {
                        speaker: '国王',
                        portrait: '👑',
                        text: '我会重新评估对迪菲亚兄弟会的判决。范克里夫和工匠们...他们值得更好的对待。'
                    }
                ],
                rewards: {
                    gold: 80000,
                    exp: 60000,
                    items: [
                        { id: 'EQ_QUEST_REDEMPTION_BLADE', guaranteed: true }  // 救赎之刃
                    ],
                    title: '真相追寻者'
                }
            }
        }
    }
};

// 任务物品
export const QUEST_ITEMS = {
    IT_DEFIAS_DOCUMENT: {
        id: 'IT_DEFIAS_DOCUMENT',
        name: '迪菲亚密信',
        icon: '📄',
        type: 'quest',
        rarity: 'blue',
        description: '从迪菲亚成员身上搜到的密信，上面提到了一些令人不安的内容...'
    },
    IT_FINANCIAL_RECORD: {
        id: 'IT_FINANCIAL_RECORD',
        name: '暴风城财务记录',
        icon: '📊',
        type: 'quest',
        rarity: 'blue',
        description: '显示工程款被神秘转移的财务记录'
    },
    IT_DRAGON_SCALE_SAMPLE: {
        id: 'IT_DRAGON_SCALE_SAMPLE',
        name: '黑龙鳞片样本',
        icon: '🐉',
        type: 'quest',
        rarity: 'purple',
        description: '在尘泥沼泽发现的黑龙鳞片，证明这里有龙的活动'
    }
};

// 任务奖励装备
export const QUEST_REWARD_EQUIPMENTS = {
    EQ_QUEST_BOUNTY_CLOAK: {
        id: 'EQ_QUEST_BOUNTY_CLOAK',
        name: '赏金猎人的披风',
        icon: 'icons/wow/vanilla/armor/INV_Misc_Cape_18.png',
        type: 'equipment',
        slot: 'cloak',
        rarity: 'purple',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 500,
            attack: 100,
            critRate: 5,
            gold_bonus: 10  // 特殊：金币获取+10%
        },
        growth: { hp: 2, attack: 2, critRate: 2 },
        description: '完成暴风城通缉任务的奖励'
    },
    EQ_QUEST_DRAGON_SLAYER_RING: {
        id: 'EQ_QUEST_DRAGON_SLAYER_RING',
        name: '屠龙者之戒',
        icon: 'icons/wow/vanilla/armor/INV_Jewelry_Ring_15.png',
        type: 'equipment',
        slot: 'ring1',
        rarity: 'orange',
        level: 0,
        maxLevel: 100,
        baseStats: {
            hp: 800,
            attack: 200,
            spellPower: 200,
            critRate: 10,
            critDamage: 0.3
        },
        growth: { hp: 2, attack: 2, spellPower: 2, critRate: 2, critDamage: 2 },
        description: '击败黑龙公主的证明'
    },
    EQ_QUEST_ONYXIA_SCALE_CLOAK: {
        id: 'EQ_QUEST_ONYXIA_SCALE_CLOAK',
        name: '奥妮克希亚鳞片披风',
        icon: 'icons/wow/vanilla/armor/INV_Misc_Cape_20.png',
        type: 'equipment',
        slot: 'cloak',
        rarity: 'orange',

        // ✅ 允许“黑龙女王的徽章”升级（通过 setId 命中 onyxias_lair 装备池）
        // 说明：未在 SET_BONUSES 中定义该 setId，因此不会触发任何套装效果，只用于徽章升级池判定。
        setId: 'onyxia_lair',
        setName: '奥妮克希亚',

        // 玩家备注：lv10
        level: 10,
        maxLevel: 100,
        baseStats: {
            hp: 1000,
            armor: 150,
            magicResist: 50,
            versatility: 15
        },
        growth: { hp: 2, armor: 2, magicResist: 2, versatility: 2 },
        specialEffect: {
            type: 'map_slayer',
            bonusDamageVsMap: 0.25  // 地图战斗+25%伤害
        },
        description: '用奥妮克希亚的鳞片制成，散发着龙焰的余温'
    },
    EQ_QUEST_REDEMPTION_BLADE: {
        id: 'EQ_QUEST_REDEMPTION_BLADE',
        name: '救赎之刃',
        icon: 'icons/wow/vanilla/weapons/INV_Sword_48.png',
        type: 'equipment',
        slot: 'mainHand',
        rarity: 'purple',
        level: 0,
        maxLevel: 100,
        baseStats: {
            attack: 1000,
            versatility: 20,
            hp: 2000
        },
        growth: { attack: 2, versatility: 2, hp: 2 },
        description: '为逝者伸张正义，为生者带来救赎'
    }
};

// ==================== 任务页面UI组件 ====================
export const QuestPage = ({ state, dispatch, BOSS_DATA }) => {
    const [selectedQuest, setSelectedQuest] = useState(null);
    const [showDialogue, setShowDialogue] = useState(false);
    const [dialogueIndex, setDialogueIndex] = useState(0);

    // 检查任务是否解锁
    const isQuestUnlocked = (quest) => {
        if (!quest.unlockCondition) return true;

        if (quest.unlockCondition.type === 'boss_defeated') {
            return state.defeatedBosses?.includes(quest.unlockCondition.bossId);
        }
        return false;
    };

    // 检查步骤条件是否满足
    const isStepRequirementMet = (step) => {
        if (!step.requirement) return true;

        switch (step.requirement.type) {
            case 'zone_battles':
                // 简化：检查是否有角色在该区域战斗过足够次数
                return true;  // 实际实现需要追踪战斗次数
            case 'character_level':
                return state.characters.some(c => c.level >= step.requirement.level);
            case 'boss_defeated':
                return state.defeatedBosses?.includes(step.requirement.bossId);
            case 'have_gold':
                return state.resources.gold >= step.requirement.amount;
            case 'have_item':
                return state.inventory.some(i => i.id === step.requirement.itemId) ||
                    state.questItems?.some(i => i.id === step.requirement.itemId);
            default:
                return true;
        }
    };

    // 获取当前可用任务
    const availableQuests = Object.values(QUEST_CHAINS).filter(quest => {
        const progress = state.questProgress?.[quest.id];
        const unlocked = isQuestUnlocked(quest);
        const notCompleted = progress?.status !== QUEST_STATUS.COMPLETED;
        return unlocked && notCompleted;
    });

    // 渲染任务卡片
    const renderQuestCard = (quest) => {
        const progress = state.questProgress?.[quest.id];
        const isStarted = progress?.status === QUEST_STATUS.IN_PROGRESS;
        const currentStep = isStarted ? quest.steps[progress.currentStep] : null;

        return (
            <div
                key={quest.id}
                onClick={() => setSelectedQuest(quest)}
                style={{
                    padding: 16,
                    background: isStarted
                        ? 'linear-gradient(135deg, rgba(201,162,39,0.15), rgba(139,115,25,0.1))'
                        : 'rgba(0,0,0,0.3)',
                    border: isStarted ? '2px solid #c9a227' : '2px solid #4a3c2a',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 32 }}>{quest.icon}</span>
                    <div>
                        <div style={{ fontSize: 16, color: '#ffd700', fontWeight: 600 }}>
                            {quest.name}
                        </div>
                        <div style={{ fontSize: 11, color: isStarted ? '#4CAF50' : '#888' }}>
                            {isStarted ? `进行中：${currentStep?.title}` : '未开始'}
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>
                    {quest.description}
                </div>
            </div>
        );
    };

    // 渲染任务详情模态框
    const renderQuestModal = () => {
        if (!selectedQuest) return null;

        const quest = selectedQuest;
        const progress = state.questProgress?.[quest.id];
        const isStarted = progress?.status === QUEST_STATUS.IN_PROGRESS;
        const currentStep = isStarted ? quest.steps[progress.currentStep] : quest.steps[Object.keys(quest.steps)[0]];
        const requirementMet = isStepRequirementMet(currentStep);

        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }} onClick={() => setSelectedQuest(null)}>
                <div style={{
                    width: 700,
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    background: 'linear-gradient(135deg, #1a1510 0%, #0d0a07 100%)',
                    border: '3px solid #c9a227',
                    borderRadius: 12,
                    padding: 24
                }} onClick={e => e.stopPropagation()}>
                    {/* 任务标题 */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: 20,
                        paddingBottom: 16,
                        borderBottom: '1px solid rgba(201,162,39,0.3)'
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>{quest.icon}</div>
                        <h2 style={{ margin: 0, color: '#ffd700', fontSize: 24 }}>{quest.name}</h2>
                        <div style={{ color: '#888', fontSize: 12, marginTop: 8 }}>
                            {currentStep?.title}
                        </div>
                    </div>

                    {/* 当前步骤描述 */}
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 16,
                        border: '1px solid #4a3c2a'
                    }}>
                        <div style={{ fontSize: 14, color: '#e8dcc4', lineHeight: 1.6 }}>
                            {currentStep?.description}
                        </div>
                    </div>

                    {/* 条件检查 */}
                    {currentStep?.requirement && (
                        <div style={{
                            background: requirementMet ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)',
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 16,
                            border: `1px solid ${requirementMet ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`
                        }}>
                            <div style={{
                                fontSize: 12,
                                color: requirementMet ? '#4CAF50' : '#f44336',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                {requirementMet ? '✓' : '✗'}
                                {currentStep.requirement.type === 'character_level' &&
                                    `需要角色等级 ${currentStep.requirement.level}`}
                                {currentStep.requirement.type === 'zone_battles' &&
                                    `需要在${ZONES[currentStep.requirement.zoneId]?.name}战斗${currentStep.requirement.count}次`}
                                {currentStep.requirement.type === 'boss_defeated' &&
                                    `需要击败${BOSS_DATA[currentStep.requirement.bossId]?.name}`}
                                {currentStep.requirement.type === 'have_gold' &&
                                    `需要${currentStep.requirement.amount}金币`}
                            </div>
                        </div>
                    )}

                    {/* 对话按钮 */}
                    {currentStep?.dialogues && currentStep.dialogues.length > 0 && (
                        <Button
                            onClick={() => {
                                setShowDialogue(true);
                                setDialogueIndex(0);
                            }}
                            style={{ width: '100%', marginBottom: 16 }}
                            variant="secondary"
                        >
                            📖 查看对话
                        </Button>
                    )}

                    {/* 选择列表 */}
                    {currentStep?.choices && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 14, color: '#c9a227', marginBottom: 12 }}>
                                做出选择：
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {currentStep.choices.map(choice => {
                                    const canChoose = requirementMet &&
                                        (!choice.requireFlag || choice.requireFlag.every(f => progress?.flags?.includes(f)));

                                    return (
                                        <button
                                            key={choice.id}
                                            onClick={() => {
                                                if (!canChoose) return;

                                                if (!isStarted) {
                                                    dispatch({ type: 'START_QUEST', payload: { questId: quest.id }});
                                                }
                                                dispatch({
                                                    type: 'QUEST_CHOICE',
                                                    payload: { questId: quest.id, choiceId: choice.id }
                                                });

                                                // 如果是结局，关闭模态框
                                                if (choice.nextStep && quest.steps[choice.nextStep]?.isEnding) {
                                                    setSelectedQuest(null);
                                                }
                                            }}
                                            disabled={!canChoose}
                                            style={{
                                                padding: '12px 16px',
                                                background: canChoose
                                                    ? 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(139,115,25,0.15))'
                                                    : 'rgba(60,60,60,0.3)',
                                                border: canChoose ? '2px solid #c9a227' : '2px solid #444',
                                                borderRadius: 8,
                                                color: canChoose ? '#ffd700' : '#666',
                                                cursor: canChoose ? 'pointer' : 'not-allowed',
                                                fontFamily: 'inherit',
                                                fontSize: 13,
                                                textAlign: 'left',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ marginBottom: 4 }}>{choice.text}</div>
                                            {choice.rewards && (
                                                <div style={{ fontSize: 11, color: '#4CAF50' }}>
                                                    奖励：
                                                    {choice.rewards.gold && `🪙${choice.rewards.gold} `}
                                                    {choice.rewards.exp && `⭐${choice.rewards.exp}`}
                                                </div>
                                            )}
                                            {choice.requireFlag && !canChoose && (
                                                <div style={{ fontSize: 10, color: '#f44336', marginTop: 4 }}>
                                                    需要特定条件
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 结局检查 */}
                    {currentStep?.isEnding && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(201,162,39,0.1))',
                            borderRadius: 10,
                            padding: 20,
                            border: '2px solid #ffd700',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: 18, color: '#ffd700', fontWeight: 700, marginBottom: 12 }}>
                                🏆 {currentStep.title}
                            </div>
                            <div style={{ fontSize: 13, color: '#e8dcc4', marginBottom: 16 }}>
                                {currentStep.description}
                            </div>

                            {/* 结局奖励预览 */}
                            {currentStep.rewards && (
                                <div style={{
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: 8,
                                    padding: 12,
                                    marginBottom: 16
                                }}>
                                    <div style={{ fontSize: 12, color: '#c9a227', marginBottom: 8 }}>结局奖励：</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                                        {currentStep.rewards.gold && (
                                            <span style={{ color: '#ffd700' }}>🪙 {currentStep.rewards.gold}</span>
                                        )}
                                        {currentStep.rewards.exp && (
                                            <span style={{ color: '#4CAF50' }}>⭐ {currentStep.rewards.exp}</span>
                                        )}
                                        {currentStep.rewards.title && (
                                            <span style={{ color: '#a335ee' }}>🏅 称号：{currentStep.rewards.title}</span>
                                        )}
                                    </div>
                                    {currentStep.rewards.items && (
                                        <div style={{ marginTop: 8, fontSize: 11, color: '#ff9800' }}>
                                            + {currentStep.rewards.items.length} 件装备
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                onClick={() => {
                                    dispatch({ type: 'COMPLETE_QUEST_ENDING', payload: { questId: quest.id }});
                                    setSelectedQuest(null);
                                }}
                                disabled={!isStepRequirementMet(currentStep)}
                            >
                                🎉 完成任务
                            </Button>

                            {!isStepRequirementMet(currentStep) && (
                                <div style={{ fontSize: 11, color: '#f44336', marginTop: 8 }}>
                                    需要满足条件才能完成
                                </div>
                            )}
                        </div>
                    )}

                    {/* 关闭按钮 */}
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Button onClick={() => setSelectedQuest(null)} variant="secondary">
                            关闭
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // 渲染对话模态框
    const renderDialogueModal = () => {
        if (!showDialogue || !selectedQuest) return null;

        const progress = state.questProgress?.[selectedQuest.id];
        const currentStep = progress?.currentStep
            ? selectedQuest.steps[progress.currentStep]
            : selectedQuest.steps[Object.keys(selectedQuest.steps)[0]];

        if (!currentStep?.dialogues) return null;

        const dialogue = currentStep.dialogues[dialogueIndex];
        const isLast = dialogueIndex >= currentStep.dialogues.length - 1;

        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.95)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                zIndex: 1001,
                padding: 40
            }} onClick={() => {
                if (isLast) {
                    setShowDialogue(false);
                } else {
                    setDialogueIndex(prev => prev + 1);
                }
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: 800,
                    background: 'linear-gradient(180deg, rgba(30,25,20,0.98), rgba(20,15,10,0.99))',
                    border: '3px solid #c9a227',
                    borderRadius: 12,
                    padding: 24,
                    marginBottom: 40
                }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <div style={{
                            width: 60,
                            height: 60,
                            background: 'rgba(0,0,0,0.4)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                            border: '2px solid #4a3c2a'
                        }}>
                            {dialogue.portrait}
                        </div>
                        <div style={{ fontSize: 18, color: '#ffd700', fontWeight: 600 }}>
                            {dialogue.speaker}
                        </div>
                    </div>

                    <div style={{
                        fontSize: 16,
                        color: '#e8dcc4',
                        lineHeight: 1.8,
                        minHeight: 80
                    }}>
                        {dialogue.text}
                    </div>

                    <div style={{
                        marginTop: 16,
                        textAlign: 'right',
                        fontSize: 12,
                        color: '#888'
                    }}>
                        {isLast ? '点击关闭' : '点击继续'} ({dialogueIndex + 1}/{currentStep.dialogues.length})
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <Panel title="📜 任务">
                <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
                    完成任务获得丰厚奖励。每次轮回任务进度会重置，但获得的称号和成就永久保留。
                </div>

                {/* 已完成的任务分支 */}
                {state.completedQuestBranches?.length > 0 && (
                    <div style={{
                        background: 'rgba(76,175,80,0.1)',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        border: '1px solid rgba(76,175,80,0.3)'
                    }}>
                        <div style={{ fontSize: 12, color: '#4CAF50', marginBottom: 8 }}>
                            🏆 已完成的任务线（历史记录）
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {state.completedQuestBranches.map((record, i) => (
                                <span key={i} style={{
                                    padding: '4px 10px',
                                    background: 'rgba(76,175,80,0.2)',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    color: '#81c784'
                                }}>
                                    {QUEST_CHAINS[record.questId]?.name} - {record.branch === 'slay_prestor' ? '屠龙者' : '赏金猎人'}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 任务列表 */}
                {availableQuests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                        <div>暂无可用任务</div>
                        <div style={{ fontSize: 12, marginTop: 8 }}>
                            击败世界首领霍格后解锁第一个任务
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 16
                    }}>
                        {availableQuests.map(renderQuestCard)}
                    </div>
                )}
            </Panel>

            {renderQuestModal()}
            {renderDialogueModal()}
        </div>
    );
};
