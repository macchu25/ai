import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Presentation, PresentationFile } from "file:///C:/Users/dayla/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const ROOT = "C:\\Users\\dayla\\Downloads\\cardiac-alert\\cardiac-alert";
const THREAD_ID = process.env.CODEX_THREAD_ID || `manual-${Date.now()}`;
const WORKSPACE = path.join(os.tmpdir(), "codex-presentations", THREAD_ID, "cas-startup-pitch");
const TMP_DIR = path.join(WORKSPACE, "tmp");
const PREVIEW_DIR = path.join(TMP_DIR, "preview");
const LAYOUT_DIR = path.join(TMP_DIR, "layout");
const QA_DIR = path.join(TMP_DIR, "qa");
const OUTPUT_DIR = path.join(ROOT, "outputs");
const FINAL_PPTX = path.join(OUTPUT_DIR, "CAS_startup_pitch_deck.pptx");

const W = 1280;
const H = 720;
const C = {
  bg: "#08111f",
  panel: "#101b2d",
  panel2: "#14243a",
  ink: "#f8fafc",
  muted: "#a8b3c7",
  subtle: "#64748b",
  red: "#ef4444",
  amber: "#f59e0b",
  emerald: "#10b981",
  cyan: "#22d3ee",
  line: "#26364f",
  white: "#ffffff",
};

function pos(left, top, width, height) {
  return { left, top, width, height };
}

function addShape(slide, geometry, position, fill, lineFill = "none", width = 0, extra = {}) {
  return slide.shapes.add({
    geometry,
    position,
    fill,
    line: { style: "solid", fill: lineFill, width },
    ...extra,
  });
}

function addText(slide, text, position, style = {}) {
  const box = addShape(slide, "textbox", position, "none");
  box.text = text;
  box.text.style = {
    typeface: style.typeface || "Aptos",
    fontSize: style.fontSize || 24,
    color: style.color || C.ink,
    bold: style.bold || false,
    italic: style.italic || false,
    alignment: style.alignment || "left",
    ...style,
  };
  return box;
}

function addFooter(slide, n) {
  addText(slide, `CAS Startup Pitch  |  ${String(n).padStart(2, "0")}/15`, pos(72, 674, 360, 22), {
    fontSize: 12,
    color: C.subtle,
    bold: true,
  });
}

function addHeader(slide, kicker, title, n) {
  addText(slide, kicker.toUpperCase(), pos(72, 48, 520, 24), {
    fontSize: 13,
    color: C.cyan,
    bold: true,
  });
  addText(slide, title, pos(72, 84, 820, 94), {
    fontSize: 38,
    color: C.ink,
    bold: true,
    typeface: "Aptos Display",
  });
  addFooter(slide, n);
}

function addPill(slide, text, x, y, w, fill = C.panel2, color = C.ink) {
  addShape(slide, "roundRect", pos(x, y, w, 38), fill, C.line, 1, { borderRadius: "rounded-xl" });
  addText(slide, text, pos(x + 16, y + 8, w - 32, 20), {
    fontSize: 15,
    color,
    bold: true,
    alignment: "center",
  });
}

