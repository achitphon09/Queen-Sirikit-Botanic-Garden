<script>
  import { onMount } from 'svelte';
  import {
    Search,
    MapPin,
    Home,
    LayoutGrid,
    Trophy,
    Flame,
    Star,
    Sparkles,
    Check,
    X,
    Undo2,
    RotateCcw,
    Sprout,
    Leaf,
    Sun,
    Compass,
    ArrowLeft,
    ArrowRight,
    ZoomIn,
    ZoomOut,
    RefreshCw,
    ListOrdered,
    ArrowLeftRight,
    Puzzle,
    Navigation
  } from 'lucide-svelte';
  import confetti from 'canvas-confetti';

  const API_URL = 'http://localhost:3001';

  let activeScreen = 'home'; // 'home' | 'profile' | 'expedition'
  let stages = [];
  let clearedIds = [];
  let rebirthCount = 0;
  let mockNearZone = false;
  let bypassGpsForDev = true;
  let activeStage = null;
  let selectedPinId = 1;
  let searchQuery = '';

  // State สำหรับ CS-Style Roulette Gacha
  let showGachaModal = false;
  let isSpinning = false;
  let rouletteStrip = [];
  let rouletteOffset = 0;
  let rouletteContainerWidth = 320;
  let gachaReward = null;
  const CARD_WIDTH = 96;
  const CARD_GAP = 8;
  const STEP_WIDTH = CARD_WIDTH + CARD_GAP;
  const WIN_INDEX = 36;

  // State สำหรับมินิเกมแบบหลายข้อ
  let currentOrderSet = null;
  let orderSelected = [];

  let swipeDeck = [];
  let swipeIndex = 0;
  let swipeScore = 0;
  let swipeOffset = 0;
  let swipeDragging = false;
  let swipeStartX = 0;

  let currentZoomPuzzle = null;
  let zoomLevel = 2.4;

  let currentMatchSet = null;
  let shuffledBenefits = [];
  let matchedPairs = [];
  let selectedPlant = null;
  let selectedBenefit = null;

  let currentShadowPuzzle = null;
  let gameFeedback = '';

  const gachaPool = [
    {
      id: 'sticker',
      name: 'สติกเกอร์เงาพฤกษา',
      rarity: 'Common',
      emoji: '🌿',
      barColor: 'bg-sky-500',
      cardBg: 'from-slate-100 to-sky-100',
      textColor: 'text-sky-700',
      weight: 40
    },
    {
      id: 'postcard',
      name: 'โปสการ์ดสวนพฤกษศาสตร์',
      rarity: 'Rare',
      emoji: '🏞️',
      barColor: 'bg-indigo-500',
      cardBg: 'from-slate-100 to-indigo-100',
      textColor: 'text-indigo-700',
      weight: 30
    },
    {
      id: 'coupon15',
      name: 'คูปองคาเฟ่สวน 15 บาท',
      rarity: 'Epic',
      emoji: '🧋',
      barColor: 'bg-pink-500',
      cardBg: 'from-pink-50 to-fuchsia-100',
      textColor: 'text-pink-700',
      weight: 20
    },
    {
      id: 'gold_pin',
      name: '★ เข็มกลัดทองคำพิเศษ',
      rarity: 'Exceedingly Rare',
      emoji: '👑',
      barColor: 'bg-amber-400',
      cardBg: 'from-amber-100 via-yellow-200 to-amber-300',
      textColor: 'text-amber-900',
      weight: 10
    }
  ];

  // ตำแหน่งหมุด (%) บนกระดานแผนที่ expedition
  const mapCoords = {
    1: { x: 20, y: 76, badge: 'จุดที่ 1' },
    2: { x: 74, y: 64, badge: 'จุดที่ 2' },
    3: { x: 30, y: 46, badge: 'จุดที่ 3' },
    4: { x: 76, y: 31, badge: 'จุดที่ 4' },
    5: { x: 42, y: 15, badge: 'จุดที่ 5' }
  };

  const fallbackStages = [
    {
      id: 1,
      zone: 'โซนพืชวงศ์กล้วย',
      subtitle: 'เรียงลำดับวงจรชีวิต',
      stampName: 'ตราพฤษากล้วย',
      gameType: 'order',
      gameLabel: 'เรียงลำดับวงจรชีวิต',
      fact: 'พืชแต่ละชนิดมีลำดับการเติบโตเฉพาะตัว การสังเกตระยะต่าง ๆ ช่วยให้เข้าใจวงจรชีวิตพืชได้ง่ายขึ้น',
      clayPadGrad: 'from-[#FFE885] to-[#FFD23F]',
      numColor: 'text-[#3B82F6]'
    },
    {
      id: 2,
      zone: 'ลานสมุนไพรกลางแจ้ง',
      subtitle: 'ปัดซ้าย-ขวา จริงหรือมั่ว',
      stampName: 'ตราสมุนไพร',
      gameType: 'swipe',
      gameLabel: 'ปัดซ้าย-ขวา จริงหรือมั่ว',
      fact: 'สมุนไพรกลางแจ้งหลายชนิดมีบทบาททั้งด้านภูมิปัญญาท้องถิ่นและการดูแลสุขภาพเบื้องต้น',
      clayPadGrad: 'from-[#A7F3D0] to-[#6EE7B7]',
      numColor: 'text-[#0EA5E9]'
    },
    {
      id: 3,
      zone: 'ลานไม้ประดับแสงแดด',
      subtitle: 'ซูมส่องปริศนา',
      stampName: 'ตราสุริยาพฤกษา',
      gameType: 'zoom',
      gameLabel: 'ซูมส่องปริศนา',
      fact: 'พรรณไม้กลางแจ้งมักปรับตัวรับแสงแดดจัดได้ดี ลองสังเกตรายละเอียดใกล้ ๆ ของต้นจริงในสวนดูครับ',
      clayPadGrad: 'from-[#FED7AA] to-[#FDBA74]',
      numColor: 'text-[#F59E0B]'
    },
    {
      id: 4,
      zone: 'ลานพืชใช้สอย',
      subtitle: 'จับคู่ / ปรุงสูตร',
      stampName: 'ตราหัตถพฤกษา',
      gameType: 'match',
      gameLabel: 'จับคู่ / ปรุงสูตร',
      fact: 'พรรณไม้พื้นถิ่นหลายชนิดมีประโยชน์หลากหลาย ทั้งเครื่องใช้ อาหาร และสมุนไพร',
      clayPadGrad: 'from-[#BAE6FD] to-[#7DD3FC]',
      numColor: 'text-[#6366F1]'
    },
    {
      id: 5,
      zone: 'ลานเงาพฤกษา',
      subtitle: 'ทายจากเงาดำ',
      stampName: 'ตราเงาพฤกษา',
      gameType: 'shadow',
      gameLabel: 'ทายจากเงา',
      fact: 'รูปทรงของใบและขอบใบเป็นจุดสังเกตสำคัญที่ช่วยแยกชนิดพรรณไม้ได้แม้เห็นเพียงเงา',
      clayPadGrad: 'from-[#D9F99D] to-[#BEF264]',
      numColor: 'text-[#16A34A]'
    }
  ];

  const orderQuestionBank = [
    {
      title: 'วงจรชีวิตของกล้วย',
      steps: [
        { id: 's1', label: '1. เหง้าใต้ดินและหน่ออ่อน', step: 1 },
        { id: 's2', label: '2. แตกใบและลำต้นเทียม', step: 2 },
        { id: 's3', label: '3. แทงปลีและออกดอก', step: 3 },
        { id: 's4', label: '4. เจริญเป็นหวีและผลกล้วย', step: 4 }
      ]
    },
    {
      title: 'การงอกและเติบโตของพืชดอก',
      steps: [
        { id: 's1', label: '1. เมล็ดดูดน้ำและเริ่มงอกราก', step: 1 },
        { id: 's2', label: '2. แทงยอดอ่อนและใบเลี้ยง', step: 2 },
        { id: 's3', label: '3. ลำต้นแข็งแรงและผลิดอก', step: 3 },
        { id: 's4', label: '4. ผสมเกสรและสร้างเมล็ดใหม่', step: 4 }
      ]
    },
    {
      title: 'การขยายพันธุ์ด้วยหน่อ / กิ่ง',
      steps: [
        { id: 's1', label: '1. คัดเลือกหน่อหรือส่วนขยายพันธุ์ที่สมบูรณ์', step: 1 },
        { id: 's2', label: '2. ปลูกลงดินร่วนและรดน้ำสม่ำเสมอ', step: 2 },
        { id: 's3', label: '3. รากยึดเกาะและแตกใบใหม่', step: 3 },
        { id: 's4', label: '4. เติบโตเต็มวัยพร้อมปรับตัวรับแดด', step: 4 }
      ]
    }
  ];

  const swipeQuestionBank = [
    { statement: 'ลำต้นแท้จริงของกล้วยอยู่ใต้ดิน เรียกว่า "เหง้า"', isTrue: true },
    { statement: 'ต้นกล้วยจัดเป็นไม้ยืนต้นเนื้อแข็งที่มีวงปีเหมือนไม้สัก', isTrue: false },
    { statement: 'พืชกลางแจ้งมักต้องการแสงแดดเพื่อสร้างอาหารผ่านการสังเคราะห์แสง', isTrue: true },
    { statement: 'ใบพืชทุกชนิดบนโลกมีรูปทรงกลมเหมือนกันหมด', isTrue: false },
    { statement: 'การเดินสำรวจพื้นที่โล่งช่วยให้นักท่องเที่ยวกระจายตัวไม่แออัดจุดเดียว', isTrue: true }
  ];

  const zoomQuestionBank = [
    {
      id: 'sunflower',
      prompt: 'ซูมส่องกลีบและเกสรสีสด — คือพืชชนิดใด?',
      emoji: '🌻',
      answer: 'sunflower',
      choices: [
        { id: 'sunflower', label: 'ทานตะวัน' },
        { id: 'lotus', label: 'บัวหลวง' },
        { id: 'cactus', label: 'กระบองเพชร' }
      ]
    },
    {
      id: 'lotus',
      prompt: 'ส่องกลีบดอกซ้อนละมุน — คือพืชชนิดใด?',
      emoji: '🪷',
      answer: 'lotus',
      choices: [
        { id: 'hibiscus', label: 'ชบา' },
        { id: 'lotus', label: 'บัว' },
        { id: 'rose', label: 'กุหลาบ' }
      ]
    },
    {
      id: 'herb',
      prompt: 'ซูมดูยอดใบเขียวสด — คือพืชชนิดใด?',
      emoji: '🌿',
      answer: 'herb',
      choices: [
        { id: 'herb', label: 'พืชสมุนไพร/ใบเขียว' },
        { id: 'mushroom', label: 'เห็ดป่า' },
        { id: 'pine', label: 'สนเข็ม' }
      ]
    }
  ];

  const matchQuestionBank = [
    {
      title: 'จับคู่พืชกับประโยชน์ใช้งาน',
      pairs: [
        { id: 'm1', plant: 'ไผ่', benefit: 'งานสาน / โครงสร้าง' },
        { id: 'm2', plant: 'ใบตอง', benefit: 'ห่ออาหาร / กระทง' },
        { id: 'm3', plant: 'สมุนไพร', benefit: 'ดูแลสุขภาพเบื้องต้น' }
      ]
    },
    {
      title: 'จับคู่องค์ประกอบในสวนพฤกษศาสตร์',
      pairs: [
        { id: 'm1', plant: 'พื้นที่โล่ง', benefit: 'รับแสงแดด & เช็ก GPS ได้ง่าย' },
        { id: 'm2', plant: 'แสตมป์ 5 ดวง', benefit: 'เติมเกจสำรวจครบ 100%' },
        { id: 'm3', plant: 'เกจ 100%', benefit: 'ปลดล็อกตู้กาชาลุ้นรางวัล' }
      ]
    }
  ];

  const shadowQuestionBank = [
    {
      id: 'banana',
      prompt: 'เงาใบยาวรีมีเส้นกลางใบเด่น — ตรงกับภาพใด?',
      svgType: 'banana',
      answer: 'banana',
      choices: [
        { id: 'banana', label: 'ใบกล้วยขอบเรียบ' },
        { id: 'palm', label: 'ใบพัด / ใบปาล์มแฉก' },
        { id: 'clover', label: 'ใบแฉก 3 แฉกสมมาตร' }
      ]
    },
    {
      id: 'palm',
      prompt: 'เงาแผ่กางเป็นแฉกคล้ายพัด — ตรงกับภาพใด?',
      svgType: 'palm',
      answer: 'palm',
      choices: [
        { id: 'banana', label: 'ใบกล้วยยาวรี' },
        { id: 'palm', label: 'ใบพัด / ใบปาล์มแฉก' },
        { id: 'clover', label: 'ใบแฉก 3 แฉกสมมาตร' }
      ]
    },
    {
      id: 'clover',
      prompt: 'เงาแฉกกลมเรียงตัวสมมาตร — ตรงกับภาพใด?',
      svgType: 'clover',
      answer: 'clover',
      choices: [
        { id: 'clover', label: 'ใบแฉก 3 แฉกสมมาตร' },
        { id: 'banana', label: 'ใบกล้วยยาวรี' },
        { id: 'palm', label: 'ใบพัด / ใบปาล์มแฉก' }
      ]
    }
  ];

  $: progressPercent = Math.min(100, clearedIds.length * 20);
  $: xpPoints = 45000 + rebirthCount * 500 + clearedIds.length * 100;
  $: filteredStages = stages.filter(
    (s) =>
      s.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.gameLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );
  $: canPlayCurrentStage = mockNearZone || bypassGpsForDev;
  $: selectedMapStage = stages.find((s) => s.id === selectedPinId) || stages[0];

  onMount(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stages`);
      const data = await res.json();
      if (data.stages?.length) {
        stages = data.stages.map((st, idx) => ({
          ...fallbackStages[idx % fallbackStages.length],
          ...st
        }));
      } else {
        stages = fallbackStages;
      }
    } catch {
      stages = fallbackStages;
    }
  });

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  let audioCtx = null;
  function playTickSound(isWin = false) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isWin ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isWin ? 880 : 520, audioCtx.currentTime);
      if (isWin) {
        osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.22);
      }
      gain.gain.setValueAtTime(isWin ? 0.18 : 0.07, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (isWin ? 0.35 : 0.045));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (isWin ? 0.36 : 0.05));
    } catch {}
  }

  function pickWeightedReward() {
    const totalWeight = gachaPool.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    for (const item of gachaPool) {
      if (r < item.weight) return item;
      r -= item.weight;
    }
    return gachaPool[0];
  }

  function openGachaRoulette() {
    if (progressPercent < 100) return;
    showGachaModal = true;
    startRouletteSpin();
  }

  function startRouletteSpin() {
    if (isSpinning) return;
    isSpinning = true;
    gachaReward = null;

    const chosenWinner = pickWeightedReward();
    const totalCards = 45;
    const strip = [];
    for (let i = 0; i < totalCards; i++) {
      if (i === WIN_INDEX) {
        strip.push(chosenWinner);
      } else {
        strip.push(pickWeightedReward());
      }
    }
    rouletteStrip = strip;
    rouletteOffset = 0;

    const randomJitter = (Math.random() - 0.5) * (CARD_WIDTH * 0.55);
    const centerOfViewport = rouletteContainerWidth / 2;
    const targetOffset = WIN_INDEX * STEP_WIDTH + CARD_WIDTH / 2 - centerOfViewport + randomJitter;

    const duration = 5200;
    const startTime = performance.now();
    let lastPassedIndex = -1;

    function animateFrame(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 4.2);

      rouletteOffset = targetOffset * eased;

      const currentCenterIndex = Math.floor((rouletteOffset + centerOfViewport) / STEP_WIDTH);
      if (currentCenterIndex !== lastPassedIndex) {
        lastPassedIndex = currentCenterIndex;
        playTickSound(false);
      }

      if (t < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        isSpinning = false;
        gachaReward = chosenWinner;
        playTickSound(true);
        confetti({
          particleCount: chosenWinner.id === 'gold_pin' ? 180 : 110,
          spread: 85,
          origin: { y: 0.55 }
        });
      }
    }

    requestAnimationFrame(animateFrame);
  }

  function setupMiniGameForStage(gameType) {
    gameFeedback = '';
    orderSelected = [];
    swipeIndex = 0;
    swipeScore = 0;
    swipeOffset = 0;
    zoomLevel = 2.4;
    matchedPairs = [];
    selectedPlant = null;
    selectedBenefit = null;

    if (gameType === 'order') {
      const picked = randomItem(orderQuestionBank);
      currentOrderSet = { ...picked, steps: shuffleArray(picked.steps) };
    } else if (gameType === 'swipe') {
      swipeDeck = shuffleArray(swipeQuestionBank).slice(0, 3);
    } else if (gameType === 'zoom') {
      currentZoomPuzzle = randomItem(zoomQuestionBank);
    } else if (gameType === 'match') {
      const picked = randomItem(matchQuestionBank);
      currentMatchSet = picked;
      shuffledBenefits = shuffleArray(picked.pairs);
    } else if (gameType === 'shadow') {
      currentShadowPuzzle = randomItem(shadowQuestionBank);
    }
  }

  function openStage(stage) {
    if (!stage) return;
    selectedPinId = stage.id;
    activeStage = stage;
    setupMiniGameForStage(stage.gameType);
  }

  function completeStage(stageId) {
    if (!clearedIds.includes(stageId)) {
      clearedIds = [...clearedIds, stageId];
      const nextStage = stages.find((s) => !clearedIds.includes(s.id));
      if (nextStage) {
        selectedPinId = nextStage.id;
      }
      if (clearedIds.length === 5) {
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
      }
    }
    activeStage = null;
  }

  function pickOrderStep(stepObj) {
    const nextExpectedStep = orderSelected.length + 1;
    if (stepObj.step === nextExpectedStep) {
      orderSelected = [...orderSelected, stepObj];
      gameFeedback = '';
      if (orderSelected.length === currentOrderSet.steps.length) {
        completeStage(activeStage.id);
      }
    } else {
      orderSelected = [];
      gameFeedback = 'ลำดับยังไม่ถูก ลองเริ่มเรียงจากขั้นที่ 1 ใหม่ครับ';
    }
  }

  function answerSwipe(userSaysTrue) {
    const currentCard = swipeDeck[swipeIndex];
    if (!currentCard) return;

    if (userSaysTrue === currentCard.isTrue) {
      swipeScore += 1;
      gameFeedback = `ถูกต้อง! (${swipeScore}/3 ข้อ)`;
    } else {
      gameFeedback = `ยังไม่ตรง ลองดูข้อถัดไปครับ (${swipeScore}/3 ข้อ)`;
    }

    if (swipeIndex + 1 < swipeDeck.length) {
      swipeIndex += 1;
    } else {
      if (swipeScore >= 2) {
        completeStage(activeStage.id);
      } else {
        swipeIndex = 0;
        swipeScore = 0;
        swipeDeck = shuffleArray(swipeQuestionBank).slice(0, 3);
        gameFeedback = 'รอบนี้ได้ไม่ถึง 2 ข้อ สุ่มชุดคำถามใหม่ให้ลองอีกครั้งครับ';
      }
    }
  }

  function handlePointerDown(e) {
    swipeDragging = true;
    swipeStartX = e.clientX;
  }

  function handlePointerMove(e) {
    if (!swipeDragging) return;
    swipeOffset = e.clientX - swipeStartX;
  }

  function handlePointerUp() {
    if (!swipeDragging) return;
    swipeDragging = false;
    if (swipeOffset > 70) {
      answerSwipe(true);
    } else if (swipeOffset < -70) {
      answerSwipe(false);
    }
    swipeOffset = 0;
  }

  function answerZoom(choiceId) {
    if (choiceId === currentZoomPuzzle.answer) {
      completeStage(activeStage.id);
    } else {
      gameFeedback = 'ยังไม่ตรง ลองปรับซูมแล้วทายใหม่อีกครั้งครับ';
    }
  }

  $: {
    if (selectedPlant && selectedBenefit) {
      if (selectedPlant.id === selectedBenefit.id) {
        if (!matchedPairs.includes(selectedPlant.id)) {
          matchedPairs = [...matchedPairs, selectedPlant.id];
        }
        gameFeedback = `จับคู่ "${selectedPlant.plant}" สำเร็จ!`;
        if (matchedPairs.length === currentMatchSet.pairs.length) {
          completeStage(activeStage.id);
        }
      } else {
        gameFeedback = 'คู่นี้ยังไม่เข้ากัน ลองเลือกจับคู่ใหม่อีกทีครับ';
      }
      selectedPlant = null;
      selectedBenefit = null;
    }
  }

  function answerShadow(choiceId) {
    if (choiceId === currentShadowPuzzle.answer) {
      completeStage(activeStage.id);
    } else {
      gameFeedback = 'เงายังไม่ตรง ลองสังเกตรูปทรงของเงาด้านบนใหม่อีกครั้งครับ';
    }
  }

  function resetRound() {
    if (clearedIds.length === 5) {
      rebirthCount += 1;
    }
    clearedIds = [];
    gachaReward = null;
    showGachaModal = false;
    activeStage = null;
    selectedPinId = 1;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-[#D8ECFF] via-[#E8F4FF] to-[#FFF6D6] flex justify-center items-center sm:py-6 font-sans text-slate-800 select-none">
  <div
    class="w-full max-w-[400px] min-h-screen sm:min-h-[812px] sm:rounded-[46px] shadow-[0_28px_60px_rgba(30,58,138,0.14),inset_0_4px_10px_rgba(255,255,255,0.9),inset_0_-8px_16px_rgba(148,163,184,0.22)] relative overflow-hidden flex flex-col justify-between transition-all duration-500 {activeScreen === 'home'
      ? 'bg-gradient-to-b from-[#FFF176] via-[#FFF9C4] to-[#F7FBF2]'
      : activeScreen === 'profile'
      ? 'bg-gradient-to-b from-[#90CAF9] via-[#D6EBFF] to-[#F4F9FF]'
      : 'bg-gradient-to-b from-[#C5F378] via-[#E8FBC4] to-[#F7FBF2]'}"
  >
    <!-- ================= หน้า 1: CLAY HOME ================= -->
    {#if activeScreen === 'home'}
      <div class="px-6 pt-6 pb-28 flex-1 flex flex-col">
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            on:click={() => (activeScreen = 'profile')}
            class="w-11 h-11 rounded-[20px] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08),inset_0_3px_6px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.65)] flex items-center justify-center cursor-pointer active:scale-95 transition"
            title="ไปหน้าโปรไฟล์"
          >
            <Sprout class="w-5 h-5 text-emerald-500" />
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              on:click={() => (bypassGpsForDev = !bypassGpsForDev)}
              class="px-3 py-2 rounded-[18px] text-[10px] font-extrabold transition cursor-pointer active:scale-95 {bypassGpsForDev
                ? 'bg-gradient-to-b from-[#34D399] to-[#10B981] text-white shadow-[0_6px_14px_rgba(16,185,129,0.28),inset_0_2px_4px_rgba(255,255,255,0.65),inset_0_-3px_6px_rgba(4,120,87,0.35)]'
                : 'bg-white text-slate-700 shadow-[0_6px_14px_rgba(15,23,42,0.07),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.6)]'}"
            >
              {bypassGpsForDev ? 'เทสต์อิสระ ✓' : 'โหมดเช็กจุด'}
            </button>

            <button
              type="button"
              on:click={() => (mockNearZone = !mockNearZone)}
              class="px-3 py-2 rounded-[18px] text-[10px] font-extrabold transition cursor-pointer active:scale-95 {mockNearZone
                ? 'bg-gradient-to-b from-[#A3E635] to-[#65A30D] text-slate-950 shadow-[0_6px_14px_rgba(101,163,13,0.28),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-3px_6px_rgba(54,83,20,0.3)]'
                : 'bg-white text-slate-800 shadow-[0_6px_14px_rgba(15,23,42,0.07),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.6)]'}"
            >
              {mockNearZone ? 'โซนโล่ง ✓' : 'GPS'}
            </button>
          </div>
        </div>

        <div class="mt-5 text-center">
          <h1 class="text-[48px] font-black tracking-tighter text-slate-900 leading-none uppercase drop-shadow-[0_4px_0_rgba(255,255,255,0.75)]">
            WELCOME!
          </h1>
          <p class="mt-1.5 text-xs font-extrabold text-slate-600">
            นักล่าเงาพฤกษา • สวนพฤกษศาสตร์สมเด็จพระนางเจ้าสิริกิติ์
          </p>
        </div>

        <!-- เกจสำรวจ 0-100% -->
        <div class="mt-4 rounded-[28px] bg-white/95 p-4 shadow-[0_14px_28px_rgba(15,23,42,0.08),inset_0_4px_8px_rgba(255,255,255,1),inset_0_-6px_12px_rgba(203,213,225,0.55)]">
          <div class="flex items-center justify-between text-xs font-black mb-2.5">
            <span class="text-slate-800">เกจสำรวจพื้นที่โล่ง ({clearedIds.length}/5 แสตมป์)</span>
            <span class="px-3 py-1 rounded-full bg-gradient-to-b from-[#FEF08A] to-[#FACC15] text-slate-900 shadow-[inset_0_2px_3px_rgba(255,255,255,0.8),inset_0_-2px_4px_rgba(202,138,4,0.3)]">
              {progressPercent}%
            </span>
          </div>
          <div class="w-full h-4 rounded-full bg-slate-100 shadow-[inset_0_3px_6px_rgba(148,163,184,0.45)] overflow-hidden p-0.5">
            <div
              class="h-full rounded-full bg-gradient-to-r from-[#86EFAC] via-[#4ADE80] to-[#FACC15] shadow-[inset_0_2px_3px_rgba(255,255,255,0.75)] transition-all duration-500"
              style="width: {progressPercent}%"
            ></div>
          </div>
        </div>

        <!-- ค้นหา -->
        <div class="mt-4 space-y-3">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-lg font-extrabold text-slate-900 tracking-tight">
              Find your local quest
            </h2>
            <button
              type="button"
              on:click={() => (activeScreen = 'expedition')}
              class="text-xs font-black text-sky-700 hover:underline cursor-pointer"
            >
              ดูแผนที่ 5 ด่าน
            </button>
          </div>

          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="ค้นหาโซนพื้นที่โล่ง หรือมินิเกม..."
              class="w-full pl-10 pr-4 py-3 rounded-[22px] bg-white text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-[0_10px_22px_rgba(15,23,42,0.06),inset_0_3px_6px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.5)] focus:outline-none"
            />
          </div>
        </div>

        <!-- การ์ดด่าน 1-4 (มีเงาไอคอนใบ้ + แสตมป์ทับการ์ด) -->
        <div class="mt-5 grid grid-cols-2 gap-3.5">
          {#each filteredStages.slice(0, 4) as stage}
            {@const isCleared = clearedIds.includes(stage.id)}
            <button
              type="button"
              on:click={() => openStage(stage)}
              class="text-left group cursor-pointer focus:outline-none"
            >
              <div class="relative flex items-end h-28">
                <span
                  class="text-[74px] font-black leading-none tracking-tighter select-none -mr-3 z-0 transition-transform group-hover:-translate-y-1 drop-shadow-[0_4px_8px_rgba(0,0,0,0.08)] {stage.numColor}"
                >
                  {stage.id}
                </span>

                <div
                  class="relative z-10 flex-1 h-24 rounded-[24px] bg-gradient-to-b {stage.clayPadGrad} p-3 shadow-[0_10px_20px_rgba(15,23,42,0.1),inset_0_4px_7px_rgba(255,255,255,0.85),inset_0_-5px_10px_rgba(15,23,42,0.08)] flex flex-col justify-between overflow-hidden group-hover:scale-[1.03] active:scale-95 transition"
                >
                  <div class="pointer-events-none absolute -right-2 -bottom-2 text-slate-950/12 -rotate-12 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    {#if stage.gameType === 'order'}
                      <ListOrdered class="w-16 h-16 stroke-[2.4]" />
                    {:else if stage.gameType === 'swipe'}
                      <ArrowLeftRight class="w-16 h-16 stroke-[2.4]" />
                    {:else if stage.gameType === 'zoom'}
                      <Search class="w-16 h-16 stroke-[2.4]" />
                    {:else if stage.gameType === 'match'}
                      <Puzzle class="w-16 h-16 stroke-[2.4]" />
                    {:else}
                      <Leaf class="w-16 h-16 stroke-[2.4]" />
                    {/if}
                  </div>

                  <div class="relative z-10 flex items-center justify-between">
                    <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/90 text-slate-900 shadow-xs">
                      {isCleared ? 'ปั๊มแล้ว ✓' : 'กดเล่น'}
                    </span>
                    {#if !isCleared}
                      <Leaf class="w-3.5 h-3.5 text-slate-700/75" />
                    {/if}
                  </div>

                  <div class="relative z-10 text-[11px] font-extrabold text-slate-900 leading-tight line-clamp-2 pr-5">
                    {stage.gameLabel}
                  </div>

                  {#if isCleared}
                    <div
                      class="pointer-events-none absolute -right-1.5 -top-1.5 z-20 w-13 h-13 rounded-full bg-gradient-to-b from-[#FFFDF7] to-[#FEF3C7] border-[2.5px] border-dashed border-emerald-700/80 shadow-[0_6px_14px_rgba(6,78,59,0.25),inset_0_2px_4px_rgba(255,255,255,0.95)] rotate-12 flex flex-col items-center justify-center text-center px-1"
                    >
                      <Check class="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                      <span class="text-[8px] font-black text-emerald-900 leading-tight line-clamp-1 mt-0.5">
                        {stage.stampName}
                      </span>
                    </div>
                  {/if}
                </div>
              </div>

              <div class="mt-1.5 pl-1">
                <div class="text-sm font-black text-slate-900 truncate">
                  {isCleared ? stage.zone : `เงาปริศนา #${stage.id}`}
                </div>
                <div class="text-[11px] font-bold text-slate-500 leading-tight">
                  {stage.subtitle} • +20%
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>

    <!-- ================= หน้า 2: CLAY PROFILE ================= -->
    {:else if activeScreen === 'profile'}
      <div class="px-6 pt-6 pb-28 flex-1 flex flex-col">
        <div class="w-full flex items-center justify-between">
          <button
            type="button"
            on:click={() => (activeScreen = 'home')}
            class="w-11 h-11 rounded-[18px] bg-white shadow-[0_8px_16px_rgba(15,23,42,0.08),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.6)] flex items-center justify-center cursor-pointer active:scale-95 transition"
            title="กลับหน้าแรก"
          >
            <Undo2 class="w-4 h-4 text-slate-700" />
          </button>

          <span class="text-sm font-black text-slate-900">Overview & Rebirth</span>

          <button
            type="button"
            on:click={resetRound}
            title="Rebirth รีเซ็ตรอบใหม่"
            class="px-3 h-11 rounded-[18px] bg-white shadow-[0_8px_16px_rgba(15,23,42,0.08),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.6)] flex items-center gap-1.5 text-xs font-black text-slate-800 cursor-pointer active:scale-95 transition"
          >
            <RotateCcw class="w-3.5 h-3.5" />
            Rebirth
          </button>
        </div>

        <h1 class="mt-4 text-[42px] font-black tracking-tight text-slate-900 leading-none uppercase text-center drop-shadow-[0_3px_0_rgba(255,255,255,0.75)]">
          EXPLORER
        </h1>

        <div class="w-full mt-5 grid grid-cols-3 items-center bg-white/95 rounded-[30px] p-4 shadow-[0_14px_28px_rgba(30,64,175,0.1),inset_0_4px_8px_rgba(255,255,255,1),inset_0_-6px_12px_rgba(203,213,225,0.55)]">
          <div class="text-center">
            <div class="text-2xl font-black text-slate-900">{clearedIds.length}/5</div>
            <div class="text-[11px] font-bold text-slate-500">stamps</div>
          </div>

          <div class="flex flex-col items-center justify-center border-x border-slate-200/70 px-2">
            <div class="w-14 h-14 rounded-[22px] bg-gradient-to-b from-[#60A5FA] to-[#2563EB] text-white shadow-[0_10px_18px_rgba(37,99,235,0.28),inset_0_4px_7px_rgba(255,255,255,0.65),inset_0_-5px_9px_rgba(30,58,138,0.45)] flex items-center justify-center">
              <Compass class="w-7 h-7" />
            </div>
            <span class="mt-1.5 text-[11px] font-black text-slate-800">Open Zone</span>
          </div>

          <div class="text-center">
            <div class="text-2xl font-black text-slate-900">{rebirthCount}</div>
            <div class="text-[11px] font-bold text-slate-500">rebirths</div>
          </div>
        </div>

        <div class="w-full mt-4 grid grid-cols-2 gap-3 px-1">
          <div class="rounded-[22px] bg-white/90 p-3 flex items-center gap-2.5 shadow-[0_8px_16px_rgba(15,23,42,0.06),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-3px_7px_rgba(203,213,225,0.5)]">
            <div class="w-8 h-8 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500">
              <Flame class="w-4 h-4 fill-orange-500" />
            </div>
            <span class="text-xs font-black text-slate-900">{progressPercent}% Gauge</span>
          </div>

          <div class="rounded-[22px] bg-white/90 p-3 flex items-center gap-2.5 shadow-[0_8px_16px_rgba(15,23,42,0.06),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-3px_7px_rgba(203,213,225,0.5)]">
            <div class="w-8 h-8 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500">
              <Star class="w-4 h-4 fill-amber-400" />
            </div>
            <span class="text-xs font-black text-slate-900">{xpPoints.toLocaleString()} XP</span>
          </div>

          <div class="rounded-[22px] bg-white/90 p-3 flex items-center gap-2.5 shadow-[0_8px_16px_rgba(15,23,42,0.06),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-3px_7px_rgba(203,213,225,0.5)]">
            <div class="w-8 h-8 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
              <Sun class="w-4 h-4" />
            </div>
            <span class="text-xs font-black text-slate-900">Open Area</span>
          </div>

          <div class="rounded-[22px] bg-white/90 p-3 flex items-center gap-2.5 shadow-[0_8px_16px_rgba(15,23,42,0.06),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-3px_7px_rgba(203,213,225,0.5)]">
            <div class="w-8 h-8 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Trophy class="w-4 h-4" />
            </div>
            <span class="text-xs font-black text-slate-900">Shadow Quest</span>
          </div>
        </div>

        <div class="w-full mt-5 grid grid-cols-3 gap-3">
          <div class="rounded-[26px] bg-white/90 p-3 shadow-[0_10px_20px_rgba(15,23,42,0.07),inset_0_3px_6px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.5)] flex flex-col items-center">
            <div class="w-16 h-16 rounded-[22px] bg-gradient-to-b from-[#7DD3FC] to-[#2563EB] shadow-[0_8px_14px_rgba(37,99,235,0.25),inset_0_4px_6px_rgba(255,255,255,0.7),inset_0_-5px_8px_rgba(30,58,138,0.4)] flex flex-col items-center justify-center text-white">
              <span class="text-sm font-black">{progressPercent}%</span>
              <span class="text-[9px] font-extrabold opacity-90">GAUGE</span>
            </div>
          </div>

          <div class="rounded-[26px] bg-white/90 p-3 shadow-[0_10px_20px_rgba(15,23,42,0.07),inset_0_3px_6px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.5)] flex flex-col items-center">
            <div class="w-16 h-16 rounded-[22px] bg-gradient-to-b from-[#FDE047] to-[#EAB308] shadow-[0_8px_14px_rgba(234,179,8,0.28),inset_0_4px_6px_rgba(255,255,255,0.75),inset_0_-5px_8px_rgba(161,98,7,0.35)] flex flex-col items-center justify-center text-slate-900">
              <span class="text-sm font-black">{clearedIds.length * 20}</span>
              <span class="text-[9px] font-extrabold opacity-80">STAMPS</span>
            </div>
          </div>

          <div class="rounded-[26px] bg-white/90 p-3 shadow-[0_10px_20px_rgba(15,23,42,0.07),inset_0_3px_6px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.5)] flex flex-col items-center">
            <div class="w-16 h-16 rounded-[22px] bg-gradient-to-b from-[#A5B4FC] to-[#4F46E5] shadow-[0_8px_14px_rgba(79,70,229,0.25),inset_0_4px_6px_rgba(255,255,255,0.7),inset_0_-5px_8px_rgba(49,46,129,0.4)] flex flex-col items-center justify-center text-white">
              <span class="text-sm font-black">#{rebirthCount + 1}</span>
              <span class="text-[9px] font-extrabold opacity-90">CYCLE</span>
            </div>
          </div>
        </div>
      </div>

    <!-- ================= หน้า 3: CLAY EXPEDITION MAP (แผนที่เส้นทางสำรวจ Responsive) ================= -->
    {:else}
      <div class="px-4 sm:px-6 pt-5 pb-28 flex-1 flex flex-col">
        <!-- แถบด้านบนของหน้าแผนที่ (ไม่บีบปุ่มและหัวข้อจนแตกบรรทัด) -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-10 h-10 rounded-[18px] bg-white shadow-[0_8px_16px_rgba(15,23,42,0.08),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.6)] flex items-center justify-center shrink-0">
              <MapPin class="w-4 h-4 text-emerald-600" />
            </div>
            <div class="min-w-0">
              <h1 class="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-none uppercase truncate">
                BOTANIC MAP
              </h1>
              <p class="text-[11px] font-extrabold text-slate-700 mt-1 truncate">
                5 จุดพื้นที่โล่ง • เกจ {progressPercent}%
              </p>
            </div>
          </div>

          <button
            type="button"
            on:click={() => (bypassGpsForDev = !bypassGpsForDev)}
            class="px-3 py-2 rounded-[18px] text-[10px] sm:text-xs font-extrabold whitespace-nowrap shrink-0 transition cursor-pointer active:scale-95 {bypassGpsForDev
              ? 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white shadow-[0_6px_14px_rgba(22,163,74,0.28),inset_0_2px_4px_rgba(255,255,255,0.65),inset_0_-3px_6px_rgba(21,128,61,0.35)]'
              : 'bg-white text-slate-800 shadow-[0_6px_14px_rgba(15,23,42,0.07),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.6)]'}"
          >
            {bypassGpsForDev ? 'เทสต์อิสระ ✓' : 'โหมดเช็กจุด'}
          </button>
        </div>

        <!-- กระดานแผนที่ดินปั้น (Clay Map Canvas Responsive) -->
        <div class="mt-3.5 relative min-h-[290px] sm:min-h-[330px] flex-1 w-full rounded-[32px] bg-gradient-to-b from-[#D9F99D] via-[#ECFCCB] to-[#E0F2FE] shadow-[0_14px_28px_rgba(15,23,42,0.1),inset_0_4px_8px_rgba(255,255,255,0.9),inset_0_-6px_12px_rgba(132,204,22,0.25)] border border-white/80 overflow-hidden">
          <!-- แปลงพื้นที่ดินปั้นตกแต่งพื้นแผนที่ -->
          <div class="pointer-events-none absolute -left-8 -top-8 w-36 h-36 rounded-[44px] bg-[#FEF08A]/55 rotate-12 shadow-[inset_0_3px_6px_rgba(255,255,255,0.8)]"></div>
          <div class="pointer-events-none absolute -right-6 bottom-6 w-32 h-32 rounded-[40px] bg-[#A7F3D0]/55 -rotate-12 shadow-[inset_0_3px_6px_rgba(255,255,255,0.8)]"></div>
          <div class="pointer-events-none absolute left-10 bottom-3 w-28 h-16 rounded-full bg-[#BAE6FD]/65"></div>

          <!-- ป้ายชื่อโซนบนแผนที่ (ไม่ให้หมุด 5 ทับ) -->
          <span class="pointer-events-none absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-white/95 text-[10px] font-black text-emerald-950 shadow-xs whitespace-nowrap">
            🌿 พื้นที่โล่งกลางแจ้ง
          </span>

          <!-- เส้นทางเดินเชื่อมต่อหมุดทั้ง 5 จุด -->
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="pointer-events-none absolute inset-0 w-full h-full">
            <polyline
              points="20,78 76,66 28,48 76,34 46,20"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="4.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.92"
            />
            <polyline
              points="20,78 76,66 28,48 76,34 46,20"
              fill="none"
              stroke="#15803D"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-dasharray="3.2 2.8"
            />
          </svg>

          <!-- หมุดสำรวจทั้ง 5 จุดบนแผนที่ -->
          {#each [
            { id: 1, x: 20, y: 78, badge: 'จุดที่ 1' },
            { id: 2, x: 76, y: 66, badge: 'จุดที่ 2' },
            { id: 3, x: 28, y: 48, badge: 'จุดที่ 3' },
            { id: 4, x: 76, y: 34, badge: 'จุดที่ 4' },
            { id: 5, x: 46, y: 20, badge: 'จุดที่ 5' }
          ] as pin}
            {@const stage = stages.find((s) => s.id === pin.id)}
            {#if stage}
              {@const isCleared = clearedIds.includes(stage.id)}
              {@const isSelected = selectedPinId === stage.id}

              <button
                type="button"
                on:click={() => (selectedPinId = stage.id)}
                style="left: {pin.x}%; top: {pin.y}%;"
                class="-translate-x-1/2 -translate-y-1/2 absolute z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  class="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] sm:rounded-[18px] flex items-center justify-center font-black text-xs transition-all duration-200 {isCleared
                    ? 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white shadow-[0_8px_16px_rgba(22,163,74,0.35),inset_0_3px_5px_rgba(255,255,255,0.75)]'
                    : isSelected
                    ? 'bg-gradient-to-b from-[#FDE047] to-[#F59E0B] text-slate-950 scale-110 shadow-[0_10px_20px_rgba(245,158,11,0.38),inset_0_3px_5px_rgba(255,255,255,0.85)]'
                    : 'bg-white text-slate-900 shadow-[0_8px_16px_rgba(15,23,42,0.14),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-4px_7px_rgba(203,213,225,0.65)] group-hover:scale-105'}"
                >
                  {#if isCleared}
                    <Check class="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                  {:else}
                    <span>{stage.id}</span>
                  {/if}

                  {#if isCleared}
                    <span class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-300 border border-white text-[9px] font-black text-slate-950 flex items-center justify-center shadow-xs">
                      ★
                    </span>
                  {/if}
                </div>

                <span class="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black shadow-xs whitespace-nowrap {isSelected
                  ? 'bg-slate-900 text-white'
                  : 'bg-white/95 text-slate-800'}">
                  {isCleared ? stage.stampName : pin.badge}
                </span>
              </button>
            {/if}
          {/each}
        </div>

        <!-- การ์ดรายละเอียดจุดที่เลือกบนแผนที่ -->
        {#if selectedMapStage}
          {@const pinCleared = clearedIds.includes(selectedMapStage.id)}
          <div class="mt-3 rounded-[26px] bg-white/95 p-3.5 shadow-[0_12px_24px_rgba(15,23,42,0.08),inset_0_3px_6px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.55)] flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap {pinCleared
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'}">
                  {pinCleared ? `ได้ตรา: ${selectedMapStage.stampName}` : `จุดที่ ${selectedMapStage.id}`}
                </span>
                <span class="text-[10px] font-extrabold text-slate-500 truncate">
                  {selectedMapStage.gameLabel}
                </span>
              </div>
              <div class="text-sm font-black text-slate-900 truncate mt-1">
                {pinCleared ? selectedMapStage.zone : `เงาปริศนาจุดที่ ${selectedMapStage.id}`}
              </div>
              <div class="text-[11px] font-bold text-slate-500 truncate">
                {selectedMapStage.subtitle} • +20%
              </div>
            </div>

            <button
              type="button"
              on:click={() => openStage(selectedMapStage)}
              class="px-3.5 py-2.5 rounded-[18px] bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white font-black text-xs whitespace-nowrap shadow-[0_6px_14px_rgba(22,163,74,0.28),inset_0_2px_4px_rgba(255,255,255,0.65)] flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
            >
              <Navigation class="w-3.5 h-3.5" />
              {pinCleared ? 'เล่นซ้ำ' : 'เริ่มด่าน'}
            </button>
          </div>
        {/if}

        <!-- ปุ่มเปิดกาชา + Rebirth -->
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            disabled={progressPercent < 100}
            on:click={openGachaRoulette}
            class="flex-1 py-3 px-3 rounded-[22px] font-black text-xs flex items-center justify-center gap-1.5 whitespace-nowrap transition {progressPercent >= 100
              ? 'bg-gradient-to-b from-[#FDE047] to-[#F59E0B] text-slate-950 shadow-[0_10px_20px_rgba(245,158,11,0.3),inset_0_3px_5px_rgba(255,255,255,0.8),inset_0_-4px_8px_rgba(180,83,9,0.3)] active:scale-95 cursor-pointer'
              : 'bg-white/80 text-slate-500 shadow-[inset_0_2px_5px_rgba(148,163,184,0.35)] cursor-not-allowed'}"
          >
            <Sparkles class="w-4 h-4 shrink-0" />
            <span class="truncate">
              {progressPercent >= 100 ? 'เปิดกล่องกาชา' : `เกจ ${progressPercent}% (ครบ 100% เปิดกาชา)`}
            </span>
          </button>

          <button
            type="button"
            on:click={resetRound}
            class="px-3.5 py-3 rounded-[22px] bg-white text-slate-900 font-black text-xs whitespace-nowrap shrink-0 shadow-[0_8px_16px_rgba(15,23,42,0.08),inset_0_3px_5px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.55)] active:scale-95 cursor-pointer"
          >
            Rebirth
          </button>
        </div>

        {#if gachaReward}
          <div class="mt-2 rounded-[20px] bg-gradient-to-b from-[#34D399] to-[#059669] text-white px-3.5 py-2 text-xs font-extrabold text-center shadow-[0_8px_18px_rgba(5,150,105,0.28),inset_0_2px_4px_rgba(255,255,255,0.65)]">
            รางวัลรอบนี้: {gachaReward.emoji} {gachaReward.name}
          </div>
        {/if}
      </div>
    {/if}

    <!-- ================= แถบเมนูด้านล่าง ================= -->
    <div class="absolute bottom-5 left-0 right-0 px-6 flex items-center justify-between z-30">
      <div class="flex items-center bg-white rounded-full p-1.5 shadow-[0_12px_24px_rgba(15,23,42,0.12),inset_0_3px_6px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.6)]">
        <button
          type="button"
          on:click={() => (activeScreen = 'home')}
          title="หน้าหลัก"
          class="w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer {activeScreen === 'home'
            ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]'
            : 'text-slate-600 hover:bg-slate-100'}"
        >
          <Home class="w-4 h-4" />
        </button>

        <button
          type="button"
          on:click={() => (activeScreen = 'expedition')}
          title="แผนที่สำรวจ"
          class="w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer {activeScreen === 'expedition'
            ? 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]'
            : 'text-slate-600 hover:bg-slate-100'}"
        >
          <MapPin class="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        on:click={() => (activeScreen = 'expedition')}
        title="แผนที่ภารกิจ"
        class="w-13 h-13 rounded-full bg-gradient-to-b from-[#334155] to-[#0F172A] text-white shadow-[0_12px_24px_rgba(15,23,42,0.28),inset_0_3px_6px_rgba(255,255,255,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
      >
        <LayoutGrid class="w-5 h-5" />
      </button>

      <button
        type="button"
        on:click={() => (activeScreen = 'profile')}
        title="โปรไฟล์ & สถิติ"
        class="w-13 h-13 rounded-full bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12),inset_0_3px_6px_rgba(255,255,255,1),inset_0_-4px_8px_rgba(203,213,225,0.6)] flex items-center justify-center transition cursor-pointer {activeScreen === 'profile'
          ? 'bg-gradient-to-b from-[#FDE047] to-[#EAB308] text-slate-900 shadow-[inset_0_2px_4px_rgba(255,255,255,0.75)]'
          : 'text-slate-700 hover:bg-slate-100'}"
      >
        <Trophy class="w-4 h-4" />
      </button>
    </div>

    <!-- ================= โมดัลเปิดกล่องกาชาสไตล์ CS:GO Roulette ================= -->
    {#if showGachaModal}
      <div class="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="w-full rounded-[34px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 p-5 shadow-[0_28px_56px_rgba(0,0,0,0.55),inset_0_2px_6px_rgba(255,255,255,0.15)] border border-white/10 space-y-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black uppercase tracking-widest text-amber-400">
                BOTANICAL CASE OPENING
              </span>
              <h3 class="text-lg font-black text-white">สุ่มรางวัลนักล่าเงาพฤกษา</h3>
            </div>

            <button
              type="button"
              disabled={isSpinning}
              on:click={() => (showGachaModal = false)}
              class="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center cursor-pointer"
            >
              <X class="w-4 h-4 text-white" />
            </button>
          </div>

          <div
            bind:clientWidth={rouletteContainerWidth}
            class="relative h-36 rounded-[24px] bg-slate-950/90 border-2 border-amber-400/40 overflow-hidden flex items-center shadow-[inset_0_6px_20px_rgba(0,0,0,0.85)]"
          >
            <div
              class="flex items-center will-change-transform"
              style="gap: {CARD_GAP}px; transform: translate3d(-{rouletteOffset}px, 0, 0);"
            >
              {#each rouletteStrip as item, idx}
                <div
                  style="width: {CARD_WIDTH}px;"
                  class="shrink-0 h-28 rounded-2xl bg-gradient-to-b {item.cardBg} p-2.5 flex flex-col items-center justify-between relative overflow-hidden shadow-md {idx === WIN_INDEX && !isSpinning
                    ? 'ring-2 ring-amber-400 scale-105 transition-transform'
                    : ''}"
                >
                  <span class="text-[9px] font-black uppercase tracking-tight {item.textColor}">
                    {item.rarity}
                  </span>
                  <span class="text-3xl drop-shadow-xs">{item.emoji}</span>
                  <span class="text-[10px] font-extrabold text-slate-900 text-center leading-tight line-clamp-2">
                    {item.name}
                  </span>
                  <div class="absolute bottom-0 left-0 right-0 h-1.5 {item.barColor}"></div>
                </div>
              {/each}
            </div>

            <div class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-950 to-transparent z-10"></div>
            <div class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950 to-transparent z-10"></div>

            <div class="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-amber-400 shadow-[0_0_12px_#facc15] z-20">
              <div class="w-3 h-3 rotate-45 bg-amber-400 -ml-[4.5px] -mt-1.5"></div>
              <div class="w-3 h-3 rotate-45 bg-amber-400 -ml-[4.5px] absolute bottom-0 -mb-1.5"></div>
            </div>
          </div>

          {#if isSpinning}
            <div class="text-center py-2 text-xs font-extrabold text-amber-300 animate-pulse">
              กำลังเปิดกล่อง... ลุ้นรางวัลตรงเส้นสีทอง!
            </div>
          {:else if gachaReward}
            <div class="rounded-2xl bg-white/10 border border-amber-400/40 p-3.5 text-center space-y-1">
              <div class="text-[11px] font-black uppercase text-amber-300">
                UNLOCKED • {gachaReward.rarity}
              </div>
              <div class="text-base font-black text-white">
                {gachaReward.emoji} {gachaReward.name}
              </div>
            </div>

            <div class="flex gap-2">
              <button
                type="button"
                on:click={startRouletteSpin}
                class="flex-1 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-black text-xs cursor-pointer transition"
              >
                ลองหมุนเทสต์อีกครั้ง
              </button>
              <button
                type="button"
                on:click={() => (showGachaModal = false)}
                class="flex-1 py-3 rounded-2xl bg-gradient-to-b from-[#FDE047] to-[#F59E0B] text-slate-950 font-black text-xs cursor-pointer transition"
              >
                รับรางวัล & ปิด
              </button>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- ================= โมดัลมินิเกมหลายข้อสไตล์ Clay ================= -->
    {#if activeStage}
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div class="w-full rounded-[34px] bg-[#F8FAFC] p-5 shadow-[0_24px_48px_rgba(15,23,42,0.25),inset_0_4px_8px_rgba(255,255,255,1),inset_0_-6px_12px_rgba(203,213,225,0.6)] space-y-4 max-h-[88vh] overflow-y-auto">
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[11px] font-black uppercase tracking-wider text-sky-600">
                {activeStage.gameLabel}
              </span>
              <h3 class="text-lg font-black text-slate-900">{activeStage.zone}</h3>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                on:click={() => setupMiniGameForStage(activeStage.gameType)}
                title="สุ่มโจทย์ข้อใหม่"
                class="w-9 h-9 rounded-2xl bg-white shadow-[0_6px_12px_rgba(15,23,42,0.08),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.6)] flex items-center justify-center cursor-pointer active:scale-95"
              >
                <RefreshCw class="w-3.5 h-3.5 text-slate-700" />
              </button>
              <button
                type="button"
                on:click={() => (activeStage = null)}
                title="ปิดหน้าต่างเกม"
                class="w-9 h-9 rounded-2xl bg-white shadow-[0_6px_12px_rgba(15,23,42,0.08),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.6)] flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X class="w-4 h-4 text-slate-700" />
              </button>
            </div>
          </div>

          {#if !canPlayCurrentStage}
            <div class="rounded-[22px] bg-amber-100 text-amber-950 p-3.5 text-xs font-bold text-center space-y-2 shadow-[inset_0_2px_5px_rgba(217,119,6,0.2)]">
              <div>อยู่นอกจุดพื้นที่โล่งครับ</div>
              <button
                type="button"
                on:click={() => (bypassGpsForDev = true)}
                class="px-3.5 py-1.5 rounded-full bg-slate-900 text-lime-300 text-[11px] font-black cursor-pointer"
              >
                เปิดโหมดเทสต์เล่นเกมเลย
              </button>
            </div>

          {:else if activeStage.gameType === 'order' && currentOrderSet}
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>โจทย์: {currentOrderSet.title}</span>
                <span>{orderSelected.length}/{currentOrderSet.steps.length}</span>
              </div>
              <div class="grid grid-cols-1 gap-2">
                {#each currentOrderSet.steps as item}
                  {@const pickedIndex = orderSelected.findIndex((s) => s.id === item.id)}
                  <button
                    type="button"
                    on:click={() => pickOrderStep(item)}
                    class="w-full py-2.5 px-3.5 rounded-[20px] text-left text-xs font-extrabold flex items-center justify-between cursor-pointer active:scale-[0.99] transition {pickedIndex !== -1
                      ? 'bg-gradient-to-b from-[#BEF264] to-[#84CC16] text-slate-950 shadow-[0_6px_14px_rgba(132,204,22,0.28),inset_0_2px_4px_rgba(255,255,255,0.75)]'
                      : 'bg-white text-slate-800 shadow-[0_6px_14px_rgba(15,23,42,0.06),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.55)]'}"
                  >
                    <span>{item.label}</span>
                    {#if pickedIndex !== -1}
                      <span class="px-2 py-0.5 rounded-full bg-slate-900 text-lime-300 text-[10px]">
                        ลำดับ #{pickedIndex + 1}
                      </span>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>

          {:else if activeStage.gameType === 'swipe' && swipeDeck[swipeIndex]}
            <div class="space-y-3">
              <div class="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>ข้อที่ {swipeIndex + 1}/{swipeDeck.length} • ปัดซ้าย (มั่ว) / ขวา (จริง)</span>
                <span class="font-black text-emerald-700">ถูก {swipeScore}</span>
              </div>
              <div
                on:pointerdown={handlePointerDown}
                on:pointermove={handlePointerMove}
                on:pointerup={handlePointerUp}
                on:pointercancel={handlePointerUp}
                style="transform: translateX({swipeOffset}px) rotate({swipeOffset * 0.05}deg);"
                class="rounded-[28px] bg-gradient-to-b from-[#ECFDF5] to-[#D1FAE5] p-4 text-center shadow-[0_12px_22px_rgba(16,185,129,0.16),inset_0_4px_7px_rgba(255,255,255,0.9),inset_0_-5px_10px_rgba(16,185,129,0.2)] cursor-grab active:cursor-grabbing transition-transform"
              >
                <div class="text-[11px] font-black text-emerald-700 uppercase">Fact or Myth</div>
                <p class="mt-2 text-sm font-black text-slate-900 leading-snug">
                  "{swipeDeck[swipeIndex].statement}"
                </p>
              </div>
              <div class="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  on:click={() => answerSwipe(false)}
                  class="py-2.5 rounded-[20px] bg-gradient-to-b from-[#FECDD3] to-[#FDA4AF] text-rose-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_6px_14px_rgba(244,63,94,0.2),inset_0_2px_4px_rgba(255,255,255,0.75)] active:scale-95 cursor-pointer"
                >
                  <ArrowLeft class="w-4 h-4" /> มั่ว (ซ้าย)
                </button>
                <button
                  type="button"
                  on:click={() => answerSwipe(true)}
                  class="py-2.5 rounded-[20px] bg-gradient-to-b from-[#BEF264] to-[#84CC16] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_6px_14px_rgba(132,204,22,0.25),inset_0_2px_4px_rgba(255,255,255,0.75)] active:scale-95 cursor-pointer"
                >
                  จริง (ขวา) <ArrowRight class="w-4 h-4" />
                </button>
              </div>
            </div>

          {:else if activeStage.gameType === 'zoom' && currentZoomPuzzle}
            <div class="space-y-3">
              <div class="flex items-center justify-between text-xs font-bold text-slate-600">
                <span class="truncate pr-2">{currentZoomPuzzle.prompt}</span>
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    on:click={() => (zoomLevel = Math.max(1, +(zoomLevel - 0.5).toFixed(1)))}
                    title="ซูมออก"
                    class="p-1.5 rounded-xl bg-white shadow-xs cursor-pointer"
                  >
                    <ZoomOut class="w-3.5 h-3.5" />
                  </button>
                  <span class="px-1.5 font-black text-slate-900">{zoomLevel}x</span>
                  <button
                    type="button"
                    on:click={() => (zoomLevel = Math.min(3.5, +(zoomLevel + 0.5).toFixed(1)))}
                    title="ซูมเข้า"
                    class="p-1.5 rounded-xl bg-white shadow-xs cursor-pointer"
                  >
                    <ZoomIn class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div class="h-36 rounded-[26px] bg-gradient-to-b from-[#FEF3C7] to-[#FDE68A] overflow-hidden flex items-center justify-center relative shadow-[inset_0_4px_10px_rgba(217,119,6,0.2)]">
                <div
                  style="transform: scale({zoomLevel});"
                  class="transition-transform duration-200 text-6xl select-none drop-shadow-md"
                >
                  {currentZoomPuzzle.emoji}
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2">
                {#each currentZoomPuzzle.choices as ch}
                  <button
                    type="button"
                    on:click={() => answerZoom(ch.id)}
                    class="py-2.5 px-2 rounded-[18px] bg-white hover:bg-amber-50 text-slate-900 font-black text-[11px] shadow-[0_6px_12px_rgba(15,23,42,0.07),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.55)] active:scale-95 cursor-pointer leading-tight"
                  >
                    {ch.label}
                  </button>
                {/each}
              </div>
            </div>

          {:else if activeStage.gameType === 'match' && currentMatchSet}
            <div class="space-y-2.5">
              <p class="text-xs font-bold text-slate-600">
                {currentMatchSet.title} (จับคู่ให้ครบ {currentMatchSet.pairs.length} คู่):
              </p>
              <div class="grid grid-cols-2 gap-2.5">
                <div class="space-y-2">
                  {#each currentMatchSet.pairs as p}
                    {@const done = matchedPairs.includes(p.id)}
                    <button
                      type="button"
                      disabled={done}
                      on:click={() => (selectedPlant = p)}
                      class="w-full py-2.5 px-3 rounded-[18px] text-xs font-black cursor-pointer transition {done
                        ? 'bg-lime-200 text-slate-500 shadow-[inset_0_2px_4px_rgba(101,163,13,0.2)]'
                        : selectedPlant?.id === p.id
                        ? 'bg-gradient-to-b from-[#60A5FA] to-[#2563EB] text-white shadow-[0_6px_12px_rgba(37,99,235,0.28),inset_0_2px_4px_rgba(255,255,255,0.6)]'
                        : 'bg-white text-slate-800 shadow-[0_6px_12px_rgba(15,23,42,0.06),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.5)]'}"
                    >
                      {p.plant} {done ? '✓' : ''}
                    </button>
                  {/each}
                </div>

                <div class="space-y-2">
                  {#each shuffledBenefits as b}
                    {@const done = matchedPairs.includes(b.id)}
                    <button
                      type="button"
                      disabled={done}
                      on:click={() => (selectedBenefit = b)}
                      class="w-full py-2.5 px-3 rounded-[18px] text-[11px] font-extrabold cursor-pointer transition {done
                        ? 'bg-lime-200 text-slate-500 shadow-[inset_0_2px_4px_rgba(101,163,13,0.2)]'
                        : selectedBenefit?.id === b.id
                        ? 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white shadow-[0_6px_12px_rgba(22,163,74,0.28),inset_0_2px_4px_rgba(255,255,255,0.6)]'
                        : 'bg-white text-slate-800 shadow-[0_6px_12px_rgba(15,23,42,0.06),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.5)]'}"
                    >
                      {b.benefit}
                    </button>
                  {/each}
                </div>
              </div>
            </div>

          {:else if currentShadowPuzzle}
            <div class="space-y-3">
              <p class="text-xs font-bold text-slate-600 text-center">
                {currentShadowPuzzle.prompt}
              </p>
              <div class="h-28 rounded-[26px] bg-gradient-to-b from-[#ECFCCB] to-[#D9F99D] shadow-[inset_0_4px_9px_rgba(101,163,13,0.2)] flex items-center justify-center">
                <svg viewBox="0 0 140 80" class="w-36 h-20">
                  {#if currentShadowPuzzle.svgType === 'banana'}
                    <ellipse cx="70" cy="40" rx="52" ry="18" fill="#1E293B" transform="rotate(-12 70 40)" />
                    <line x1="18" y1="54" x2="122" y2="26" stroke="#ECFCCB" stroke-width="2.5" />
                  {:else if currentShadowPuzzle.svgType === 'palm'}
                    <path d="M70 68 L70 36 M70 42 L26 26 M70 40 L44 14 M70 38 L70 10 M70 40 L96 14 M70 42 L114 26" stroke="#1E293B" stroke-width="6" stroke-linecap="round" />
                  {:else}
                    <circle cx="70" cy="24" r="15" fill="#1E293B" />
                    <circle cx="48" cy="48" r="15" fill="#1E293B" />
                    <circle cx="92" cy="48" r="15" fill="#1E293B" />
                    <rect x="67" y="42" width="6" height="28" rx="3" fill="#1E293B" />
                  {/if}
                </svg>
              </div>
              <div class="grid grid-cols-1 gap-2">
                {#each currentShadowPuzzle.choices as ch}
                  <button
                    type="button"
                    on:click={() => answerShadow(ch.id)}
                    class="w-full py-2.5 px-4 rounded-[18px] bg-white hover:bg-lime-50 text-xs font-black text-slate-900 text-left shadow-[0_6px_12px_rgba(15,23,42,0.06),inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_6px_rgba(203,213,225,0.5)] active:scale-[0.99] transition cursor-pointer"
                  >
                    {ch.label}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          {#if gameFeedback}
            <p class="text-xs font-extrabold text-amber-900 bg-amber-100 rounded-[18px] px-3 py-2 text-center shadow-[inset_0_2px_4px_rgba(217,119,6,0.2)]">
              {gameFeedback}
            </p>
          {/if}

          <p class="text-[11px] font-semibold text-slate-600 bg-white rounded-[20px] p-3 leading-relaxed shadow-[inset_0_2px_5px_rgba(148,163,184,0.3)]">
            เกร็ดความรู้: {activeStage.fact}
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>