"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, LogOut, Heart, Wind, Activity } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

const GUIDE_STEPS: Record<string, { title: { vi: string; en: string }; text: { vi: string; en: string }; isWarning?: boolean }[]> = {
  fall: [
    { 
      title: { vi: "CẢNH BÁO SỰ CỐ NGÃ SẼ ĐƯỢC GỬI", en: "FALL ACCIDENT WARNING WILL BE SENT" }, 
      text: { 
        vi: "Hệ thống phát hiện có người ngã bất động. Nhấn HỦY nếu đây là báo động giả. Hệ thống sẽ tự động gọi 115 và bắt đầu hướng dẫn sơ cứu sau khi đếm ngược.",
        en: "The system detected an immobile fallen person. Press CANCEL if this is a false alarm. The system will automatically call 911 and begin first-aid instructions after countdown."
      },
      isWarning: true
    },
    { 
      title: { vi: "BƯỚC 1: KIỂM TRA PHẢN ỨNG", en: "STEP 1: CHECK RESPONSE" }, 
      text: {
        vi: "Tiến lại gần, lay mạnh vai nạn nhân và gọi to: CHÚ ƠI/ANH ƠI, CÓ SAO KHÔNG? Nếu không có phản ứng, chuyển ngay sang bước 2.",
        en: "Approach the victim, shake their shoulders firmly, and shout: HELLO, ARE YOU OKAY? If there is no response, proceed immediately to Step 2."
      }
    },
    { 
      title: { vi: "BƯỚC 2: KIỂM TRA ĐƯỜNG THỞ", en: "STEP 2: CHECK AIRWAY" }, 
      text: {
        vi: "Đặt một tay lên trán, đẩy đầu nạn nhân ngửa ra sau. Ngón tay của bàn tay kia nâng nhẹ cằm lên để mở rộng đường thở. Lắng nghe tiếng thở.",
        en: "Place one hand on the forehead, tilt the victim's head backward. Gently lift the chin with your other hand to open the airway. Listen for breathing."
      }
    },
    { 
      title: { vi: "BƯỚC 3: ÉP TIM KẾT HỢP (CPR)", en: "STEP 3: CARDIO PULMONARY RESUSCITATION (CPR)" }, 
      text: {
        vi: "Đặt gót bàn tay lên giữa ngực nạn nhân. Ép mạnh (sâu khoảng 5cm), ép nhanh (tốc độ 100-120 lần/phút). Yêu cầu người kế bên hỗ trợ hô hấp nhân tạo nếu biết cách.",
        en: "Place the heel of one hand in the center of the victim's chest. Push hard (about 2 inches deep) and push fast (rate of 100-120 compressions per minute). Ask someone nearby to perform rescue breaths if trained."
      }
    },
  ],
  hr_high: [
    {
      title: { vi: "CẢNH BÁO: NHỊP TIM QUÁ NHANH", en: "WARNING: TACHYCARDIA DETECTED" },
      text: {
        vi: "Hệ thống phát hiện nhịp tim của nạn nhân vượt quá ngưỡng an toàn. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn sơ cứu bắt đầu sau khi đếm ngược.",
        en: "The system detected the victim's heart rate exceeds the safe threshold. Press CANCEL if this is a false alarm. First-aid guide begins after countdown."
      },
      isWarning: true
    },
    {
      title: { vi: "BƯỚC 1: NGHỈ NGƠI & NỚI LỎNG QUẦN ÁO", en: "STEP 1: REST & LOOSEN CLOTHING" },
      text: {
        vi: "Hướng dẫn nạn nhân ngồi nghỉ ở tư thế nửa nằm nửa ngồi thoải mái. Nới lỏng khuy áo ở cổ, thắt lưng để hỗ trợ thở dễ dàng hơn.",
        en: "Guide the victim to rest in a comfortable semi-reclining position. Loosen buttons at the neck and belt to help them breathe more easily."
      }
    },
    {
      title: { vi: "BƯỚC 2: KỸ THUẬT HÍT THỞ SÂU", en: "STEP 2: DEEP BREATHING TECHNIQUE" },
      text: {
        vi: "Yêu cầu nạn nhân hít vào thật sâu bằng mũi, nén hơi 2-3 giây rồi thở ra chậm bằng miệng. Việc này giúp kích hoạt hệ phó giao cảm làm chậm nhịp tim.",
        en: "Ask the victim to take a very deep breath through the nose, hold it for 2-3 seconds, then exhale slowly through the mouth. This helps activate the parasympathetic system to slow down the heart rate."
      }
    },
    {
      title: { vi: "BƯỚC 3: NGHIỆM PHÁP VALSALVA", en: "STEP 3: VALSALVA MANEUVER" },
      text: {
        vi: "Nếu nạn nhân hoàn toàn tỉnh táo, bảo nạn nhân bịt mũi, ngậm chặt miệng và cố gắng thở mạnh ra trong 10-15 giây để hạ nhịp tim. Có thể chườm khăn mát hoặc nước lạnh lên vùng trán và má.",
        en: "If the victim is fully conscious, ask them to pinch their nose, keep their mouth closed, and try to blow out hard for 10-15 seconds to lower the heart rate. Apply a cool damp cloth or cold water to the forehead and cheeks."
      }
    },
    {
      title: { vi: "⚠️ LƯU Ý QUAN TRỌNG", en: "⚠️ IMPORTANT NOTE" },
      text: {
        vi: "Tuyệt đối KHÔNG tự ý cho nạn nhân uống bất kỳ thuốc hạ nhịp tim nào nếu không có đơn thuốc chỉ định của bác sĩ điều trị.",
        en: "Absolutely DO NOT give the victim any heart rate-lowering medication without a direct prescription from their treating physician."
      }
    }
  ],
  hr_low: [
    {
      title: { vi: "CẢNH BÁO: NHỊP TIM QUÁ CHẬM", en: "WARNING: BRADYCARDIA DETECTED" },
      text: {
        vi: "Hệ thống phát hiện nhịp tim giảm dưới mức an toàn nguy hiểm. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn sơ cứu bắt đầu sau khi đếm ngược.",
        en: "The system detected the heart rate dropped below the safe limit. Press CANCEL if this is a false alarm. First-aid guide begins after countdown."
      },
      isWarning: true
    },
    {
      title: { vi: "BƯỚC 1: NẰM NGỬA NÂNG CAO CHÂN", en: "STEP 1: LIE FLAT & ELEVATE LEGS" },
      text: {
        vi: "Đặt nạn nhân nằm ngửa trên giường hoặc sàn nhà phẳng. Kê cao hai chân lên khoảng 30 đến 45 độ bằng gối hoặc chăn cuộn để dồn máu từ chân về tim và não nhanh hơn, phòng ngừa ngất xỉu.",
        en: "Place the victim flat on their back on a bed or flat floor. Elevate both legs about 30 to 45 degrees using pillows or rolled blankets to speed up blood flow back to the heart and brain, preventing fainting."
      }
    },
    {
      title: { vi: "BƯỚC 2: GIỮ ẤM & THÔNG THOÁNG", en: "STEP 2: KEEP WARM & VENTILATED" },
      text: {
        vi: "Đắp chăn giữ ấm cơ thể nếu nạn nhân cảm thấy lạnh hoặc da tái nhợt. Nới lỏng cổ áo và thắt lưng của nạn nhân.",
        en: "Cover with a blanket to keep the body warm if the victim feels cold or looks pale. Loosen their collar and belt."
      }
    },
    {
      title: { vi: "BƯỚC 3: THEO DÕI SÁT SAO", en: "STEP 3: MONITOR CLOSELY" },
      text: {
        vi: "Liên tục kiểm tra ý thức và nhịp thở của nạn nhân. Nếu nạn nhân đột ngột bất tỉnh và ngừng thở, phải lập tức chuyển sang tiến hành ép tim ngoài lồng ngực (CPR).",
        en: "Continuously check the victim's consciousness and breathing. If they suddenly lose consciousness and stop breathing, switch immediately to CPR."
      }
    }
  ],
  apnea: [
    {
      title: { vi: "CẢNH BÁO: NGỪNG THỞ / SUY HÔ HẤP", en: "WARNING: APNEA / RESPIRATORY DISTRESS" },
      text: {
        vi: "Hệ thống phát hiện dấu hiệu ngưng thở lâm sàng hoặc suy hô hấp cực kỳ nguy hiểm. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn sơ cứu bắt đầu sau khi đếm ngược.",
        en: "The system detected signs of clinical apnea or critical respiratory distress. Press CANCEL if this is a false alarm. First-aid guide begins after countdown."
      },
      isWarning: true
    },
    {
      title: { vi: "BƯỚC 1: KHAI THÔNG ĐƯỜNG THỞ", en: "STEP 1: CLEAR THE AIRWAY" },
      text: {
        vi: "Đặt nạn nhân nằm ngửa trên nền phẳng, cứng. Thực hiện kỹ thuật ngửa đầu - nâng cằm để mở rộng đường thở. Kiểm tra nhanh và lấy mọi dị vật, đờm nhớt trong miệng nạn nhân ra ngoài.",
        en: "Place the victim flat on their back on a firm, flat surface. Perform the head tilt-chin lift maneuver to open the airway. Quickly check and remove any foreign objects, saliva, or vomit from their mouth."
      }
    },
    {
      title: { vi: "BƯỚC 2: HÀ HƠI THỔI NGẠT KHẨN CẤP", en: "STEP 2: EMERGENCY RESCUE BREATHS" },
      text: {
        vi: "Bịt chặt mũi nạn nhân, áp miệng thổi một hơi thật mạnh trong 1 giây để lồng ngực phồng lên. Thực hiện 2 lần thổi ngạt liên tiếp.",
        en: "Pinch the victim's nose closed, seal your mouth over theirs, and blow firmly for 1 second to make the chest rise. Deliver 2 consecutive rescue breaths."
      }
    },
    {
      title: { vi: "BƯỚC 3: ÉP TIM KẾT HỢP", en: "STEP 3: COMBINE WITH COMPRESSIONS" },
      text: {
        vi: "Kiểm tra mạch đập ở cổ. Nếu không có mạch, bắt đầu ngay chu kỳ 30 lần ép tim ngoài lồng ngực xen kẽ 2 lần thổi ngạt liên tục cho đến khi nhân viên y tế đến.",
        en: "Check for a pulse in the neck. If there is no pulse, immediately begin cycles of 30 chest compressions followed by 2 rescue breaths. Repeat until medical help arrives."
      }
    }
  ],
  seizure: [
    {
      title: { vi: "CẢNH BÁO: PHÁT HIỆN CO GIẬT", en: "WARNING: SEIZURE DETECTED" },
      text: {
        vi: "Hệ thống phát hiện biểu hiện co giật liên tục nghi vấn động kinh. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn sơ cứu bắt đầu sau khi đếm ngược.",
        en: "The system detected continuous seizure movements suggestive of epilepsy. Press CANCEL if this is a false alarm. First-aid guide begins after countdown."
      },
      isWarning: true
    },
    {
      title: { vi: "BƯỚC 1: TẠO KHÔNG GIAN AN TOÀN", en: "STEP 1: CREATE A SAFE SPACE" },
      text: {
        vi: "Di chuyển ngay các vật sắc nhọn, thủy tinh, đồ đạc cứng xung quanh để tránh nạn nhân va đập tự gây thương tích.",
        en: "Immediately move any sharp objects, glass, or hard furniture away to prevent the victim from hurting themselves during the seizure."
      }
    },
    {
      title: { vi: "BƯỚC 2: BẢO VỆ ĐẦU", en: "STEP 2: PROTECT THE HEAD" },
      text: {
        vi: "Đặt một chiếc gối mỏng, mềm hoặc tấm áo cuộn lại dưới đầu nạn nhân để chống va đập mạnh xuống sàn nhà.",
        en: "Place a thin, soft pillow or a rolled-up jacket under the victim's head to cushion them against hard impacts on the floor."
      }
    },
    {
      title: { vi: "BƯỚC 3: THEO DÕI ĐƯỜNG THỞ", en: "STEP 3: MONITOR THE AIRWAY" },
      text: {
        vi: "Nới lỏng cổ áo, thắt lưng. Khi cơn co giật dịu đi, xoay nhẹ người nạn nhân nằm nghiêng để đờm dãi chảy ra ngoài tự nhiên.",
        en: "Loosen their collar and belt. Once the convulsions subside, gently turn the victim onto their side (recovery position) to let any saliva drain naturally."
      }
    },
    {
      title: { vi: "⚠️ CẢNH BÁO ĐIỀU CẤM KỴ", en: "⚠️ ABSOLUTE DON'TS" },
      text: {
        vi: "Tuyệt đối KHÔNG ghì chặt hay cố đè giữ tay chân nạn nhân để cắt cơn giật. KHÔNG đút ngón tay, muỗng, hoặc bất cứ vật cứng nào vào miệng nạn nhân vì có thể gây gãy răng hoặc bít tắc đường thở.",
        en: "Absolutely DO NOT hold down or restrict the victim's limbs to stop the convulsions. DO NOT put fingers, spoons, or any hard objects into the victim's mouth, as this can cause tooth fractures or airway obstruction."
      }
    }
  ],
  head: [
    {
      title: { vi: "SƠ CỨU: CHẤN THƯƠNG ĐẦU / BẤT TỈNH", en: "FIRST AID: HEAD INJURY / UNCONSCIOUS" },
      text: {
        vi: "Hướng dẫn sơ cứu chấn thương đầu hoặc bất tỉnh. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn bắt đầu sau khi đếm ngược.",
        en: "First-aid instructions for head injury or loss of consciousness. Press CANCEL if this is a false alarm. Guide starts after countdown."
      },
      isWarning: true
    },
    {
      title: { vi: "BƯỚC 1: CỐ ĐỊNH CỘT SỐNG CỔ", en: "STEP 1: STABILIZE CERVICAL SPINE" },
      text: {
        vi: "Giữ đầu và cổ thẳng hàng với thân mình. Tuyệt đối KHÔNG tự ý bế xốc hay di chuyển đầu nạn nhân để tránh nguy cơ tổn thương tủy cổ gây liệt vĩnh viễn.",
        en: "Keep the head and neck aligned with the torso. Absolutely DO NOT lift up or move the victim's head to prevent cervical spinal cord damage, which can cause permanent paralysis."
      }
    },
    {
      title: { vi: "BƯỚC 2: KIỂM TRA ĐƯỜNG THỞ", en: "STEP 2: CHECK AIRWAY" },
      text: {
        vi: "Nếu nạn nhân bất tỉnh nhưng vẫn còn thở đều: Nghiêng nhẹ người nạn nhân sang tư thế nằm nghiêng an toàn (tư thế hồi phục) để đờm nhớt hoặc chất nôn chảy ra ngoài, tránh sặc.",
        en: "If the victim is unconscious but breathing normally: Gently roll them onto their side into a safe recovery position to allow saliva or vomit to drain out and prevent choking."
      }
    },
    {
      title: { vi: "BƯỚC 3: XỬ LÝ CHẢY MÁU", en: "STEP 3: TREAT BLEEDING" },
      text: {
        vi: "Nếu có vết thương chảy máu ở đầu, dùng băng gạc sạch ấn nhẹ để cầm máu. Tránh đè ép quá mạnh lên các vị trí nghi ngờ nứt sọ.",
        en: "If there is a bleeding head wound, apply light pressure with a clean sterile dressing to stop bleeding. Avoid pushing hard on areas where a skull fracture is suspected."
      }
    }
  ],
  bone: [
    {
      title: { vi: "SƠ CỨU: NGHI GÃY XƯƠNG / KHỚP", en: "FIRST AID: SUSPECTED BONE / JOINT FRACTURE" },
      text: {
        vi: "Hướng dẫn sơ cứu chấn thương xương khớp. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn bắt đầu sau khi đếm ngược.",
        en: "First-aid instructions for bone and joint injuries. Press CANCEL if this is a false alarm. Guide starts after countdown."
      },
      isWarning: true
    },
    {
      title: { vi: "BƯỚC 1: BẤT ĐỘNG VÙNG THƯƠNG TỔN", en: "STEP 1: IMMOBILIZE THE INJURED AREA" },
      text: {
        vi: "Yêu cầu nạn nhân giữ nguyên tư thế. Tuyệt đối KHÔNG tự ý nắn chỉnh xương bị gãy hoặc kéo khớp bị trật về vị trí cũ.",
        en: "Instruct the victim to remain still. Absolutely DO NOT attempt to realign a broken bone or pull a dislocated joint back into place."
      }
    },
    {
      title: { vi: "BƯỚC 2: DÙNG NẸP TẠM THỜI", en: "STEP 2: APPLY TEMPORARY SPLINT" },
      text: {
        vi: "Đặt nẹp gỗ, bìa carton cứng dọc theo vùng xương bị gãy, cố định bằng băng cuộn hoặc vải mềm ở hai đầu khớp phía trên và phía dưới vị trí gãy xương.",
        en: "Place wooden splints or stiff cardboard along the broken limb, securing them with rolled bandages or soft cloth at the joints above and below the fracture site."
      }
    },
    {
      title: { vi: "BƯỚC 3: CHƯỜM LẠNH GIẢM ĐAU", en: "STEP 3: COLD COMPRESS FOR PAIN RELIEF" },
      text: {
        vi: "Chườm túi đá mát bọc trong khăn vải lên vùng bị sưng đau trong 15-20 phút để giảm phù nề và giảm đau tạm thời.",
        en: "Apply an ice pack wrapped in a cloth to the swollen painful area for 15-20 minutes to reduce swelling and temporarily relieve pain."
      }
    }
  ],
  blood: [
    {
      title: { vi: "SƠ CỨU: CHẢY MÁU / VẾT THƯƠNG HỞ", en: "FIRST AID: BLEEDING / OPEN WOUND" },
      text: {
        vi: "Hướng dẫn sơ cứu vết thương chảy máu. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn bắt đầu sau khi đếm ngược.",
        en: "First-aid instructions for bleeding wounds. Press CANCEL if this is a false alarm. Guide starts after countdown."
      },
      isWarning: true
    },
    {
      title: { vi: "BƯỚC 1: ĐÈ ÉP TRỰC TIẾP LÊN VẾT THƯƠNG", en: "STEP 1: APPLY DIRECT PRESSURE" },
      text: {
        vi: "Dùng một miếng gạc sạch hoặc khăn vải sạch ấn trực tiếp lên miệng vết thương đang chảy máu trong 5 đến 10 phút để tạo cục máu đông cầm máu.",
        en: "Use a clean sterile gauze or cloth to press directly onto the bleeding wound for 5 to 10 minutes to help form a blood clot and stop bleeding."
      }
    },
    {
      title: { vi: "BƯỚC 2: BĂNG ÉP CỐ ĐỊNH", en: "STEP 2: SECURE PRESSURE BANDAGE" },
      text: {
        vi: "Băng chặt vết thương bằng băng cuộn. Nếu máu thấm qua lớp băng đầu tiên, đặt thêm một lớp gạc khác đè lên và băng đè tiếp, KHÔNG tháo lớp băng cũ ra.",
        en: "Wrap the wound tightly with a roller bandage. If blood leaks through the first layer, place another gauze pad on top and wrap over it. DO NOT remove the original bandage."
      }
    },
    {
      title: { vi: "BƯỚC 3: NÂNG CAO CHI VẾT THƯƠNG", en: "STEP 3: ELEVATE THE INJURED LIMB" },
      text: {
        vi: "Nếu vết thương nằm ở tay hoặc chân, hãy kê cao chi bị thương hơn mức tim của nạn nhân để giảm bớt áp lực máu chảy.",
        en: "If the wound is on an arm or leg, elevate the injured limb above the victim's heart level to help reduce blood pressure and bleeding rate."
      }
    }
  ],
  stroke: [
    {
      title: { vi: "SƠ CỨU: NGHI ĐỘT QUỴ (STROKE)", en: "FIRST AID: SUSPECTED STROKE" },
      text: {
        vi: "Hướng dẫn nhận biết và xử lý đột quỵ khẩn cấp. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn bắt đầu sau khi đếm ngược.",
        en: "First-aid instructions for recognizing and handling stroke emergencies. Press CANCEL if this is a false alarm. Guide starts after countdown."
      },
      isWarning: true
    },
    {
      title: { vi: "BƯỚC 1: KIỂM TRA QUY TẮC F.A.S.T", en: "STEP 1: CHECK F.A.S.T CRITERIA" },
      text: {
        vi: "F - Gương mặt bị lệch, chảy xệ một bên. A - Tay hoặc chân bị yếu, tê liệt không nâng lên được. S - Nói ngọng, phát âm khó khăn hoặc không hiểu lời nói. T - Gọi ngay 115 khẩn cấp.",
        en: "F - Face drooping on one side. A - Arm weakness or paralysis on one side. S - Speech difficulty, slurring or not understanding words. T - Time to call 911 emergency services immediately."
      }
    },
    {
      title: { vi: "BƯỚC 2: ĐẶT NẰM NGHIÊNG AN TOÀN", en: "STEP 2: SAFE RECOVERY POSITION" },
      text: {
        vi: "Để nạn nhân nằm nghỉ nơi thông thoáng. Nếu nạn nhân bất tỉnh hoặc nôn mửa, lập tức xoay nghiêng người sang một bên để tránh chất nôn tràn ngược vào đường thở.",
        en: "Allow the victim to rest in a well-ventilated space. If they lose consciousness or vomit, immediately roll them onto their side to prevent choking."
      }
    },
    {
      title: { vi: "BƯỚC 3: ⚠️ CÁC ĐIỀU CẤM KỴ", en: "STEP 3: ⚠️ ABSOLUTE DON'TS" },
      text: {
        vi: "Tuyệt đối KHÔNG cạo gió, chích lể ngón tay nạn nhân. KHÔNG cho nạn nhân ăn uống bất cứ thứ gì, kể cả nước ấm hay thuốc hạ huyết áp vì có thể gây sặc bít tắc đường thở.",
        en: "Absolutely DO NOT perform skin scraping (cao gio) or prick the victim's fingers. DO NOT give them anything to eat or drink, including warm water or blood pressure medication, as it may cause choking."
      }
    }
  ]
};

