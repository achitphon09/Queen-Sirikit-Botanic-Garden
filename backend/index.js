import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ข้อมูล 5 ด่านพื้นที่โล่งในสวนพฤกษศาสตร์สมเด็จพระนางเจ้าสิริกิติ์
const STAGES = [
  {
    id: 1,
    zone: 'โซนพืชวงศ์กล้วย',
    stampName: 'ตราพฤษากล้วย',
    gameType: 'order',
    gameLabel: 'เรียงลำดับวงจรชีวิต',
    lat: 18.8952,
    lng: 98.8551,
    radiusMeters: 30,
    fact: 'กล้วยจัดเป็นพืชใบเลี้ยงเดี่ยวขนาดใหญ่ ลำต้นแท้จริงอยู่ใต้ดินเรียกว่าเหง้า'
  },
  {
    id: 2,
    zone: 'ลานสมุนไพรกลางแจ้ง',
    stampName: 'ตราสมุนไพร',
    gameType: 'swipe',
    gameLabel: 'ปัดซ้าย-ขวา จริงหรือมั่ว',
    lat: 18.8961,
    lng: 98.8562,
    radiusMeters: 30,
    fact: 'พืชสมุนไพรหลายชนิดมีสารสำคัญที่ช่วยบรรเทาอาการเบื้องต้นในชีวิตประจำวัน'
  },
  {
    id: 3,
    zone: 'ลานไม้ประดับแสงแดด',
    stampName: 'ตราสุริยาพฤกษา',
    gameType: 'zoom',
    gameLabel: 'ซูมส่องปริศนา',
    lat: 18.8973,
    lng: 98.8574,
    radiusMeters: 30,
    fact: 'พรรณไม้กลางแจ้งมักปรับตัวให้ทนแดดแรงและลดการคายน้ำได้ดี'
  },
  {
    id: 4,
    zone: 'ลานพืชใช้สอย',
    stampName: 'ตราหัตถพฤกษา',
    gameType: 'match',
    gameLabel: 'จับคู่ / ปรุงสูตร',
    lat: 18.8984,
    lng: 98.8585,
    radiusMeters: 30,
    fact: 'พรรณไม้พื้นถิ่นหลายชนิดถูกนำมาใช้ประโยชน์ทั้งด้านเครื่องใช้ เส้นใย และอาหาร'
  },
  {
    id: 5,
    zone: 'ลานเงาพฤกษา',
    stampName: 'ตราเงาพฤกษา',
    gameType: 'shadow',
    gameLabel: 'ทายจากเงา',
    lat: 18.8995,
    lng: 98.8596,
    radiusMeters: 30,
    fact: 'รูปทรงของใบและดอกช่วยบอกลักษณะเฉพาะของพรรณไม้แต่ละชนิดได้'
  }
];

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Shadow Botanical Quest API is ready' });
});

app.get('/api/stages', (req, res) => {
  res.json({ stages: STAGES });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});