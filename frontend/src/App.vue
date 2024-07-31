<template>
  <div class="container">
    <h1 class="my-4">QR Code Generator</h1>
    <form @submit.prevent="generateQRCode" enctype="multipart/form-data">
      <div class="mb-3">
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
      <button type="submit" class="btn btn-primary">Generate QR Code</button>
    </form>
    <div v-if="qrCodeUrls.png || qrCodeUrls.svg" class="mt-4">
      <h2>Generated QR Codes:</h2>
      <div v-if="qrCodeUrls.png">
        <h3>PNG:</h3>
        <img
          :src="qrCodeUrls.png"
          alt="Generated PNG QR Code"
          class="img-fluid"
        />
      </div>
      <div v-if="qrCodeUrls.svg">
        <h3>SVG:</h3>
        <img
          :src="qrCodeUrls.svg"
          alt="Generated SVG QR Code"
          class="img-fluid"
        />
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

      const formData = new FormData();
      formData.append("text", text.value);
      if (logo.value) {
        formData.append("logo", logo.value);
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
      qrCodeUrls,
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
