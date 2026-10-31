/* Isometric presentation of the live CAD model. Heights are illustrative, not telemetry. */
(() => {
  'use strict';
  let data, bridge, dialog, canvas, ctx, floor = '1F', scene = [], hits = [];
  const defaultPitch = Math.atan(1/Math.SQRT2);
  let zoom = 1, pan = { x:0, y:0 }, angle = 0, pitch = defaultPitch, selected = null, frame = 0;
  let fitExtent = null;
  let width = 1, height = 1, baseScale = 1, bounds, labels = true;
  const baseHeight = .22;
  const referenceCode = item => window.ChinChunModels?.referenceCode?.(item) || String(item.code || '').trim().toUpperCase();
  const factoryRise = 1.5;
  const pointers = new Map();
  let gesture = null;
  let legacyTouchBase=null;
  let detail = false;
  let restroomCutaway = true;
  let dieSite = null;
  let dieGround = null;
  let photoAccess = null;
  let groundCuts = [];
  let buildingRoof = false;
  let photoDirections = false;
  // Rendering preferences live only in this view, never in layoutData.
  let engineMode='three',threeView=null,threeSceneCache=null,threeNeedsFit=true,allFaces=false,engineError=false;
  let closeTwinMenus=()=>{};
  const usingThree=()=>engineMode==='three' && Boolean(threeView);
  const zh = {
    dieCutPhoto:'Die Cut（未編號）：機身與入料端全部在下方擴建區，不進入原建物；出料經原建物牆洞，送至 L4-1 左方收集區。此段已填高，室內比擴建區高 0.50 m（已確認），不套用其他區域的 1.5 m 高差。模型依八張照片示意，綠色帶面、白色壓床、深灰側罩、黃色護網與側控制櫃隨 2D 位置、占地及旋轉聯動。牆洞、收集桌、局部填高範圍及機高約 2.34 m 為示意，待量測；桌子不算機身。',
    dieCutDisconnected:'目前 2D 位置／方向與原建物牆面或 L4-1 左側不匹配，已停用穿牆連接示意，請回 2D 核對。',
    dieCutFeed:'擴建區入料',dieCutCollect:'原建物收集區 · L4-1 左方',dieCutOpening:'出料牆洞（示意）',dieCutLevel:'局部填高 · 高差 0.50 m',
    restroomCutaway:'外牆剖視',
    restroomNote:'廁所：四面牆，左牆中央單開門（暫按 0.90 m、向內開示意）；上方左牆有兩個小便斗，右側為三間各自有門的馬桶間，下方洗手台長 2.00 m。位置、占地及角度跟隨 2D。外牆剖視僅隱藏外牆與隔間上段以查看內部，可關閉查看完整四面牆；牆高暫以 2.4 m、隔間 1.8 m 示意，開門方向與未提供的部件尺寸待確認。',
    restroomCompact:'目前占地較小，無法按一般使用尺度完整容納此配置；此為位置示意，請核對實際廁所長寬。',
    a12Photo:'A1-2：依 2D PDF 及紅字照片建立六段，從圖面左側起：\n1 捲取頭 · 2 壓合輪 · 3 貼合頭\n4 滾輪架 · 5 烘箱 · 6 上膠頭\n烘箱側視照已確認為第五段。PDF 參考為 16.0 × 2.0 m；顯示尺寸、位置與角度仍跟隨目前 2D，不自動覆蓋圖面。第四段滾輪架放回正常直線位置，不含旁邊綠色推車、堆料、料卷、紙管或鄰機。最高約 2.55 m、各段長度比例與部件尺寸為照片估算。',
    g21Photo:'G2-1：已依指示將整台模型相對上一版旋轉 180°，保留中心位置與 2.40 × 4.19 m 占地；這是模型基準方向校正，之後的移動、尺寸與旋轉仍跟隨 2D。保留滾輪主機、開放料軸架、斜面控制櫃、刀架、氣缸與燈架；不含泡棉、料卷、紙管或鄰機。最高約 2.35 m 與部件比例為照片估算。',
    j12Photo:'J1-2：依四張照片建立大型分片工作台、深色木質延伸邊、米白門形機身、中央鋁製導尺、手輪、滑軌與低位馬達。不含泡棉、堆料、紙管、藍色棧板及鄰機。平面位置、4.45 × 4.57 m 占地與角度沿用原資料；最高約 2.30 m、部件比例及朝向仍為照片估算，待現場確認。',
    q23Photo:'Q2-3：依最新確認，整台 2.5D 模型相對上一版逆時針轉 90°，不翻轉、不拉伸，入料／出料標示與占地框同步旋轉。中心位置與原始平面資料不變；尺寸不變，旋轉後長寬方向互換。不含泡棉、紙管或綠色鄰機；最高約 2.30 m 及細部尺寸仍為照片估算。',
    q23Feed:'入料', q23Discharge:'出料',
    q21Photo:'Q2-1：暫依封閉底櫃照片建立銀色滾輪、棕色導輪、低位側邊操作台及燈架。機台編號對應與入出料方向待確認；不含泡棉、料卷或紙管。占地、位置及角度沿用原平面資料；最高約 2.35 m 為照片估算。',
    q22Photo:'Q2-2：依照片中 QA 002 標示建立開放機架、雙藍色固定滾輪、棕色導輪、氣缸支臂、獨立橘色控制箱及燈架。不含泡棉料片、料卷與紙管套筒。占地、位置及角度沿用原平面資料；最高約 2.35 m 為照片估算，入出料方向及細部尺寸待確認。',
    e1Photo:'E1-1／E1-2：依本組照片建立中央四柱壓床、兩端輸送帶、端部可調銀色滾輪、藍色液壓組及橘色側護罩。僅含機台，不含泡棉、模具堆料或周邊桌椅。各自保留原平面位置、尺寸與角度；最高約 3.0 m 為照片估算，個別照片對應、入出料朝向及細部尺寸待確認。',
    b12Photo:'B1-1／B1-2：依本組照片建立三支大型灰色／金屬滾輪、橘色側護板、導輪、木色工作台及上方燈架。兩台各自沿用平面位置、占地及角度；不含泡棉、料卷、紙管、推車或鄰機。最高約 2.3 m 為照片估算；個別照片對應、朝向與細部尺寸待確認。',
    b14Photo:'B1-4：已確認與 B1-3 同型，使用相同的雙灰色滾輪、導輪、品檢台及燈架模型。不含泡棉與紙管，位置、占地及旋轉沿用 B1-4 自己的平面資料；最高約 2.3 m 為照片估算。',
    b13Photo:'B1-3：依三張照片建立雙灰色滾輪、棕色導輪、銀色品檢台及深灰色燈架。僅含機台本體，不含泡棉、紙管、推車或鄰機。占地沿用平面圖；最高約 2.3 m 為照片估算，方向與細部尺寸待確認。',
    g2Photo:'G2-2：依五張照片建立設備本體，不含泡棉、料卷或紙材。占地沿用平面圖；最高約 2.3 m 為照片估算，方向與細部尺寸待確認。',
    f1Photo:'F1-1：捲料軸位於平面圖右端，最高約 2.8 m（已確認）。僅顯示機台結構，不含泡棉材料。橘紅護欄、上層走台、直梯與滾輪依六張照片建模；其餘尺寸為照片估算。',
    title:'廠房數位孿生', close:'返回平面圖', floor:'樓層', fit:'全覽', rotate:'右轉90°', orbitLeft:'左轉90°', tiltUp:'俯視＋', tiltDown:'俯視−', resetView:'重設視角', cameraAngle:'水平', cameraPitch:'俯仰', labels:'設備標籤',
    select:'選取物件', all:'選擇設備／柱子／牆面', empty:'點選場景中的物件，查看尺寸與位置。', edit:'在平面圖編輯',
    note:'2D 為主、配置同步 · 視角操作不改動機台尺寸或方向 · 一般廠內外高差約 1.5 m（局部例外詳設備） · 未接入即時機台訊號', help:'拖曳平移 · 滾動縮放 · ⌘／Shift＋滾動：左右旋轉 · ⌥＋滾動：上下俯仰 · 方向鍵：左右旋轉／上下俯仰 · 0 重設視角 · Esc 返回',
    equipment:'設備', column:'柱子', wall:'牆面', aisle:'走道', zone:'夾層區域', size:'平面尺寸', position:'座標', rotation:'角度', count:'物件',
    updated:'已載入目前圖面', floor1:'1F 主廠房', floor2:'2F 夾層', focus:'設備特寫', photo:'烘箱頂部 2.40 m（已確認）\n平面圖左側收料、右側入料\n其餘部件比例為照片估算', a1Photo:'A1-1 依新照片重畫：右端綠色輸送帶入料，經加工滾輪與靠右的大輪，帶材斜向左端取料滾輪。方向已確認；部件尺寸與高度仍是照片估算。', a1Entrance:'入料（綠色輸送帶）', a1Collection:'取料（銀色滾輪）', feed:'入料（兩人端）', collect:'收料（一人端）', ramp:'坡道高差：約 1.50 m（廠內高、廠外低）', rampInside:'廠內 +1.5m', rampOutside:'廠外 0m', officeSteps:'辦公室入口台階跟隨 DOOR-1800 位置；階高為照片示意，待現場量測。', dockSite:'西側上貨月台依照片示意；廠內高於外側約 1.5 m。'
  };
  const th = {
    dieCutPhoto:'Die Cut (ยังไม่มีหมายเลข): ตัวเครื่องและจุดป้อนอยู่ในอาคารต่อเติมด้านล่างทั้งหมด ไม่เข้าอาคารเดิม ส่งงานผ่านช่องผนังไปยังพื้นที่รับงานด้านซ้ายของ L4-1 บริเวณนี้ถมพื้นแล้ว ต่างระดับเพียง 0.50 ม. (ยืนยันแล้ว) ไม่ใช้ระดับต่าง 1.5 ม. ของบริเวณอื่น จำลองจากภาพ 8 ภาพ มีสายพานเขียว เครื่องกดขาว ฝาข้างเทาเข้ม รั้วเหลืองและตู้ควบคุม ตามตำแหน่ง ขนาดฐานและมุมใน 2D ขนาดช่อง โต๊ะ พื้นถมเฉพาะจุดและความสูงเครื่องประมาณ 2.34 ม. เป็นภาพประมาณ รอวัดจริง โต๊ะไม่ใช่ตัวเครื่อง',
    dieCutDisconnected:'ตำแหน่ง/ทิศใน 2D ไม่ตรงกับผนังหรือพื้นที่ซ้ายของ L4-1 จึงไม่แสดงการเชื่อมผ่านผนัง กรุณาตรวจแปลน 2D',
    dieCutFeed:'ป้อนเข้าในอาคารต่อเติม',dieCutCollect:'พื้นที่รับงานในอาคารเดิม · ซ้าย L4-1',dieCutOpening:'ช่องส่งงาน (ประมาณ)',dieCutLevel:'พื้นถมเฉพาะจุด · ต่าง 0.50 ม.',
    restroomCutaway:'ตัดผนังดูภายใน',
    restroomNote:'ห้องน้ำ: มีผนังสี่ด้าน ประตูบานเดี่ยวกลางผนังซ้าย (สมมติ 0.90 ม. เปิดเข้า) ด้านบนชิดผนังซ้ายมีโถปัสสาวะ 2 ใบ ด้านขวาเป็นห้องส้วมแยก 3 ห้อง แต่ละห้องมีประตู ด้านล่างเป็นอ่างล้างมือยาว 2.00 ม. ตำแหน่ง ขนาดพื้นที่และมุมตามแปลน 2D โหมดตัดผนังซ่อนเฉพาะส่วนบนเพื่อดูภายใน ปิดโหมดเพื่อดูผนังครบสี่ด้าน ความสูงผนังสมมติ 2.4 ม. และผนังกั้น 1.8 ม.; ทิศเปิดประตูและขนาดส่วนที่ไม่ได้ระบุต้องยืนยัน',
    restroomCompact:'พื้นที่ปัจจุบันเล็กเกินกว่าจะจัดทั้งหมดตามขนาดใช้งานทั่วไป ภาพแสดงตำแหน่งเท่านั้น กรุณาตรวจสอบขนาดห้องน้ำจริง',
    a12Photo:'A1-2: จำลอง 6 ช่วงตาม PDF แปลน 2D และข้อความสีแดงในภาพ เรียงจากซ้ายของแปลน:\n1 ชุดม้วนเก็บ · 2 ลูกกลิ้งกด · 3 หัวลามิเนต\n4 โต๊ะลูกกลิ้ง · 5 เตาอบ · 6 หัวทากาว\nยืนยันแล้วว่าภาพด้านข้างเตาอบเป็นช่วงที่ 5 ขนาดอ้างอิง PDF 16.0 × 2.0 ม.; ขนาด ตำแหน่งและมุมที่แสดงยังตามแปลน 2D ปัจจุบัน โดยไม่เขียนทับแปลน ช่วงที่ 4 อยู่ในแนวใช้งานปกติ ไม่รวมรถเข็นสีเขียวข้างเครื่อง วัสดุ ม้วน แกนกระดาษหรือเครื่องข้างเคียง ความสูงสูงสุดประมาณ 2.55 ม. และสัดส่วนแต่ละช่วงประมาณจากภาพ',
    g21Photo:'G2-1: หมุนทั้งเครื่อง 180° จากรุ่นก่อนตามคำยืนยัน คงจุดศูนย์กลางและขนาดฐาน 2.40 × 4.19 ม. เป็นการปรับทิศตั้งต้นของแบบ การย้าย ปรับขนาดและหมุนต่อไปยังคงตามแปลน 2D มีตู้ลูกกลิ้ง ชุดแกนม้วนแบบเปิด ตู้ควบคุมลาดเอียง ชุดใบมีด กระบอกลมและโครงไฟ ไม่รวมโฟม ม้วนวัสดุ แกนกระดาษหรือเครื่องข้างเคียง ความสูงประมาณ 2.35 ม. และสัดส่วนเป็นการประมาณจากภาพ',
    j12Photo:'J1-2: สร้างจากภาพ 4 ภาพ มีโต๊ะขนาดใหญ่แบบแยกแผ่น ขอบต่อไม้สีเข้ม โครงซุ้มสีครีม รั้วนำอะลูมิเนียมตรงกลาง มือหมุน รางเลื่อนและมอเตอร์ด้านล่าง ไม่รวมโฟม วัสดุสะสม แกนกระดาษ พาเลทสีฟ้าหรือเครื่องข้างเคียง คงตำแหน่ง ขนาดฐาน 4.45 × 4.57 ม. และมุมตามแปลนเดิม ความสูงประมาณ 2.30 ม. สัดส่วนและทิศทางเป็นการประมาณจากภาพ รอยืนยันหน้างาน',
    q23Photo:'Q2-3: ตามคำยืนยันล่าสุด หมุนแบบ 2.5D ทั้งเครื่องทวนเข็มนาฬิกา 90° จากรุ่นก่อน ไม่สะท้อนหรือยืดแบบ ป้ายป้อนเข้า/รับงานออกและกรอบฐานหมุนพร้อมกัน จุดศูนย์กลางและข้อมูลแปลนเดิมไม่เปลี่ยน ขนาดเดิมคงอยู่แต่แนวยาว/กว้างสลับกัน ไม่รวมโฟม แกนกระดาษหรือเครื่องสีเขียวข้างเคียง ความสูงประมาณ 2.30 ม. และรายละเอียดเป็นการประมาณจากภาพ',
    q23Feed:'ป้อนเข้า', q23Discharge:'รับงานออก',
    q21Photo:'Q2-1: ใช้ภาพเครื่องฐานตู้ปิดเป็นข้อมูลชั่วคราว มีลูกกลิ้งโลหะ ลูกกลิ้งนำสีน้ำตาล คอนโซลข้างแบบต่ำและโครงไฟ การจับคู่รหัสกับภาพและทิศทางงานต้องยืนยัน ไม่รวมโฟม ม้วนวัสดุหรือแกนกระดาษ คงตำแหน่ง ขนาดฐานและมุมตามแปลน สูงประมาณ 2.35 ม. จากภาพ',
    q22Photo:'Q2-2: อ้างอิงป้าย QA 002 ในภาพ มีโครงเปิด ลูกกลิ้งเครื่องสีน้ำเงินคู่ ลูกกลิ้งนำสีน้ำตาล แขนกระบอกลม ตู้ควบคุมสีส้มแยกและโครงไฟ ไม่รวมแผ่นโฟม ม้วนวัสดุหรือปลอกกระดาษ คงตำแหน่ง ขนาดฐานและมุมตามแปลน สูงประมาณ 2.35 ม. จากภาพ ทิศทางงานและรายละเอียดต้องยืนยัน',
    e1Photo:'E1-1 / E1-2: จำลองจากภาพชุดนี้ มีแท่นกดสี่เสากลางเครื่อง สายพานสองปลาย ลูกกลิ้งโลหะปรับระดับ ชุดไฮดรอลิกสีน้ำเงินและฝาครอบข้างสีส้ม ไม่รวมโฟม กองแม่พิมพ์ โต๊ะหรือเก้าอี้รอบเครื่อง แต่ละเครื่องคงตำแหน่ง ขนาดและมุมตามแปลน สูงประมาณ 3.0 ม. จากภาพ การจับคู่ภาพ ทิศทางป้อนและรับงานและรายละเอียดต้องยืนยัน',
    b12Photo:'B1-1 / B1-2: จำลองโครงสร้างร่วมจากภาพชุดนี้ มีลูกกลิ้งใหญ่สีเทาและโลหะ 3 ลูก ฝาครอบข้างสีส้ม ลูกกลิ้งนำ โต๊ะสีไม้และโครงไฟ แต่ละเครื่องคงตำแหน่ง ขนาดฐานและมุมตามแปลน ไม่รวมโฟม ม้วนวัสดุ แกนกระดาษ รถเข็นหรือเครื่องข้างเคียง สูงประมาณ 2.3 ม. จากภาพ การจับคู่ภาพกับแต่ละเครื่อง ทิศทางและรายละเอียดต้องยืนยัน',
    b14Photo:'B1-4: ยืนยันว่าเป็นเครื่องชนิดเดียวกับ B1-3 ใช้แบบลูกกลิ้งสีเทาคู่ ลูกกลิ้งนำ โต๊ะตรวจและโครงไฟเดียวกัน ไม่รวมโฟมหรือแกนกระดาษ ตำแหน่ง ขนาดฐานและมุมหมุนยึดตามแปลนของ B1-4 เอง ความสูงประมาณ 2.3 ม. จากภาพถ่าย',
    b13Photo:'B1-3: จำลองจากภาพ 3 ภาพ มีลูกกลิ้งสีเทาคู่ ลูกกลิ้งนำสีน้ำตาล โต๊ะตรวจสีเงินและโครงไฟสีเทาเข้ม เฉพาะตัวเครื่อง ไม่รวมโฟม แกนกระดาษ รถเข็นหรือเครื่องข้างเคียง ขนาดฐานตามแปลน ความสูงประมาณ 2.3 ม. ทิศทางและรายละเอียดต้องยืนยัน',
    g2Photo:'G2-2: จำลองจากภาพ 5 ภาพ เฉพาะเครื่อง ไม่รวมวัสดุ ขนาดฐานตามแปลน ความสูงประมาณ 2.3 ม. และทิศทางยังไม่ยืนยัน',
    f1Photo:'F1-1: แกนม้วนอยู่ปลายขวาของแปลน สูงสุดประมาณ 2.8 ม. (ยืนยันแล้ว) แสดงเฉพาะโครงสร้างเครื่อง ไม่รวมวัสดุโฟม ราวสีส้ม ทางเดินด้านบน บันไดและลูกกลิ้งจำลองจากภาพ 6 ภาพ ขนาดส่วนอื่นประมาณจากภาพ',
    title:'ดิจิทัลทวินโรงงาน', close:'กลับแปลน', floor:'ชั้น', fit:'ดูทั้งหมด', rotate:'ขวา90°', orbitLeft:'ซ้าย90°', tiltUp:'มุมก้ม＋', tiltDown:'มุมก้ม−', resetView:'คืนมุมมอง', cameraAngle:'แนวราบ', cameraPitch:'มุมก้ม', labels:'ป้ายอุปกรณ์',
    select:'เลือกวัตถุ', all:'เลือกอุปกรณ์ / เสา / ผนัง', empty:'คลิกวัตถุเพื่อดูขนาดและตำแหน่ง', edit:'แก้ไขในแปลน',
    note:'ยึดแปลน 2D · กล้องไม่เปลี่ยนขนาดหรือทิศเครื่อง · ต่างระดับทั่วไปประมาณ 1.5 ม. (ข้อยกเว้นดูรายละเอียดเครื่อง) · ยังไม่มีสัญญาณเครื่องสด', help:'ลากเลื่อน · ล้อซูม · ⌘/Shift＋เลื่อน: หมุนซ้ายขวา · ⌥＋เลื่อน: ปรับมุมก้ม · ลูกศร: ซ้ายขวาหมุน/ขึ้นลงปรับมุม · 0 คืนมุมมอง · Esc กลับ',
    equipment:'อุปกรณ์', column:'เสา', wall:'ผนัง', aisle:'ทางเดิน', zone:'พื้นที่ชั้นลอย', size:'ขนาดแปลน', position:'พิกัด', rotation:'มุม', count:'วัตถุ',
    updated:'โหลดแปลนปัจจุบันแล้ว', floor1:'1F โรงงาน', floor2:'2F ชั้นลอย', focus:'ดูอุปกรณ์ระยะใกล้', photo:'ด้านบนเตาอบ 2.40 ม. (ยืนยันแล้ว)\nในแปลน: รับงานออกด้านซ้าย ป้อนเข้าด้านขวา\nสัดส่วนชิ้นส่วนอื่นประมาณจากภาพ', a1Photo:'วาด A1-1 ใหม่จากภาพล่าสุด: ป้อนวัสดุจากสายพานสีเขียวด้านขวา ผ่านลูกกลิ้งและดรัมใหญ่ที่อยู่ค่อนไปทางขวา แล้วแผ่นวัสดุลาดไปยังลูกกลิ้งรับงานด้านซ้าย ทิศทางยืนยันแล้ว แต่ขนาดและความสูงยังเป็นการประมาณจากภาพ', a1Entrance:'ป้อนเข้า (สายพานสีเขียว)', a1Collection:'รับงาน (ลูกกลิ้งสีเงิน)', feed:'ป้อนเข้า (ฝั่งสองคน)', collect:'รับงานออก (ฝั่งหนึ่งคน)', ramp:'ทางลาดต่างระดับประมาณ 1.50 ม. (ด้านในสูงกว่าด้านนอก)', rampInside:'ภายใน +1.5 ม.', rampOutside:'ภายนอก 0 ม.', officeSteps:'ขั้นทางเข้าสำนักงานยึดตำแหน่ง DOOR-1800; ความสูงเป็นภาพจำลองจากรูปถ่าย ต้องวัดจริง', dockSite:'ท่าโหลดฝั่งตะวันตกจำลองจากรูปถ่าย; พื้นในสูงกว่าด้านนอกประมาณ 1.5 ม.'
  };
  Object.assign(zh,{
    c11Photo:'C1-1（沖孔機一）：依 PDF 箭頭所標照片方位建立。平面圖左側雙放料架，接上升送料架、中央門形沖孔主機、右側導輪與收料架；大飛輪及橘色側護罩在圖面下側。保留空料軸、雙缸與回位彈簧、上方導輪架、側控制台及固定橘色走台。位置、占地與角度跟隨目前 2D；最高約 3.15 m、各段比例及細部尺寸為照片估算，待量測。',
    c11Feed:'雙放料架 · 入料',c11Press:'沖孔主機',c11Discharge:'收料架'
  });
  Object.assign(th,{
    c11Photo:'C1-1 (เครื่องเจาะรู 1): สร้างตามทิศมองของภาพที่ลูกศรใน PDF ระบุ จากซ้ายแปลนเป็นชุดคลายม้วนคู่ ชุดป้อนลาดขึ้น เครื่องเจาะโครงซุ้มตรงกลาง ชุดลูกกลิ้งนำและม้วนเก็บด้านขวา ล้อช่วยแรงใหญ่และฝาข้างสีส้มอยู่ด้านล่างแปลน มีแกนเปล่า กระบอกคู่ สปริงคืน โครงลูกกลิ้งด้านบน คอนโซลข้างและทางเดินสีส้มติดเครื่อง ตำแหน่ง ขนาดฐานและมุมตาม 2D ปัจจุบัน สูงประมาณ 3.15 ม. สัดส่วนและรายละเอียดประมาณจากภาพ รอวัดจริง',
    c11Feed:'ชุดคลายม้วนคู่ · ป้อนเข้า',c11Press:'เครื่องเจาะรู',c11Discharge:'ชุดม้วนเก็บ'
  });
  zh.buildingRoof='外棚屋頂';th.buildingRoof='หลังคาอาคารต่อเติม';
  zh.engine='顯示引擎';th.engine='ตัวแสดงผล';
  zh.threeEngine='Three.js · 正交';th.threeEngine='Three.js · ออร์โธกราฟิก';
  zh.legacyEngine='舊版對照';th.legacyEngine='รุ่นเดิมสำหรับเทียบ';
  zh.topView='正上方俯視';th.topView='มองจากด้านบน';
  Object.assign(zh,{viewMenu:'視角',displayMenu:'顯示',infoMenu:'資訊',menuClose:'收合',closeControls:'收合選項'});
  Object.assign(th,{viewMenu:'มุมมอง',displayMenu:'แสดง',infoMenu:'ข้อมูล',menuClose:'ย่อ',closeControls:'ย่อเมนู'});
  zh.threeHelp='觸控：單指平移 · 雙指左右滑動／扭轉旋轉、上下滑動調俯視、張合縮放。滑鼠：左鍵平移 · 右鍵旋轉 · 滾動縮放 · ⌘／Shift＋滾動：左右旋轉 · ⌥＋滾動：上下俯仰 · 0 重設';
  th.threeHelp='สัมผัส: นิ้วเดียวเลื่อน · สองนิ้วลากซ้ายขวา/บิดเพื่อหมุน ลากขึ้นลงปรับมุมก้ม กาง/หุบเพื่อซูม เมาส์: ลากซ้ายเลื่อน · ลากขวาหมุน · ล้อซูม · ⌘/Shift＋ล้อหมุน · ⌥＋ล้อปรับมุมก้ม · 0 คืนมุม';
  zh.help='觸控：單指平移 · 雙指滑動／扭轉調整視角、張合縮放。'+zh.help;
  th.help='สัมผัส: นิ้วเดียวเลื่อน · สองนิ้วลาก/บิดปรับมุมมอง กาง/หุบซูม '+th.help;
  zh.threeReady='Three.js 正交相機 · 2D 資料唯讀';th.threeReady='กล้องออร์โธกราฟิก Three.js · อ่านข้อมูล 2D เท่านั้น';
  zh.threeFailed='此裝置無法啟動 Three.js，已切回舊版；2D 資料未更動。';th.threeFailed='เริ่ม Three.js ไม่ได้ จึงใช้รุ่นเดิม ข้อมูล 2D ไม่เปลี่ยน';
  zh.photoDirections='照片方位';th.photoDirections='ทิศทางจากภาพ';
  zh.photoFeed='入料端';th.photoFeed='ป้อนเข้า';
  zh.photoDischarge='出料端';th.photoDischarge='รับงานออก';
  zh.d11Discharge='出料 · 上升輸送帶';th.d11Discharge='รับงานออก · สายพานยกขึ้น';
  zh.rackPhoto='PL-1／PL-2：照片紅字確認為黑色鋼製貨架，不再畫成實心棧板塊。保留柱、橫梁、斜撐與固定層板，不含托盤、泡棉、包材、推車或存料。各自位置、占地與角度跟隨2D；約4.8米高度、層距與構件尺寸為照片估算，待量測。';
  th.rackPhoto='PL-1 / PL-2: ข้อความในภาพยืนยันว่าเป็นชั้นเหล็กสีดำ ไม่ใช่แท่นตัน จำลองเสา คาน ค้ำยันและแผ่นชั้นถาวร ไม่รวมถาด โฟม หีบห่อ รถเข็นหรือวัสดุ ตำแหน่ง ขนาดฐานและมุมตาม 2D ความสูงประมาณ 4.8 ม. ระยะชั้นและขนาดชิ้นส่วนประมาณจากภาพ รอวัดจริง';
  zh.j13Photo='J1-3：依四張標注照片建立米白開放工作台、棕色固定延伸桌、左側橘色立柱、深色頂梁、導尺及右側獨立操作台；與J1-2分開建模。不含黑色泡棉、紙管、綠色推車或鄰機。沿用目前2D占地與角度，最高約2.4米及細部比例為照片估算，待量測。';
  th.j13Photo='J1-3: จำลองจากภาพระบุรหัส 4 ภาพ มีโต๊ะเปิดสีครีม ขอบโต๊ะไม้ถาวร เสาส้มซ้าย คานบนสีเข้ม รั้วนำและแผงควบคุมแยกด้านขวา เป็นคนละแบบกับ J1-2 ไม่รวมโฟม แกนกระดาษ รถเข็นเขียวหรือเครื่องข้างเคียง คงขนาดฐานและมุม 2D ปัจจุบัน สูงประมาณ 2.4 ม. และรายละเอียดประมาณจากภาพ รอวัดจริง';
  zh.d11Photo='D1-1：照片已區分短端入料與長上升輸送帶出料。新增米白機架、紅色側罩與飛輪、銀色滾輪、綠色刀座／帶面、馬達及紅色控制櫃。沿用目前2D占地與角度，輸送方向配合占地長邊，標示隨整機轉動；圖面實際朝向仍待核對，不改原CAD。最高約2.8米、輸送帶斜度與部件比例為照片估算。不含泡棉、料片、推車或鄰機。';
  th.d11Photo='D1-1: ภาพแยกจุดป้อนด้านสั้นกับสายพานยกขึ้นด้านรับงานออก มีโครงครีม ฝาครอบและล้อแดง ลูกกลิ้งโลหะ แถบมีด/สายพานเขียว มอเตอร์และตู้ควบคุมแดง คงขนาดฐานและมุม 2D ปัจจุบัน แนวลำเลียงตามด้านยาว ป้ายหมุนพร้อมเครื่อง ทิศจริงในแปลนยังรอตรวจ ไม่แก้ CAD สูงประมาณ 2.8 ม. มุมสายพานและรายละเอียดประมาณจากภาพ ไม่รวมโฟม แผ่นวัสดุ รถเข็นหรือเครื่องข้างเคียง';
  zh.weldingPhoto='Welding：使用者最新確認，D1-1左側綠色推車後方的設備就是這套Welding，不存在剛新增的D1-2機器。保留原Welding照片模型：固定木質入料桌、鋼製導輪、多氣缸壓合頭、紅側蓋、米黃色出料滾輪、低位控制櫃及上方框架。綠色板車、黑色板材、料卷與紙管均不是機器的一部分。與D1-1分開，不套用其上升輸送帶；不將錯誤D1-2模型改名套用。沿用Welding原2D位置、占地與角度，入出料標示隨整機轉動；照片左右關係不直接換算CAD位移。最高約2.35米及細部尺寸仍為照片估算。';
  th.weldingPhoto='Welding: ผู้ใช้ยืนยันล่าสุดว่าเครื่องหลังรถเข็นสีเขียวด้านซ้ายของ D1-1 คือ Welding ไม่มีเครื่อง D1-2 ที่เพิ่งเพิ่ม คงแบบ Welding เดิม: โต๊ะป้อนไม้ถาวร ลูกกลิ้งนำ ชุดกดหลายกระบอกลม ฝาแดง ลูกกลิ้งรับงานสีครีม ตู้ควบคุมต่ำและโครงด้านบน รถเข็นเขียว แผ่นดำ ม้วนวัสดุและแกนกระดาษไม่ใช่ส่วนของเครื่อง แยกจาก D1-1 ไม่มีสายพานยกขึ้น ไม่เปลี่ยนชื่อแบบ D1-2 ที่ผิดมาใช้ คงตำแหน่ง ขนาดฐานและมุม Welding เดิมใน 2D ป้ายป้อน/รับงานหมุนตามเครื่อง ไม่แปลงซ้ายขวาในภาพเป็นการย้าย CAD สูงประมาณ 2.35 ม. และรายละเอียดประมาณจากภาพ';
  zh.l41Photo='L4-1：使用者已確認未標編號的MANUAL照片就是這台。建立米白有散熱孔底櫃、四支導柱與圓形調整帽、寬壓頭、固定工作台、兩側紅色百葉罩、外露鏈輪／鏈條、側操作箱及燈架；不是擴建區未編號Die Cut，也不是E1自動機。沿用目前2D占地與角度；最高約2.55米及細部尺寸為照片估算。不含泡棉、模具、堆料或推車。';
  th.l41Photo='L4-1: ผู้ใช้ยืนยันว่าภาพ MANUAL ที่ไม่มีรหัสเป็นเครื่องนี้ มีตู้ฐานครีมพร้อมช่องระบาย เสานำ 4 เสา ฝาปรับทรงกลม หัวกดกว้าง โต๊ะถาวร ฝาข้างบานเกล็ดแดง โซ่/เฟือง ตู้ควบคุมข้างและโครงไฟ ไม่ใช่ Die Cut ไม่มีหมายเลขหรือ E1 อัตโนมัติ คงขนาดฐานและมุม 2D ปัจจุบัน สูงประมาณ 2.55 ม. และรายละเอียดประมาณจากภาพ ไม่รวมโฟม แม่พิมพ์ วัสดุหรือรถเข็น';
  zh.eva3Deferred='EVA 3：標注寫明「先不用建模，數據不足」，維持原2D占位，不新增照片模型。';
  th.eva3Deferred='EVA 3: ภาพระบุให้รอสร้างแบบเพราะข้อมูลไม่พอ คงพื้นที่ 2D เดิม ไม่มีแบบจากภาพเพิ่ม';
  zh.photoSiteNote='照片方位：橘色區往外看＝2D左，由左往內看＝2D右；綠色區由外往內看＝2D左。PL-1 左側為路面至外棚的斜坡；Die Cut 旁是樓梯與局部通行開口，保留門側牆面、半牆／窗口及橫樑。藍箭頭為上行方向；未量測的坡長、階深與開口尺寸均為照片示意。主管停車區沿原建物一側，PL-1／PL-2為貨架，中間留有空間，綠區旁為CNC Room。';
  th.photoSiteNote='ทิศภาพ: มองออกจากเขตส้มคือซ้าย 2D มองเข้าจากซ้ายคือขวา 2D มองเข้าจากภายนอกเขตเขียวคือซ้าย 2D ภาพเห็นทางลาดสองด้านและหลังคาต่างระดับ ที่จอดผู้บริหารชิดอาคารเดิม PL-1/PL-2 เป็นชั้นเก็บ มีช่องว่างระหว่างกัน ข้างเขตเขียวคือ CNC Room เพิ่มเฉพาะข้อความอ้างอิง ไม่ประมาณหรือเพิ่มขนาดทางลาด ช่องจอด ช่องผนังหรือห้องกั้น';
  zh.buildingNote='以使用者原繪圖為準：廠內隔間、牆線及柱位不採A3比例描繪。外棚邊界依紅線X35–100，最新增建X90–100。2D與2.5D共用資料，設備未搬動。地坪：原廠+1.50／外棚+1.00／路面0米；外棚縱深、棚高沿用示意值，未另行推算。';
  th.buildingNote='ยึดแปลนเดิมของผู้ใช้ ไม่ใช้ผนังประมาณจาก A3 ขอบภายนอกตามเส้นแดง X35–100 ส่วนต่อเติม X90–100 ใช้ข้อมูลเดียวกับ 2D ไม่ย้ายเครื่อง พื้นเดิม +1.50 / ภายนอก +1.00 / ถนน 0 ม. ความลึกและความสูงโครงคงค่าภาพประกอบเดิม ไม่ประมาณใหม่';
  Object.assign(zh,{live:'即時層',liveOff:'關',liveSim:'模擬',liveOn:'Gateway',liveCloud:'雲端資料庫',liveCloudLogin:'雲端資料庫（需登入）',liveCloudNote:'雲端資料：Supabase 最新機台狀態與 RTLS 位置，即時更新；超過 30 秒未更新視為離線。',run:'運轉',idle:'待機',setup:'換線',down:'停機',offline:'離線',person:'人員',forklift:'堆高機',cart:'台車',asset:'資產',workOrder:'工單',output:'產量',liveAge:'秒前',liveSimNote:'模擬資料：人員／堆高機沿 CAD 動線與走道移動，機台狀態隨機產生，非現場數據。',liveOnNote:'即時資料：IoT／MES 機台狀態與 RTLS 定位，僅顯示不寫入配置。'});
  Object.assign(th,{live:'ชั้นเรียลไทม์',liveOff:'ปิด',liveSim:'จำลอง',liveOn:'Gateway',liveCloud:'ฐานข้อมูลคลาวด์',liveCloudLogin:'ฐานข้อมูลคลาวด์ (ต้องเข้าสู่ระบบ)',liveCloudNote:'ข้อมูลคลาวด์: สถานะเครื่องและตำแหน่ง RTLS ล่าสุดจาก Supabase อัปเดตแบบเรียลไทม์ ไม่อัปเดตเกิน 30 วินาทีถือว่าออฟไลน์',run:'ทำงาน',idle:'รอ',setup:'เปลี่ยนงาน',down:'หยุด',offline:'ออฟไลน์',person:'พนักงาน',forklift:'รถยก',cart:'รถเข็น',asset:'ทรัพย์สิน',workOrder:'ใบสั่งงาน',output:'ผลผลิต',liveAge:'วินาทีที่แล้ว',liveSimNote:'ข้อมูลจำลอง: พนักงาน/รถยกเคลื่อนตามเส้นทางและทางเดินใน CAD สถานะเครื่องสุ่ม ไม่ใช่ข้อมูลหน้างาน',liveOnNote:'ข้อมูลเรียลไทม์: สถานะเครื่องจาก IoT/MES และตำแหน่ง RTLS แสดงผลเท่านั้น ไม่เขียนลงแปลน'});
  const t = key => (document.documentElement.lang.startsWith('th') ? th : zh)[key];
  Object.assign(zh,{site:'場地構造',connector:'原廠／外棚連接坡道',
    connectorNote:'依使用者黃線低端、紅線高端定位：由擴建棚 +1.00 m 往原廠 +1.50 m 上坡，高差 0.50 m。平面位置已改依確認電腦版的 CNC 聯絡通道（aisle_3），X86–89、Y40–45，寬 3.00 m；不再沿用舊手機底圖位置。坡長 5.00 m 為標示估算示意，非實測，不據此認定坡度。這是唯讀場地示意，不新增 2D 機台、不移動設備或隔間。',
    rampHigh:'紅線高端',rampLow:'黃線低端'});
  Object.assign(th,{site:'โครงสร้างพื้นที่',connector:'ทางลาดเชื่อมอาคารเดิม/ต่อเติม',
    connectorNote:'ตามเส้นเหลืองต่ำ/เส้นแดงสูง: ขึ้นจากอาคารต่อเติม +1.00 ม. สู่อาคารเดิม +1.50 ม. ต่าง 0.50 ม. ตำแหน่งยึดทางเดิน CNC (aisle_3) ในไฟล์คอมพิวเตอร์ที่ยืนยันแล้ว X86–89, Y40–45 กว้าง 3.00 ม. ไม่ใช้แปลนมือถือเดิม ระยะลาด 5.00 ม. ยังประมาณจากการขีด ไม่ใช่ค่ารังวัดหรือความชันยืนยัน เป็นภาพพื้นที่แบบอ่านอย่างเดียว ไม่เพิ่มเครื่องใน 2D ไม่ย้ายเครื่องหรือผนัง',
    rampHigh:'เส้นแดง ด้านสูง',rampLow:'เส้นเหลือง ด้านต่ำ'});
  const n = (v, fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  Object.assign(zh,{accessHigh:'高端',accessLow:'低端',accessRamp:'PL-1 左側外棚入口：依藍箭頭由路面 0 m 往外棚 +1.00 m 上坡。自既有物流走道往 PL-1 方向延伸，切齊外棚下緣；坡長為照片示意，非實測。',accessStairs:'Die Cut 旁為三階樓梯，往原廠方向上樓：外棚 +1.00 m → 原廠 +1.50 m，高差 0.50 m。保留門側牆面、鄰側半牆／窗口及上方橫樑，只留通行開口；不畫成整面敞開。門寬與階深為照片示意，非實測。'});
  Object.assign(th,{accessHigh:'ด้านสูง',accessLow:'ด้านต่ำ',accessRamp:'ทางเข้าภายนอกข้าง PL-1: ขึ้นจากถนน 0 ม. ไปยังพื้นอาคารภายนอก +1.00 ม. ตามลูกศรสีน้ำเงิน ขยายจากทางเดินเดิมไปทาง PL-1 จนเสมอขอบอาคารภายนอก ความยาวทางลาดเป็นภาพประมาณ ยังไม่วัดจริง',accessStairs:'ข้าง Die Cut เป็นบันได 3 ขั้น ขึ้นจากพื้นภายนอก +1.00 ม. ไปอาคารเดิม +1.50 ม. ต่าง 0.50 ม. คงผนังข้างประตู ผนังเตี้ย/ช่องหน้าต่างและคานเหนือประตู เปิดเฉพาะช่องเดินผ่าน ความกว้างประตูและระยะขั้นเป็นภาพประมาณ ยังไม่วัดจริง'});
  const isRamp = item => /^RAMP(?:-|$)/i.test(String(item?.code || ''));
  // The reference photo marks the office entrance at the south wall between X6 and X7.
  const isOfficeEntry = item => /^DOOR-1800$/i.test(String(item?.code || '')) && n(item.x)+n(item.width)/2>=20 && n(item.x)+n(item.width)/2<=35 && n(item.y)+n(item.height)/2>=37 && n(item.y)+n(item.height)/2<=42;
  const inFactory = p => p[0]>=0 && p[0]<=n(data?.grid?.factory_width,100) && p[1]>=0 && p[1]<=n(data?.grid?.factory_depth,40);
  const elevation = s => {
    if(floor!=='1F' || isRamp(s.item))return 0;
    if(s.type==='site')return 0;
    const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
    const buildingLevel=typeof window!=='undefined' && window.ChinChunBuilding?.floorLevel(data,center);
    if(typeof buildingLevel==='number')return buildingLevel;
    if(dieGround && s.item.id===dieGround.item.id && s.type==='equipment')return dieGround.outsideRise;
    return (inFactory(center) || isOfficeEntry(s.item) && center[0]>=0 && center[0]<=n(data?.grid?.factory_width,100) && center[1]>=-.5 && center[1]<=n(data?.grid?.factory_depth,40)+.5) ? factoryRise : 0;
  };
  function localize() {
    dialog.querySelectorAll('[data-twin-text]').forEach(el => { el.textContent = t(el.dataset.twinText); });
    updateEngineInfo();updateLiveButton();
  }
  function rect(item, centered=false) {
    const w = Math.max(.05,n(item.width, .5)), h = Math.max(.05,n(item.height,.5));
    const cx = n(item.x) + (centered ? 0 : w/2), cy = n(item.y) + (centered ? 0 : h/2);
    const a = n(item.rotation)*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
    return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>[cx+x*c-y*s,cy+x*s+y*c]);
  }
  function rebuild() {
    if (!data) return;
    fitExtent=null;
    dialog.querySelector('#twinFloor').value=floor;
    scene = [];
    photoAccess=floor==='1F'?window.ChinChunAccess?.get(data):null;
    groundCuts=floor==='1F'?(window.ChinChunAccess?.groundOpenings(data) || []):[];
    dieSite=floor==='1F'?window.ChinChunModels?.dieCutSite?.(data):null;
    // Camera/equipment rotation must not change the local ground level. A
    // disconnected orientation hides the material connection, not the fill.
    dieGround=dieSite || (floor==='1F'?window.ChinChunModels?.dieCutSite?.({...data,equipment:(data.equipment || []).map(q=>referenceCode(q)==='DIE CUT'?{...q,rotation:0}:q)}):null);
    const add = (item,type,points,z,color) => scene.push({item,type,points,z,color,model:type==='equipment'?window.ChinChunModels?.build(item):null});
    if(floor==='2F') (data.mezzanine_2f?.zones || []).forEach(item=>add(item,'zone',rect(item),.04,'#91afac'));
    (floor==='2F' ? data.equipment_2f || [] : data.equipment || []).forEach(item => {
      const category = item.category || '';
      const z = isRamp(item) ? factoryRise : category==='Door' ? (/ROLL/i.test(item.code || '') ? 2.7 : 2.1) : category==='Window' ? .25 : /Furniture|Office/.test(category) ? .9 : 1.7;
      const offset=window.ChinChunModels?.rotationOffset?.(item) || 0;
      const points=rect(offset?{...item,rotation:n(item.rotation)+offset}:item);
      if(floor==='1F' && /ROLL/i.test(item.code || '') && Math.abs(n(item.x))<1){
        const center=points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
        points.forEach(p=>{p[0]-=center[0];});
      }
      add(item,'equipment',points,z,item.color || '#719f95');
    });
    (data.columns || []).filter(item => !item.floor || item.floor===floor).forEach(item => add(item,'column',rect(item,true),3.2,'#b7c8b9'));
    (data.walls || []).filter(item => (item.floor || '1F')===floor).forEach(item => {
      const dx=n(item.x2)-n(item.x1), dy=n(item.y2)-n(item.y1), len=Math.hypot(dx,dy);
      if (len<.001) return;
      const a=dy/len*n(item.thickness,.2)/2,b=-dx/len*n(item.thickness,.2)/2;
      let segments=[[0,1]];
      // A loading shutter must be an opening in the west wall, not painted over a solid wall.
      const cuts=[];
      if(floor==='1F' && Math.abs(n(item.x1))<.35 && Math.abs(n(item.x2))<.35){
        const shutters=(data.equipment || []).filter(q=>q.category==='Door' && /ROLL/i.test(q.code || '') && Math.abs(n(q.x))<1);
        cuts.push(...shutters.flatMap(q=>{
          const ys=rect(q).map(p=>p[1]),lo=Math.min(...ys),hi=Math.max(...ys);
          return [[(lo-n(item.y1))/dy,(hi-n(item.y1))/dy]];
        }));
      }
      if(floor==='1F' && Math.abs(dy)<.01){
        (data.equipment || []).filter(isOfficeEntry).forEach(q=>{
          const door=rect(q),xs=door.map(p=>p[0]),ys=door.map(p=>p[1]);
          if(Math.abs((Math.min(...ys)+Math.max(...ys))/2-n(item.y1))<.4)
            cuts.push([(Math.min(...xs)-n(item.x1))/dx,(Math.max(...xs)-n(item.x1))/dx]);
        });
      }
      const opening=dieSite?.wall.id===item.id?dieSite.opening:null;
      if(opening)cuts.push([(opening.x-n(item.x1))/dx,(opening.x+opening.width-n(item.x1))/dx]);
      for(const cut of cuts){
        const lo=Math.min(...cut),hi=Math.max(...cut);
        if(hi<=0 || lo>=1)continue;
        segments=segments.flatMap(([a,b])=>{
          const start=Math.max(a,lo),end=Math.min(b,hi);
          return end<=start?[[a,b]]:[...(a<start?[[a,start]]:[]),...(end<b?[[end,b]]:[])];
        });
      }
      segments.forEach(([start,end],index)=>{
        const p=(t,side)=>[n(item.x1)+dx*t+a*side,n(item.y1)+dy*t+b*side];
        add(index?{...item,id:`${item.id}_part_${index}`}:item,'wall',[p(start,1),p(end,1),p(end,-1),p(start,-1)],item.type==='exterior'?2.8:2.4,'#ddd4b9');
      });
      if(opening){
        const lo=(opening.x-n(item.x1))/dx,hi=(opening.x+opening.width-n(item.x1))/dx;
        const p=(t,side)=>[n(item.x1)+dx*t+a*side,n(item.y1)+dy*t+b*side];
        for(const [part,base,top] of [['sill',0,opening.sill],['lintel',opening.top,item.type==='exterior'?2.8:2.4]]){
          add({...item,id:`${item.id}_diecut_${part}`},'wall',[p(lo,1),p(hi,1),p(hi,-1),p(lo,-1)],top,'#ddd4b9');
          scene.at(-1).zBase=base;
        }
      }
    });
    (data.aisles || []).filter(item => (item.floor || '1F')===floor).forEach(item=>add(item,'aisle',rect(item),.02,'#b7bd85'));
    const connector=floor==='1F' && window.ChinChunBuilding?.connectingRamp?.(data);
    if(connector)add(connector,'site',rect(connector),connector.ramp.high,'#c9b576');
    if(photoAccess?.ramp)add(photoAccess.ramp,'site',rect(photoAccess.ramp),photoAccess.ramp.ramp.high,'#dca84f');
    if(photoAccess?.stairs){
      const item=photoAccess.stairs;add(item,'site',rect(item),item.high,'#b5b3a8');
      scene.at(-1).model=window.ChinChunAccess.stairFaces(item);
    }
    const points=scene.flatMap(s=>s.points);
    const building=floor==='1F' && window.ChinChunBuilding?.get(data);
    if(building)for(const r of [building.main,building.annex])points.push([r.x,r.y],[r.x+r.width,r.y+r.height]);
    const indoor=floor==='1F' || !points.length;
    bounds={x0:Math.min(...(indoor?[0]:[]),...points.map(p=>p[0]))-4,y0:Math.min(...(indoor?[0]:[]),...points.map(p=>p[1]))-4,
      x1:Math.max(...(indoor?[n(data.grid?.factory_width,100)]:[]),...points.map(p=>p[0]))+4,y1:Math.max(...(indoor?[n(data.grid?.factory_depth,40)]:[]),...points.map(p=>p[1]))+4};
    selected=scene.find(s=>s.item.id===selected?.item.id) || null;
    if(!selected)detail=false;
    const list=dialog.querySelector('#twinObjects');
    list.replaceChildren(new Option(t('all'),''));
    scene.filter(s=>s.type!=='aisle').forEach(s=>list.add(new Option(`${s.item.code || s.item.name || s.item.id}`,s.item.id)));
    updateInfo();
    requestDraw();
  }
  function iso(x,y,z=0) {
    const a=angle*Math.PI/2,c=Math.cos(a),s=Math.sin(a),u=x*c-y*s,v=x*s+y*c;
    const scale=Math.sqrt(3/2),horizontal=scale/Math.SQRT2;
    return [(u-v)*horizontal,(u+v)*horizontal*Math.sin(pitch)-z*scale*Math.cos(pitch)];
  }
  function project(p,z=0) {
    if(usingThree())return threeView.project([p[0],p[1],z]).slice(0,2);
    const b=viewBounds(),v=iso(p[0],p[1],z), center=iso((b.x0+b.x1)/2,(b.y0+b.y1)/2,detail?1.3:0);
    return [width/2+pan.x+(v[0]-center[0])*baseScale*zoom,height/2+pan.y+(v[1]-center[1])*baseScale*zoom];
  }
  function shade(color, amount) {
    const hex=/^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : '719f95';
    return '#'+[0,2,4].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+amount)).toString(16).padStart(2,'0')).join('');
  }
  function polygon(points,fill,stroke='#34483f') {
    const path=new Path2D(); points.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p)); path.closePath();
    ctx.fillStyle=fill;ctx.fill(path);ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke(path); return path;
  }
  function requestDraw() {
    const status=dialog?.querySelector('#twinCameraStatus');
    const state=usingThree()?threeView.state():null;
    if(status)status.textContent=`${t('cameraAngle')} ${Math.round(state?state.yaw:angle*90)%360}° · ${t('cameraPitch')} ${Math.round(state?state.pitch:pitch*180/Math.PI)}°`;
    if(dialog?.open && !frame)frame=requestAnimationFrame(draw);
  }
  function fittedScale(b,viewportWidth,viewportHeight) {
    // Fit only on explicit fit/selection/layout changes. Orbit/tilt must not
    // silently zoom the scene as the projected width and height change.
    if(!fitExtent){
      const raw=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]].map(p=>iso(...p));
      fitExtent={x:Math.max(...raw.map(p=>p[0]))-Math.min(...raw.map(p=>p[0]))+12,
        y:Math.max(...raw.map(p=>p[1]))-Math.min(...raw.map(p=>p[1]))+14};
    }
    return Math.min(viewportWidth/fitExtent.x,viewportHeight/fitExtent.y)*.9;
  }
  function orbit(delta){if(usingThree())threeView.orbit(delta*Math.PI/2);else angle=((angle+delta)%4+4)%4;requestDraw();}
  function tilt(delta){if(usingThree())threeView.tilt(delta);else pitch=Math.max(Math.PI*25/180,Math.min(Math.PI*65/180,pitch+delta));requestDraw();}
  function resetView(){angle=0;pitch=defaultPitch;if(usingThree())threeView.reset();fit();}
  function cameraKey(e){
    if(e.target?.closest?.('input,select,textarea,[contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey)return;
    const step=5*Math.PI/180;
    switch(e.key){
      case 'ArrowLeft':orbit(-1/18);break;
      case 'ArrowRight':orbit(1/18);break;
      case 'ArrowUp':tilt(step);break;
      case 'ArrowDown':tilt(-step);break;
      case '0':resetView();break;
      default:return;
    }
    e.preventDefault();
  }
  function cameraWheel(e){
    e.preventDefault();
    const unit=e.deltaMode===1?16:e.deltaMode===2?height:1;
    const dx=e.deltaX*unit,dy=e.deltaY*unit;
    // Exactly one camera axis per gesture, even with a diagonal trackpad swipe.
    // Ambiguous modifier combinations do nothing rather than mixing axes.
    if(e.altKey && (e.metaKey || e.shiftKey))return;
    const delta=Math.abs(dx)>Math.abs(dy)?dx:dy;
    if(e.altKey)tilt(delta*.0025);
    else if(e.metaKey || e.shiftKey)orbit(delta*.0035);
    else {
      const r=canvas.getBoundingClientRect();
      zoomAt(Math.exp(-dy*.001),e.clientX-r.left,e.clientY-r.top);
    }
  }
  function viewBounds() {
    if(!detail || !selected)return bounds;
    const xs=selected.points.map(p=>p[0]),ys=selected.points.map(p=>p[1]);
    if(selected.item.code==='STAIR-DIECUT')for(const f of selected.model || [])for(const p of f.points){xs.push(p[0]);ys.push(p[1]);}
    if(dieSite && selected.item.id===dieSite.item.id){
      const r=dieSite.collection;xs.push(r.x,r.x+r.width);ys.push(r.y,r.y+r.height);
      const neighbor=scene.find(q=>referenceCode(q.item)==='L4-1');
      if(neighbor)for(const p of neighbor.points){xs.push(p[0]);ys.push(p[1]);}
    }
    if(isOfficeEntry(selected.item)){
      const entry=officeEntrance(selected);
      for(const p of [entry.edge(-entry.half,2.6),entry.edge(entry.half,2.6)]){xs.push(p[0]);ys.push(p[1]);}
    }
    if(selected.item.category==='Door' && /ROLL/i.test(selected.item.code || '') && Math.abs(n(selected.item.x))<1){xs.push(-2);ys.push(Math.min(...ys)-.5);}
    return {x0:Math.min(...xs)-1,y0:Math.min(...ys)-1,x1:Math.max(...xs)+1,y1:Math.max(...ys)+1};
  }
  function viewDepth(p) {
    const a=angle*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);
    const u=p[0]*c-p[1]*sn,v=p[0]*sn+p[1]*c;
    return (u+v)*Math.cos(pitch)/Math.SQRT2+p[2]*Math.sin(pitch);
  }
  function faceDepth(points) { return points.reduce((sum,p)=>sum+viewDepth(p),0)/points.length; }
  function faceColor(f) {
    let color=f.color;
    if(f.model){
      const [a,b,c]=f.points,u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
      const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...normal)||1;
      const light=(normal[0]*.25-normal[1]*.35+Math.abs(normal[2])*.65)/len;
      color=shade(color,Math.round(light*32)-8);
    }
    return color;
  }
  function drawFace(f) {
    const color=faceColor(f);
    const stroke=f.model?color:f.stroke || (f.s===selected?'#fff5ac':'#42574c');
    const path=polygon(f.points.map(p=>project(p,p[2])),color,stroke);
    if(!f.nonInteractive)hits.push({path,s:f.s});
  }
  let solidRenderer;
  function renderSolids(faces,dpr) {
    // Actual per-pixel depth handles a long rail crossing in front of and behind
    // columns. Sorting face centers cannot represent those relationships.
    if(solidRenderer===undefined){
      try {
        const surface=document.createElement('canvas');
        const gl=surface.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
        if(!gl)throw new Error('WebGL unavailable');
        const shader=(kind,source)=>{const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
        const program=gl.createProgram();
        gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec3 position; attribute vec3 color; varying vec3 tint; void main(){gl_Position=vec4(position,1.0);tint=color;}'));
        gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec3 tint; void main(){gl_FragColor=vec4(tint,1.0);}'));
        gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
        solidRenderer={surface,gl,program,buffer:gl.createBuffer(),position:gl.getAttribLocation(program,'position'),color:gl.getAttribLocation(program,'color')};
        surface.addEventListener('webglcontextlost',e=>{e.preventDefault();solidRenderer=undefined;requestDraw();});
      }catch(error){console.warn('Depth renderer unavailable; using canvas fallback.',error);solidRenderer=null;}
    }
    if(!solidRenderer){faces.sort((a,b)=>a.depth-b.depth).forEach(drawFace);return;}
    const {surface,gl,program,buffer,position,color}=solidRenderer;
    surface.width=Math.round(width*dpr);surface.height=Math.round(height*dpr);
    gl.viewport(0,0,surface.width,surface.height);gl.clearColor(0,0,0,0);gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    const depths=faces.flatMap(f=>f.points.map(viewDepth));
    let low=Infinity,high=-Infinity;for(const d of depths){low=Math.min(low,d);high=Math.max(high,d);}
    const span=Math.max(1,high-low),triangles=[],edges=[];
    const rgb=hex=>{const h=hex.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);};
    const vertex=(p,tint)=>{const q=project(p,p[2]);return[q[0]/width*2-1,1-q[1]/height*2,.9-1.8*(viewDepth(p)-low)/span,...tint];};
    for(const f of faces){
      const tint=rgb(faceColor(f)),vertices=f.points.map(p=>vertex(p,tint));
      for(let i=1;i<vertices.length-1;i++)triangles.push(...vertices[0],...vertices[i],...vertices[i+1]);
      if(!f.model){const edgeTint=rgb(f.stroke || (f.s===selected?'#fff5ac':'#42574c'));for(let i=0;i<f.points.length;i++)edges.push(...vertex(f.points[i],edgeTint),...vertex(f.points[(i+1)%f.points.length],edgeTint));}
    }
    gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(color);gl.vertexAttribPointer(color,3,gl.FLOAT,false,24,12);
    gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(triangles),gl.STREAM_DRAW);gl.drawArrays(gl.TRIANGLES,0,triangles.length/6);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(edges),gl.STREAM_DRAW);gl.drawArrays(gl.LINES,0,edges.length/6);
    ctx.drawImage(surface,0,0,width,height);
    // Preserve canvas hit targets independently of the depth-buffered image.
    faces.filter(f=>!f.nonInteractive).sort((a,b)=>a.depth-b.depth).forEach(f=>{const path=new Path2D();f.points.forEach((p,i)=>{const q=project(p,p[2]);i?path.lineTo(...q):path.moveTo(...q);});path.closePath();hits.push({path,s:f.s});});
  }
  function drawModelAnnotations(s,showCode=true) {
    const z=elevation(s);
    if(s.item.code==='STAIR-DIECUT'){
      if(showCode && (labels || s===selected)){
        const p=project(s.item.highPoint,s.item.high+.2);ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillStyle='#fff5d7';ctx.fillText(s.item.code,...p);
      }
      if(detail)for(const [point,key] of [[s.item.highPoint,'accessHigh'],[s.item.lowPoint,'accessLow']]){
        const p=project(point,point[2]+.15);ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#18332e';ctx.strokeText(`${t(key)} +${point[2].toFixed(2)} m`,...p);ctx.fillStyle='#f5e6b4';ctx.fillText(`${t(key)} +${point[2].toFixed(2)} m`,...p);
      }
      return;
    }
    if(s===selected){ctx.setLineDash([6,4]);ctx.lineWidth=2;ctx.strokeStyle='#ffe5a1';const path=new Path2D();s.points.forEach((p,i)=>i?path.lineTo(...project(p,z+.02)):path.moveTo(...project(p,z+.02)));path.closePath();ctx.stroke(path);ctx.setLineDash([]);}
    if(showCode && (labels || s===selected)){const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]),p=project(center,z+(window.ChinChunPhotoModels?.height(s.item) || 2.5)+.2);ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillStyle='#fff5d7';ctx.fillText(s.item.code,p[0],p[1]);}
    if(detail)for(const marker of [...(window.ChinChunPhotoModels?.markers(s.item) || []),...(window.ChinChunModels?.flowMarkers?.(s.item) || [])]){
      const p=project(marker.point,z+marker.point[2]);ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#18332e';ctx.strokeText(t(marker.key),...p);ctx.fillStyle='#fff5d7';ctx.fillText(t(marker.key),...p);
    }
    if(detail && dieSite && s.item.id===dieSite.item.id){
      const {feed,opening:o,collection:r}=dieSite;
      for(const [point,high,key] of [[feed,2.15,'dieCutFeed'],[[o.x+o.width/2,o.y],3.2,'dieCutOpening'],[[r.x+r.width/2,r.y],1.65,'dieCutCollect'],[[dieSite.pad.x+dieSite.pad.width/2,dieSite.pad.y+dieSite.pad.height],1.05,'dieCutLevel']]){
        const p=project(point,high);ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#18332e';ctx.strokeText(t(key),...p);ctx.fillStyle='#fff5d7';ctx.fillText(t(key),...p);
      }
    }
    if(detail && referenceCode(s.item)==='A1-2'){
      // Section markers use the same live-CAD transform as the six rigid units.
      for(const marker of window.ChinChunModels?.sectionMarkers?.(s.item) || []){
        const p=project(marker.point,z+marker.point[2]);
        ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.lineWidth=5;
        ctx.strokeStyle='#18332e';ctx.strokeText(String(marker.number),p[0],p[1]);
        ctx.fillStyle='#ffe5a1';ctx.fillText(String(marker.number),p[0],p[1]);
      }
    }
    if(detail && referenceCode(s.item)==='H1-1'){
      // Labels follow local CAD ends through both equipment and camera rotation.
      [[0,3,'collect'],[1,2,'feed']].forEach(([i,j,key])=>{
        const p=project([(s.points[i][0]+s.points[j][0])/2,(s.points[i][1]+s.points[j][1])/2],z+1.55);
        ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#18332e';ctx.strokeText(t(key),p[0],p[1]);ctx.fillStyle='#fff5d7';ctx.fillText(t(key),p[0],p[1]);
      });
    }
    if(detail && referenceCode(s.item)==='A1-1'){
      [[0,3,'a1Collection'],[1,2,'a1Entrance']].forEach(([i,j,key])=>{
        const p=project([(s.points[i][0]+s.points[j][0])/2,(s.points[i][1]+s.points[j][1])/2],z+1.55);
        ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#18332e';ctx.strokeText(t(key),p[0],p[1]);ctx.fillStyle='#fff5d7';ctx.fillText(t(key),p[0],p[1]);
      });
    }
    if(detail && referenceCode(s.item)==='Q2-3'){
      // Local left/right CAD edges move with equipment and camera rotation.
      [[0,3,'q23Discharge'],[1,2,'q23Feed']].forEach(([i,j,key])=>{
        const p=project([(s.points[i][0]+s.points[j][0])/2,(s.points[i][1]+s.points[j][1])/2],z+1.55);
        ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#18332e';ctx.strokeText(t(key),p[0],p[1]);ctx.fillStyle='#fff5d7';ctx.fillText(t(key),p[0],p[1]);
      });
    }
  }
  function drawGroundContact(s) {
    // A thin footprint shadow stays on the floor, independent of the object's height.
    let contact;
    if(s.type==='wall'){
      const [a,b,c,d]=s.points,dx=d[0]-a[0],dy=d[1]-a[1],length=Math.hypot(dx,dy)||1;
      const offset=[dx/length*.12,dy/length*.12];
      contact=[a.map((v,i)=>v-offset[i]),b.map((v,i)=>v-offset[i]),c.map((v,i)=>v+offset[i]),d.map((v,i)=>v+offset[i])];
    } else {
      const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
      contact=s.points.map(p=>[center[0]+(p[0]-center[0])*1.035,center[1]+(p[1]-center[1])*1.035]);
    }
    const path=new Path2D();contact.forEach((p,i)=>i?path.lineTo(...project(p,elevation(s)+.012)):path.moveTo(...project(p,elevation(s)+.012)));path.closePath();
    ctx.fillStyle='#263a35';ctx.globalAlpha=.35;ctx.fill(path);ctx.globalAlpha=1;
  }
  function wallFaces(s) {
    const [a,b,c,d]=s.points,length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const count=Math.max(1,Math.ceil(length/2));
    const lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
    const faces=[];
    for(let k=0;k<count;k++){
      // A tiny overlap prevents antialiased seams from showing as holes.
      const start=Math.max(0,(k-.015)/count),end=Math.min(1,(k+1+.015)/count);
      const footprint=[lerp(a,b,start),lerp(a,b,end),lerp(d,c,end),lerp(d,c,start)];
      const bottom=footprint.map(p=>[...p,s.zBase || 0]),top=footprint.map(p=>[...p,s.z]);
      for(let i=0;i<4;i++){
        if((i===1 && k<count-1)||(i===3 && k>0))continue;
        const j=(i+1)%4;
        if(allFaces || project(footprint[j],s.z)[0]<project(footprint[i],s.z)[0]){
          const points=[bottom[i],bottom[j],top[j],top[i]],color=shade(s.color,i%2?-45:-25);
          faces.push({s,points,color,stroke:color,depth:faceDepth(points)});
        }
      }
      faces.push({s,points:top,color:shade(s.color,25),stroke:shade(s.color,25),depth:faceDepth(top)});
    }
    return faces;
  }
  function columnFaces(s) {
    const faces=[],bands=[0,.8,1.6,2.4,s.z];
    for(let band=0;band<bands.length-1;band++){
      for(let i=0;i<4;i++){
        const j=(i+1)%4;
        if(!allFaces && project(s.points[j],s.z)[0]>=project(s.points[i],s.z)[0])continue;
        const points=[[...s.points[i],bands[band]],[...s.points[j],bands[band]],[...s.points[j],bands[band+1]],[...s.points[i],bands[band+1]]];
        const color=shade(s.color,i%2?-45:-25);
        faces.push({s,points,color,stroke:color,depth:faceDepth(points)});
      }
    }
    const points=s.points.map(p=>[...p,s.z]);
    faces.push({s,points,color:shade(s.color,25),depth:faceDepth(points)});
    return faces;
  }
  function equipmentBaseFaces(s) {
    const [a,b,,d]=s.points,along=[b[0]-a[0],b[1]-a[1]],across=[d[0]-a[0],d[1]-a[1]];
    const al=Math.hypot(...along)||1,bl=Math.hypot(...across)||1;
    const u=along.map(v=>v/al*.14),v=across.map(n=>n/bl*.14);
    const signs=[[-1,-1],[1,-1],[1,1],[-1,1]];
    const footprint=s.points.map((p,i)=>[p[0]+signs[i][0]*u[0]+signs[i][1]*v[0],p[1]+signs[i][0]*u[1]+signs[i][1]*v[1]]);
    const bottom=footprint.map(p=>[...p,0]),top=footprint.map(p=>[...p,baseHeight]),faces=[];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(!allFaces && project(footprint[j],baseHeight)[0]>=project(footprint[i],baseHeight)[0])continue;
      const points=[bottom[i],bottom[j],top[j],top[i]];
      const color=shade(s.color,-80);
      faces.push({s,points,color,stroke:color,depth:faceDepth(points)});
    }
    const color=shade(s.color,-58);
    faces.push({s,points:top,color,stroke:color,depth:faceDepth(top)});
    return faces;
  }
  function doorFaces(s) {
    const roll=/ROLL/i.test(s.item.code || ''),bottom=s.points.map(p=>[...p,0]),top=s.points.map(p=>[...p,s.z]),faces=[];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(!allFaces && project(s.points[j],s.z)[0]>=project(s.points[i],s.z)[0])continue;
      const points=[bottom[i],bottom[j],top[j],top[i]];
      faces.push({s,points,color:shade(s.color,roll?10:-10),depth:faceDepth(points)});
      if(i!==0 && i!==2)continue;
      const edge=(t,z)=>[s.points[i][0]*(1-t)+s.points[j][0]*t,s.points[i][1]*(1-t)+s.points[j][1]*t,z];
      const panel=[edge(.06,.1),edge(.94,.1),edge(.94,s.z-.1),edge(.06,s.z-.1)];
      const panelColor=roll?'#94a3b8':'#b7793e';
      const panelDepth=faceDepth(panel)+.02;
      faces.push({s,points:panel,color:panelColor,stroke:panelColor,depth:panelDepth});
      if(roll){
        for(let z=.35;z<s.z-.1;z+=.31){
          const slat=[edge(.07,z),edge(.93,z),edge(.93,z+.045),edge(.07,z+.045)];
          faces.push({s,points:slat,color:'#526477',stroke:'#526477',depth:panelDepth+.04+z*.001});
        }
      } else {
        [[.3,.85],[1.22,1.88]].forEach(([low,high])=>{
          const inset=[edge(.17,low),edge(.83,low),edge(.83,high),edge(.17,high)];
          faces.push({s,points:inset,color:'#8f562d',stroke:'#8f562d',depth:panelDepth+.04+low*.001});
        });
        const knob=[edge(.76,.98),edge(.82,.98),edge(.82,1.05),edge(.76,1.05)];
        faces.push({s,points:knob,color:'#f5d373',stroke:'#f5d373',depth:panelDepth+.06});
      }
    }
    faces.push({s,points:top,color:shade(s.color,28),depth:faceDepth(top)});
    return faces;
  }
  function rampTopPoints(s) {
    const [a,b,c,d]=s.points;
    const center=[n(data?.grid?.factory_width,100)/2,n(data?.grid?.factory_depth,40)/2];
    const distance=p=>Math.hypot(p[0]-center[0],p[1]-center[1]);
    // Preserve the original RAMP-5M orientation: its rise follows the short side.
    const spec=s.item.ramp,explicit=spec && Number.isFinite(spec.low) && Number.isFinite(spec.high) && spec.high>spec.low && ['first','last'].includes(spec.highEdge);
    const firstInside=explicit?spec.highEdge==='first':distance([(a[0]+b[0])/2,(a[1]+b[1])/2])<=distance([(c[0]+d[0])/2,(c[1]+d[1])/2]);
    return s.points.map((p,i)=>[...p,(firstInside ? i<2 : i>=2) ? (explicit?spec.high:s.z) : (explicit?spec.low:0)]);
  }
  function rampEdges(s,top=rampTopPoints(s)) {
    const low=Math.min(...top.map(p=>p[2])),high=Math.max(...top.map(p=>p[2]));
    return {high:top.filter(p=>p[2]===high),low:top.filter(p=>p[2]===low)};
  }
  function rampEndLabels(s,top=rampTopPoints(s)) {
    const edges=rampEdges(s,top),connector=s.item.code==='RAMP-CONNECTOR',entry=s.item.code==='RAMP-ANNEX-ENTRY';
    return [['high',entry?'accessHigh':connector?'rampHigh':'rampInside','#ff6258'],['low',entry?'accessLow':connector?'rampLow':'rampOutside','#ffdb48']].map(([end,key,color])=>({edge:edges[end],color:connector?color:'#fff5d7',text:connector || entry?`${t(key)} +${edges[end][0][2].toFixed(2)} m`:t(key)}));
  }
  function rampFaces(s) {
    const top=rampTopPoints(s),base=Math.min(...top.map(p=>p[2])),bottom=s.points.map(p=>[...p,base]),faces=[];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(top[i][2]===base && top[j][2]===base)continue;
      if(!allFaces && project(s.points[j],top[j][2])[0]>=project(s.points[i],top[i][2])[0])continue;
      const points=[bottom[i],bottom[j],top[j],top[i]];
      faces.push({s,points,color:shade(s.color,i%2?-55:-30),depth:faceDepth(points)});
    }
    const topDepth=faceDepth(top);
    faces.push({s,points:top,color:'#dca84f',part:'ramp-surface',depth:topDepth});
    const highFirst=top[0][2]>base,[highLeft,highRight,lowLeft,lowRight]=highFirst?[top[0],top[1],top[3],top[2]]:[top[3],top[2],top[0],top[1]];
    const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
    for(const t of [.2,.4,.6,.8]){
      const stripe=[lerp(highLeft,lowLeft,t),lerp(highRight,lowRight,t),lerp(highRight,lowRight,t+.018),lerp(highLeft,lowLeft,t+.018)].map(p=>[p[0],p[1],p[2]+.004]);
      const color=s.item.code==='RAMP-CONNECTOR'?'#39433c':'#f8ddb1';
      faces.push({s,points:stripe,color,stroke:color,part:'ramp-stripe',depth:topDepth+.03+t*.001});
    }
    if(s.item.code==='RAMP-CONNECTOR')for(const {edge,color} of rampEndLabels(s,top)){
      const other=edge.map(p=>top[3-top.indexOf(p)]);
      const points=[edge[0],edge[1],lerp(edge[1],other[1],.018),lerp(edge[0],other[0],.018)].map(p=>[p[0],p[1],p[2]+.008]);
      faces.push({s,points,color,part:'ramp-end-marker',depth:faceDepth(points)+.04});
    }
    return faces;
  }
  function blockFaces(s,footprint,bottom,top,color) {
    const faces=[];
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(!allFaces && project(footprint[j],top)[0]>=project(footprint[i],top)[0])continue;
      const points=[[...footprint[i],bottom],[...footprint[j],bottom],[...footprint[j],top],[...footprint[i],top]];
      faces.push({s,points,color:shade(color,i%2?-45:-25),depth:faceDepth(points)});
    }
    const points=footprint.map(p=>[...p,top]);
    faces.push({s,points,color:shade(color,18),depth:faceDepth(points)});
    return faces;
  }
  function equipmentFaces(s) {
    const hasBase=!/Window|Furniture|Office/.test(s.item.category || '');
    const faces=hasBase?equipmentBaseFaces(s):[];
    const [a,b,,d]=s.points;
    const along=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const across=Math.hypot(d[0]-a[0],d[1]-a[1]);
    const axisBreaks=length=>{
      const breaks=[0];
      for(const [start,end] of [[0,.175],[.175,.825],[.825,1]]){
        const count=Math.max(1,Math.ceil(length*(end-start)/1.5));
        for(let i=1;i<=count;i++)breaks.push(start+(end-start)*i/count);
      }
      return breaks;
    };
    const uBreaks=axisBreaks(along),vBreaks=axisBreaks(across);
    const point=(u,v,z)=>[
      a[0]+(b[0]-a[0])*u+(d[0]-a[0])*v,
      a[1]+(b[1]-a[1])*u+(d[1]-a[1])*v,z
    ];
    // Small faces let nearby columns and walls pass in front of or behind a long machine.
    // Repainting one complete roof after sorting incorrectly hides every intervening column.
    const surface=(u0,u1,v0,v1,z,color)=>{
      const points=[point(u0,v0,z),point(u1,v0,z),point(u1,v1,z),point(u0,v1,z)];
      faces.push({s,points,color,stroke:color,depth:faceDepth(points)});
    };
    for(let row=0;row<vBreaks.length-1;row++)for(let column=0;column<uBreaks.length-1;column++){
      const u0=uBreaks[column],u1=uBreaks[column+1],v0=vBreaks[row],v1=vBreaks[row+1];
      const inset=u0>=.175-1e-9 && u1<=.825+1e-9 && v0>=.175-1e-9 && v1<=.825+1e-9;
      surface(u0,u1,v0,v1,s.z+(inset?.03:0),shade(s.color,inset?-14:25));
    }
    for(let edge=0;edge<4;edge++){
      const next=(edge+1)%4;
      if(!allFaces && project(s.points[next],s.z)[0]>=project(s.points[edge],s.z)[0])continue;
      const length=Math.hypot(s.points[next][0]-s.points[edge][0],s.points[next][1]-s.points[edge][1]);
      const count=Math.max(1,Math.ceil(length/1.5));
      const bottom=hasBase?baseHeight:0;
      const edgePoint=(t,z)=>[
        s.points[edge][0]*(1-t)+s.points[next][0]*t,
        s.points[edge][1]*(1-t)+s.points[next][1]*t,z
      ];
      for(let i=0;i<count;i++){
        const start=i/count,end=(i+1)/count;
        const points=[edgePoint(start,bottom),edgePoint(end,bottom),edgePoint(end,s.z),edgePoint(start,s.z)];
        const color=shade(s.color,edge%2?-45:-25);
        faces.push({s,points,color,stroke:color,depth:faceDepth(points)});
      }
    }
    return faces;
  }
  function officeEntrance(s) {
    const xs=s.points.map(p=>p[0]),ys=s.points.map(p=>p[1]);
    const horizontal=Math.max(...xs)-Math.min(...xs)>=Math.max(...ys)-Math.min(...ys);
    const midX=(Math.min(...xs)+Math.max(...xs))/2,midY=(Math.min(...ys)+Math.max(...ys))/2;
    const outward=horizontal?[0,midY>=n(data?.grid?.factory_depth,40)/2?1:-1]:[midX>=n(data?.grid?.factory_width,100)/2?1:-1,0];
    const tangent=horizontal?[1,0]:[0,1];
    const front=horizontal?[midX,outward[1]>0?Math.max(...ys):Math.min(...ys)]:[outward[0]>0?Math.max(...xs):Math.min(...xs),midY];
    const half=Math.max(1.4,(horizontal?Math.max(...xs)-Math.min(...xs):Math.max(...ys)-Math.min(...ys))/2+.45);
    return {half,outward,edge:(along,offset)=>[front[0]+tangent[0]*along+outward[0]*offset,front[1]+tangent[1]*along+outward[1]*offset]};
  }
  function siteFaces() {
    if(floor!=='1F')return [];
    const faces=[];
    if(!detail)faces.push(...(window.ChinChunBuilding?.frameFaces(data,buildingRoof) || []).map(f=>({...f,model:true,nonInteractive:true,depth:faceDepth(f.points)})));
    const office=scene.find(s=>isOfficeEntry(s.item));
    if(office && (!detail || selected===office)){
      const entry=officeEntrance(office),steps=6,depth=.42;
      for(let k=0;k<steps;k++){
        const near=k*depth,far=near+depth;
        faces.push(...blockFaces(office,[entry.edge(-entry.half,near),entry.edge(entry.half,near),entry.edge(entry.half,far),entry.edge(-entry.half,far)],0,factoryRise*(steps-k)/steps,'#aeb8af'));
      }
    }
    const shutter=scene.find(s=>s.item.category==='Door' && /ROLL/i.test(s.item.code || '') && Math.abs(n(s.item.x))<1);
    if(shutter && (!detail || selected===shutter)){
      const ys=shutter.points.map(p=>p[1]),lo=Math.min(...ys),hi=Math.max(...ys);
      const landing=[[-2,lo-.45],[.05,lo-.45],[.05,hi+.45],[-2,hi+.45]];
      faces.push(...blockFaces(shutter,landing,0,factoryRise,'#a6a79c'));
      const line=[[-2,lo-.36,factoryRise+.025],[-1.86,lo-.36,factoryRise+.025],[-1.86,hi+.36,factoryRise+.025],[-2,hi+.36,factoryRise+.025]];
      faces.push({s:shutter,points:line,color:'#f0c35b',stroke:'#f0c35b',depth:faceDepth(line)+.05});
    }
    return faces;
  }
  function drawOfficeFacade() {
    if(floor!=='1F')return;
    const office=scene.find(s=>isOfficeEntry(s.item));
    if(!office || (detail && selected!==office))return;
    const entry=officeEntrance(office),z=elevation(office),out=entry.edge(0,.08),inside=entry.edge(0,-1);
    if(viewDepth([...out,0])<=viewDepth([...inside,0]))return;
    const glass=[entry.edge(-.9,.05),entry.edge(.9,.05),entry.edge(.9,.05),entry.edge(-.9,.05)].map((p,i)=>[...p,i<2?z+.12:z+2.45]);
    hits.push({path:polygon(glass.map(p=>project(p,p[2])),'#6d9ba4','#e9eee4'),s:office});
    const mullion=[entry.edge(-.035,.06),entry.edge(.035,.06),entry.edge(.035,.06),entry.edge(-.035,.06)].map((p,i)=>[...p,i<2?z+.12:z+2.45]);
    polygon(mullion.map(p=>project(p,p[2])),'#e3e8dc','#e3e8dc');
    const canopy=[entry.edge(-2.2,-.05),entry.edge(2.2,-.05),entry.edge(2.2,.72),entry.edge(-2.2,.72)].map(p=>[...p,z+2.67]);
    polygon(canopy.map(p=>project(p,p[2])),'#cfd7cf','#edf1e7');
  }
  function drawPhotoDirections() {
    const b=window.ChinChunBuilding?.get(data);if(!photoDirections || detail || floor!=='1F' || !b)return;
    const thai=document.documentElement.lang.startsWith('th'),y=b.annex.y+Math.min(7.5,b.annex.height/2);
    const labels=[
      [[b.annex.x,y],thai?'เขตส้ม: ออก=ซ้าย 2D / เข้า=ขวา':'橘區：往外＝2D左／往內＝2D右',thai?'เห็นทางลาดในภาพ ขนาดรอวัด':'照片有斜坡；尺寸未量測'],
      [[b.annex.x+b.annex.width,y],thai?'เขตเขียว: มองเข้า=ซ้าย 2D':'綠區：由外往內＝2D左',thai?'หลังคาต่างระดับ / ทางลาดรอวัด':'屋頂有高差／斜坡尺寸未量測']
    ];
    ctx.save();ctx.font='bold 11px system-ui';ctx.textAlign='center';
    for(const [point,line1,line2] of labels){
      const p=project(point,b.annex.rise+.2),w=Math.max(ctx.measureText(line1).width,ctx.measureText(line2).width)+14;
      ctx.fillStyle='#18332eeb';ctx.fillRect(p[0]-w/2,p[1]-27,w,39);ctx.fillStyle='#ffe1a5';ctx.fillText(line1,p[0],p[1]-12);ctx.fillText(line2,p[0],p[1]+3);
    }
    ctx.restore();
  }
  function drawAccessDirections() {
    if(!photoAccess || !(photoDirections || detail))return;
    ctx.save();
    for(const item of [photoAccess.ramp,photoAccess.stairs].filter(Boolean)){
      if(detail && selected?.item.id!==item.id)continue;
      const a=project(item.lowPoint,item.lowPoint[2]+.09),b=project(item.highPoint,item.highPoint[2]+.09),angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
      for(const [color,lineWidth] of [['#e5efff',6],['#2563eb',3]]){ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.stroke();}
      ctx.beginPath();ctx.moveTo(...b);ctx.lineTo(b[0]-10*Math.cos(angle-.5),b[1]-10*Math.sin(angle-.5));ctx.lineTo(b[0]-10*Math.cos(angle+.5),b[1]-10*Math.sin(angle+.5));ctx.closePath();ctx.fillStyle='#2563eb';ctx.fill();
    }
    ctx.restore();
  }
  function objectFaces(s) {
    const rise=elevation(s);
    const lift=faces=>rise?faces.map(f=>{const points=f.points.map(p=>[p[0],p[1],p[2]+rise]);return {...f,points,depth:faceDepth(points)};}):faces;
    if(s.model)return lift(s.model.filter(f=>!(s===selected && restroomCutaway && referenceCode(s.item)==='WC-STALLS' && f.cutaway)).map(f=>({s:s.type==='site'?scene.find(q=>q.type==='equipment' && q.item.id===s.item.id)||s:s,points:f.points,color:f.color,part:f.part,model:true,depth:faceDepth(f.points)})));
    if(s.type==='wall')return lift(wallFaces(s));
    if(s.type==='column')return lift(columnFaces(s));
    if(s.item.category==='Door')return lift(doorFaces(s));
    if(isRamp(s.item))return rampFaces(s);
    if(s.type==='equipment')return lift(equipmentFaces(s));
    return [];
  }
  function updateEngineInfo() {
    if(!dialog)return;
    const select=dialog.querySelector('#twinEngine');if(select)select.value=engineMode;
    const status=dialog.querySelector('#twinEngineStatus');if(status)status.textContent=engineError?t('threeFailed'):engineMode==='three'?t('threeReady'):t('legacyEngine');
    const help=dialog.querySelector('[data-twin-text="help"]');if(help)help.textContent=t(engineMode==='three'?'threeHelp':'help');
    const top=dialog.querySelector('#twinTopView');if(top)top.hidden=engineMode!=='three';
  }
  function switchEngine(mode,failed=false) {
    pointers.clear();gesture=null;legacyTouchBase=null;
    if(usingThree()){const state=threeView.state();angle=state.yaw/90;pitch=state.pitch*Math.PI/180;}
    engineMode=mode==='legacy'?'legacy':'three';engineError=failed;
    if(engineMode==='three')threeView?.setAngles(angle*Math.PI/2,pitch);
    threeView?.setEnabled(engineMode==='three');
    if(failed){threeView?.dispose();threeView=null;}
    threeSceneCache=null;threeNeedsFit=true;fitExtent=null;zoom=1;pan={x:0,y:0};
    updateEngineInfo();requestDraw();
  }
  function startThree() {
    try {
      if(!window.ChinChunThree?.create)throw new Error('Three.js bundle unavailable');
      threeView=window.ChinChunThree.create({canvas,onChange:requestDraw,onError:()=>switchEngine('legacy',true),onPick:id=>{
        selected=scene.find(s=>s.item.id===id)||null;
        if(!selected && detail){detail=false;threeNeedsFit=true;}
        updateInfo();requestDraw();
      }});
      threeView.setAngles(angle*Math.PI/2,pitch);
      dialog.querySelector('.twin-stage').prepend(threeView.element);
      threeView.setEnabled(true);threeNeedsFit=true;updateEngineInfo();
    }catch(error){console.warn('Three.js unavailable; retaining the legacy view.',error);switchEngine('legacy',true);}
  }
  // Floors and routes share the same GPU depth buffer as all equipment.
  // This builds display faces from current data; it never changes the layout.
  function circulationFaces(visible) {
    const faces=[],access=window.ChinChunAccess,holes=access?.routeHoles(data,floor) || [];
    const quad=(points,color,s=null,part='flow')=>{
      for(const piece of access?access.clipRoutes(points,holes):[points])faces.push({points:piece,color,s,part,nonInteractive:!s,model:true});
    };
    for(const s of visible.filter(s=>s.type==='aisle' || s.type==='zone'))quad(s.points.map(p=>[...p,elevation(s)+.03]),s.color,s,'aisle');
    const flowLevel=p=>floor==='1F'?(window.ChinChunBuilding?.floorLevel(data,p) ?? (inFactory(p)?factoryRise:0)):0;
    for(const f of (detail?[]:data.flows || []).filter(f=>(f.floor || '1F')===floor)){
      if(!Array.isArray(f.points))continue;
      for(let i=1;i<f.points.length;i++){
        const a=[n(f.points[i-1].x),n(f.points[i-1].y)],q=[n(f.points[i].x),n(f.points[i].y)],dx=q[0]-a[0],dy=q[1]-a[1],length=Math.hypot(dx,dy);if(length<.001)continue;
        const point=(d,side)=>[a[0]+dx*d/length-dy/length*side,a[1]+dy*d/length+dx/length*side];
        for(let start=0;start<length;start+=1.2){const end=Math.min(length,start+.7),p=[point(start,-.045),point(end,-.045),point(end,.045),point(start,.045)];quad(p.map(v=>[...v,flowLevel(v)+.08]),'#f8e7a1');}
        if(i===f.points.length-1){const p=[q,point(Math.max(0,length-.65),.30),point(Math.max(0,length-.65),-.30)];quad(p.map(v=>[...v,flowLevel(v)+.09]),'#f8e7a1',null,'flow-arrow');}
      }
    }
    return faces;
  }
  // A ramp that descends below a slab needs an opening in the slab skin too.
  // Clipping circulation alone leaves the slope buried in the GPU depth buffer.
  function groundPieces(points){
    const access=window.ChinChunAccess;if(!access || floor!=='1F' || points[0][2]<=0)return [points];
    const holes=groundCuts.filter(r=>r.low<points[0][2]-1e-6).map(r=>r.points);
    return access.clipRoutes(points,holes);
  }
  function slabFaces(points,bottom,color){
    const faces=[];
    for(const piece of groundPieces(points)){
      faces.push({points:piece,color});
      for(let i=0;i<piece.length;i++){
        const a=piece[i],b=piece[(i+1)%piece.length];
        faces.push({points:[[a[0],a[1],bottom],[b[0],b[1],bottom],b,a],color:shade(color,-28)});
      }
    }
    return faces;
  }
  function threeGroundFaces(visible,b) {
    const faces=[];
    const quad=(points,color,s=null,part='ground')=>faces.push({points,color,s,part,nonInteractive:!s,model:true});
    const surface=(points,color)=>{for(const piece of groundPieces(points))quad(piece,color);};
    const box=(r,bottom,top,color)=>{
      const p=[[r.x,r.y],[r.x+r.width,r.y],[r.x+r.width,r.y+r.height],[r.x,r.y+r.height]];
      for(const f of slabFaces(p.map(q=>[...q,top]),bottom,color))quad(f.points,f.color);
    };
    box({x:b.x0,y:b.y0,width:b.x1-b.x0,height:b.y1-b.y0},-1.4,-.01,'#829477');
    const tiles=(r,z)=>{
      const left=Math.max(r.x,b.x0),right=Math.min(r.x+r.width,b.x1),top=Math.max(r.y,b.y0),bottom=Math.min(r.y+r.height,b.y1);
      for(let x=Math.floor(left/5)*5;x<right;x+=5)for(let y=Math.floor(top/5)*5;y<bottom;y+=5)
        surface([[Math.max(left,x),Math.max(top,y),z],[Math.min(right,x+5),Math.max(top,y),z],[Math.min(right,x+5),Math.min(bottom,y+5),z],[Math.max(left,x),Math.min(bottom,y+5),z]],Math.round(x/5+y/5)%2?'#bdc6ac':'#c8ceb6');
    };
    tiles({x:b.x0,y:b.y0,width:b.x1-b.x0,height:b.y1-b.y0},0);
    if(floor==='1F'){
      const building=window.ChinChunBuilding?.get(data);
      const regions=[...(building?[building.annex]:[]),building?.main || {x:0,y:0,width:n(data.grid?.factory_width,100),height:n(data.grid?.factory_depth,40),rise:factoryRise}];
      for(const r of regions){
        const clipped={x:Math.max(r.x,b.x0),y:Math.max(r.y,b.y0)};
        clipped.width=Math.min(r.x+r.width,b.x1)-clipped.x;clipped.height=Math.min(r.y+r.height,b.y1)-clipped.y;
        if(clipped.width<=0 || clipped.height<=0)continue;
        box(clipped,0,r.rise,r===building?.annex?'#d4cbaa':'#c3c6af');tiles(clipped,r.rise+.002);
      }
    }
    faces.push(...circulationFaces(visible));
    const office=scene.find(s=>isOfficeEntry(s.item));
    if(floor==='1F' && office && (!detail || selected===office)){
      const entry=officeEntrance(office),z=elevation(office);
      quad([entry.edge(-.9,.05),entry.edge(.9,.05),entry.edge(.9,.05),entry.edge(-.9,.05)].map((p,i)=>[...p,i<2?z+.12:z+2.45]),'#6d9ba4',office,'office-glass');
      quad([entry.edge(-.035,.06),entry.edge(.035,.06),entry.edge(.035,.06),entry.edge(-.035,.06)].map((p,i)=>[...p,i<2?z+.12:z+2.45]),'#e3e8dc',office,'office-mullion');
      quad([entry.edge(-2.2,-.05),entry.edge(2.2,-.05),entry.edge(2.2,.72),entry.edge(-2.2,.72)].map(p=>[...p,z+2.67]),'#cfd7cf',office,'office-canopy');
    }
    return faces;
  }
  // IoT/MES/RTLS overlay. Positions are CAD metres; nothing is written to layoutData.
  const liveColors={run:'#3fbf6f',idle:'#e8c547',setup:'#4aa3df',down:'#e0503c',offline:'#8a948f'};
  const liveLevel=p=>floor==='1F'?(window.ChinChunBuilding?.floorLevel(data,p) ?? (inFactory(p)?factoryRise:0)):0;
  function drawLive(visible){
    const live=window.ChinChunLive;if(!live || live.mode()==='off')return;
    for(const s of visible){
      if(s.type!=='equipment')continue;const state=live.equipmentState(s.item.id);if(!state)continue;
      const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]),high=threeSceneCache?.heights.get(s) ?? elevation(s)+s.z+.2,p=project(center,high);
      // Sit above the equipment label rather than on top of its text.
      ctx.beginPath();ctx.arc(p[0],p[1]-20,s===selected?7:5,0,Math.PI*2);ctx.fillStyle=liveColors[state.status];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#10282a';ctx.stroke();
    }
    for(const tag of live.positions(floor)){
      const level=liveLevel([tag.x,tag.y])+1.1,color=tag.kind==='forklift'?'#f59e0b':tag.kind==='person'?'#38bdf8':'#c084fc';
      if(tag.trail.length>1){ctx.beginPath();tag.trail.forEach((q,i)=>{const v=project(q,liveLevel(q)+.05);i?ctx.lineTo(...v):ctx.moveTo(...v);});ctx.strokeStyle=color+'99';ctx.lineWidth=2;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);}
      const foot=project([tag.x,tag.y],level-1.05),p=project([tag.x,tag.y],level);
      ctx.beginPath();ctx.moveTo(...foot);ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
      ctx.beginPath();if(tag.kind==='person')ctx.arc(p[0],p[1],5,0,Math.PI*2);else ctx.rect(p[0]-5,p[1]-5,10,10);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#10282a';ctx.lineWidth=1.5;ctx.stroke();
      if(labels && width>700){ctx.font='bold 10px system-ui';ctx.textAlign='left';ctx.lineWidth=3;ctx.strokeStyle='#10282a';ctx.strokeText(tag.label,p[0]+8,p[1]+3);ctx.fillStyle='#e8f6ff';ctx.fillText(tag.label,p[0]+8,p[1]+3);}
    }
    const legend=[...live.STATUS.map(k=>[liveColors[k],t(k),'dot']),['#38bdf8',t('person'),'dot'],['#f59e0b',t('forklift'),'box']];
    ctx.font='11px system-ui';ctx.textAlign='left';let x=14;const y=height-14;
    ctx.fillStyle='#18332ecc';ctx.fillRect(6,y-14,legend.reduce((w,[,text])=>w+ctx.measureText(text).width+24,8),22);
    for(const [color,text,shape] of legend){ctx.beginPath();if(shape==='box')ctx.rect(x-4,y-7,8,8);else ctx.arc(x,y-3,4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.fillStyle='#e8efe0';ctx.fillText(text,x+8,y+1);x+=ctx.measureText(text).width+24;}
  }
  function liveDetails(item){
    const state=item && window.ChinChunLive?.equipmentState(item.id);if(!state)return '';
    const age=Math.max(0,Math.round((Date.now()-state.ts)/1000));
    return `\n● ${t(state.status)}${state.workOrder?` · ${t('workOrder')} ${state.workOrder}`:''}${state.count!==undefined?` · ${t('output')} ${state.count}${state.target?'/'+state.target:''}`:''} · ${state.source} · ${age}${t('liveAge')}`;
  }
  // ?live=wss://gateway/path offers a direct gateway feed next to the cloud tables.
  const liveGateway=()=>{const url=new URLSearchParams(location.search).get('live');return url && /^wss?:\/\//.test(url)?url:null;};
  const liveSourceKey=mode=>({simulation:'simulation',cloud:'cloud',live:'gateway'})[mode] || 'off';
  function updateLiveButton(){
    const select=dialog?.querySelector('#twinLive');if(!select)return;
    select.closest('label').hidden=!window.ChinChunLive;
    const cloud=Boolean(window.ChinChunCloud?.liveSource?.()),options=[['off','liveOff'],['simulation','liveSim'],['cloud',cloud?'liveCloud':'liveCloudLogin'],...(liveGateway()?[['gateway','liveOn']]:[])];
    // Rebuild only when the choices change: live ticks must not close an open dropdown.
    const signature=options.map(([value,key])=>value+':'+t(key)).join('|');
    if(select.dataset.signature!==signature){select.dataset.signature=signature;select.replaceChildren(...options.map(([value,key])=>{const option=new Option(t(key),value);option.disabled=value==='cloud' && !cloud;return option;}));}
    select.value=liveSourceKey(window.ChinChunLive?.mode());
  }
  function selectLive(value){
    const live=window.ChinChunLive;if(!live)return;
    const cloud=window.ChinChunCloud?.liveSource?.();
    if(value==='simulation')live.use(live.providers.simulation());
    else if(value==='cloud' && cloud)live.use(live.providers.supabase(cloud.client,{workspaceId:cloud.workspaceId}));
    else if(value==='gateway' && liveGateway())live.use(live.providers.websocket(liveGateway()));
    else live.stop();
    updateLiveButton();updateInfo();requestDraw();
  }
  function drawThreeLabels(visible) {
    const occupied=[],overlap=(a,b)=>a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
    const canvasRect=canvas.getBoundingClientRect(),card=dialog.querySelector('.twin-info').getBoundingClientRect();
    occupied.push({x:card.left-canvasRect.left,y:card.top-canvasRect.top,w:card.width,h:card.height});
    const priority=s=>s===selected?100:isRamp(s.item) || s.item.code==='STAIR-DIECUT'?30:s.model?10:0;
    const candidates=visible.filter(s=>s.type==='equipment' || isRamp(s.item) || s.item.code==='STAIR-DIECUT' || s===selected).sort((a,b)=>priority(b)-priority(a));
    for(const s of candidates){
      if(!labels && s!==selected)continue;
      const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]);
      const high=threeSceneCache.heights.get(s) ?? elevation(s)+s.z+.15,p=threeView.project([...center,high]);
      if(p[2]<-1 || p[2]>1 || p[0]<0 || p[0]>width || p[1]<15 || p[1]>height)continue;
      const text=s.item.code || s.item.name || '',font=s.model || s===selected?12:10;
      ctx.font=`bold ${font}px system-ui`;ctx.textAlign='center';
      const rect={x:p[0]-ctx.measureText(text).width/2-4,y:p[1]-font-3,w:ctx.measureText(text).width+8,h:font+6};
      if(s!==selected && occupied.some(q=>overlap(rect,q)))continue;
      occupied.push(rect);ctx.lineWidth=4;ctx.strokeStyle='#18332e';ctx.strokeText(text,p[0],p[1]);ctx.fillStyle=s===selected?'#ffe5a1':'#fff5d7';ctx.fillText(text,p[0],p[1]);
    }
  }
  function drawThree(visible,b,dpr) {
    threeView.resize(width,height,dpr);
    const cache=threeSceneCache;
    if(!cache || cache.scene!==scene || cache.detail!==detail || cache.selected!==selected || cache.roof!==buildingRoof || cache.cutaway!==restroomCutaway){
      let faces;
      allFaces=true;
      try{faces=[...threeGroundFaces(visible,b),...visible.filter(s=>s.type!=='aisle' && s.type!=='zone').flatMap(objectFaces),...siteFaces()];}
      finally{allFaces=false;}
      threeView.setScene(faces.map(f=>({...f,edges:!f.model})));
      const heights=new Map();
      for(const s of visible){let high=s.z || 0;for(const f of s.model || [])for(const p of f.points)high=Math.max(high,p[2]);heights.set(s,elevation(s)+high+.20);}
      threeSceneCache={scene,detail,selected,roof:buildingRoof,cutaway:restroomCutaway,heights};
    }
    if(threeNeedsFit){threeNeedsFit=false;threeView.fit();}
    threeView.render();drawThreeLabels(visible);drawLive(visible);
    for(const s of visible)if(s.model && (detail || s===selected))drawModelAnnotations(s,false);
    if(selected && !selected.model){
      const p=new Path2D(),points=isRamp(selected.item)?rampTopPoints(selected):selected.points.map(q=>[...q,elevation(selected)]);points.forEach((q,i)=>i?p.lineTo(...project(q,q[2]+.03)):p.moveTo(...project(q,q[2]+.03)));p.closePath();ctx.strokeStyle='#ffe5a1';ctx.lineWidth=2;ctx.stroke(p);
    }
    if(selected && isRamp(selected.item) && detail){
      for(const {edge:points,text,color} of rampEndLabels(selected)){
        const p=project([(points[0][0]+points[1][0])/2,(points[0][1]+points[1][1])/2],points[0][2]+.2);ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.strokeStyle='#18332e';ctx.lineWidth=4;ctx.strokeText(text,...p);ctx.fillStyle=color;ctx.fillText(text,...p);
      }
    }
    drawPhotoDirections();drawAccessDirections();
    dialog.querySelector('#twinCount').textContent=`${floor} / ${scene.length} ${t('count')} · Three.js r${window.ChinChunThree.revision} · ${t('updated')}`;
  }
  function draw() {
    frame=0;if(!dialog?.open || !bounds)return;
    const size=canvas.getBoundingClientRect();width=size.width;height=size.height;
    const dpr=Math.min(devicePixelRatio || 1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    if(engineMode==='three' && !threeView)startThree();
    const b=viewBounds(),visible=detail&&selected?[selected]:[...scene];
    if(dieGround && (!detail || selected?.item.id===dieGround.item.id)){
      const r=dieGround.pad;
      visible.push({item:dieGround.item,type:'site',points:[[r.x,r.y],[r.x+r.width,r.y],[r.x+r.width,r.y+r.height],[r.x,r.y+r.height]],model:window.ChinChunModels.dieCutSiteFaces(dieGround).filter(f=>(dieSite || f.part==='filled-ground') && !(window.ChinChunBuilding?.get(data) && f.part==='filled-ground'))});
    }
    if(dieSite && (!detail || selected?.item.id===dieSite.item.id)){
      if(detail){
        const neighbor=scene.find(q=>referenceCode(q.item)==='L4-1');
        if(neighbor)visible.push(neighbor);
        // Keep only the local wall in the equipment close-up, including sill/lintel.
        for(const s of scene.filter(q=>q.type==='wall' && (q.item.id===dieSite.wall.id || q.item.id.startsWith(dieSite.wall.id+'_')))){
          const lo=Math.max(b.x0,Math.min(...s.points.map(p=>p[0]))),hi=Math.min(b.x1,Math.max(...s.points.map(p=>p[0])));
          if(hi<=lo)continue;
          visible.push({...s,points:s.points.map((p,i)=>[i===0||i===3?lo:hi,p[1]])});
        }
      }
    }
    const corners=[[b.x0,b.y0],[b.x1,b.y0],[b.x1,b.y1],[b.x0,b.y1]];
    baseScale=fittedScale(b,width,height);
    hits=[];
    if(usingThree()){
      try{drawThree(visible,b,dpr);return;}
      catch(error){console.warn('Three.js drawing failed; retaining the legacy view.',error);switchEngine('legacy',true);ctx.clearRect(0,0,width,height);}
    }
    polygon(corners.map(p=>project(p,-1.4)),'#344938');
    polygon(corners.map(p=>project(p)),'#829477');
    const x0=Math.ceil(b.x0/5)*5,y0=Math.ceil(b.y0/5)*5;
    // Alternating stone tiles create the JRPG diorama ground without changing CAD dimensions.
    for(let x=x0;x<b.x1-5;x+=5)for(let y=y0;y<b.y1-5;y+=5){
      polygon([[x,y],[x+5,y],[x+5,y+5],[x,y+5]].map(p=>project(p)),(Math.round(x/5+y/5)%2)?'#bdc6ac':'#c8ceb6','#a6b499');
    }
    if(floor==='1F'){
      const building=window.ChinChunBuilding?.get(data);
      const surface=(points,color,stroke)=>{for(const piece of groundPieces(points))polygon(piece.map(p=>project(p,p[2])),color,stroke);};
      const drawSlab=(points,color)=>{for(const f of slabFaces(points,0,color).sort((a,b)=>faceDepth(a.points)-faceDepth(b.points)))polygon(f.points.map(p=>project(p,p[2])),f.color,'#697b6c');};
      const slabRect=(r,rise,color)=>{
        const left=Math.max(r.x,b.x0),right=Math.min(r.x+r.width,b.x1),top=Math.max(r.y,b.y0),bottom=Math.min(r.y+r.height,b.y1);
        if(right<=left || bottom<=top)return;
        const slab=[[left,top],[right,top],[right,bottom],[left,bottom]];
        drawSlab(slab.map(p=>[...p,rise]),color);
      };
      if(building)slabRect(building.annex,building.annex.rise,'#d4cbaa');
      const slabWidth=n(data.grid?.factory_width,100),slabDepth=n(data.grid?.factory_depth,40);
      const left=Math.max(0,b.x0),right=Math.min(slabWidth,b.x1),top=Math.max(0,b.y0),bottom=Math.min(slabDepth,b.y1);
      const slab=[[left,top],[right,top],[right,bottom],[left,bottom]];
      if(right>left && bottom>top){
      drawSlab(slab.map(p=>[...p,factoryRise]),'#c3c6af');
      for(let x=Math.floor(left/5)*5;x<right;x+=5)for(let y=Math.floor(top/5)*5;y<bottom;y+=5){
        surface([[Math.max(left,x),Math.max(top,y),factoryRise],[Math.min(right,x+5),Math.max(top,y),factoryRise],[Math.min(right,x+5),Math.min(bottom,y+5),factoryRise],[Math.max(left,x),Math.min(bottom,y+5),factoryRise]],(Math.round(x/5+y/5)%2)?'#c4c8b4':'#cdd0bc','#aeb7a4');
      }
      }
    }
    for(const f of circulationFaces(visible)){
      const path=polygon(f.points.map(p=>project(p,p[2])),f.color,f.part==='aisle'?'#e5dca2':f.color);
      if(f.s)hits.push({path,s:f.s});
    }
    const solids=visible.filter(s=>s.type!=='aisle' && s.type!=='zone');
    solids.filter(s=>s.type==='equipment' || s.type==='wall').forEach(drawGroundContact);
    // Painter order must be per face: a whole long machine can straddle a column.
    renderSolids([...solids.flatMap(objectFaces),...siteFaces()],dpr);
    drawOfficeFacade();
    drawPhotoDirections();drawAccessDirections();
    solids.forEach(s=>{
      if(s.type==='site' && !isRamp(s.item) && s.item.code!=='STAIR-DIECUT')return;
      if(s.model){drawModelAnnotations(s);return;}
      if(s.type==='equipment' || isRamp(s.item)){
        const center=s.points.reduce((p,q)=>[p[0]+q[0]/4,p[1]+q[1]/4],[0,0]),p=project(center,elevation(s)+(isRamp(s.item)?rampTopPoints(s).reduce((sum,q)=>sum+q[2]/4,0)+.12:s.z+.1));
        ctx.fillStyle='#e4e5b3';ctx.fillRect(p[0]-2,p[1]-2,4,4);
        if((labels && baseScale*zoom>6)||s===selected){ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#243f36';ctx.strokeText(s.item.code || s.item.name || '',p[0],p[1]-10);ctx.fillStyle='#fff8df';ctx.fillText(s.item.code || s.item.name || '',p[0],p[1]-10);}
        if(isRamp(s.item) && detail){
          rampEndLabels(s).forEach(({edge,text,color})=>{
            const q=project([(edge[0][0]+edge[1][0])/2,(edge[0][1]+edge[1][1])/2],edge[0][2]+.2);
            ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#3e392b';ctx.strokeText(text,q[0],q[1]);ctx.fillStyle=color;ctx.fillText(text,q[0],q[1]);
          });
        }
      }
      if(s===selected){
        const outline=new Path2D(),outlinePoints=isRamp(s.item)?rampTopPoints(s):s.points.map(p=>[...p,elevation(s)+s.z]);
        outlinePoints.forEach((p,i)=>i?outline.lineTo(...project(p,p[2])):outline.moveTo(...project(p,p[2])));outline.closePath();
        ctx.strokeStyle='#fff1a1';ctx.lineWidth=3;ctx.stroke(outline);
      }
    });
    drawLive(visible);
    dialog.querySelector('#twinCount').textContent=`${floor} / ${scene.length} ${t('count')} · ${t('updated')}`;
  }
  function updateInfo() {
    const s=selected, item=s?.item;
    dialog.querySelector('#twinName').textContent=item ? (item.code || item.name || item.id) : t('select');
    const displayRotation=item?n(item.rotation)+(window.ChinChunModels?.rotationOffset?.(item) || 0):0;
    dialog.querySelector('#twinDetails').textContent=item ? `${t(s.type)} · ${item.name || item.id}\n${t('position')}: ${n(item.x ?? item.x1).toFixed(2)}, ${n(item.y ?? item.y1).toFixed(2)} m\n${t('size')}: ${s.type==='wall'?Math.hypot(n(item.x2)-n(item.x1),n(item.y2)-n(item.y1)).toFixed(2)+' × '+n(item.thickness,.2).toFixed(2):n(item.width).toFixed(2)+' × '+n(item.height).toFixed(2)} m\n${t('rotation')}: ${displayRotation.toFixed(0)}°` : t('empty');
    const building=window.ChinChunBuilding?.get(data),roofButton=dialog.querySelector('#twinRoof');
    roofButton.hidden=!building || floor!=='1F';roofButton.setAttribute('aria-pressed',String(buildingRoof));
    const photoButton=dialog.querySelector('#twinPhotoDirections');photoButton.hidden=!building || floor!=='1F';photoButton.setAttribute('aria-pressed',String(photoDirections));
    if(building){
      dialog.querySelector('[data-twin-text="note"]').textContent=t('buildingNote');
      if(!item)dialog.querySelector('#twinDetails').textContent+='\n'+(photoDirections?t('photoSiteNote'):t('buildingNote'));
    }else dialog.querySelector('[data-twin-text="note"]').textContent=t('note');
    dialog.querySelector('#twinEdit').hidden=!s || s.type==='site';
    dialog.querySelector('#twinFocus').hidden=!s;
    const restroom=referenceCode(item || {})==='WC-STALLS';
    const cutawayButton=dialog.querySelector('#twinRestroomCutaway');
    cutawayButton.hidden=!restroom;
    cutawayButton.setAttribute('aria-pressed',String(restroomCutaway));
    if(restroom){
      dialog.querySelector('#twinDetails').textContent+='\n'+t('restroomNote');
      if(window.ChinChunModels?.restroomLayout?.(item)?.compact)dialog.querySelector('#twinDetails').textContent+='\n⚠ '+t('restroomCompact');
    }
    if(s?.model && s.type==='equipment' && !restroom)dialog.querySelector('#twinDetails').textContent+='\n'+t(({'DIE CUT':'dieCutPhoto','A1-1':'a1Photo','A1-2':'a12Photo','C1-1':'c11Photo','F1-1':'f1Photo','G2-1':'g21Photo','G2-2':'g2Photo','B1-1':'b12Photo','B1-2':'b12Photo','B1-3':'b13Photo','B1-4':'b14Photo','E1-1':'e1Photo','E1-2':'e1Photo','Q2-1':'q21Photo','Q2-2':'q22Photo','Q2-3':'q23Photo','J1-2':'j12Photo','J1-3':'j13Photo','D1-1':'d11Photo','WELDING':'weldingPhoto','L4-1':'l41Photo','PL-1':'rackPhoto','PL-2':'rackPhoto'})[referenceCode(item)] || 'photo');
    if(item && ['EVA 3','EVA3'].includes(referenceCode(item)))dialog.querySelector('#twinDetails').textContent+='\n'+t('eva3Deferred');
    if(item && referenceCode(item)==='DIE CUT' && !dieSite)dialog.querySelector('#twinDetails').textContent+='\n⚠ '+t('dieCutDisconnected');
    if(item && isRamp(item))dialog.querySelector('#twinDetails').textContent+='\n'+t(item.code==='RAMP-ANNEX-ENTRY'?'accessRamp':item.code==='RAMP-CONNECTOR'?'connectorNote':'ramp');
    if(item?.code==='STAIR-DIECUT')dialog.querySelector('#twinDetails').textContent+='\n'+t('accessStairs');
    if(item && isOfficeEntry(item))dialog.querySelector('#twinDetails').textContent+='\n'+t('officeSteps');
    if(item?.category==='Door' && /ROLL/i.test(item.code || '') && Math.abs(n(item.x))<1)dialog.querySelector('#twinDetails').textContent+='\n'+t('dockSite');
    if(s?.type==='equipment')dialog.querySelector('#twinDetails').textContent+=liveDetails(item);
    const liveMode=window.ChinChunLive?.mode();
    if(liveMode && liveMode!=='off')dialog.querySelector('[data-twin-text="note"]').textContent=t(liveMode==='simulation'?'liveSimNote':liveMode==='cloud'?'liveCloudNote':'liveOnNote');
    dialog.querySelector('#twinObjects').value=item?.id || '';
  }
  function fit(){fitExtent=null;zoom=detail?1.5:1;pan={x:0,y:0};threeNeedsFit=true;requestDraw();}
  function zoomAt(factor,x=width/2,y=height/2){if(usingThree()){threeView.zoomBy(factor);return;}const next=Math.max(.4,Math.min(8,zoom*factor)),ratio=next/zoom;pan={x:x-width/2-(x-width/2-pan.x)*ratio,y:y-height/2-(y-height/2-pan.y)*ratio};zoom=next;requestDraw();}
  function applyLegacyTouchGesture(baseline,points) {
    const delta=window.ChinChunThree.touchDelta(baseline.points,points,width,height);
    angle=baseline.angle+delta.yaw/(Math.PI/2);
    pitch=Math.max(25*Math.PI/180,Math.min(65*Math.PI/180,baseline.pitch+delta.pitch));
    zoom=Math.max(.4,Math.min(8,baseline.zoom*delta.zoom));
  }
  // Reuse the controls and their listeners; only presentation containers move.
  // This controller never reads or writes CAD, mesh, camera or cloud state.
  function bindCompactTwinControls(root) {
    const mobile=window.matchMedia('(max-width:900px)'),toolbar=root.querySelector('.twin-toolbar');
    const shell=root.querySelector('.twin-shell'),menus=new Map();
    const backdrop=document.createElement('button');backdrop.type='button';backdrop.className='twin-menu-backdrop';backdrop.hidden=true;
    backdrop.setAttribute('aria-label',t('closeControls'));shell.append(backdrop);
    for(const [name,key,selectors] of [
      ['view','viewMenu',['#twinRotate','#twinOrbitLeft','#twinTiltUp','#twinTiltDown','#twinResetView','#twinTopView','#twinMinus','#twinPlus','#twinCameraStatus','#twinFocus']],
      ['display','displayMenu',['#twinEngine','#twinLabels','#twinLive','#twinRoof','#twinPhotoDirections','#twinRestroomCutaway','#twinEngineStatus']],
      ['info','infoMenu',['#twinObjects']]
    ]){
      const trigger=document.createElement('button');trigger.type='button';trigger.className='twin-menu-toggle';trigger.dataset.twinText=key;
      trigger.id=`twin${name}Menu`;trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls',`twin${name}Panel`);
      const panel=document.createElement('section');panel.id=`twin${name}Panel`;panel.className=`twin-control-panel twin-${name}-panel`;
      panel.setAttribute('aria-labelledby',trigger.id);
      const heading=document.createElement('div');heading.className='twin-panel-heading';
      const title=document.createElement('strong');title.dataset.twinText=key;
      const close=document.createElement('button');close.type='button';close.dataset.twinText='menuClose';
      heading.append(title,close);panel.append(heading);
      selectors.forEach(selector=>{const control=root.querySelector(selector);if(control)panel.append(control.closest('label') || control);});
      toolbar.append(trigger,panel);menus.set(name,{trigger,panel,close});
    }
    // Restore these exact nodes to their desktop slots when leaving mobile.
    const information=Array.from(root.querySelectorAll('.twin-info,.twin-footer'),element=>{
      const anchor=document.createComment('twin desktop information slot');element.before(anchor);return {element,anchor};
    });
    const collapse=(restoreFocus=false)=>{
      for(const {trigger,panel} of menus.values()){
        if(restoreFocus && trigger.getAttribute('aria-expanded')==='true')trigger.focus();
        trigger.setAttribute('aria-expanded','false');panel.hidden=mobile.matches;
      }
      backdrop.hidden=true;
    };
    for(const {trigger,panel,close} of menus.values()){
      trigger.addEventListener('click',()=>{
        const opening=trigger.getAttribute('aria-expanded')!=='true';collapse();
        if(opening && mobile.matches){trigger.setAttribute('aria-expanded','true');panel.hidden=false;backdrop.hidden=false;}
      });
      close.addEventListener('click',()=>collapse(true));
    }
    backdrop.addEventListener('click',()=>collapse(true));
    root.addEventListener('keydown',event=>{
      if(event.key==='Escape' && !backdrop.hidden){event.preventDefault();event.stopImmediatePropagation();collapse(true);}
    },true);
    const adapt=()=>{
      information.forEach(({element,anchor})=>mobile.matches?menus.get('info').panel.append(element):anchor.after(element));
      collapse();
    };
    mobile.addEventListener('change',adapt);adapt();
    root.addEventListener('close',()=>collapse());
    return collapse;
  }
  function mount() {
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='twin-dialog';dialog.setAttribute('aria-labelledby','twinHeading');
    dialog.innerHTML=`<div class="twin-shell"><header class="twin-header"><div><div class="twin-eyebrow">CHIN CHUN · WORLD VIEW</div><h2 id="twinHeading"><span data-twin-text="title"></span> / 2.5D</h2></div><button id="twinClose" data-twin-text="close"></button></header><nav class="twin-toolbar"><label><span data-twin-text="floor"></span><select id="twinFloor"><option value="1F" data-twin-text="floor1"></option><option value="2F" data-twin-text="floor2"></option></select></label><button id="twinFit" data-twin-text="fit"></button><button id="twinRotate" data-twin-text="rotate"></button><button id="twinMinus" aria-label="Zoom out">−</button><button id="twinPlus" aria-label="Zoom in">＋</button><label><input id="twinLabels" type="checkbox" checked><span data-twin-text="labels"></span></label><label><span data-twin-text="select"></span><select id="twinObjects" style="max-width:220px"></select></label></nav><div class="twin-stage"><canvas aria-label="Isometric factory layout"></canvas><div class="twin-plaque">FACTORY ATLAS<br>配置世界 / ISOMETRIC DIORAMA</div><aside class="twin-info"><h3 id="twinName"></h3><p id="twinDetails"></p><button id="twinEdit" data-twin-text="edit" hidden></button></aside></div><footer class="twin-footer"><span id="twinCount"></span><span data-twin-text="help"></span></footer><div class="twin-footer" data-twin-text="note"></div></div>`;
    document.body.append(dialog);canvas=dialog.querySelector('canvas');ctx=canvas.getContext('2d');
    const engineLabel=document.createElement('label'),engineTitle=document.createElement('span'),engineSelect=document.createElement('select');
    engineTitle.dataset.twinText='engine';engineSelect.id='twinEngine';
    for(const [value,key] of [['three','threeEngine'],['legacy','legacyEngine']]){const option=new Option('',value);option.dataset.twinText=key;engineSelect.add(option);}
    engineSelect.onchange=e=>switchEngine(e.target.value);engineLabel.append(engineTitle,engineSelect);dialog.querySelector('.twin-toolbar').prepend(engineLabel);
    const engineStatus=document.createElement('span');engineStatus.id='twinEngineStatus';engineStatus.className='twin-engine-status';engineStatus.setAttribute('role','status');dialog.querySelector('.twin-toolbar').append(engineStatus);
    const topView=document.createElement('button');topView.id='twinTopView';topView.dataset.twinText='topView';topView.onclick=()=>{if(usingThree())threeView.top();};dialog.querySelector('.twin-toolbar').append(topView);
    const liveLabel=document.createElement('label'),liveTitle=document.createElement('span'),liveSelect=document.createElement('select');
    liveTitle.dataset.twinText='live';liveSelect.id='twinLive';liveSelect.onchange=e=>selectLive(e.target.value);liveLabel.append(liveTitle,liveSelect);dialog.querySelector('.twin-toolbar').append(liveLabel);
    const roofButton=document.createElement('button');roofButton.id='twinRoof';roofButton.dataset.twinText='buildingRoof';roofButton.hidden=true;
    roofButton.onclick=()=>{buildingRoof=!buildingRoof;updateInfo();requestDraw();};dialog.querySelector('.twin-toolbar').append(roofButton);
    const photoButton=document.createElement('button');photoButton.id='twinPhotoDirections';photoButton.dataset.twinText='photoDirections';photoButton.hidden=true;
    photoButton.onclick=()=>{photoDirections=!photoDirections;updateInfo();requestDraw();};dialog.querySelector('.twin-toolbar').append(photoButton);
    const focus=document.createElement('button');focus.id='twinFocus';focus.dataset.twinText='focus';focus.hidden=true;
    dialog.querySelector('.twin-toolbar').append(focus);
    const cutawayButton=document.createElement('button');cutawayButton.id='twinRestroomCutaway';cutawayButton.dataset.twinText='restroomCutaway';cutawayButton.hidden=true;
    cutawayButton.onclick=()=>{restroomCutaway=!restroomCutaway;updateInfo();requestDraw();};
    dialog.querySelector('.twin-toolbar').append(cutawayButton);
    focus.onclick=()=>{if(selected){detail=true;fit();closeTwinMenus();}};
    // Keep CAD delete/rotate/undo shortcuts from changing the model behind the modal.
    dialog.addEventListener('keydown',e=>{cameraKey(e);e.stopPropagation();});
    dialog.addEventListener('keyup',e=>e.stopPropagation());
    dialog.querySelector('#twinClose').onclick=()=>dialog.close();
    dialog.querySelector('#twinFloor').onchange=e=>{floor=e.target.value;selected=null;rebuild();fit();closeTwinMenus();};
    dialog.querySelector('#twinFit').onclick=()=>{detail=false;fit();closeTwinMenus();};
    dialog.querySelector('#twinRotate').onclick=()=>orbit(1);
    for(const [id,key,action] of [['twinOrbitLeft','orbitLeft',()=>orbit(-1)],['twinTiltUp','tiltUp',()=>tilt(5*Math.PI/180)],['twinTiltDown','tiltDown',()=>tilt(-5*Math.PI/180)],['twinResetView','resetView',resetView]]){
      const button=document.createElement('button');button.id=id;button.dataset.twinText=key;button.onclick=action;
      dialog.querySelector('.twin-toolbar').insertBefore(button,dialog.querySelector('#twinMinus'));
    }
    const cameraStatus=document.createElement('output');cameraStatus.id='twinCameraStatus';
    dialog.querySelector('.twin-toolbar').append(cameraStatus);
    dialog.querySelector('#twinPlus').onclick=()=>zoomAt(1.25);
    dialog.querySelector('#twinMinus').onclick=()=>zoomAt(.8);
    dialog.querySelector('#twinLabels').onchange=e=>{labels=e.target.checked;requestDraw();};
    dialog.querySelector('#twinObjects').onchange=e=>{selected=scene.find(s=>s.item.id===e.target.value)||null;if(!selected)detail=false;updateInfo();if(detail)fit();else requestDraw();};
    dialog.querySelector('#twinEdit').onclick=()=>{if(selected && selected.type!=='site'){const id=selected.type==='wall'?(data.walls || []).find(w=>selected.item.id===w.id || selected.item.id.startsWith(w.id+'_part_') || selected.item.id.startsWith(w.id+'_diecut_'))?.id || selected.item.id:selected.item.id;dialog.close();bridge?.edit(id,floor);}};
    closeTwinMenus=bindCompactTwinControls(dialog);
    canvas.addEventListener('wheel',e=>{if(usingThree())e.stopImmediatePropagation();cameraWheel(e);},{capture:true,passive:false});
    const rebaseLegacyTouch=()=>{legacyTouchBase=pointers.size===2?{points:[...pointers.values()].map(p=>[p.x,p.y]),angle,pitch,zoom}:null;if(pointers.size>=2 && gesture)gesture.moved=true;};
    canvas.onpointerdown=e=>{if(usingThree())return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!gesture)gesture={x:e.clientX,y:e.clientY,moved:false};rebaseLegacyTouch();};
    canvas.onpointermove=e=>{
      if(usingThree())return;
      const old=pointers.get(e.pointerId);if(!old || !gesture)return;
      const before=[...pointers.values()];pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){
        if(legacyTouchBase && window.ChinChunThree?.touchDelta){
          applyLegacyTouchGesture(legacyTouchBase,[...pointers.values()].map(p=>[p.x,p.y]));requestDraw();
        }else{const after=[...pointers.values()],dist=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(dist(before)>0)zoomAt(dist(after)/dist(before));}
        gesture.moved=true;
      }else if(pointers.size===1){pan.x+=e.clientX-old.x;pan.y+=e.clientY-old.y;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>4)gesture.moved=true;requestDraw();}
    };
    canvas.onpointerup=e=>{
      if(usingThree())return;
      if(gesture && !gesture.moved){const r=canvas.getBoundingClientRect();ctx.save();ctx.setTransform(1,0,0,1,0,0);selected=[...hits].reverse().find(h=>ctx.isPointInPath(h.path,e.clientX-r.left,e.clientY-r.top))?.s || (detail?selected:null);ctx.restore();updateInfo();requestDraw();}
      pointers.delete(e.pointerId);rebaseLegacyTouch();if(pointers.size===0)gesture=null;
    };
    canvas.onpointercancel=e=>{pointers.delete(e.pointerId);rebaseLegacyTouch();if(pointers.size===0)gesture=null;else if(gesture)gesture.moved=true;};
    canvas.onlostpointercapture=e=>{if(!usingThree() && pointers.delete(e.pointerId)){rebaseLegacyTouch();if(pointers.size===0)gesture=null;else if(gesture)gesture.moved=true;}};
    dialog.addEventListener('close',()=>{pointers.clear();gesture=null;legacyTouchBase=null;threeView?.setEnabled(false);document.getElementById('openDigitalTwin')?.focus();});
    let previousCanvasWidth=0;
    new ResizeObserver(entries=>{
      const size=entries[0].contentRect;
      if(size.width>0 && size.height>0){
        // Refit after phone orientation changes, retaining camera angles. A
        // browser address-bar height change alone must not reset user zoom.
        if(window.innerWidth<=900 && previousCanvasWidth>0 && Math.abs(size.width-previousCanvasWidth)>1){threeNeedsFit=true;fitExtent=null;}
        previousCanvasWidth=size.width;
      }
      requestDraw();
    }).observe(canvas);
  }
  window.ChinChunTwin={
    connect(api){bridge=api;
      window.ChinChunLive?.attach({layout:()=>data});
      window.ChinChunLive?.subscribe(()=>{if(!dialog?.open)return;if(selected?.type==='equipment')updateInfo();updateLiveButton();requestDraw();});document.getElementById('openDigitalTwin')?.addEventListener('click',()=>{mount();localize();closeTwinMenus();detail=false;dialog.showModal();threeView?.setEnabled(engineMode==='three');rebuild();fit();});},
    update(layout,activeFloor){data=layout;if(!dialog?.open){floor=activeFloor==='2F'?'2F':'1F';return;}rebuild();}
  };
})();
