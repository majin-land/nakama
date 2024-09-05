import { Button, IconButton } from '@mui/material'
import MUIDialog, { DialogProps as MuiDialogProps } from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { Breakpoint } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import React, { ReactEventHandler } from 'react'

export interface DialogProps extends MuiDialogProps {
  open: boolean
  size?: Breakpoint
  onClose?: () => void
  title?: string
  fullscreen?: boolean
  children?: React.ReactNode
  fullWidth?: boolean
  fullHeight?: boolean
  onAccept?: ReactEventHandler<HTMLButtonElement>
  acceptLabel?: string
  disableAccept?: boolean
  loadingButton?: boolean
  cancelButton?: boolean
  cancelButtonLabel?: string
  autoComplete?: string
  justifyDialogAction?: string
  footer?: React.ReactNode
}

const styles = {
  iconButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
}

export default function Dialog({
  open,
  size,
  onClose,
  title,
  fullscreen,
  children,
  fullWidth,
  onAccept,
  acceptLabel,
  disableAccept,
  loadingButton,
  cancelButton,
  cancelButtonLabel,
  footer,
  fullHeight,
  justifyDialogAction = 'flex-end',
  ...props
}: DialogProps) {
  const hasActions = footer || cancelButton || onAccept

  return (
    <MUIDialog
      open={open}
      maxWidth={size}
      fullWidth={fullWidth}
      fullScreen={fullscreen}
      component="form"
      {...(fullHeight && {
        PaperProps: {
          sx: {
            height: '100%',
          },
        },
      })}
      {...props}
    >
      {title && onClose && (
        <DialogTitle>
          {title}
          {onClose && (
            <IconButton
              onClick={onClose}
              sx={styles.iconButton}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent sx={{ padding: '20px 24px !important' }}>{children}</DialogContent>

      {hasActions && (
        <DialogActions
          sx={{
            justifyContent: justifyDialogAction,
          }}
        >
          {footer}
          {onAccept && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              disabled={disableAccept}
              onClick={(event) => {
                event.preventDefault()
                onAccept(event)
              }}
              type="submit"
            >
              {acceptLabel}
            </Button>
          )}
        </DialogActions>
      )}
    </MUIDialog>
  )
}
