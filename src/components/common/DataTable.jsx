import React from 'react';
import { Table } from 'antd';
import EmptyState from './EmptyState';

const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  rowKey = 'id',
  renderExpandedRow,
  expandedRowId,
  className = '',
  ...props
}) => {
  const antColumns = columns.map(col => ({
    title: col.title,
    dataIndex: col.key,
    key: col.key,
    width: col.width,
    align: col.align || 'left',
    render: col.render,
    ...col.antColumn,
  }));

  return (
    <div className="overflow-x-auto custom-scrollbar -mx-px">
      <Table
        columns={antColumns}
        dataSource={data}
        rowKey={rowKey}
        pagination={false}
        className={className}
        scroll={{ x: 'max-content' }}
        onRow={(record, rowIndex) => ({
          onClick: () => onRowClick?.(record, rowIndex),
          className: onRowClick ? 'clickable-row' : '',
        })}
        expandable={renderExpandedRow ? {
          expandedRowRender: renderExpandedRow,
          rowExpandable: () => true,
          expandedRowKeys: expandedRowId ? [expandedRowId] : [],
        } : undefined}
        locale={{
          emptyText: (
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              size="sm"
            />
          )
        }}
        {...props}
      />
    </div>
  );
};

export default DataTable;
