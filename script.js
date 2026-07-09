const storageKey = 'run-tree-state-v1';

const initialState = {
  records: [
    {
      date: '6/30',
      distance: 1200,
      condition: 4,
      pb: true,
      summary: 'フォームが安定し、最後の100mが伸びた。',
    },
    {
      date: '7/1',
      distance: 900,
      condition: 3,
      pb: false,
      summary: '短い距離でもリズムを整えられた。',
    },
  ],
  chatStep: 0,
  chatMessages: [],
  teacherComments: [
    { student: '佐藤', status: '好調', comment: '今日のフォームを維持できていた。' },
    { student: '伊藤', status: '要注意', comment: '疲労が見えたので軽めの回復練習に。' },
  ],
};

const prompts = [
  '今日の練習で一番意識したことは？',
  'どの区間で調子が良かった？',
  'どこがまだ難しかった？',
  '次の練習で直したいことは？',
  '今日の目標達成度はどのくらい？',
  '体調はどうでしたか？',
  'モチベーションを保つコツは？',
  '次回の目標を一つ決めよう。',
];

const aiResponses = [
  '良い意識です。フォームの安定がそのままタイムにつながります。',
  'その区間の感覚は大事です。次は集中をもう一段高めましょう。',
  '課題が見えたので、次回はペース配分を意識してみてください。',
  '改善点がはっきりしました。短い練習でも反復すると伸びます。',
  '目標達成に近づいているので、今日の記録を次回に活かすと良いです。',
  '体調の変化は大切です。回復を優先しながら練習の質を上げましょう。',
  'モチベーションの維持は、達成した小さな変化を積み上げることから始まります。',
  '次回は「100mで一歩だけ前に出す」を目標にしてみてください。',
];

const state = loadState();

const elements = {
  todayDistance: document.getElementById('todayDistance'),
  reflectionCount: document.getElementById('reflectionCount'),
  treeStage: document.getElementById('treeStage'),
  chatMessages: document.getElementById('chatMessages'),
  currentPrompt: document.getElementById('currentPrompt'),
  latestSummary: document.getElementById('latestSummary'),
  chatProgress: document.getElementById('chatProgress'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),
  distanceRange: document.getElementById('distanceRange'),
  conditionRange: document.getElementById('conditionRange'),
  distanceValue: document.getElementById('distanceValue'),
  conditionValue: document.getElementById('conditionValue'),
  pbToggle: document.getElementById('pbToggle'),
  saveRecordBtn: document.getElementById('saveRecordBtn'),
  treeVisual: document.getElementById('treeVisual'),
  treeText: document.getElementById('treeText'),
  historyList: document.getElementById('historyList'),
  teacherFeed: document.getElementById('teacherFeed'),
};

init();

function init() {
  bindEvents();
  renderRecordSummary();
  renderChat();
  renderHistory();
  renderTeacherFeed();
  renderTree();
}

function bindEvents() {
  elements.chatForm.addEventListener('submit', handleChatSubmit);
  elements.distanceRange.addEventListener('input', updateDistanceLabel);
  elements.conditionRange.addEventListener('input', updateConditionLabel);
  elements.saveRecordBtn.addEventListener('click', saveRecord);
}

function handleChatSubmit(event) {
  event.preventDefault();
  const value = elements.chatInput.value.trim();
  if (!value) return;

  const step = state.chatStep;
  state.chatMessages.push({ role: 'user', text: value });
  state.chatMessages.push({ role: 'ai', text: aiResponses[step] });
  state.chatStep += 1;

  if (state.chatStep >= prompts.length) {
    const summary = `今日の練習では「${value}」と振り返り、次回は${aiResponses[state.chatStep - 1].slice(0, 12)}...`;
    state.chatMessages.push({ role: 'ai', text: `振り返りを保存しました。${summary}` });
    state.latestSummary = summary;
  }

  elements.chatInput.value = '';
  saveState();
  renderChat();
}

function saveRecord() {
  const distance = Number(elements.distanceRange.value);
  const condition = Number(elements.conditionRange.value);
  const pb = elements.pbToggle.checked;
  const summary = pb
    ? '自己ベスト更新! すごい伸びです。'
    : '練習の質が高まっている印象です。';

  state.records.unshift({
    date: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
    distance,
    condition,
    pb,
    summary,
  });

  if (pb) {
    triggerSparkles();
  }

  saveState();
  renderRecordSummary();
  renderHistory();
  renderTree();
}

