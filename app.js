const loginForm = document.getElementById("login-form");
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app-container");
let baseImageForBrightness = null;

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user && pass) {
    loginContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");
  
    // Asigură-te că ghidul este ascuns
    document.getElementById("help-modal").classList.add("hidden");
  }
  
});

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let originalImage = new Image();
let currentImage = null;  // imaginea curentă procesată sau originală
let currentRotation = 0;
const brightnessSlider = document.getElementById("brightness-slider");
const brightnessValue = document.getElementById("brightness-value");
let baseImageForContrast = null;
const contrastSlider = document.getElementById("contrast-slider");
const contrastValue = document.getElementById("contrast-value");


const rotationLabel = document.getElementById("rotation-label");

function updateRotationLabel() {
  rotationLabel.textContent = `Unghi curent: ${currentRotation}°`;
}

function drawImage(img) {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  updateCurrentImageFromCanvas();
}

function updateCurrentImageFromCanvas() {
  currentImage = new Image();
  currentImage.src = canvas.toDataURL();
}

const loadImageBtn = document.getElementById("load-image");
loadImageBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("https://dog.ceo/api/breeds/image/random");
    const data = await res.json();
    originalImage = new Image();
    originalImage.crossOrigin = "anonymous";
    originalImage.src = data.message;
    originalImage.onload = () => {
      currentRotation = 0;
      updateRotationLabel();
      drawImage(originalImage);
    };
  } catch {
    alert("Nu s-a putut încărca imaginea. Încearcă din nou.");
  }
});

const fileInput = document.getElementById("file-upload");
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    originalImage = new Image();
    originalImage.src = reader.result;
    originalImage.onload = () => {
      currentRotation = 0;
      updateRotationLabel();
      drawImage(originalImage);
    };
  };
  reader.readAsDataURL(file);
});

const rotateBtn = document.getElementById("rotate-image");
rotateBtn.addEventListener("click", () => {
  const imageToRotate = currentImage || originalImage;
  if (!imageToRotate || !imageToRotate.src) return alert("Întâi încarcă o imagine.");

  currentRotation = (currentRotation + 90) % 360;
  updateRotationLabel();

  const start = performance.now();
  let w = imageToRotate.width;
  let h = imageToRotate.height;

  if (currentRotation === 180) {
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(w, h);
    ctx.rotate(Math.PI);
    ctx.drawImage(imageToRotate, 0, 0);
  } else if (currentRotation === 90) {
    canvas.width = h;
    canvas.height = w;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(h, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(imageToRotate, 0, 0);
  } else if (currentRotation === 270) {
    canvas.width = h;
    canvas.height = w;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(0, w);
    ctx.rotate(3 * Math.PI / 2);
    ctx.drawImage(imageToRotate, 0, 0);
  } else {
    drawImage(imageToRotate);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const duration = (performance.now() - start).toFixed(2);
  document.getElementById("timer").textContent = `Timp de procesare: ${duration} ms`;
  updateCurrentImageFromCanvas();
});

const resetBtn = document.getElementById("reset-image");
resetBtn.addEventListener("click", () => {
  const spinner = document.getElementById("spinner");
  spinner.classList.remove("hidden");

  // Simulează reset timp de 1.5 secunde
  setTimeout(() => {
    spinner.classList.add("hidden");
    alert("Imaginea a fost resetată!");
  currentRotation = 0;
  brightnessSlider.value = 0;
  brightnessValue.textContent = "0";
  contrastSlider.value = 100;
  contrastValue.textContent = "100%";

  updateRotationLabel();
  drawImage(originalImage);

  }, 1500);
});

const saveBtn = document.getElementById("save-image");
saveBtn.addEventListener("click", () => {
  simulateSaveProgress();
  const link = document.createElement("a");
  link.download = "imagine_editata.png";
  link.href = canvas.toDataURL();
  link.click();
});

function applyGrayscale() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i+1] + data[i+2]) / 3;
    data[i] = data[i+1] = data[i+2] = avg;
  }
  ctx.putImageData(imageData, 0, 0);
  updateCurrentImageFromCanvas();
}

function applyNegative() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i+1] = 255 - data[i+1];
    data[i+2] = 255 - data[i+2];
  }
  ctx.putImageData(imageData, 0, 0);
  updateCurrentImageFromCanvas();
}