function getGuideIcon(type: string) {
  switch (type) {
    case 'hr_high':
    case 'hr_low':
      return <Heart size={64} color="var(--danger)" style={{ margin: '0 auto 20px' }} className="animate-pulse" />;
    case 'apnea':
      return <Wind size={64} color="var(--accent)" style={{ margin: '0 auto 20px' }} className="animate-pulse" />;
    case 'seizure':
      return <Activity size={64} color="var(--warning)" style={{ margin: '0 auto 20px' }} className="animate-pulse" />;
    default:
      return <ShieldAlert size={64} color="var(--danger)" style={{ margin: '0 auto 20px' }} />;
  }
}

function CPRScreenContent() {
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(30);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();

  const rawType = searchParams.get('type') || 'fall';
  const type = GUIDE_STEPS[rawType] ? rawType : 'fall';
  const steps = GUIDE_STEPS[type];

  // Reset step and timer when type changes
  useEffect(() => {
    setStep(0);
    setTimer(30);
    window.speechSynthesis?.cancel();
  }, [type]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      synth.cancel();
      
      const currentStep = steps[step];
      if (currentStep) {
        const textToSpeak = currentStep.text[language] || currentStep.text['vi'];
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
        utterance.rate = 0.95;
        synth.speak(utterance);
      }
    }
  }, [step, type, steps, language]);

  useEffect(() => {
    if (step >= steps.length - 1 && timer === 0) return;

    const interval = setInterval(() => {
       setTimer(prev => {
          if (prev <= 1) {
             if (step < steps.length - 1) {
                 setStep(s => s + 1);
                 return 30;
             }
             clearInterval(interval);
             return 0;
          }
          return prev - 1;
       })
     }, 1000);

    return () => clearInterval(interval);
  }, [step, timer, steps.length]);

  const handleCancel = () => {
    window.speechSynthesis?.cancel();
    alert(t('cpr.alertCancelled'));
    router.push('/');
  };

  const currentStep = steps[step] || steps[0];

  return (
    <div className="cpr-fullscreen" style={{ background: currentStep.isWarning ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)' }}>
      <div className="cpr-step-card" key={`${type}-${step}`}>
        {currentStep.isWarning ? getGuideIcon(type) : null}
        
        <h2 className={`cpr-title ${!currentStep.isWarning ? 'text-accent' : ''}`}>{currentStep.title[language] || currentStep.title['vi']}</h2>
        <p style={{ fontSize: '1.5rem', lineHeight: 1.6, marginBottom: '40px', color: 'var(--text-main)' }}>
          {currentStep.text[language] || currentStep.text['vi']}
        </p>

        <div style={{ margin: '30px 0' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 600 }}>
            {currentStep.isWarning ? t('cpr.timerWarning') : t('cpr.timerStep')}
          </div>
          <div className="cpr-timer">
            {timer}s
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px' }}>
          <button className="btn btn-danger" onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', padding: '16px 32px' }}>
            <LogOut size={24} />
            {t('cpr.cancelBtn')}
          </button>
          
          {step < steps.length - 1 && (
            <button className="btn btn-primary" onClick={() => { setStep(s => s + 1); setTimer(30); }} style={{ fontSize: '1.2rem', padding: '16px 32px' }}>
              {t('cpr.skipBtn')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CPRScreen() {
  const { t } = useLanguage();
  
  return (
    <Suspense fallback={
      <div className="cpr-fullscreen">
        <div className="cpr-step-card">
          <h2 className="cpr-title">{t('cpr.loading')}</h2>
        </div>
      </div>
    }>
      <CPRScreenContent />
    </Suspense>
  );
}