function addCard(slide, title, body, x, y, w, h, accent = C.cyan) {
  addShape(slide, "roundRect", pos(x, y, w, h), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
  addShape(slide, "rect", pos(x, y, 6, h), accent, "none", 0);
  addText(slide, title, pos(x + 24, y + 20, w - 48, 30), {
    fontSize: 20,
    bold: true,
    color: C.ink,
  });
  addText(slide, body, pos(x + 24, y + 58, w - 48, h - 76), {
    fontSize: 16,
    color: C.muted,
  });
}

function addStep(slide, number, title, detail, x, y, w, color) {
  addShape(slide, "ellipse", pos(x, y, 52, 52), color);
  addText(slide, number, pos(x, y + 12, 52, 22), {
    fontSize: 18,
    bold: true,
    color: C.white,
    alignment: "center",
  });
  addText(slide, title, pos(x + 68, y, w - 68, 28), { fontSize: 20, bold: true, color: C.ink });
  addText(slide, detail, pos(x + 68, y + 34, w - 68, 52), { fontSize: 15, color: C.muted });
}

function addNotes(slide, notes) {
  slide.speakerNotes.textFrame.setText(notes);
  slide.speakerNotes.setVisible(true);
}

async function writeBlob(file, blob) {
  await fs.writeFile(file, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  await fs.mkdir(LAYOUT_DIR, { recursive: true });
  await fs.mkdir(QA_DIR, { recursive: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await fs.writeFile(
    path.join(TMP_DIR, "source-notes.txt"),
    [
      "Source notes for CAS_startup_pitch_deck.pptx",
      "User-provided source: presentation_story_script.md in the project root.",
      "User-provided source: presentation_plan.md, read from user's Downloads folder earlier in the thread.",
      "All product/technical claims are drawn from user-provided project materials and local repository context.",
      "No external logos, customer marks, or third-party images are used.",
      "Visuals are editable PowerPoint shapes, text boxes, and simple diagrams generated in this script.",
    ].join("\n"),
  );

  await fs.writeFile(
    path.join(TMP_DIR, "slide-plan.txt"),
    [
      "Create mode: 15-slide Vietnamese startup pitch deck for Cardiac Alert System (CAS).",
      "Style: dark clinical-tech pitch deck, high contrast, editable native objects.",
      "Palette: dominant deep navy #08111f (60-70%), panels #101b2d/#14243a, accent red #ef4444 for emergency, cyan #22d3ee for AI/tech, emerald #10b981 for safety, amber #f59e0b for warning.",
      "Fonts: Aptos Display for titles, Aptos for body, Aptos for numbers/KPIs.",
      "Scale: cover title 58px, slide titles 34-40px, body 16-22px, KPI numbers 42-64px, footers 12px.",
      "Slides: 1 hook, 2 market pain, 3 solution, 4 ecosystem, 5 camera infrastructure, 6 AI core, 7 non-contact vitals, 8 alert timeline, 9 AI Brain, 10 business model, 11 UX, 12 security, 13 vision, 14 deployment, 15 close.",
    ].join("\n"),
  );

  const deck = Presentation.create({ slideSize: { width: W, height: H } });

  // Slide 1
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addShape(s, "ellipse", pos(858, 78, 340, 340), "#172a45", "none", 0);
    addShape(s, "ellipse", pos(930, 148, 196, 196), "#213b5f", "none", 0);
    addShape(s, "roundRect", pos(784, 346, 350, 176), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "EMERGENCY ALERT", pos(816, 376, 230, 24), { fontSize: 15, color: C.red, bold: true });
    addText(s, "Phát hiện bất thường", pos(816, 414, 250, 30), { fontSize: 25, color: C.ink, bold: true });
    addText(s, "Camera phòng khách • 20 giây", pos(816, 454, 270, 24), { fontSize: 17, color: C.muted });
    addShape(s, "roundRect", pos(816, 486, 214, 38), C.red, "none", 0, { borderRadius: "rounded-xl" });
    addText(s, "Gọi người thân", pos(842, 495, 162, 18), { fontSize: 16, color: C.white, bold: true, alignment: "center" });
    addText(s, "CAS", pos(72, 58, 180, 64), { fontSize: 58, bold: true, color: C.ink, typeface: "Aptos Display" });
    addText(s, "Cardiac Alert System", pos(72, 126, 520, 36), { fontSize: 26, color: C.cyan, bold: true });
    addText(s, "Biến camera trong gia đình thành hệ thống chăm sóc chủ động bằng AI", pos(72, 230, 620, 126), {
      fontSize: 42,
      bold: true,
      color: C.ink,
      typeface: "Aptos Display",
    });
    addText(s, "Không chỉ ghi lại sự cố. CAS cảnh báo khi sự cố đang xảy ra.", pos(76, 390, 560, 66), {
      fontSize: 22,
      color: C.muted,
    });
    addPill(s, "AI Camera", 76, 518, 138, C.panel2, C.cyan);
    addPill(s, "Cảnh báo đa kênh", 230, 518, 188, C.panel2, C.ink);
    addPill(s, "RAG Assistant", 434, 518, 160, C.panel2, C.emerald);
    addFooter(s, 1);
    addNotes(s, [
      "Mở đầu bằng câu chuyện một người mẹ lớn tuổi ở nhà một mình.",
      "Nhấn mạnh: camera vẫn ghi hình, nhưng camera không biết gọi ai.",
      "Giới thiệu CAS như một lớp bảo vệ chủ động: quan sát, phát hiện, cảnh báo và hỗ trợ người thân phản ứng trong giờ vàng.",
    ]);
  }

  // Slide 2
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Vấn đề thị trường", "Gia đình thiếu một người gác sức khỏe 24/7", 2);
    addText(s, "Khoảng trống không nằm ở việc thiếu thiết bị, mà nằm ở việc thiết bị chưa biết hành động.", pos(74, 170, 840, 48), {
      fontSize: 22,
      color: C.muted,
    });
    addCard(s, "Camera truyền thống", "Ghi lại quá khứ, nhưng không tự hiểu tai nạn và không tự gửi cảnh báo.", 72, 260, 350, 154, C.red);
    addCard(s, "Thiết bị đeo", "Phụ thuộc vào việc người dùng nhớ đeo, nhớ sạc và sử dụng đúng cách.", 466, 260, 350, 154, C.amber);
    addCard(s, "Gia đình", "Không thể túc trực 24/7, nhưng cần biết ngay khi người thân gặp nguy hiểm.", 860, 260, 350, 154, C.cyan);
    addShape(s, "roundRect", pos(174, 486, 932, 96), C.panel2, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Nỗi đau thật:", pos(212, 508, 170, 28), { fontSize: 22, bold: true, color: C.red });
    addText(s, "tai nạn xảy ra trong vài giây, nhưng người thân có thể biết sau vài phút hoặc vài giờ.", pos(384, 508, 660, 48), {
      fontSize: 22,
      color: C.ink,
    });
    addNotes(s, [
      "Nói về bối cảnh: người già, người bệnh tim mạch, đột quỵ, động kinh, Alzheimer.",
      "Nhấn mạnh camera truyền thống giống một nhân chứng im lặng.",
      "Kết luận: khách hàng không mua AI vì AI hay, họ mua sự an tâm.",
    ]);
  }

  // Slide 3
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Giải pháp", "Biến camera thành hệ thống chăm sóc chủ động", 3);
    const y = 248;
    const xs = [84, 298, 512, 726, 940];
    const labels = [
      ["Camera", "Thu hình từ nhà"],
      ["AI Engine", "Hiểu tư thế, sinh hiệu"],
      ["Backend", "Đánh giá nguy cơ"],
      ["Cảnh báo", "Web, Mobile, Telegram"],
      ["Người thân", "Phản ứng kịp thời"],
    ];
    labels.forEach(([t, d], i) => {
      addShape(s, "roundRect", pos(xs[i], y, 154, 128), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
      addText(s, t, pos(xs[i] + 18, y + 26, 118, 28), { fontSize: 21, bold: true, color: i === 3 ? C.red : C.ink, alignment: "center" });
      addText(s, d, pos(xs[i] + 16, y + 66, 122, 38), { fontSize: 15, color: C.muted, alignment: "center" });
      if (i < labels.length - 1) {
        addShape(s, "rightArrow", pos(xs[i] + 166, y + 44, 52, 40), i === 2 ? C.red : C.cyan, "none", 0);
      }
    });
    addShape(s, "roundRect", pos(138, 474, 1004, 94), "#0d2234", C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Định vị sản phẩm", pos(176, 496, 230, 28), { fontSize: 22, bold: true, color: C.cyan });
    addText(s, "CAS không bán một chiếc camera. CAS bán lớp dịch vụ thông minh giúp gia đình không bỏ lỡ khoảnh khắc nguy cấp.", pos(410, 494, 676, 52), {
      fontSize: 21,
      color: C.ink,
    });
    addNotes(s, [
      "Giải thích dòng chảy sản phẩm: camera ghi hình, AI phân tích, backend điều phối, cảnh báo đến người thân.",
      "Nêu rõ CAS tận dụng camera sẵn có để giảm rào cản triển khai.",
      "Chốt ý startup: sản phẩm là dịch vụ thông minh trên camera, không phải bán phần cứng đơn thuần.",
    ]);
  }

  // Slide 4
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Sản phẩm", "Một hệ sinh thái từ phát hiện đến cứu hộ", 4);
    const items = [
      ["AI Inference", "Té ngã, co giật, bất tỉnh", C.cyan],
      ["Go Backend", "Điều phối cảnh báo, bảo mật", C.emerald],
      ["Dashboard", "Giám sát trực tiếp 24/7", C.amber],
      ["Mobile App", "Nhận cảnh báo tức thời", C.red],
      ["AI Brain", "RAG hỏi đáp hồ sơ và sơ cứu", C.cyan],
      ["Billing & Ops", "Gói cước, thanh toán, triển khai", C.emerald],
    ];
    items.forEach(([t, d, color], i) => {
      const x = 92 + (i % 3) * 382;
      const y = 218 + Math.floor(i / 3) * 172;
      addCard(s, t, d, x, y, 320, 124, color);
    });
    addText(s, "Từ một tín hiệu video, CAS tạo ra một quy trình chăm sóc: quan sát → phân tích → xác minh → cảnh báo → hỗ trợ ra quyết định.", pos(122, 586, 1036, 42), {
      fontSize: 21,
      color: C.ink,
      alignment: "center",
    });
    addNotes(s, [
      "Trình bày CAS như một hệ sinh thái chứ không phải demo AI rời rạc.",
      "Đi qua từng tầng: camera, AI, sinh hiệu, cảnh báo, chatbot, billing và vận hành.",
      "Nhấn mạnh sản phẩm đã nghĩ đến triển khai, doanh thu và bảo mật.",
    ]);
  }

  // Slide 5
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Hạ tầng camera", "Nền móng: video phải ổn định, riêng tư và rẻ để mở rộng", 5);
    addStep(s, "01", "Quản lý theo UserID", "JWT kiểm soát quyền sở hữu camera, tránh truy cập chéo dữ liệu riêng tư.", 92, 222, 520, C.cyan);
    addStep(s, "02", "Quét RTSP tự động", "Goroutine quét cổng 554 trong mạng LAN để thêm camera thân thiện hơn.", 92, 336, 520, C.emerald);
    addStep(s, "03", "RTSP sang HLS", "FFmpeg chuyển luồng để Dashboard xem trực tiếp trên trình duyệt.", 92, 450, 520, C.amber);
    addShape(s, "roundRect", pos(746, 224, 378, 260), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "-c:v copy", pos(792, 264, 288, 62), { fontSize: 52, bold: true, color: C.red, typeface: "Aptos Display", alignment: "center" });
    addText(s, "Truyền video không mã hóa lại khi có thể", pos(792, 346, 288, 50), { fontSize: 22, color: C.ink, alignment: "center" });
    addText(s, "Ý nghĩa kinh doanh: giảm tải CPU, giảm chi phí hạ tầng, tăng số camera trên cùng tài nguyên.", pos(782, 418, 308, 54), { fontSize: 17, color: C.muted, alignment: "center" });
    addNotes(s, [
      "Nêu rằng hạ tầng camera là nền móng của sản phẩm.",
      "Giải thích UserID/JWT giúp bảo vệ camera gia đình.",
      "Nhấn mạnh -c:v copy là chi tiết kỹ thuật nhưng tạo lợi thế chi phí khi mở rộng.",
    ]);
  }

  // Slide 6
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Lõi AI", "Không chỉ thấy người ngã, mà hiểu đó có nguy hiểm không", 6);
    addShape(s, "roundRect", pos(72, 214, 304, 314), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "33 điểm khớp", pos(104, 258, 240, 42), { fontSize: 34, bold: true, color: C.cyan, alignment: "center" });
    addText(s, "MediaPipe Pose biến từng khung hình thành dữ liệu chuyển động con người.", pos(112, 326, 224, 88), { fontSize: 19, color: C.muted, alignment: "center" });
    addShape(s, "roundRect", pos(426, 214, 390, 314), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "CNN-1D + LSTM", pos(464, 250, 314, 42), { fontSize: 34, bold: true, color: C.ink, alignment: "center" });
    addText(s, "Xử lý 30 frame liên tiếp để hiểu tốc độ, hướng ngã và diễn biến tư thế.", pos(480, 318, 282, 88), { fontSize: 19, color: C.muted, alignment: "center" });
    addShape(s, "roundRect", pos(866, 214, 342, 314), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Giảm báo động giả", pos(900, 250, 274, 42), { fontSize: 31, bold: true, color: C.red, alignment: "center" });
    addText(s, "Spine Angle Drop + YOLOv11 + phân tích dao động sau ngã.", pos(914, 318, 246, 88), { fontSize: 19, color: C.muted, alignment: "center" });
    addText(s, "Lợi thế cạnh tranh: kết hợp nhiều tín hiệu để phân biệt nghỉ ngơi bình thường với tai nạn thật.", pos(148, 584, 984, 40), { fontSize: 22, color: C.ink, alignment: "center" });
    addNotes(s, [
      "Nêu thách thức: nằm trên giường là bình thường, nằm bất động dưới sàn mới nguy hiểm.",
      "Giải thích ba lớp: pose, CNN-LSTM, bộ lọc ngữ cảnh bằng YOLOv11 và dao động sau ngã.",
      "Chốt: báo động sai nhiều sẽ làm người dùng mất niềm tin, nên giảm báo động giả là lợi thế cạnh tranh.",
    ]);
  }

  // Slide 7
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Sinh hiệu không tiếp xúc", "Không đeo thiết bị vẫn có thể theo dõi dấu hiệu nguy hiểm", 7);
    addCard(s, "Nhịp tim rPPG", "Đọc biến đổi rất nhỏ của màu da mặt, qua DeepPhys, Butterworth và FFT để tính BPM.", 82, 226, 340, 170, C.red);
    addCard(s, "Nhịp thở", "Theo dõi dao động vùng ngực từ MediaPipe Pose để phát hiện thở nhanh, chậm hoặc nguy cơ ngưng thở.", 470, 226, 340, 170, C.cyan);
    addCard(s, "Biểu cảm đau", "Face Mesh phân tích lông mày, mắt và miệng để tạo điểm đau từ khuôn mặt.", 858, 226, 340, 170, C.amber);
    addShape(s, "roundRect", pos(162, 478, 956, 86), "#0d2234", C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Cá nhân hóa theo bệnh nền", pos(206, 504, 324, 30), { fontSize: 24, bold: true, color: C.emerald });
    addText(s, "Bệnh tim, bệnh phổi, thuốc chẹn beta → ngưỡng cảnh báo thay đổi theo từng bệnh nhân.", pos(532, 504, 534, 34), { fontSize: 20, color: C.ink });
    addNotes(s, [
      "Mở bằng câu hỏi: nếu người bệnh không đeo smartwatch thì sao?",
      "Giải thích rPPG, nhịp thở và Face Mesh ở mức dễ hiểu.",
      "Nhấn mạnh cá nhân hóa ngưỡng theo hồ sơ bệnh nền là giá trị chăm sóc, không chỉ là camera AI.",
    ]);
  }

  // Slide 8
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Cảnh báo khẩn cấp", "Từ tín hiệu bất thường đến hành động cứu hộ", 8);
    const steps = [
      ["3s", "Theo dõi", "Dashboard nhấp nháy, Telegram cảnh báo nghi vấn", C.amber],
      ["8s", "Bằng chứng", "Chụp ảnh sự cố từ camera và lưu lại", C.cyan],
      ["13s", "Cảnh báo đỏ", "Gửi Telegram kèm ảnh, lặp mỗi 5 giây", C.red],
      ["20s", "Gọi khẩn cấp", "Twilio gọi người thân bằng TTS tiếng Việt", C.emerald],
    ];
    steps.forEach(([num, title, detail, color], i) => {
      const x = 112 + i * 282;
      addShape(s, "ellipse", pos(x, 250, 86, 86), color);
      addText(s, num, pos(x, 272, 86, 30), { fontSize: 28, bold: true, color: C.white, alignment: "center" });
      addText(s, title, pos(x - 36, 360, 158, 30), { fontSize: 22, bold: true, color: C.ink, alignment: "center" });
      addText(s, detail, pos(x - 62, 400, 210, 72), { fontSize: 16, color: C.muted, alignment: "center" });
      if (i < steps.length - 1) addShape(s, "rightArrow", pos(x + 102, 276, 112, 36), C.panel2, C.line, 1);
    });
    addText(s, "Một cảnh báo tốt không chỉ nhanh. Nó phải đúng mức, có bằng chứng và kéo đúng người quay về tình huống khẩn cấp.", pos(144, 566, 992, 48), { fontSize: 22, color: C.ink, alignment: "center" });
    addNotes(s, [
      "Giải thích vì sao cảnh báo chia thành nhiều mốc thay vì báo động ngay lập tức.",
      "Nhấn mạnh ảnh bằng chứng giúp người thân đánh giá tình huống nhanh hơn.",
      "Chốt: CAS không chỉ biết có sự cố, mà biết gọi đúng người vào đúng thời điểm.",
    ]);
  }

  // Slide 9
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "AI Brain", "Từ cảnh báo đơn lẻ thành chăm sóc liên tục", 9);
    addShape(s, "roundRect", pos(92, 218, 440, 306), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Người thân hỏi", pos(126, 252, 280, 30), { fontSize: 24, bold: true, color: C.cyan });
    addText(s, "“Mẹ tôi tháng này đã té mấy lần?”\n“Chỉ số này có nguy hiểm với bệnh tim không?”\n“Nên sơ cứu thế nào trước?”", pos(126, 308, 360, 130), { fontSize: 21, color: C.ink });
    addShape(s, "rightArrow", pos(568, 340, 90, 42), C.red);
    addShape(s, "roundRect", pos(704, 218, 440, 306), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "RAG trả lời", pos(738, 252, 280, 30), { fontSize: 24, bold: true, color: C.emerald });
    addText(s, "Embedding → ChromaDB → Gemini 2.5 Flash Lite\n\nKết hợp hồ sơ sức khỏe, lịch sử sự cố và tài liệu sơ cứu.", pos(738, 308, 350, 132), { fontSize: 21, color: C.ink });
    addText(s, "Giá trị: người dùng có lý do quay lại sản phẩm cả trước, trong và sau sự cố.", pos(170, 584, 940, 40), { fontSize: 22, color: C.ink, alignment: "center" });
    addNotes(s, [
      "Nói rằng một cảnh báo chỉ báo có vấn đề, còn AI Brain cung cấp ngữ cảnh.",
      "Đưa ví dụ các câu hỏi người thân có thể hỏi.",
      "Nhấn mạnh đây là cách tăng giá trị vòng đời khách hàng và biến CAS thành nền tảng chăm sóc liên tục.",
    ]);
  }

  // Slide 10
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Mô hình kinh doanh", "SaaS cho chăm sóc an toàn tại nhà và cơ sở chăm sóc", 10);
    addCard(s, "B2C", "Gia đình có người già, người bệnh tim mạch, nguy cơ đột quỵ, động kinh hoặc sống một mình.", 92, 226, 500, 170, C.cyan);
    addCard(s, "B2B", "Viện dưỡng lão, phòng khám phục hồi chức năng, trung tâm chăm sóc sau đột quỵ.", 688, 226, 500, 170, C.emerald);
    const plans = [["Free", "1 cam"], ["Starter", "3 cam"], ["Creator", "10 cam"], ["Pro", "25 cam"], ["Scale", "1000 cam"]];
    plans.forEach(([name, cap], i) => {
      const x = 114 + i * 214;
      addShape(s, "roundRect", pos(x, 466, 164, 88), i === 3 ? C.red : C.panel2, C.line, 1, { borderRadius: "rounded-xl" });
      addText(s, name, pos(x + 14, 484, 136, 24), { fontSize: 20, bold: true, color: C.ink, alignment: "center" });
      addText(s, cap, pos(x + 14, 516, 136, 22), { fontSize: 18, color: i === 3 ? C.white : C.muted, alignment: "center" });
    });
    addText(s, "Doanh thu mở rộng: thuê bao phần mềm, triển khai camera, lưu trữ bằng chứng, AI nâng cao cho tổ chức.", pos(130, 600, 1020, 34), { fontSize: 20, color: C.ink, alignment: "center" });
    addNotes(s, [
      "Trình bày CAS có cả hướng B2C và B2B.",
      "Giải thích mô hình SaaS theo số lượng camera: bắt đầu nhỏ, mở rộng tự nhiên.",
      "Nêu thêm dịch vụ triển khai, lưu trữ bằng chứng và gói AI nâng cao như nguồn doanh thu tương lai.",
    ]);
  }

  // Slide 11
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Trải nghiệm người dùng", "Trong khẩn cấp, người dùng không có thời gian để đọc quá nhiều", 11);
    addShape(s, "roundRect", pos(126, 214, 460, 322), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Dashboard", pos(164, 250, 200, 32), { fontSize: 28, bold: true, color: C.ink });
    addShape(s, "roundRect", pos(164, 306, 160, 96), "#0f2b22", C.emerald, 2, { borderRadius: "rounded-xl" });
    addText(s, "AN TOÀN", pos(184, 342, 120, 20), { fontSize: 18, bold: true, color: C.emerald, alignment: "center" });
    addShape(s, "roundRect", pos(346, 306, 160, 96), "#351f0b", C.amber, 2, { borderRadius: "rounded-xl" });
    addText(s, "NGHI VẤN", pos(366, 342, 120, 20), { fontSize: 18, bold: true, color: C.amber, alignment: "center" });
    addShape(s, "roundRect", pos(255, 420, 160, 76), "#3a1116", C.red, 3, { borderRadius: "rounded-xl" });
    addText(s, "KHẨN CẤP", pos(275, 446, 120, 20), { fontSize: 18, bold: true, color: C.red, alignment: "center" });
    addCard(s, "Thiết kế cho tốc độ nhận thức", "Màu xanh, vàng, đỏ giúp người giám sát hiểu mức nguy hiểm trong vài giây.", 684, 234, 430, 118, C.cyan);
    addCard(s, "Tín hiệu sống của camera", "Pulse indicator cho biết luồng video còn hoạt động, tránh giám sát trên dữ liệu chết.", 684, 378, 430, 118, C.emerald);
    addText(s, "UI không chỉ để đẹp. UI là một phần của hệ thống cảnh báo.", pos(210, 594, 860, 36), { fontSize: 24, bold: true, color: C.ink, alignment: "center" });
    addNotes(s, [
      "Nhấn mạnh giao diện của CAS phục vụ tình huống căng thẳng.",
      "Người dùng cần biết ai gặp nguy hiểm, camera nào, mức độ nào, hệ thống đã làm gì.",
      "Chốt: UI giúp giảm thời gian nhận thức, nên cũng góp phần cứu hộ.",
    ]);
  }

  // Slide 12
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Bảo mật và niềm tin", "Không có niềm tin thì không có thị trường", 12);
    addCard(s, "JWT đa kênh", "Web, Mobile và WebSocket dùng xác thực để bảo vệ phiên người dùng.", 92, 222, 330, 134, C.cyan);
    addCard(s, "Secure HLS", "Luồng video được bảo vệ bằng token, hạn chế truy cập trái phép.", 476, 222, 330, 134, C.emerald);
    addCard(s, "Ownership", "Camera luôn kiểm tra UserID để tránh truy cập tài nguyên của người khác.", 860, 222, 330, 134, C.amber);
    addShape(s, "roundRect", pos(156, 442, 968, 102), "#151f32", C.red, 1, { borderRadius: "rounded-xl" });
    addText(s, "Lộ trình trước thương mại hóa", pos(200, 468, 336, 28), { fontSize: 23, bold: true, color: C.red });
    addText(s, "Bổ sung chữ ký webhook SePay • lọc analytics theo UserID • liên kết archive video bằng chứng với Alert Engine", pos(200, 506, 880, 26), { fontSize: 18, color: C.ink });
    addText(s, "Trung thực kỹ thuật giúp ban giám khảo thấy sản phẩm có lộ trình trưởng thành, không chỉ là demo.", pos(174, 602, 932, 34), { fontSize: 20, color: C.muted, alignment: "center" });
    addNotes(s, [
      "Nói rằng CAS xử lý video gia đình và dữ liệu sức khỏe, nên bảo mật là điều kiện sống còn.",
      "Trình bày các lớp bảo mật hiện có: JWT, secure HLS, ownership, X-API-Key.",
      "Thừa nhận các điểm cần hoàn thiện. Đây là cách thể hiện tư duy startup nghiêm túc.",
    ]);
  }

  // Slide 13
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Tầm nhìn mở rộng", "Từ phát hiện tai nạn đến phòng ngừa tai nạn", 13);
    addShape(s, "roundRect", pos(100, 222, 500, 296), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Hazard Zones", pos(142, 258, 300, 34), { fontSize: 30, bold: true, color: C.amber });
    addText(s, "Người dùng vẽ vùng nguy hiểm: cầu thang, bếp, nhà tắm, ban công. AI cảnh báo trước khi người bệnh tiến vào.", pos(142, 326, 390, 112), { fontSize: 22, color: C.ink });
    addShape(s, "roundRect", pos(680, 222, 500, 296), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Night Wandering", pos(722, 258, 330, 34), { fontSize: 30, bold: true, color: C.cyan });
    addText(s, "Theo dõi người Alzheimer hoặc người già rời giường ban đêm, gửi cảnh báo im lặng cho người chăm sóc.", pos(722, 326, 390, 112), { fontSize: 22, color: C.ink });
    addText(s, "Use case đầu tiên là té ngã. Nền tảng dài hạn là chăm sóc chủ động tại nhà.", pos(192, 588, 896, 36), { fontSize: 23, bold: true, color: C.ink, alignment: "center" });
    addNotes(s, [
      "Giải thích phiên bản hiện tại tập trung vào phát hiện và phản ứng.",
      "Tầm nhìn tiếp theo là phòng ngừa: vùng nguy hiểm, đi lang thang ban đêm.",
      "Nhấn mạnh khả năng mở rộng từ một use case sang nền tảng chăm sóc người già tại nhà.",
    ]);
  }

  // Slide 14
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addHeader(s, "Triển khai và vận hành", "Sẵn sàng đi ra ngoài máy demo", 14);
    addShape(s, "roundRect", pos(104, 222, 490, 310), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "Docker Compose", pos(148, 260, 270, 34), { fontSize: 30, bold: true, color: C.cyan });
    addText(s, "MongoDB\nRedis\nGo Backend\nNext.js Web App", pos(170, 328, 300, 134), { fontSize: 28, color: C.ink });
    addShape(s, "roundRect", pos(686, 222, 490, 310), C.panel, C.line, 1, { borderRadius: "rounded-xl" });
    addText(s, "VPS Recovery", pos(730, 260, 270, 34), { fontSize: 30, bold: true, color: C.emerald });
    addText(s, "FFmpeg • OpenGL • Mesa\nPython venv • PyTorch\nAI Hub • AI Brain", pos(730, 328, 360, 120), { fontSize: 26, color: C.ink });
    addText(s, "Một hệ thống cảnh báo sức khỏe không chỉ cần thông minh. Nó phải sẵn sàng đúng lúc.", pos(174, 596, 932, 34), { fontSize: 22, color: C.ink, alignment: "center" });
    addNotes(s, [
      "Nêu rằng startup không thể chỉ chạy trên máy lập trình viên.",
      "Trình bày Docker Compose và script khôi phục VPS.",
      "Chốt: độ ổn định vận hành cũng là một phần giá trị sản phẩm.",
    ]);
  }

  // Slide 15
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    addShape(s, "ellipse", pos(812, 72, 310, 310), "#172a45");
    addText(s, "CAS", pos(72, 62, 180, 62), { fontSize: 56, bold: true, color: C.ink, typeface: "Aptos Display" });
    addText(s, "Kết luận", pos(72, 136, 220, 26), { fontSize: 18, bold: true, color: C.cyan });
    addText(s, "CAS không chỉ bán phần mềm. CAS bán sự an tâm.", pos(72, 220, 730, 150), {
      fontSize: 50,
      bold: true,
      color: C.ink,
      typeface: "Aptos Display",
    });
    addText(s, "Khi người thân gặp nguy hiểm, họ không phải chờ đến khi ai đó tình cờ phát hiện.", pos(78, 406, 690, 62), {
      fontSize: 24,
      color: C.muted,
    });
    addCard(s, "Vấn đề thật", "Không thể túc trực 24/7.", 826, 242, 330, 92, C.red);
    addCard(s, "Giải pháp thật", "AI camera, cảnh báo đa kênh, RAG assistant.", 826, 360, 330, 108, C.cyan);
    addCard(s, "Mô hình rõ", "SaaS theo số lượng camera cho B2C và B2B.", 826, 494, 330, 108, C.emerald);
    addText(s, "Cảm ơn ban giám khảo, thầy cô và các bạn.", pos(78, 594, 650, 34), { fontSize: 24, color: C.ink });
    addFooter(s, 15);
    addNotes(s, [
      "Kết bằng cảm xúc: chúng ta yêu thương người thân nhưng không phải lúc nào cũng có mặt đúng lúc.",
      "Nhắc lại CAS: phát hiện, cảnh báo, hỗ trợ ra quyết định và có mô hình kinh doanh rõ.",
      "Dừng ở câu: CAS không chỉ bán phần mềm, CAS bán sự an tâm.",
    ]);
  }

  for (const [index, slide] of deck.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await writeBlob(path.join(PREVIEW_DIR, `${stem}.png`), png);
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(LAYOUT_DIR, `${stem}.layout.json`), await layout.text());
  }

  const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
  await writeBlob(path.join(PREVIEW_DIR, "deck-montage.webp"), montage);

  await fs.writeFile(
    path.join(QA_DIR, "visual-qa.txt"),
    [
      "Visual QA ledger",
      "Rendered all 15 slides to PNG and exported a montage.",
      "Checked layout intent in script: dark high-contrast style, large titles, limited body text per slide, editable native text and shapes.",
      "No external/unverified logos or images are used.",
      "Speaker notes are included on every slide for presenter guidance.",
      "Remaining caveat: visual inspection should be performed from rendered montage after export; deck uses generated editable shapes rather than product screenshots.",
    ].join("\n"),
  );

  const pptx = await PresentationFile.exportPptx(deck);
  await pptx.save(FINAL_PPTX);
  const stat = await fs.stat(FINAL_PPTX);
  console.log(JSON.stringify({ finalPptx: FINAL_PPTX, bytes: stat.size, workspace: WORKSPACE }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
