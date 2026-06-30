const sampleUrl = "./assets/sample-frame.jpg";

const imageInput = document.querySelector("#imageInput");
const sampleBtn = document.querySelector("#sampleBtn");
const scaleInput = document.querySelector("#scaleInput");
const scaleValue = document.querySelector("#scaleValue");
const sharpnessInput = document.querySelector("#sharpnessInput");
const sharpnessValue = document.querySelector("#sharpnessValue");
const compareSlider = document.querySelector("#compareSlider");
const divider = document.querySelector("#divider");
const lowCanvas = document.querySelector("#lowCanvas");
const enhancedCanvas = document.querySelector("#enhancedCanvas");
const lowPreview = document.querySelector("#lowPreview");
const enhancedPreview = document.querySelector("#enhancedPreview");
const lowPreviewCtx = lowPreview.getContext("2d", { willReadFrequently: true });
const enhancedPreviewCtx = enhancedPreview.getContext("2d", { willReadFrequently: true });
const lowCtx = lowCanvas.getContext("2d", { willReadFrequently: true });
const enhancedCtx = enhancedCanvas.getContext("2d", { willReadFrequently: true });
const resolutionMetric = document.querySelector("#resolutionMetric");
const lowResMetric = document.querySelector("#lowResMetric");
const sharpnessMetric = document.querySelector("#sharpnessMetric");

let sourceImage;

function updateCompare() {
  const value = Number(compareSlider.value);
  lowCanvas.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
  divider.style.left = `${value}%`;
}

function drawCover(ctx, image, width, height) {
  const imageRatio = image.width / image.height;
  const canvasRatio = width / height;
  const drawHeight = imageRatio > canvasRatio ? height : width / imageRatio;
  const drawWidth = imageRatio > canvasRatio ? height * imageRatio : width;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function sharpen(ctx, width, height, amount) {
  if (amount <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const out = new Uint8ClampedArray(src);
  const strength = amount / 100;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const center = src[index + channel] * 5;
        const left = src[index - 4 + channel];
        const right = src[index + 4 + channel];
        const top = src[index - width * 4 + channel];
        const bottom = src[index + width * 4 + channel];
        const sharpened = center - left - right - top - bottom;
        out[index + channel] = src[index + channel] * (1 - strength) + sharpened * strength;
      }
    }
  }

  imageData.data.set(out);
  ctx.putImageData(imageData, 0, 0);
}

function render() {
  if (!sourceImage) return;

  const width = enhancedCanvas.width;
  const height = enhancedCanvas.height;
  const scale = Number(scaleInput.value);
  const sharpness = Number(sharpnessInput.value);
  scaleValue.value = `${scale}x`;
  sharpnessValue.value = `${sharpness}%`;
  resolutionMetric.textContent = `${width} x ${height}`;
  lowResMetric.textContent = `${Math.round(width / scale)} x ${Math.round(height / scale)}`;
  sharpnessMetric.textContent = `${sharpness}%`;

  const smallCanvas = document.createElement("canvas");
  smallCanvas.width = Math.round(width / scale);
  smallCanvas.height = Math.round(height / scale);
  const smallCtx = smallCanvas.getContext("2d");
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.imageSmoothingQuality = "high";
  drawCover(smallCtx, sourceImage, smallCanvas.width, smallCanvas.height);

  lowCtx.clearRect(0, 0, width, height);
  lowCtx.imageSmoothingEnabled = false;
  lowCtx.drawImage(smallCanvas, 0, 0, width, height);

  enhancedCtx.clearRect(0, 0, width, height);
  enhancedCtx.imageSmoothingEnabled = true;
  enhancedCtx.imageSmoothingQuality = "high";
  enhancedCtx.drawImage(smallCanvas, 0, 0, width, height);
  sharpen(enhancedCtx, width, height, sharpness);

  lowPreviewCtx.clearRect(0, 0, lowPreview.width, lowPreview.height);
  lowPreviewCtx.imageSmoothingEnabled = false;
  lowPreviewCtx.drawImage(smallCanvas, 0, 0, lowPreview.width, lowPreview.height);

  enhancedPreviewCtx.clearRect(0, 0, enhancedPreview.width, enhancedPreview.height);
  enhancedPreviewCtx.imageSmoothingEnabled = true;
  enhancedPreviewCtx.imageSmoothingQuality = "high";
  enhancedPreviewCtx.drawImage(smallCanvas, 0, 0, enhancedPreview.width, enhancedPreview.height);
  sharpen(enhancedPreviewCtx, enhancedPreview.width, enhancedPreview.height, sharpness);
}

function loadImage(src) {
  const image = new Image();
  image.onload = () => {
    sourceImage = image;
    render();
  };
  image.src = src;
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) return;
  loadImage(URL.createObjectURL(file));
});

sampleBtn.addEventListener("click", () => {
  loadImage(sampleUrl);
});

scaleInput.addEventListener("input", render);
sharpnessInput.addEventListener("input", render);
compareSlider.addEventListener("input", updateCompare);

updateCompare();
loadImage(sampleUrl);
