// api/save_result.js
// Vercel serverless function - receives payload from client, saves to Airtable, forwards to admin webhook (optional)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel จะ parse body ให้เป็น JSON ถ้า Content-Type ถูกต้อง.
    // แต่เผื่อกรณีอื่น ๆ ให้รองรับ string body ด้วย
    const body = (typeof req.body === 'string') ? JSON.parse(req.body) : req.body;

    const { name, score, level, description, answers, date } = body || {};

    if (!name || (typeof score === 'undefined' || score === null)) {
      return res.status(400).json({ error: 'Invalid payload: name and score required' });
    }

    const normalizedScore = (typeof score === 'string') ? parseInt(score, 10) : score;

    // อ่านจาก Environment Variables (ต้องตั้งใน Vercel)
    const AIRTABLE_API_KEY = "pat78QaAXMhV6Eb6J.a20b22250d5603ae33963b385edb9475a48178f61716b00e04a175f169a7da46";
    const AIRTABLE_BASE_ID = "appdQuLxRejun9CwB";
    const AIRTABLE_TABLE_NAME = "Risk Assessments";

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('Missing Airtable configuration in environment variables');
      return res.status(500).json({ error: 'Server not configured' });
    }

    // เตรียม payload สำหรับ Airtable
    const airtablePayload = {
      fields: {
        Name: String(name),
        Score: Number(normalizedScore),
        Level: String(level || ''),
        Description: String(description || ''),
        Date: date || new Date().toISOString(),
        Answers: JSON.stringify(answers || {})
      }
    };

    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

    const airtableResp = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtablePayload)
    });

    if (!airtableResp.ok) {
      const txt = await airtableResp.text().catch(()=>null);
      console.error('Airtable API error:', airtableResp.status, txt);
      return res.status(502).json({ error: 'Airtable API error', status: airtableResp.status, body: txt });
    }

    const airtableData = await airtableResp.json();

    // Forward to admin webhook (optional)
    if (ADMIN_WEBHOOK_URL) {
      try {
        await fetch(ADMIN_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            airtableRecordId: airtableData.id || (airtableData.records && airtableData.records[0]?.id),
            name,
            score: normalizedScore,
            level,
            description,
            date: date || new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('Admin webhook failed:', err);
        // ไม่ต้องหยุดการทำงาน — log เท่านั้น
      }
    }

    // คืนค่าให้ client
    return res.status(200).json({ ok: true, airtable: airtableData });
  } catch (err) {
    console.error('save_result error:', err);
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}
