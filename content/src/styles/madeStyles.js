import { makeStyles } from '@material-ui/styles'

export const useDialogStyles = makeStyles({
  root: {
    zIndex: '2147483646 !important',
  },
  paper: {
    maxWidth: '500px',
  },
})
export const useDialogActionsStyles = makeStyles({
  root: {
    flexDirection: 'row !important',
  },
})
export const useToastStyles = makeStyles({
  root: {
    position: 'fixed !important',
  },
})
export const useAlertStyles = makeStyles({
  root: {
    display: 'flex !important',
    flexDirection: 'row !important',
    padding: '6px 16px !important',
    fontSize: '0.875rem !important',
    fontWeight: '400 !important',
    lineHeight: '1.43 !important',
  },
  icon: {
    display: 'flex !important',
    padding: '4px 0 !important',
    fontSize: '18px !important',
    marginRight: '12px !important',
    '& *': {
      fontSize: '18px !important',
    },
  },
  message: {
    padding: '4px 0 !important',
    fontSize: '14px !important',
  },
})
