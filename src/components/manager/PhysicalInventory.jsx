import React, { useState, useMemo } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import { ClipboardCheck, Store, AlertTriangle, CheckCircle, RefreshCcw, Package, Download, Printer } from 'lucide-react';
import { Button, message, Popconfirm, Tag, InputNumber } from 'antd';
import DataTable from '../common/DataTable';

const PhysicalInventory = () => {
  const { products, stores, activeStoreId, updateProduct } = useStore();
  const [counts, setCounts] = useState({}); // { productId: physicalCount }
  const [isValidating, setIsValidating] = useState(false);

  const currentStore = stores.find(s => s.id === activeStoreId);

  // Initialize counts if they haven't been touched
  const auditData = useMemo(() => {
    return products.map(p => {
      const count = counts[p.id] !== undefined ? counts[p.id] : p.stock;
      const discrepancy = count - p.stock;
      return {
        ...p,
        count,
        discrepancy
      };
    });
  }, [products, counts]);

  const handleCountChange = (productId, val) => {
    setCounts(prev => ({ ...prev, [productId]: val }));
  };

  const handleValidateAudit = () => {
    setIsValidating(true);
    
    // Process all adjustments
    auditData.forEach(item => {
      if (item.discrepancy !== 0) {
        // Sync both theoretical and physical stock to the new count
        updateProduct(item.id, { 
          stock: item.count,
          physicalStock: item.count 
        });
      }
    });

    message.success('Inventaire validé ! Les stocks ont été ajustés.');
    setCounts({}); // Reset local counts
    setIsValidating(false);
  };

  const handleExportExcel = async () => {
    // Dynamically import exceljs to avoid blocking initial load and handle Vite build
    const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventaire');

    // Define columns based on user request
    worksheet.columns = [
      { header: 'CATEGOR', key: 'category', width: 15 },
      { header: 'DESCRIPTION', key: 'name', width: 40 },
      { header: 'STOCK A JOUR', key: 'stock', width: 18 },
      { header: 'VENTE', key: 'vente', width: 15 },
      { header: 'INVENTAIRE', key: 'inventaire', width: 15 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      
      // Yellow background for DESCRIPTION, STOCK A JOUR, VENTE, INVENTAIRE
      if (colNumber > 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Yellow
        };
      }
    });

    // Add auto filters
    worksheet.autoFilter = {
      from: 'A1',
      to: 'E1',
    };

    // Add data rows
    auditData.forEach(item => {
      const row = worksheet.addRow({
        category: item.category,
        name: item.name,
        stock: item.stock,
        vente: '',
        inventaire: item.count !== undefined ? item.count : ''
      });

      row.eachCell((cell, colNumber) => {
        // Border for all cells
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Custom alignments and backgrounds
        if (colNumber === 2) {
          cell.alignment = { horizontal: 'center' };
        }
        if (colNumber === 3) {
          cell.alignment = { horizontal: 'center' };
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
        }
        if (colNumber === 4 || colNumber === 5) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
        }
      });
    });

    // Generate blob and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `Inventaire_${currentStore?.name || 'Magasin'}_${new Date().toLocaleDateString()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    { 
      key: 'category', 
      title: 'Catégorie', 
      render: (val) => <Tag color="blue">{val}</Tag>,
      sorter: (a, b) => a.category.localeCompare(b.category)
    },
    { 
      key: 'name', 
      title: 'Article', 
      render: (val) => <span className="font-bold text-text-heading">{val}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    { 
      key: 'stock', 
      title: 'Stock Système', 
      render: (val) => (
        <div className="flex flex-col">
          <span className="font-black text-text-muted">{val}</span>
          <span className="text-[0.6rem] uppercase font-bold opacity-50">Théorique</span>
        </div>
      )
    },
    { 
      key: 'count', 
      title: 'Comptage Réel', 
      render: (_, row) => (
        <InputNumber 
          min={0} 
          value={row.count} 
          onChange={(val) => handleCountChange(row.id, val)}
          className="w-24 font-black text-primary border-primary/30"
        />
      )
    },
    { 
      key: 'discrepancy', 
      title: 'Écart', 
      render: (val) => {
        if (val === 0) return <Tag color="success">OK (0)</Tag>;
        if (val < 0) return <Tag color="error">Perte ({val})</Tag>;
        return <Tag color="warning">Surplus (+{val})</Tag>;
      }
    }
  ];

  const totalDiscrepancies = auditData.filter(d => d.discrepancy !== 0).length;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-3xl p-8 shadow-xl no-print">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-heading tracking-tight">Inventaire Physique & Audit</h2>
              <p className="text-[0.7rem] text-text-muted font-black uppercase tracking-widest">
                Magasin Actuel : <span className="text-primary">{currentStore?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
                icon={<Download size={16} />} 
                onClick={handleExportExcel}
                className="h-11 rounded-xl font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20!"
            >
                Excel
            </Button>
            <Button 
                icon={<Printer size={16} />} 
                onClick={handlePrint}
                className="h-11 rounded-xl font-bold"
            >
                Imprimer PDF
            </Button>
            <Button 
                icon={<RefreshCcw size={16} />} 
                onClick={() => setCounts({})}
                className="h-11 rounded-xl font-bold"
            >
                Réinitialiser
            </Button>
            <Popconfirm
                title="Valider l'inventaire ?"
                description="Cela mettra à jour les stocks du système pour correspondre à votre comptage réel."
                onConfirm={handleValidateAudit}
            >
                <Button 
                    type="primary" 
                    size="large" 
                    icon={<CheckCircle size={18} />}
                    disabled={totalDiscrepancies === 0}
                    className="h-11 px-8 rounded-xl font-bold uppercase tracking-widest"
                >
                    Valider le comptage
                </Button>
            </Popconfirm>
          </div>
        </div>

        {totalDiscrepancies > 0 && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-4">
            <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-500">Attention : Écarts détectés</p>
              <p className="text-[0.7rem] text-text-muted">
                Vous avez identifié des différences sur {totalDiscrepancies} articles. En validant, le système sera ajusté.
              </p>
            </div>
          </div>
        )}

        <div className="bg-bg-secondary rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden no-print">
          <DataTable 
            columns={columns} 
            data={auditData} 
            emptyIcon={Package}
            emptyTitle="Aucun produit"
            emptyDescription="Ajoutez des produits au catalogue pour commencer l'inventaire."
          />
        </div>
      </div>

      {/* Print Template */}
      <div className="print-only hidden p-10 bg-white text-black">
        <style>
          {`
            @media print {
              aside, header, footer { display: none !important; }
              main { margin: 0 !important; padding: 0 !important; }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              body { background: white !important; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #000; padding: 12px; text-align: left; }
              th { background-color: #f8f9fa !important; -webkit-print-color-adjust: exact; }
              .header { text-align: center; margin-bottom: 30px; }
            }
          `}
        </style>
        <div className="header">
          <h1 className="text-3xl font-black">FICHE D'INVENTAIRE PHYSIQUE</h1>
          <p className="text-xl">{currentStore?.name}</p>
          <p className="text-sm text-gray-500">Date : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Article</th>
              <th>Théorique</th>
              <th>Physique</th>
              <th style={{ width: '120px' }}></th> {/* Empty column for manual counting */}
              <th>Écart</th>
            </tr>
          </thead>
          <tbody>
            {auditData.map(item => (
              <tr key={item.id}>
                <td>{item.category}</td>
                <td>{item.name}</td>
                <td>{item.stock}</td>
                <td>{item.count}</td>
                <td></td> {/* Empty cell for writing */}
                <td>{item.discrepancy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PhysicalInventory;
