const uploadInput = document.getElementById('upload');
const dropZone = document.getElementById('dropZone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const lockRatio = document.getElementById('lockRatio');
const qualityInput = document.getElementById('quality');
const formatSelect = document.getElementById('format');
const downloadBtn = document.getElementById('downloadBtn');
const removeBtn = document.getElementById('removeBtn');
const controls = document.getElementById('controls');
const placeholder = document.getElementById('placeholderText');
const imgDetails = document.getElementById('imgDetails');

let originalImage = new Image();
let originalRatio = 1;

// --- 1. BULLETPROOF DRAG & DROP LOGIC ---

// Prevent default drag behaviors for the entire window
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone when dragging over it
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        if(placeholder.classList.contains('hidden') === false) {
            dropZone.classList.add('drag-over');
        }
    }, false);
});

// Remove highlight when dragging leaves or drops
['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
    }, false);
});

// Handle the actual drop
dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
        handleFile(files[0]);
    }
}, false);

// Make clicking the drop zone open the file browser
dropZone.addEventListener('click', (e) => {
    // Only trigger if we aren't clicking the remove button and no image is loaded
    if (e.target !== removeBtn && placeholder.classList.contains('hidden') === false) {
        uploadInput.click();
    }
});

// Handle normal file browser selection
uploadInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// --- 2. IMAGE PROCESSING LOGIC ---

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    // Convert bytes to KB
    const kbSize = (file.size / 1024).toFixed(2);
    document.getElementById('origSize').innerText = kbSize + " KB";
    
    const reader = new FileReader();
    reader.onload = (event) => {
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Remove Image Logic
removeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent opening the file browser
    
    originalImage = new Image();
    uploadInput.value = '';
    
    controls.classList.add('disabled');
    placeholder.classList.remove('hidden');
    canvas.classList.add('hidden');
    imgDetails.classList.add('hidden');
    removeBtn.classList.add('hidden');
    dropZone.classList.remove('has-image');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Initialize Canvas once image loads into memory
originalImage.onload = () => {
    controls.classList.remove('disabled');
    placeholder.classList.add('hidden');
    canvas.classList.remove('hidden');
    imgDetails.classList.remove('hidden');
    removeBtn.classList.remove('hidden');
    dropZone.classList.add('has-image');
    
    originalRatio = originalImage.width / originalImage.height;
    
    widthInput.value = originalImage.width;
    heightInput.value = originalImage.height;
    
    render();
};

// Handle Dimension Changes
widthInput.addEventListener('input', () => {
    if (lockRatio.checked && widthInput.value > 0) {
        heightInput.value = Math.round(widthInput.value / originalRatio);
    }
    render();
});

heightInput.addEventListener('input', () => {
    if (lockRatio.checked && heightInput.value > 0) {
        widthInput.value = Math.round(heightInput.value * originalRatio);
    }
    render();
});

// Re-render when settings change
[lockRatio, qualityInput, formatSelect].forEach(el => {
    el.addEventListener('change', render);
});

// Draw to Canvas
function render() {
    if(!widthInput.value || !heightInput.value) return; 

    canvas.width = widthInput.value;
    canvas.height = heightInput.value;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    updateNewSize();
}

// Calculate Compressed Size
function updateNewSize() {
    const format = formatSelect.value;
    const quality = parseFloat(qualityInput.value);
    const dataUrl = canvas.toDataURL(format, quality);
    const size = Math.round((dataUrl.length * 3/4) / 1024);
    document.getElementById('newSize').innerText = size + " KB";
}

// Download Logic
downloadBtn.addEventListener('click', () => {
    const format = formatSelect.value;
    const quality = parseFloat(qualityInput.value);
    
    let ext = format.split('/')[1];
    if (ext === "svg+xml") ext = "svg";
    if (ext === "jpeg") ext = "jpg";

    const link = document.createElement('a');
    link.download = `optimized-image.${ext}`;
    link.href = canvas.toDataURL(format, quality);
    link.click();
});