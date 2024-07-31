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
  const { text } = req.body;
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

    // Generate PNG QR code with empty center
    const qrPngBuffer = await QRCode.toBuffer(text, { margin: 1, width: 500 });
    const qrPngImage = sharp(qrPngBuffer);
    const { width, height } = await qrPngImage.metadata();

    const logoSize = 100;
    const centerSquareSize = logoSize + 20;
    const qrPngWithCenterEmpty = await qrPngImage
      .composite([
        {
          input:
            Buffer.from(`<svg width="${centerSquareSize}" height="${centerSquareSize}">
                    <rect x="0" y="0" width="${centerSquareSize}" height="${centerSquareSize}" fill="white" />
                </svg>`),
          left: Math.floor((width - centerSquareSize) / 2),
          top: Math.floor((height - centerSquareSize) / 2),
        },
      ])
      .toBuffer();

    // Save the PNG QR code with empty center
    await sharp(qrPngWithCenterEmpty).toFile(tempQrPath);

    if (logoPath) {
      console.log("Adding logo to QR code:", logoPath);

      // Resize the logo to fit within the QR code
      const logoBuffer = await sharp(logoPath)
        .resize({ width: logoSize, height: logoSize, fit: "inside" })
        .toBuffer();

      // Composite the logo onto the PNG QR code
      await sharp(tempQrPath)
        .composite([{ input: logoBuffer, gravity: "center" }])
        .toFile(qrOutputPathPng);

      await unlinkAsync(logoPath); // Clean up the uploaded logo file
      await unlinkAsync(tempQrPath); // Clean up the temporary QR code file
    } else {
      fs.renameSync(tempQrPath, qrOutputPathPng); // Rename the temp QR code file to the final output file
    }

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