function renderRecordSummary() {
  const latest = state.records[0];
  elements.todayDistance.textContent = `${latest?.distance ?? 0} m`;
  elements.reflectionCount.textContent = `${state.chatStep}回`;
  const stage = getTreeStage();
  elements.treeStage.textContent = stage.label;
}

function renderChat() {
  elements.chatMessages.innerHTML = '';
  state.chatMessages.forEach((message) => {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${message.role}`;
    bubble.textContent = message.text;
    elements.chatMessages.appendChild(bubble);
  });

  if (state.chatStep < prompts.length) {
    elements.currentPrompt.textContent = prompts[state.chatStep];
  } else {
    elements.currentPrompt.textContent = '振り返りは完了しました。次回に向けた目標を立てましょう。';
  }

  elements.chatProgress.textContent = `${Math.min(state.chatStep + 1, prompts.length)} / ${prompts.length}`;
  elements.latestSummary.textContent = state.latestSummary || 'まだ振り返りがありません。';
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function renderHistory() {
  elements.historyList.innerHTML = '';
  state.records.forEach((record) => {
    const item = document.createElement('article');
    item.className = 'history-item';
    item.innerHTML = `
      <h4>${record.date} · ${record.distance}m</h4>
      <p>コンディション: ${getConditionLabel(record.condition)}</p>
      <p>${record.summary}</p>
    `;
    elements.historyList.appendChild(item);
  });
}

function renderTeacherFeed() {
  elements.teacherFeed.innerHTML = '';
  state.teacherComments.forEach((item) => {
    const panel = document.createElement('div');
    panel.className = 'teacher-item';
    panel.innerHTML = `
      <strong>${item.student}</strong>
      <p>${item.status}</p>
      <p>${item.comment}</p>
      <div class="comment-btns">
        <button data-comment="いい調子です。">励ます</button>
        <button data-comment="次は回復重視で。">アドバイス</button>
      </div>
    `;
    panel.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        item.comment = button.dataset.comment;
        saveState();
        renderTeacherFeed();
      });
    });
    elements.teacherFeed.appendChild(panel);
  });
}

function renderTree() {
  const stage = getTreeStage();
  let icon = '🌱';
  if (stage.level >= 3) icon = '🌳';
  if (stage.level >= 4) icon = '🌲';
  elements.treeVisual.innerHTML = icon;
  elements.treeVisual.classList.remove('grow');
  void elements.treeVisual.offsetWidth;
  elements.treeVisual.classList.add('grow');
  elements.treeText.textContent = `${stage.label}まで育ちました。練習を続けるとさらに成長します。`;
}

function getTreeStage() {
  const total = state.records.length;
  const reflection = state.chatStep;
  const pbCount = state.records.filter((record) => record.pb).length;
  const score = Math.min(100, total * 18 + reflection * 8 + pbCount * 16);

  if (score < 30) return { label: '芽', level: 1 };
  if (score < 60) return { label: '小さな苗', level: 2 };
  if (score < 85) return { label: '成長中', level: 3 };
  return { label: '大木', level: 4 };
}

function updateDistanceLabel() {
  elements.distanceValue.textContent = `${elements.distanceRange.value} m`;
}

function updateConditionLabel() {
  elements.conditionValue.textContent = getConditionLabel(Number(elements.conditionRange.value));
}

function getConditionLabel(value) {
  const map = {
    1: 'かなり疲れ気味',
    2: '少し疲れ',
    3: '普通',
    4: 'かなり良い',
    5: '最高',
  };
  return map[value] || '普通';
}

function triggerSparkles() {
  const layer = document.createElement('div');
  layer.className = 'sparkle';
  for (let i = 0; i < 20; i += 1) {
    const piece = document.createElement('span');
    piece.style.top = `${Math.random() * 100}%`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.2}s`;
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 900);
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return structuredClone(initialState);
    const parsed = JSON.parse(saved);
    return {
      ...structuredClone(initialState),
      ...parsed,
      records: parsed.records || initialState.records,
      teacherComments: parsed.teacherComments || initialState.teacherComments,
      chatMessages: parsed.chatMessages || [],
      chatStep: parsed.chatStep || 0,
      latestSummary: parsed.latestSummary || '',
    };
  } catch (error) {
    console.error(error);
    return structuredClone(initialState);
  }
}

updateDistanceLabel();
updateConditionLabel();
