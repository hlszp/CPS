/**
 * CPS三级 · 知识图谱数据（扩展版）
 * 覆盖14门课程（6理论+8实务），分层构建：根节点→课程→概念→知识点
 * 从课程教材深度挖掘，新增大量概念与知识点
 * 命题来源：《心理咨询基础培训教材》理论与实务两部分
 */
const KNOWLEDGE_GRAPH = {
  nodes: [
    // ============================================================
    // 根节点（level 0）
    // ============================================================
    { id:'theory',      label:'基础理论', type:'root', level:0, x:600, y:40,  desc:'心理学六大基础理论课程，涵盖导论、社会、人格、发展、异常、咨询心理学' },
    { id:'practice',    label:'咨询实务', type:'root', level:0, x:600, y:810, desc:'心理咨询八大实务技能课程，涵盖测量、通用技术、CBT、人本、团体、伦理、危机、实务练习' },

    // ============================================================
    // 一、心理学导论 intro（理论 · base_x=110）
    // ============================================================
    { id:'intro',             label:'心理学导论',   type:'course', level:1, parent:'theory', x:110, y:120, desc:'心理学研究对象与方法、心理过程、人格基础、心理学流派等' },

    // 概念（level 2）
    { id:'intro_stream',      label:'心理学流派',   type:'concept', level:2, parent:'intro', x:110, y:210, desc:'构造主义、机能主义、行为主义、精神分析、人本主义、认知心理学六大流派' },
    { id:'intro_perception',  label:'感觉与知觉',   type:'concept', level:2, parent:'intro', x:110, y:320, desc:'感觉阈限、知觉组织原则、深度知觉与错觉' },
    { id:'intro_memory',      label:'记忆系统',     type:'concept', level:2, parent:'intro', x:110, y:430, desc:'感觉记忆、短时记忆与长时记忆的三级加工模型' },
    { id:'intro_emotion',     label:'情绪理论',     type:'concept', level:2, parent:'intro', x:110, y:540, desc:'詹姆斯-兰格、坎农-巴德及情绪认知评价理论' },
    { id:'intro_maslow',      label:'马斯洛需要层次',type:'concept', level:2, parent:'intro', x:110, y:650, desc:'由低到高：生理→安全→归属与爱→尊重→自我实现' },

    // 知识点（level 3）
    { id:'intro_stream_constructivism',      label:'构造主义与机能主义', type:'detail', level:3, parent:'intro_stream',     x:50,  y:250, desc:'冯特、铁钦纳主张用内省法研究意识元素；詹姆斯、杜威强调心理的适应功能' },
    { id:'intro_stream_behaviorism',          label:'行为主义',           type:'detail', level:3, parent:'intro_stream',     x:170, y:250, desc:'华生、斯金纳主张只研究可观察的行为，强调刺激-反应联结' },
    { id:'intro_stream_psychoanalysis',       label:'精神分析',           type:'detail', level:3, parent:'intro_stream',     x:80,  y:290, desc:'弗洛伊德创立，强调无意识动机对行为的影响' },
    { id:'intro_stream_humanistic_cognitive', label:'人本主义与认知',     type:'detail', level:3, parent:'intro_stream',     x:140, y:290, desc:'马斯洛、罗杰斯强调自我实现；奈瑟、皮亚杰研究思维内部过程' },

    { id:'intro_perception_threshold',     label:'感觉阈限',       type:'detail', level:3, parent:'intro_perception', x:55,  y:360, desc:'绝对感觉阈限与差别感觉阈限，韦伯定律 K=ΔI/I' },
    { id:'intro_perception_organization',  label:'知觉组织原则',   type:'detail', level:3, parent:'intro_perception', x:165, y:360, desc:'格式塔原则：接近性、相似性、连续性、闭合性' },
    { id:'intro_perception_depth',         label:'深度知觉',       type:'detail', level:3, parent:'intro_perception', x:110, y:400, desc:'双眼线索（辐合、视差）与单眼线索（遮挡、线条透视）' },

    { id:'intro_memory_sensory',  label:'感觉记忆',   type:'detail', level:3, parent:'intro_memory', x:55,  y:470, desc:'瞬时记忆，容量大、保持极短（约0.25-2秒）' },
    { id:'intro_memory_short',    label:'短时记忆',   type:'detail', level:3, parent:'intro_memory', x:165, y:470, desc:'容量7±2个组块，保持约15-30秒，需复述维持' },
    { id:'intro_memory_long',     label:'长时记忆',   type:'detail', level:3, parent:'intro_memory', x:110, y:510, desc:'容量无限，保持时间长，包括情景记忆与语义记忆' },

    { id:'intro_emotion_james',    label:'詹姆斯-兰格理论', type:'detail', level:3, parent:'intro_emotion', x:55,  y:580, desc:'情绪是对身体生理变化的知觉，先有生理反应后有情绪体验' },
    { id:'intro_emotion_cannon',   label:'坎农-巴德理论',   type:'detail', level:3, parent:'intro_emotion', x:165, y:580, desc:'情绪与生理反应同时发生，丘脑是情绪中枢' },
    { id:'intro_emotion_cognitive',label:'情绪认知理论',     type:'detail', level:3, parent:'intro_emotion', x:110, y:620, desc:'沙赫特-辛格理论：情绪=生理唤起×认知标签，认知起决定作用' },

    { id:'intro_maslow_basic',    label:'基本需要',   type:'detail', level:3, parent:'intro_maslow', x:55,  y:690, desc:'生理需要与安全需要属于缺失性需要，满足后才会追求更高层次' },
    { id:'intro_maslow_growth',   label:'成长需要',   type:'detail', level:3, parent:'intro_maslow', x:165, y:690, desc:'归属与爱、尊重需要，属于心理层面的成长性需要' },
    { id:'intro_maslow_self',     label:'自我实现',   type:'detail', level:3, parent:'intro_maslow', x:110, y:730, desc:'最高层次需要，充分发挥潜能、成为自己想成为的人' },

    // ============================================================
    // 二、社会心理学 social（理论 · base_x=290）
    // ============================================================
    { id:'social',            label:'社会心理学',   type:'course', level:1, parent:'theory', x:290, y:120, desc:'个体在群体中的心理与行为规律：从众、归因、态度、社会认知、人际关系' },

    { id:'social_conformity',    label:'从众与服从',   type:'concept', level:2, parent:'social', x:290, y:210, desc:'群体压力下个体行为改变：阿希从众实验与米尔格拉姆服从实验' },
    { id:'social_attribution',   label:'归因理论',     type:'concept', level:2, parent:'social', x:290, y:320, desc:'对行为原因的解释：内部归因（特质）与外部归因（情境）' },
    { id:'social_attitude',       label:'态度与态度改变',type:'concept', level:2, parent:'social', x:290, y:430, desc:'态度的三成分（认知-情感-行为），认知失调与说服模型' },
    { id:'social_cognition',     label:'社会认知',     type:'concept', level:2, parent:'social', x:290, y:540, desc:'对他人和社会信息的加工：刻板印象、偏见与歧视' },
    { id:'social_relationship',  label:'人际关系',     type:'concept', level:2, parent:'social', x:290, y:650, desc:'人际吸引因素、亲密关系发展阶段与社会交换理论' },

    { id:'social_conformity_asch',     label:'阿希从众实验',     type:'detail', level:3, parent:'social_conformity',    x:235, y:250, desc:'线段判断实验，约37%被试出现从众，群体规模3-4人时从众效应最强' },
    { id:'social_conformity_milgram',  label:'米尔格拉姆服从实验',type:'detail', level:3, parent:'social_conformity',    x:345, y:250, desc:'电击实验，65%被试服从指令施加最大电击，揭示权威服从' },

    { id:'social_attribution_internal',    label:'内部归因与外部归因', type:'detail', level:3, parent:'social_attribution', x:235, y:360, desc:'韦纳归因模型：能力与努力为内部归因，任务难度与运气为外部归因' },
    { id:'social_attribution_fundamental', label:'基本归因错误',     type:'detail', level:3, parent:'social_attribution', x:345, y:360, desc:'高估个人特质、低估情境因素对他人行为的影响' },

    { id:'social_attitude_dissonance',  label:'认知失调',   type:'detail', level:3, parent:'social_attitude',    x:235, y:470, desc:'费斯廷格理论：认知间不一致产生紧张，个体通过改变态度来恢复一致' },
    { id:'social_attitude_persuasion',   label:'说服模型', type:'detail', level:3, parent:'social_attitude',    x:345, y:470, desc:'霍夫兰模型：说服者特征、信息特征、情境特征影响说服效果' },

    { id:'social_cognition_stereotype', label:'刻板印象', type:'detail', level:3, parent:'social_cognition',    x:235, y:580, desc:'对特定群体的概括性认知，既有积极面也有消极影响' },
    { id:'social_cognition_prejudice',   label:'偏见',     type:'detail', level:3, parent:'social_cognition',    x:345, y:580, desc:'基于刻板印象的消极态度，可能导致歧视行为' },

    { id:'social_relationship_attraction', label:'人际吸引力',   type:'detail', level:3, parent:'social_relationship', x:235, y:690, desc:'接近性、相似性、互补性与外表吸引力是主要影响因素' },
    { id:'social_relationship_close',      label:'亲密关系',     type:'detail', level:3, parent:'social_relationship', x:345, y:690, desc:'斯滕伯格爱情三元理论：亲密、激情与承诺' },

    // ============================================================
    // 三、人格心理学 personality（理论 · base_x=470）
    // ============================================================
    { id:'personality',         label:'人格心理学',   type:'course', level:1, parent:'theory', x:470, y:120, desc:'人格结构、人格特质、人格测评方法与经典人格理论' },

    { id:'personality_bigfive',    label:'大五人格',         type:'concept', level:2, parent:'personality', x:470, y:210, desc:'OCEAN五维度模型：开放性、尽责性、外向性、宜人性、神经质' },
    { id:'personality_freud',      label:'弗洛伊德人格结构', type:'concept', level:2, parent:'personality', x:470, y:320, desc:'本我-自我-超我三重结构，遵循快乐、现实、道德原则' },
    { id:'personality_eysenck',    label:'艾森克维度',       type:'concept', level:2, parent:'personality', x:470, y:430, desc:'人格三维度：内外倾、神经质、精神质' },
    { id:'personality_assessment', label:'人格测评',         type:'concept', level:2, parent:'personality', x:470, y:540, desc:'投射测验与自陈量表两大类方法' },

    { id:'personality_bigfive_ocean',   label:'OCEAN五维度',     type:'detail', level:3, parent:'personality_bigfive',    x:415, y:250, desc:'开放性、尽责性、外向性、宜人性、神经质，每维度含6个面' },
    { id:'personality_bigfive_health',  label:'大五与心理健康',  type:'detail', level:3, parent:'personality_bigfive',    x:525, y:250, desc:'神经质高预示焦虑抑郁风险，尽责性高预示良好适应' },

    { id:'personality_freud_id',        label:'本我',     type:'detail', level:3, parent:'personality_freud',      x:415, y:360, desc:'原始冲动，遵循快乐原则，追求即时满足' },
    { id:'personality_freud_ego',       label:'自我',     type:'detail', level:3, parent:'personality_freud',      x:525, y:360, desc:'遵循现实原则，协调本我与超我的冲突' },
    { id:'personality_freud_superego',  label:'超我',     type:'detail', level:3, parent:'personality_freud',      x:470, y:400, desc:'遵循道德原则，内化的社会规范与良心' },

    { id:'personality_eysenck_extraversion', label:'内外倾',   type:'detail', level:3, parent:'personality_eysenck',    x:415, y:470, desc:'外向者善社交、活跃；内向者安静、保守' },
    { id:'personality_eysenck_neuroticism',  label:'神经质',   type:'detail', level:3, parent:'personality_eysenck',    x:525, y:470, desc:'高分者情绪不稳定、易焦虑；低分者情绪稳定' },
    { id:'personality_eysenck_psychoticism', label:'精神质',   type:'detail', level:3, parent:'personality_eysenck',    x:470, y:510, desc:'高分者冷漠、攻击性强；低分者温和、善解人意' },

    { id:'personality_assessment_projective', label:'投射测验',   type:'detail', level:3, parent:'personality_assessment', x:415, y:580, desc:'罗夏墨迹测验、主题统觉测验（TAT），呈现无意识内容' },
    { id:'personality_assessment_self',       label:'自陈量表',   type:'detail', level:3, parent:'personality_assessment', x:525, y:580, desc:'MMPI、EPQ、16PF等，标准化题目作答后量化评分' },

    // ============================================================
    // 四、发展心理学 development（理论 · base_x=650）
    // ============================================================
    { id:'development',         label:'发展心理学',   type:'course', level:1, parent:'theory', x:650, y:120, desc:'个体从出生到老年的心理发展规律与阶段理论' },

    { id:'development_piaget',    label:'皮亚杰认知发展',   type:'concept', level:2, parent:'development', x:650, y:210, desc:'认知发展四阶段：感知运动→前运算→具体运算→形式运算' },
    { id:'development_erikson',   label:'埃里克森社会发展', type:'concept', level:2, parent:'development', x:650, y:320, desc:'心理社会发展八阶段理论，每阶段有核心冲突' },
    { id:'development_vygotsky',  label:'维果茨基',         type:'concept', level:2, parent:'development', x:650, y:430, desc:'社会文化理论，强调最近发展区与语言的中介作用' },
    { id:'development_attachment',label:'依恋理论',         type:'concept', level:2, parent:'development', x:650, y:540, desc:'鲍尔比与安斯沃斯：早期依恋模式影响后续人际关系' },

    { id:'development_piaget_sensorimotor',   label:'感知运动阶段',   type:'detail', level:3, parent:'development_piaget',    x:590, y:250, desc:'0-2岁，通过感觉和动作探索世界，形成客体永久性' },
    { id:'development_piaget_preoperational',  label:'前运算阶段',     type:'detail', level:3, parent:'development_piaget',    x:710, y:250, desc:'2-7岁，出现符号功能，自我中心，不具备守恒概念' },
    { id:'development_piaget_concrete',        label:'具体运算阶段',   type:'detail', level:3, parent:'development_piaget',    x:620, y:290, desc:'7-11岁，获得守恒与可逆性，但需具体事物支持' },
    { id:'development_piaget_formal',          label:'形式运算阶段',   type:'detail', level:3, parent:'development_piaget',    x:680, y:290, desc:'11岁以后，能进行抽象逻辑推理和假设思维' },

    { id:'development_erikson_trust',      label:'信任对怀疑',         type:'detail', level:3, parent:'development_erikson',   x:595, y:360, desc:'0-1岁，基本信任对基本不信任，建立安全感' },
    { id:'development_erikson_autonomy',   label:'自主对羞怯',         type:'detail', level:3, parent:'development_erikson',   x:705, y:360, desc:'1-3岁，自主性对羞怯怀疑，培养意志力' },
    { id:'development_erikson_identity',   label:'同一性对角色混乱', type:'detail', level:3, parent:'development_erikson',   x:650, y:400, desc:'青春期，建立自我同一性，防止角色混乱' },

    { id:'development_vygotsky_zpd',          label:'最近发展区',   type:'detail', level:3, parent:'development_vygotsky',  x:595, y:470, desc:'现有水平与潜在水平之间的差距，教学应落在最近发展区内' },
    { id:'development_vygotsky_scaffolding',  label:'支架式教学',   type:'detail', level:3, parent:'development_vygotsky',  x:705, y:470, desc:'教师提供临时支持，逐步撤除支架促进独立学习' },

    { id:'development_attachment_secure',   label:'安全型依恋',   type:'detail', level:3, parent:'development_attachment', x:595, y:580, desc:'约占60%，分离时焦虑但重逢后易安抚，信任照顾者' },
    { id:'development_attachment_anxious',   label:'焦虑型依恋',   type:'detail', level:3, parent:'development_attachment', x:705, y:580, desc:'分离时极度焦虑，重逢后既寻求又抗拒接触' },
    { id:'development_attachment_avoidant',  label:'回避型依恋',   type:'detail', level:3, parent:'development_attachment', x:650, y:620, desc:'分离时焦虑不明显，回避接触，情感独立但疏离' },

    // ============================================================
    // 五、异常心理学 abnormal（理论 · base_x=830）
    // ============================================================
    { id:'abnormal',         label:'异常心理学',   type:'course', level:1, parent:'theory', x:830, y:120, desc:'心理障碍的症状学、诊断分类与病因学分析' },

    { id:'abnormal_anxiety',        label:'焦虑障碍',     type:'concept', level:2, parent:'abnormal', x:830, y:210, desc:'过度焦虑与恐惧，包括广泛性焦虑、惊恐障碍与恐惧症' },
    { id:'abnormal_mood',           label:'心境障碍',     type:'concept', level:2, parent:'abnormal', x:830, y:320, desc:'情感异常：抑郁发作与双相情感障碍' },
    { id:'abnormal_personality',    label:'人格障碍',     type:'concept', level:2, parent:'abnormal', x:830, y:430, desc:'持久的、僵化的适应不良行为模式' },
    { id:'abnormal_schizophrenia',  label:'精神分裂症',   type:'concept', level:2, parent:'abnormal', x:830, y:540, desc:'思维、情感、行为紊乱，阳性与阴性症状' },
    { id:'abnormal_dsm5',           label:'DSM-5',        type:'concept', level:2, parent:'abnormal', x:830, y:650, desc:'美国精神障碍诊断统计手册第五版诊断分类体系' },

    { id:'abnormal_anxiety_gad',    label:'广泛性焦虑',   type:'detail', level:3, parent:'abnormal_anxiety',       x:775, y:250, desc:'持续6个月以上的过度焦虑与担忧，伴躯体紧张症状' },
    { id:'abnormal_anxiety_panic',  label:'惊恐障碍',     type:'detail', level:3, parent:'abnormal_anxiety',       x:885, y:250, desc:'反复发作的惊恐发作，伴濒死感与回避行为' },
    { id:'abnormal_anxiety_phobia', label:'恐惧症',       type:'detail', level:3, parent:'abnormal_anxiety',       x:830, y:290, desc:'对特定物体或情境的过度恐惧，伴回避行为' },

    { id:'abnormal_mood_depression', label:'抑郁症',   type:'detail', level:3, parent:'abnormal_mood',    x:775, y:360, desc:'情绪低落、兴趣减退、精力下降，持续2周以上' },
    { id:'abnormal_mood_bipolar',   label:'双相障碍', type:'detail', level:3, parent:'abnormal_mood',    x:885, y:360, desc:'躁狂与抑郁交替发作，情感与活动水平极端波动' },

    { id:'abnormal_personality_borderline',  label:'边缘型人格',   type:'detail', level:3, parent:'abnormal_personality',    x:775, y:470, desc:'情绪不稳定、人际关系极端、自我意象混乱、自伤行为' },
    { id:'abnormal_personality_antisocial',  label:'反社会型人格', type:'detail', level:3, parent:'abnormal_personality',    x:885, y:470, desc:'漠视他人权利、欺骗、冲动、缺乏悔意' },

    { id:'abnormal_schiz_positive',  label:'阳性症状',   type:'detail', level:3, parent:'abnormal_schizophrenia', x:775, y:580, desc:'幻觉、妄想、思维紊乱、言语行为异常' },
    { id:'abnormal_schiz_negative',  label:'阴性症状',   type:'detail', level:3, parent:'abnormal_schizophrenia', x:885, y:580, desc:'情感淡漠、意志减退、言语贫乏、社交退缩' },

    { id:'abnormal_dsm5_axis',      label:'多轴诊断',     type:'detail', level:3, parent:'abnormal_dsm5', x:775, y:690, desc:'DSM-5沿袭多维度评估：临床障碍、人格障碍、躯体状况、心理社会问题、功能评估' },
    { id:'abnormal_dsm5_category',  label:'障碍分类',     type:'detail', level:3, parent:'abnormal_dsm5', x:885, y:690, desc:'焦虑障碍、双相与抑郁障碍、人格障碍、精神分裂谱系等大类' },

    // ============================================================
    // 六、咨询心理学 counseling（理论 · base_x=1010）
    // ============================================================
    { id:'counseling',         label:'咨询心理学',   type:'course', level:1, parent:'theory', x:1010, y:120, desc:'心理咨询的基本框架：咨询关系、咨询阶段、咨询目标与咨访匹配' },

    { id:'counseling_relationship', label:'咨询关系',   type:'concept', level:2, parent:'counseling', x:1010, y:210, desc:'咨询师与来访者之间建立的工作联盟，是咨询效果的核心因子' },
    { id:'counseling_stages',       label:'咨询阶段',   type:'concept', level:2, parent:'counseling', x:1010, y:320, desc:'初始阶段→工作阶段→结束阶段的三阶段框架' },
    { id:'counseling_goals',        label:'咨询目标',   type:'concept', level:2, parent:'counseling', x:1010, y:430, desc:'短期目标与长期目标相结合，目标需具体、可操作、可评估' },
    { id:'counseling_match',        label:'咨访匹配',   type:'concept', level:2, parent:'counseling', x:1010, y:540, desc:'咨询师与来访者在理论取向、人格特征等方面的适配性' },

    { id:'counseling_relationship_alliance',  label:'工作联盟',   type:'detail', level:3, parent:'counseling_relationship', x:955,  y:250, desc:'情感联结、目标一致、任务合作三要素构成治疗联盟' },
    { id:'counseling_relationship_factors',   label:'治疗因子',   type:'detail', level:3, parent:'counseling_relationship', x:1065, y:250, desc:'共情、接纳、真诚等关系因素是疗效的关键变量' },

    { id:'counseling_stages_initial',  label:'初始阶段',   type:'detail', level:3, parent:'counseling_stages', x:955,  y:360, desc:'建立关系、收集信息、评估问题、设定目标' },
    { id:'counseling_stages_work',      label:'工作阶段',   type:'detail', level:3, parent:'counseling_stages', x:1065, y:360, desc:'运用技术促进领悟与改变，处理阻抗与移情' },
    { id:'counseling_stages_end',       label:'结束阶段',   type:'detail', level:3, parent:'counseling_stages', x:1010, y:400, desc:'回顾进展、巩固成果、预防复发、分离与告别' },

    { id:'counseling_goals_short',  label:'短期目标',   type:'detail', level:3, parent:'counseling_goals', x:955,  y:470, desc:'缓解当前症状、解决具体问题、恢复功能' },
    { id:'counseling_goals_long',   label:'长期目标',   type:'detail', level:3, parent:'counseling_goals', x:1065, y:470, desc:'促进人格成长、提升心理适应能力、预防复发' },

    { id:'counseling_match_theory',      label:'理论取向匹配', type:'detail', level:3, parent:'counseling_match', x:955,  y:580, desc:'来访者问题类型与咨询师理论取向的契合度' },
    { id:'counseling_match_personality', label:'人格匹配',     type:'detail', level:3, parent:'counseling_match', x:1065, y:580, desc:'咨访双方人格特征互补或相似，影响关系质量' },

    // ============================================================
    // 七、心理测量与评估 measurement（实务 · base_x=85）
    // ============================================================
    { id:'measurement',         label:'心理测量与评估', type:'course', level:1, parent:'practice', x:85, y:890, desc:'量表原理、常用量表施测与结果解读，咨询评估的核心工具' },

    { id:'measurement_reliability', label:'信度与效度', type:'concept', level:2, parent:'measurement', x:85, y:970,  desc:'信度是测量的可靠性，效度是测量的正确性，信度是效度的必要条件' },
    { id:'measurement_scl90',       label:'SCL-90',    type:'concept', level:2, parent:'measurement', x:85, y:1070, desc:'症状自评量表，90个项目10个因子，5级评分，心理健康筛查工具' },
    { id:'measurement_sas_sds',      label:'SAS/SDS',   type:'concept', level:2, parent:'measurement', x:85, y:1170, desc:'焦虑自评量表与抑郁自评量表，各20题4级评分' },
    { id:'measurement_mmpi',         label:'MMPI',      type:'concept', level:2, parent:'measurement', x:85, y:1270, desc:'明尼苏达多项人格调查表，566题10个临床量表' },
    { id:'measurement_epq',          label:'EPQ',       type:'concept', level:2, parent:'measurement', x:85, y:1370, desc:'艾森克人格问卷，三个维度量表测量人格特质' },

    { id:'measurement_reliability_internal', label:'内部一致性信度', type:'detail', level:3, parent:'measurement_reliability', x:40,  y:1010, desc:'Cronbach α系数衡量各项目间的一致性，α≥0.8为优' },
    { id:'measurement_reliability_validity',  label:'效标效度',     type:'detail', level:3, parent:'measurement_reliability', x:130, y:1010, desc:'测验分数与外部效标的相关程度，分同时效度与预测效度' },

    { id:'measurement_scl90_items',   label:'90项症状清单', type:'detail', level:3, parent:'measurement_scl90', x:40,  y:1110, desc:'90个项目涵盖躯体化、强迫、抑郁、焦虑等10个因子维度' },
    { id:'measurement_scl90_factors', label:'九个因子',     type:'detail', level:3, parent:'measurement_scl90', x:130, y:1110, desc:'总分≥160或任一因子≥2分或阳性项≥43项提示阳性' },

    { id:'measurement_sas',  label:'焦虑自评量表', type:'detail', level:3, parent:'measurement_sas_sds', x:40,  y:1210, desc:'SAS标准分≥50分提示焦虑，50-59轻度、60-69中度、≥70重度' },
    { id:'measurement_sds',  label:'抑郁自评量表', type:'detail', level:3, parent:'measurement_sas_sds', x:130, y:1210, desc:'SDS标准分≥50分提示抑郁，分级标准同SAS' },

    { id:'measurement_mmpi_intro',   label:'明尼苏达多项人格调查表', type:'detail', level:3, parent:'measurement_mmpi', x:40,  y:1310, desc:'566个是非题，10个临床量表加4个效度量表' },
    { id:'measurement_mmpi_scales',  label:'10个临床量表',          type:'detail', level:3, parent:'measurement_mmpi', x:130, y:1310, desc:'疑病、抑郁、癔症、精神病态、男子气-女子气、偏执等' },

    { id:'measurement_epq_intro',       label:'艾森克人格问卷', type:'detail', level:3, parent:'measurement_epq', x:40,  y:1410, desc:'成人版与儿童版，各含内外倾、神经质、精神质及效度L量表' },
    { id:'measurement_epq_dimensions', label:'三个维度量表', type:'detail', level:3, parent:'measurement_epq', x:130, y:1410, desc:'P量表精神质、E量表内外倾、N量表神经质' },

    // ============================================================
    // 八、通用技术 general（实务 · base_x=235）
    // ============================================================
    { id:'general',         label:'通用技术',   type:'course', level:1, parent:'practice', x:235, y:890, desc:'心理咨询的基本会谈技术：共情、倾听、提问、面质、反映' },

    { id:'general_empathy',       label:'共情',   type:'concept', level:2, parent:'general', x:235, y:970,  desc:'设身处地理解来访者内心世界并准确传达这种理解' },
    { id:'general_listening',     label:'倾听',   type:'concept', level:2, parent:'general', x:235, y:1070, desc:'积极关注地接收来访者的言语与非言语信息' },
    { id:'general_questioning',   label:'提问',   type:'concept', level:2, parent:'general', x:235, y:1170, desc:'开放式与封闭式提问策略引导来访者探索' },
    { id:'general_confrontation',label:'面质',   type:'concept', level:2, parent:'general', x:235, y:1270, desc:'指出来访者言行矛盾，促进其自我觉察' },
    { id:'general_reflection',   label:'反映',   type:'concept', level:2, parent:'general', x:235, y:1370, desc:'情感反映与内容反映，镜映来访者的感受与表达' },

    { id:'general_empathy_primary',  label:'初级共情',   type:'detail', level:3, parent:'general_empathy',      x:190, y:1010, desc:'用与来访者相近的情感和言语回应，建立情感联结' },
    { id:'general_empathy_advanced', label:'高级共情',   type:'detail', level:3, parent:'general_empathy',      x:280, y:1010, desc:'捕捉来访者未明确表达的深层情感，拓展其自我觉察' },

    { id:'general_listening_active',   label:'积极倾听',   type:'detail', level:3, parent:'general_listening',    x:190, y:1110, desc:'目光接触、点头、简短回应，传递关注与接纳' },
    { id:'general_listening_nonverbal', label:'非言语倾听',type:'detail', level:3, parent:'general_listening',    x:280, y:1110, desc:'观察表情、姿态、语调等非言语线索，理解言外之意' },

    { id:'general_questioning_open',   label:'开放式提问', type:'detail', level:3, parent:'general_questioning', x:190, y:1210, desc:'用"什么""怎样"引导来访者自由表达，促进探索' },
    { id:'general_questioning_closed', label:'封闭式提问', type:'detail', level:3, parent:'general_questioning', x:280, y:1210, desc:'用"是不是""对不对"获取具体信息，澄清事实' },

    { id:'general_confrontation_contradiction', label:'矛盾面质', type:'detail', level:3, parent:'general_confrontation', x:190, y:1310, desc:'指出言行、言语间或前后表述的矛盾之处' },
    { id:'general_confrontation_limit',         label:'限制面质', type:'detail', level:3, parent:'general_confrontation', x:280, y:1310, desc:'在来访者准备好时适度使用，避免过度引发防御' },

    { id:'general_reflection_emotion', label:'情感反映', type:'detail', level:3, parent:'general_reflection', x:190, y:1410, desc:'用言语镜映来访者表达或未表达的情感体验' },
    { id:'general_reflection_content',  label:'内容反映', type:'detail', level:3, parent:'general_reflection', x:280, y:1410, desc:'用自己的话复述来访者表达的核心内容与含义' },

    // ============================================================
    // 九、CBT cbt（实务 · base_x=385）
    // ============================================================
    { id:'cbt',         label:'CBT',   type:'course', level:1, parent:'practice', x:385, y:890, desc:'认知行为疗法：认知重构与行为干预，适用于抑郁、焦虑等' },

    { id:'cbt_abc',         label:'ABC理论',        type:'concept', level:2, parent:'cbt', x:385, y:970,  desc:'埃利斯理性情绪疗法：A事件→B信念→C结果，信念决定情绪' },
    { id:'cbt_automatic',   label:'自动思维',       type:'concept', level:2, parent:'cbt', x:385, y:1070, desc:'情境中自动产生的快速想法，常为负性且影响情绪行为' },
    { id:'cbt_distortion',  label:'认知扭曲',       type:'concept', level:2, parent:'cbt', x:385, y:1170, desc:'系统性的认知错误模式：灾难化、非黑即白、过度概括等' },
    { id:'cbt_experiment', label:'行为实验',       type:'concept', level:2, parent:'cbt', x:385, y:1270, desc:'通过实际行动检验信念的真实性，是CBT核心技术之一' },
    { id:'cbt_socratic',    label:'苏格拉底式提问', type:'concept', level:2, parent:'cbt', x:385, y:1370, desc:'通过系统提问引导来访者自己发现认知问题与替代思维' },

    { id:'cbt_abc_event',       label:'诱发事件',   type:'detail', level:3, parent:'cbt_abc', x:340, y:1010, desc:'A（Activating event）：触发情绪反应的外部事件或情境' },
    { id:'cbt_abc_belief',      label:'信念',       type:'detail', level:3, parent:'cbt_abc', x:430, y:1010, desc:'B（Belief）：对事件的评价与信念，理性与非理性之分' },
    { id:'cbt_abc_consequence', label:'结果',       type:'detail', level:3, parent:'cbt_abc', x:385, y:1050, desc:'C（Consequence）：由信念引发的情绪与行为反应，非事件直接导致' },

    { id:'cbt_automatic_negative',    label:'负性自动思维', type:'detail', level:3, parent:'cbt_automatic',   x:340, y:1110, desc:'自动涌现的消极想法，与抑郁焦虑密切相关，需识别并挑战' },
    { id:'cbt_automatic_intervention',label:'认知干预',     type:'detail', level:3, parent:'cbt_automatic',   x:430, y:1110, desc:'识别→评估→替代三步法，用证据检验并重构自动思维' },

    { id:'cbt_distortion_catastrophe',   label:'灾难化',     type:'detail', level:3, parent:'cbt_distortion',  x:340, y:1210, desc:'将小事放大为灾难性后果，"万一……怎么办"思维' },
    { id:'cbt_distortion_dichotomous',   label:'非黑即白',   type:'detail', level:3, parent:'cbt_distortion',  x:430, y:1210, desc:'全或无思维，非此即彼，缺乏中间过渡' },

    { id:'cbt_experiment_hypothesis',  label:'假设检验',   type:'detail', level:3, parent:'cbt_experiment', x:340, y:1310, desc:'将信念转化为可检验假设，设计实验验证或推翻' },
    { id:'cbt_experiment_activation',  label:'行为激活',   type:'detail', level:3, parent:'cbt_experiment', x:430, y:1310, desc:'通过安排愉悦与成就活动打破抑郁行为退缩循环' },

    { id:'cbt_socratic_questioning',  label:'诘问式对话',   type:'detail', level:3, parent:'cbt_socratic', x:340, y:1410, desc:'通过证据、替代解释、去灾难化等系统提问挑战不合理信念' },
    { id:'cbt_socratic_guided',        label:'引导发现',   type:'detail', level:3, parent:'cbt_socratic', x:430, y:1410, desc:'引导来访者自己得出新结论而非直接说教，增强领悟' },

    // ============================================================
    // 十、人本主义 humanistic（实务 · base_x=535）
    // ============================================================
    { id:'humanistic',         label:'人本主义',   type:'course', level:1, parent:'practice', x:535, y:890, desc:'罗杰斯以人为中心疗法：三大核心条件促进来访者自我成长' },

    { id:'humanistic_unconditional',        label:'无条件积极关注', type:'concept', level:2, parent:'humanistic', x:535, y:970,  desc:'无条件接纳来访者的全部感受与体验，不作价值评判' },
    { id:'humanistic_genuineness',           label:'真诚一致',     type:'concept', level:2, parent:'humanistic', x:535, y:1070, desc:'咨询师内外一致、真实透明，不戴专业面具' },
    { id:'humanistic_empathy',              label:'共情理解',     type:'concept', level:2, parent:'humanistic', x:535, y:1170, desc:'深入来访者内部参照系，准确理解其主观体验' },
    { id:'humanistic_self_actualization',   label:'自我实现',     type:'concept', level:2, parent:'humanistic', x:535, y:1270, desc:'人的内在成长倾向，趋向充分发挥潜能的方向' },

    { id:'humanistic_unconditional_acceptance', label:'无条件接纳',   type:'detail', level:3, parent:'humanistic_unconditional',        x:490, y:1010, desc:'接纳来访者全部体验包括消极感受，不附加条件地给予关注' },
    { id:'humanistic_unconditional_positive',   label:'积极关注',     type:'detail', level:3, parent:'humanistic_unconditional',        x:580, y:1010, desc:'关注来访者积极面与成长潜能，相信其自我实现方向' },

    { id:'humanistic_genuineness_authenticity', label:'真实性',   type:'detail', level:3, parent:'humanistic_genuineness',           x:490, y:1110, desc:'咨询师真实感受与表达一致，不伪装角色或情感' },
    { id:'humanistic_genuineness_congruence',    label:'一致性',   type:'detail', level:3, parent:'humanistic_genuineness',           x:580, y:1110, desc:'内部体验与外显行为一致，内外和谐无冲突' },

    { id:'humanistic_empathy_perspective', label:'设身处地', type:'detail', level:3, parent:'humanistic_empathy',            x:490, y:1210, desc:'进入来访者的内部参照系，如同身临其境地体验其世界' },
    { id:'humanistic_empathy_resonance',   label:'情感共鸣', type:'detail', level:3, parent:'humanistic_empathy',            x:580, y:1210, desc:'与来访者情感同频共振，但保持"如同"而非"就是"的界限' },

    { id:'humanistic_self_potential', label:'自我潜能',   type:'detail', level:3, parent:'humanistic_self_actualization', x:490, y:1310, desc:'每个人内在蕴含的成长与发展潜能，咨询旨在释放这一潜能' },
    { id:'humanistic_self_growth',    label:'成长动机', type:'detail', level:3, parent:'humanistic_self_actualization', x:580, y:1310, desc:'趋向自我实现的一股内在动力，是建设性变化的核心' },

    // ============================================================
    // 十一、团体心理辅导 group（实务 · base_x=685）
    // ============================================================
    { id:'group',         label:'团体心理辅导', type:'course', level:1, parent:'practice', x:685, y:890, desc:'团体情境下的心理辅导：发展阶段、角色、凝聚力与效果评估' },

    { id:'group_development',  label:'团体发展阶段', type:'concept', level:2, parent:'group', x:685, y:970,  desc:'形成→风暴→规范→执行→结束的五阶段发展模型' },
    { id:'group_roles',        label:'团体角色',     type:'concept', level:2, parent:'group', x:685, y:1070, desc:'领导角色与成员角色，角色分工影响团体动力' },
    { id:'group_cohesion',    label:'团体凝聚力',   type:'concept', level:2, parent:'group', x:685, y:1170, desc:'成员对团体的归属感与吸引力，是团体疗效的关键变量' },
    { id:'group_evaluation',  label:'效果评估',     type:'concept', level:2, parent:'group', x:685, y:1270, desc:'过程评估与结果评估相结合的团体效能测量' },

    { id:'group_development_initial', label:'初始阶段',   type:'detail', level:3, parent:'group_development', x:640, y:1010, desc:'成员互识、建立规则、明确目标，焦虑与期待并存' },
    { id:'group_development_work',     label:'工作阶段',   type:'detail', level:3, parent:'group_development', x:730, y:1010, desc:'深入探索、情感表达、人际学习与反馈，团体疗效核心期' },
    { id:'group_development_end',      label:'结束阶段',   type:'detail', level:3, parent:'group_development', x:685, y:1050, desc:'回顾成长、处理分离情感、巩固成果、迁移到现实生活' },

    { id:'group_roles_leader', label:'领导者',   type:'detail', level:3, parent:'group_roles', x:640, y:1110, desc:'引导方向、维护规范、促进互动、处理冲突' },
    { id:'group_roles_member',  label:'成员角色', type:'detail', level:3, parent:'group_roles', x:730, y:1110, desc:'任务角色（提议、协调）与维持角色（鼓励、调解）' },

    { id:'group_cohesion_sense', label:'凝聚感',   type:'detail', level:3, parent:'group_cohesion', x:640, y:1210, desc:'成员间的情感联结与团体认同，凝聚力高则参与度高' },
    { id:'group_cohesion_norm',  label:'规范建立', type:'detail', level:3, parent:'group_cohesion', x:730, y:1210, desc:'保密、尊重、准时等团体规范增强安全感与凝聚力' },

    { id:'group_evaluation_process', label:'过程评估',   type:'detail', level:3, parent:'group_evaluation', x:640, y:1310, desc:'每次或每阶段观察团体动力、成员参与度与目标达成进度' },
    { id:'group_evaluation_outcome',  label:'结果评估', type:'detail', level:3, parent:'group_evaluation', x:730, y:1310, desc:'团体结束后用量表、访谈等评估成员心理变化与整体效果' },

    // ============================================================
    // 十二、伦理实务 ethics（实务 · base_x=835）
    // ============================================================
    { id:'ethics',         label:'伦理实务',   type:'course', level:1, parent:'practice', x:835, y:890, desc:'心理咨询执业伦理规范：保密、知情同意、双重关系、胜任力与伦理决策' },

    { id:'ethics_confidentiality',    label:'保密原则',   type:'concept', level:2, parent:'ethics', x:835, y:970,  desc:'保护来访者隐私是核心伦理义务，但有法定例外' },
    { id:'ethics_informed_consent',   label:'知情同意',   type:'concept', level:2, parent:'ethics', x:835, y:1070, desc:'来访者在充分了解后自愿同意接受咨询及相关程序' },
    { id:'ethics_dual',              label:'双重关系',   type:'concept', level:2, parent:'ethics', x:835, y:1170, desc:'咨询师与来访者同时存在专业关系外的其他关系，需避免' },
    { id:'ethics_competence',        label:'胜任力',     type:'concept', level:2, parent:'ethics', x:835, y:1270, desc:'咨询师在专业培训与能力范围内执业，不超范围服务' },
    { id:'ethics_decision',          label:'伦理决策',   type:'concept', level:2, parent:'ethics', x:835, y:1370, desc:'面临伦理困境时依据守则与决策模型进行系统判断' },

    { id:'ethics_confidentiality_exception', label:'保密例外',   type:'detail', level:3, parent:'ethics_confidentiality',  x:790, y:1010, desc:'自杀/伤人风险、虐待儿童/老人、法庭传唤等法定保密例外情形' },
    { id:'ethics_confidentiality_limit',     label:'保密限制',   type:'detail', level:3, parent:'ethics_confidentiality',  x:880, y:1010, desc:'咨询开始时即告知保密的范围与限制，签署知情同意' },

    { id:'ethics_consent_disclosure',  label:'信息披露',   type:'detail', level:3, parent:'ethics_informed_consent', x:790, y:1110, desc:'向来访者说明咨询目的、方法、风险、保密限制及权利' },
    { id:'ethics_consent_voluntary',   label:'自愿同意',   type:'detail', level:3, parent:'ethics_informed_consent', x:880, y:1110, desc:'来访者在无胁迫、充分理解的前提下自主决定是否接受咨询' },

    { id:'ethics_dual_boundary',     label:'边界问题',   type:'detail', level:3, parent:'ethics_dual', x:790, y:1210, desc:'专业边界模糊或跨越，包括社交、商业、亲密等关系' },
    { id:'ethics_dual_restriction',  label:'关系限制', type:'detail', level:3, parent:'ethics_dual', x:880, y:1210, desc:'避免与来访者发生咨询关系外的任何可能损害来访者的关系' },

    { id:'ethics_competence_training',   label:'专业培训',   type:'detail', level:3, parent:'ethics_competence', x:790, y:1310, desc:'持续接受专业培训与督导，保持专业能力与时俱进' },
    { id:'ethics_competence_boundary',    label:'能力边界', type:'detail', level:3, parent:'ethics_competence', x:880, y:1310, desc:'超出能力范围时及时转介，不勉强处理不熟悉的问题' },

    { id:'ethics_decision_code',  label:'伦理守则',   type:'detail', level:3, parent:'ethics_decision', x:790, y:1410, desc:'中国心理学会临床与咨询心理学伦理守则等执业规范' },
    { id:'ethics_decision_model', label:'决策模型', type:'detail', level:3, parent:'ethics_decision', x:880, y:1410, desc:'识别问题→查阅守则→评估方案→咨询督导→选择行动→反思' },

    // ============================================================
    // 十三、危机干预 crisis（实务 · base_x=985）
    // ============================================================
    { id:'crisis',         label:'危机干预',   type:'course', level:1, parent:'practice', x:985, y:890, desc:'对急性心理危机的评估、干预与转介：评估-稳定-转介' },

    { id:'crisis_assessment',  label:'危机评估',       type:'concept', level:2, parent:'crisis', x:985, y:970,  desc:'快速评估危机类型、危险程度与可用资源，确定干预级别' },
    { id:'crisis_saferr',      label:'SAFER-R模型',   type:'concept', level:2, parent:'crisis', x:985, y:1070, desc:'六步危机干预模型：稳定→确认→评估→发现→教育→恢复' },
    { id:'crisis_suicide',     label:'自杀风险评估',   type:'concept', level:2, parent:'crisis', x:985, y:1170, desc:'评估意念、计划、手段与既往史，确定自杀风险等级' },
    { id:'crisis_pfa',         label:'心理急救',       type:'concept', level:2, parent:'crisis', x:985, y:1270, desc:'灾难与突发事件后即时的心理援助，减少创伤后反应' },

    { id:'crisis_assessment_type', label:'危机类型',   type:'detail', level:3, parent:'crisis_assessment', x:940, y:1010, desc:'发展性危机、境遇性危机与存在性危机，类型决定干预策略' },
    { id:'crisis_assessment_risk', label:'危险评估', type:'detail', level:3, parent:'crisis_assessment', x:1030,y:1010, desc:'评估自伤、伤人及其他危险，确定需立即干预还是转介' },

    { id:'crisis_saferr_stabilize',    label:'稳定化',       type:'detail', level:3, parent:'crisis_saferr', x:940, y:1110, desc:'建立安全感与情绪稳定，确保来访者及他人即时安全' },
    { id:'crisis_saferr_acknowledge',  label:'确认与评估', type:'detail', level:3, parent:'crisis_saferr', x:1030,y:1110, desc:'确认危机事件经过、评估来访者的反应与应对资源' },

    { id:'crisis_suicide_ideation', label:'自杀意念', type:'detail', level:3, parent:'crisis_suicide', x:940, y:1210, desc:'评估意念频率、强度与持续时间，区分被动与主动意念' },
    { id:'crisis_suicide_plan',     label:'自杀计划', type:'detail', level:3, parent:'crisis_suicide', x:1030,y:1210, desc:'评估计划的周密性、手段可获得性与时间安排，计划越具体风险越高' },

    { id:'crisis_pfa_principle', label:'PFA原则',   type:'detail', level:3, parent:'crisis_pfa', x:940, y:1310, desc:'安全、冷静、联结、效能感与希望五大核心原则' },
    { id:'crisis_pfa_safety',    label:'安全感建立',type:'detail', level:3, parent:'crisis_pfa', x:1030,y:1310, desc:'帮助幸存者脱离危险环境，获得生理与心理层面的安全感' },

    // ============================================================
    // 十四、实务练习 exercise（实务 · base_x=1135）
    // ============================================================
    { id:'exercise',         label:'实务练习',   type:'course', level:1, parent:'practice', x:1135, y:890, desc:'心理咨询全流程实操：初始访谈、个案概念化、治疗计划与效果评估' },

    { id:'exercise_initial',          label:'初始访谈',     type:'concept', level:2, parent:'exercise', x:1135, y:970,  desc:'首次会谈中收集信息、建立关系、初步评估与形成印象' },
    { id:'exercise_conceptualization',label:'个案概念化', type:'concept', level:2, parent:'exercise', x:1135, y:1070, desc:'整合信息形成对来访者问题成因与维持机制的假设框架' },
    { id:'exercise_treatment',        label:'治疗计划',     type:'concept', level:2, parent:'exercise', x:1135, y:1170, desc:'基于个案概念化设定治疗目标、选择策略与安排阶段' },
    { id:'exercise_evaluation',       label:'效果评估',     type:'concept', level:2, parent:'exercise', x:1135, y:1270, desc:'用前后测与咨访双方反馈衡量咨询效果，指导调整方案' },

    { id:'exercise_initial_info',    label:'信息收集',   type:'detail', level:3, parent:'exercise_initial',           x:1090, y:1010, desc:'主诉、现病史、既往史、家族史、社会支持等系统信息采集' },
    { id:'exercise_initial_rapport', label:'关系建立', type:'detail', level:3, parent:'exercise_initial',           x:1180, y:1010, desc:'首次访谈中通过共情、接纳与尊重奠定工作联盟基础' },

    { id:'exercise_concept_problem',    label:'问题分析',   type:'detail', level:3, parent:'exercise_conceptualization',x:1090, y:1110, desc:'识别核心问题、诱发因素、维持因素与保护因素' },
    { id:'exercise_concept_hypothesis', label:'假设形成', type:'detail', level:3, parent:'exercise_conceptualization',x:1180, y:1110, desc:'基于理论框架形成对问题发生机制的解释性假设' },

    { id:'exercise_treatment_goal',     label:'目标设定',   type:'detail', level:3, parent:'exercise_treatment', x:1090, y:1210, desc:'与来访者协商设定具体、可测量、可达成、相关且有时限的目标' },
    { id:'exercise_treatment_strategy',  label:'策略选择', type:'detail', level:3, parent:'exercise_treatment', x:1180, y:1210, desc:'根据个案概念化与理论取向选择技术与干预策略序列' },

    { id:'exercise_evaluation_prepost',  label:'前后测',   type:'detail', level:3, parent:'exercise_evaluation', x:1090, y:1310, desc:'咨询前后用标准化量表测量症状变化，量化效果对比' },
    { id:'exercise_evaluation_outcome',  label:'咨询效果', type:'detail', level:3, parent:'exercise_evaluation', x:1180, y:1310, desc:'综合量表数据、功能恢复与来访者主观满意度评估整体效果' },

    // ============================================================
    // 扩展节点：从课程教材中深度挖掘的概念与知识点
    // ============================================================
    { id:'intro_physiology', label:'心理活动生理基础', type:'concept', level:2, parent:'intro', x:110, y:760, desc:'神经系统结构与大脑皮层功能分工，左右半球功能不对称' },
    { id:'intro_physiology_cortex', label:'大脑皮层分区', type:'detail', level:3, parent:'intro_physiology', x:55, y:800, desc:'额叶(运动/高级认知)、顶叶(躯体感觉)、颞叶(听觉/语言)、枕叶(视觉)' },
    { id:'intro_physiology_lateral', label:'大脑功能不对称', type:'detail', level:3, parent:'intro_physiology', x:165, y:800, desc:'左半球：言语/逻辑/数学；右半球：空间/形象/音乐。斯佩里割裂脑实验提出' },
    { id:'intro_thinking', label:'思维与想象', type:'concept', level:2, parent:'intro', x:110, y:870, desc:'思维的特征与种类、概念形成、问题解决及影响因素' },
    { id:'intro_thinking_feature', label:'思维的特征', type:'detail', level:3, parent:'intro_thinking', x:55, y:910, desc:'间接性（借助媒介认识事物）与概括性（抽取共同本质属性）；动作/形象/抽象思维' },
    { id:'intro_thinking_problem', label:'问题解决', type:'detail', level:3, parent:'intro_thinking', x:165, y:910, desc:'发现→分析→提出假设→检验。影响因素：迁移、定势(功能固着)、耶克斯-多德森定律(中等动机最有利)' },
    { id:'intro_will', label:'意志品质', type:'concept', level:2, parent:'intro', x:110, y:980, desc:'自觉确定目的、克服困难的心理过程及其四大品质' },
    { id:'intro_will_quality', label:'意志四大品质', type:'detail', level:3, parent:'intro_will', x:110, y:1020, desc:'自觉性(相反:受暗示/独断)、果断性(相反:优柔寡断/草率)、自制性(相反:任性/怯懦)、坚韧性(相反:动摇/顽固)' },
    { id:'intro_temperament', label:'气质与性格', type:'concept', level:2, parent:'intro', x:110, y:1090, desc:'气质类型、性格特征及其关系' },
    { id:'intro_temperament_type', label:'四种气质类型', type:'detail', level:3, parent:'intro_temperament', x:55, y:1130, desc:'胆汁质(强不平衡)、多血质(强平衡灵活)、粘液质(强平衡不灵活)、抑郁质(弱型)' },
    { id:'intro_temperament_character', label:'性格与气质', type:'detail', level:3, parent:'intro_temperament', x:165, y:1130, desc:'气质先天无好坏，性格后天有善恶；气质影响性格表现，性格可改造气质' },
    { id:'intro_memory_forgetting', label:'艾宾浩斯遗忘曲线', type:'detail', level:3, parent:'intro_memory', x:55, y:550, desc:'遗忘"先快后慢"的负加速趋势，用节省法测量' },
    { id:'intro_memory_interference', label:'前摄与倒摄抑制', type:'detail', level:3, parent:'intro_memory', x:165, y:550, desc:'前摄抑制：先学材料干扰后学；倒摄抑制：后学材料干扰先学' },
    { id:'social_self', label:'社会化与自我', type:'concept', level:2, parent:'social', x:290, y:760, desc:'社会化过程、自我概念与自我效能感' },
    { id:'social_self_socialization', label:'社会化', type:'detail', level:3, parent:'social_self', x:235, y:800, desc:'学习社会文化、掌握社会规范、形成社会角色的过程。途径：家庭/学校/同伴/传媒' },
    { id:'social_self_concept', label:'自我概念', type:'detail', level:3, parent:'social_self', x:345, y:800, desc:'詹姆斯：主我(I)与客我(Me)，客我含物质/社会/精神自我' },
    { id:'social_self_efficacy', label:'自我效能感', type:'detail', level:3, parent:'social_self', x:290, y:840, desc:'班杜拉：对能否完成任务的判断。来源：直接经验/替代经验/言语劝说/情绪唤醒' },
    { id:'social_group', label:'群体心理', type:'concept', level:2, parent:'social', x:290, y:910, desc:'他人在场对个体行为的影响及群体中的心理现象' },
    { id:'social_group_facilitation', label:'社会促进与抑制', type:'detail', level:3, parent:'social_group', x:235, y:950, desc:'社会促进：他人在场提高效率；社会抑制：他人在场降低效率' },
    { id:'social_group_lazy', label:'社会懈怠', type:'detail', level:3, parent:'social_group', x:345, y:950, desc:'群体中个体努力程度降低（"磨洋工"现象）' },
    { id:'social_group_deindividuation', label:'去个性化', type:'detail', level:3, parent:'social_group', x:290, y:990, desc:'群体中自我意识降低、行为失控，匿名性是重要诱因' },
    { id:'social_motivation', label:'社会动机', type:'concept', level:2, parent:'social', x:290, y:1060, desc:'亲和、成就、权力三大社会动机及社交情绪' },
    { id:'social_motivation_types', label:'三种社会动机', type:'detail', level:3, parent:'social_motivation', x:235, y:1100, desc:'亲和动机(接近交往)、成就动机(追求卓越)、权力动机(影响控制他人)' },
    { id:'social_motivation_emotion', label:'社交情绪', type:'detail', level:3, parent:'social_motivation', x:345, y:1100, desc:'社交焦虑、嫉妒、羞耻(指向自我)与内疚(指向行为)' },
    { id:'social_cognition_impression', label:'印象形成效应', type:'detail', level:3, parent:'social_cognition', x:290, y:620, desc:'首因效应(第一印象)、近因效应(最后信息)、晕轮效应(光环泛化)' },
    { id:'social_attribution_kelley', label:'凯利三维归因', type:'detail', level:3, parent:'social_attribution', x:235, y:400, desc:'区别性、一致性、一贯性三维度进行归因判断' },
    { id:'social_attribution_self', label:'自我服务偏差', type:'detail', level:3, parent:'social_attribution', x:345, y:400, desc:'成功归因内部因素，失败归因外部因素' },
    { id:'social_conformity_compliance', label:'顺从技巧', type:'detail', level:3, parent:'social_conformity', x:290, y:290, desc:'登门槛(先小后大)、留面子(先大后小)、过度理由效应' },
    { id:'social_relationship_schutz', label:'舒茨三维理论', type:'detail', level:3, parent:'social_relationship', x:290, y:730, desc:'人际需要：包容需要、控制需要、情感需要' },
    { id:'personality_defense', label:'心理防御机制', type:'concept', level:2, parent:'personality', x:470, y:650, desc:'自我应对焦虑的无意识心理策略' },
    { id:'personality_defense_repression', label:'压抑与投射', type:'detail', level:3, parent:'personality_defense', x:415, y:690, desc:'压抑：将痛苦经验排除到无意识(最基本)；投射：将不愿承认的冲动归因于他人' },
    { id:'personality_defense_rationalization', label:'合理化与移置', type:'detail', level:3, parent:'personality_defense', x:525, y:690, desc:'合理化：为不可接受行为找理由(酸葡萄/甜柠檬)；移置：将情绪转移到其他对象' },
    { id:'personality_defense_sublimation', label:'反向形成与升华', type:'detail', level:3, parent:'personality_defense', x:470, y:730, desc:'反向形成：以相反行为表现真实冲动；升华：转化为建设性活动(最成熟的防御机制)' },
    { id:'personality_psychosexual', label:'心理性欲发展', type:'concept', level:2, parent:'personality', x:470, y:800, desc:'弗洛伊德人格发展五阶段，各阶段固着导致不同人格特征' },
    { id:'personality_psychosexual_oral', label:'口唇期与肛门期', type:'detail', level:3, parent:'personality_psychosexual', x:415, y:840, desc:'口唇期(0-1岁)：口唇满足；肛门期(1-3岁)：如厕训练，固着导致强迫/邋遢' },
    { id:'personality_psychosexual_phallic', label:'性器期(俄狄浦斯情结)', type:'detail', level:3, parent:'personality_psychosexual', x:525, y:840, desc:'3-6岁，对异性父母产生爱慕，认同同性父母形成性别角色' },
    { id:'personality_psychosexual_latency', label:'潜伏期与生殖期', type:'detail', level:3, parent:'personality_psychosexual', x:470, y:880, desc:'潜伏期(6-12岁)：性冲动沉寂；生殖期(12岁+)：成熟性取向' },
    { id:'personality_allport_cattell', label:'奥尔波特与卡特尔', type:'concept', level:2, parent:'personality', x:470, y:950, desc:'特质理论两大代表：奥尔波特三层特质与卡特尔16PF' },
    { id:'personality_allport', label:'奥尔波特特质理论', type:'detail', level:3, parent:'personality_allport_cattell', x:415, y:990, desc:'共同特质(文化共有)与个人特质：首要特质(最具概括性)、中心特质(5-10个核心)、次要特质(情境性)' },
    { id:'personality_cattell', label:'卡特尔16PF', type:'detail', level:3, parent:'personality_allport_cattell', x:525, y:990, desc:'因素分析法，表面特质(可观察)与根源特质(潜在因素)，16种根源特质编制16PF问卷' },
    { id:'personality_behavioral', label:'行为主义人格观', type:'concept', level:2, parent:'personality', x:470, y:1060, desc:'人格是习得的行为反应总和：操作性条件反射与社会学习理论' },
    { id:'personality_behavioral_skinner', label:'斯金纳操作条件反射', type:'detail', level:3, parent:'personality_behavioral', x:415, y:1100, desc:'行为随后果(强化/惩罚)而改变，人格是一切行为反应的总和' },
    { id:'personality_behavioral_bandura', label:'班杜拉社会学习', type:'detail', level:3, parent:'personality_behavioral', x:525, y:1100, desc:'观察学习(替代学习)与自我效能感，强调认知与社会因素' },
    { id:'personality_rogers', label:'罗杰斯自我概念', type:'concept', level:2, parent:'personality', x:470, y:1170, desc:'真实自我与理想自我的一致性决定心理适应' },
    { id:'personality_rogers_self', label:'真实自我与理想自我', type:'detail', level:3, parent:'personality_rogers', x:415, y:1210, desc:'真实自我(实际体验)与理想自我(希望成为)，差距过大导致适应不良' },
    { id:'personality_rogers_worth', label:'价值条件', type:'detail', level:3, parent:'personality_rogers', x:525, y:1210, desc:'只有满足条件才获爱认可→内化为价值条件，越多则自我与经验越不一致' },
    { id:'development_language', label:'言语发展', type:'concept', level:2, parent:'development', x:650, y:650, desc:'婴儿言语发展的阶段与语言获得理论' },
    { id:'development_language_stages', label:'言语发展四阶段', type:'detail', level:3, parent:'development_language', x:595, y:690, desc:'咿呀学语(0-6月)→单字句(1岁)→电报句(1.5-2岁)→完整句(2-3岁)' },
    { id:'development_language_theory', label:'语言获得理论', type:'detail', level:3, parent:'development_language', x:705, y:690, desc:'斯金纳强化说 vs 乔姆斯基先天语言获得装置(LAD)' },
    { id:'development_identity', label:'同一性发展', type:'concept', level:2, parent:'development', x:650, y:760, desc:'玛西亚的四种同一性状态与青春期核心任务' },
    { id:'development_identity_marcia', label:'玛西亚四种状态', type:'detail', level:3, parent:'development_identity', x:650, y:800, desc:'同一性获得(探索+承诺)、延缓(探索无承诺)、早闭(无探索有承诺)、扩散(均无)' },
    { id:'development_intelligence', label:'智力与研究方法', type:'concept', level:2, parent:'development', x:650, y:870, desc:'晶体/流体智力的发展趋势与发展心理学研究方法' },
    { id:'development_intelligence_crystal', label:'晶体与流体智力', type:'detail', level:3, parent:'development_intelligence', x:595, y:910, desc:'晶体智力(知识经验)随年龄增长；流体智力(信息加工)随年龄下降。卡特尔提出' },
    { id:'development_intelligence_method', label:'发展研究方法', type:'detail', level:3, parent:'development_intelligence', x:705, y:910, desc:'横断研究(省时,有代际效应)、纵向研究(无代际效应,耗时)、聚合交叉研究(结合两者)' },
    { id:'development_piaget_concepts', label:'图式/同化/顺应', type:'detail', level:3, parent:'development_piaget', x:650, y:330, desc:'图式(认知结构)、同化(纳入新信息到已有图式)、顺应(改变图式适应新信息)、平衡(两者交替达到认知平衡)' },
    { id:'development_erikson_initiative', label:'主动对内疚', type:'detail', level:3, parent:'development_erikson', x:595, y:440, desc:'3-6岁，主动探索对内疚感，培养目的感' },
    { id:'development_erikson_industry', label:'勤奋对自卑', type:'detail', level:3, parent:'development_erikson', x:705, y:440, desc:'6-12岁，学习能力对自卑感，培养能力感' },
    { id:'development_erikson_intimacy', label:'亲密对孤独', type:'detail', level:3, parent:'development_erikson', x:595, y:480, desc:'18-25岁，建立亲密关系对孤独隔离，培养爱' },
    { id:'development_erikson_generativity', label:'繁衍对停滞', type:'detail', level:3, parent:'development_erikson', x:705, y:480, desc:'25-65岁，养育下一代对自我停滞，培养关怀' },
    { id:'development_erikson_integrity', label:'自我整合对绝望', type:'detail', level:3, parent:'development_erikson', x:650, y:520, desc:'65岁+，回顾一生接受死亡对绝望，培养智慧' },
    { id:'abnormal_criteria', label:'正常与异常区分', type:'concept', level:2, parent:'abnormal', x:830, y:760, desc:'郭念锋三原则与心理问题分级' },
    { id:'abnormal_criteria_principles', label:'郭念锋三原则', type:'detail', level:3, parent:'abnormal_criteria', x:775, y:800, desc:'①主客观世界统一性(有无幻觉妄想)②心理活动内在协调性(知情意是否协调)③人格相对稳定性' },
    { id:'abnormal_criteria_level', label:'心理问题分级', type:'detail', level:3, parent:'abnormal_criteria', x:885, y:800, desc:'一般心理问题(1-2月,无泛化)→严重心理问题(2月-半年,有泛化)→可疑神经症(3月+,功能明显受损)' },
    { id:'abnormal_ocd', label:'强迫症', type:'concept', level:2, parent:'abnormal', x:830, y:870, desc:'强迫观念与强迫行为，患者有自知力但无法控制' },
    { id:'abnormal_ocd_obsession', label:'强迫观念', type:'detail', level:3, parent:'abnormal_ocd', x:775, y:910, desc:'反复出现的unwanted想法、意象或冲动，患者知道不合理但无法停止' },
    { id:'abnormal_ocd_compulsion', label:'强迫行为', type:'detail', level:3, parent:'abnormal_ocd', x:885, y:910, desc:'为减轻焦虑而反复进行的行为(洗手/检查/计数)，有自知力(知道不合理但控制不了)' },
    { id:'abnormal_personality_paranoid', label:'偏执型人格', type:'detail', level:3, parent:'abnormal_personality', x:775, y:510, desc:'猜疑、固执、好诉讼，对他人普遍不信任' },
    { id:'abnormal_personality_narcissistic', label:'自恋型人格', type:'detail', level:3, parent:'abnormal_personality', x:885, y:510, desc:'夸大、需要赞美、缺乏共情，利用他人满足自身需要' },
    { id:'abnormal_personality_avoidant', label:'回避型人格', type:'detail', level:3, parent:'abnormal_personality', x:775, y:550, desc:'社交抑制、不安全感、对否定高度敏感，渴望关系但害怕被拒' },
    { id:'abnormal_personality_dependent', label:'依赖型人格', type:'detail', level:3, parent:'abnormal_personality', x:885, y:550, desc:'过度依赖、害怕分离、顺从，缺乏独立决策能力' },
    { id:'counseling_schools', label:'咨询流派', type:'concept', level:2, parent:'counseling', x:1010, y:650, desc:'精神分析、行为主义、人本主义、认知行为四大取向' },
    { id:'counseling_schools_psychoanalysis', label:'精神分析取向', type:'detail', level:3, parent:'counseling_schools', x:955, y:690, desc:'弗洛伊德创立。核心技术：自由联想、释梦、阻抗分析、移情分析。目标：无意识冲突意识化' },
    { id:'counseling_schools_behavior', label:'行为主义取向', type:'detail', level:3, parent:'counseling_schools', x:1065, y:690, desc:'基于学习理论。技术：系统脱敏(沃尔普)、暴露疗法、厌恶疗法、行为塑造、代币法' },
    { id:'counseling_schools_cognitive', label:'认知行为取向', type:'detail', level:3, parent:'counseling_schools', x:1010, y:730, desc:'贝克认知疗法(识别改变自动思维)与埃利斯REBT(ABC理论辩驳非理性信念)' },
    { id:'counseling_principles', label:'咨询基本原则', type:'concept', level:2, parent:'counseling', x:1010, y:800, desc:'心理咨询执业的基本规范与准则' },
    { id:'counseling_principles_confidentiality', label:'保密与自愿', type:'detail', level:3, parent:'counseling_principles', x:955, y:840, desc:'保密(例外:自杀/伤人/虐待/法律要求)、自愿(来访者有权随时终止)' },
    { id:'counseling_principles_limits', label:'时间与感情限定', type:'detail', level:3, parent:'counseling_principles', x:1065, y:840, desc:'每次50-60分钟每周1-2次；不得建立咨询关系外的关系；保持中立不替来访者做决定' },
    { id:'counseling_techniques', label:'咨询基本技术', type:'concept', level:2, parent:'counseling', x:1010, y:910, desc:'参与性技术(以来访者为中心)与影响性技术(以咨询师为中心)' },
    { id:'counseling_techniques_participatory', label:'参与性技术', type:'detail', level:3, parent:'counseling_techniques', x:955, y:950, desc:'倾听、开放式/封闭式提问、内容反映(释义)、情感反映、澄清、总结——以来访者为中心' },
    { id:'counseling_techniques_influencing', label:'影响性技术', type:'detail', level:3, parent:'counseling_techniques', x:1065, y:950, desc:'解释、指导、面质、自我暴露、即时性、反馈、逻辑推论——以咨询师为中心' },
    { id:'counseling_techniques_confrontation', label:'面质技术', type:'detail', level:3, parent:'counseling_techniques', x:1010, y:990, desc:'指出来访者言行/言语间/前后叙述的矛盾，促进觉察(非对抗)，需建立在良好关系基础上' },
    { id:'measurement_other', label:'其他常用量表', type:'concept', level:2, parent:'measurement', x:85, y:1470, desc:'16PF、WAIS、BDI/BAI等常用心理测量工具' },
    { id:'measurement_16pf', label:'16PF', type:'detail', level:3, parent:'measurement_other', x:40, y:1510, desc:'卡特尔多因素问卷，16个根源特质，因素分析法编制，用于人格评估' },
    { id:'measurement_wais', label:'WAIS韦氏智力量表', type:'detail', level:3, parent:'measurement_other', x:130, y:1510, desc:'言语量表+操作量表，智商=100±15，最常用个体智力测验' },
    { id:'measurement_bdi', label:'BDI/BAI', type:'detail', level:3, parent:'measurement_other', x:85, y:1550, desc:'贝克抑郁量表与贝克焦虑量表，用于抑郁/焦虑症状 severity 评估' },
    { id:'measurement_mmpi2', label:'MMPI-2', type:'detail', level:3, parent:'measurement_other', x:85, y:1590, desc:'567题更新版，标准化改进，最广泛使用的临床人格量表' },
    { id:'measurement_analysis', label:'项目分析与施测', type:'concept', level:2, parent:'measurement', x:85, y:1630, desc:'测验项目质量分析与施测的伦理规范' },
    { id:'measurement_analysis_difficulty', label:'难度与区分度', type:'detail', level:3, parent:'measurement_analysis', x:40, y:1670, desc:'难度(通过率P值)、区分度(高分组与低分组差异D值)，D≥0.3为良好区分' },
    { id:'measurement_analysis_ethics', label:'施测伦理', type:'detail', level:3, parent:'measurement_analysis', x:130, y:1670, desc:'知情同意、环境安静、严格按指导语、结果保密、不能作为唯一诊断依据' },
    { id:'general_influencing', label:'影响性技术', type:'concept', level:2, parent:'general', x:235, y:1470, desc:'咨询师主动施加影响的技术：解释、指导、面质、自我暴露、即时性' },
    { id:'general_influencing_interpret', label:'解释与指导', type:'detail', level:3, parent:'general_influencing', x:190, y:1510, desc:'解释：从理论框架提供新理解；指导：直接告诉来访者做什么(最具影响力技术)' },
    { id:'general_influencing_exposure', label:'自我暴露与即时性', type:'detail', level:3, parent:'general_influencing', x:280, y:1510, desc:'自我暴露：适度分享个人经验；即时性：反馈"此时此地"咨询关系中的互动' },
    { id:'general_summary', label:'总结与澄清', type:'concept', level:2, parent:'general', x:235, y:1570, desc:'归纳整理来访者叙述与澄清模糊表述的技术' },
    { id:'general_summary_clarify', label:'澄清技术', type:'detail', level:3, parent:'general_summary', x:190, y:1610, desc:'帮助来访者明确模糊表述，"你的意思是……？"促进准确理解' },
    { id:'general_summary_summarize', label:'总结技术', type:'detail', level:3, parent:'general_summary', x:280, y:1610, desc:'归纳一段或多段叙述的主要内容，常用于阶段转换，帮助来访者理清思路' },
    { id:'general_summary_relationship', label:'咨询关系三要素', type:'detail', level:3, parent:'general_summary', x:235, y:1650, desc:'罗杰斯：无条件积极关注、真诚一致、共情——关系本身是疗效的核心因子' },
    { id:'cbt_restructuring', label:'认知重构', type:'concept', level:2, parent:'cbt', x:385, y:1470, desc:'识别→检验→替代三步法及下行箭头技术' },
    { id:'cbt_restructuring_steps', label:'认知重构三步法', type:'detail', level:3, parent:'cbt_restructuring', x:340, y:1510, desc:'①识别自动思维(思维记录表)②检验思维(寻找支持/反对证据)③替代思维(更平衡现实的想法)' },
    { id:'cbt_restructuring_arrow', label:'下行箭头技术', type:'detail', level:3, parent:'cbt_restructuring', x:430, y:1510, desc:'追问"如果是真的意味着什么？"层层深入揭示核心信念(关于自我/他人/世界的根本信念)' },
    { id:'cbt_behavior', label:'行为技术', type:'concept', level:2, parent:'cbt', x:385, y:1570, desc:'暴露疗法、放松训练、问题解决训练等CBT行为干预技术' },
    { id:'cbt_behavior_exposure', label:'暴露疗法', type:'detail', level:3, parent:'cbt_behavior', x:340, y:1610, desc:'系统脱敏(渐进暴露)与满灌疗法(冲击暴露)，用于恐惧症和焦虑障碍' },
    { id:'cbt_behavior_relaxation', label:'放松训练', type:'detail', level:3, parent:'cbt_behavior', x:430, y:1610, desc:'渐进性肌肉放松(交替紧张放松肌群)、腹式呼吸(激活副交感神经)' },
    { id:'cbt_behavior_solving', label:'问题解决训练', type:'detail', level:3, parent:'cbt_behavior', x:385, y:1650, desc:'定义问题→头脑风暴→选择方案→实施→评估效果' },
    { id:'cbt_structure', label:'CBT治疗结构', type:'concept', level:2, parent:'cbt', x:385, y:1700, desc:'结构化短程治疗的核心要素与贝克认知三联征' },
    { id:'cbt_structure_session', label:'会谈结构', type:'detail', level:3, parent:'cbt_structure', x:340, y:1740, desc:'检查情绪→设定议程→回顾作业→讨论议题→布置新作业→总结反馈。通常10-20次' },
    { id:'cbt_structure_triad', label:'贝克抑郁三联征', type:'detail', level:3, parent:'cbt_structure', x:430, y:1740, desc:'对自我消极("我无能")、对世界消极("不公平")、对未来消极("没希望")' },
    { id:'cbt_distortion_overgeneral', label:'过度概括', type:'detail', level:3, parent:'cbt_distortion', x:340, y:1250, desc:'一个负面事件代表所有情况："这次失败=我什么都做不好"' },
    { id:'cbt_distortion_mindreading', label:'读心术', type:'detail', level:3, parent:'cbt_distortion', x:430, y:1250, desc:'没有证据就认为他人在想不好的事' },
    { id:'cbt_distortion_should', label:'应该陈述', type:'detail', level:3, parent:'cbt_distortion', x:340, y:1290, desc:'用"应该""必须"要求自己或他人，导致内疚或愤怒' },
    { id:'cbt_distortion_emotional', label:'情绪推理', type:'detail', level:3, parent:'cbt_distortion', x:430, y:1290, desc:'用感受代替事实："我感觉蠢所以我一定蠢"' },
    { id:'humanistic_self_concept', label:'自我概念', type:'concept', level:2, parent:'humanistic', x:535, y:1370, desc:'真实自我与理想自我的一致性决定心理健康' },
    { id:'humanistic_self_real_ideal', label:'真实自我与理想自我', type:'detail', level:3, parent:'humanistic_self_concept', x:490, y:1410, desc:'真实自我(实际体验感受)与理想自我(希望成为的样子)，差距过大→心理适应不良' },
    { id:'humanistic_self_incongruence', label:'自我与经验不一致', type:'detail', level:3, parent:'humanistic_self_concept', x:580, y:1410, desc:'当自我概念与实际经验不一致时产生焦虑和防御，心理问题源于此不一致' },
    { id:'humanistic_process', label:'价值条件与治疗', type:'concept', level:2, parent:'humanistic', x:535, y:1470, desc:'价值条件的形成与消除、以人为中心疗法的治疗过程' },
    { id:'humanistic_process_conditions', label:'价值条件', type:'detail', level:3, parent:'humanistic_process', x:490, y:1510, desc:'成长中只有满足条件才获爱认可→内化为价值条件。无条件积极关注可消除价值条件' },
    { id:'humanistic_process_stages', label:'治疗五阶段', type:'detail', level:3, parent:'humanistic_process', x:580, y:1510, desc:'①表达负面感受→②咨询师共情反映→③探索自己→④自我接纳→⑤走向成长。咨询师是"陪伴者"非"专家"' },
    { id:'group_types', label:'团体类型', type:'concept', level:2, parent:'group', x:685, y:1370, desc:'教育/治疗/支持/自助四类团体及团体规模' },
    { id:'group_types_categories', label:'四种团体类型', type:'detail', level:3, parent:'group_types', x:640, y:1410, desc:'教育发展性(新生适应)、咨询治疗性(社交焦虑)、支持性(丧亲)、自助团体(AA戒酒)' },
    { id:'group_types_size', label:'团体规模', type:'detail', level:3, parent:'group_types', x:730, y:1410, desc:'一般6-12人为宜，最少5人最多15人，每次会谈90-120分钟' },
    { id:'group_leadership', label:'团体领导技术', type:'concept', level:2, parent:'group', x:685, y:1470, desc:'积极倾听、反映、澄清、连接、截断、引导等团体领导基本技术' },
    { id:'group_leadership_basic', label:'基本领导技术', type:'detail', level:3, parent:'group_leadership', x:640, y:1510, desc:'积极倾听、反映、澄清、连接(联系成员相似经历)、截断(阻止过度占用)、总结、引导' },
    { id:'group_leadership_connect', label:'连接与截断', type:'detail', level:3, parent:'group_leadership', x:730, y:1510, desc:'连接：将不同成员相似经历联系起来促进互动；截断：适时阻止某一成员过度占用时间' },
    { id:'group_special', label:'特殊团体技术', type:'concept', level:2, parent:'group', x:685, y:1570, desc:'角色扮演、心理剧、空椅技术、行为练习等团体特殊技术' },
    { id:'group_special_roleplay', label:'角色扮演与心理剧', type:'detail', level:3, parent:'group_special', x:640, y:1610, desc:'角色扮演：在团体中扮演情境中不同角色；心理剧(莫雷诺)：通过表演探索问题' },
    { id:'group_special_chair', label:'空椅技术', type:'detail', level:3, parent:'group_special', x:730, y:1610, desc:'对空椅说话(与"缺席的人"对话)，探索未完成事件和内在冲突' },
    { id:'group_special_practice', label:'行为练习', type:'detail', level:3, parent:'group_special', x:685, y:1650, desc:'在团体安全环境中练习新行为，获得反馈和支持' },
    { id:'ethics_dilemma', label:'常见伦理困境', type:'concept', level:2, parent:'ethics', x:835, y:1470, desc:'咨询实践中常见的伦理两难情境及处理原则' },
    { id:'ethics_dilemma_cases', label:'典型困境', type:'detail', level:3, parent:'ethics_dilemma', x:790, y:1510, desc:'自杀风险下保密vs安全、来访者送礼(界限vs感受)、延长咨询时间(专业界限vs需要)、小型社区多重关系' },
    { id:'ethics_dilemma_principle', label:'处理原则', type:'detail', level:3, parent:'ethics_dilemma', x:880, y:1510, desc:'核心原则：来访者利益和安全优先。识别问题→查阅守则→确定利益方→评估方案→选择行动→反思' },
    { id:'crisis_sixstep', label:'六步法模型', type:'concept', level:2, parent:'crisis', x:985, y:1370, desc:'经典六步危机干预模型：确定问题→确保安全→提供支持→考虑替代→制定计划→获得承诺' },
    { id:'crisis_sixstep_problem', label:'确定问题与确保安全', type:'detail', level:3, parent:'crisis_sixstep', x:940, y:1410, desc:'①了解危机性质和来访者状态 ②评估自杀/伤人风险，必要时住院确保安全' },
    { id:'crisis_sixstep_support', label:'支持与替代方案', type:'detail', level:3, parent:'crisis_sixstep', x:1030, y:1410, desc:'③以接纳不评判态度陪伴 ④与来访者一起探索可行的应对方式' },
    { id:'crisis_sixstep_plan', label:'计划与承诺', type:'detail', level:3, parent:'crisis_sixstep', x:985, y:1450, desc:'⑤制定具体可操作的短期计划 ⑥来访者承诺执行计划并遵守安全约定' },
    { id:'crisis_stabilization', label:'稳定化技术与转介', type:'concept', level:2, parent:'crisis', x:985, y:1520, desc:'情绪稳定化技术和转介的时机与程序' },
    { id:'crisis_stabilization_grounding', label:'Grounding技术', type:'detail', level:3, parent:'crisis_stabilization', x:940, y:1560, desc:'将注意力拉回当下：感受脚踩地面、说出周围5件物品、5-4-3-2-1感官法' },
    { id:'crisis_stabilization_safe', label:'安全岛与呼吸', type:'detail', level:3, parent:'crisis_stabilization', x:1030, y:1560, desc:'安全岛技术(想象安全的地方)、腹式呼吸(缓慢深呼吸激活副交感神经)、自我安抚(感官安抚)' },
    { id:'crisis_stabilization_referral', label:'转介', type:'detail', level:3, parent:'crisis_stabilization', x:985, y:1600, desc:'超出能力范围或高自杀/伤人风险时转介精神科或危机中心，持续支持直到交接完成' },
    { id:'exercise_biopsychosocial', label:'生物心理社会模型', type:'concept', level:2, parent:'exercise', x:1135, y:1370, desc:'从生物、心理、社会三维度系统理解来访者问题的综合框架' },
    { id:'exercise_bio_bio', label:'生物因素', type:'detail', level:3, parent:'exercise_biopsychosocial', x:1090, y:1410, desc:'遗传、脑功能、躯体疾病、药物影响等生物学因素' },
    { id:'exercise_bio_psycho', label:'心理因素', type:'detail', level:3, parent:'exercise_biopsychosocial', x:1180, y:1410, desc:'认知模式、情绪调节、应对方式、人格特征等心理因素' },
    { id:'exercise_bio_social', label:'社会因素', type:'detail', level:3, parent:'exercise_biopsychosocial', x:1135, y:1450, desc:'家庭关系、社会支持、文化背景、生活事件等社会环境因素' },
    { id:'exercise_conceptualization_cbt', label:'CBT认知概念化', type:'concept', level:2, parent:'exercise', x:1135, y:1520, desc:'贝克CBT认知概念化层次：自动思维→中间信念→核心信念' },
    { id:'exercise_conceptualization_automatic', label:'自动思维与中间信念', type:'detail', level:3, parent:'exercise_conceptualization_cbt', x:1090, y:1560, desc:'自动思维(情境中自动产生的想法)、中间信念(规则/态度/假设)' },
    { id:'exercise_conceptualization_core', label:'核心信念', type:'detail', level:3, parent:'exercise_conceptualization_cbt', x:1180, y:1560, desc:'关于自我/他人/世界的根本信念，通常在童年形成，如"我不够好""世界不安全"' },
    { id:'exercise_differentiation', label:'问题性质鉴别', type:'concept', level:2, parent:'exercise', x:1135, y:1630, desc:'一般心理问题、严重心理问题与可疑神经症的鉴别诊断' },
    { id:'exercise_diff_general', label:'一般心理问题', type:'detail', level:3, parent:'exercise_differentiation', x:1090, y:1670, desc:'现实因素引发，反应强度正常，持续1-2月，无泛化或轻微泛化，社会功能未严重影响' },
    { id:'exercise_diff_severe', label:'严重心理问题', type:'detail', level:3, parent:'exercise_differentiation', x:1180, y:1670, desc:'强烈现实因素引发，痛苦程度重，持续2月-半年，有明显泛化，社会功能一定程度受损' },
    { id:'exercise_diff_neurosis', label:'可疑神经症', type:'detail', level:3, parent:'exercise_differentiation', x:1135, y:1710, desc:'症状达神经症标准，痛苦重，功能明显受损，持续3月+，可能需转介精神科' },
  ],

  edges: [
    // ============================================================
    // 父子关系边：根→课程
    // ============================================================
    { from:'theory',   to:'intro',       type:'parent' },
    { from:'theory',   to:'social',      type:'parent' },
    { from:'theory',   to:'personality', type:'parent' },
    { from:'theory',   to:'development',type:'parent' },
    { from:'theory',   to:'abnormal',    type:'parent' },
    { from:'theory',   to:'counseling',  type:'parent' },
    { from:'practice', to:'measurement', type:'parent' },
    { from:'practice', to:'general',     type:'parent' },
    { from:'practice', to:'cbt',          type:'parent' },
    { from:'practice', to:'humanistic',  type:'parent' },
    { from:'practice', to:'group',        type:'parent' },
    { from:'practice', to:'ethics',       type:'parent' },
    { from:'practice', to:'crisis',       type:'parent' },
    { from:'practice', to:'exercise',     type:'parent' },

    // ============================================================
    // 父子关系边：课程→概念
    // ============================================================
    // intro
    { from:'intro', to:'intro_stream',     type:'parent' },
    { from:'intro', to:'intro_perception',  type:'parent' },
    { from:'intro', to:'intro_memory',      type:'parent' },
    { from:'intro', to:'intro_emotion',     type:'parent' },
    { from:'intro', to:'intro_maslow',       type:'parent' },
    // social
    { from:'social', to:'social_conformity',   type:'parent' },
    { from:'social', to:'social_attribution',  type:'parent' },
    { from:'social', to:'social_attitude',     type:'parent' },
    { from:'social', to:'social_cognition',    type:'parent' },
    { from:'social', to:'social_relationship', type:'parent' },
    // personality
    { from:'personality', to:'personality_bigfive',    type:'parent' },
    { from:'personality', to:'personality_freud',      type:'parent' },
    { from:'personality', to:'personality_eysenck',    type:'parent' },
    { from:'personality', to:'personality_assessment', type:'parent' },
    // development
    { from:'development', to:'development_piaget',    type:'parent' },
    { from:'development', to:'development_erikson',    type:'parent' },
    { from:'development', to:'development_vygotsky',  type:'parent' },
    { from:'development', to:'development_attachment',type:'parent' },
    // abnormal
    { from:'abnormal', to:'abnormal_anxiety',       type:'parent' },
    { from:'abnormal', to:'abnormal_mood',          type:'parent' },
    { from:'abnormal', to:'abnormal_personality',   type:'parent' },
    { from:'abnormal', to:'abnormal_schizophrenia', type:'parent' },
    { from:'abnormal', to:'abnormal_dsm5',          type:'parent' },
    // counseling
    { from:'counseling', to:'counseling_relationship', type:'parent' },
    { from:'counseling', to:'counseling_stages',       type:'parent' },
    { from:'counseling', to:'counseling_goals',        type:'parent' },
    { from:'counseling', to:'counseling_match',        type:'parent' },
    // measurement
    { from:'measurement', to:'measurement_reliability', type:'parent' },
    { from:'measurement', to:'measurement_scl90',       type:'parent' },
    { from:'measurement', to:'measurement_sas_sds',     type:'parent' },
    { from:'measurement', to:'measurement_mmpi',        type:'parent' },
    { from:'measurement', to:'measurement_epq',          type:'parent' },
    // general
    { from:'general', to:'general_empathy',       type:'parent' },
    { from:'general', to:'general_listening',     type:'parent' },
    { from:'general', to:'general_questioning',  type:'parent' },
    { from:'general', to:'general_confrontation',type:'parent' },
    { from:'general', to:'general_reflection',   type:'parent' },
    // cbt
    { from:'cbt', to:'cbt_abc',         type:'parent' },
    { from:'cbt', to:'cbt_automatic',   type:'parent' },
    { from:'cbt', to:'cbt_distortion',  type:'parent' },
    { from:'cbt', to:'cbt_experiment',  type:'parent' },
    { from:'cbt', to:'cbt_socratic',    type:'parent' },
    // humanistic
    { from:'humanistic', to:'humanistic_unconditional',        type:'parent' },
    { from:'humanistic', to:'humanistic_genuineness',           type:'parent' },
    { from:'humanistic', to:'humanistic_empathy',              type:'parent' },
    { from:'humanistic', to:'humanistic_self_actualization',   type:'parent' },
    // group
    { from:'group', to:'group_development',  type:'parent' },
    { from:'group', to:'group_roles',        type:'parent' },
    { from:'group', to:'group_cohesion',     type:'parent' },
    { from:'group', to:'group_evaluation',   type:'parent' },
    // ethics
    { from:'ethics', to:'ethics_confidentiality',    type:'parent' },
    { from:'ethics', to:'ethics_informed_consent',   type:'parent' },
    { from:'ethics', to:'ethics_dual',              type:'parent' },
    { from:'ethics', to:'ethics_competence',        type:'parent' },
    { from:'ethics', to:'ethics_decision',          type:'parent' },
    // crisis
    { from:'crisis', to:'crisis_assessment', type:'parent' },
    { from:'crisis', to:'crisis_saferr',     type:'parent' },
    { from:'crisis', to:'crisis_suicide',    type:'parent' },
    { from:'crisis', to:'crisis_pfa',        type:'parent' },
    // exercise
    { from:'exercise', to:'exercise_initial',          type:'parent' },
    { from:'exercise', to:'exercise_conceptualization', type:'parent' },
    { from:'exercise', to:'exercise_treatment',         type:'parent' },
    { from:'exercise', to:'exercise_evaluation',        type:'parent' },

    // ============================================================
    // 父子关系边：概念→知识点
    // ============================================================
    // intro_stream (4)
    { from:'intro_stream', to:'intro_stream_constructivism',      type:'parent' },
    { from:'intro_stream', to:'intro_stream_behaviorism',          type:'parent' },
    { from:'intro_stream', to:'intro_stream_psychoanalysis',       type:'parent' },
    { from:'intro_stream', to:'intro_stream_humanistic_cognitive', type:'parent' },
    // intro_perception (3)
    { from:'intro_perception', to:'intro_perception_threshold',    type:'parent' },
    { from:'intro_perception', to:'intro_perception_organization', type:'parent' },
    { from:'intro_perception', to:'intro_perception_depth',        type:'parent' },
    // intro_memory (3)
    { from:'intro_memory', to:'intro_memory_sensory', type:'parent' },
    { from:'intro_memory', to:'intro_memory_short',   type:'parent' },
    { from:'intro_memory', to:'intro_memory_long',    type:'parent' },
    // intro_emotion (3)
    { from:'intro_emotion', to:'intro_emotion_james',    type:'parent' },
    { from:'intro_emotion', to:'intro_emotion_cannon',   type:'parent' },
    { from:'intro_emotion', to:'intro_emotion_cognitive',type:'parent' },
    // intro_maslow (3)
    { from:'intro_maslow', to:'intro_maslow_basic',  type:'parent' },
    { from:'intro_maslow', to:'intro_maslow_growth', type:'parent' },
    { from:'intro_maslow', to:'intro_maslow_self',   type:'parent' },
    // social_conformity (2)
    { from:'social_conformity', to:'social_conformity_asch',    type:'parent' },
    { from:'social_conformity', to:'social_conformity_milgram', type:'parent' },
    // social_attribution (2)
    { from:'social_attribution', to:'social_attribution_internal',    type:'parent' },
    { from:'social_attribution', to:'social_attribution_fundamental', type:'parent' },
    // social_attitude (2)
    { from:'social_attitude', to:'social_attitude_dissonance',  type:'parent' },
    { from:'social_attitude', to:'social_attitude_persuasion', type:'parent' },
    // social_cognition (2)
    { from:'social_cognition', to:'social_cognition_stereotype', type:'parent' },
    { from:'social_cognition', to:'social_cognition_prejudice',   type:'parent' },
    // social_relationship (2)
    { from:'social_relationship', to:'social_relationship_attraction', type:'parent' },
    { from:'social_relationship', to:'social_relationship_close',      type:'parent' },
    // personality_bigfive (2)
    { from:'personality_bigfive', to:'personality_bigfive_ocean',  type:'parent' },
    { from:'personality_bigfive', to:'personality_bigfive_health', type:'parent' },
    // personality_freud (3)
    { from:'personality_freud', to:'personality_freud_id',       type:'parent' },
    { from:'personality_freud', to:'personality_freud_ego',      type:'parent' },
    { from:'personality_freud', to:'personality_freud_superego', type:'parent' },
    // personality_eysenck (3)
    { from:'personality_eysenck', to:'personality_eysenck_extraversion', type:'parent' },
    { from:'personality_eysenck', to:'personality_eysenck_neuroticism',  type:'parent' },
    { from:'personality_eysenck', to:'personality_eysenck_psychoticism', type:'parent' },
    // personality_assessment (2)
    { from:'personality_assessment', to:'personality_assessment_projective', type:'parent' },
    { from:'personality_assessment', to:'personality_assessment_self',       type:'parent' },
    // development_piaget (4)
    { from:'development_piaget', to:'development_piaget_sensorimotor',  type:'parent' },
    { from:'development_piaget', to:'development_piaget_preoperational', type:'parent' },
    { from:'development_piaget', to:'development_piaget_concrete',        type:'parent' },
    { from:'development_piaget', to:'development_piaget_formal',          type:'parent' },
    // development_erikson (3)
    { from:'development_erikson', to:'development_erikson_trust',    type:'parent' },
    { from:'development_erikson', to:'development_erikson_autonomy', type:'parent' },
    { from:'development_erikson', to:'development_erikson_identity',  type:'parent' },
    // development_vygotsky (2)
    { from:'development_vygotsky', to:'development_vygotsky_zpd',         type:'parent' },
    { from:'development_vygotsky', to:'development_vygotsky_scaffolding',  type:'parent' },
    // development_attachment (3)
    { from:'development_attachment', to:'development_attachment_secure',  type:'parent' },
    { from:'development_attachment', to:'development_attachment_anxious', type:'parent' },
    { from:'development_attachment', to:'development_attachment_avoidant',type:'parent' },
    // abnormal_anxiety (3)
    { from:'abnormal_anxiety', to:'abnormal_anxiety_gad',   type:'parent' },
    { from:'abnormal_anxiety', to:'abnormal_anxiety_panic', type:'parent' },
    { from:'abnormal_anxiety', to:'abnormal_anxiety_phobia',type:'parent' },
    // abnormal_mood (2)
    { from:'abnormal_mood', to:'abnormal_mood_depression', type:'parent' },
    { from:'abnormal_mood', to:'abnormal_mood_bipolar',    type:'parent' },
    // abnormal_personality (2)
    { from:'abnormal_personality', to:'abnormal_personality_borderline',  type:'parent' },
    { from:'abnormal_personality', to:'abnormal_personality_antisocial', type:'parent' },
    // abnormal_schizophrenia (2)
    { from:'abnormal_schizophrenia', to:'abnormal_schiz_positive', type:'parent' },
    { from:'abnormal_schizophrenia', to:'abnormal_schiz_negative',type:'parent' },
    // abnormal_dsm5 (2)
    { from:'abnormal_dsm5', to:'abnormal_dsm5_axis',     type:'parent' },
    { from:'abnormal_dsm5', to:'abnormal_dsm5_category', type:'parent' },
    // counseling_relationship (2)
    { from:'counseling_relationship', to:'counseling_relationship_alliance', type:'parent' },
    { from:'counseling_relationship', to:'counseling_relationship_factors',  type:'parent' },
    // counseling_stages (3)
    { from:'counseling_stages', to:'counseling_stages_initial', type:'parent' },
    { from:'counseling_stages', to:'counseling_stages_work',     type:'parent' },
    { from:'counseling_stages', to:'counseling_stages_end',      type:'parent' },
    // counseling_goals (2)
    { from:'counseling_goals', to:'counseling_goals_short', type:'parent' },
    { from:'counseling_goals', to:'counseling_goals_long',  type:'parent' },
    // counseling_match (2)
    { from:'counseling_match', to:'counseling_match_theory',      type:'parent' },
    { from:'counseling_match', to:'counseling_match_personality', type:'parent' },
    // measurement_reliability (2)
    { from:'measurement_reliability', to:'measurement_reliability_internal', type:'parent' },
    { from:'measurement_reliability', to:'measurement_reliability_validity', type:'parent' },
    // measurement_scl90 (2)
    { from:'measurement_scl90', to:'measurement_scl90_items',   type:'parent' },
    { from:'measurement_scl90', to:'measurement_scl90_factors', type:'parent' },
    // measurement_sas_sds (2)
    { from:'measurement_sas_sds', to:'measurement_sas', type:'parent' },
    { from:'measurement_sas_sds', to:'measurement_sds', type:'parent' },
    // measurement_mmpi (2)
    { from:'measurement_mmpi', to:'measurement_mmpi_intro',  type:'parent' },
    { from:'measurement_mmpi', to:'measurement_mmpi_scales', type:'parent' },
    // measurement_epq (2)
    { from:'measurement_epq', to:'measurement_epq_intro',       type:'parent' },
    { from:'measurement_epq', to:'measurement_epq_dimensions', type:'parent' },
    // general_empathy (2)
    { from:'general_empathy', to:'general_empathy_primary',  type:'parent' },
    { from:'general_empathy', to:'general_empathy_advanced', type:'parent' },
    // general_listening (2)
    { from:'general_listening', to:'general_listening_active',   type:'parent' },
    { from:'general_listening', to:'general_listening_nonverbal',type:'parent' },
    // general_questioning (2)
    { from:'general_questioning', to:'general_questioning_open',  type:'parent' },
    { from:'general_questioning', to:'general_questioning_closed', type:'parent' },
    // general_confrontation (2)
    { from:'general_confrontation', to:'general_confrontation_contradiction', type:'parent' },
    { from:'general_confrontation', to:'general_confrontation_limit',          type:'parent' },
    // general_reflection (2)
    { from:'general_reflection', to:'general_reflection_emotion', type:'parent' },
    { from:'general_reflection', to:'general_reflection_content', type:'parent' },
    // cbt_abc (3)
    { from:'cbt_abc', to:'cbt_abc_event',       type:'parent' },
    { from:'cbt_abc', to:'cbt_abc_belief',       type:'parent' },
    { from:'cbt_abc', to:'cbt_abc_consequence',  type:'parent' },
    // cbt_automatic (2)
    { from:'cbt_automatic', to:'cbt_automatic_negative',    type:'parent' },
    { from:'cbt_automatic', to:'cbt_automatic_intervention', type:'parent' },
    // cbt_distortion (2)
    { from:'cbt_distortion', to:'cbt_distortion_catastrophe',   type:'parent' },
    { from:'cbt_distortion', to:'cbt_distortion_dichotomous',   type:'parent' },
    // cbt_experiment (2)
    { from:'cbt_experiment', to:'cbt_experiment_hypothesis',  type:'parent' },
    { from:'cbt_experiment', to:'cbt_experiment_activation',  type:'parent' },
    // cbt_socratic (2)
    { from:'cbt_socratic', to:'cbt_socratic_questioning',  type:'parent' },
    { from:'cbt_socratic', to:'cbt_socratic_guided',        type:'parent' },
    // humanistic_unconditional (2)
    { from:'humanistic_unconditional', to:'humanistic_unconditional_acceptance', type:'parent' },
    { from:'humanistic_unconditional', to:'humanistic_unconditional_positive',   type:'parent' },
    // humanistic_genuineness (2)
    { from:'humanistic_genuineness', to:'humanistic_genuineness_authenticity', type:'parent' },
    { from:'humanistic_genuineness', to:'humanistic_genuineness_congruence',    type:'parent' },
    // humanistic_empathy (2)
    { from:'humanistic_empathy', to:'humanistic_empathy_perspective', type:'parent' },
    { from:'humanistic_empathy', to:'humanistic_empathy_resonance',   type:'parent' },
    // humanistic_self_actualization (2)
    { from:'humanistic_self_actualization', to:'humanistic_self_potential', type:'parent' },
    { from:'humanistic_self_actualization', to:'humanistic_self_growth',    type:'parent' },
    // group_development (3)
    { from:'group_development', to:'group_development_initial', type:'parent' },
    { from:'group_development', to:'group_development_work',   type:'parent' },
    { from:'group_development', to:'group_development_end',     type:'parent' },
    // group_roles (2)
    { from:'group_roles', to:'group_roles_leader',  type:'parent' },
    { from:'group_roles', to:'group_roles_member',  type:'parent' },
    // group_cohesion (2)
    { from:'group_cohesion', to:'group_cohesion_sense', type:'parent' },
    { from:'group_cohesion', to:'group_cohesion_norm',  type:'parent' },
    // group_evaluation (2)
    { from:'group_evaluation', to:'group_evaluation_process', type:'parent' },
    { from:'group_evaluation', to:'group_evaluation_outcome',type:'parent' },
    // ethics_confidentiality (2)
    { from:'ethics_confidentiality', to:'ethics_confidentiality_exception', type:'parent' },
    { from:'ethics_confidentiality', to:'ethics_confidentiality_limit',          type:'parent' },
    // ethics_informed_consent (2)
    { from:'ethics_informed_consent', to:'ethics_consent_disclosure', type:'parent' },
    { from:'ethics_informed_consent', to:'ethics_consent_voluntary',  type:'parent' },
    // ethics_dual (2)
    { from:'ethics_dual', to:'ethics_dual_boundary',    type:'parent' },
    { from:'ethics_dual', to:'ethics_dual_restriction', type:'parent' },
    // ethics_competence (2)
    { from:'ethics_competence', to:'ethics_competence_training',  type:'parent' },
    { from:'ethics_competence', to:'ethics_competence_boundary',  type:'parent' },
    // ethics_decision (2)
    { from:'ethics_decision', to:'ethics_decision_code',  type:'parent' },
    { from:'ethics_decision', to:'ethics_decision_model', type:'parent' },
    // crisis_assessment (2)
    { from:'crisis_assessment', to:'crisis_assessment_type', type:'parent' },
    { from:'crisis_assessment', to:'crisis_assessment_risk', type:'parent' },
    // crisis_saferr (2)
    { from:'crisis_saferr', to:'crisis_saferr_stabilize',   type:'parent' },
    { from:'crisis_saferr', to:'crisis_saferr_acknowledge', type:'parent' },
    // crisis_suicide (2)
    { from:'crisis_suicide', to:'crisis_suicide_ideation', type:'parent' },
    { from:'crisis_suicide', to:'crisis_suicide_plan',     type:'parent' },
    // crisis_pfa (2)
    { from:'crisis_pfa', to:'crisis_pfa_principle', type:'parent' },
    { from:'crisis_pfa', to:'crisis_pfa_safety',    type:'parent' },
    // exercise_initial (2)
    { from:'exercise_initial', to:'exercise_initial_info',    type:'parent' },
    { from:'exercise_initial', to:'exercise_initial_rapport', type:'parent' },
    // exercise_conceptualization (2)
    { from:'exercise_conceptualization', to:'exercise_concept_problem',    type:'parent' },
    { from:'exercise_conceptualization', to:'exercise_concept_hypothesis', type:'parent' },
    // exercise_treatment (2)
    { from:'exercise_treatment', to:'exercise_treatment_goal',     type:'parent' },
    { from:'exercise_treatment', to:'exercise_treatment_strategy', type:'parent' },
    // exercise_evaluation (2)
    { from:'exercise_evaluation', to:'exercise_evaluation_prepost', type:'parent' },
    { from:'exercise_evaluation', to:'exercise_evaluation_outcome', type:'parent' },

    // ============================================================
    // 跨课程关联关系边（related）
    // ============================================================
    { from:'intro_stream_psychoanalysis',        to:'personality_freud_id',              type:'related', label:'精神分析→人格结构理论' },
    { from:'intro_maslow_self',                  to:'humanistic_self_actualization',      type:'related', label:'需要层次→自我实现' },
    { from:'development_attachment_secure',      to:'counseling_relationship_alliance',   type:'related', label:'安全依恋→工作联盟' },
    { from:'abnormal_anxiety_gad',               to:'measurement_sas',                    type:'related', label:'焦虑障碍→SAS评估' },
    { from:'abnormal_mood_depression',           to:'measurement_sds',                    type:'related', label:'抑郁发作→SDS评估' },
    { from:'counseling_relationship_alliance',   to:'general_empathy_primary',            type:'related', label:'工作联盟→共情技术' },
    { from:'counseling_stages_initial',          to:'exercise_initial',                   type:'related', label:'咨询初始阶段→初始访谈' },
    { from:'counseling_goals_long',              to:'exercise_treatment',                 type:'related', label:'长期目标→治疗计划' },
    { from:'measurement_mmpi_scales',            to:'personality_assessment_self',        type:'related', label:'MMPI→自陈量表' },
    { from:'measurement_epq_dimensions',         to:'personality_eysenck_extraversion',   type:'related', label:'EPQ→艾森克维度' },
    { from:'general_empathy_advanced',            to:'humanistic_empathy_perspective',     type:'related', label:'高级共情→共情理解' },
    { from:'cbt_abc_belief',                     to:'counseling_goals',                   type:'related', label:'信念重构→咨询目标' },
    { from:'cbt_automatic_negative',             to:'abnormal_mood_depression',           type:'related', label:'负性自动思维→抑郁' },
    { from:'group_cohesion_sense',               to:'counseling_relationship_alliance',   type:'related', label:'团体凝聚→工作联盟' },
    { from:'crisis_suicide_plan',                to:'abnormal_mood_depression',           type:'related', label:'自杀风险→心境障碍' },
    { from:'ethics_dual_boundary',              to:'counseling_match_personality',        type:'related', label:'双重关系→咨访匹配' },
    { from:'cbt_distortion_catastrophe',         to:'counseling_goals_short',             type:'related', label:'认知扭曲→短期目标' },
    { from:'intro_emotion_cognitive',            to:'general_empathy_advanced',            type:'related', label:'情绪认知理论→共情' },

    // ============================================================
    // 扩展边：新增父子关系与跨课程关联
    // ============================================================
    { from:'intro', to:'intro_physiology', type:'parent' },
    { from:'intro_physiology', to:'intro_physiology_cortex', type:'parent' },
    { from:'intro_physiology', to:'intro_physiology_lateral', type:'parent' },
    { from:'intro', to:'intro_thinking', type:'parent' },
    { from:'intro_thinking', to:'intro_thinking_feature', type:'parent' },
    { from:'intro_thinking', to:'intro_thinking_problem', type:'parent' },
    { from:'intro', to:'intro_will', type:'parent' },
    { from:'intro_will', to:'intro_will_quality', type:'parent' },
    { from:'intro', to:'intro_temperament', type:'parent' },
    { from:'intro_temperament', to:'intro_temperament_type', type:'parent' },
    { from:'intro_temperament', to:'intro_temperament_character', type:'parent' },
    { from:'intro_memory', to:'intro_memory_forgetting', type:'parent' },
    { from:'intro_memory', to:'intro_memory_interference', type:'parent' },
    { from:'social', to:'social_self', type:'parent' },
    { from:'social_self', to:'social_self_socialization', type:'parent' },
    { from:'social_self', to:'social_self_concept', type:'parent' },
    { from:'social_self', to:'social_self_efficacy', type:'parent' },
    { from:'social', to:'social_group', type:'parent' },
    { from:'social_group', to:'social_group_facilitation', type:'parent' },
    { from:'social_group', to:'social_group_lazy', type:'parent' },
    { from:'social_group', to:'social_group_deindividuation', type:'parent' },
    { from:'social', to:'social_motivation', type:'parent' },
    { from:'social_motivation', to:'social_motivation_types', type:'parent' },
    { from:'social_motivation', to:'social_motivation_emotion', type:'parent' },
    { from:'social_cognition', to:'social_cognition_impression', type:'parent' },
    { from:'social_attribution', to:'social_attribution_kelley', type:'parent' },
    { from:'social_attribution', to:'social_attribution_self', type:'parent' },
    { from:'social_conformity', to:'social_conformity_compliance', type:'parent' },
    { from:'social_relationship', to:'social_relationship_schutz', type:'parent' },
    { from:'personality', to:'personality_defense', type:'parent' },
    { from:'personality_defense', to:'personality_defense_repression', type:'parent' },
    { from:'personality_defense', to:'personality_defense_rationalization', type:'parent' },
    { from:'personality_defense', to:'personality_defense_sublimation', type:'parent' },
    { from:'personality', to:'personality_psychosexual', type:'parent' },
    { from:'personality_psychosexual', to:'personality_psychosexual_oral', type:'parent' },
    { from:'personality_psychosexual', to:'personality_psychosexual_phallic', type:'parent' },
    { from:'personality_psychosexual', to:'personality_psychosexual_latency', type:'parent' },
    { from:'personality', to:'personality_allport_cattell', type:'parent' },
    { from:'personality_allport_cattell', to:'personality_allport', type:'parent' },
    { from:'personality_allport_cattell', to:'personality_cattell', type:'parent' },
    { from:'personality', to:'personality_behavioral', type:'parent' },
    { from:'personality_behavioral', to:'personality_behavioral_skinner', type:'parent' },
    { from:'personality_behavioral', to:'personality_behavioral_bandura', type:'parent' },
    { from:'personality', to:'personality_rogers', type:'parent' },
    { from:'personality_rogers', to:'personality_rogers_self', type:'parent' },
    { from:'personality_rogers', to:'personality_rogers_worth', type:'parent' },
    { from:'development', to:'development_language', type:'parent' },
    { from:'development_language', to:'development_language_stages', type:'parent' },
    { from:'development_language', to:'development_language_theory', type:'parent' },
    { from:'development', to:'development_identity', type:'parent' },
    { from:'development_identity', to:'development_identity_marcia', type:'parent' },
    { from:'development', to:'development_intelligence', type:'parent' },
    { from:'development_intelligence', to:'development_intelligence_crystal', type:'parent' },
    { from:'development_intelligence', to:'development_intelligence_method', type:'parent' },
    { from:'development_piaget', to:'development_piaget_concepts', type:'parent' },
    { from:'development_erikson', to:'development_erikson_initiative', type:'parent' },
    { from:'development_erikson', to:'development_erikson_industry', type:'parent' },
    { from:'development_erikson', to:'development_erikson_intimacy', type:'parent' },
    { from:'development_erikson', to:'development_erikson_generativity', type:'parent' },
    { from:'development_erikson', to:'development_erikson_integrity', type:'parent' },
    { from:'abnormal', to:'abnormal_criteria', type:'parent' },
    { from:'abnormal_criteria', to:'abnormal_criteria_principles', type:'parent' },
    { from:'abnormal_criteria', to:'abnormal_criteria_level', type:'parent' },
    { from:'abnormal', to:'abnormal_ocd', type:'parent' },
    { from:'abnormal_ocd', to:'abnormal_ocd_obsession', type:'parent' },
    { from:'abnormal_ocd', to:'abnormal_ocd_compulsion', type:'parent' },
    { from:'abnormal_personality', to:'abnormal_personality_paranoid', type:'parent' },
    { from:'abnormal_personality', to:'abnormal_personality_narcissistic', type:'parent' },
    { from:'abnormal_personality', to:'abnormal_personality_avoidant', type:'parent' },
    { from:'abnormal_personality', to:'abnormal_personality_dependent', type:'parent' },
    { from:'counseling', to:'counseling_schools', type:'parent' },
    { from:'counseling_schools', to:'counseling_schools_psychoanalysis', type:'parent' },
    { from:'counseling_schools', to:'counseling_schools_behavior', type:'parent' },
    { from:'counseling_schools', to:'counseling_schools_cognitive', type:'parent' },
    { from:'counseling', to:'counseling_principles', type:'parent' },
    { from:'counseling_principles', to:'counseling_principles_confidentiality', type:'parent' },
    { from:'counseling_principles', to:'counseling_principles_limits', type:'parent' },
    { from:'counseling', to:'counseling_techniques', type:'parent' },
    { from:'counseling_techniques', to:'counseling_techniques_participatory', type:'parent' },
    { from:'counseling_techniques', to:'counseling_techniques_influencing', type:'parent' },
    { from:'counseling_techniques', to:'counseling_techniques_confrontation', type:'parent' },
    { from:'measurement', to:'measurement_other', type:'parent' },
    { from:'measurement_other', to:'measurement_16pf', type:'parent' },
    { from:'measurement_other', to:'measurement_wais', type:'parent' },
    { from:'measurement_other', to:'measurement_bdi', type:'parent' },
    { from:'measurement_other', to:'measurement_mmpi2', type:'parent' },
    { from:'measurement', to:'measurement_analysis', type:'parent' },
    { from:'measurement_analysis', to:'measurement_analysis_difficulty', type:'parent' },
    { from:'measurement_analysis', to:'measurement_analysis_ethics', type:'parent' },
    { from:'general', to:'general_influencing', type:'parent' },
    { from:'general_influencing', to:'general_influencing_interpret', type:'parent' },
    { from:'general_influencing', to:'general_influencing_exposure', type:'parent' },
    { from:'general', to:'general_summary', type:'parent' },
    { from:'general_summary', to:'general_summary_clarify', type:'parent' },
    { from:'general_summary', to:'general_summary_summarize', type:'parent' },
    { from:'general_summary', to:'general_summary_relationship', type:'parent' },
    { from:'cbt', to:'cbt_restructuring', type:'parent' },
    { from:'cbt_restructuring', to:'cbt_restructuring_steps', type:'parent' },
    { from:'cbt_restructuring', to:'cbt_restructuring_arrow', type:'parent' },
    { from:'cbt', to:'cbt_behavior', type:'parent' },
    { from:'cbt_behavior', to:'cbt_behavior_exposure', type:'parent' },
    { from:'cbt_behavior', to:'cbt_behavior_relaxation', type:'parent' },
    { from:'cbt_behavior', to:'cbt_behavior_solving', type:'parent' },
    { from:'cbt', to:'cbt_structure', type:'parent' },
    { from:'cbt_structure', to:'cbt_structure_session', type:'parent' },
    { from:'cbt_structure', to:'cbt_structure_triad', type:'parent' },
    { from:'cbt_distortion', to:'cbt_distortion_overgeneral', type:'parent' },
    { from:'cbt_distortion', to:'cbt_distortion_mindreading', type:'parent' },
    { from:'cbt_distortion', to:'cbt_distortion_should', type:'parent' },
    { from:'cbt_distortion', to:'cbt_distortion_emotional', type:'parent' },
    { from:'humanistic', to:'humanistic_self_concept', type:'parent' },
    { from:'humanistic_self_concept', to:'humanistic_self_real_ideal', type:'parent' },
    { from:'humanistic_self_concept', to:'humanistic_self_incongruence', type:'parent' },
    { from:'humanistic', to:'humanistic_process', type:'parent' },
    { from:'humanistic_process', to:'humanistic_process_conditions', type:'parent' },
    { from:'humanistic_process', to:'humanistic_process_stages', type:'parent' },
    { from:'group', to:'group_types', type:'parent' },
    { from:'group_types', to:'group_types_categories', type:'parent' },
    { from:'group_types', to:'group_types_size', type:'parent' },
    { from:'group', to:'group_leadership', type:'parent' },
    { from:'group_leadership', to:'group_leadership_basic', type:'parent' },
    { from:'group_leadership', to:'group_leadership_connect', type:'parent' },
    { from:'group', to:'group_special', type:'parent' },
    { from:'group_special', to:'group_special_roleplay', type:'parent' },
    { from:'group_special', to:'group_special_chair', type:'parent' },
    { from:'group_special', to:'group_special_practice', type:'parent' },
    { from:'ethics', to:'ethics_dilemma', type:'parent' },
    { from:'ethics_dilemma', to:'ethics_dilemma_cases', type:'parent' },
    { from:'ethics_dilemma', to:'ethics_dilemma_principle', type:'parent' },
    { from:'crisis', to:'crisis_sixstep', type:'parent' },
    { from:'crisis_sixstep', to:'crisis_sixstep_problem', type:'parent' },
    { from:'crisis_sixstep', to:'crisis_sixstep_support', type:'parent' },
    { from:'crisis_sixstep', to:'crisis_sixstep_plan', type:'parent' },
    { from:'crisis', to:'crisis_stabilization', type:'parent' },
    { from:'crisis_stabilization', to:'crisis_stabilization_grounding', type:'parent' },
    { from:'crisis_stabilization', to:'crisis_stabilization_safe', type:'parent' },
    { from:'crisis_stabilization', to:'crisis_stabilization_referral', type:'parent' },
    { from:'exercise', to:'exercise_biopsychosocial', type:'parent' },
    { from:'exercise_biopsychosocial', to:'exercise_bio_bio', type:'parent' },
    { from:'exercise_biopsychosocial', to:'exercise_bio_psycho', type:'parent' },
    { from:'exercise_biopsychosocial', to:'exercise_bio_social', type:'parent' },
    { from:'exercise', to:'exercise_conceptualization_cbt', type:'parent' },
    { from:'exercise_conceptualization_cbt', to:'exercise_conceptualization_automatic', type:'parent' },
    { from:'exercise_conceptualization_cbt', to:'exercise_conceptualization_core', type:'parent' },
    { from:'exercise', to:'exercise_differentiation', type:'parent' },
    { from:'exercise_differentiation', to:'exercise_diff_general', type:'parent' },
    { from:'exercise_differentiation', to:'exercise_diff_severe', type:'parent' },
    { from:'exercise_differentiation', to:'exercise_diff_neurosis', type:'parent' },
    { from:'intro_physiology_lateral', to:'personality_freud_ego', type:'related', label:'大脑功能→自我调节' },
    { from:'intro_thinking_problem', to:'cbt_automatic_negative', type:'related', label:'问题解决→自动思维' },
    { from:'intro_temperament_type', to:'measurement_epq_dimensions', type:'related', label:'气质类型→EPQ测量' },
    { from:'intro_will_quality', to:'cbt_experiment_activation', type:'related', label:'意志品质→行为激活' },
    { from:'intro_memory_forgetting', to:'intro_memory_long', type:'related', label:'遗忘规律→长时记忆' },
    { from:'social_self_efficacy', to:'personality_behavioral_bandura', type:'related', label:'自我效能感→社会学习' },
    { from:'social_self_concept', to:'personality_rogers_self', type:'related', label:'社会自我→罗杰斯自我' },
    { from:'social_self_concept', to:'humanistic_self_real_ideal', type:'related', label:'自我概念→真实/理想自我' },
    { from:'social_group_deindividuation', to:'group_cohesion_sense', type:'related', label:'去个性化→团体凝聚' },
    { from:'personality_defense_repression', to:'counseling_schools_psychoanalysis', type:'related', label:'防御机制→精神分析技术' },
    { from:'personality_psychosexual_phallic', to:'development_erikson_trust', type:'related', label:'弗洛伊德→埃里克森发展' },
    { from:'personality_allport', to:'measurement_16pf', type:'related', label:'特质理论→16PF测量' },
    { from:'personality_cattell', to:'measurement_16pf', type:'related', label:'根源特质→16PF量表' },
    { from:'personality_rogers_worth', to:'humanistic_process_conditions', type:'related', label:'价值条件→人本主义治疗' },
    { from:'development_identity_marcia', to:'development_erikson_identity', type:'related', label:'玛西亚→埃里克森同一性' },
    { from:'abnormal_criteria_level', to:'exercise_diff_general', type:'related', label:'心理问题分级→实务鉴别' },
    { from:'abnormal_ocd_compulsion', to:'cbt_distortion_overgeneral', type:'related', label:'强迫行为→认知歪曲' },
    { from:'counseling_schools_cognitive', to:'cbt_abc_belief', type:'related', label:'认知取向→ABC理论' },
    { from:'counseling_techniques_participatory', to:'general_listening_active', type:'related', label:'参与性技术→积极倾听' },
    { from:'counseling_techniques_confrontation', to:'general_confrontation_contradiction', type:'related', label:'面质技术→矛盾面质' },
    { from:'measurement_16pf', to:'personality_assessment_self', type:'related', label:'16PF→自陈量表' },
    { from:'measurement_wais', to:'measurement_reliability_validity', type:'related', label:'韦氏→效标效度' },
    { from:'general_influencing_interpret', to:'cbt_socratic_questioning', type:'related', label:'解释指导→苏格拉底提问' },
    { from:'cbt_restructuring_steps', to:'cbt_automatic_intervention', type:'related', label:'认知重构→认知干预' },
    { from:'cbt_behavior_exposure', to:'abnormal_anxiety_phobia', type:'related', label:'暴露疗法→恐惧症治疗' },
    { from:'cbt_structure_triad', to:'abnormal_mood_depression', type:'related', label:'认知三联征→抑郁症' },
    { from:'humanistic_process_conditions', to:'humanistic_unconditional_acceptance', type:'related', label:'价值条件→无条件接纳' },
    { from:'group_types_categories', to:'group_development_initial', type:'related', label:'团体类型→发展阶段' },
    { from:'group_leadership_basic', to:'general_listening_active', type:'related', label:'团体领导→积极倾听' },
    { from:'group_special_chair', to:'humanistic_empathy_perspective', type:'related', label:'空椅技术→共情理解' },
    { from:'crisis_sixstep_problem', to:'crisis_saferr_stabilize', type:'related', label:'六步法→SAFER-R稳定化' },
    { from:'crisis_stabilization_grounding', to:'crisis_assessment_risk', type:'related', label:'稳定化→危险评估' },
    { from:'exercise_bio_psycho', to:'exercise_concept_hypothesis', type:'related', label:'心理因素→假设形成' },
    { from:'exercise_conceptualization_core', to:'cbt_restructuring_arrow', type:'related', label:'核心信念→下行箭头技术' },
    { from:'exercise_diff_severe', to:'crisis_suicide_ideation', type:'related', label:'严重心理问题→自杀风险' },
  ]
};
