const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function checkPdfFields() {
  try {
    const pdfPath = path.join(__dirname, 'public/templates/yangsu-yangdo-form.pdf');
    const pdfBytes = fs.readFileSync(pdfPath);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`\n=== PDF AcroForm 필드 확인 ===\n`);
    console.log(`총 필드 개수: ${fields.length}\n`);

    if (fields.length === 0) {
      console.log('❌ AcroForm 필드가 없습니다.');
      console.log('→ 좌표 기반 방식으로 텍스트를 삽입해야 합니다.\n');
    } else {
      console.log('✅ AcroForm 필드가 있습니다!\n');
      console.log('필드 목록:');
      console.log('-------------------');

      fields.forEach((field, index) => {
        const name = field.getName();
        const type = field.constructor.name;
        console.log(`${index + 1}. ${name} (${type})`);
      });

      console.log('\n→ 필드 이름으로 값을 설정할 수 있습니다.\n');
    }
  } catch (error) {
    console.error('오류 발생:', error.message);
  }
}

checkPdfFields();
