"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, LogOut, Heart, Wind, Activity } from 'lucide-react';

const GUIDE_STEPS: Record<string, { title: string; text: string; isWarning?: boolean }[]> = {
  fall: [
    { 
      title: "CẢNH BÁO SỰ CỐ NGÃ SẼ ĐƯỢC GỬI", 
      text: "Hệ thống phát hiện có người ngã bất động. Nhấn HỦY nếu đây là báo động giả. Hệ thống sẽ tự động gọi 115 và bắt đầu hướng dẫn sơ cứu sau khi đếm ngược.",
      isWarning: true
    },
    { 
      title: "BƯỚC 1: KIỂM TRA PHẢN ỨNG", 
      text: "Tiến lại gần, lay mạnh vai nạn nhân và gọi to: CHÚ ƠI/ANH ƠI, CÓ SAO KHÔNG? Nếu không có phản ứng, chuyển ngay sang bước 2."
    },
    { 
      title: "BƯỚC 2: KIỂM TRA ĐƯỜNG THỞ", 
      text: "Đặt một tay lên trán, đẩy đầu nạn nhân ngửa ra sau. Ngón tay của bàn tay kia nâng nhẹ cằm lên để mở rộng đường thở. Lắng nghe tiếng thở."
    },
    { 
      title: "BƯỚC 3: ÉP TIM KẾT HỢP (CPR)", 
      text: "Đặt gót bàn tay lên giữa ngực nạn nhân. Ép mạnh (sâu khoảng 5cm), ép nhanh (tốc độ 100-120 lần/phút). Yêu cầu người kế bên hỗ trợ hô hấp nhân tạo nếu biết cách."
    },
  ],
  hr_high: [
    {
      title: "CẢNH BÁO: NHỊP TIM QUÁ NHANH",
      text: "Hệ thống phát hiện nhịp tim của nạn nhân vượt quá ngưỡng an toàn. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn sơ cứu bắt đầu sau khi đếm ngược.",
      isWarning: true
    },
    {
      title: "BƯỚC 1: NGHỈ NGƠI & NỚI LỎNG QUẦN ÁO",
      text: "Hướng dẫn nạn nhân ngồi nghỉ ở tư thế nửa nằm nửa ngồi thoải mái. Nới lỏng khuy áo ở cổ, thắt lưng để hỗ trợ thở dễ dàng hơn."
    },
    {
      title: "BƯỚC 2: KỸ THUẬT HÍT THỞ SÂU",
      text: "Yêu cầu nạn nhân hít vào thật sâu bằng mũi, nén hơi 2-3 giây rồi thở ra chậm bằng miệng. Việc này giúp kích hoạt hệ phó giao cảm làm chậm nhịp tim."
    },
    {
      title: "BƯỚC 3: NGHIỆM PHÁP VALSALVA",
      text: "Nếu nạn nhân hoàn toàn tỉnh táo, bảo nạn nhân bịt mũi, ngậm chặt miệng và cố gắng thở mạnh ra trong 10-15 giây để hạ nhịp tim. Có thể chườm khăn mát hoặc nước lạnh lên vùng trán và má."
    },
    {
      title: "⚠️ LƯU Ý QUAN TRỌNG",
      text: "Tuyệt đối KHÔNG tự ý cho nạn nhân uống bất kỳ thuốc hạ nhịp tim nào nếu không có đơn thuốc chỉ định của bác sĩ điều trị."
    }
  ],
  hr_low: [
    {
      title: "CẢNH BÁO: NHỊP TIM QUÁ CHẬM",
      text: "Hệ thống phát hiện nhịp tim giảm dưới mức an toàn nguy hiểm. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn sơ cứu bắt đầu sau khi đếm ngược.",
      isWarning: true
    },
    {
      title: "BƯỚC 1: NẰM NGỬA NÂNG CAO CHÂN",
      text: "Đặt nạn nhân nằm ngửa trên giường hoặc sàn nhà phẳng. Kê cao hai chân lên khoảng 30 đến 45 độ bằng gối hoặc chăn cuộn để dồn máu từ chân về tim và não nhanh hơn, phòng ngừa ngất xỉu."
    },
    {
      title: "BƯỚC 2: GIỮ ẤM & THÔNG THOÁNG",
      text: "Đắp chăn giữ ấm cơ thể nếu nạn nhân cảm thấy lạnh hoặc da tái nhợt. Nới lỏng cổ áo và thắt lưng của nạn nhân."
    },
    {
      title: "BƯỚC 3: THEO DÕI SÁT SAO",
      text: "Liên tục kiểm tra ý thức và nhịp thở của nạn nhân. Nếu nạn nhân đột ngột bất tỉnh và ngừng thở, phải lập tức chuyển sang tiến hành ép tim ngoài lồng ngực (CPR)."
    }
  ],
  apnea: [
    {
      title: "CẢNH BÁO: NGỪNG THỞ / SUY HÔ HẤP",
      text: "Hệ thống phát hiện dấu hiệu ngưng thở lâm sàng hoặc suy hô hấp cực kỳ nguy hiểm. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn sơ cứu bắt đầu sau khi đếm ngược.",
      isWarning: true
    },
    {
      title: "BƯỚC 1: KHAI THÔNG ĐƯỜNG THỞ",
      text: "Đặt nạn nhân nằm ngửa trên nền phẳng, cứng. Thực hiện kỹ thuật ngửa đầu - nâng cằm để mở rộng đường thở. Kiểm tra nhanh và lấy mọi dị vật, đờm nhớt trong miệng nạn nhân ra ngoài."
    },
    {
      title: "BƯỚC 2: HÀ HƠI THỔI NGẠT KHẨN CẤP",
      text: "Bịt chặt mũi nạn nhân, áp miệng thổi một hơi thật mạnh trong 1 giây để lồng ngực phồng lên. Thực hiện 2 lần thổi ngạt liên tiếp."
    },
    {
      title: "BƯỚC 3: ÉP TIM KẾT HỢP",
      text: "Kiểm tra mạch đập ở cổ. Nếu không có mạch, bắt đầu ngay chu kỳ 30 lần ép tim ngoài lồng ngực xen kẽ 2 lần thổi ngạt liên tục cho đến khi nhân viên y tế đến."
    }
  ],
  seizure: [
    {
      title: "CẢNH BÁO: PHÁT HIỆN CO GIẬT",
      text: "Hệ thống phát hiện biểu hiện co giật liên tục nghi vấn động kinh. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn sơ cứu bắt đầu sau khi đếm ngược.",
      isWarning: true
    },
    {
      title: "BƯỚC 1: TẠO KHÔNG GIAN AN TOÀN",
      text: "Di chuyển ngay các vật sắc nhọn, thủy tinh, đồ đạc cứng xung quanh để tránh nạn nhân va đập tự gây thương tích."
    },
    {
      title: "BƯỚC 2: BẢO VỆ ĐẦU",
      text: "Đặt một chiếc gối mỏng, mềm hoặc tấm áo cuộn lại dưới đầu nạn nhân để chống va đập mạnh xuống sàn nhà."
    },
    {
      title: "BƯỚC 3: THEO DÕI ĐƯỜNG THỞ",
      text: "Nới lỏng cổ áo, thắt lưng. Khi cơn co giật dịu đi, xoay nhẹ người nạn nhân nằm nghiêng để đờm dãi chảy ra ngoài tự nhiên."
    },
    {
      title: "⚠️ CẢNH BÁO ĐIỀU CẤM KỴ",
      text: "Tuyệt đối KHÔNG ghì chặt hay cố đè giữ tay chân nạn nhân để cắt cơn giật. KHÔNG đút ngón tay, muỗng, hoặc bất cứ vật cứng nào vào miệng nạn nhân vì có thể gây gãy răng hoặc bít tắc đường thở."
    }
  ],
  head: [
    {
      title: "SƠ CỨU: CHẤN THƯƠNG ĐẦU / BẤT TỈNH",
      text: "Hướng dẫn sơ cứu chấn thương đầu hoặc bất tỉnh. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn bắt đầu sau khi đếm ngược.",
      isWarning: true
    },
    {
      title: "BƯỚC 1: CỐ ĐỊNH CỘT SỐNG CỔ",
      text: "Giữ đầu và cổ thẳng hàng với thân mình. Tuyệt đối KHÔNG tự ý bế xốc hay di chuyển đầu nạn nhân để tránh nguy cơ tổn thương tủy cổ gây liệt vĩnh viễn."
    },
    {
      title: "BƯỚC 2: KIỂM TRA ĐƯỜNG THỞ",
      text: "Nếu nạn nhân bất tỉnh nhưng vẫn còn thở đều: Nghiêng nhẹ người nạn nhân sang tư thế nằm nghiêng an toàn (tư thế hồi phục) để đờm nhớt hoặc chất nôn chảy ra ngoài, tránh sặc."
    },
    {
      title: "BƯỚC 3: XỬ LÝ CHẢY MÁU",
      text: "Nếu có vết thương chảy máu ở đầu, dùng băng gạc sạch ấn nhẹ để cầm máu. Tránh đè ép quá mạnh lên các vị trí nghi ngờ nứt sọ."
    }
  ],
  bone: [
    {
      title: "SƠ CỨU: NGHI GÃY XƯƠNG / KHỚP",
      text: "Hướng dẫn sơ cứu chấn thương xương khớp. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn bắt đầu sau khi đếm ngược.",
      isWarning: true
    },
    {
      title: "BƯỚC 1: BẤT ĐỘNG VÙNG THƯƠNG TỔN",
      text: "Yêu cầu nạn nhân giữ nguyên tư thế. Tuyệt đối KHÔNG tự ý nắn chỉnh xương bị gãy hoặc kéo khớp bị trật về vị trí cũ."
    },
    {
      title: "BƯỚC 2: DÙNG NẸP TẠM THỜI",
      text: "Đặt nẹp gỗ, bìa carton cứng dọc theo vùng xương bị gãy, cố định bằng băng cuộn hoặc vải mềm ở hai đầu khớp phía trên và phía dưới vị trí gãy xương."
    },
    {
      title: "BƯỚC 3: CHƯỜM LẠNH GIẢM ĐAU",
      text: "Chườm túi đá mát bọc trong khăn vải lên vùng bị sưng đau trong 15-20 phút để giảm phù nề và giảm đau tạm thời."
    }
  ],
  blood: [
    {
      title: "SƠ CỨU: CHẢY MÁU / VẾT THƯƠNG HỞ",
      text: "Hướng dẫn sơ cứu vết thương chảy máu. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn bắt đầu sau khi đếm ngược.",
      isWarning: true
    },
    {
      title: "BƯỚC 1: ĐÈ ÉP TRỰC TIẾP LÊN VẾT THƯƠNG",
      text: "Dùng một miếng gạc sạch hoặc khăn vải sạch ấn trực tiếp lên miệng vết thương đang chảy máu trong 5 đến 10 phút để tạo cục máu đông cầm máu."
    },
    {
      title: "BƯỚC 2: BĂNG ÉP CỐ ĐỊNH",
      text: "Băng chặt vết thương bằng băng cuộn. Nếu máu thấm qua lớp băng đầu tiên, đặt thêm một lớp gạc khác đè lên và băng đè tiếp, KHÔNG tháo lớp băng cũ ra."
    },
    {
      title: "BƯỚC 3: NÂNG CAO CHI VẾT THƯƠNG",
      text: "Nếu vết thương nằm ở tay hoặc chân, hãy kê cao chi bị thương hơn mức tim của nạn nhân để giảm bớt áp lực máu chảy."
    }
  ],
  stroke: [
    {
      title: "SƠ CỨU: NGHI ĐỘT QUỴ (STROKE)",
      text: "Hướng dẫn nhận biết và xử lý đột quỵ khẩn cấp. Nhấn HỦY nếu đây là báo động giả. Hướng dẫn bắt đầu sau khi đếm ngược.",
      isWarning: true
    },
    {
      title: "BƯỚC 1: KIỂM TRA QUY TẮC F.A.S.T",
      text: "F - Gương mặt bị lệch, chảy xệ một bên. A - Tay hoặc chân bị yếu, tê liệt không nâng lên được. S - Nói ngọng, phát âm khó khăn hoặc không hiểu lời nói. T - Gọi ngay 115 khẩn cấp."
    },
    {
      title: "BƯỚC 2: ĐẶT NẰM NGHIÊNG AN TOÀN",
      text: "Để nạn nhân nằm nghỉ nơi thông thoáng. Nếu nạn nhân bất tỉnh hoặc nôn mửa, lập tức xoay nghiêng người sang một bên để tránh chất nôn tràn ngược vào đường thở."
    },
    {
      title: "BƯỚC 3: ⚠️ CÁC ĐIỀU CẤM KỴ",
      text: "Tuyệt đối KHÔNG cạo gió, chích lể ngón tay nạn nhân. KHÔNG cho nạn nhân ăn uống bất cứ thứ gì, kể cả nước ấm hay thuốc hạ huyết áp vì có thể gây sặc bít tắc đường thở."
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
        const utterance = new SpeechSynthesisUtterance(currentStep.text);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.95;
        synth.speak(utterance);
      }
    }
  }, [step, type, steps]);

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
    alert("Đã hủy báo động thành công.");
    router.push('/');
  };

  const currentStep = steps[step] || steps[0];

  return (
    <div className="cpr-fullscreen" style={{ background: currentStep.isWarning ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-primary)' }}>
      <div className="cpr-step-card" key={`${type}-${step}`}>
        {currentStep.isWarning ? getGuideIcon(type) : null}
        
        <h2 className={`cpr-title ${!currentStep.isWarning ? 'text-accent' : ''}`}>{currentStep.title}</h2>
        <p style={{ fontSize: '1.5rem', lineHeight: 1.6, marginBottom: '40px', color: 'var(--text-main)' }}>
          {currentStep.text}
        </p>

        <div style={{ margin: '30px 0' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 600 }}>
            {currentStep.isWarning ? 'Tự động kích hoạt cứu hộ trong' : 'Chuyển sang bước tiếp theo sau'}
          </div>
          <div className="cpr-timer">
            {timer}s
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px' }}>
          <button className="btn btn-danger" onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', padding: '16px 32px' }}>
            <LogOut size={24} />
            HỦY BÁO ĐỘNG NGAY
          </button>
          
          {step < steps.length - 1 && (
            <button className="btn btn-primary" onClick={() => { setStep(s => s + 1); setTimer(30); }} style={{ fontSize: '1.2rem', padding: '16px 32px' }}>
              Bỏ Qua & Tiếp Tục Giọng Đọc
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CPRScreen() {
  return (
    <Suspense fallback={
      <div className="cpr-fullscreen">
        <div className="cpr-step-card">
          <h2 className="cpr-title">Đang tải hướng dẫn...</h2>
        </div>
      </div>
    }>
      <CPRScreenContent />
    </Suspense>
  );
}
