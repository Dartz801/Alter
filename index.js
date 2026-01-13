// URL Google Sheet yang sudah di-publish sebagai CSV (Tab RUMUS)
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LsggdPOwSms8SO0wuSEiMAIdyMjYlt0G9z71aZa2gy0ngATMJiakSa_a7cygOFa1WhCinsfHk3AQ/pub?gid=1252451747&single=true&output=csv";

let data = [];

// Fungsi untuk mencatat log ke konsol browser (F12)
function logStatus(message, isError = false) {
    console.log(isError ? "❌ ERROR: " : "ℹ️ LOG: ", message);
}

// Fungsi inisialisasi untuk ambil data dari Google Sheets
function init() {
    logStatus("Memulai pengambilan data dari Google Sheets...");
    
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            data = results.data;
            if (data.length > 0) {
                logStatus("Data Berhasil Dimuat! Jumlah baris: " + data.length);
                // Menampilkan nama kolom asli dari Sheet untuk memastikan case-sensitive
                logStatus("Kolom yang terdeteksi: " + Object.keys(data[0]).join(", "));
            } else {
                logStatus("Data kosong atau format salah.", true);
            }
        },
        error: function(error) {
            logStatus("Gagal memproses CSV: " + error.message, true);
            alert("Gagal memuat data. Pastikan Google Sheet sudah di-publish ke Web sebagai CSV.");
        }
    });
}

// Event Listener untuk tombol cari
document.getElementById("search-btn").addEventListener("click", () => {
    // Ambil nilai input
    const inputIP = document.getElementById("ip").value.trim();
    const inputSlot = document.getElementById("slot").value.trim();
    const inputPort = document.getElementById("port").value.trim();

    if (!inputIP || !inputSlot || !inputPort) {
        alert("Mohon isi semua field: IP, Slot, dan Port");
        return;
    }

    // Filter data berdasarkan input
    const filteredData = data.filter((item) => {
        // PERBAIKAN: Pastikan nama properti (IP, SLOT, PORT) sesuai dengan header di Google Sheet
        // Gunakan trim() pada data sheet juga untuk menghindari spasi tak terlihat
        return (
            String(item.IP || "").trim() === inputIP && 
            String(item.SLOT || "").trim() === inputSlot && 
            String(item.PORT || "").trim() === inputPort
        );
    });

    renderTable(filteredData);
});

const renderTable = (filteredData) => {
    const tbody = document.getElementById("result-body");
    const emptyMsg = document.getElementById("empty-msg");

    tbody.innerHTML = "";
    if (emptyMsg) emptyMsg.textContent = "";

    if (filteredData.length === 0) {
        if (emptyMsg) emptyMsg.textContent = "Tidak ada data yang ditemukan.";
        return;
    }

    filteredData.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.IP || '-'}</td>
            <td>${item.SLOT || '-'}</td>
            <td>${item.PORT || '-'}</td>
            <td>${item.VLAN || '-'}</td>
            <td>${item.ID_PORT || '-'}</td>
            <td>${item.GPON || '-'}</td>
            <td>${item.VENDOR || '-'}</td>
        `;
        tbody.appendChild(row);
    });
};


//-- Fungsi untuk Mengambil Service dari BIMA

document.getElementById('btnExtract').addEventListener('click', function() {
    const input = document.getElementById('inputText').value;
    const outputList = document.getElementById('outputList');
    const resultArea = document.getElementById('resultArea');

    const keyword = "Service ID is ";
    let targetText = input.includes(keyword) ? input.split(keyword)[1] : input;
    const services = targetText.trim().split(',');

    outputList.innerHTML = ""; 

    if (services.length > 0 && services[0] !== "") {
        resultArea.classList.remove('hidden');
        services.forEach(item => {
            const cleanItem = item.trim();
            if (cleanItem !== "") {
                const div = document.createElement('div');
                div.className = 'service-card';
                div.innerHTML = `
                    <span>${cleanItem}</span>
                    <button class="copy-btn" onclick="copyText('${cleanItem}')" title="Salin">
                        <i data-lucide="copy" style="width:16px; height:16px"></i>
                    </button>
                `;
                outputList.appendChild(div);
            }
        });
        lucide.createIcons(); // Re-render icon lucide
    } else {
        alert("Mohon masukkan data yang valid.");
    }
});

// Fungsi Global untuk Copy
window.copyText = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Berhasil disalin: " + text);
    });
};

// --- Fungsi untuk Bagian Alter Prov ---
// (Fungsi addRow, removeRow, downloadCSV tetap sama namun pastikan ID elemen ada di HTML)

window.addRow = function() {
    const tableBody = document.querySelector("#dataTable tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" class="res-id" placeholder="ID"></td>
        <td><input type="text" class="ser-name" placeholder="Service"></td>
        <td><input type="text" class="tar-id" placeholder="Target"></td>
        <td>
            <select class="cfg-name">
                <option value="Service_Port">Service_Port</option>
                <option value="S-Vlan">S-Vlan</option>
                <option value="Subscriber_Terminal_Port">Subscriber_Terminal_Port</option>
                <option value="Service_Trail">Service_Trail</option>
            </select>
        </td>
        <td style="text-align: center;"><button class="btn-remove" onclick="removeRow(this)">✕</button></td>
    `;
    tableBody.appendChild(newRow);
};

window.removeRow = function(btn) {
    const tbody = document.querySelector("#dataTable tbody");
    if (tbody.rows.length > 1) {
        btn.closest("tr").remove();
    } else {
        alert("Minimal harus ada satu baris.");
    }
};

window.downloadCSV = function() {
    const rows = document.querySelectorAll("#dataTable tr");
    let csvContent = "";
    rows.forEach((row, rowIndex) => {
        let rowData = [];
        const cols = row.querySelectorAll("th, td");
        // Loop kolom kecuali kolom terakhir (tombol hapus)
        for (let i = 0; i < cols.length - 1; i++) {
            let cellValue = "";
            if (rowIndex === 0) {
                cellValue = cols[i].innerText;
            } else {
                const inputElement = cols[i].querySelector("input, select");
                cellValue = inputElement ? inputElement.value : "";
            }
            rowData.push(`"${cellValue.replace(/"/g, '""')}"`);
        }
        csvContent += rowData.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Alter Service Config Item.csv`);
    link.click();
};

// --- Fitur Dark Mode ---
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;

// Cek simpanan tema di browser
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    updateIcon(true);
}

themeToggle.addEventListener('click', () => {
    const isDark = body.getAttribute('data-theme') === 'dark';
    if (isDark) {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateIcon(false);
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateIcon(true);
    }
});

function updateIcon(isDark) {
    // Ubah icon Lucide secara dinamis
    const iconName = isDark ? 'sun' : 'moon';
    themeIcon.setAttribute('data-lucide', iconName);
    lucide.createIcons(); 
}

// Jalankan fungsi init saat halaman dimuat
init();