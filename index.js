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
    tbody.innerHTML = ""; // Reset tabel agar bersih

    const mappings = [
        // Pasangan Internet
        { id: item.ID_PORT, config: "Service_Port" }, // Baris 1
        // Pasangan Voice
        { id: item.ID_PORT, config: "Service_Port" }, // Baris 2
        // Pasangan IPTV
        { id: item.ID_PORT, config: "Service_Port" }, // Baris 3
        
        // S-Vlan Mapping
        { id: item.VLAN_NET, config: "S-Vlan" },      // Baris 4 (Internet)
        { id: item.VLAN_VOIP, config: "S-Vlan" },     // Baris 5 (Voice)
    ];

    mappings.forEach(map => {  
        createNewRow(map.id, map.config);
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
    const tbody = document.querySelector("#dataTable tbody");
    const keyword = "Service ID is ";
    
    let targetText = input.includes(keyword) ? input.split(keyword)[1] : input;
    const services = targetText.trim().split(',').map(s => s.trim()).filter(s => s !== "");


    // Ambil data service (dengan fallback jika data tidak ada)
    const srvInternet = services[0] || "";
    const srvVoice    = services[1] || "";
    const srvIPTV     = services[2] || "";

    // Pastikan tabel memiliki minimal 6 baris
    while (tbody.rows.length < 6) {
        window.addRow();
    }

    // --- DISTRIBUSI OTOMATIS KE KOLOM SERVICE_NAME ---
    
    // Baris 1 & 4 untuk INTERNET
    if(tbody.rows[0]) tbody.rows[0].querySelector(".ser-name").value = srvInternet;
    if(tbody.rows[3]) tbody.rows[3].querySelector(".ser-name").value = srvInternet;
    
    // Baris 2 & 5 untuk VOICE
    if(tbody.rows[1]) tbody.rows[1].querySelector(".ser-name").value = srvVoice;
    if(tbody.rows[4]) tbody.rows[4].querySelector(".ser-name").value = srvVoice;
    
    // Baris 3 & 6 untuk IPTV
    if(tbody.rows[2]) tbody.rows[2].querySelector(".ser-name").value = srvIPTV;

    logStatus("Service Name berhasil didistribusikan ke 6 baris.");
});


window.clearTable = function() {
    // Gunakan konfirmasi agar tidak sengaja terhapus
    if (confirm("Kosongkan semua data di tabel Alter Provisioning?")) {
        const tbody = document.querySelector("#dataTable tbody");
        
        // Animasi fade out (opsional)
        tbody.style.opacity = "0";
        
        setTimeout(() => {
            tbody.innerHTML = "";
            // Setelah kosong, siapkan 1 baris default agar tabel tidak terlihat 'patah'
            window.addRow();
            tbody.style.opacity = "1";
            logStatus("Tabel berhasil dibersihkan.");
        }, 200);
    }
};


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


// --- Fungsi Bulk Update VLAN VOIP ---
function previewBulkUpdate() {
    const ipValue = document.getElementById('bulk-ip').value.trim();
    const vlanValue = document.getElementById('bulk-vlan').value.trim();
    const previewBox = document.getElementById('bulk-preview');
    const btnExecute = document.getElementById('btn-execute-bulk');

    if (!ipValue || !vlanValue) {
        alert("Mohon masukkan IP dan VLAN VOIP tujuan.");
        return;
    }

    // Filter data lokal untuk melihat berapa banyak port yang terdampak
    const affectedPorts = data.filter(item => String(item.IP).trim() === ipValue);
    
    if (affectedPorts.length > 0) {
        previewBox.innerHTML = `
            <strong>Device Found!</strong><br>
            IP: ${ipValue}<br>
            Ditemukan <b>${affectedPorts.length}</b> baris/port yang akan diupdate ke VLAN <b>${vlanValue}</b>.
        `;
        previewBox.classList.remove('hidden');
        btnExecute.disabled = false;
    } else {
        previewBox.innerHTML = `<span style="color:red">IP ${ipValue} tidak ditemukan di database.</span>`;
        previewBox.classList.remove('hidden');
        btnExecute.disabled = true;
    }
}

