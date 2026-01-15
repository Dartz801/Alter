const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQmM58_LHgxH2bvHvgwHL6gAifeooASymk2Kh88ozV-ekzalPlCSUBYhMvlx-mvTuX1W3W9rolokmAE/pub?gid=0&single=true&output=csv";

let data = [];

function logStatus(message, isError = false) {
    console.log(isError ? "❌ ERROR: " : "ℹ️ LOG: ", message);
}

// 1. Inisialisasi Data
function init() {
    logStatus("Memulai pengambilan data...");
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            data = results.data;
            logStatus("Data Berhasil Dimuat! Baris: " + data.length);
        },
        error: function(error) {
            logStatus("Gagal memuat CSV: " + error.message, true);
        }
    });
}

// 2. Fungsi Search & Auto-Fill (GABUNGAN)
document.getElementById("search-btn").addEventListener("click", () => {
    const inputIP = document.getElementById("ip").value.trim();
    const inputSlot = document.getElementById("slot").value.trim();
    const inputPort = document.getElementById("port").value.trim();

    if (!inputIP || !inputSlot || !inputPort) {
        alert("Mohon isi semua field: IP, Slot, dan Port");
        return;
    }

    const filteredData = data.filter((item) => {
        return (
            String(item.IP || "").trim() === inputIP && 
            String(item.SLOT || "").trim() === inputSlot && 
            String(item.PORT || "").trim() === inputPort
        );
    });

    // Render Tabel Kecil (Inventory Search)
    renderInventoryTable(filteredData);

    // AUTO-FILL ke Alter Provisioning jika data ditemukan
    if (filteredData.length > 0) {
        autoFillAlterProv(filteredData[0]);
    } else {
        alert("Data tidak ditemukan di database.");
    }
});

function renderInventoryTable(filteredData) {
    const tbody = document.getElementById("result-body");
    tbody.innerHTML = "";
    filteredData.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.IP || '-'}</td>
            <td>${item.SLOT || '-'}</td>
            <td>${item.PORT || '-'}</td>
            <td>${item.VLAN_NET || '-'}</td>
            <td>${item.VLAN_VOIP || '-'}</td>
            <td>${item.ID_PORT || '-'}</td>
            <td>${item.GPON || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function autoFillAlterProv(item) {
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = ""; // Bersihkan tabel agar fresh saat search baru

    // Definisi Mapping sesuai permintaan:
    // Internet & Voice (ID_PORT), Internet (VLAN_NET), Voice (VLAN_VOIP)
    const rowsToCreate = [
        { id: item.ID_PORT, config: "Service_Port", note: "Internet/General" },
        { id: item.ID_PORT, config: "Service_Port", note: "Voice/IPTV" },
        { id: item.VLAN_NET, config: "S-Vlan", note: "Internet" },
        { id: item.VLAN_VOIP, config: "S-Vlan", note: "Voice" }
    ];

    rowsToCreate.forEach(rowData => {
        createNewRow(rowData.id, rowData.config);
    });
}

// 3. Fungsi Row Management (Add & Remove)
window.addRow = function() {
    createNewRow("", "Service_Port");
};

function createNewRow(resId = "", configVal = "Service_Port") {
    const tbody = document.querySelector("#dataTable tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td><input type="text" class="res-id" placeholder="ID" value="${resId}"></td>
        <td><input type="text" class="ser-name" placeholder="Service"></td>
        <td><input type="text" class="tar-id" placeholder="Target"></td>
        <td>
            <select class="cfg-name">
                <option value="Service_Port" ${configVal === 'Service_Port' ? 'selected' : ''}>Service_Port</option>
                <option value="S-Vlan" ${configVal === 'S-Vlan' ? 'selected' : ''}>S-Vlan</option>
                <option value="Subscriber_Terminal_Port">Sub_Port</option>
                <option value="Service_Trail">Trail</option>
            </select>
        </td>
        <td style="text-align: center;"><button class="btn-remove" onclick="removeRow(this)">✕</button></td>
    `;
    tbody.appendChild(newRow);
}

window.removeRow = function(btn) {
    const tbody = document.querySelector("#dataTable tbody");
    if (tbody.rows.length > 1) {
        btn.closest("tr").remove();
    } else {
        alert("Minimal harus ada satu baris.");
    }
};

// 4. Fungsi Export CSV
window.downloadCSV = function() {
    const rows = document.querySelectorAll("#dataTable tr");
    let csvContent = "";
    rows.forEach((row, rowIndex) => {
        let rowData = [];
        const cols = row.querySelectorAll("th, td");
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
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Alter_Provisioning_Export.csv`;
    link.click();
};

// 5. Fungsi Theme & Service Selector (Tetap Ada)
document.getElementById('btnExtract').addEventListener('click', function() {
    const input = document.getElementById('inputText').value;
    const outputList = document.getElementById('outputList');
    const tbody = document.querySelector("#dataTable tbody");

    const keyword = "Service ID is ";
    let targetText = input.includes(keyword) ? input.split(keyword)[1] : input;
    const services = targetText.trim().split(',').map(s => s.trim()).filter(s => s !== "");

    outputList.innerHTML = ""; 

    if (services.length > 0) {
        document.getElementById('resultArea').classList.remove('hidden');
        
        services.forEach((cleanItem, index) => {
            // 1. Render Visual Card di Panel Kiri
            const div = document.createElement('div');
            div.className = 'service-card';
            div.innerHTML = `
                <span>${cleanItem}</span>
                <button class="copy-btn" onclick="copyText('${cleanItem}')">
                    <i data-lucide="copy" style="width:16px; height:16px"></i>
                </button>
            `;
            outputList.appendChild(div);

            // 2. Isi ke Kolom SERVICE_NAME di Tabel Alter Provisioning
            // Jika baris belum ada (misal input service lebih banyak dari data inventory), buat baris baru
            if (!tbody.rows[index]) {
                window.addRow();
            }

            const currentRow = tbody.rows[index];
            const serviceInput = currentRow.querySelector(".ser-name");
            if (serviceInput) {
                serviceInput.value = cleanItem;
            }
        });
        
        lucide.createIcons();
    } else {
        alert("Mohon masukkan data service yang valid.");
    }
});

// --- FITUR DARK MODE ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// 1. Fungsi untuk memperbarui ikon secara dinamis
function updateThemeIcon(isDark) {
    const iconElement = document.querySelector('#theme-toggle i');
    if (iconElement) {
        // Ganti atribut data-lucide
        iconElement.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        // Render ulang hanya ikon tersebut
        lucide.createIcons();
    }
}

// 2. Cek preferensi tema yang tersimpan di localStorage saat halaman dimuat
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    updateThemeIcon(true);
}

// 3. Event Listener untuk tombol Toggle
themeToggle.addEventListener('click', () => {
    const isNowDark = body.getAttribute('data-theme') !== 'dark';
    
    if (isNowDark) {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon(true);
    } else {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateThemeIcon(false);
    }
});


init();