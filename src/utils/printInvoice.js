export const printInvoice = (elementId) => {
  const content = document.getElementById(elementId);
  if (!content) return;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>Impression Facture</title>
        <style>
          @page { margin: 5mm; size: A5 landscape; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            background: white;
            color: black;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Reset everything to ensure perfect printing */
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${content.outerHTML}
        <script>
          // Attend un peu pour que le rendu soit parfait
          setTimeout(() => {
            window.print();
            window.close();
          }, 300);
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
