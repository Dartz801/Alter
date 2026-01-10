/**
 * Fungsi untuk menambah baris baru ke tabel
 */
function addRow() {
    const tableBody = document.querySelector("#dataTable tbody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td><input type="text" class="res-id" placeholder="ID..."></td>
        <td><input type="text" class="ser-name" placeholder="Nama Service..."></td>
        <td><input type="text" class="tar-id" placeholder="ID Target..."></td>
        <td>
            <select class="cfg-name">
                <option value="Service_Port">Service_Port</option>
                <option value="S-Vlan">S-Vlan</option>
                <option value="Subscriber_Terminal_Port">Subscriber_Terminal_Port</option>
                <option value="Service_Trail">Service_Trail</option>
            </select>
        </td>
        <td><button class="btn-remove" onclick="removeRow(this)">✕</button></td>
    `;
    
    tableBody.appendChild(newRow);
}

/**
 * Fungsi untuk menghapus baris tertentu
 */
function removeRow(btn) {
    const row = btn.closest("tr");
    const tbody = document.querySelector("#dataTable tbody");
    
    if (tbody.rows.length > 1) {
        row.remove();
    } else {
        alert("Gagal menghapus. Harus ada minimal satu baris input.");
    }
}

/**
 * Fungsi untuk mengkonversi data tabel ke format CSV dan mendownloadnya
 */
function downloadCSV() {
    const rows = document.querySelectorAll("#dataTable tr");
    let csvContent = "";

    rows.forEach((row, rowIndex) => {
        let rowData = [];
        const cols = row.querySelectorAll("th, td");

        // Loop setiap kolom kecuali kolom terakhir (kolom Aksi)
        for (let i = 0; i < cols.length - 1; i++) {
            let cellValue = "";

            if (rowIndex === 0) {
                // Ambil teks dari header (thead)
                cellValue = cols[i].innerText;
            } else {
                // Ambil value dari input atau select (tbody)
                const inputElement = cols[i].querySelector("input, select");
                cellValue = inputElement ? inputElement.value : "";
            }

            // Bersihkan data dari tanda kutip ganda dan bungkus dengan kutip untuk format CSV aman
            cellValue = cellValue.replace(/"/g, '""');
            rowData.push(`"${cellValue}"`);
        }
        
        csvContent += rowData.join(",") + "\n";
    });

    // Proses pembuatan file dan download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    link.setAttribute("href", url);
    link.setAttribute("download", `Alter Service Config Item.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}