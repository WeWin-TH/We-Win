document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('risk-form');
    const modal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModal');

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const userName = document.getElementById('user-name').value.trim();
        if (!userName) {
            alert('กรุณากรอกชื่อก่อนทำแบบประเมิน');
            return;
        }

        let totalScore = 0;
        const formData = new FormData(form);
        for (const value of formData.values()) {
            if (!isNaN(value)) totalScore += parseInt(value);
        }

        let level = '';
        let description = '';

        if (totalScore <= 60) {
            level = 'รับความเสี่ยงได้สูง (High Risk)';
            description = 'คุณสามารถยอมรับความผันผวนสูงเพื่อผลตอบแทนระยะยาว';
        } else if (totalScore <= 100) {
            level = 'รับความเสี่ยงได้ปานกลาง (Medium Risk)';
            description = 'คาดหวังผลตอบแทนมากกว่าเงินฝาก พร้อมรับความผันผวนระดับหนึ่ง';
        } else {
            level = 'รับความเสี่ยงได้ต่ำ (Low Risk)';
            description = 'เน้นความปลอดภัยของเงินต้นและผลตอบแทนที่มั่นคง';
        }

        // ส่งข้อมูลไปหลังบ้าน
        fetch('/admin/save_result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: userName,
                score: totalScore,
                level: level,
                description: description,
                date: new Date().toISOString()
            })
        })
        .then(resp => resp.json())
        .then(() => {
            modal.style.display = 'block';
            form.reset();
        })
        .catch(err => {
            alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองอีกครั้ง');
            console.error(err);
        });
    });

    closeModalBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
