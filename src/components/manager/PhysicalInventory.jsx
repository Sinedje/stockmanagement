import { useT } from '../../i18n/I18nContext';
import { Toolbar, Panel, Table, Button } from '../ui';
import { useOnlineStatus } from '../../offline/useOnlineStatus';
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProducts, useStores } from '../../hooks';
import { inventoryService } from '../../services/inventoryService';
import { AuditOutlined, CheckCircleOutlined, DownloadOutlined, HistoryOutlined, InboxOutlined, PrinterOutlined, ReloadOutlined, ShopOutlined, WarningOutlined } from '@ant-design/icons';
import { message, Popconfirm, Tag, InputNumber } from 'antd';

const PhysicalInventory = () => {
  // La validation réécrit les stocks du serveur à partir d'un état qui ne peut
  // pas être vérifié hors connexion : on la neutralise plutôt que de produire
  // un ajustement fondé sur des chiffres périmés.
  const { online } = useOnlineStatus();
  const t = useT();
  const { currentUser } = useAuth();
  const { products, refreshProducts } = useProducts();
  const { stores, activeStoreId } = useStores();
  const [counts, setCounts] = useState({}); // { productId: physicalCount }
  const [isValidating, setIsValidating] = useState(false);
  const [isExportingHistory, setIsExportingHistory] = useState(false);

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

  const handleValidateAudit = async () => {
    setIsValidating(true);
    try {
      const adjustmentsToLog = [];

      // Process all adjustments
      for (const item of auditData) {
        if (item.discrepancy !== 0) {
          // Log it
          adjustmentsToLog.push({
            productId: item.id,
            storeId: currentStore?.id,
            userId: currentUser?.id,
            userName: currentUser?.name || 'Inconnu',
            oldStock: item.stock,
            newStock: item.count,
            discrepancy: item.discrepancy
          });

          // The backend logBulkAdjustments now handles both physicalStock and theoretical stock correctly
        }
      }

      if (adjustmentsToLog.length > 0) {
        await inventoryService.logBulkAdjustments(adjustmentsToLog);
        if (refreshProducts) {
          await refreshProducts();
        }
      }

      message.success('Inventaire validé ! Les stocks ont été ajustés.');
      setCounts({}); // Reset local counts
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la validation de l\'inventaire');
    } finally {
      setIsValidating(false);
    }
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
      { header: t('s.stock_a_jour'), key: 'stock', width: 18 },
      { header: t('s.vente'), key: 'vente', width: 15 },
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

  const handleExportGlobalHistory = async () => {
    setIsExportingHistory(true);
    try {
      const history = await inventoryService.getGlobalHistory();
      
      const ExcelJS = (await import('exceljs')).default || (await import('exceljs'));
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Historique Global');

      worksheet.columns = [
        { header: t('s.date_3'), key: 'date', width: 20 },
        { header: 'TYPE OPERATION', key: 'type', width: 25 },
        { header: t('s.reference_nom'), key: 'reference', width: 30 },
        { header: 'ARTICLE', key: 'productName', width: 35 },
        { header: 'QTE', key: 'quantity', width: 15 },
        { header: t('s.magasin_3'), key: 'store', width: 20 },
        { header: 'DETAILS', key: 'details', width: 40 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }; // Dark gray
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      worksheet.autoFilter = { from: 'A1', to: 'G1' };

      history.forEach(row => {
        const storeName = stores.find(s => String(s.id) === String(row.storeId))?.name || row.storeId;
        const newRow = worksheet.addRow({
          date: new Date(row.date).toLocaleString('fr-FR'),
          type: row.type,
          reference: row.reference,
          productName: row.productName,
          quantity: row.quantity,
          store: storeName,
          details: row.details
        });

        // Color code quantity
        const qtyCell = newRow.getCell('quantity');
        qtyCell.alignment = { horizontal: 'center' };
        qtyCell.font = { bold: true };
        if (String(row.quantity).startsWith('+')) {
          qtyCell.font = { ...qtyCell.font, color: { argb: 'FF10B981' } }; // Green
        } else if (String(row.quantity).startsWith('-')) {
          qtyCell.font = { ...qtyCell.font, color: { argb: 'FFEF4444' } }; // Red
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Historique_Transactions_${new Date().toLocaleDateString()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
      message.error('Erreur lors de la génération de l\'historique');
    } finally {
      setIsExportingHistory(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      key: 'category',
      title: t('s.categorie'),
      render: (val) => <Tag color="blue">{val}</Tag>,
      sorter: (a, b) => a.category.localeCompare(b.category)
    },
    {
      key: 'name',
      title: t('s.article'),
      render: (val) => <span className="font-bold text-text-heading">{val}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      key: 'stock',
      title: t('s.stock_systeme'),
      render: (val) => (
        <div className="flex flex-col">
          <span className="font-black text-text-muted">{val}</span>
          <span className="text-[0.6rem] uppercase font-bold opacity-50">{t('s.theorique')}</span>
        </div>
      )
    },
    {
      key: 'count',
      title: t('s.comptage_reel'),
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
      title: t('s.ecart'),
      render: (val) => {
        if (val === 0) return <Tag color="success">{t('s.ok_0')}</Tag>;
        if (val < 0) return <Tag color="error">Perte ({val})</Tag>;
        return <Tag color="warning">Surplus (+{val})</Tag>;
      }
    }
  ];

  const totalDiscrepancies = auditData.filter(d => d.discrepancy !== 0).length;

  return (
    <div className="animate-fade-in space-y-4">
      {/* Commandes — carte distincte du tableau */}
      <Toolbar
        className="no-print"
        right={
          <Popconfirm
            title={t('s.valider_l_inventaire')}
            description={t('s.cela_mettra_a_jour_les_stocks_du_systeme_pou')}
            onConfirm={handleValidateAudit}
          >
            <Button type="primary" loading={isValidating} icon={!isValidating && <CheckCircleOutlined />} disabled={totalDiscrepancies === 0 || !online} >
              {t('s.valider_le_comptage')}
            </Button>
          </Popconfirm>
        }
      >
        <span className="flex items-center gap-1.5 text-[0.76rem] text-text-secondary pr-1">
          <AuditOutlined className="text-primary" />
          {currentStore?.name}
        </span>
        <Button icon={<HistoryOutlined />} onClick={handleExportGlobalHistory} loading={isExportingHistory}>
          Historique (Excel)
        </Button>
        <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>{t('s.inventaire_excel')}</Button>
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>{t('s.imprimer')}</Button>
        <Button icon={<ReloadOutlined />} onClick={() => setCounts({})}>{t('s.reinitialiser')}</Button>
      </Toolbar>

      {totalDiscrepancies > 0 && (
        <div className="no-print px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-2.5">
          <WarningOutlined className="text-orange-500 shrink-0" />
          <p className="text-[0.78rem] text-orange-700 dark:text-orange-400">
            <strong>{totalDiscrepancies} écart{totalDiscrepancies > 1 ? 's' : ''}</strong> détecté{totalDiscrepancies > 1 ? 's' : ''} — la validation ajustera les stocks.
          </p>
        </div>
      )}

      {/* Données */}
      <Panel noPadding className="no-print">
        <Table
          columns={columns}
          data={auditData}
          emptyIcon={InboxOutlined}
          emptyTitle={t('s.aucun_produit')}
          emptyDescription={t('s.ajoutez_des_produits_au_catalogue_pour_comme')}
        />
      </Panel>

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
          <h1 className="text-xl font-bold">{t('s.fiche_d_inventaire_physique')}</h1>
          <p className="text-xl">{currentStore?.name}</p>
          <p className="text-sm text-gray-500">Date : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('s.categorie')}</th>
              <th>{t('s.article')}</th>
              <th>{t('s.theorique')}</th>
              <th>{t('s.physique')}</th>
              {/* Colonne laissée vide pour le comptage manuel sur papier */}
              <th style={{ width: '120px' }}></th>
              <th>{t('s.ecart')}</th>
            </tr>
          </thead>
          <tbody>
            {auditData.map(item => (
              <tr key={item.id}>
                <td>{item.category}</td>
                <td>{item.name}</td>
                <td>{item.stock}</td>
                <td>{item.count}</td>
                {/* Cellule laissée vide pour l'écriture manuelle */}
                <td></td>
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
