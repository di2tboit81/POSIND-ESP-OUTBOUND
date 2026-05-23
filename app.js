// ===== TAMBAHAN UNTUK TAMPILKAN DATA TERAKHIR (SCAN & MANUAL) =====
(function(){

// Simpan fungsi asli
const originalProses = prosesBarcode;

// Override tanpa mengubah isi lama
prosesBarcode = function(barcode){

// Panggil fungsi lama dulu
originalProses(barcode);

// Jika berhasil masuk ke array, tampilkan sebagai data terakhir
if(scannedBarcodes.includes(barcode)){
document.getElementById("lastScan").innerHTML =
"✅ Data Terakhir : <span style='color:#FF6A00'>" + barcode + "</span>";
}

};

})();

function updateScanCounter(){
document.getElementById("scanCounter").innerText =
"Sukses Scan Kantong Ke : " + scannedBarcodes.length;
}

function updateTotalBerat(){
let total = scannedData.reduce((sum,item)=> sum + item.berat,0);

document.getElementById("totalBerat").innerText =
total.toLocaleString("id-ID",{
minimumFractionDigits:2,
maximumFractionDigits:2
});
}

let scannedBarcodes=[];
let scannedData=[]; // simpan barcode + berat
let dataBC = [];

 // ===== AUTO SAVE LOCAL STORAGE =====
function simpanLocal(){
localStorage.setItem("r7_scannedBarcodes", JSON.stringify(scannedBarcodes));
localStorage.setItem("r7_scannedData", JSON.stringify(scannedData));
}

function loadLocal(){

let savedBarcodes = localStorage.getItem("r7_scannedBarcodes");
let savedData = localStorage.getItem("r7_scannedData");

if(savedBarcodes && savedData){

scannedBarcodes = JSON.parse(savedBarcodes);
scannedData = JSON.parse(savedData);

// Render ulang tabel
scannedData.forEach((item,index)=>{
tambahData(item.barcode,item.berat);
});

updateScanCounter();
updateTotalBerat();
}
}

function updateTanggalJam(){
let now = new Date();

let options = {
day: '2-digit',
month: 'long',
year: 'numeric'
};

let tanggal = now.toLocaleDateString("id-ID", options);
let jam = now.toLocaleTimeString("id-ID");

document.getElementById("tanggal").value = tanggal + " - " + jam;
}

setInterval(updateTanggalJam,1000);
updateTanggalJam();

function beep(url){
new Audio(url).play();
}

function showNotif(text,type,duration=2000){

let n = document.getElementById("notif");

n.innerText = text;
n.className = type;

// reset timeout lama
clearTimeout(n.hideTimeout);

// simpan timeout baru
n.hideTimeout = setTimeout(()=>{

n.innerText = "";

}, duration);

}

