const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const views = ['front', 'back', 'left', 'right', 'top'];
const inputDir = path.join(__dirname, '../public/car-views');
const outputDir = path.join(__dirname, '../public/car-views');

async function convertSvgToPng() {
  for (const view of views) {
    const inputPath = path.join(inputDir, `${view}.svg`);
    const outputPath = path.join(outputDir, `${view}.png`);
    
    try {
      await sharp(inputPath)
        .resize(800, 450)
        .png()
        .toFile(outputPath);
      
      console.log(`Converted ${view}.svg to ${view}.png`);
    } catch (error) {
      console.error(`Error converting ${view}.svg:`, error);
    }
  }
}

convertSvgToPng();
