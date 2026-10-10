import { Button, type ButtonProps } from "@mui/material";
import Spinner from "./Spinner";

type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
};

export default function LoadingButton({
  loading = false,
  disabled,
  children,
  startIcon,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      startIcon={
        loading ? <Spinner size={18} color="inherit" aria-hidden /> : startIcon
      }
      {...props}
    >
      {children}
    </Button>
  );
}
