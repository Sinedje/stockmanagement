import React from 'react';
import { Table as AntTable } from 'antd';
import EmptyState from '../common/EmptyState';

export const DEFAULT_PAGE_SIZE = 20;

/**
 * Tableau unique de l'application (Ant Design).
 *
 * - pagine à 20 lignes dès que la liste est plus longue ;
 * - `columns` accepte la forme courte `{ key, title, render, width, align }` ;
 * - l'état vide passe par `EmptyState`, comme partout ailleurs.
 */
const Table = ({
  columns = [],
  data = [],
  onRowClick,
  rowKey = 'id',
  emptyIcon,
  emptyTitle,
  emptyDescription,
  pageSize = DEFAULT_PAGE_SIZE,
  paginated = true,
  size = 'small',
  className = '',
  ...rest
}) => (
  <div className="overflow-x-auto custom-scrollbar">
    <AntTable
      columns={columns.map(c => ({
        title: c.title,
        dataIndex: c.key,
        key: c.key,
        width: c.width,
        align: c.align || 'left',
        render: c.render,
        ...c.antColumn,
      }))}
      dataSource={data}
      rowKey={rowKey}
      size={size}
      className={className}
      scroll={{ x: 'max-content' }}
      pagination={paginated && data.length > pageSize
        ? { pageSize, showSizeChanger: false, size: 'small', hideOnSinglePage: true }
        : false}
      onRow={(record, index) => ({
        onClick: () => onRowClick?.(record, index),
        className: onRowClick ? 'clickable-row' : '',
      })}
      locale={{
        emptyText: <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />,
      }}
      {...rest}
    />
  </div>
);

export default Table;
