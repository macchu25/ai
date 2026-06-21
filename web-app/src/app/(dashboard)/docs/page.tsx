"use client"

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';

interface DocSection {
  id: string;
  keywords: string;
  title: { vi: string; en: string };
  content: { vi: React.ReactNode; en: React.ReactNode };
}

export default function DocsPage() {
  const { t, language } = useLanguage();
  const [activeId, setActiveId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll('h2, h3');
      let currentId = '';
      for (const heading of Array.from(headings)) {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = heading.id;
        }
      }
      if (currentId) setActiveId(currentId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const globalInput = document.getElementById('global-search-input') as HTMLInputElement;
    if (!globalInput) return;

    const handleInput = (e: Event) => {
      setSearchQuery((e.target as HTMLInputElement).value);
    };

    globalInput.addEventListener('input', handleInput);
    setSearchQuery(globalInput.value);

    return () => {
      globalInput.removeEventListener('input', handleInput);
    };
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    const scrollContainer = document.querySelector('.workspace-area') as HTMLElement;
    if (element && scrollContainer) {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const targetPos = elementTop - containerTop + scrollContainer.scrollTop - 40;
      scrollContainer.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
  };

  const isMatch = (keywords: string) => {
    if (!searchQuery) return true;
    return keywords.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const docSections: DocSection[] = [
    {
      id: 'project-overview',
      keywords: 'tổng quan hệ thống cảnh báo té ngã thông minh người cao tuổi system overview smart fall warning elderly',
      title: { vi: 'Tổng quan hệ thống', en: 'System Overview' },
      content: {
        vi: (
          <>
            <p>
              <strong>Casos (Cardiac Alert)</strong> là hệ thống giám sát và cảnh báo té ngã thông minh, được thiết kế đặc biệt để bảo vệ sự an toàn của người cao tuổi và người bệnh khi ở nhà một mình.
            </p>
            <p>
              Bằng việc sử dụng camera thông minh tích hợp hệ thống trí tuệ nhân tạo (AI), nền tảng sẽ theo dõi và phân tích chuyển động liên tục 24/7 một cách riêng tư. Ngay khi nhận diện có người bị ngã, Casos sẽ lập tức phân tích mức độ nghiêm trọng, kích hoạt chuỗi báo động tại chỗ và kết nối đến người thân. Mục tiêu của chúng tôi là đảm bảo sự trợ giúp được diễn ra trong "thời điểm vàng", giúp giảm thiểu tối đa các rủi ro nguy hiểm đến tính mạng.
            </p>
          </>
        ),
        en: (
          <>
            <p>
              <strong>Casos (Cardiac Alert)</strong> is a smart fall monitoring and alert system, designed specifically to protect the safety of the elderly and patients when they are home alone.
            </p>
            <p>
              By utilizing smart cameras integrated with an artificial intelligence (AI) system, the platform continuously and privately monitors and analyzes body movements 24/7. Upon detecting a fall, Casos instantly analyzes severity, triggers a local siren, and contacts family members. Our goal is to ensure assistance within the "golden hour", reducing life-threatening risks to a minimum.
            </p>
          </>
        )
      }
    },
    {
      id: 'emergency-calls',
      keywords: 'cảnh báo tự động khẩn cấp gọi điện còi báo động người thân emergency call siren automated alert',
      title: { vi: 'Quy trình cảnh báo tự động', en: 'Automatic Warning Procedure' },
      content: {
        vi: (
          <>
            <p>Để đảm bảo không bỏ sót bất kỳ sự cố nào, khi AI phát hiện sự kiện té ngã, hệ thống sẽ xử lý theo quy trình nghiêm ngặt nhằm tránh các trường hợp báo động giả và đảm bảo cấp cứu kịp thời:</p>
            <ol>
              <li><strong>Cảnh báo tại chỗ (7 giây đầu):</strong> Hệ thống sẽ tự động phát âm thanh còi báo động lớn ngay tại khu vực lắp camera để thu hút sự chú ý của những người xung quanh trong nhà, đồng thời giúp bệnh nhân nhận thức được hệ thống đã ghi nhận sự việc.</li>
              <li><strong>Gọi điện thoại khẩn cấp (10 giây tiếp theo):</strong> Nếu sau báo động tại chỗ mà không có ai can thiệp hoặc không có dấu hiệu bệnh nhân đứng dậy, hệ thống sẽ tự động sử dụng nền tảng viễn thông thông minh để thực hiện cuộc gọi khẩn cấp đến số điện thoại của người thân. Trợ lý ảo sẽ đọc rõ vị trí phòng, thời gian và thông tin người bệnh bị ngã để bạn kịp thời ứng cứu.</li>
            </ol>
          </>
        ),
        en: (
          <>
            <p>To ensure no incident is missed, once the AI detects a fall event, the system processes it under a strict workflow to minimize false alarms and guarantee quick emergency response:</p>
            <ol>
              <li><strong>Local Siren (First 7 seconds):</strong> The system automatically plays a loud alarm sound at the camera installation site to capture the attention of anyone nearby, while letting the patient know the event has been captured.</li>
              <li><strong>Emergency Voice Call (Next 10 seconds):</strong> If no one intervenes after the local siren or the patient shows no signs of standing up, the system automatically uses our smart telecommunication platform to place a voice call to emergency contacts. An AI assistant will describe the room location, timestamp, and patient details so you can take quick action.</li>
            </ol>
          </>
        )
      }
    },
    {
      id: 'health-profiles',
      keywords: 'hồ sơ y tế sức khỏe thông tin bệnh lý health profile configuration medical history',
      title: { vi: 'Cấu hình Hồ sơ Y tế', en: 'Configure Health Profile' },
      content: {
        vi: (
          <>
            <p>
              Để hệ thống có thể cung cấp thông tin toàn diện nhất trong các trường hợp cấp cứu, bạn nên chủ động thiết lập <strong>Hồ sơ y tế (Health Profile)</strong> cho đối tượng được giám sát tại mục Profile.
            </p>
            <ul>
              <li><strong>Thông tin cơ bản:</strong> Họ tên, năm sinh, nhóm máu, số điện thoại liên lạc.</li>
              <li><strong>Tiền sử bệnh lý:</strong> Các bệnh mãn tính (Tim mạch, tiểu đường, huyết áp), dị ứng thuốc, hoặc các lưu ý đặc biệt về xương khớp.</li>
              <li><strong>Tác dụng:</strong> Khi xảy ra sự cố nghiêm trọng, trợ lý ảo gọi điện khẩn cấp không chỉ thông báo việc té ngã mà còn có thể đính kèm các thông tin y tế cốt lõi này. Điều này giúp nhân viên y tế (115) hoặc người nhà có sự chuẩn bị phương án cấp cứu tốt nhất trước khi đến hiện trường.</li>
            </ul>
          </>
        ),
        en: (
          <>
            <p>
              To provide comprehensive information during emergencies, you should proactively set up the <strong>Health Profile</strong> for the monitored individual under the Profile section.
            </p>
            <ul>
              <li><strong>Basic Information:</strong> Full name, birth year, blood type, emergency contact numbers.</li>
              <li><strong>Medical History:</strong> Chronic diseases (cardiovascular, diabetes, hypertension), drug allergies, or specific joint/bone notices.</li>
              <li><strong>Benefit:</strong> During a critical incident, the emergency call assistant will not only report the fall but also attach these core medical details. This helps medical responders (115) or family members prepare the best emergency response before arriving on scene.</li>
            </ul>
          </>
        )
      }
    },
    {
      id: 'team-members',
      keywords: 'chia sẻ quyền thành viên gia đình invite team members truy cập family access sharing permission',
      title: { vi: 'Chia sẻ quyền truy cập (Gia đình)', en: 'Share Access (Family)' },
      content: {
        vi: (
          <>
            <p>Việc chăm sóc người thân là trách nhiệm chung. Casos cho phép bạn mời nhiều thành viên trong gia đình cùng theo dõi và quản lý hệ thống giám sát một cách an toàn.</p>
            <ol>
              <li>Truy cập mục <strong>Profile</strong> {'>'} <strong>Team Members</strong> (hoặc nhấn nút <em>Invite team members</em> ở thanh menu trái).</li>
              <li>Nhập địa chỉ Email của người mà bạn muốn cấp quyền truy cập.</li>
              <li>Người được mời sẽ nhận được một đường link bảo mật. Sau khi tạo tài khoản, họ có thể cùng xem luồng Live Stream camera và nhận các tin nhắn cảnh báo song song với bạn.</li>
            </ol>
            <p><em>Lưu ý bảo mật: Chỉ có tài khoản Chủ gia đình (Owner) mới có quyền quản lý thanh toán, xóa thiết bị Camera hoặc thiết lập lại cấu hình AI. Các thành viên khác chỉ có quyền Xem (Viewer) hoặc Nhận thông báo.</em></p>
          </>
        ),
        en: (
          <>
            <p>Caring for loved ones is a shared responsibility. Casos allows you to invite multiple family members to securely monitor and manage the surveillance system.</p>
            <ol>
              <li>Access <strong>Profile</strong> {'>'} <strong>Team Members</strong> (or click the <em>Invite team members</em> button on the left menu).</li>
              <li>Enter the email address of the person you want to grant access to.</li>
              <li>The invitee will receive a secure link. Once they sign up, they can view live camera streams and receive alert notifications simultaneously.</li>
            </ol>
            <p><em>Security Note: Only the Family Owner account has permissions to manage billing, delete cameras, or adjust AI thresholds. Other invited members hold Viewer or Notification-only access.</em></p>
          </>
        )
      }
    },
    {
      id: 'incidents-management',
      keywords: 'quản lý sự cố xem lại video incidents ghi hình lịch sử incident management history log video',
      title: { vi: 'Trung tâm Sự cố (Incidents)', en: 'Incident Center (Incidents)' },
      content: {
        vi: (
          <>
            <p>Mọi sự kiện té ngã hoặc cảnh báo nguy hiểm đều được AI tự động ghi hình lại và mã hóa lưu trữ an toàn trên đám mây của hệ thống.</p>
            <ul>
              <li><strong>Trích xuất Video AI:</strong> Hệ thống tự động cắt đoạn video ngắn (khoảng 15-30 giây) bao gồm trọn vẹn khoảnh khắc trước, trong và sau khi ngã. Tính năng này giúp bác sĩ dễ dàng chuẩn đoán nguyên nhân vật lý gây ra tai nạn.</li>
              <li><strong>Xác nhận tình trạng:</strong> Người nhà có thể chủ động đánh dấu sự cố là <em>"Đã xử lý" (Resolved)</em> để dừng chuỗi cảnh báo. Đồng thời bạn có thể đánh dấu <em>"Báo động giả" (False Alarm)</em> để giúp AI của chúng tôi học hỏi, điều chỉnh tham số và nhận diện chính xác hơn cho ngôi nhà của bạn trong tương lai.</li>
              <li><strong>Thống kê (Analytics):</strong> Tần suất té ngã và thời gian xảy ra sự cố được thống kê dưới dạng biểu đồ, giúp gia đình theo dõi xu hướng sức khỏe của người bệnh.</li>
            </ul>
          </>
        ),
        en: (
          <>
            <p>All falls or hazardous alert events are automatically recorded by the AI and securely stored in encrypted cloud storage.</p>
            <ul>
              <li><strong>AI Video Snippets:</strong> The system automatically extracts a short video clip (15-30s) containing the moments before, during, and after the fall. This feature helps doctors diagnose physical triggers of the accident.</li>
              <li><strong>Status Acknowledgment:</strong> Family members can mark incidents as <em>"Resolved"</em> to stop the alert chain. You can also label them as <em>"False Alarm"</em> to help our AI learn, adjust parameters, and improve accuracy for your home.</li>
              <li><strong>Analytics:</strong> Fall frequency and timestamps are tracked on charts, allowing the family to monitor patient wellness trends over time.</li>
            </ul>
          </>
        )
      }
    },
    {
      id: 'billing',
      keywords: 'thanh toán gói cước subscription nâng cấp mã qr hủy đăng ký otp billing payment tier cancel subscription',
      title: { vi: 'Quản lý gói cước & Thanh toán', en: 'Plan Management & Billing' },
      content: {
        vi: (
          <>
            <p>Hệ thống cung cấp các tùy chọn gói dịch vụ (Free, Starter, Pro, Scale) linh hoạt phù hợp với số lượng camera và nhu cầu lưu trữ video của gia đình bạn.</p>
            <ul>
              <li><strong>Nâng cấp hoàn toàn tự động:</strong> Việc thanh toán diễn ra mượt mà thông qua đối tác SePay. Bạn chỉ cần quét mã QR hoặc chuyển khoản với nội dung cú pháp được chỉ định, hệ thống sẽ tự động xác nhận giao dịch trong vòng 10 giây và mở khóa tài khoản Premium của bạn ngay lập tức (kể cả ban đêm hay cuối tuần).</li>
              <li><strong>Hủy gói cước an toàn:</strong> Không có hợp đồng ràng buộc, bạn có thể hủy gia hạn bất cứ lúc nào. Để tránh việc thao tác nhầm lẫn gây mất quyền lợi, hệ thống yêu cầu xác thực bằng mã bảo mật OTP (gửi về Email cá nhân). Sau khi hủy, hệ thống vẫn duy trì dịch vụ cho đến hết chu kỳ đã thanh toán.</li>
            </ul>
          </>
        ),
        en: (
          <>
            <p>The system offers flexible service plans (Free, Starter, Pro, Scale) tailored to the number of cameras and video storage needs of your family.</p>
            <ul>
              <li><strong>Automated Upgrades:</strong> Payments are processed seamlessly via our SePay integration. Scan the QR code or transfer with the exact transaction syntax, and our system confirms the trade within 10 seconds, unlocking Premium features instantly (including nights and weekends).</li>
              <li><strong>Safe Cancellation:</strong> No contract bounds. You can cancel renewal anytime. To prevent accidental action, the system requires validation via secure OTP sent to your email. Active premium services persist until the end of the paid billing cycle.</li>
            </ul>
          </>
        )
      }
    },
    {
      id: 'rppg-vitals',
      keywords: 'rppg đo nhịp tim nhịp thở không tiếp xúc chỉ số sinh tồn camera dataset cơ sở dữ liệu cohface pure ubfc-rppg vitals remote heart rate respiration pose estimation dataset',
      title: { vi: 'Đo nhịp tim & nhịp thở (rPPG)', en: 'Heart Rate & Respiration (rPPG)' },
      content: {
        vi: (
          <>
            <p>
              Hệ thống tích hợp mô hình AI nâng cao <strong>Remote Photoplethysmography (rPPG)</strong> cho phép giám sát các chỉ số sinh tồn của người bệnh hoàn toàn không tiếp xúc thông qua camera:
            </p>
            <ul>
              <li><strong>Đo Nhịp Tim:</strong> AI tự động định vị khuôn mặt, phân tích sự thay đổi sắc tố mao mạch siêu nhỏ dưới da theo tuần hoàn máu (tín hiệu BVP) để tính toán nhịp tim (BPM) chính xác.</li>
              <li><strong>Đo Nhịp Thở:</strong> Hệ thống sử dụng mô hình <strong>Mediapipe Pose</strong> xác định hai khớp vai để định vị lồng ngực. AI sẽ đo đạc độ phồng xẹp (biến thiên độ sáng) của ngực khi thở để tính tần số hô hấp (RPM).</li>
              <li><strong>Click xem chi tiết:</strong> Người nhà có thể nhấp chuột trực tiếp vào ô nhịp tim hoặc nhịp thở trên Dashboard để mở rộng biểu đồ lớn dạng máy theo dõi y tế bệnh viện (ECG Grid), hiển thị toàn bộ lịch sử 40 điểm đo và các thống kê Cao nhất, Thấp nhất, Trung bình.</li>
              <li><strong>Dataset huấn luyện rPPG:</strong> Mô hình DeepPhys được huấn luyện và kiểm định chéo trên các bộ cơ sở dữ liệu y sinh chuẩn quốc tế gồm <strong>COHFACE</strong> (Viện nghiên cứu IDIAP), <strong>PURE</strong> (Physiological Viability Reconstruction) và <strong>UBFC-RPPG</strong>, chứa video màu RGB đi kèm luồng đối chứng nhịp tim tiếp xúc thực tế (ECG/PPG Ground Truth).</li>
            </ul>
          </>
        ),
        en: (
          <>
            <p>
              The system integrates the advanced <strong>Remote Photoplethysmography (rPPG)</strong> AI model to monitor vital signs completely without contact:
            </p>
            <ul>
              <li><strong>Heart Rate:</strong> The AI localizes the face, tracking subtle capillary color changes under the skin from blood circulation (BVP signal) to compute accurate heart rate (BPM).</li>
              <li><strong>Respiration Rate:</strong> The system uses <strong>Mediapipe Pose</strong> to detect shoulder joints and align the chest. The AI measures light amplitude variance on chest expansion/deflation to extract respiratory frequency (RPM).</li>
              <li><strong>Click for Details:</strong> Family members can click directly on the Heart Rate or Respiration widget on the Dashboard to expand a full-sized hospital ECG Grid chart, showing the last 40 readings, plus Min, Max, and Average stats.</li>
              <li><strong>rPPG Training Dataset:</strong> Our DeepPhys model is trained and cross-evaluated on international biomedical reference datasets including <strong>COHFACE</strong> (IDIAP Research Institute), <strong>PURE</strong> (Physiological Viability Reconstruction), and <strong>UBFC-RPPG</strong>, which contain raw RGB videos synced with contact ECG/PPG ground truths.</li>
            </ul>
          </>
        )
      }
    },
    {
      id: 'pain-detection',
      keywords: 'biểu cảm đau đớn facial pain detector nhăn mặt nhíu mày híp mắt 6 điểm dataset cơ sở dữ liệu unbc-mcmaster pspi scale facial pain expression threshold',
      title: { vi: 'Nhận diện biểu cảm đau (Pain)', en: 'Pain Expression Detection (Pain)' },
      content: {
        vi: (
          <>
            <p>
              Bên cạnh các chỉ số sinh tồn, hệ thống sử dụng thuật toán <strong>Mediapipe Face Mesh 3D</strong> để theo dõi liên tục trạng thái căng thẳng hoặc đau đớn trên cơ mặt bệnh nhân:
            </p>
            <ul>
              <li><strong>Thang điểm chuẩn y tế:</strong> Mức độ đau đớn được tính toán theo thang điểm từ <strong>0.0 đến 6.0</strong> (chuẩn Faces Pain Scale lâm sàng của Bieri và cộng sự).</li>
              <li><strong>Cơ chế phân tích:</strong> AI đo đạc các biến đổi cơ mặt: *Brow Furrowing* (nhíu lông mày), *Eye Squinting* (híp chặt mắt do đau) và *Mouth Stretching* (hé miệng/méo miệng do đau) để tính toán điểm số đau đớn một cách khách quan.</li>
              <li><strong>Báo động đỏ:</strong> Khi điểm số vượt ngưỡng <strong>3.5 / 6.0</strong> (biểu thị mức đau trung bình đến dữ dội), khung camera sẽ tự động chuyển sang màu đỏ và phát tín hiệu khẩn cấp về hệ thống.</li>
              <li><strong>Cơ sở dữ liệu đau đớn:</strong> Các ngưỡng sắc thái cơ mặt nhăn nhó được chuẩn hóa dựa trên tập dữ liệu đau đớn lâm sàng chuẩn quốc tế <strong>UNBC-McMaster Shoulder Pain Archive</strong> (chứa hàng nghìn chuỗi khung hình biểu cảm của bệnh nhân bị chấn thương vai được dán nhãn lâm sàng theo thang điểm đau PSPI).</li>
            </ul>
          </>
        ),
        en: (
          <>
            <p>
              Alongside vital signs, the system utilizes the <strong>Mediapipe Face Mesh 3D</strong> algorithm to track continuous stress or pain expressions on the patient\'s face:
            </p>
            <ul>
              <li><strong>Medical Pain Scale:</strong> Pain intensity is computed on a scale of <strong>0.0 to 6.0</strong> (matching the clinical Faces Pain Scale by Bieri et al.).</li>
              <li><strong>Action Units:</strong> The AI extracts facial movements: *Brow Furrowing*, *Eye Squinting* (pain-induced eye squeezing), and *Mouth Stretching* to score discomfort objectively.</li>
              <li><strong>Red Alarm:</strong> When the score exceeds <strong>3.5 / 6.0</strong> (representing moderate-to-severe pain), the camera feed boundary turns red, pushing emergency notifications.</li>
              <li><strong>Pain Datasets:</strong> Facial grimacing metrics are calibrated against the clinical benchmark <strong>UNBC-McMaster Shoulder Pain Archive</strong> (thousands of video frames depicting orthopedic patients scored clinically on the PSPI scale).</li>
            </ul>
          </>
        )
      }
    },
    {
      id: 'apnea-alert',
      keywords: 'quy trình cảnh báo ngừng thở apnea nín thở 3 giây 6 giây khẩn cấp respiratory distress breath held warning emergency',
      title: { vi: 'Cảnh báo ngừng thở (Apnea)', en: 'Apnea Alert (Apnea)' },
      content: {
        vi: (
          <>
            <p>
              Ngừng thở là một trong những tình huống khẩn cấp đe dọa trực tiếp đến tính mạng. Hệ thống được cấu hình để phản ứng tức thì khi bệnh nhân có dấu hiệu ngừng thở:
            </p>
            <ul>
              <li><strong>Nhận diện nín thở:</strong> Nếu bệnh nhân nín thở hoặc bất động lồng ngực trong hơn 8 giây, camera AI sẽ hạ chỉ số nhịp thở về mức <strong>0.0 RPM (Đang nín thở / Đứng yên)</strong>.</li>
              <li><strong>Quy trình xử lý khẩn cấp:</strong> 
                <ul>
                  <li>*Sau 3 giây bất thường:* Kích hoạt cảnh báo còi báo động tại chỗ (Local Warning) và gửi tin nhắn theo dõi qua Telegram.</li>
                  <li>*Sau 6 giây bất thường liên tục:* Kích hoạt cuộc gọi cấp cứu Twilio tự động, đẩy thông báo đỏ làm nhấp nháy màn hình Dashboard và gửi ảnh bằng chứng hiện trường trực tiếp đến điện thoại người nhà qua Telegram.</li>
                </ul>
              </li>
            </ul>
          </>
        ),
        en: (
          <>
            <p>
              Apnea or respiratory arrest is an immediate life-threatening emergency. The system is programmed to react swiftly upon detecting breathing stops:
            </p>
            <ul>
              <li><strong>Apnea Detection:</strong> If the chest remains immobile for over 8 seconds, the AI drops the respiration rate to <strong>0.0 RPM (Breath held / still)</strong>.</li>
              <li><strong>Emergency Workflow:</strong> 
                <ul>
                  <li>*After 3s of anomaly:* Triggers local siren warning and messages emergency contacts via Telegram.</li>
                  <li>*After 6s of continuous anomaly:* Triggers automated Twilio voice calls, flashes red dashboard indicators, and sends live incident snapshot proofs to Telegram.</li>
                </ul>
              </li>
            </ul>
          </>
        )
      }
    },
    {
      id: 'faq',
      keywords: 'câu hỏi thường gặp lỗi faq troubleshooting offline mất mạng frequently asked questions connection offline lag delay otp pets',
      title: { vi: 'Câu hỏi thường gặp (FAQ)', en: 'Frequently Asked Questions (FAQ)' },
      content: {
        vi: (
          <>
            <h3>1. Hệ thống báo Camera Offline, tôi phải làm sao?</h3>
            <p>Vui lòng kiểm tra lại nguồn điện của Camera. Nếu Camera vẫn đang cắm điện, hãy khởi động lại Modem Wifi nhà bạn. Trong phần lớn trường hợp, Camera sẽ tự động kết nối lại vào hệ thống của chúng tôi trong vòng 1-2 phút sau khi có mạng Internet ổn định trở lại.</p>
            
            <h3>2. Hình ảnh camera bị chậm (delay) so với thực tế?</h3>
            <p>Vì hệ thống sử dụng giao thức RTSP truyền tải qua đám mây để AI phân tích, độ trễ tiêu chuẩn là từ 2-5 giây. Tuy nhiên, nếu độ trễ lên đến trên 10 giây hoặc video bị giật lag, bạn nên hạ độ phân giải của Camera xuống mức 1080p hoặc 720p. Việc này không ảnh hưởng nhiều đến chất lượng AI nhưng sẽ cải thiện tốc độ mạng đáng kể.</p>

            <h3>3. Tôi không nhận được mã OTP khi thao tác?</h3>
            <p>Hãy kiểm tra hộp thư Rác (Spam) hoặc mục Quảng cáo (Promotions) trong Email của bạn. Nếu vẫn không thấy thư từ hệ thống Casos, bạn có thể nhấn "Gửi lại mã" trên giao diện sau khi chờ 60 giây.</p>
            
            <h3>4. AI có nhận nhầm thú cưng (chó, mèo) thành người ngã không?</h3>
            <p>Model AI của chúng tôi đã được huấn luyện với hàng triệu dữ liệu để phân tích khung xương (Skeleton Tracking) của con người. Do đó, hệ thống sẽ bỏ qua các chuyển động của thú cưng hoặc robot hút bụi để hạn chế tối đa báo động giả.</p>
          </>
        ),
        en: (
          <>
            <h3>1. The camera is showing Offline. What should I do?</h3>
            <p>Please check the camera power supply. If powered, try restarting your Wi-Fi router. In most cases, the camera will reconnect to our dashboard within 1-2 minutes once a stable internet connection is restored.</p>
            
            <h3>2. The camera feed has a delay/lag compared to real time?</h3>
            <p>Since the stream utilizes RTSP and cloud forwarding for AI analysis, a 2-5 seconds delay is standard. If latency exceeds 10 seconds or the video stutters, we recommend reducing the camera output resolution to 1080p or 720p. This improves network transmission speed without impacting AI analysis accuracy.</p>

            <h3>3. I am not receiving the OTP code in my email?</h3>
            <p>Please check your Spam or Promotions folders. If the email is still not found, you can click "Resend Code" on the interface after a 60-second cooldown.</p>
            
            <h3>4. Will the AI mistake pets (dogs, cats) for a fallen human?</h3>
            <p>Our AI model is trained on millions of points for human Skeleton Tracking. Therefore, it ignores animal movements and robotic vacuum cleaners to minimize false alerts.</p>
          </>
        )
      }
    },
    {
      id: 'what-is-rtsp',
      keywords: 'rtsp là gì giao thức video camera cấu hình mạng what is rtsp stream protocol configuration port',
      title: { vi: 'Khái niệm kỹ thuật: RTSP là gì?', en: 'Technical Concept: What is RTSP?' },
      content: {
        vi: (
          <>
            <p>
              RTSP (Real-Time Streaming Protocol) là giao thức dùng để điều khiển và truyền tải luồng video trực tiếp từ các Camera IP trên mạng nội bộ đến máy chủ AI trung tâm. 
              Bạn bắt buộc phải tìm được đường dẫn này trên Camera của bạn để khai báo vào hệ thống, thay vì chỉ cung cấp IP tĩnh, nhằm giúp Engine phân tích chuyển động video liên tục.
            </p>
            <p>
              Cú pháp chuẩn của một đường dẫn RTSP thường có dạng:
            </p>
            <div className="code-block">
              <code>rtsp://[username]:[password]@[IP_Camera]:[Port]/[đường_dẫn]</code>
            </div>
          </>
        ),
        en: (
          <>
            <p>
              RTSP (Real-Time Streaming Protocol) is a network control protocol designed for multiplexing and packetizing real-time video streams from IP Cameras to the central AI server.
              You must locate this URL string for your specific camera model to register it in our dashboard, allowing the motion engine to process continuous feeds.
            </p>
            <p>
              The standard syntax of an RTSP path is:
            </p>
            <div className="code-block">
              <code>rtsp://[username]:[password]@[Camera_IP]:[Port]/[path]</code>
            </div>
          </>
        )
      }
    },
    {
      id: 'camera-xiot',
      keywords: 'camera x-iot xiot khuyên dùng luồng rtsp xiot camera configuration stream address default',
      title: { vi: 'Cấu hình: Camera X-IoT (Khuyên dùng)', en: 'Config: X-IoT Camera (Recommended)' },
      content: {
        vi: (
          <>
            <p>
              Với các dòng Camera thông minh chuẩn X-IoT được phân phối kèm theo hệ thống Casos, tính năng truyền phát RTSP đã được mở khóa tự động để tương thích hoàn hảo.
            </p>
            <ul>
              <li><strong>Username & Password:</strong> Không yêu cầu (Bỏ trống) hoặc theo mặc định là <code>admin</code> / <code>123456</code>.</li>
              <li><strong>Port:</strong> <code>554</code></li>
            </ul>
            <div className="code-block">
              <span className="comment">// Cấu trúc URL mặc định</span><br/>
              <code>rtsp://[IP_Camera]:554/stream1</code>
              <br /><br />
              <span className="comment">// Ví dụ điền thực tế:</span><br />
              <code>rtsp://192.168.1.100:554/stream1</code>
            </div>
          </>
        ),
        en: (
          <>
            <p>
              With custom smart X-IoT cameras shipped with Casos system, RTSP streaming features are unlocked out-of-the-box for seamless integration.
            </p>
            <ul>
              <li><strong>Username & Password:</strong> Not required (Leave blank) or defaults to <code>admin</code> / <code>123456</code>.</li>
              <li><strong>Port:</strong> <code>554</code></li>
            </ul>
            <div className="code-block">
              <span className="comment">// Default URL format</span><br/>
              <code>rtsp://[Camera_IP]:554/stream1</code>
              <br /><br />
              <span className="comment">// Example of usage:</span><br />
              <code>rtsp://192.168.1.100:554/stream1</code>
            </div>
          </>
        )
      }
    },
    {
      id: 'camera-ezviz',
      keywords: 'camera ezviz mã xác thực verification code cấu hình rtsp ezviz verification code pass login',
      title: { vi: 'Cấu hình: Camera EZVIZ', en: 'Config: EZVIZ Camera' },
      content: {
        vi: (
          <>
            <p>
              EZVIZ là một trong những dòng Camera an ninh gia đình phổ biến nhất tại Việt Nam. Hãng này mặc định kích hoạt sẵn RTSP cho mọi thiết bị.
            </p>
            <ul>
              <li><strong>Username:</strong> Mặc định luôn là <code>admin</code></li>
              <li><strong>Password:</strong> Là Mã xác thực (Verification Code) gồm 6 chữ cái in hoa được in ở tem dưới đáy hoặc mặt sau Camera.</li>
              <li><strong>Port:</strong> 554</li>
            </ul>
            <div className="code-block">
              <code>rtsp://admin:[Mã_Verification]@[IP_Camera]:554/h264_stream</code>
            </div>
          </>
        ),
        en: (
          <>
            <p>
              EZVIZ is a very popular smart home camera line. The manufacturer enables RTSP streaming by default on all devices.
            </p>
            <ul>
              <li><strong>Username:</strong> Defaults to <code>admin</code></li>
              <li><strong>Password:</strong> The 6-digit Verification Code (capital letters) printed on the sticker at the bottom or back of the camera.</li>
              <li><strong>Port:</strong> 554</li>
            </ul>
            <div className="code-block">
              <code>rtsp://admin:[Verification_Code]@[Camera_IP]:554/h264_stream</code>
            </div>
          </>
        )
      }
    },
    {
      id: 'camera-imou',
      keywords: 'camera imou safety code cấu hình rtsp imou safety code password config',
      title: { vi: 'Cấu hình: Camera IMOU', en: 'Config: IMOU Camera' },
      content: {
        vi: (
          <>
            <p>
              Tương tự EZVIZ, các sản phẩm IMOU cung cấp luồng RTSP thông qua một đoạn mã an toàn gọi là Safety Code.
            </p>
            <ul>
              <li><strong>Username:</strong> Mặc định là <code>admin</code></li>
              <li><strong>Password:</strong> Mã Safety Code (thường là 8 ký tự in hoa) in trên tem vuông ở đáy Camera.</li>
              <li><strong>Port:</strong> 554</li>
            </ul>
            <div className="code-block">
              <code>rtsp://admin:[Safety_Code]@[IP_Camera]:554/cam/realmonitor?channel=1&subtype=0</code>
            </div>
          </>
        ),
        en: (
          <>
            <p>
              Similar to EZVIZ, IMOU cameras expose their RTSP stream using a password string called the Safety Code.
            </p>
            <ul>
              <li><strong>Username:</strong> Defaults to <code>admin</code></li>
              <li><strong>Password:</strong> The Safety Code (usually 8 capital characters) printed on the bottom label of the camera.</li>
              <li><strong>Port:</strong> 554</li>
            </ul>
            <div className="code-block">
              <code>rtsp://admin:[Safety_Code]@[Camera_IP]:554/cam/realmonitor?channel=1&subtype=0</code>
            </div>
          </>
        )
      }
    },
    {
      id: 'camera-tapo',
      keywords: 'camera tapo tp-link tplink tài khoản camera nâng cao cấu hình rtsp tapo camera account advanced settings',
      title: { vi: 'Cấu hình: Camera Tapo (TP-Link)', en: 'Config: Tapo Camera (TP-Link)' },
      content: {
        vi: (
          <>
            <p>
              Khác với các dòng trên, ứng dụng Tapo yêu cầu bạn phải tự tạo thủ công một tài khoản xem luồng riêng trên ứng dụng điện thoại để đảm bảo tính riêng tư:
            </p>
            <ol>
              <li>Mở app Tapo trên điện thoại, chọn Camera của bạn.</li>
              <li>Nhấn biểu tượng ⚙ Bánh răng (Cài đặt) ở góc trên cùng bên phải.</li>
              <li>Vào mục <strong>Cài đặt thiết bị nâng cao</strong> {'>'} <strong>Tài khoản Camera</strong>.</li>
              <li>Nhập một <strong>Username</strong> và <strong>Password</strong> của riêng bạn.</li>
            </ol>
            <p>Sau khi tạo thành công, bạn sử dụng cú pháp luồng độ nét cao (HD) sau đây:</p>
            <div className="code-block">
              <code>rtsp://[Username_Vừa_Tạo]:[Password_Vừa_Tạo]@[IP_Camera]:554/stream1</code>
            </div>
          </>
        ),
        en: (
          <>
            <p>
              Unlike other brands, Tapo requires you to manually create a dedicated local streaming account within their mobile app for security:
            </p>
            <ol>
              <li>Open the Tapo app on your phone, and select your Camera.</li>
              <li>Tap the ⚙ Gear icon (Settings) in the top-right corner.</li>
              <li>Go to <strong>Advanced Device Settings</strong> {'>'} <strong>Camera Account</strong>.</li>
              <li>Enter a custom <strong>Username</strong> and <strong>Password</strong> of your choice.</li>
            </ol>
            <p>Once created, use the HD (High Definition) stream URL pattern below:</p>
            <div className="code-block">
              <code>rtsp://[Created_Username]:[Created_Password]@[Camera_IP]:554/stream1</code>
            </div>
          </>
        )
      }
    },
    {
      id: 'hikvision-dahua',
      keywords: 'hikvision dahua kbvision nvr đầu ghi cấu hình rtsp nvr recorder channels setup',
      title: { vi: 'Cấu hình: Hikvision / Dahua', en: 'Config: Hikvision / Dahua' },
      content: {
        vi: (
          <>
            <p>
              Đây là nhóm Camera chuyên dụng thường kết nối qua đầu ghi mạng (NVR). Bạn phải sử dụng chính xác tài khoản và mật khẩu đã được thiết lập bởi thợ lắp đặt ban đầu trên đầu ghi.
            </p>
            <div className="code-block">
              <span className="comment">// Dành cho hệ sinh thái Hikvision</span><br/>
              <code>rtsp://[user]:[pass]@[IP_Camera]:554/Streaming/Channels/101</code><br/><br/>
              <span className="comment">// Dành cho hệ sinh thái Dahua / KBVision</span><br/>
              <code>rtsp://[user]:[pass]@[IP_Camera]:554/cam/realmonitor?channel=1&subtype=0</code>
            </div>
          </>
        ),
        en: (
          <>
            <p>
              These commercial-grade surveillance cameras usually route through a Network Video Recorder (NVR). You must use the exact NVR credentials configured by your installation engineer.
            </p>
            <div className="code-block">
              <span className="comment">// For Hikvision systems</span><br/>
              <code>rtsp://[user]:[pass]@[Camera_IP]:554/Streaming/Channels/101</code><br/><br/>
              <span className="comment">// For Dahua / KBVision systems</span><br/>
              <code>rtsp://[user]:[pass]@[Camera_IP]:554/cam/realmonitor?channel=1&subtype=0</code>
            </div>
          </>
        )
      }
    },
    {
      id: 'find-ip',
      keywords: 'cách lấy ip camera wifi fing router default gateway local network scan gateway address config cmd',
      title: { vi: 'Kỹ thuật: Cách tìm IP Camera nội bộ', en: 'Technical: How to find local camera IP' },
      content: {
        vi: (
          <>
            <h3>1. Nếu Camera tự phát ra mạng Wifi độc lập (AP Mode)</h3>
            <p>
              Các dòng Camera IoT đời mới, khi mua về chưa kết nối mạng, chúng thường tự phát ra một sóng Wifi riêng (ví dụ: <code>X-IoT_Cam_123</code> hoặc <code>IPC-XXXXX</code>). 
              Nếu bạn kết nối điện thoại trực tiếp vào Wifi này, địa chỉ IP của Camera mặc định sẽ luôn trùng với thông số <strong>Default Gateway</strong>.
            </p>
            <ul>
              <li><strong>IP mặc định thường thấy:</strong> <code>192.168.4.1</code> (rất phổ biến) hoặc <code>192.168.1.1</code>.</li>
              <li><strong>Cách xem trên Windows:</strong> Nhấn nút Win, gõ <code>cmd</code>, nhập lệnh <code>ipconfig</code>. Nhìn vào dòng <em>Default Gateway</em>.</li>
              <li><strong>Cách xem trên iPhone/Android:</strong> Bấm vào biểu tượng (i) hoặc bánh răng bên cạnh tên Wifi đang kết nối, nhìn vào mục <em>Bộ định tuyến (Router)</em>, dãy số đó chính là IP Camera.</li>
            </ul>
            <div className="code-block">
              <span className="comment">// Link RTSP khi kết nối Wifi do Camera phát ra thường là:</span><br/>
              <code>rtsp://192.168.4.1:554/stream1</code>
            </div>

            <h3>2. Nếu Camera đã kết nối vào Wifi của gia đình</h3>
            <p>
              Trong trường hợp Camera đã hoạt động chung mạng với cục phát Wifi (Modem) nhà bạn:
              Bạn có thể tải phần mềm <strong>Fing</strong> trên cửa hàng ứng dụng điện thoại (đảm bảo điện thoại kết nối cùng Wifi). Mở Fing lên quét, ứng dụng sẽ liệt kê tất cả các thiết bị cùng địa chỉ IP tương ứng.
              Ngoài ra, bạn cũng có thể đăng nhập vào trang quản trị của Modem (thường truy cập qua <code>192.168.1.1</code> bằng trình duyệt) để tra cứu danh sách thiết bị.
            </p>
          </>
        ),
        en: (
          <>
            <h3>1. If the camera broadcasts its own Wi-Fi network (AP Mode)</h3>
            <p>
              Modern IoT cameras, before final pairing, broadcast their own local Wi-Fi hotspot (e.g., <code>X-IoT_Cam_123</code> or <code>IPC-XXXXX</code>).
              If you connect your phone or computer directly to this Wi-Fi, the camera\'s IP will match the <strong>Default Gateway</strong> parameter.
            </p>
            <ul>
              <li><strong>Common default IPs:</strong> <code>192.168.4.1</code> (very common) or <code>192.168.1.1</code>.</li>
              <li><strong>How to check on Windows:</strong> Press Win, search <code>cmd</code>, run <code>ipconfig</code>, and locate the <em>Default Gateway</em> row.</li>
              <li><strong>How to check on iPhone/Android:</strong> Tap the info (i) or settings icon next to the active Wi-Fi name, and look for <em>Router</em>. That IP is the camera.</li>
            </ul>
            <div className="code-block">
              <span className="comment">// RTSP stream link when directly connected to camera AP Wi-Fi:</span><br/>
              <code>rtsp://192.168.4.1:554/stream1</code>
            </div>

            <h3>2. If the camera is already connected to your home Wi-Fi</h3>
            <p>
              If the camera is already connected to the same home Wi-Fi router as your computer:
              You can download the <strong>Fing</strong> app on your smartphone (ensure it is connected to the same Wi-Fi). Running a network scan will list all active connected IPs.
              Alternatively, log into your Wi-Fi modem administration dashboard (usually accessible via browser at <code>192.168.1.1</code>) and browse the DHCP client tables.
            </p>
          </>
        )
      }
    },
    {
      id: 'port-forwarding',
      keywords: 'mở cổng modem port forwarding nat virtual server ip tĩnh ngoại mạng ddns port forwarding nat setup wan dynamic static password security',
      title: { vi: 'Cấu hình: Mở cổng Modem (Port Forwarding)', en: 'Config: Port Forwarding on Modem' },
      content: {
        vi: (
          <>
            <p>
              Để hệ thống đám mây của Casos có thể kết nối và phân tích luồng video từ Camera của bạn từ bất kỳ đâu (ngoài mạng nội bộ) mà không cần cài đặt phần cứng Bridge, bạn cần thực hiện cấu hình mở cổng (Port Forwarding / NAT) trên Modem nhà mạng.
            </p>
            
            <h3>Các bước thực hiện mở cổng:</h3>
            <ol>
              <li>
                <strong>Cố định IP Camera:</strong> Truy cập cài đặt Camera hoặc trang quản trị Modem để thiết lập IP tĩnh (Static IP) cho Camera (ví dụ: <code>192.168.1.100</code>). Việc này đảm bảo IP Camera không bị thay đổi mỗi khi khởi động lại.
              </li>
              <li>
                <strong>Xác định cổng RTSP:</strong> Cổng mặc định của RTSP thường là <code>554</code>. Một số dòng Camera cho phép thay đổi cổng này trong phần cài đặt nâng cao.
              </li>
              <li>
                <strong>Cấu hình Port Forwarding trên Modem:</strong>
                <ul>
                  <li>Truy cập trang cấu hình Modem (thường là <code>192.168.1.1</code> hoặc <code>192.168.0.1</code>) bằng trình duyệt web.</li>
                  <li>Tìm mục <strong>Port Forwarding</strong>, <strong>NAT</strong>, <strong>Virtual Server</strong>, hoặc <strong>DMZ</strong>.</li>
                  <li>Tạo một quy tắc mới (Rule):
                    <ul>
                      <li><em>IP Address:</em> Nhập địa chỉ IP tĩnh của Camera (ví dụ: <code>192.168.1.100</code>).</li>
                      <li><em>Internal Port:</em> <code>554</code> (hoặc cổng RTSP của Camera).</li>
                      <li><em>External Port:</em> <code>554</code> (hoặc một cổng tùy chọn khác như <code>8554</code> để tăng tính bảo mật).</li>
                      <li><em>Protocol:</em> Chọn <code>TCP</code> hoặc <code>ALL</code> (cả TCP và UDP).</li>
                    </ul>
                  </li>
                  <li>Lưu lại cấu hình.</li>
                </ul>
              </li>
              <li>
                <strong>Xác định địa chỉ IP công cộng (Public IP):</strong> 
                Truy cập vào trang <a href="https://ip.me" target="_blank" rel="noreferrer">ip.me</a> hoặc <a href="https://whatismyip.com" target="_blank" rel="noreferrer">whatismyip.com</a> để lấy địa chỉ IP WAN hiện tại của nhà bạn (ví dụ: <code>14.226.50.88</code>).
              </li>
            </ol>

            <h3>Đường dẫn RTSP ngoại mạng (Public RTSP URL):</h3>
            <p>Sau khi mở cổng thành công, đường dẫn RTSP để khai báo vào ứng dụng Casos sẽ có dạng:</p>
            <div className="code-block">
              <code>rtsp://[username]:[password]@[IP_Công_Cộng]:[External_Port]/[đường_dẫn_luồng]</code>
              <br /><br />
              <span className="comment">// Ví dụ thực tế với cổng mặc định 554:</span><br />
              <code>rtsp://admin:safetycode123@14.226.50.88:554/cam/realmonitor?channel=1&subtype=0</code>
              <br /><br />
              <span className="comment">// Ví dụ thực tế với cổng ngoài được đổi thành 8554:</span><br />
              <code>rtsp://admin:safetycode123@14.226.50.88:8554/cam/realmonitor?channel=1&subtype=0</code>
            </div>

            <div className="warning-box" style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <strong style={{ color: '#b45309' }}>⚠ Lưu ý cực kỳ quan trọng về bảo mật & tính ổn định:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#78350f' }}>
                <li><strong>Thay đổi mật khẩu mặc định:</strong> Khi đã mở cổng ra Internet, Camera sẽ dễ bị tấn công nếu bạn dùng mật khẩu mặc định (như <code>admin</code>, <code>123456</code>). Hãy đổi sang một mật khẩu cực kỳ mạnh.</li>
                <li><strong>IP mạng WAN động (Dynamic IP):</strong> Modem thông thường sẽ tự động thay đổi địa chỉ IP công cộng sau mỗi vài ngày hoặc khi khởi động lại Modem. Để giải quyết, bạn nên đăng ký dịch vụ tên miền động <strong>DDNS</strong> (như No-IP, DynDNS, hoặc DDNS miễn phí tích hợp sẵn trên Modem/Camera) để có một tên miền cố định thay thế cho IP công cộng (ví dụ: <code>nharieng.ddns.net</code>).</li>
              </ul>
            </div>
          </>
        ),
        en: (
          <>
            <p>
              To allow the Casos cloud computing services to fetch and analyze video feeds from outside your local network without intermediate gateway bridges, you must configure port forwarding (NAT rules) on your home Wi-Fi modem.
            </p>
            
            <h3>Port Forwarding steps:</h3>
            <ol>
              <li>
                <strong>Bind Camera IP:</strong> Access your camera settings or modem dashboard to assign a static IP to the camera (e.g. <code>192.168.1.100</code>). This ensures it doesn\'t change on device restarts.
              </li>
              <li>
                <strong>Define RTSP Port:</strong> Standard port is <code>554</code>. Some cameras let you override this in advanced options.
              </li>
              <li>
                <strong>Configure NAT/Port Forwarding:</strong>
                <ul>
                  <li>Open the modem dashboard (e.g. <code>192.168.1.1</code> or <code>192.168.0.1</code>) via browser.</li>
                  <li>Search for <strong>Port Forwarding</strong>, <strong>NAT</strong>, <strong>Virtual Server</strong>, or <strong>DMZ</strong>.</li>
                  <li>Add a new rule:
                    <ul>
                      <li><em>IP Address:</em> The camera static IP (e.g. <code>192.168.1.100</code>).</li>
                      <li><em>Internal Port:</em> <code>554</code> (or the camera\'s RTSP port).</li>
                      <li><em>External Port:</em> <code>554</code> (or custom, e.g. <code>8554</code> for obscurity).</li>
                      <li><em>Protocol:</em> Select <code>TCP</code> or <code>ALL</code>.</li>
                    </ul>
                  </li>
                  <li>Save configuration.</li>
                </ul>
              </li>
              <li>
                <strong>Identify Public WAN IP:</strong>
                Visit <a href="https://ip.me" target="_blank" rel="noreferrer">ip.me</a> or <a href="https://whatismyip.com" target="_blank" rel="noreferrer">whatismyip.com</a> to retrieve your public IP (e.g., <code>14.226.50.88</code>).
              </li>
            </ol>

            <h3>Public RTSP URL Syntax:</h3>
            <p>With NAT enabled, register the camera in Casos using the following public URL formats:</p>
            <div className="code-block">
              <code>rtsp://[username]:[password]@[Public_IP]:[External_Port]/[stream_path]</code>
              <br /><br />
              <span className="comment">// Example on default port 554:</span><br />
              <code>rtsp://admin:safetycode123@14.226.50.88:554/cam/realmonitor?channel=1&subtype=0</code>
              <br /><br />
              <span className="comment">// Example on custom port 8554:</span><br />
              <code>rtsp://admin:safetycode123@14.226.50.88:8554/cam/realmonitor?channel=1&subtype=0</code>
            </div>

            <div className="warning-box" style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <strong style={{ color: '#b45309' }}>⚠ Essential Security & Stability Notices:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#78350f' }}>
                <li><strong>Change Default Password:</strong> Opening camera streams to the public WAN exposes them to dictionary attacks. Assign a very strong password.</li>
                <li><strong>Dynamic WAN IP:</strong> Standard consumer modems cycle their public IP WAN address every few days. Use a Dynamic DNS (<strong>DDNS</strong>) service (like No-IP, DynDNS, or built-in manufacturer DDNS) to map a static subdomain (e.g., <code>myhouse.ddns.net</code>) to your changing IP.</li>
              </ul>
            </div>
          </>
        )
      }
    }
  ];

  return (
    <div className="nextjs-docs-layout">
      <main className="docs-main-content">
        <header className="page-header-premium" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title-premium">{t('docs.title')}</h1>
            <p className="page-subtitle-premium">
              {t('docs.subtitle')}
              <br/>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{t('docs.searchHint')}</span>
            </p>
          </div>
        </header>

        <hr />

        {docSections
          .filter(section => isMatch(section.keywords) || isMatch(section.title[language]) || isMatch(section.id))
          .map((section) => (
            <div className="doc-section" key={section.id}>
              <h2 id={section.id}>{section.title[language]}</h2>
              {section.content[language]}
              <hr />
            </div>
          ))}
      </main>

      <aside className="docs-right-sidebar">
        <div className="toc-container">
          <h4 className="toc-title">{t('docs.tocTitle')}</h4>
          <ul className="toc-list">
            {docSections
              .slice(0, 10)
              .filter(section => isMatch(section.keywords) || isMatch(section.title[language]) || isMatch(section.id))
              .map((section) => (
                <li key={section.id}>
                  <button onClick={() => scrollTo(section.id)} className={activeId === section.id ? 'active' : ''}>
                    {section.title[language]}
                  </button>
                </li>
              ))}
          </ul>
            
          <h4 className="toc-title" style={{ marginTop: '32px' }}>{t('docs.tocTechTitle')}</h4>
          <ul className="toc-list">
            {docSections
              .slice(10)
              .filter(section => isMatch(section.keywords) || isMatch(section.title[language]) || isMatch(section.id))
              .map((section) => (
                <li key={section.id}>
                  <button onClick={() => scrollTo(section.id)} className={activeId === section.id ? 'active' : ''}>
                    {section.title[language]}
                  </button>
                </li>
              ))}
          </ul>
          
          <div className="toc-footer">
            <a href="https://github.com/macchu-studio" target="_blank" rel="noreferrer">{t('docs.editGithub')}</a>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .nextjs-docs-layout {
          display: flex;
          background-color: transparent;
          color: #1e293b;
          min-height: calc(100vh - 60px);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .docs-main-content {
          flex: 1;
          max-width: 1000px;
          padding: 20px;
          line-height: 1.7;
        }

        /* Unified styles applied via globals.css */
        
        .lead-text {
          font-size: 1.15rem;
          color: #475569;
          margin-bottom: 32px;
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 48px;
          margin-bottom: 16px;
          scroll-margin-top: 80px;
          letter-spacing: -0.02em;
        }

        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
        }

        .lead-text {
          font-size: 1.15rem;
          color: #475569;
          margin-bottom: 32px;
        }

        p {
          color: #334155;
          margin-bottom: 24px;
          font-size: 1rem;
        }

        ul, ol {
          color: #334155;
          margin-bottom: 24px;
          padding-left: 24px;
        }

        li {
          margin-bottom: 12px;
        }

        strong {
          color: #0f172a;
          font-weight: 600;
        }

        hr {
          border: 0;
          height: 1px;
          background: #e2e8f0;
          margin: 48px 0;
        }
        
        .doc-section hr {
          margin: 40px 0;
        }

        .doc-section:last-child hr {
          display: none;
        }

        .code-block {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
          overflow-x: auto;
        }

        code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9em;
          color: #db2777;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .code-block code {
          background: transparent;
          padding: 0;
          color: #2563eb;
        }

        .comment {
          color: #94a3b8;
          font-size: 0.85em;
        }

        /* Right Sidebar TOC */
        .docs-right-sidebar {
          width: 280px;
          padding: 40px 20px 40px 40px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .toc-container {
          display: flex;
          flex-direction: column;
        }

        .toc-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
          border-left: 1px solid #e2e8f0;
        }

        .toc-list li {
          margin-bottom: 0;
        }

        .toc-list button {
          background: none;
          border: none;
          border-left: 2px solid transparent;
          padding: 8px 0 8px 16px;
          margin-left: -1px;
          color: #64748b;
          font-size: 0.9rem;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          font-family: inherit;
          width: 100%;
        }

        .toc-list button:hover {
          color: #1e293b;
        }

        .toc-list button.active {
          color: #2563eb;
          font-weight: 600;
          border-left-color: #2563eb;
        }

        .toc-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .toc-footer a {
          color: #64748b;
          font-size: 0.85rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .toc-footer a:hover {
          color: #0f172a;
        }

        @media (max-width: 1024px) {
          .docs-right-sidebar {
            display: none;
          }
          .docs-main-content {
            padding: 24px 20px;
          }
        }
      `}</style>
    </div>
  );
}