function prosesBarcode(barcode){

barcode = String(barcode).trim().toUpperCase();

// =============================
// CEK DATA BC DULU
// =============================

// Bersihkan barcode hasil scan
barcode = String(barcode)
.trim()
.replace(/\s+/g,'')
.toUpperCase();

const ditemukanBC = dataBC.find(item => {

return String(item.barcode)
.trim()
.replace(/\s+/g,'')
.toUpperCase() === barcode;

});

// Jika ditemukan
if(ditemukanBC){

console.log("KETEMU BC :", barcode);

errorBCAnimation();

showNotif(
"⛔ SATU KANTONG DITOLAK OLEH BC\n" +
(ditemukanBC.keterangan2 || ""),
"error",
5000
);

return;

}

// =============================
// CEK DUPLIKAT SCAN
// =============================
if(scannedBarcodes.includes(barcode)){

beep("https://actions.google.com/sounds/v1/alarms/winding_alarm_clock.ogg");

showNotif("❌ Kantong sudah ada!","error");

return;
}

let petugas=document.getElementById("petugas").value;
let driver=document.getElementById("driver").value;
let nopol=document.getElementById("nopol").value;
let angkutan=document.getElementById("angkutan").value;
let mode=document.getElementById("mode").value;
let nosurat=document.getElementById("nosurat").value;

if(!petugas||!driver||!nopol||!angkutan||!mode){

alert("Oiii KIMBEK...Lengkapi Data Driver Dulu!");

return;

}

// 🔊 BEEP BERHASIL
beep("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

// INPUT BERAT
bukaInputBerat(barcode);

}

function onScanSuccess(decodedText){

prosesBarcode(decodedText);

// Pause sebentar agar tidak double scan
scanner.clear();

setTimeout(()=>{

scanner.render(onScanSuccess);

// 🔦 Nyalakan ulang torch setelah render ulang
setTimeout(()=>{
aktifkanTorchUlang();
},800);

},1000);
}

let scanner = new Html5QrcodeScanner("reader",{fps:10,qrbox:250});
scanner.render(onScanSuccess);

// ===== AUTO FLASH (TORCH) SAAT SCAN DI HP =====
let currentCameraTrack = null;

async function aktifkanTorchUlang(){

try{

const video = document.querySelector("#reader video");

if(video && video.srcObject){

const stream = video.srcObject;
const track = stream.getVideoTracks()[0];

currentCameraTrack = track;

const capabilities = track.getCapabilities();

if(capabilities.torch){

await track.applyConstraints({
advanced: [{ torch: true }]
});

console.log("Flash ON 🔦 (ulang)");
}

}

}catch(err){

console.log("Torch gagal diaktifkan ulang");

}

}

// Ambil kamera setelah scanner aktif
setTimeout(async () => {

try {

const video = document.querySelector("#reader video");

if (video && video.srcObject) {

const stream = video.srcObject;
const track = stream.getVideoTracks()[0];

currentCameraTrack = track;

const capabilities = track.getCapabilities();

if (capabilities.torch) {

await track.applyConstraints({
advanced: [{ torch: true }]
});

console.log("Flash ON 🔦");

}

}

} catch (err) {

console.log("Flash tidak didukung di perangkat ini");

}

}, 1500);

function tambahManual(){

let input=document.getElementById("manualBarcode");
let barcode=input.value.trim();

if(barcode===""){
showNotif("❌ Data Kantong Kosong!","error");
return;
}

prosesBarcode(barcode);

input.value="";
}

document.getElementById("manualBarcode")
.addEventListener("keypress",function(e){

if(e.key==="Enter"){
tambahManual();
}

});

function tambahData(barcode,berat){

let table=document.getElementById("tabelData");

let row=table.insertRow();

row.insertCell(0).innerHTML = table.rows.length - 1;
row.insertCell(1).innerHTML = barcode;
row.insertCell(2).innerHTML = berat.toFixed(2);

row.insertCell(3).innerHTML =
`<button class="btn-danger" onclick="hapusBaris(this,'${barcode}')">X</button>`;

}

function hapusBaris(btn,barcode){

// 🔥 HAPUS DARI FIREBASE (INI YANG KURANG)
roomDataRef.child(barcode).remove();



// Hapus dari array lokal
scannedBarcodes = scannedBarcodes.filter(b=>b!==barcode);
scannedData = scannedData.filter(d=>d.barcode!==barcode);

simpanLocal();

updateNomor();
updateScanCounter();
updateTotalBerat();
}

function updateNomor(){

let rows=document.querySelectorAll("#tabelData tr");

for(let i=1;i<rows.length;i++){
rows[i].cells[0].innerText=i;
}

}


["petugas","driver","nopol","angkutan","mode","nosurat","tujuan"].forEach(id=>{

document.getElementById(id).addEventListener("input", ()=>{

simpanFormR7();
kirimFormKeFirebase();

});

});

function hapusSemuaAsli(){

roomRef.remove(); // Hapus semua data di room Firebase

scannedData = [];
scannedBarcodes = [];

document.getElementById("tabelData").innerHTML =
`<tr>
<th>No</th>
<th>Kantong</th>
<th>Berat (KG)</th>
<th>Hapus</th>
</tr>`;

updateScanCounter();
updateTotalBerat();

}

const canvas=document.getElementById("signature");
const ctx=canvas.getContext("2d");

let drawing=false;

canvas.onmousedown=()=>drawing=true;
canvas.onmouseup=()=>drawing=false;

canvas.onmousemove=(e)=>{

if(!drawing) return;

ctx.lineWidth=2;
ctx.lineCap="round";
ctx.strokeStyle="black";

ctx.lineTo(e.offsetX,e.offsetY);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(e.offsetX,e.offsetY);

localStorage.removeItem("r7_scannedBarcodes");
localStorage.removeItem("r7_scannedData");

};

function clearSignature(){
ctx.clearRect(0,0,canvas.width,canvas.height);
}

function generateNomorDokumen(){

let d=new Date();

return "STK-ESP-POSIND/"+d.getFullYear()+
("0"+(d.getMonth()+1)).slice(-2)+
("0"+d.getDate()).slice(-2)+
"/"+Math.floor(Math.random()*1000);

}

                                                                                    /* PRINT PDF SUPER PADAT PREMIUM - FONT PALING BESAR TANPA TAMBAH HALAMAN */
function printPDF(){

if(scannedBarcodes.length===0){
alert("Belum Ada Data Kantong KIMBEK !");
return;
}

let tanggal=document.getElementById("tanggal").value;
let petugas=document.getElementById("petugas").value;
let driver=document.getElementById("driver").value;
let nopol=document.getElementById("nopol").value;
let angkutan=document.getElementById("angkutan").value;
let mode=document.getElementById("mode").value;
let nosurat=document.getElementById("nosurat").value;
let tujuan=document.getElementById("tujuan").value;
let nomor=generateNomorDokumen();
let signatureImage=canvas.toDataURL("image/png");

let qrData = `
R7 ( BUKTI SERAH KIRIM ) POSIND ➜ ESP

Nomor Dokumen : ${nomor}
Tanggal       : ${tanggal}
Nama Driver   : ${driver}
No Polisi     : ${nopol}
Angkutan      : ${angkutan}
Mode          : ${mode}
No Surat Permohonan Retur : ${nosurat}
Total Kantong : ${scannedBarcodes.length}
`;

QRCode.toDataURL(qrData,function(err,url){

let now = new Date();

let fileTime =
("0"+now.getDate()).slice(-2) +
("0"+(now.getMonth()+1)).slice(-2) +
now.getFullYear() + "_" +
("0"+now.getHours()).slice(-2) +
("0"+now.getMinutes()).slice(-2) +
("0"+now.getSeconds()).slice(-2);

let win=window.open("","","width=900,height=1200");

win.document.write(`
<html>
<head>
<title>SERAH_TERIMA_R7_${fileTime}</title>

<style>

@page{
size:A4 portrait;
margin:1mm 5mm;
}

body{
font-family:Arial;
margin:0;
padding:0 5mm;
box-sizing:border-box;
}

.page{
page-break-after:always;
}

.page:last-child{
page-break-after:auto;
}

.judul{
text-align:center;
font-size:16px;
font-weight:bold;
margin-top:5px;
margin-bottom:5px;
}

.info{
margin-top:4px;
font-size:11px;
line-height:1.3;
}

.flex-table{
display:flex;
gap:5px;
margin-top:5px;
}

table{
width:50%;
border-collapse:collapse;
font-size:11px;
}

th{
background:#000;
color:#fff;
font-size:11px;
}

th, td{
border:1px solid black;
padding:2px;
text-align:center;
}

.footer{
margin-top:10px;
display:flex;
justify-content:space-between;
align-items:flex-end;
}

.box-ttd{
width:30%;
text-align:center;
font-size:11px;
}

</style>

</head>

<body>
`);

let perColumn = 40;
let perPage = 80;

let totalPages = Math.ceil(scannedBarcodes.length / perPage);

for(let p=0; p<totalPages; p++){

let start = p * perPage;
let end = start + perPage;

let pageData = scannedBarcodes.slice(start, end);

let leftData = pageData.slice(0, perColumn);
let rightData = pageData.slice(perColumn, perPage);

let leftTable = `
<table>
<tr>
<th style="width:10%">No</th>
<th style="width:40%">NO KANTONG</th>
<th style="width:25%">PRODUK</th>
<th style="width:25%">BERAT (KG)</th>
</tr>
`;

leftData.forEach((barcode,index)=>{

let data = scannedData.find(d => d.barcode === barcode);

leftTable += `
<tr>
<td>${start + index + 1}</td>
<td>${barcode}</td>
<td>ECO</td>
<td>${data ? data.berat.toLocaleString("id-ID",{minimumFractionDigits:2,maximumFractionDigits:2}) : "0.00"}</td>
</tr>
`;

});

// Isi kosong sampai 40 baris
for(let i=leftData.length;i<perColumn;i++){
leftTable += `<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>`;
}

leftTable += `</table>`;

let rightTable = `
<table>
<tr>
<th style="width:10%">No</th>
<th style="width:40%">NO KANTONG</th>
<th style="width:25%">PRODUK</th>
<th style="width:25%">BERAT (KG)</th>
</tr>
`;

rightData.forEach((barcode,index)=>{

let data = scannedData.find(d => d.barcode === barcode);

rightTable += `
<tr>
<td>${start + perColumn + index + 1}</td>
<td>${barcode}</td>
<td>ECO</td>
<td>${data ? data.berat.toLocaleString("id-ID",{minimumFractionDigits:2,maximumFractionDigits:2}) : "0.00"}</td>
</tr>
`;

});

// Isi kosong sampai 40 baris
for(let i=rightData.length;i<perColumn;i++){
rightTable += `<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>`;
}

rightTable += `</table>`;

win.document.write(`
<div class="page">

<!-- LOGO POJOK KIRI PALING UJUNG -->
<img src="Logo PosIND.png"
style="
position:absolute;
top:5mm;
left:5mm;
width:60px;
height:auto;
">

<div class="judul">
DAFTAR LAMPIRAN R7
</div>

<div class="judul">
Dari KCU BATAM 29400 Tujuan ${tujuan}
</div>

${p===0 ? `

<div class="info" style="font-size:12px;margin-top:5px;">

<br><br><br>

<div style="display:flex;">
<div style="width:130px;"><strong>NAMA DRIVER</strong></div>
<div style="width:15px;">:</div>
<div>${driver}</div>
</div>

                                                                                                                                          <div style="display:flex;">
<div style="width:130px;"><strong>NO POLISI</strong></div>
<div style="width:15px;">:</div>
<div>${nopol}</div>
</div>

<div style="display:flex;">
<div style="width:130px;"><strong>ANGKUTAN</strong></div>
<div style="width:15px;">:</div>
<div>${angkutan}</div>
</div>

<div style="display:flex;">
<div style="width:130px;"><strong>MODE</strong></div>
<div style="width:15px;">:</div>
<div>${mode}</div>
</div>

<div style="display:flex;">
<div style="width:130px;"><strong>TANGGAL</strong></div>
<div style="width:15px;">:</div>
<div>${tanggal}</div>
</div>

<div style="display:flex;">
<div style="width:130px;"><strong>NO.SP - RETUR</strong></div>
<div style="width:15px;">:</div>
<div>${nosurat}</div>
</div>

</div>
` : ``}

<div class="flex-table">
${leftTable}
${rightTable}
</div>

${p === totalPages-1 ? `
<div style="margin-top:15px;width:100%;">
<table style="width:100%;border-collapse:collapse;font-size:14px;">
<tr>
<th style="border:1px solid black;">TOTAL KANTONG</th>
<th style="border:1px solid black;">PRODUK</th>
<th style="border:1px solid black;">TOTAL BERAT (KG)</th>
</tr>

<tr>
<td style="border:1px solid black;text-align:center;font-weight:900;color:#000;">
${scannedBarcodes.length.toLocaleString("id-ID")}
</td>

<td style="border:1px solid black;text-align:center;font-weight:bold;">
E-COMMERCE
</td>

<td style="border:1px solid black;text-align:center;font-weight:900;color:#000;">
${scannedData
.reduce((s,d)=>s+d.berat,0)
.toLocaleString("id-ID",{
minimumFractionDigits:2,
maximumFractionDigits:2
})}
</td>
</tr>
</table>
</div>

<div class="footer">
<div class="box-ttd">
KANTOR ASAL<br>
<img src="${signatureImage}" width="110"><br><br>
${petugas}
</div>

<div class="box-ttd">
ANGKUTAN<br><br><br><br><br>
<br><br>
</div>

<div class="box-ttd">
KANTOR TUJUAN<br><br><br><br><br>
<br><br>
</div>

<div class="box-ttd">
QR<br>
<img src="${url}" width="95">
</div>
</div>
` : ``}

</div>
`);
}

win.document.write(`</body></html>`);
win.document.close();
win.print();

});
}

function exportExcel(){

if(scannedBarcodes.length===0){
alert("Belum Ada Data Kantong KIMBEK !");
return;
}

let tanggal=document.getElementById("tanggal").value;
let petugas=document.getElementById("petugas").value;
let driver=document.getElementById("driver").value;
let nopol=document.getElementById("nopol").value;
let angkutan=document.getElementById("angkutan").value;
let mode=document.getElementById("mode").value;
let nosurat=document.getElementById("nosurat").value;
let tujuan=document.getElementById("tujuan").value;

let wb = XLSX.utils.book_new();

let ws = {};
let merges = [];

function cell(r,c,v="",bold=false,bg=false){

ws[XLSX.utils.encode_cell({r:r-1,c:c-1})] = {
v:v,
t:"s",
s:{
font:{
bold:bold,
name:"Arial",
sz:10
},
alignment:{
horizontal:"center",
vertical:"center",
wrapText:true
},
fill:bg ? {
fgColor:{rgb:"4F81BD"}
} : undefined,
font:bg ? {
bold:true,
color:{rgb:"FFFFFF"},
name:"Arial",
sz:10
} : {
bold:bold,
name:"Arial",
sz:10
},
border:{
top:{style:"thin"},
bottom:{style:"thin"},
left:{style:"thin"},
right:{style:"thin"}
}
}
};

}

let row = 1;

// ================= JUDUL =================

cell(row,1,"DAFTAR LAMPIRAN R7",true);

ws["A1"].s = {
font:{
bold:true,
sz:16,
name:"Arial"
},
alignment:{
horizontal:"center",
vertical:"center"
}
};

merges.push({
s:{r:0,c:0},
e:{r:0,c:3}
});

row++;

cell(
row,
1,
"Dari KCU BATAM 29400 Tujuan " + tujuan,
true
);

ws["A2"].s = {
font:{
bold:true,
sz:13,
name:"Arial"
},
alignment:{
horizontal:"center",
vertical:"center"
}
};

merges.push({
s:{r:1,c:0},
e:{r:1,c:3}
});

row += 2;

// ================= INFO =================

const info = [
["Nama Driver",driver],
["No Polisi",nopol],
["Angkutan",angkutan],
["Mode",mode],
["No Surat Permohonan Retur",nosurat],
["Tanggal",tanggal]
];

info.forEach(i=>{

cell(row,1,i[0],true);
cell(row,2,":",true);
cell(row,3,i[1],true);

ws[XLSX.utils.encode_cell({r:row-1,c:0})].s = {
font:{
bold:true,
name:"Arial",
sz:12
},
alignment:{
horizontal:"left",
vertical:"center"
}
};

ws[XLSX.utils.encode_cell({r:row-1,c:1})].s = {
font:{
bold:true,
name:"Arial",
sz:12
},
alignment:{
horizontal:"center",
vertical:"center"
}
};

ws[XLSX.utils.encode_cell({r:row-1,c:2})].s = {
font:{
bold:true,
name:"Arial",
sz:12
},
alignment:{
horizontal:"left",
vertical:"center"
}
};

merges.push({
s:{r:row-1,c:2},
e:{r:row-1,c:3}
});

row++;

});

row += 1;

// ================= HEADER TABEL =================

cell(row,1,"No",true,true);
cell(row,2,"NO KANTONG",true,true);
cell(row,3,"PRODUK",true,true);
cell(row,4,"BERAT (KG)",true,true);

row++;

// ================= DATA =================

for(let i=0; i<scannedBarcodes.length; i++){

let barcode = scannedBarcodes[i];

let data = scannedData.find(d=>d.barcode===barcode);

cell(row,1,String(i+1));

cell(row,2,barcode);

cell(row,3,"ECO");

cell(
row,
4,
data
? data.berat.toLocaleString("id-ID",{
minimumFractionDigits:2,
maximumFractionDigits:2
})
: "0.00"
);

row++;

}

// ================= TOTAL =================

row += 2;

cell(row,1,"TOTAL KANTONG",true,true);
cell(row,2,
scannedBarcodes.length.toLocaleString("id-ID"),
true
);

row++;

cell(row,1,"PRODUK",true,true);
cell(row,2,"E-COMMERCE",true);

row++;

cell(row,1,"TOTAL BERAT (KG)",true,true);
cell(
row,
2,
scannedData
.reduce((s,d)=>s+d.berat,0)
.toLocaleString("id-ID",{
minimumFractionDigits:2,
maximumFractionDigits:2
}),
true
);

row += 4;

// ================= TTD =================

cell(row,1,"KANTOR ASAL",true);
cell(row,3,"QR",true);

row += 5;

cell(row,1,petugas);
cell(row,3,"Lihat QR di PDF");

// ================= LEBAR KOLOM =================

ws["!cols"] = [

{wch:8},
{wch:35},
{wch:15},
{wch:18}

];

ws["!merges"] = merges;

ws["!ref"] = "A1:D"+row;

XLSX.utils.book_append_sheet(
wb,
ws,
"DATA_R7"
);

// ================= SAVE FILE =================

let now = new Date();

let fileTime =
("0"+now.getDate()).slice(-2) +
("0"+(now.getMonth()+1)).slice(-2) +
now.getFullYear() + "_" +
("0"+now.getHours()).slice(-2) +
("0"+now.getMinutes()).slice(-2) +
("0"+now.getSeconds()).slice(-2);

XLSX.writeFile(
wb,
"Serah_Terima_R7_" + fileTime + ".xlsx"
);

}

// LOAD DATA SAAT PAGE DIBUKA
window.onload = function(){

// load form saja
loadFormR7();

// data scan FULL dari firebase realtime
// jadi tidak perlu loadLocal lagi

};

                                                                                                                                                                                  // =============================
// AUTO SAVE FORM R7 (TIDAK HILANG SAAT RELOAD)
// =============================

// Simpan data form
function simpanFormR7(){

const formData = {

tanggal: document.getElementById("tanggal").value,
petugas: document.getElementById("petugas").value,
driver: document.getElementById("driver").value,
nopol: document.getElementById("nopol").value,
angkutan: document.getElementById("angkutan").value,
mode: document.getElementById("mode").value,
nosurat: document.getElementById("nosurat").value,
tujuan: document.getElementById("tujuan").value

};

localStorage.setItem("r7_formData", JSON.stringify(formData));

}

// Load kembali data form
function loadFormR7(){

const saved = localStorage.getItem("r7_formData");

if(saved){

const data = JSON.parse(saved);

document.getElementById("tanggal").value = data.tanggal || "";
document.getElementById("petugas").value = data.petugas || "";
document.getElementById("driver").value = data.driver || "";
document.getElementById("nopol").value = data.nopol || "";
document.getElementById("angkutan").value = data.angkutan || "";
document.getElementById("mode").value = data.mode || "";
document.getElementById("nosurat").value = data.nosurat || "";
document.getElementById("tujuan").value = data.tujuan || "";

}

}

// Event listener auto save saat diketik
["petugas","driver","nopol","angkutan","mode","nosurat","tujuan"].forEach(id=>{

document.getElementById(id).addEventListener("input", simpanFormR7);

});

// Simpan juga tanggal tiap update
setInterval(simpanFormR7, 1000);

// Load saat halaman dibuka
window.addEventListener("load", function(){

loadFormR7();

});

// =============================
// OVERRIDE HAPUS SEMUA + RESET FORM
// =============================

(function(){

const hapusAsli = hapusSemua;

hapusSemua = function(){

// Jalankan fungsi hapus asli
hapusAsli();

// Hapus data form dari localStorage
localStorage.removeItem("r7_formData");

// Reset semua field form
document.getElementById("petugas").value = "";
document.getElementById("driver").value = "";
document.getElementById("nopol").value = "";
document.getElementById("angkutan").value = "";
document.getElementById("mode").value = "";

// Update ulang tanggal otomatis
updateTanggalJam();

// Fokus kembali ke input petugas
document.getElementById("petugas").focus();

console.log("Semua data + form berhasil direset");

};

})();

// ======================================
// OVERRIDE HAPUS SEMUA + KONFIRMASI
// ======================================

(function(){

const hapusAsli = hapusSemua;

hapusSemua = function(){

// Popup konfirmasi
let yakin = confirm(
"⚠️ YAKIN MAU HAPUS SEMUA DATA?\n\n" +
"Semua data kantong, berat, dan form akan direset dari awal!"
);

if(!yakin){
return;
}

// Jalankan fungsi hapus asli (hapus tabel & scan)
hapusAsli();

// Hapus data form dari localStorage
localStorage.removeItem("r7_formData");

// Reset field form
document.getElementById("petugas").value = "";
document.getElementById("driver").value = "";
document.getElementById("nopol").value = "";
document.getElementById("angkutan").value = "";
document.getElementById("mode").value = "";

// Reset tanda tangan juga
if(typeof clearSignature === "function"){

clearSignature();

}

// Update tanggal otomatis
updateTanggalJam();

// Fokus kembali
document.getElementById("petugas").focus();

alert("✅ Semua data berhasil dihapus dan direset.");

};

})();

// =============================
// REALTIME SYNC VERSI STABIL
// =============================

// FORMAT ROOM SELALU SAMA (YYYYMMDD)
function getRoomId(){

const today = new Date();

return "R7_" +
today.getFullYear() +
("0"+(today.getMonth()+1)).slice(-2) +
("0"+today.getDate()).slice(-2);

}

// ROOT ROOM
const roomRoot = db.ref("R7_SYNC/" + getRoomId());

const roomDataRef = roomRoot.child("DATA");
const roomFormRef = roomRoot.child("FORM");

// =============================
// KIRIM DATA BARCODE
// =============================
function kirimKeFirebase(barcode, berat){

roomDataRef.child(barcode).set({

barcode: barcode,
berat: berat,
timestamp: Date.now()

});

}

// =============================
// REALTIME SYNC SUPER STABIL
// =============================

roomDataRef.on("value", snapshot => {

const data = snapshot.val();

// RESET ARRAY
scannedBarcodes = [];
scannedData = [];

// RESET TABEL
document.getElementById("tabelData").innerHTML =
`<tr>
<th>No</th>
<th>Kantong</th>
<th>Berat (KG)</th>
<th>Hapus</th>
</tr>`;

// JIKA FIREBASE KOSONG
if(!data){

updateScanCounter();
updateTotalBerat();

localStorage.removeItem("r7_scannedBarcodes");
localStorage.removeItem("r7_scannedData");

console.log("DATA KOSONG");

return;

}

// AMBIL SEMUA DATA FIREBASE
Object.values(data).forEach((item,index)=>{

scannedBarcodes.push(item.barcode);

scannedData.push({
barcode:item.barcode,
berat:parseFloat(item.berat || 0)
});

// TAMPILKAN KE TABEL
tambahData(
item.barcode,
parseFloat(item.berat || 0)
);

});

// UPDATE TOTAL
updateScanCounter();
updateTotalBerat();

// SIMPAN LOCAL
simpanLocal();

console.log("SYNC DEVICE BERHASIL");

});
                                                                                                                                                                            // =============================
// =============================
// SYNC FORM REALTIME
// =============================
function kirimFormKeFirebase(){

const formData = {

petugas: document.getElementById("petugas").value,
driver: document.getElementById("driver").value,
nopol: document.getElementById("nopol").value,
angkutan: document.getElementById("angkutan").value,
mode: document.getElementById("mode").value,
nosurat: document.getElementById("nosurat").value

};

roomFormRef.set(formData);

}

// AUTO KIRIM SAAT DIKETIK
["petugas","driver","nopol","angkutan","mode","nosurat","tujuan"].forEach(id=>{

document.getElementById(id).addEventListener("input", ()=>{

kirimFormKeFirebase();

});

});

// TERIMA UPDATE FORM DARI DEVICE LAIN
roomFormRef.on("value", snapshot => {

const data = snapshot.val();

if(!data) return;

document.getElementById("petugas").value = data.petugas || "";
document.getElementById("driver").value = data.driver || "";
document.getElementById("nopol").value = data.nopol || "";
document.getElementById("angkutan").value = data.angkutan || "";
document.getElementById("mode").value = data.mode || "";
document.getElementById("nosurat").value = data.nosurat || "";

});

// =============================
// HAPUS SEMUA (VERSI STABIL)
// =============================
function hapusSemua(){

let yakin = confirm(
"⚠️ YAKIN MAU HAPUS SEMUA DATA?\n\n" +
"Semua data kantong dan form akan direset!"
);

if(!yakin) return;

// Hapus dari Firebase
roomDataRef.remove();
roomFormRef.remove();

// Reset lokal
scannedBarcodes = [];
scannedData = [];

document.getElementById("tabelData").innerHTML =
`<tr>
<th>No</th>
<th>Kantong</th>
<th>Berat (KG)</th>
<th>Hapus</th>
</tr>`;

updateScanCounter();
updateTotalBerat();

localStorage.removeItem("r7_scannedBarcodes");
localStorage.removeItem("r7_scannedData");
localStorage.removeItem("r7_formData");

document.getElementById("petugas").value = "";
document.getElementById("driver").value = "";
document.getElementById("nopol").value = "";
document.getElementById("angkutan").value = "";
document.getElementById("mode").value = "";

if(typeof clearSignature === "function"){

clearSignature();

}

alert("✅ Semua data berhasil direset.");

}

// ================= INPUT BERAT MODAL =================

let barcodePending = null;

function bukaInputBerat(barcode){

barcodePending = barcode;

document.getElementById("barcodeBerat").innerHTML =
"Kantong : <b style='color:#FF6A00'>" + barcode + "</b>";

document.getElementById("boxBerat").style.display = "flex";

// reset input dan fokus
const input = document.getElementById("inputBeratKg");

input.value = "";

setTimeout(()=>{

input.focus();

},200);

}

function batalBerat(){

barcodePending = null;

document.getElementById("boxBerat").style.display = "none";

}

function simpanBerat(){

let input = document.getElementById("inputBeratKg");

let berat = input.value;

if(!barcodePending){

showNotif("❌ Barcode tidak ditemukan!","error");
return;

}

if(berat === "" || isNaN(berat)){

showNotif("❌ Berat tidak valid!","error");
return;

}

berat = parseFloat(berat);

document.getElementById("boxBerat").style.display = "none";

lanjutProsesBarcode(barcodePending, berat);

barcodePending = null;

}

function lanjutProsesBarcode(barcode, berat){

// Simpan data
scannedBarcodes.push(barcode);

scannedData.push({
barcode:barcode,
berat:berat
});

simpanLocal();

// Tambah ke tabel
tambahData(barcode,berat);

// 🔥 KIRIM KE FIREBASE DI SINI
kirimKeFirebase(barcode, berat);

// Update counter
updateScanCounter();
updateTotalBerat();

// Reset input
let input = document.getElementById("manualBarcode");

input.value = "";
input.focus();

showNotif("✅ Berhasil ditambahkan","success");

}

// ENTER otomatis simpan berat (lebih stabil)
document.addEventListener("keydown", function(e){

// cek apakah box input berat sedang terbuka
let box = document.getElementById("boxBerat");

if(box.style.display === "flex" && e.key === "Enter"){

e.preventDefault();
simpanBerat();

}

});

// ================= KONFIRMASI HAPUS BARIS =================

let barcodeDelete = null;
let tombolDelete = null;

function hapusBaris(btn,barcode){

barcodeDelete = barcode;
tombolDelete = btn;

document.getElementById("confirmText").innerHTML =
"Yakin ingin menghapus kantong:<br><b style='color:#FF6A00'>" + barcode + "</b>?";

document.getElementById("confirmDeleteBox").style.display = "flex";

}

function batalHapus(){

barcodeDelete = null;
tombolDelete = null;

document.getElementById("confirmDeleteBox").style.display = "none";

}

                                                                                                                                                                                     <!-- ================= KONFIRMASI HAPUS SEMUA ================= -->

function bukaHapusSemua(){

document.getElementById("confirmHapusSemuaBox").style.display = "flex";

}

function batalHapusSemua(){

document.getElementById("confirmHapusSemuaBox").style.display = "none";

}

function lanjutHapusSemua(){

document.getElementById(
"confirmHapusSemuaBox"
).style.display = "none";

// HAPUS FIREBASE
roomDataRef.remove();
roomFormRef.remove();
roomBCRef.remove();

// HAPUS LOCAL
localStorage.removeItem("r7_scannedBarcodes");
localStorage.removeItem("r7_scannedData");
localStorage.removeItem("r7_formData");

// RESET ARRAY
scannedBarcodes = [];
scannedData = [];
dataBC = [];
tempDataBC = [];

// RESET FORM
document.getElementById("petugas").value = "";
document.getElementById("driver").value = "";
document.getElementById("nopol").value = "";
document.getElementById("angkutan").value = "";
document.getElementById("mode").value = "";
document.getElementById("nosurat").value = "";
document.getElementById("tujuan").value = "";

// RESET SIGNATURE
if(typeof clearSignature === "function"){
clearSignature();
}

// RESET INFO BC
document.getElementById("infoBC").innerHTML =
"❌ Belum ada DATA BC";

// RESET TABEL
document.getElementById("tabelData").innerHTML =
`<tr>
<th>No</th>
<th>Kantong</th>
<th>Berat (KG)</th>
<th>Hapus</th>
</tr>`;

updateScanCounter();
updateTotalBerat();

showNotif(
"✅ Semua data berhasil dihapus",
"success"
);

}

/* ===== ANTI INSPECT ===== */

document.addEventListener("contextmenu", function(e){

e.preventDefault();

});

document.onkeydown = function(e){

// F12
if(e.keyCode == 123){
return false;
}

// CTRL + SHIFT + I
if(e.ctrlKey && e.shiftKey && e.keyCode == 73){
return false;
}

// CTRL + SHIFT + J
if(e.ctrlKey && e.shiftKey && e.keyCode == 74){
return false;
}

// CTRL + U
if(e.ctrlKey && e.keyCode == 85){
return false;
}

// CTRL + SHIFT + C
if(e.ctrlKey && e.shiftKey && e.keyCode == 67){
return false;
}

};

document.onselectstart = function(){

return false;

};

document.oncopy = function(){

return false;

};

(function(){

function detectDevTools(){

const start = new Date();

debugger;

const end = new Date();

if(end - start > 100){

document.body.innerHTML =
"<h1 style='color:red;text-align:center;margin-top:100px;'>SECURITY BLOCKED</h1>";

}

}

setInterval(detectDevTools,1000);

})();

// =============================
// IMPORT FILE BC
// =============================

document.getElementById("fileBC")
.addEventListener("change", function(e){

const file = e.target.files[0];

if(!file){

showNotif("❌ File tidak ditemukan","error");
return;

}

document.getElementById("infoBC").innerHTML =
"⏳ Membaca file Excel...";

const reader = new FileReader();

reader.onload = function(evt){

try{

const data = new Uint8Array(evt.target.result);

const workbook = XLSX.read(data,{type:'array'});

const sheetName = workbook.SheetNames[0];

const worksheet = workbook.Sheets[sheetName];

const json = XLSX.utils.sheet_to_json(worksheet,{header:1});

tempDataBC = [];

// ambil kolom pertama
json.forEach((row,index)=>{

if(index===0) return;

if(row[0]){

tempDataBC.push({
barcode: String(row[0])
.trim()
.replace(/\s+/g,'')
.toUpperCase(),

keterangan2: row[2]
? String(row[2]).trim()
: ""
});

}

});

document.getElementById("infoBC").innerHTML =
"✅ File berhasil dibaca : <b>" +
tempDataBC.length +
"</b> data BC";

showNotif(
"✅ IMPORT BC BERHASIL : " +
tempDataBC.length + " DATA",
"success"
);

beep("https://actions.google.com/sounds/v1/cartoon/pop.ogg");

console.log("DATA BC :", tempDataBC);

}catch(err){

console.error(err);

document.getElementById("infoBC").innerHTML =
"❌ Gagal membaca file";

showNotif("❌ FORMAT FILE SALAH","error");

errorBCAnimation();

}

};

reader.readAsArrayBuffer(file);

});

// =============================
// MODAL BC
// =============================

function bukaModalBC(){

document.getElementById("modalBC").style.display = "flex";

}

function tutupModalBC(){

document.getElementById("modalBC").style.display = "none";

}

// =============================
// DATA BC FIREBASE
// =============================

const roomBCRef = roomRoot.child("DATA_BC");

// =============================
// IMPORT FILE BC
// =============================

let tempDataBC = [];

document.getElementById("fileBC")
.addEventListener("change", function(e){

const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = function(evt){

const data = new Uint8Array(evt.target.result);

const workbook = XLSX.read(data,{type:'array'});

const sheetName = workbook.SheetNames[0];

const worksheet = workbook.Sheets[sheetName];

const json = XLSX.utils.sheet_to_json(worksheet,{header:1});

tempDataBC = [];

// ambil kolom pertama
json.forEach((row,index)=>{

if(index===0) return;

if(row[0]){

tempDataBC.push({
barcode: String(row[0])
.trim()
.replace(/\s+/g,'')
.toUpperCase(),

keterangan2: row[2]
? String(row[2]).trim()
: ""
});

}

});

document.getElementById("infoBC").innerHTML =
"✅ File berhasil dibaca : <b>" +
tempDataBC.length +
"</b> data";

console.log("DATA BC :", tempDataBC);

};

reader.readAsArrayBuffer(file);

});

// =============================
// KIRIM DATA BC
// =============================

function kirimDataBC(){

if(tempDataBC.length===0){

showNotif("❌ File BC belum dipilih","error");
return;

}

dataBC = [...tempDataBC];

// simpan ke firebase
roomBCRef.set(dataBC);

showNotif(
"✅ Data BC berhasil dikirim : " +
dataBC.length + " data",
"success"
);

tutupModalBC();

}

// =============================
// TERIMA DATA BC REALTIME
// =============================

roomBCRef.on("value", snapshot => {

const data = snapshot.val();

if(data){

dataBC = data;

console.log("SYNC DATA BC :", dataBC);

}

});

// =============================
// HAPUS DATA BC
// =============================

function hapusDataBC(){

let yakin = confirm(
"Yakin ingin menghapus semua DATA BC ?"
);

if(!yakin) return;

dataBC = [];
tempDataBC = [];

roomBCRef.remove();

document.getElementById("infoBC").innerHTML =
"❌ Data BC sudah dihapus";

showNotif("🗑️ DATA BC DIHAPUS","error");

}

// =============================
// SOUND ERROR + SHAKE
// =============================

// =============================
// SOUND ERROR + SHAKE
// =============================

function errorBCAnimation(){

// 🔊 SIRENE KERAS
const siren = new Audio(
"https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
);

siren.volume = 1;

siren.currentTime = 0;

siren.play()
.then(()=>{

console.log("Sirene berhasil");

})
.catch(err=>{

console.log("Audio gagal:", err);

});

// 🔥 GOYANG BODY KUAT
document.body.classList.remove("shake-error");
void document.body.offsetWidth;
document.body.classList.add("shake-error");

// 🚨 NOTIF
showNotif(
"⛔ SATU KANTONG DITOLAK OLEH BC ⛔",
"error",
5000
);

// ⏱ STOP EFEK
setTimeout(()=>{

document.body.classList.remove("shake-error");

},5000);

}

// ================= PASSWORD IMPORT BC =================

const PASSWORD_BC = "Di2tboit";

// buka modal password
function bukaPasswordBC(){

document.getElementById("passwordBCBox").style.display = "flex";

setTimeout(()=>{

document.getElementById("passwordBCInput").focus();

},200);

}

// tutup modal password
function tutupPasswordBC(){

document.getElementById("passwordBCBox").style.display = "none";

document.getElementById("passwordBCInput").value = "";

document.getElementById("passwordError").innerHTML = "";

}

// cek password
function cekPasswordBC(){

const input =
document.getElementById("passwordBCInput").value;

if(input === PASSWORD_BC){

// tutup password
tutupPasswordBC();

// buka modal import bc
bukaModalBC();

beep("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

}else{

document.getElementById("passwordError").innerHTML =
"❌ PASSWORD SALAH";

// layar goyang TANPA suara
document.body.classList.remove("shake-error");
void document.body.offsetWidth;
document.body.classList.add("shake-error");

setTimeout(()=>{

document.body.classList.remove("shake-error");

},500);

}

}

// enter otomatis login
document.addEventListener("keydown", function(e){

if(
document.getElementById("passwordBCBox").style.display === "flex"
&& e.key === "Enter"
){

e.preventDefault();

cekPasswordBC();

}

});
