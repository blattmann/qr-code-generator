<template>
  <div class="container">
    <h1 class="my-4">QR Code Generator</h1>
    <form @submit.prevent="generateQRCode" enctype="multipart/form-data">
      <div class="mb-3">
        <p>Please fill in the text or URL to generate a QR code.</p>
        <label for="text" class="form-label">Text or URL:</label>
        <input
          type="text"
          id="text"
          v-model="text"
          class="form-control"
          required
        />
      </div>
      <div class="mb-3">
        <label for="logo" class="form-label">Upload Logo:</label>
        <input
          type="file"
          id="logo"
          @change="onFileChange"
          class="form-control"
          accept="image/*"
        />
      </div>
      <div class="mb-3 form-check">
        <input
          type="checkbox"
          id="includeFrame"
          v-model="includeFrame"
          class="form-check-input"
        />
        <label for="includeFrame" class="form-check-label">Include Frame</label>
      </div>
      <div v-if="includeFrame">
        <div class="mb-3">
          <label for="frameDistance" class="form-label">Frame Distance:</label>
          <input
            type="number"
            id="frameDistance"
            v-model="frameDistance"
            class="form-control"
          />
        </div>
        <div class="mb-3">
          <label for="frameThickness" class="form-label"
            >Frame Thickness:</label
          >
          <input
            type="number"
            id="frameThickness"
            v-model="frameThickness"
            class="form-control"
          />
        </div>
        <div class="mb-3">
          <label for="frameColor" class="form-label">Frame Color:</label>
          <input
            type="color"
            id="frameColor"
            v-model="frameColor"
            class="form-control"
          />
        </div>
        <div class="mb-3">
          <label for="frameRadius" class="form-label">Frame Radius:</label>
          <input
            type="number"
            id="frameRadius"
            v-model="frameRadius"
            class="form-control"
          />
        </div>
      </div>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="!text || isSubmitting"
      >
        Generate QR Code
      </button>
    </form>
    <div v-if="qrCodeUrls.png || qrCodeUrls.svg" class="mt-4">
      <h2>Generated QR Codes:</h2>
      <div v-if="qrCodeUrls.png" class="mb-3">
        <h3>PNG:</h3>
        <img
          :src="qrCodeUrls.png"
          alt="Generated PNG QR Code"
          class="img-fluid"
        />
        <a
          :href="qrCodeUrls.png"
          download="qrcode.png"
          class="btn btn-secondary mt-2"
          >Download PNG</a
        >
      </div>
      <div v-if="qrCodeUrls.svg" class="mb-3">
        <h3>SVG:</h3>
        <img
          :src="qrCodeUrls.svg"
          alt="Generated SVG QR Code"
          class="img-fluid"
        />
        <a
          :href="qrCodeUrls.svg"
          download="qrcode.svg"
          class="btn btn-secondary mt-2"
          >Download SVG</a
        >
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import axios from "axios";

export default {
  setup() {
    const text = ref("");
    const logo = ref(null);
    const includeFrame = ref(false);
    const frameDistance = ref(20);
    const frameThickness = ref(10);
    const frameColor = ref("#000000");
    const frameRadius = ref(0);
    const qrCodeUrls = ref({ png: "", svg: "" });
    const isSubmitting = ref(false);

    const onFileChange = (event) => {
      logo.value = event.target.files[0];
      console.log("File changed:", logo.value);
    };

    const generateQRCode = async () => {
      console.log("generateQRCode called");
      if (isSubmitting.value) return;

      isSubmitting.value = true;
      console.log("Form submission prevented");

      console.log("Current text value:", text.value);
      console.log("Current logo value:", logo.value);
      console.log("Current frame values:", {
        includeFrame: includeFrame.value,
        frameDistance: frameDistance.value,
        frameThickness: frameThickness.value,
        frameColor: frameColor.value,
        frameRadius: frameRadius.value,
      });

      const formData = new FormData();
      formData.append("text", text.value);
      if (logo.value) {
        formData.append("logo", logo.value);
      }
      formData.append("includeFrame", includeFrame.value);
      if (includeFrame.value) {
        formData.append("frameDistance", frameDistance.value);
        formData.append("frameThickness", frameThickness.value);
        formData.append("frameColor", frameColor.value);
        formData.append("frameRadius", frameRadius.value);
      }

      try {
        console.log("Sending request to generate QR code...");
        const response = await axios.post("/generate", formData);
        console.log("QR code generated successfully:", response.data);
        qrCodeUrls.value = response.data;
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      text,
      logo,
      includeFrame,
      frameDistance,
      frameThickness,
      frameColor,
      frameRadius,
      qrCodeUrls,
      isSubmitting,
      onFileChange,
      generateQRCode,
    };
  },
};
</script>

<style>
.container {
  max-width: 600px;
  margin-top: 50px;
}
</style>