function applyBinarization(threshold = 128) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i+1] + data[i+2]) / 3;
    const bin = avg > threshold ? 255 : 0;
    data[i] = data[i+1] = data[i+2] = bin;
  }
  ctx.putImageData(imageData, 0, 0);
  updateCurrentImageFromCanvas();
}

function applyHistogramStretching() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let min = 255, max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i+1] + data[i+2]) / 3;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }

  const range = max - min;
  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      data[i+j] = ((data[i+j] - min) * 255) / range;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  updateCurrentImageFromCanvas();
}

// atașare evenimente pentru butoanele de procesare
document.getElementById("btn-grayscale").addEventListener("click", applyGrayscale);
document.getElementById("btn-negative").addEventListener("click", applyNegative);
document.getElementById("btn-binarize").addEventListener("click", () => applyBinarization());
document.getElementById("btn-histogram").addEventListener("click", applyHistogramStretching);
document.getElementById("btn-sobel").addEventListener("click", applySobelOperator);
document.getElementById("btn-prewitt").addEventListener("click", applyPrewittOperator);
document.getElementById("btn-mirror-horizontal").addEventListener("click", () => mirrorImage(true));
document.getElementById("btn-mirror-vertical").addEventListener("click", () => mirrorImage(false));
document.getElementById("btn-sharpen").addEventListener("click", applySharpening);
document.getElementById("btn-smoothing").addEventListener("click", applySmoothing);
document.getElementById("btn-zoom-in").addEventListener("click", () => resizeImage(2));
document.getElementById("btn-zoom-out").addEventListener("click", () => resizeImage(0.5));
document.getElementById("btn-zoh-in").addEventListener("click", () => resizeImageZOH(2));
document.getElementById("btn-zoh-out").addEventListener("click", () => resizeImageZOH(0.5));
document.getElementById("btn-grayscale-weighted").addEventListener("click", applyGrayscaleWeighted);
document.getElementById("btn-normalize").addEventListener("click", normalizeColors);
document.getElementById("btn-and").addEventListener("click", () => applyBinaryOperation("AND"));
document.getElementById("btn-or").addEventListener("click", () => applyBinaryOperation("OR"));
document.getElementById("btn-xor").addEventListener("click", () => applyBinaryOperation("XOR"));
document.getElementById("btn-histogram-11gray").addEventListener("click", apply11LevelHistogram);
document.getElementById("btn-decrease-depth").addEventListener("click", () => {
    const levels = parseInt(document.getElementById("gray-depth").value);
    if (isNaN(levels) || levels < 2 || levels > 256) {
      alert("Introduceți un număr între 2 și 256.");
      return;
    }
    decreaseGrayScaleDepth(levels);
  });
  
document.getElementById("btn-histogram-shift").addEventListener("click", () => {
    const shift = parseInt(document.getElementById("histogram-shift").value);
    if (isNaN(shift)) {
      alert("Introduceți o valoare validă.");
      return;
    }
    applyHistogramSliding(shift);
  });

document.getElementById("btn-linear-transform").addEventListener("click", () => {
    const a = parseFloat(document.getElementById("linear-a").value);
    const b = parseInt(document.getElementById("linear-b").value);
  
    if (isNaN(a) || isNaN(b)) {
      alert("Introduceți valori valide pentru a și b.");
      return;
    }
  
    applyLinearGrayTransform(a, b);
  });
  
  document.getElementById("btn-log-transform").addEventListener("click", () => {
    const c = parseFloat(document.getElementById("log-c").value);
    if (isNaN(c) || c <= 0) {
      alert("Introduceți o valoare validă pentru c (> 0)");
      return;
    }
    applyLogTransform(c);
  });

  document.getElementById("btn-gamma-transform").addEventListener("click", () => {
    const c = parseFloat(document.getElementById("gamma-c").value);
    const gamma = parseFloat(document.getElementById("gamma-gamma").value);
    if (isNaN(c) || isNaN(gamma) || c <= 0 || gamma <= 0) {
      alert("Introduceți valori valide pentru c și gamma (> 0)");
      return;
    }
    applyGammaTransform(c, gamma);
  });
  
    


  brightnessSlider.addEventListener("mousedown", () => {
    baseImageForBrightness = new Image();
    baseImageForBrightness.src = canvas.toDataURL();
  });
  
  brightnessSlider.addEventListener("input", () => {
    brightnessValue.textContent = brightnessSlider.value;
  
    if (baseImageForBrightness) {
      baseImageForBrightness.onload = () => {
        drawImage(baseImageForBrightness); // reafișează imaginea inițială
        const amount = parseInt(brightnessSlider.value);
        applyBrightness(amount);
      };
    }
  });
  
