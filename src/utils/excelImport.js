import ExcelJS from 'exceljs';

/**
 * Compresses an image data URL or Blob via Canvas to a lightweight WebP/JPEG data URL.
 * @param {string|Blob} imageSource 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @param {number} quality 
 * @returns {Promise<string>}
 */
export const compressImage = (imageSource, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Try webp first, fallback to jpeg
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    img.onerror = (err) => reject(err);

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob) {
      img.src = URL.createObjectURL(imageSource);
    } else {
      reject(new Error('Format d\'image invalide'));
    }
  });
};

/**
 * Parses an Excel file (.xlsx) and extracts products data along with embedded images.
 * @param {File} file 
 * @returns {Promise<Array>} List of product objects
 */
export const parseProductsExcel = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Le fichier Excel ne contient aucune feuille.');
  }

  // Build image mapping from Excel media & worksheet images
  const imageMap = new Map(); // rowNumber (1-indexed) -> base64DataUrl
  const images = worksheet.getImages ? worksheet.getImages() : [];

  for (const imgRef of images) {
    try {
      const media = workbook.media.find(m => String(m.id) === String(imgRef.imageId));
      if (media && media.buffer) {
        const row = (imgRef.range && imgRef.range.tl && typeof imgRef.range.tl.nativeRow === 'number') 
          ? imgRef.range.tl.nativeRow + 1 
          : null;
        
        if (row) {
          const mimeType = media.extension === 'png' ? 'image/png' : 'image/jpeg';
          const base64 = btoa(
            new Uint8Array(media.buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          const rawDataUrl = `data:${mimeType};base64,${base64}`;
          
          // Compress the extracted image
          try {
            const compressed = await compressImage(rawDataUrl);
            imageMap.set(row, compressed);
          } catch {
            imageMap.set(row, rawDataUrl);
          }
        }
      }
    } catch (err) {
      console.warn('Erreur lors de l\'extraction d\'une image Excel:', err);
    }
  }

  // Parse header row (row 1) to find column indexes
  let colIndexMap = {
    name: -1,
    designation: -1,
    category: -1,
    price: -1,
    cost: -1,
    stock: -1,
    minStock: -1,
    image: -1,
    supplier: -1,
  };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        const headerText = String(cell.value || '').trim().toLowerCase();
        if (headerText.includes('ref') || headerText.includes('code') || headerText.includes('nom') || headerText.includes('référence')) {
          colIndexMap.name = colNumber;
        } else if (headerText.includes('desig') || headerText.includes('désignation') || headerText.includes('description')) {
          colIndexMap.designation = colNumber;
        } else if (headerText.includes('cat')) {
          colIndexMap.category = colNumber;
        } else if (headerText.includes('prix') || headerText.includes('vente') || headerText.includes('price')) {
          if (colIndexMap.price === -1) colIndexMap.price = colNumber;
        } else if (headerText.includes('coût') || headerText.includes('cout') || headerText.includes('achat') || headerText.includes('cost')) {
          colIndexMap.cost = colNumber;
        } else if (headerText.includes('stock min')) {
          colIndexMap.minStock = colNumber;
        } else if (headerText.includes('stock') || headerText.includes('qte') || headerText.includes('quantité')) {
          if (colIndexMap.stock === -1) colIndexMap.stock = colNumber;
        } else if (headerText.includes('img') || headerText.includes('image') || headerText.includes('photo')) {
          colIndexMap.image = colNumber;
        } else if (headerText.includes('fourn') || headerText.includes('supplier')) {
          colIndexMap.supplier = colNumber;
        }
      });
    }
  });

  // Fallbacks if headers weren't named explicitly
  if (colIndexMap.name === -1) colIndexMap.name = 1;
  if (colIndexMap.designation === -1) colIndexMap.designation = colIndexMap.name === 1 ? 2 : 1;
  if (colIndexMap.category === -1) colIndexMap.category = 3;
  if (colIndexMap.price === -1) colIndexMap.price = 4;
  if (colIndexMap.cost === -1) colIndexMap.cost = 5;
  if (colIndexMap.stock === -1) colIndexMap.stock = 6;

  const products = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const getVal = (colIdx) => {
      if (colIdx === -1) return '';
      const cellVal = row.getCell(colIdx).value;
      if (cellVal === null || cellVal === undefined) return '';
      if (typeof cellVal === 'object' && cellVal.result !== undefined) return cellVal.result;
      if (typeof cellVal === 'object' && cellVal.text !== undefined) return cellVal.text;
      return String(cellVal).trim();
    };

    const name = getVal(colIndexMap.name);
    if (!name) return; // Skip empty rows

    const designation = getVal(colIndexMap.designation) || name;
    const category = getVal(colIndexMap.category) || 'Général';
    const price = Number(getVal(colIndexMap.price)) || 0;
    const cost = Number(getVal(colIndexMap.cost)) || 0;
    const stock = Number(getVal(colIndexMap.stock)) || 0;
    const minStock = Number(getVal(colIndexMap.minStock)) || 0;
    const supplier = getVal(colIndexMap.supplier) || '';

    // Check if image was extracted from cell, or if text URL is provided in the image column
    let image = imageMap.get(rowNumber) || '';
    if (!image && colIndexMap.image !== -1) {
      const textUrl = getVal(colIndexMap.image);
      if (textUrl && (textUrl.startsWith('http://') || textUrl.startsWith('https://') || textUrl.startsWith('data:image'))) {
        image = textUrl;
      }
    }

    products.push({
      name,
      designation,
      category,
      price,
      cost,
      stock,
      minStock,
      image,
      supplier,
      isNonInventory: false
    });
  });

  return products;
};
