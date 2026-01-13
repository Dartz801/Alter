/**
 * KONFIGURASI & STATE
 */
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_LsggdPOwSms8SO0wuSEiMAIdyMjYlt0G9z71aZa2gy0ngATMJiakSa_a7cygOFa1WhCinsfHk3AQ/pub?gid=1252451747&single=true&output=csv";
let networkData = [];

/**
 * FUNGSI UTILITAS (LOGGING)
 */
function logStatus(message, isError = false) {
    console.log(isError ? "❌ ERROR: " : "ℹ️ LOG: ", message);
}

/**
 * 1. LOGIKA INVENTORY & SEARCH (Google Sheets)
 */
function initInventory() {
    logStatus("Memulai pengambilan data dari Google Sheets...");
    
    Papa.parse(sheetUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            networkData = results.data;
            if (networkData.length > 0) {
                logStatus("Data Berhasil Dimuat! Jumlah baris: " + networkData.length);
                logStatus("Kolom terdeteksi: " + Object.keys(networkData[0]).join(", "));
            } else {
                logStatus("Data kosong atau format salah.", true);
            }
        },
        error: function(error) {
            logStatus("Gagal memproses CSV: " + error.message, true);
        }
    });
}

const handleSearch = () => {
    const inputIP = document.getElementById("ip").value.trim();
    const inputSlot = document.getElementById("slot").value.trim();
    const inputPort = document.getElementById("port").value.trim();

    if (!inputIP || !inputSlot || !inputPort) {
        alert("Mohon isi semua field: IP, Slot, dan Port");
        return;
    }

    const filtered = networkData.filter((item) => {
        return (
            String(item.IP || "").trim() === inputIP && 
            String(item.SLOT || "").trim() === inputSlot && 
            String(item.PORT || "").trim() === inputPort
        );
    });

    renderInventoryTable(filtered);
};

const renderInventoryTable = (filteredData) => {
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
            <td data-label="IP">${item.IP || '-'}</td>
            <td data-label="SLOT">${item.SLOT || '-'}</td>
            <td data-label="PORT">${item.PORT || '-'}</td>
            <td data-label="VLAN">${item.VLAN || '-'}</td>
            <td data-label="ID_PORT">${item.ID_PORT || '-'}</td>
            <td data-label="GPON">${item.GPON || '-'}</td>
            <td data-label="VENDOR">${item.VENDOR || '-'}</td>
        `;
        tbody.appendChild(row);
    });
};

/**
 * 2. LOGIKA ALTER PROVISIONING (Table & CSV)
 */
window.addRow = function() {
    const tableBody = document.querySelector("#dataTable tbody");
    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td data-label="RESOURCE_ID"><input type="text" class="res-id" placeholder="ID"></td>
        <td data-label="SERVICE_NAME"><input type="text" class="ser-name" placeholder="Service"></td>
        <td data-label="TARGET_ID"><input type="text" class="tar-id" placeholder="Target"></td>
        <td data-label="CONFIG_ITEM">
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
    link.href = url;
    link.download = `Alter_Provisioning_${new Date().getTime()}.csv`;
    link.click();
};

/**
 * 3. LOGIKA SERVICE ID EXTRACTOR
 */
const handleExtract = () => {
    const input = document.getElementById('inputText').value;
    const outputList = document.getElementById('outputList');
    const resultArea = document.getElementById('resultArea');

    const keyword = "Service ID is ";
    let targetText = input.includes(keyword) ? input.split(keyword)[1] : input;

    const services = targetText.trim().split(',');
    outputList.innerHTML = ""; 

    const validServices = services.filter(item => item.trim() !== "");

    if (validServices.length > 0) {
        resultArea.classList.remove('hidden');
        validServices.forEach(item => {
            const div = document.createElement('div');
            div.className = 'service-card';
            div.textContent = item.trim();
            outputList.appendChild(div);
        });
    } else {
        alert("Mohon masukkan data yang valid.");
    }
};

/**
 * INISIALISASI EVENT LISTENERS
 */
document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi Data Sheet
    initInventory();

    // Event Listener Tombol Cari (Inventory)
    const searchBtn = document.getElementById("search-btn");
    if (searchBtn) searchBtn.addEventListener("click", handleSearch);

    // Event Listener Tombol Ekstrak (Service ID)
    const extractBtn = document.getElementById("btnExtract");
    if (extractBtn) extractBtn.addEventListener("click", handleExtract);
});