document.getElementById("btn-translate").addEventListener("click", () => {
    const x = parseInt(document.getElementById("translate-x").value);
    const y = parseInt(document.getElementById("translate-y").value);
    if (isNaN(x) || isNaN(y)) {
      alert("Introduceți valori valide pentru X și Y.");
      return;
    }
    translateImage(x, y);
  });
  

  document.getElementById("btn-laplacian-positive").addEventListener("click", () => {
    const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
    applyLaplacian(kernel);
  });
  
  document.getElementById("btn-laplacian-negative").addEventListener("click", () => {
    const kernel = [0, -1, 0, -1, 4, -1, 0, -1, 0];
    applyLaplacian(kernel);
  });
   
// tab switching
function openTab(evt, tabId) {
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach((el) => el.classList.remove("active-tab"));

  const tabLinks = document.querySelectorAll(".tab-link");
  tabLinks.forEach((el) => el.classList.remove("active"));

  document.getElementById(tabId).classList.add("active-tab");
  evt.currentTarget.classList.add("active");
}

function applySobelOperator() {
    const width = canvas.width;
    const height = canvas.height;
    const srcData = ctx.getImageData(0, 0, width, height);
    const dstData = ctx.createImageData(width, height);
  
    const gray = []; // convert to grayscale array first
    for (let i = 0; i < srcData.data.length; i += 4) {
      const avg = (srcData.data[i] + srcData.data[i+1] + srcData.data[i+2]) / 3;
      gray.push(avg);
    }
  
    const gxKernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const gyKernel = [1, 2, 1, 0, 0, 0, -1, -2, -1];
  
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
  
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = gray[(y + ky) * width + (x + kx)];
            const idx = (ky + 1) * 3 + (kx + 1);
            gx += pixel * gxKernel[idx];
            gy += pixel * gyKernel[idx];
          }
        }
  
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const clamped = Math.min(255, Math.max(0, magnitude));
        const i = (y * width + x) * 4;
        dstData.data[i] = dstData.data[i+1] = dstData.data[i+2] = clamped;
        dstData.data[i+3] = 255;
      }
    }
  
    ctx.putImageData(dstData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function applyPrewittOperator() {
    const width = canvas.width;
    const height = canvas.height;
    const srcData = ctx.getImageData(0, 0, width, height);
    const dstData = ctx.createImageData(width, height);
  
    const gray = [];
    for (let i = 0; i < srcData.data.length; i += 4) {
      const avg = (srcData.data[i] + srcData.data[i+1] + srcData.data[i+2]) / 3;
      gray.push(avg);
    }
  
    const gxKernel = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
    const gyKernel = [1, 1, 1, 0, 0, 0, -1, -1, -1];
  
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
  
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = gray[(y + ky) * width + (x + kx)];
            const idx = (ky + 1) * 3 + (kx + 1);
            gx += pixel * gxKernel[idx];
            gy += pixel * gyKernel[idx];
          }
        }
  
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const clamped = Math.min(255, Math.max(0, magnitude));
        const i = (y * width + x) * 4;
        dstData.data[i] = dstData.data[i+1] = dstData.data[i+2] = clamped;
        dstData.data[i+3] = 255;
      }
    }
  
    ctx.putImageData(dstData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function mirrorImage(horizontal = true) {
    const width = canvas.width;
    const height = canvas.height;
    const srcData = ctx.getImageData(0, 0, width, height);
    const dstData = ctx.createImageData(width, height);
    const src = srcData.data;
    const dst = dstData.data;
  
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const mirrorX = horizontal ? width - x - 1 : x;
        const mirrorY = horizontal ? y : height - y - 1;
        const dstIdx = (mirrorY * width + mirrorX) * 4;
  
        for (let i = 0; i < 4; i++) {
          dst[dstIdx + i] = src[srcIdx + i];
        }
      }
    }
  
    ctx.putImageData(dstData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function applyBrightness(amount) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] + amount));     // R
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + amount)); // G
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + amount)); // B
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  contrastSlider.addEventListener("mousedown", () => {
    baseImageForContrast = new Image();
    baseImageForContrast.src = canvas.toDataURL();
  });
  
  contrastSlider.addEventListener("input", () => {
    contrastValue.textContent = contrastSlider.value + "%";
  
    if (baseImageForContrast) {
      baseImageForContrast.onload = () => {
        drawImage(baseImageForContrast);
        const amount = parseFloat(contrastSlider.value);
        applyContrast(amount);
      };
    }
  });
  
  function applyContrast(amount) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    const factor = (259 * (amount + 255)) / (255 * (259 - amount)); // contrast formula
  
    for (let i = 0; i < data.length; i += 4) {
      data[i] = truncate(factor * (data[i] - 128) + 128);     // R
      data[i + 1] = truncate(factor * (data[i + 1] - 128) + 128); // G
      data[i + 2] = truncate(factor * (data[i + 2] - 128) + 128); // B
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function truncate(value) {
    return Math.max(0, Math.min(255, value));
  }
  
  function applySharpening() {
    const width = canvas.width;
    const height = canvas.height;
    const srcData = ctx.getImageData(0, 0, width, height);
    const dstData = ctx.createImageData(width, height);
    const src = srcData.data;
    const dst = dstData.data;
  
    const kernel = [
       0, -1,  0,
      -1,  5, -1,
       0, -1,  0
    ];
  
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {  // R, G, B
          let newValue = 0;
  
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const px = x + kx;
              const py = y + ky;
              const idx = (py * width + px) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              newValue += src[idx] * kernel[kernelIdx];
            }
          }
  
          const dstIdx = (y * width + x) * 4 + c;
          dst[dstIdx] = Math.min(255, Math.max(0, newValue));
        }
        dst[(y * width + x) * 4 + 3] = 255; // Alpha
      }
    }
  
    ctx.putImageData(dstData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function applySmoothing() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
  
    const kernel = [
      1 / 9, 1 / 9, 1 / 9,
      1 / 9, 1 / 9, 1 / 9,
      1 / 9, 1 / 9, 1 / 9
    ];
  
    const tempData = new Uint8ClampedArray(data); // copie pentru citire
  
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;
  
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pos = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[(ky + 1) * 3 + (kx + 1)];
            r += tempData[pos] * weight;
            g += tempData[pos + 1] * weight;
            b += tempData[pos + 2] * weight;
          }
        }
  
        const i = (y * width + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        // alpha rămâne neschimbat
      }
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function resizeImage(scale) {
    if (!currentImage) return;
  
    const srcCanvas = document.createElement("canvas");
    const srcCtx = srcCanvas.getContext("2d");
  
    srcCanvas.width = canvas.width;
    srcCanvas.height = canvas.height;
    srcCtx.drawImage(canvas, 0, 0);
  
    const srcData = srcCtx.getImageData(0, 0, canvas.width, canvas.height);
    const sw = canvas.width;
    const sh = canvas.height;
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);
  
    const dstCanvas = document.createElement("canvas");
    const dstCtx = dstCanvas.getContext("2d");
    dstCanvas.width = dw;
    dstCanvas.height = dh;
    const dstImage = dstCtx.createImageData(dw, dh);
  
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const srcX = Math.floor(x / scale);
        const srcY = Math.floor(y / scale);
        const srcIdx = (srcY * sw + srcX) * 4;
        const dstIdx = (y * dw + x) * 4;
  
        for (let i = 0; i < 4; i++) {
          dstImage.data[dstIdx + i] = srcData.data[srcIdx + i];
        }
      }
    }
  
    canvas.width = dw;
    canvas.height = dh;
    ctx.putImageData(dstImage, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function resizeImageZOH(scale) {
    if (!currentImage) return;
  
    const srcCanvas = document.createElement("canvas");
    const srcCtx = srcCanvas.getContext("2d");
  
    srcCanvas.width = canvas.width;
    srcCanvas.height = canvas.height;
    srcCtx.drawImage(canvas, 0, 0);
  
    const srcData = srcCtx.getImageData(0, 0, canvas.width, canvas.height);
    const sw = canvas.width;
    const sh = canvas.height;
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);
  
    const dstCanvas = document.createElement("canvas");
    const dstCtx = dstCanvas.getContext("2d");
    dstCanvas.width = dw;
    dstCanvas.height = dh;
    const dstImage = dstCtx.createImageData(dw, dh);
  
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        // Zero Order Hold – ține pixelul de la (floor(x/scale), floor(y/scale))
        const srcX = Math.floor(x / scale);
        const srcY = Math.floor(y / scale);
        const srcIdx = (srcY * sw + srcX) * 4;
        const dstIdx = (y * dw + x) * 4;
  
        for (let i = 0; i < 4; i++) {
          dstImage.data[dstIdx + i] = srcData.data[srcIdx + i];
        }
      }
    }
  
    canvas.width = dw;
    canvas.height = dh;
    ctx.putImageData(dstImage, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  document.getElementById("btn-zoh-k").addEventListener("click", () => {
    const k = parseFloat(document.getElementById("zoom-k").value);
    if (isNaN(k) || k <= 0) {
      alert("Introduceți un factor K valid (> 0).");
      return;
    }
    resizeImageZOH(k);
  });
  
  function applyGrayscaleWeighted() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function normalizeColors() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    let minR = 255, maxR = 0;
    let minG = 255, maxG = 0;
    let minB = 255, maxB = 0;
  
    // Parcurgere pentru determinare min/max per canal
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
  
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      minG = Math.min(minG, g);
      maxG = Math.max(maxG, g);
      minB = Math.min(minB, b);
      maxB = Math.max(maxB, b);
    }
  
    // Normalizare
    for (let i = 0; i < data.length; i += 4) {
      data[i]     = ((data[i] - minR) * 255) / (maxR - minR);     // R
      data[i + 1] = ((data[i + 1] - minG) * 255) / (maxG - minG); // G
      data[i + 2] = ((data[i + 2] - minB) * 255) / (maxB - minB); // B
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  let secondImage = null;

document.getElementById("second-upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    secondImage = new Image();
    secondImage.src = reader.result;
    secondImage.onload = () => {
      alert("A doua imagine a fost încărcată cu succes.");
    };
  };
  reader.readAsDataURL(file);
});

