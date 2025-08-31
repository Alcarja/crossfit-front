import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Copy, ExternalLink } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function StripeQRDialog({
  open,
  onOpenChange,
  checkoutUrl,
  orderId,
  onCopied,
}: any) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(checkoutUrl);
      onCopied?.();
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Pagar con tarjeta</DialogTitle>
          <DialogDescription>
            Escanea el QR para completar el pago
            {orderId ? ` de la orden #${orderId}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-lg border bg-background p-4">
            <QRCodeSVG
              value={checkoutUrl || "about:blank"}
              size={220}
              includeMargin
            />
          </div>
          <div className="w-full break-all rounded-md bg-muted/50 p-2 text-xs">
            {checkoutUrl}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button className="w-auto" variant="outline" onClick={copy}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar enlace
          </Button>
          <Button
            className="w-auto"
            onClick={() => window.open(checkoutUrl, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir en pestaña nueva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
