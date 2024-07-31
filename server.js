const express = require("express");
const path = require("path");
const QRCode = require("qrcode");
const sharp = require("sharp");
const multer = require("multer");
const fs = require("fs");
const { promisify } = require("util");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

const unlinkAsync = promisify(fs.unlink);

const upload = multer({ dest: "uploads/" });

app.use(express.static(path.join(__dirname, "frontend/public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure qrcodes directory exists
if (!fs.existsSync(path.join(__dirname, "frontend", "public", "qrcodes"))) {
  fs.mkdirSync(path.join(__dirname, "frontend", "public", "qrcodes"), {
    recursive: true,
  });
}

app.post("/generate", upload.single("logo"), async (req, res) => {
  const { text, frameDistance, frameThickness, frameColor, frameRadius } =
    req.body;
  const logoPath = req.file ? req.file.path : null;
  const qrId = uuidv4();
  const tempQrPath = path.join(__dirname, "uploads", `${qrId}-temp.png`);
  const qrOutputPathPng = path.join(
    __dirname,
    "frontend",
    "public",
    "qrcodes",
    `${qrId}.png`
  );
  const qrOutputPathSvg = path.join(
    __dirname,
    "frontend",
    "public",
    "qrcodes",
    `${qrId}.svg`
  );

  try {
    console.log("Generating QR code for text:", text);

    // Generate SVG QR code
    const qrSvg = await QRCode.toString(text, {
      type: "svg",
      margin: 1,
      width: 500,
    });

    fs.writeFileSync(qrOutputPathSvg, qrSvg);

    // Generate PNG QR code
    let qrPngBuffer = await QRCode.toBuffer(text, { margin: 1, width: 500 });

    if (logoPath) {
      console.log("Adding logo to PNG QR code:", logoPath);
      const qrPngImage = sharp(qrPngBuffer);
      const { width, height } = await qrPngImage.metadata();

      const logoSize = 100;
      const centerSquareSize = logoSize + 20;

      // Add a white square in the center
      qrPngBuffer = await qrPngImage
        .composite([
          {
            input: Buffer.from(
              `<svg width="${centerSquareSize}" height="${centerSquareSize}">
                <rect x="0" y="0" width="${centerSquareSize}" height="${centerSquareSize}" fill="white" />
              </svg>`
            ),
            left: Math.floor((width - centerSquareSize) / 2),
            top: Math.floor((height - centerSquareSize) / 2),
          },
        ])
        .toBuffer();

      // Resize the logo to fit within the QR code
      const logoBuffer = await sharp(logoPath)
        .resize({ width: logoSize, height: logoSize, fit: "inside" })
        .toBuffer();

      // Composite the logo onto the PNG QR code
      qrPngBuffer = await sharp(qrPngBuffer)
        .composite([{ input: logoBuffer, gravity: "center" }])
        .toBuffer();

      await unlinkAsync(logoPath); // Clean up the uploaded logo file
    }

    // Add frame around the QR code
    const frameDistancePx = parseInt(frameDistance, 10);
    const frameThicknessPx = parseInt(frameThickness, 10);
    const frameColorHex = frameColor || "#000000";
    const frameRadiusPx = parseInt(frameRadius, 10);

    if (frameThicknessPx > 0) {
      const qrPngImage = sharp(qrPngBuffer);
      const { width, height } = await qrPngImage.metadata();

      const frameWidth = width + 2 * (frameDistancePx + frameThicknessPx);
      const frameHeight = height + 2 * (frameDistancePx + frameThicknessPx);

      const svgFrame = `
        <svg width="${frameWidth}" height="${frameHeight}">
          <rect x="0" y="0" width="${frameWidth}" height="${frameHeight}" fill="${frameColorHex}" rx="${frameRadiusPx}" ry="${frameRadiusPx}" />
          <rect x="${frameThicknessPx}" y="${frameThicknessPx}" width="${
        frameWidth - 2 * frameThicknessPx
      }" height="${
        frameHeight - 2 * frameThicknessPx
      }" fill="white" rx="${frameRadiusPx}" ry="${frameRadiusPx}" />
        </svg>
      `;

      const frameBuffer = Buffer.from(svgFrame);

      qrPngBuffer = await sharp({
        create: {
          width: frameWidth,
          height: frameHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          { input: frameBuffer, gravity: "center" },
          {
            input: qrPngBuffer,
            top: frameDistancePx + frameThicknessPx,
            left: frameDistancePx + frameThicknessPx,
          },
        ])
        .png()
        .toBuffer();
    }

    await sharp(qrPngBuffer).toFile(qrOutputPathPng);

    console.log("QR code generated:", {
      png: `/qrcodes/${path.basename(qrOutputPathPng)}`,
      svg: `/qrcodes/${path.basename(qrOutputPathSvg)}`,
    });

    res.json({
      png: `/qrcodes/${path.basename(qrOutputPathPng)}`,
      svg: `/qrcodes/${path.basename(qrOutputPathSvg)}`,
    });
  } catch (err) {
    console.error("Error generating QR code:", err);
    res.status(500).send("Error generating QR code");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