function applyBinaryOperation(operation) {
  if (!secondImage) {
    alert("Încarcă o a doua imagine pentru operația binară.");
    return;
  }

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  const width = Math.min(canvas.width, secondImage.width);
  const height = Math.min(canvas.height, secondImage.height);

  // Prima imagine
  const imageData1 = ctx.getImageData(0, 0, width, height);

  // A doua imagine
  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCtx.drawImage(secondImage, 0, 0, width, height);
  const imageData2 = tempCtx.getImageData(0, 0, width, height);

  const data1 = imageData1.data;
  const data2 = imageData2.data;

  for (let i = 0; i < data1.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      if (operation === "AND") {
        data1[i + j] = data1[i + j] & data2[i + j];
      } else if (operation === "OR") {
        data1[i + j] = data1[i + j] | data2[i + j];
      } else if (operation === "XOR") {
        data1[i + j] = data1[i + j] ^ data2[i + j];
      }
    }
  }

  ctx.putImageData(imageData1, 0, 0);
  updateCurrentImageFromCanvas();
}

function apply11LevelHistogram() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const grayLevels = new Array(256).fill(0);
  
    // Creează histogramă de niveluri de gri
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round((data[i] + data[i+1] + data[i+2]) / 3);
      grayLevels[gray]++;
    }
  
    // Găsește nivelul de gri cu frecvența maximă
    let maxIndex = 0;
    for (let i = 1; i < 256; i++) {
      if (grayLevels[i] > grayLevels[maxIndex]) {
        maxIndex = i;
      }
    }
  
    const lowerBound = maxIndex - 5;
    const upperBound = maxIndex + 5;
  
    // Recolorează imaginea: păstrează doar pixelii în jurul valorii maxime
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round((data[i] + data[i+1] + data[i+2]) / 3);
      if (gray >= lowerBound && gray <= upperBound) {
        data[i] = data[i+1] = data[i+2] = gray;
      } else {
        data[i] = data[i+1] = data[i+2] = 0;
      }
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function decreaseGrayScaleDepth(levels = 4) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const step = Math.floor(256 / levels);
  
    for (let i = 0; i < data.length; i += 4) {
      const avg = Math.floor((data[i] + data[i+1] + data[i+2]) / 3);
      const quantized = Math.floor(avg / step) * step;
  
      data[i] = data[i+1] = data[i+2] = quantized;
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
function applyHistogramSliding(shift = 30) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      data[i + j] = Math.min(255, Math.max(0, data[i + j] + shift));
    }
  }

  ctx.putImageData(imageData, 0, 0);
  updateCurrentImageFromCanvas();
}