async function executeBulkUpdate() {
    const ip = document.getElementById('bulk-ip').value.trim();
    const vlan = document.getElementById('bulk-vlan').value.trim();
    const btn = document.getElementById('btn-execute-bulk');
    const scriptUrl = "https://script.google.com/macros/s/AKfycby-acpTLqQbqdw_a9B34v0sl42H-Fvxxrqg139C56BnVMGNs5F1hDWhDAamPhIDXtZp/exec"; // PASTIKAN URL SUDAH BENAR

    if (!confirm(`Update SEMUA port di IP ${ip} ke VLAN ${vlan}?`)) return;

    btn.innerText = "Processing...";
    btn.disabled = true;

    // Kita gunakan format URLSearchParams agar Apps Script lebih mudah membacanya
    // atau tetap JSON tapi pastikan URL benar
    try {
        await fetch(scriptUrl, {
            method: "POST",
            mode: "no-cors", // Apps Script butuh no-cors untuk simple request
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ip: ip, vlan: vlan })
        });

        alert("Perintah Update Terkirim! Cek Google Sheet Anda dalam beberapa detik.");
        
        // Bersihkan Form
        document.getElementById('bulk-preview').classList.add('hidden');
        document.getElementById('bulk-ip').value = "";
        document.getElementById('bulk-vlan').value = "";
        
    } catch (error) {
        console.error("Error:", error);
        alert("Gagal mengirim data.");
    } finally {
        btn.innerText = "Update All";
        btn.disabled = false;
    }
}

function openTab(evt, tabName) {
    // Sembunyikan semua tab content
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    // Nonaktifkan semua tombol tab
    const tabButtons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    // Tampilkan tab yang diklik
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
    
    // Refresh icon Lucide jika diperlukan
    lucide.createIcons();
}

// --- Fungsi Attribute Processor (Vertikal ke Horizontal) ---

document.getElementById('btnProcessAttr').addEventListener('click', function() {
    const input = document.getElementById('inputAttr').value.trim();
    if (!input) return alert("Data kosong!");

    const lines = input.split(/\n/).map(line => line.trim()).filter(line => line !== "");
    const dataMap = {};
    const attributes = new Set();

    // Logika: Membaca 3 baris sekaligus (ID, Key, Value)
    for (let i = 0; i < lines.length; i += 3) {
        const id = lines[i];
        const key = lines[i + 1];
        const value = lines[i + 2];

        if (id && key && value) {
            if (!dataMap[id]) dataMap[id] = { "ID": id };
            dataMap[id][key] = value;
            attributes.add(key);
        }
    }

    renderAttrTable(dataMap, Array.from(attributes));
});

function renderAttrTable(dataMap, attrList) {
    const head = document.getElementById('attrHead');
    const body = document.getElementById('attrBody');
    const outputArea = document.getElementById('attrOutputArea');

    // Header: Tanpa kolom ID
    let headHTML = `<tr>`;
    attrList.forEach(attr => headHTML += `<th>${attr}</th>`);
    headHTML += `</tr>`;
    head.innerHTML = headHTML;

    // Body: Tanpa kolom ID
    let bodyHTML = "";
    Object.values(dataMap).forEach(row => {
        bodyHTML += `<tr>`;
        attrList.forEach(attr => {
            bodyHTML += `<td>${row[attr] || '-'}</td>`;
        });
        bodyHTML += `</tr>`;
    });
    body.innerHTML = bodyHTML;
    
    outputArea.classList.remove('hidden');
    lucide.createIcons();
}

// Fungsi Copy Table ke Clipboard (Agar bisa langsung paste ke Excel)
document.getElementById('btnCopyAttr').addEventListener('click', function() {
    const table = document.getElementById('attrResultTable');
    const range = document.createRange();
    range.selectNode(table);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    alert("Tabel berhasil disalin!");
});

document.getElementById('btnClearAttr').addEventListener('click', () => {
    document.getElementById('inputAttr').value = "";
    document.getElementById('attrOutputArea').classList.add('hidden');
});

init();