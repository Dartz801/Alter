const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LsggdPOwSms8SO0wuSEiMAIdyMjYlt0G9z71aZa2gy0ngATMJiakSa_a7cygOFa1WhCinsfHk3AQ/pub?gid=1252451747&single=true&output=csv";

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
            <td>${item.VLAN || '-'}</td>
            <td>${item.ID_PORT || '-'}</td>
            <td>${item.GPON || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function autoFillAlterProv(item) {
    const tbody = document.querySelector("#dataTable tbody");
    
    // Cek jika baris pertama kosong, hapus dulu agar rapi
    if (tbody.rows.length === 1 && tbody.rows[0].querySelector(".res-id").value === "") {
        tbody.innerHTML = "";
    }

    const mappings = [
        { id: item.VLAN, config: "S-Vlan" },
        { id: item.ID_PORT, config: "Service_Port" }
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
    const outputList = document.getElementById('outputList');
    const services = input.includes("Service ID is ") ? input.split("Service ID is ")[1].trim().split(',') : input.trim().split(',');
    
    outputList.innerHTML = "";
    if (services[0] !== "") {
        document.getElementById('resultArea').classList.remove('hidden');
        services.forEach(item => {
            const div = document.createElement('div');
            div.className = 'service-card';
            div.innerHTML = `<span>${item.trim()}</span><button class="copy-btn" onclick="copyText('${item.trim()}')"><i data-lucide="copy"></i></button>`;
            outputList.appendChild(div);
        });
        lucide.createIcons();
    }
});

window.copyText = function(text) {
    navigator.clipboard.writeText(text).then(() => alert("Copied!"));
};

const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.toggleAttribute('data-theme', !isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
    lucide.createIcons();
});

init();