"use client"

import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function DocsPage() {
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
      // Trừ đi offset khoảng 40px để margin-top cho đẹp
      const targetPos = elementTop - containerTop + scrollContainer.scrollTop - 40;
      scrollContainer.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
  };

  const isMatch = (keywords: string) => {
    if (!searchQuery) return true;
    return keywords.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="nextjs-docs-layout">
      <main className="docs-main-content">
        <header className="page-header-premium" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title-premium">Tài liệu dự án & Hướng dẫn</h1>
            <p className="page-subtitle-premium">
              Chào mừng bạn đến với tài liệu hướng dẫn cấu hình hệ thống Cardiac Alert và Camera AI!
              <br/>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Sử dụng thanh tìm kiếm phía trên (Ctrl+K) để lọc tài liệu.</span>
            </p>
          </div>
        </header>

        <hr />

        {isMatch("tổng quan hệ thống cảnh báo té ngã thông minh người cao tuổi") && (
          <div className="doc-section">
            <h2 id="project-overview">Tổng quan hệ thống</h2>
            <p>
              <strong>Casos (Cardiac Alert)</strong> là hệ thống giám sát và cảnh báo té ngã thông minh, được thiết kế đặc biệt để bảo vệ sự an toàn của người cao tuổi và người bệnh khi ở nhà một mình.
            </p>
            <p>
              Bằng việc sử dụng camera thông minh tích hợp hệ thống trí tuệ nhân tạo (AI), nền tảng sẽ theo dõi và phân tích chuyển động liên tục 24/7 một cách riêng tư. Ngay khi nhận diện có người bị ngã, Casos sẽ lập tức phân tích mức độ nghiêm trọng, kích hoạt chuỗi báo động tại chỗ và kết nối đến người thân. Mục tiêu của chúng tôi là đảm bảo sự trợ giúp được diễn ra trong "thời điểm vàng", giúp giảm thiểu tối đa các rủi ro nguy hiểm đến tính mạng.
            </p>
            <hr />
          </div>
        )}

        {isMatch("cảnh báo tự động khẩn cấp gọi điện còi báo động người thân") && (
          <div className="doc-section">
            <h2 id="emergency-calls">Quy trình cảnh báo tự động</h2>
            <p>Để đảm bảo không bỏ sót bất kỳ sự cố nào, khi AI phát hiện sự kiện té ngã, hệ thống sẽ xử lý theo quy trình nghiêm ngặt nhằm tránh các trường hợp báo động giả và đảm bảo cấp cứu kịp thời:</p>
            <ol>
              <li><strong>Cảnh báo tại chỗ (7 giây đầu):</strong> Hệ thống sẽ tự động phát âm thanh còi báo động lớn ngay tại khu vực lắp camera để thu hút sự chú ý của những người xung quanh trong nhà, đồng thời giúp bệnh nhân nhận thức được hệ thống đã ghi nhận sự việc.</li>
              <li><strong>Gọi điện thoại khẩn cấp (10 giây tiếp theo):</strong> Nếu sau báo động tại chỗ mà không có ai can thiệp hoặc không có dấu hiệu bệnh nhân đứng dậy, hệ thống sẽ tự động sử dụng nền tảng viễn thông thông minh để thực hiện cuộc gọi khẩn cấp đến số điện thoại của người thân. Trợ lý ảo sẽ đọc rõ vị trí phòng, thời gian và thông tin người bệnh bị ngã để bạn kịp thời ứng cứu.</li>
            </ol>
            <hr />
          </div>
        )}

        {isMatch("hồ sơ y tế sức khỏe thông tin bệnh lý health profile") && (
          <div className="doc-section">
            <h2 id="health-profiles">Cấu hình Hồ sơ Y tế</h2>
            <p>
              Để hệ thống có thể cung cấp thông tin toàn diện nhất trong các trường hợp cấp cứu, bạn nên chủ động thiết lập <strong>Hồ sơ y tế (Health Profile)</strong> cho đối tượng được giám sát tại mục Profile.
            </p>
            <ul>
              <li><strong>Thông tin cơ bản:</strong> Họ tên, năm sinh, nhóm máu, số điện thoại liên lạc.</li>
              <li><strong>Tiền sử bệnh lý:</strong> Các bệnh mãn tính (Tim mạch, tiểu đường, huyết áp), dị ứng thuốc, hoặc các lưu ý đặc biệt về xương khớp.</li>
              <li><strong>Tác dụng:</strong> Khi xảy ra sự cố nghiêm trọng, trợ lý ảo gọi điện khẩn cấp không chỉ thông báo việc té ngã mà còn có thể đính kèm các thông tin y tế cốt lõi này. Điều này giúp nhân viên y tế (115) hoặc người nhà có sự chuẩn bị phương án cấp cứu tốt nhất trước khi đến hiện trường.</li>
            </ul>
            <hr />
          </div>
        )}

        {isMatch("chia sẻ quyền thành viên gia đình invite team members truy cập") && (
          <div className="doc-section">
            <h2 id="team-members">Chia sẻ quyền truy cập (Gia đình)</h2>
            <p>Việc chăm sóc người thân là trách nhiệm chung. Casos cho phép bạn mời nhiều thành viên trong gia đình cùng theo dõi và quản lý hệ thống giám sát một cách an toàn.</p>
            <ol>
              <li>Truy cập mục <strong>Profile</strong> {'>'} <strong>Team Members</strong> (hoặc nhấn nút <em>Invite team members</em> ở thanh menu trái).</li>
              <li>Nhập địa chỉ Email của người mà bạn muốn cấp quyền truy cập.</li>
              <li>Người được mời sẽ nhận được một đường link bảo mật. Sau khi tạo tài khoản, họ có thể cùng xem luồng Live Stream camera và nhận các tin nhắn cảnh báo song song với bạn.</li>
            </ol>
            <p><em>Lưu ý bảo mật: Chỉ có tài khoản Chủ gia đình (Owner) mới có quyền quản lý thanh toán, xóa thiết bị Camera hoặc thiết lập lại cấu hình AI. Các thành viên khác chỉ có quyền Xem (Viewer) hoặc Nhận thông báo.</em></p>
            <hr />
          </div>
        )}

        {isMatch("quản lý sự cố xem lại video incidents ghi hình lịch sử") && (
          <div className="doc-section">
            <h2 id="incidents-management">Trung tâm Sự cố (Incidents)</h2>
            <p>Mọi sự kiện té ngã hoặc cảnh báo nguy hiểm đều được AI tự động ghi hình lại và mã hóa lưu trữ an toàn trên đám mây của hệ thống.</p>
            <ul>
              <li><strong>Trích xuất Video AI:</strong> Hệ thống tự động cắt đoạn video ngắn (khoảng 15-30 giây) bao gồm trọn vẹn khoảnh khắc trước, trong và sau khi ngã. Tính năng này giúp bác sĩ dễ dàng chuẩn đoán nguyên nhân vật lý gây ra tai nạn.</li>
              <li><strong>Xác nhận tình trạng:</strong> Người nhà có thể chủ động đánh dấu sự cố là <em>"Đã xử lý" (Resolved)</em> để dừng chuỗi cảnh báo. Đồng thời bạn có thể đánh dấu <em>"Báo động giả" (False Alarm)</em> để giúp AI của chúng tôi học hỏi, điều chỉnh tham số và nhận diện chính xác hơn cho ngôi nhà của bạn trong tương lai.</li>
              <li><strong>Thống kê (Analytics):</strong> Tần suất té ngã và thời gian xảy ra sự cố được thống kê dưới dạng biểu đồ, giúp gia đình theo dõi xu hướng sức khỏe của người bệnh.</li>
            </ul>
            <hr />
          </div>
        )}

        {isMatch("thanh toán gói cước subscription nâng cấp mã qr hủy đăng ký otp") && (
          <div className="doc-section">
            <h2 id="billing">Quản lý gói cước & Thanh toán</h2>
            <p>Hệ thống cung cấp các tùy chọn gói dịch vụ (Free, Starter, Pro, Scale) linh hoạt phù hợp với số lượng camera và nhu cầu lưu trữ video của gia đình bạn.</p>
            <ul>
              <li><strong>Nâng cấp hoàn toàn tự động:</strong> Việc thanh toán diễn ra mượt mà thông qua đối tác SePay. Bạn chỉ cần quét mã QR hoặc chuyển khoản với nội dung cú pháp được chỉ định, hệ thống sẽ tự động xác nhận giao dịch trong vòng 10 giây và mở khóa tài khoản Premium của bạn ngay lập tức (kể cả ban đêm hay cuối tuần).</li>
              <li><strong>Hủy gói cước an toàn:</strong> Không có hợp đồng ràng buộc, bạn có thể hủy gia hạn bất cứ lúc nào. Để tránh việc thao tác nhầm lẫn gây mất quyền lợi, hệ thống yêu cầu xác thực bằng mã bảo mật OTP (gửi về Email cá nhân). Sau khi hủy, hệ thống vẫn duy trì dịch vụ cho đến hết chu kỳ đã thanh toán.</li>
            </ul>
            <hr />
          </div>
        )}

        {isMatch("câu hỏi thường gặp lỗi faq troubleshooting offline mất mạng") && (
          <div className="doc-section">
            <h2 id="faq">Câu hỏi thường gặp (FAQ)</h2>
            
            <h3>1. Hệ thống báo Camera Offline, tôi phải làm sao?</h3>
            <p>Vui lòng kiểm tra lại nguồn điện của Camera. Nếu Camera vẫn đang cắm điện, hãy khởi động lại Modem Wifi nhà bạn. Trong phần lớn trường hợp, Camera sẽ tự động kết nối lại vào hệ thống của chúng tôi trong vòng 1-2 phút sau khi có mạng Internet ổn định trở lại.</p>
            
            <h3>2. Hình ảnh camera bị chậm (delay) so với thực tế?</h3>
            <p>Vì hệ thống sử dụng giao thức RTSP truyền tải qua đám mây để AI phân tích, độ trễ tiêu chuẩn là từ 2-5 giây. Tuy nhiên, nếu độ trễ lên đến trên 10 giây hoặc video bị giật lag, bạn nên hạ độ phân giải của Camera xuống mức 1080p hoặc 720p. Việc này không ảnh hưởng nhiều đến chất lượng AI nhưng sẽ cải thiện tốc độ mạng đáng kể.</p>

            <h3>3. Tôi không nhận được mã OTP khi thao tác?</h3>
            <p>Hãy kiểm tra hộp thư Rác (Spam) hoặc mục Quảng cáo (Promotions) trong Email của bạn. Nếu vẫn không thấy thư từ hệ thống Casos, bạn có thể nhấn "Gửi lại mã" trên giao diện sau khi chờ 60 giây.</p>
            
            <h3>4. AI có nhận nhầm thú cưng (chó, mèo) thành người ngã không?</h3>
            <p>Model AI của chúng tôi đã được huấn luyện với hàng triệu dữ liệu để phân tích khung xương (Skeleton Tracking) của con người. Do đó, hệ thống sẽ bỏ qua các chuyển động của thú cưng hoặc robot hút bụi để hạn chế tối đa báo động giả.</p>
            <hr />
          </div>
        )}

        {/* --- Dưới đây là các phần kỹ thuật Camera --- */}

        {isMatch("rtsp là gì giao thức video camera cấu hình mạng") && (
          <div className="doc-section">
            <h2 id="what-is-rtsp">Khái niệm kỹ thuật: RTSP là gì?</h2>
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
            <hr />
          </div>
        )}

        {isMatch("camera x-iot xiot khuyên dùng luồng rtsp") && (
          <div className="doc-section">
            <h2 id="camera-xiot">Cấu hình: Camera X-IoT (Khuyên dùng)</h2>
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
            <hr />
          </div>
        )}

        {isMatch("camera ezviz mã xác thực verification code cấu hình rtsp") && (
          <div className="doc-section">
            <h2 id="camera-ezviz">Cấu hình: Camera EZVIZ</h2>
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
            <hr />
          </div>
        )}

        {isMatch("camera imou safety code cấu hình rtsp") && (
          <div className="doc-section">
            <h2 id="camera-imou">Cấu hình: Camera IMOU</h2>
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
            <hr />
          </div>
        )}

        {isMatch("camera tapo tp-link tplink tài khoản camera nâng cao cấu hình rtsp") && (
          <div className="doc-section">
            <h2 id="camera-tapo">Cấu hình: Camera Tapo (TP-Link)</h2>
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
            <hr />
          </div>
        )}

        {isMatch("hikvision dahua kbvision nvr đầu ghi cấu hình rtsp") && (
          <div className="doc-section">
            <h2 id="hikvision-dahua">Cấu hình: Hikvision / Dahua</h2>
            <p>
              Đây là nhóm Camera chuyên dụng thường kết nối qua đầu ghi mạng (NVR). Bạn phải sử dụng chính xác tài khoản và mật khẩu đã được thiết lập bởi thợ lắp đặt ban đầu trên đầu ghi.
            </p>
            <div className="code-block">
              <span className="comment">// Dành cho hệ sinh thái Hikvision</span><br/>
              <code>rtsp://[user]:[pass]@[IP_Camera]:554/Streaming/Channels/101</code><br/><br/>
              <span className="comment">// Dành cho hệ sinh thái Dahua / KBVision</span><br/>
              <code>rtsp://[user]:[pass]@[IP_Camera]:554/cam/realmonitor?channel=1&subtype=0</code>
            </div>
            <hr />
          </div>
        )}

        {isMatch("cách lấy ip camera wifi fing router default gateway") && (
          <div className="doc-section">
            <h2 id="find-ip">Kỹ thuật: Cách tìm IP Camera nội bộ</h2>

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
          </div>
        )}
      </main>

      <aside className="docs-right-sidebar">
        <div className="toc-container">
          <h4 className="toc-title">Danh mục nội dung</h4>
          <ul className="toc-list">
            {isMatch("tổng quan hệ thống cảnh báo té ngã thông minh người cao tuổi") && (
              <li><button onClick={() => scrollTo('project-overview')} className={activeId === 'project-overview' ? 'active' : ''}>Tổng quan hệ thống</button></li>
            )}
            {isMatch("cảnh báo tự động khẩn cấp gọi điện còi báo động người thân") && (
              <li><button onClick={() => scrollTo('emergency-calls')} className={activeId === 'emergency-calls' ? 'active' : ''}>Quy trình cảnh báo</button></li>
            )}
            {isMatch("hồ sơ y tế sức khỏe thông tin bệnh lý health profile") && (
              <li><button onClick={() => scrollTo('health-profiles')} className={activeId === 'health-profiles' ? 'active' : ''}>Hồ sơ Y tế</button></li>
            )}
            {isMatch("chia sẻ quyền thành viên gia đình invite team members truy cập") && (
              <li><button onClick={() => scrollTo('team-members')} className={activeId === 'team-members' ? 'active' : ''}>Chia sẻ tài khoản</button></li>
            )}
            {isMatch("quản lý sự cố xem lại video incidents ghi hình lịch sử") && (
              <li><button onClick={() => scrollTo('incidents-management')} className={activeId === 'incidents-management' ? 'active' : ''}>Quản lý Sự cố (Incidents)</button></li>
            )}
            {isMatch("thanh toán gói cước subscription nâng cấp mã qr hủy đăng ký otp") && (
              <li><button onClick={() => scrollTo('billing')} className={activeId === 'billing' ? 'active' : ''}>Thanh toán gói cước</button></li>
            )}
            {isMatch("câu hỏi thường gặp lỗi faq troubleshooting offline mất mạng") && (
              <li><button onClick={() => scrollTo('faq')} className={activeId === 'faq' ? 'active' : ''}>FAQ & Khắc phục lỗi</button></li>
            )}
          </ul>
            
          <h4 className="toc-title" style={{ marginTop: '32px' }}>Cấu hình Camera (Kỹ thuật)</h4>
          <ul className="toc-list">
            {isMatch("rtsp là gì giao thức video camera cấu hình mạng") && (
              <li><button onClick={() => scrollTo('what-is-rtsp')} className={activeId === 'what-is-rtsp' ? 'active' : ''}>Khái niệm RTSP</button></li>
            )}
            {isMatch("camera x-iot xiot khuyên dùng luồng rtsp") && (
              <li><button onClick={() => scrollTo('camera-xiot')} className={activeId === 'camera-xiot' ? 'active' : ''}>Camera X-IoT</button></li>
            )}
            {isMatch("camera ezviz mã xác thực verification code cấu hình rtsp") && (
              <li><button onClick={() => scrollTo('camera-ezviz')} className={activeId === 'camera-ezviz' ? 'active' : ''}>Camera EZVIZ</button></li>
            )}
            {isMatch("camera imou safety code cấu hình rtsp") && (
              <li><button onClick={() => scrollTo('camera-imou')} className={activeId === 'camera-imou' ? 'active' : ''}>Camera IMOU</button></li>
            )}
            {isMatch("camera tapo tp-link tplink tài khoản camera nâng cao cấu hình rtsp") && (
              <li><button onClick={() => scrollTo('camera-tapo')} className={activeId === 'camera-tapo' ? 'active' : ''}>Camera Tapo</button></li>
            )}
            {isMatch("hikvision dahua kbvision nvr đầu ghi cấu hình rtsp") && (
              <li><button onClick={() => scrollTo('hikvision-dahua')} className={activeId === 'hikvision-dahua' ? 'active' : ''}>Hikvision / Dahua</button></li>
            )}
            {isMatch("cách lấy ip camera wifi fing router default gateway") && (
              <li><button onClick={() => scrollTo('find-ip')} className={activeId === 'find-ip' ? 'active' : ''}>Cách lấy IP mạng</button></li>
            )}
          </ul>
          
          <div className="toc-footer">
            <a href="https://github.com/macchu-studio" target="_blank" rel="noreferrer">Edit this page on GitHub ↗</a>
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
