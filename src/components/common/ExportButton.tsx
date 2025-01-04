import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  TableChart as TableChartIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { exportToExcel, exportToCSV } from '../../services/exportService';

interface ExportButtonProps {
  data: any[];
  fileName: string;
  tooltipTitle?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  fileName,
  tooltipTitle = "Exporter les données"
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format: 'excel' | 'csv') => {
    if (format === 'excel') {
      exportToExcel(data, fileName);
    } else {
      exportToCSV(data, fileName);
    }
    handleClose();
  };

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FileDownloadIcon />}
          onClick={handleClick}
          sx={{
            backgroundColor: '#4051B5',
            '&:hover': {
              backgroundColor: '#303F9F'
            }
          }}
        >
          Exporter
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon>
            <TableChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excel (.xlsx)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>CSV (.csv)</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;
