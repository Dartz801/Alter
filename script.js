document.getElementById('btnProcess').addEventListener('click', function() {
    const input = document.getElementById('inputData').value.trim();
    
    if (!input) {
        showStatus("Mohon masukkan data terlebih dahulu.", "error");
        return;
    }

    // Split berdasarkan baris dan bersihkan whitespace
    const lines = input.split(/\r?\n/).map(line => line.trim()).filter(line => line !== "");
    const dataMap = {};
    const attrSet = new Set();

    // Loop dengan pengecekan aman (Tiap 3 baris)
    for (let i = 0; i < lines.length; i += 3) {
        const woId = lines[i];
        const attrName = lines[i+1];
        const attrValue = lines[i+2];

        // Pastikan atribut ada, nilai boleh kosong (-)
        if (woId && attrName) {
            if (!dataMap[woId]) {
                dataMap[woId] = {};
            }
            dataMap[woId][attrName] = attrValue || "-";
            attrSet.add(attrName);
        }
    }

    const attrList = Array.from(attrSet).sort(); // Urutkan atribut secara alfabetis
    renderTable(dataMap, attrList);
});

function renderTable(dataMap, attrList) {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const outputSection = document.getElementById('outputSection');

    tableHead.innerHTML = ''; 
    tableBody.innerHTML = '';

    if (attrList.length === 0) {
        alert("Format data tidak sesuai. Pastikan data terdiri dari 3 baris per entri.");
        return;
    }

    // Buat Header
    attrList.forEach(attr => {
        const th = document.createElement('th');
        th.textContent = attr;
        tableHead.appendChild(th);
    });

    // Isi Data
    Object.keys(dataMap).forEach(woId => {
        const tr = document.createElement('tr');
        const rowData = dataMap[woId];
        
        attrList.forEach(attr => {
            const td = document.createElement('td');
            td.textContent = rowData[attr] || "-";
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });

    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth' });
}

// Fitur Salin ke Clipboard (Hanya Body Tabel/Data Saja)
document.getElementById('btnCopy').addEventListener('click', function() {
    const tableBody = document.getElementById('tableBody'); // Mengambil body saja
    let range, sel;
    
    if (document.createRange && window.getSelection) {
        range = document.createRange();
        sel = window.getSelection();
        sel.removeAllRanges();
        
        try {
            // Memilih hanya konten di dalam <tbody>
            range.selectNodeContents(tableBody);
            sel.addRange(range);
            
            // Eksekusi perintah salin
            const successful = document.execCommand('copy');
            
            if (successful) {
                const btn = this;
                const originalContent = btn.innerHTML;
                
                // Feedback visual sederhana
                btn.innerHTML = '<i data-lucide="check" class="icon"></i> Berhasil Disalin!';
                if (window.lucide) lucide.createIcons();
                
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    if (window.lucide) lucide.createIcons();
                }, 2000);
            }
        } catch (err) {
            console.error('Gagal menyalin:', err);
            alert('Gagal menyalin data.');
        }
        
        // Bersihkan seleksi agar tidak terlihat biru-biru di layar
        sel.removeAllRanges();
    }
});

document.getElementById('btnClear').addEventListener('click', function() {
    document.getElementById('inputData').value = '';
    document.getElementById('outputSection').style.display = 'none';
});

function showStatus(msg, type) {
    alert(msg); // Bisa diganti dengan toast notification yang lebih cantik
}

