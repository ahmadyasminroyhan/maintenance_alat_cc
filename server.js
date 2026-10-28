const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Menampilkan file frontend tanpa mengubah tampilannya
app.use(express.static(__dirname));

// Instruksi khusus AI Maintenance Container Crane
const systemInstruction = `
Anda adalah AI Expert Maintenance & Reliability Engineer
yang membantu teknisi dalam pemeliharaan Container Crane (CC)
di lingkungan PT Terminal Petikemas Surabaya (TPS).

TUGAS UTAMA:
1. Menjawab pertanyaan teknis terkait Container Crane.
2. Membantu menganalisis gangguan dan kerusakan peralatan.
3. Membantu memahami Work Order (WO), riwayat maintenance,
   breakdown, dan data operasional.
4. Memberikan penjelasan yang runtut, jelas, dan mudah dipahami.
5. Menghubungkan informasi teknis dengan konteks pertanyaan.

ATURAN MENJAWAB:
- Gunakan bahasa Indonesia yang profesional dan natural.
- Pahami maksud pertanyaan sebelum menjawab.
- Jangan memaksakan jawaban teknis jika pengguna bertanya
  tentang tanggal, riwayat, jumlah WO, atau informasi data.
- Jangan mengarang tanggal, nomor WO, riwayat kerusakan,
  spesifikasi, maupun hasil pemeriksaan.
- Jika data tidak tersedia, sampaikan bahwa data belum ditemukan.
- Bedakan fakta, kemungkinan penyebab, dan rekomendasi.
- Jika informasi kurang jelas, tanyakan detail yang diperlukan.

KESELAMATAN KERJA:
- Untuk pemeriksaan atau perbaikan, ingatkan teknisi agar
  mengikuti prosedur K3 dan LOTO yang berlaku.
- Pekerjaan hanya dilakukan oleh personel berwenang.
- Jangan mengarang prosedur isolasi energi khusus peralatan
  jika dokumen resminya tidak tersedia.
- Perhatikan energi listrik, mekanik, hidrolik, dan energi
  tersimpan sesuai prosedur resmi.

FORMAT JAWABAN:
- Sesuaikan panjang jawaban dengan kebutuhan pertanyaan.
- Gunakan poin-poin untuk penjelasan bertahap.
- Hindari jawaban berulang atau tidak relevan.
`;

// Memeriksa apakah server aktif
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend AI Maintenance Container Crane aktif.'
    });
});

// Endpoint AI Chat
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, maintenanceData = [] } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'GEMINI_API_KEY belum diatur di file .env.'
            });
        }

        if (
            typeof prompt !== 'string' ||
            prompt.trim().length === 0
        ) {
            return res.status(400).json({
                error: 'Pertanyaan tidak boleh kosong.'
            });
        }

        // Memanggil Gemini API
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text: systemInstruction
                            }
                        ]
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: `
PERTANYAAN TEKNISI:
${prompt.trim()}

DATA WORK ORDER DAN RIWAYAT MAINTENANCE:
${JSON.stringify(
                                        Array.isArray(maintenanceData) ? maintenanceData : []
                                    )}

PETUNJUK ANALISIS:
1. Periksa data yang diberikan sebelum menjawab.
2. Jika pertanyaan menyebut tanggal, cocokkan dengan kolom tanggal.
3. Jika tahun tidak disebutkan, periksa semua tahun yang tersedia.
4. Identifikasi Work Order yang bertipe Breakdown, BD, atau Corrective
   sesuai informasi pada data.
5. Jika ditemukan, sebutkan tanggal, unit crane, nomor WO,
   deskripsi gangguan, dan status jika tersedia.
6. Jika tidak ditemukan catatan yang cocok, nyatakan bahwa tidak ada
   catatan yang cocok dalam data yang diberikan.
7. Jangan menyimpulkan bahwa breakdown tidak pernah terjadi hanya
   karena data yang diberikan tidak memuat catatannya.
8. Jangan mengarang data atau menganggap data DEMO sebagai data aktual.
`
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data);

            return res.status(response.status).json({
                error:
                    data.error?.message ||
                    'Terjadi kesalahan pada Gemini API.'
            });
        }

        const answer =
            data.candidates?.[0]?.content?.parts
                ?.map(part => part.text || '')
                .join('\n')
                .trim();

        if (!answer) {
            console.error('Respons Gemini tidak berisi jawaban:', data);

            return res.status(502).json({
                error: 'Gemini tidak menghasilkan jawaban. Silakan coba lagi.'
            });
        }

        return res.json({
            answer: answer,
            raw: data
        });

    } catch (err) {
        console.error('Server Error:', err);

        return res.status(500).json({
            error:
                'Terjadi kesalahan pada server. Pastikan koneksi internet aktif dan server menggunakan Node.js yang mendukung fetch.'
        });
    }
});

// Membuka halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Menjalankan server
app.listen(PORT, HOST, () => {
    console.log('========================================');
    console.log('AI Maintenance Container Crane');
    console.log(`Server aktif di http://${HOST}:${PORT}`);
    console.log(`Tes backend: http://${HOST}:${PORT}/api/health`);
    console.log('========================================');
});