function applyLinearGrayTransform(a = 1, b = 0) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        data[i + j] = truncate(a * data[i + j] + b);
      }
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function applyLogTransform(c = 45) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        data[i + j] = truncate(c * Math.log(1 + data[i + j]));
      }
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function applyGammaTransform(c = 1, gamma = 0.5) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        const normalized = data[i + j] / 255;
        const transformed = c * Math.pow(normalized, gamma);
        data[i + j] = truncate(transformed * 255);
      }
    }
  
    ctx.putImageData(imageData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  
  function translateImage(offsetX, offsetY) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
  
    tempCanvas.width = canvas.width + Math.abs(offsetX);
    tempCanvas.height = canvas.height + Math.abs(offsetY);
  
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
  
    const dx = offsetX < 0 ? 0 : offsetX;
    const dy = offsetY < 0 ? 0 : offsetY;
  
    tempCtx.drawImage(canvas, dx, dy);
  
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
  
    updateCurrentImageFromCanvas();
  }
  
  function applyLaplacian(kernel) {
    const width = canvas.width;
    const height = canvas.height;
    const srcData = ctx.getImageData(0, 0, width, height);
    const dstData = ctx.createImageData(width, height);
  
    const gray = [];
    for (let i = 0; i < srcData.data.length; i += 4) {
      const avg = (srcData.data[i] + srcData.data[i+1] + srcData.data[i+2]) / 3;
      gray.push(avg);
    }
  
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
  
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = gray[(y + ky) * width + (x + kx)];
            const idx = (ky + 1) * 3 + (kx + 1);
            sum += pixel * kernel[idx];
          }
        }
  
        const clamped = Math.min(255, Math.max(0, sum));
        const i = (y * width + x) * 4;
        dstData.data[i] = dstData.data[i+1] = dstData.data[i+2] = clamped;
        dstData.data[i+3] = 255;
      }
    }
  
    ctx.putImageData(dstData, 0, 0);
    updateCurrentImageFromCanvas();
  }
  

  document.addEventListener("DOMContentLoaded", () => {
    const helpButton = document.getElementById("help-button");
    const helpModal = document.getElementById("help-modal");
    const closeHelp = document.getElementById("close-help");
  
    helpButton.addEventListener("click", () => {
      helpModal.style.display = "flex";  // Arată popup-ul
    });
  
    closeHelp.addEventListener("click", () => {
      helpModal.style.display = "none"; // Ascunde popup-ul
    });
  
    // Opțional: închidere la click în afara ferestrei de ajutor
    window.addEventListener("click", (e) => {
      if (e.target === helpModal) {
        helpModal.style.display = "none";
      }
    });
  });
  
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault(); // Previne acțiunea implicită (ex: Undo în browser)
      const resetBtn = document.getElementById('reset-image');
      if (resetBtn) resetBtn.click();
    }
  
    if (e.ctrlKey && e.key.toLowerCase() === 's') {
      e.preventDefault(); // Previne salvarea paginii
      const saveBtn = document.getElementById('save-image');
      if (saveBtn) saveBtn.click();
    }
  });
  
  
  document.addEventListener('keydown', function (e) {
    // Zoom In: Alt + =
    if (e.altKey && e.key === '=') {
      e.preventDefault();
      const zoomInBtn = document.getElementById('btn-zoom-in');
      if (zoomInBtn) zoomInBtn.click();
    }
  
    // Zoom Out: Alt + -
    if (e.altKey && e.key === '-') {
      e.preventDefault();
      const zoomOutBtn = document.getElementById('btn-zoom-out');
      if (zoomOutBtn) zoomOutBtn.click();
    }
  });
  
  function simulateSaveProgress() {
    const container = document.getElementById('progress-container');
    const bar = document.getElementById('progress-bar');
    container.classList.remove('hidden');
    bar.value = 0;
  
    let value = 0;
    const interval = setInterval(() => {
      value += 10;
      bar.value = value;
  
      if (value >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          container.classList.add('hidden');
          alert('Imaginea a fost salvată cu succes!');
        }, 500);
      }
    }, 100);
  }
  
  document.getElementById('toggle-darkmode').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });
  