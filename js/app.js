const form = document.getElementById('regForm');
const statusBox = document.getElementById('status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusBox.innerHTML = '';

  const fd = new FormData(form);
  const resp = await fetch('/api/register', { method: 'POST', body: fd });
  const data = await resp.json().catch(() => ({}));

  if (data && data.ok) {
    statusBox.className = 'success';
    statusBox.textContent = data.message || 'ส่งสำเร็จ';
    form.reset();
  } else {
    statusBox.className = 'error';
    statusBox.textContent = (data && data.error) ? data.error : 'เกิดข้อผิดพลาด';
  }
}, false);
