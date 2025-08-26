const form = document.getElementById('regForm');
const statusBox = document.getElementById('status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusBox.innerHTML = '';

  const fd = new FormData(form);
  
  try {
    const resp = await fetch('https://wewin-backend-1.onrender.com/api/register', {
      method: 'POST',
      body: fd
    });

    const data = await resp.json().catch(() => ({}));

    if (data && data.ok) {
      statusBox.className = 'success';
      statusBox.textContent = data.message || 'ส่งสำเร็จ';
      form.reset();
    } else {
      statusBox.className = 'error';
      statusBox.textContent = (data && data.error) ? data.error : 'เกิดข้อผิดพลาด';
    }
  } catch (err) {
    statusBox.className = 'error';
    statusBox.textContent = 'ไม่สามารถเชื่อมต่อ Server ได้';
  }
}, false);
