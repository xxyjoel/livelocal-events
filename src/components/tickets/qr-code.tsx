import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export async function QRCodeDisplay({ value, size = 256 }: QRCodeDisplayProps) {
  const dataUrl = await QRCode.toDataURL(value, {
    width: size,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  return (
    <img
      src={dataUrl}
      alt="Ticket QR Code"
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}
