import axios from 'axios';

async function runEndToEndStreamTest() {
  console.log('=============== KIỂM THỬ TỰ ĐỘNG MODULE 1 (AI STREAMING PROXY) ===============\n');

  const BASE_URL = 'http://localhost:5000';
  const UNIQUE_EMAIL = `streamtest_${Date.now()}@skipli.dev`;
  const PASSWORD = 'Password123!';

  let accessToken = '';

  // 1. Đăng ký tài khoản test mới
  try {
    console.log(`1. Đăng ký tài khoản test mới (${UNIQUE_EMAIL})...`);
    const regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: UNIQUE_EMAIL,
      password: PASSWORD,
      displayName: 'Stream Tester',
    });

    accessToken = regRes.data.data.accessToken;
    console.log('✅ Đăng ký thành công! Access Token:', accessToken.substring(0, 20) + '...\n');
  } catch (err: any) {
    console.error('❌ Lỗi đăng ký:', err.response?.data || err.message);
    return;
  }

  // 2. Gọi API POST /api/chat/stream và lắng nghe luồng SSE
  console.log('2. Gửi prompt tới POST /api/chat/stream & Kết nối GoClaw AI Engine...\n');
  console.log('------------------- LUỒNG DỮ LIỆU SSE STREAM (TOKENS) -------------------');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/chat/stream`,
      {
        prompt: 'Tạo cho tôi 1 trang web tiệm cafe sang trọng sử dụng Tailwind CSS có Hero banner.',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        responseType: 'stream',
      }
    );

    let tokenCount = 0;
    let fullText = '';

    response.data.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataContent = line.replace('data: ', '').trim();
          if (dataContent === '[DONE]') {
            console.log('\n------------------------------------------------------------------------');
            console.log('\n✅ [SSE STREAM SUCCESS] Nhận tín hiệu [DONE] hoàn thành luồng stream!');
            return;
          }

          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.type === 'token') {
              tokenCount++;
              process.stdout.write(parsed.token);
              fullText += parsed.token;
            } else if (parsed.type === 'complete') {
              console.log('\n\n--- THÔNG TIN KẾT THÚC STREAM ---');
              console.log(`- Tổng số token đã nhận: ${tokenCount}`);
              console.log(`- Độ dài mã HTML đã trích xuất: ${parsed.extractedHtml?.length || 0} ký tự`);
              console.log('- Mẫu mã HTML trích xuất được (150 ký tự đầu):\n', parsed.extractedHtml?.substring(0, 150) || 'N/A');
            }
          } catch {
            // Raw text fallback
          }
        }
      }
    });

    response.data.on('end', () => {
      console.log('\n🎉 THÀNH CÔNG: ĐÃ KẾT NỐI VÀ NHẬN ĐẦY ĐỦ LUỒNG DỮ LIỆU TỪ GOCLAW!');
    });

  } catch (error: any) {
    console.error('\n❌ Lỗi kết nối Stream:', error.response?.data || error.message);
  }
}

runEndToEndStreamTest();
